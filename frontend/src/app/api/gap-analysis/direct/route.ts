import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * This endpoint directly queries the baseline skill matrix and ideal skill matrix
 * using SQL without trying to access columns that might not exist in the schema.
 * It's a fallback method for when the other methods fail due to schema changes.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the baseline ID from query params
    const url = new URL(request.url);
    const baseline_id = url.searchParams.get('baseline_id');
    
    console.log(`GET /api/gap-analysis/direct - Requested baseline ID: ${baseline_id}`);
    
    if (!baseline_id) {
      console.error('No baseline_id provided in request params');
      return NextResponse.json(
        { error: 'Baseline skill matrix ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase admin client with service key for direct DB access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    try {
      // Execute a direct SQL query to avoid column existence issues
      const { data: baselineResults, error: sqlError } = await supabaseAdmin.rpc(
        'get_baseline_data', 
        { p_baseline_id: baseline_id }
      );
      
      // If the stored procedure doesn't exist, fall back to direct SQL
      if (sqlError && sqlError.message.includes('function "get_baseline_data" does not exist')) {
        console.log('Stored procedure not found, using direct SQL query');
        
        // Execute raw SQL to get only the needed columns
        const { data: directData, error: directError } = await supabaseAdmin.from('baseline_skill_matrix')
          .select('id, status, skill_matrix, ideal_skill_matrix_id, created_at, analysis_started_at, analysis_completed_at')
          .eq('id', baseline_id)
          .single();
          
        if (directError) {
          console.error('Error executing direct query:', directError);
          return NextResponse.json(
            { error: `Database error: ${directError.message}` },
            { status: 500 }
          );
        }
        
        if (!directData) {
          return NextResponse.json(
            { error: 'Baseline not found' },
            { status: 404 }
          );
        }
        
        // Now get the ideal matrix
        const { data: idealData, error: idealError } = await supabaseAdmin.from('ideal_skill_matrix')
          .select('skill_matrix')
          .eq('id', directData.ideal_skill_matrix_id)
          .single();
          
        if (idealError) {
          console.error('Error fetching ideal matrix:', idealError);
        }
        
        // Return the data without any potentially missing columns
        return NextResponse.json({
          id: directData.id,
          status: directData.status,
          baseline_skill_matrix: directData.skill_matrix,
          ideal_skill_matrix: idealData?.skill_matrix || null,
          created_at: directData.created_at,
          analysis_started_at: directData.analysis_started_at,
          analysis_completed_at: directData.analysis_completed_at,
          gap_analysis_dashboard: null // We don't try to access this column directly
        });
      }
      
      // If the stored procedure exists and worked
      if (baselineResults) {
        return NextResponse.json(baselineResults);
      }
      
      // If we get here, something else went wrong
      console.error('Unexpected error:', sqlError);
      return NextResponse.json(
        { error: `Database error: ${sqlError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    } catch (err) {
      console.error('Error executing query:', err);
      return NextResponse.json(
        { error: `Database error: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in direct access:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 
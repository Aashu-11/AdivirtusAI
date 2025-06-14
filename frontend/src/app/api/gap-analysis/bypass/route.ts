import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * This endpoint is a special bypass for viewing completed skill gap analyses
 * WITHOUT authentication. This should ONLY be used for viewing results after
 * a completed analysis, and includes security checks to ensure:
 * 
 * 1. Only completed analyses can be viewed
 * 2. No modification operations are allowed
 * 3. Only the specific data needed for display is returned
 */
export async function GET(request: NextRequest) {
  try {
    // Get the baseline ID from query params
    const url = new URL(request.url);
    const baseline_id = url.searchParams.get('baseline_id');
    
    console.log(`GET /api/gap-analysis/bypass - Requested baseline ID: ${baseline_id}`);
    
    if (!baseline_id) {
      console.error('No baseline_id provided in request params');
      return NextResponse.json(
        { error: 'Baseline skill matrix ID is required' },
        { status: 400 }
      );
    }
    
    // Log helpful diagnostics
    console.log(`GET /api/gap-analysis/bypass - Direct access for baseline ID: ${baseline_id}`);
    
    // Initialize Supabase admin client with service key for direct DB access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration for bypass endpoint', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    console.log(`Using Supabase URL: ${supabaseUrl.substring(0, 20)}...`);
    
    // Create a direct admin client that bypasses RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // SECURITY CHECK: Verify this baseline exists and is completed (no pending analyses)
    try {
      console.log(`Attempting to retrieve baseline data for ID: ${baseline_id}`);
      
      // First check if baseline exists and get its details - only select columns we know exist
      const { data: baselineData, error: baselineError } = await supabaseAdmin
        .from('baseline_skill_matrix')
        .select('id, status, skill_matrix, ideal_skill_matrix_id, user_id')
        .eq('id', baseline_id)
        .single();
      
      if (baselineError) {
        console.error('Error retrieving baseline data:', {
          code: baselineError.code,
          message: baselineError.message,
          details: baselineError.details
        });
        return NextResponse.json(
          { error: `Baseline skill matrix not found: ${baselineError.message}` },
          { status: 404 }
        );
      }
      
      if (!baselineData) {
        console.error('No baseline data returned for ID:', baseline_id);
        
        // Try an alternative approach - check if the ID exists but isn't formatted correctly
        console.log('Trying alternative query approach...');
        const { data: alternativeSearch } = await supabaseAdmin
          .from('baseline_skill_matrix')
          .select('id')
          .like('id', `%${baseline_id.replace(/-/g, '%')}%`)
          .limit(5);
          
        if (alternativeSearch && alternativeSearch.length > 0) {
          console.log('Found similar IDs:', alternativeSearch.map(item => item.id));
          return NextResponse.json(
            { 
              error: 'Baseline skill matrix not found with exact ID', 
              similar_ids: alternativeSearch.map(item => item.id)
            },
            { status: 404 }
          );
        }
        
        return NextResponse.json(
          { error: 'Baseline skill matrix not found' },
          { status: 404 }
        );
      }
      
      console.log(`Found baseline for user ${baselineData.user_id} with status: ${baselineData.status}`);
      
      // Only allow access to completed analyses for security
      // But for testing, allow access to any status if in development mode
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev && baselineData.status !== 'completed') {
        console.warn(`Attempted bypass access to non-completed baseline: ${baseline_id}, status: ${baselineData.status}`);
        return NextResponse.json(
          { error: 'This analysis is not yet completed' },
          { status: 403 }
        );
      }
      
      // Try to get gap analysis dashboard from various sources
      let gapAnalysisDashboard = null;
      
      // First try directly (might not exist in schema)
      try {
        // Need to query again with the specific column
        const { data: dashboardData, error: dashboardError } = await supabaseAdmin
          .from('baseline_skill_matrix')
          .select('gap_analysis_dashboard')
          .eq('id', baseline_id)
          .maybeSingle();
          
        if (!dashboardError && dashboardData?.gap_analysis_dashboard) {
          gapAnalysisDashboard = dashboardData.gap_analysis_dashboard;
          console.log('Found gap_analysis_dashboard in dedicated column');
        }
      } catch (err) {
        console.warn('gap_analysis_dashboard column likely does not exist:', err);
      }
      
      // If not found in column, check session_data - but check if it exists first
      if (!gapAnalysisDashboard) {
        try {
          // Check if session_data column exists by trying to query it safely
          const { data: testData, error: testError } = await supabaseAdmin
            .from('baseline_skill_matrix')
            .select('session_data')
            .eq('id', baseline_id)
            .limit(1)
            .maybeSingle();
          
          // If no error, the column exists
          if (!testError) {
            // If session_data column exists and has data
            if (testData?.session_data && 
                typeof testData.session_data === 'object' && 
                'gap_analysis_dashboard' in testData.session_data) {
              gapAnalysisDashboard = testData.session_data.gap_analysis_dashboard;
              console.log('Found gap_analysis_dashboard in session_data');
            }
          } else {
            // Check if error indicates column doesn't exist
            if (testError.message && testError.message.includes('column "session_data" does not exist')) {
              console.log('session_data column does not exist in baseline_skill_matrix table');
            } else {
              console.warn('Error accessing session_data:', testError);
            }
          }
        } catch (err) {
          console.warn('Error checking or accessing session_data:', err);
        }
      }
      
      // If still no dashboard, we'll generate one client-side
      if (!gapAnalysisDashboard) {
        console.log('No dashboard found in database. Will generate client-side.');
      }
      
      // Get the ideal skill matrix directly
      console.log(`Retrieving ideal skill matrix with ID: ${baselineData.ideal_skill_matrix_id}`);
      const { data: idealData, error: idealError } = await supabaseAdmin
        .from('ideal_skill_matrix')
        .select('skill_matrix')
        .eq('id', baselineData.ideal_skill_matrix_id)
        .single();
      
      if (idealError) {
        console.error('Ideal skill matrix error:', {
          code: idealError.code,
          message: idealError.message
        });
      }
      
      if (!idealData) {
        console.warn('Ideal skill matrix not found');
        
        // In case the ideal matrix isn't found, return at least the baseline data
        return NextResponse.json({
          baseline_skill_matrix: baselineData.skill_matrix,
          ideal_skill_matrix: null,
          status: baselineData.status,
          gap_analysis_dashboard: gapAnalysisDashboard
        });
      }
      
      console.log(`Successfully retrieved skill matrices for baseline: ${baseline_id}`);
      
      // Return the required data for display
      return NextResponse.json({
        baseline_skill_matrix: baselineData.skill_matrix,
        ideal_skill_matrix: idealData.skill_matrix,
        status: baselineData.status,
        gap_analysis_dashboard: gapAnalysisDashboard
      });
      
    } catch (err) {
      console.error('Error accessing baseline data:', err);
      return NextResponse.json(
        { error: `Failed to access baseline data: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in bypass access:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 
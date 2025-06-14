import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const baselineId = params.id
    
    if (!baselineId) {
      return NextResponse.json(
        { error: 'Baseline ID is required' },
        { status: 400 }
      )
    }
    
    console.log(`Fetching gap analysis for baseline ID: ${baselineId}`)
    
    // Use service role for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    })
    
    // Get the baseline skill matrix
    const { data: baselineData, error: baselineError } = await supabase
      .from('baseline_skill_matrix')
      .select('id, status, skill_matrix, ideal_skill_matrix_id, user_id, created_at, analysis_started_at, analysis_completed_at, gap_analysis_dashboard')
      .eq('id', baselineId)
      .single()
    
    if (baselineError) {
      console.error(`Error fetching baseline matrix: ${baselineError.message}`)
      return NextResponse.json(
        { error: `Baseline not found: ${baselineError.message}` },
        { status: 404 }
      )
    }
    
    if (!baselineData) {
      return NextResponse.json(
        { error: 'Baseline skill matrix not found' },
        { status: 404 }
      )
    }
    
    // Get the ideal skill matrix
    const { data: idealData, error: idealError } = await supabase
      .from('ideal_skill_matrix')
      .select('*')
      .eq('id', baselineData.ideal_skill_matrix_id)
      .single()
    
    if (idealError) {
      console.error(`Error fetching ideal matrix: ${idealError.message}`)
      return NextResponse.json(
        { error: `Error retrieving ideal skill matrix: ${idealError.message}` },
        { status: 500 }
      )
    }
    
    // Return the data
    console.log(`Successfully retrieved data for baseline ${baselineId}`)
    return NextResponse.json({
      id: baselineData.id,
      status: baselineData.status,
      baseline_skill_matrix: baselineData.skill_matrix,
      ideal_skill_matrix: idealData?.skill_matrix,
      created_at: baselineData.created_at,
      analysis_started_at: baselineData.analysis_started_at,
      analysis_completed_at: baselineData.analysis_completed_at,
      gap_analysis_dashboard: baselineData.gap_analysis_dashboard,
      user_id: baselineData.user_id
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
    
  } catch (error) {
    console.error('Error in gap analysis API:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve skill gap analysis data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 
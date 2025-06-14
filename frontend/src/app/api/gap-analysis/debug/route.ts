import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameter or use fallback
    const url = new URL(request.url)
    const userIdFromQuery = url.searchParams.get('userId')
    const userIdForTesting = userIdFromQuery || '6e17a216-7639-4e55-8eb5-dce568de8a5f'
    
    console.log(`Debugging: Checking baseline skill matrix for user ID: ${userIdForTesting}`)
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    // Use service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    })
    
    // Search for all baselines for this user - no filters for debugging
    const { data: allBaselines, error: baselineError } = await supabase
      .from('baseline_skill_matrix')
      .select('id, status, created_at, updated_at')
      .eq('user_id', userIdForTesting)
      .order('created_at', { ascending: false })
    
    if (baselineError) {
      console.error('Error checking baselines:', baselineError)
      return NextResponse.json(
        { error: 'Database query failed', details: baselineError },
        { status: 500 }
      )
    }
    
    // Also check for completed baselines
    const { data: completedBaselines, error: completedError } = await supabase
      .from('baseline_skill_matrix')
      .select('id, status, created_at, updated_at')
      .eq('user_id', userIdForTesting)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
    
    // Check SCT initial data too
    const { data: sctData, error: sctError } = await supabase
      .from('sct_initial')
      .select('id, questions, answers, created_at')
      .eq('user_id', userIdForTesting)
      .single()

    return NextResponse.json({
      userId: userIdForTesting,
      allBaselines: allBaselines || [],
      completedBaselines: completedBaselines || [], 
      recommendedId: completedBaselines && completedBaselines.length > 0 ? completedBaselines[0].id : null,
      baseline: completedBaselines && completedBaselines.length > 0 ? completedBaselines[0] : null,
      sctInitial: sctData || null,
      sctError: sctError || null,
      hasQuestions: !!(sctData?.questions),
      hasAnswers: !!(sctData?.answers),
    })
    
  } catch (error) {
    console.error('Error debugging baseline:', error)
    return NextResponse.json(
      { error: 'Failed to debug baseline skill matrix', details: error },
      { status: 500 }
    )
  }
} 
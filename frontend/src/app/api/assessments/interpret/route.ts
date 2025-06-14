import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * POST handler for triggering the assessment interpretation
 * This will call the backend API to initiate interpretation of assessment results
 */
export async function POST(request: NextRequest) {
  console.log('Interpret assessment endpoint called')
  
  try {
    const body = await request.json()
    const { userId, assessmentId } = body
    
    console.log('Interpreting assessment for user:', userId, 'assessment:', assessmentId)

    if (!userId) {
      console.log('No user ID provided')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // If assessmentId is not provided, get the latest assessment for this user
    let targetAssessmentId = assessmentId
    if (!targetAssessmentId) {
      console.log('No assessment ID provided, fetching latest assessment')
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('lsa_assessment')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (assessmentError) {
        console.log('Error fetching assessment:', assessmentError)
        return NextResponse.json(
          { error: 'No assessment found for this user' },
          { status: 404 }
        )
      }

      targetAssessmentId = assessmentData.id
      console.log('Found assessment ID:', targetAssessmentId)
    }

    // Instead of calling the backend API directly, use Supabase to create a pending result 
    // and rely on the background interpreter listener to process it
    
    try {
      // Create initial pending result
      const { data: resultData, error: resultError } = await supabase
        .from('lsa_result')
        .insert([{
          user_id: userId,
          assessment_id: targetAssessmentId,
          interpreted_result: {
            status: 'pending',
            timestamp: new Date().toISOString()
          }
        }])
        .select()
        
      if (resultError) {
        console.log('Error creating pending result:', resultError)
        
        // Check if the error is due to a duplicate (result already exists)
        if (resultError.code === '23505') { // Postgres unique violation
          console.log('Result already exists, proceeding with success flow')
        } else {
          throw resultError
        }
      } else {
        console.log('Created pending result:', resultData)
      }
      
    } catch (error) {
      console.error('Error creating pending result:', error)
      // Non-fatal error, continue with success flow
    }

    return NextResponse.json({ 
      success: true,
      message: 'Interpretation process triggered',
      assessmentId: targetAssessmentId
    })
  } catch (error) {
    console.error('Error in interpretation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET handler for checking the status of assessment interpretation
 */
export async function GET(request: NextRequest) {
  console.log('Check interpretation status endpoint called')
  
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    console.log('Checking interpretation status for user:', userId)

    if (!userId) {
      console.log('No user ID provided')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if there is a result in the lsa_result table
    const { data: resultData, error: resultError } = await supabase
      .from('lsa_result')
      .select('id, interpreted_result, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (resultError) {
      console.log('Error fetching interpretation result:', resultError)
      if (resultError.code === 'PGRST116') {
        return NextResponse.json({ 
          status: 'pending',
          message: 'No interpretation results found'
        })
      }
      return NextResponse.json(
        { error: 'Failed to check interpretation status' },
        { status: 500 }
      )
    }

    console.log('Interpretation result found:', resultData.id)
    const interpretationStatus = resultData.interpreted_result?.status || 'pending'

    return NextResponse.json({ 
      status: interpretationStatus,
      resultId: resultData.id,
      createdAt: resultData.created_at,
      hasResults: interpretationStatus === 'completed'
    })
  } catch (error) {
    console.error('Error in check interpretation status endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
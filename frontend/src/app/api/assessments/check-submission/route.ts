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

export async function GET(request: NextRequest) {
  console.log('Check submission endpoint called')
  
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    console.log('User ID:', userId)

    if (!userId) {
      console.log('No user ID provided')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check for assessment submission
    console.log('Checking assessment submission for user:', userId)
    const { data, error } = await supabase
      .from('tsa_assessment')
      .select('id, created_at')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.log('Supabase error:', error)
      // If no record found, return hasSubmitted: false
      if (error.code === 'PGRST116') {
        console.log('No submission found for user')
        return NextResponse.json({ hasSubmitted: false })
      }
      return NextResponse.json(
        { error: 'Failed to check assessment status' },
        { status: 500 }
      )
    }

    console.log('Submission found:', data)
    // If we have data, the user has submitted
    return NextResponse.json({ 
      hasSubmitted: true,
      submittedAt: data.created_at
    })
  } catch (error) {
    console.error('Error in check-submission endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = 'https://api.adivirtus.ai'

export async function POST(request: NextRequest) {
  try {
    // Parse request data
    const data = await request.json()
    const userId = data.userId
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }
    
    console.log(`Creating baseline for user: ${userId}`)
    
    // Initialize Supabase client with awaited cookies for Next.js 15 compatibility
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Try to get the auth token from Authorization header first
    const authHeader = request.headers.get('Authorization')
    let accessToken = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7) // Remove "Bearer " prefix
      console.log(`Got access token from Authorization header: ${accessToken.substring(0, 10)}...`)
    }
    
    // Validate the token if we have one
    let user = null
    if (accessToken) {
      try {
        const { data: userData, error } = await supabase.auth.getUser(accessToken)
        if (!error && userData?.user) {
          user = userData.user
          console.log(`Authenticated user from token: ${user.id}`)
        } else if (error) {
          console.error('Error getting user from token:', error.message)
        }
      } catch (err) {
        console.error('Exception getting user from token:', err)
      }
    }
    
    // If no user from token, try session
    if (!user) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          accessToken = sessionData.session.access_token
          user = sessionData.session.user
          if (user) {
            console.log(`Authenticated user from session: ${user.id}`)
          }
        }
      } catch (err) {
        console.error('Error getting session:', err)
      }
    }
    
    // If still no user, return authentication error
    if (!user || !accessToken) {
      console.error('No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }
    
    // Verify the backend URL is configured, use default if not set
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL
    console.log(`Using backend URL: ${backendUrl}`)
    
    // Call the backend API to create the gap analysis
    try {
      const apiResponse = await fetch(`${backendUrl}/api/assessments/create-gap-analysis/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId })
      })
      
      if (!apiResponse.ok) {
        let errorMessage = `Backend API error: ${apiResponse.status} ${apiResponse.statusText}`
        try {
          const errorData = await apiResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch (err) {
          console.error('Failed to parse error response from backend:', err)
        }
        
        console.error(errorMessage)
        return NextResponse.json(
          { error: errorMessage },
          { 
            status: apiResponse.status,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        )
      }
      
      const responseData = await apiResponse.json()
      console.log('Gap analysis created successfully:', responseData.id)
      
      return NextResponse.json(responseData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    } catch (err) {
      console.error('Failed to call backend API:', err)
      return NextResponse.json(
        { error: 'Failed to connect to backend service' },
        { 
          status: 502,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }
  } catch (error) {
    console.error('Unhandled error in gap analysis creation:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json()
    const baseline_id = data.baseline_id
    
    if (!baseline_id) {
      return NextResponse.json(
        { error: 'Baseline skill matrix ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }
    
    console.log(`PUT /api/gap-analysis - Starting gap analysis for baseline ID: ${baseline_id}`)
    
    // Initialize Supabase client with awaited cookies for Next.js 15 compatibility
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Try to get the auth token from Authorization header first
    const authHeader = request.headers.get('Authorization')
    let accessToken = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7) // Remove "Bearer " prefix
      console.log(`Got access token from Authorization header: ${accessToken.substring(0, 10)}...`)
    }
    
    // Validate the token if we have one
    let user = null
    if (accessToken) {
      try {
        const { data: userData, error } = await supabase.auth.getUser(accessToken)
        if (!error && userData?.user) {
          user = userData.user
          console.log(`Authenticated user from token: ${user.id}`)
        } else if (error) {
          console.error('Error getting user from token:', error.message)
        }
      } catch (err) {
        console.error('Exception getting user from token:', err)
      }
    }
    
    // If no user from token, try session
    if (!user) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          accessToken = sessionData.session.access_token
          user = sessionData.session.user
          if (user) {
            console.log(`Authenticated user from session: ${user.id}`)
          }
        }
      } catch (err) {
        console.error('Error getting session:', err)
      }
    }
    
    // If still no user, return authentication error
    if (!user || !accessToken) {
      console.error('No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }
    
    // Verify the backend URL is configured, use default if not set
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL
    console.log(`Using backend URL: ${backendUrl}`)
    
    // Call the backend API to start the gap analysis
    try {
      const apiResponse = await fetch(`${backendUrl}/api/assessments/start-gap-analysis/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ baseline_id })
      })
      
      if (!apiResponse.ok) {
        let errorMessage = `Backend API error: ${apiResponse.status} ${apiResponse.statusText}`
        try {
          const errorData = await apiResponse.json()
          errorMessage = errorData.error || errorMessage
        } catch (err) {
          console.error('Failed to parse error response from backend:', err)
        }
        
        console.error(errorMessage)
        return NextResponse.json(
          { error: errorMessage },
          { 
            status: apiResponse.status,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        )
      }
      
      const responseData = await apiResponse.json()
      console.log('Gap analysis started successfully')
      
      return NextResponse.json(responseData, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    } catch (err) {
      console.error('Failed to call backend API:', err)
      return NextResponse.json(
        { error: 'Failed to connect to backend service' },
        { 
          status: 502,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }
  } catch (error) {
    console.error('Unhandled error in starting gap analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const baseline_id = searchParams.get('baseline_id')
    
    if (!baseline_id) {
      return NextResponse.json(
        { error: 'Baseline skill matrix ID is required' },
        { status: 400 }
      )
    }
    
    console.log(`GET /api/gap-analysis - Checking status for baseline ID: ${baseline_id}`)
    
  // Initialize Supabase client with awaited cookies for Next.js 15 compatibility
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Try to get the auth token from Authorization header first
    const authHeader = request.headers.get('Authorization')
    let accessToken = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7) // Remove "Bearer " prefix
      console.log(`Got access token from Authorization header: ${accessToken.substring(0, 10)}...`)
    }
    
    // Validate the token if we have one
    let userId = null
    if (accessToken) {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
        
        if (userError) {
          console.error('Error validating token:', userError.message)
        } else if (userData?.user) {
          userId = userData.user.id
          console.log(`Authenticated as user: ${userId}`)
        }
      } catch (e) {
        console.error('Exception validating token:', e)
      }
    }
    
    // If no valid token was found via header, try cookies/session
    if (!userId) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session?.user) {
          userId = sessionData.session.user.id
          console.log(`Using session user ID: ${userId}`)
        }
      } catch (e) {
        console.error('Error getting session:', e)
      }
    }
    
    if (!userId) {
      console.error('No authenticated user found - this may be a session issue')
      console.log('Baseline ID requested:', baseline_id)
      
      return NextResponse.json(
        { 
          error: 'Authentication session expired. Please refresh the page and try again.',
          baseline_id: baseline_id,
          suggestion: 'Try refreshing the page or logging out and back in'
        },
      { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
      )
    }
    
    try {
      // Verify that the database query works by first checking for any baselines
      const { data: anyBaselines, error: countError } = await supabase
        .from('baseline_skill_matrix')
        .select('id', { count: 'exact' })
        .limit(1)
      
      if (countError) {
        console.error('Error testing database connection:', countError.message)
      } else {
        console.log(`Database connection successful, found ${anyBaselines?.length || 0} sample baselines`)
      }
      
      // Get the baseline skill matrix with only columns we know exist
      console.log(`Looking for baseline with ID: ${baseline_id}`)
      const { data: baselineData, error: baselineError } = await supabase
        .from('baseline_skill_matrix')
        .select('id, status, skill_matrix, ideal_skill_matrix_id, user_id, created_at, analysis_started_at, analysis_completed_at')
        .eq('id', baseline_id)
        .single()
      
      if (baselineError) {
        console.error(`Error fetching baseline matrix: ${baselineError.code} - ${baselineError.message}`)
        
        // Try an alternative approach if the baseline wasn't found directly
        if (baselineError.code === 'PGRST116') { // Not found error
          console.log('Trying alternative search for baseline ID...')
          
          const { data: similarBaselines } = await supabase
            .from('baseline_skill_matrix')
            .select('id')
            .like('id', `%${baseline_id.replace(/-/g, '%')}%`)
            .limit(5)
            
          if (similarBaselines && similarBaselines.length > 0) {
            console.log('Found similar baseline IDs:', similarBaselines.map(b => b.id))
            return NextResponse.json(
              { 
                error: 'Baseline not found with exact ID', 
                similar_ids: similarBaselines.map(b => b.id)
              },
            { 
              status: 404,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
              }
            }
            )
          }
        }
        
        return NextResponse.json(
          { error: `Error retrieving baseline skill matrix: ${baselineError.message}` },
        { 
          status: baselineError.code === 'PGRST116' ? 404 : 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
        )
      }
      
      if (!baselineData) {
        console.error('No baseline data returned for ID:', baseline_id)
        return NextResponse.json(
          { error: 'Baseline skill matrix not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
        )
      }
      
      // Verify the user has access to this baseline
      if (baselineData.user_id !== userId) {
        console.error(`Access denied for user ${userId} - not the owner of baseline ${baseline_id}`)
        return NextResponse.json(
          { error: 'You do not have permission to access this baseline skill matrix' },
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
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
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
        )
      }
      
      // Extract the gap analysis dashboard if it exists
      let gapAnalysisDashboard = null
      
      // First try from the dedicated column (might not exist in schema)
      try {
        // Need to query again with the specific column
        const { data: dashboardData, error: dashboardError } = await supabase
          .from('baseline_skill_matrix')
          .select('gap_analysis_dashboard')
          .eq('id', baseline_id)
          .maybeSingle()
          
        if (!dashboardError && dashboardData?.gap_analysis_dashboard) {
          gapAnalysisDashboard = dashboardData.gap_analysis_dashboard
          console.log('Found gap_analysis_dashboard in dedicated column')
        }
      } catch (e) {
        // If accessing the column fails, it likely doesn't exist
        console.warn('Could not access gap_analysis_dashboard column:', e)
      }
      
      // If not found in dedicated column, check if session_data column exists and check it
      if (!gapAnalysisDashboard) {
        try {
          // Check if session_data column exists by trying to query it safely
          const { data: testData, error: testError } = await supabase
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
              console.log('Found gap analysis dashboard in session_data');
            }
          } else {
            // Check if error indicates column doesn't exist
            if (testError.message && testError.message.includes('column "session_data" does not exist')) {
              console.log('session_data column does not exist in the table schema');
            } else {
              console.warn('Error accessing session_data:', testError);
            }
          }
        } catch (e) {
          console.error('Error checking for or extracting dashboard from session_data:', e);
        }
      }
      
      // Return the data
      console.log(`Successfully retrieved data for baseline ${baseline_id}`)
      return NextResponse.json({
        id: baselineData.id,
        status: baselineData.status,
        baseline_skill_matrix: baselineData.skill_matrix,
        ideal_skill_matrix: idealData?.skill_matrix,
        created_at: baselineData.created_at,
        analysis_started_at: baselineData.analysis_started_at,
        analysis_completed_at: baselineData.analysis_completed_at,
        gap_analysis_dashboard: gapAnalysisDashboard
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
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
} 
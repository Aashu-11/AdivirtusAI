import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/database.types'

// Helper function to create a Supabase admin client using request cookies directly
function createAdminClient(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase service role key')
  }

  // Create a response to handle cookie operations
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  return {
    client: createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
        auth: {
          persistSession: false
        }
      }
    ),
    response,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { userId, sctInitialId } = body
    
    console.log('Request body:', body)
    
    if (!userId && !sctInitialId) {
      return NextResponse.json(
        { error: 'Either userId or sctInitialId is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }
    
    try {
      // Create the admin client for database operations
      const { client: adminClient } = createAdminClient(request)
    
    // Handle SCT initial ID flow first (legacy support)
    if (sctInitialId) {
      console.log(`Checking baseline skill matrix for SCT initial ID: ${sctInitialId}`)
      
      // Check if a baseline skill matrix already exists for this SCT initial ID
        const { data: existingBaselineData, error: existingBaselineError } = await adminClient
        .from('baseline_skill_matrix')
        .select('id, status, user_id')
        .eq('sct_initial_id', sctInitialId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (existingBaselineError && existingBaselineError.code !== 'PGRST116') {
        // PGRST116 is the error code for no rows returned
        console.error('Error checking existing baseline by SCT ID:', existingBaselineError)
      }
      
      if (existingBaselineData) {
        console.log(`Existing baseline found for SCT ID ${sctInitialId}: ${existingBaselineData.id}, status: ${existingBaselineData.status}`)
        return NextResponse.json({
          exists: true,
          baselineId: existingBaselineData.id,
          status: existingBaselineData.status,
          userId: existingBaselineData.user_id
          }, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        })
      }
      
      // If no baseline exists, create one by calling the Django backend
      console.log(`No baseline found for SCT ID ${sctInitialId}, creating new baseline...`)
      
      try {
        // Call Django backend to create baseline
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
        const backendResponse = await fetch(`${backendUrl}/api/assessments/create-gap-analysis-public/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sct_initial_id: sctInitialId }),
        })
        
        if (!backendResponse.ok) {
          console.error('Failed to create baseline in Django backend:', await backendResponse.text())
          return NextResponse.json({
            error: 'Failed to create baseline skill matrix'
          }, {
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          })
        }
        
        const backendData = await backendResponse.json()
        console.log('Django backend response:', backendData)
        
        if (backendData.id) {
          return NextResponse.json({
            exists: true,
            baselineId: backendData.id,
            status: 'pending',
            message: 'Baseline skill matrix created successfully'
          }, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          })
        } else {
          console.error('No baseline ID returned from Django backend')
          return NextResponse.json({
            error: 'No baseline ID returned from backend'
          }, {
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          })
        }
        
      } catch (error) {
        console.error('Error calling Django backend:', error)
      return NextResponse.json({
          error: 'Failed to create baseline skill matrix'
        }, {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
      })
      }
    }
    
    // Handle direct userId flow
    if (userId) {
      console.log(`Checking baseline skill matrix for user ID: ${userId}`)
      
      // Query for completed baselines for this user
        const { data: completedBaselines, error: completedError } = await adminClient
        .from('baseline_skill_matrix')
        .select('id, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (completedError) {
        console.error('Error checking completed baselines:', completedError)
        return NextResponse.json(
          { error: 'Database query failed', details: completedError },
            { 
              status: 500,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
              }
            }
        )
      }
      
      console.log('Completed baselines query result:', completedBaselines)
      
      if (completedBaselines && completedBaselines.length > 0) {
        console.log(`Found completed baseline for user ${userId}: ${completedBaselines[0].id}`)
        return NextResponse.json({
          exists: true,
          baselineId: completedBaselines[0].id,
          status: completedBaselines[0].status
          }, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        })
      }
      
      // If no completed baseline found, try checking for any baseline
        const { data: allBaselines, error: allBaselinesError } = await adminClient
        .from('baseline_skill_matrix')
        .select('id, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (allBaselinesError) {
        console.error('Error checking all baselines:', allBaselinesError)
      }
      
      console.log('All baselines query result:', allBaselines)
      
      if (allBaselines && allBaselines.length > 0) {
        console.log(`Found baseline for user ${userId}: ${allBaselines[0].id}, status: ${allBaselines[0].status}`)
        // Return the baseline, but mark it as not completed
        return NextResponse.json({
          exists: true,
          baselineId: allBaselines[0].id,
          status: allBaselines[0].status,
          isCompleted: false
          }, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        })
      }
      
      return NextResponse.json({
        exists: false,
        message: 'No baseline found for given user ID'
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }
    } catch (supabaseError) {
      console.error('Supabase client error:', supabaseError)
      return NextResponse.json(
        { error: 'Authentication or database error', details: supabaseError },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }
    
  } catch (error) {
    console.error('Error checking baseline:', error)
    return NextResponse.json(
      { error: 'Failed to check baseline skill matrix', details: error },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  )
} 
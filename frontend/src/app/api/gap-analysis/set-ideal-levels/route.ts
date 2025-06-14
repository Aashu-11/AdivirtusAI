import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = 'http://localhost:8000'

export async function POST(request: NextRequest) {
  console.log('Setting ideal skill levels endpoint called')
  
  try {
    // Get authorization header from request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.log('No authorization header provided')
      return NextResponse.json(
        { error: 'Authorization is required' },
        { status: 401 }
      )
    }

    // Parse request body
    const requestData = await request.json()
    const { job_role, skill_requirements } = requestData
    
    if (!job_role) {
      return NextResponse.json(
        { error: 'Job role is required' },
        { status: 400 }
      )
    }
    
    if (!skill_requirements || !Array.isArray(skill_requirements)) {
      return NextResponse.json(
        { error: 'Skill requirements must be provided as an array' },
        { status: 400 }
      )
    }
    
    // Get user from Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !userData.user) {
      console.log('Error getting user from Supabase:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = userData.user.id
    console.log(`User ID: ${userId}`)
    
    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_URL || DEFAULT_BACKEND_URL}/api/gap-analysis/set-ideal-levels/`
    console.log(`Forwarding request to: ${backendUrl}`)
    
    try {
      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          job_role,
          skill_requirements
        })
      })
      
      // Check if the response is JSON
      const contentType = backendResponse.headers.get('content-type')
      let responseData
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await backendResponse.json()
        console.log('Backend response:', responseData)
      } else {
        const textResponse = await backendResponse.text()
        console.log('Backend returned non-JSON response:', textResponse.substring(0, 500))
        throw new Error(`Backend returned non-JSON response: ${backendResponse.status}`)
      }
      
      if (backendResponse.ok) {
        return NextResponse.json(responseData)
      } else {
        return NextResponse.json(
          { error: responseData.error || 'Failed to set ideal levels' },
          { status: backendResponse.status }
        )
      }
      
    } catch (error) {
      console.error('Error calling backend:', error)
      
      // If backend is unavailable, try to update directly with Supabase
      console.log('Attempting to set ideal levels directly with Supabase')
      
      const updatedSkills = []
      
      for (const skillReq of skill_requirements) {
        if (!skillReq.skill_id || skillReq.ideal_level === undefined) continue
        
        // Ensure ideal level is in range 0-100
        const idealLevel = Math.min(100, Math.max(0, skillReq.ideal_level))
        
        try {
          const { data, error } = await supabase
            .from('baseline_skill_matrix')
            .update({ ideal_competency_level: idealLevel })
            .eq('skill_id', skillReq.skill_id)
            .eq('user_id', userId)
            .select()
          
          if (error) {
            console.error(`Error updating skill ${skillReq.skill_id}:`, error)
          } else if (data && data.length > 0) {
            updatedSkills.push({
              skill_id: skillReq.skill_id,
              ideal_level: idealLevel
            })
          }
        } catch (err) {
          console.error(`Error updating skill ${skillReq.skill_id}:`, err)
        }
      }
      
      return NextResponse.json({
        message: `Updated ideal levels for ${updatedSkills.length} skills`,
        job_role,
        updated_skills: updatedSkills,
        is_direct_update: true
      })
    }
    
  } catch (error) {
    console.error('Error in set-ideal-levels endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
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

// Default backend URL if environment variable is not set
const DEFAULT_BACKEND_URL = 'http://localhost:8000'

export async function POST(request: NextRequest) {
  console.log('Gap analysis start endpoint called')
  
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
    const { sctInitialId } = requestData
    
    if (!sctInitialId) {
      console.log('No SCT initial ID provided')
      return NextResponse.json(
        { error: 'SCT initial ID is required' },
        { status: 400 }
      )
    }
    
    console.log(`Starting gap analysis for SCT initial: ${sctInitialId}`)
    
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
    
    // Fix backend URL - ensure it has a proper protocol
    // Make sure we're using the correct environment variable and cleaning it
    let backendUrl = DEFAULT_BACKEND_URL
    
    // Check for environment variables and use the first available one
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      const value = process.env.NEXT_PUBLIC_BACKEND_URL.trim()
      // If the value contains an equals sign, it might include the variable name itself
      if (value.includes('=')) {
        // Split on equals and take the last part (the actual URL)
        const parts = value.split('=')
        backendUrl = parts[parts.length - 1].trim()
      } else {
        backendUrl = value
      }
    } else if (process.env.BACKEND_URL) {
      const value = process.env.BACKEND_URL.trim()
      if (value.includes('=')) {
        const parts = value.split('=')
        backendUrl = parts[parts.length - 1].trim()
      } else {
        backendUrl = value
      }
    }
    
    // Remove any trailing slashes
    backendUrl = backendUrl.replace(/\/+$/, '')
    
    // Ensure it has the proper protocol
    if (!backendUrl.startsWith('http')) {
      backendUrl = `http://${backendUrl}`
    }
    
    console.log(`Using backend URL: ${backendUrl}`)
    
    // STEP 1: Check if a baseline skill matrix already exists
    const { data: existingBaselineData, error: existingBaselineError } = await supabase
      .from('baseline_skill_matrix')
      .select('id, status')
      .eq('sct_initial_id', sctInitialId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      
    // If no error checking for existing baseline, one exists
    if (!existingBaselineError && existingBaselineData) {
      console.log(`Found existing baseline: ${existingBaselineData.id}, status: ${existingBaselineData.status}`)
      
      // If the existing analysis is completed or failed, allow restarting
      if (existingBaselineData.status === 'completed' || existingBaselineData.status === 'failed') {
        // Update the status to pending to start over
        const { error: updateError } = await supabase
          .from('baseline_skill_matrix')
          .update({ status: 'pending' })
          .eq('id', existingBaselineData.id)
          
        if (updateError) {
          console.error('Error resetting baseline status:', updateError)
          return NextResponse.json(
            { error: 'Failed to restart gap analysis' },
            { status: 500 }
          )
        }
      }
      
      // STEP 2: Start the analysis via our backend API
      try {
        // Construct a proper URL without any double slashes but WITH a trailing slash
        const startApiUrl = `${backendUrl}/api/assessments/start-gap-analysis/${existingBaselineData.id}/`
        console.log(`Calling backend API: ${startApiUrl}`)
        
        const backendResponse = await fetch(startApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          }
        })
        
        if (!backendResponse.ok) {
          throw new Error(`Backend API error: ${backendResponse.status} ${backendResponse.statusText}`)
        }
        
        // Check if we can parse the response
        try {
          const backendData = await backendResponse.json()
          console.log('Backend response:', backendData)
        } catch (parseErr) {
          console.log('Could not parse backend response, assuming success')
        }
        
        return NextResponse.json({
          message: 'Gap analysis restarted successfully',
          baselineId: existingBaselineData.id
        })
        
      } catch (backendError) {
        console.error('Error calling backend:', backendError)
        return NextResponse.json(
          { error: 'Failed to start gap analysis process' },
          { status: 502 }
        )
      }
    }
    
    // If we get here, no existing baseline was found (or there was an error we're ignoring)
    console.log('No existing baseline found, creating new baseline skill matrix')
    
    // STEP 3: Create a new baseline skill matrix
    // Fetch the SCT initial data to get the skill_matrix_id
    const { data: sctData, error: sctError } = await supabase
      .from('sct_initial')
      .select('assessment_id, skill_matrix_id')
      .eq('id', sctInitialId)
      .single()
      
    if (sctError || !sctData) {
      console.error('Error fetching SCT initial data:', sctError)
      return NextResponse.json(
        { error: 'Failed to fetch SCT initial data' },
        { status: 500 }
      )
    }
    
    // Fetch the ideal skill matrix data
    const { data: idealMatrixData, error: idealMatrixError } = await supabase
      .from('ideal_skill_matrix')
      .select('skill_matrix')
      .eq('id', sctData.skill_matrix_id)
      .single()
      
    if (idealMatrixError || !idealMatrixData) {
      console.error('Error fetching ideal skill matrix:', idealMatrixError)
      return NextResponse.json(
        { error: 'Failed to fetch ideal skill matrix' },
        { status: 500 }
      )
    }
    
    // Create the baseline skill matrix
    const baselineData = {
      user_id: userId,
      assessment_id: sctData.assessment_id,
      sct_initial_id: sctInitialId,
      ideal_skill_matrix_id: sctData.skill_matrix_id,
      skill_matrix: idealMatrixData.skill_matrix,
      status: 'pending'
    }
    
    const { data: newBaselineData, error: createError } = await supabase
      .from('baseline_skill_matrix')
      .insert(baselineData)
      .select()
      .single()
      
    if (createError || !newBaselineData) {
      console.error('Error creating baseline skill matrix:', createError)
      return NextResponse.json(
        { error: 'Failed to create baseline skill matrix' },
        { status: 500 }
      )
    }
    
    console.log(`Created new baseline with ID: ${newBaselineData.id}`)
    
    // STEP 4: Start the analysis via our backend API
    try {
      // Construct a proper URL without any double slashes but WITH a trailing slash
      const startApiUrl = `${backendUrl}/api/assessments/start-gap-analysis/${newBaselineData.id}/`
      console.log(`Calling backend API: ${startApiUrl}`)
      
      const backendResponse = await fetch(startApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      })
      
      if (!backendResponse.ok) {
        throw new Error(`Backend API error: ${backendResponse.status} ${backendResponse.statusText}`)
      }
      
      // Check if we can parse the response
      try {
        const backendData = await backendResponse.json()
        console.log('Backend response:', backendData)
      } catch (parseErr) {
        console.log('Could not parse backend response, assuming success')
      }
      
      return NextResponse.json({
        message: 'Gap analysis started successfully',
        baselineId: newBaselineData.id
      })
      
    } catch (backendError) {
      console.error('Error calling backend:', backendError)
      
      // Update status to indicate failure
      await supabase
        .from('baseline_skill_matrix')
        .update({ status: 'failed' })
        .eq('id', newBaselineData.id)
        
      return NextResponse.json(
        { error: 'Failed to start gap analysis process' },
        { status: 502 }
      )
    }
    
  } catch (error) {
    console.error('Error in gap analysis start:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
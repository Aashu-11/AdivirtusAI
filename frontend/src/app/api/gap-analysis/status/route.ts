import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const baseline_id = searchParams.get('baseline_id')
    
  if (!baseline_id) {
      return NextResponse.json(
        { error: 'Baseline ID is required' },
        { status: 400 }
      )
    }
    
  console.log(`Getting status for baseline ID: ${baseline_id}`)
  
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get the baseline record
    const { data: baseline, error } = await supabase
      .from('baseline_skill_matrix')
      .select('id, status, created_at, analysis_started_at, analysis_completed_at')
      .eq('id', baseline_id)
      .single()
    
    if (error) {
      console.error('Error fetching baseline:', error.message)
      return NextResponse.json(
        { error: `Error fetching baseline: ${error.message}` },
        { status: 500 }
      )
    }

    if (!baseline) {
      return NextResponse.json(
        { error: 'Baseline not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ status: baseline.status, baseline })
  } catch (error) {
    console.error('Unhandled error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
} 
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

const DEFAULT_BACKEND_URL = 'http://localhost:8000'

/**
 * Health check endpoint that verifies connectivity to database and backend
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  console.log('Health check endpoint called')
  
  const status: {
    status: string;
    timestamp: string;
    environment: string;
    backend: {
      url: string;
      status: string;
    };
    supabase: {
      url: string;
      status: string;
    };
    config: {
      has_service_key: boolean;
      has_base_url: boolean;
      base_url: string;
    };
    db_response_time_ms?: number;
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    backend: {
      url: process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL,
      status: 'unknown',
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      status: 'unknown',
    },
    config: {
      has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
      has_base_url: !!process.env.NEXT_PUBLIC_BASE_URL,
      base_url: process.env.NEXT_PUBLIC_BASE_URL || '',
    }
  }
  
  // Initialize Supabase client
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
  
  // Check Supabase connection
  try {
    const startTime = Date.now()
    const { data, error } = await supabase.from('health_check').select('*').limit(1)
    const dbResponseTime = Date.now() - startTime
    
    if (error) {
      status.supabase.status = 'error'
      console.error('Supabase connection error:', error)
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
      status.supabase.status = 'ok'
    status.db_response_time_ms = dbResponseTime
  } catch (e) {
    status.supabase.status = 'error'
    console.error('Supabase connection error:', e)
    return NextResponse.json({
      status: 'error',
      message: 'Server error during health check',
      error: e instanceof Error ? e.message : String(e),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
  
  // Check backend connection
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL
    const response = await fetch(`${backendUrl}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    
    if (response.ok) {
      status.backend.status = 'ok'
    } else {
      status.backend.status = `error: ${response.status}`
    }
  } catch (e) {
    status.backend.status = 'unavailable'
    console.error('Backend connection error:', e)
  }
  
  // Set overall status
  if (status.supabase.status === 'error' || status.backend.status !== 'ok') {
    status.status = 'degraded'
  }
  
  return NextResponse.json(status, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
} 
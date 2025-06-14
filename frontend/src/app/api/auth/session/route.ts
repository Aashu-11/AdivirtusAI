import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  
  const { data } = await supabase.auth.getSession()

            return NextResponse.json({ 
    session: data.session,
  })
} 
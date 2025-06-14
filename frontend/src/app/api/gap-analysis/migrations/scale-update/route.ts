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

export async function POST(request: NextRequest) {
  console.log('Running scale update migration')
  
  try {
    // Create a new column for the 0-100 scale
    const { error: addColumnError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Add new columns for the 0-100 scale
        ALTER TABLE baseline_skill_matrix 
        ADD COLUMN IF NOT EXISTS competency_level_100 INTEGER,
        ADD COLUMN IF NOT EXISTS ideal_competency_level INTEGER;
        
        -- Update existing data to convert the 0-5 scale to 0-100
        UPDATE baseline_skill_matrix 
        SET competency_level_100 = competency_level * 20
        WHERE competency_level_100 IS NULL;
        
        -- Set default ideal level to 80 (equivalent to level 4 on the old scale)
        UPDATE baseline_skill_matrix 
        SET ideal_competency_level = 80
        WHERE ideal_competency_level IS NULL;
      `
    })

    if (addColumnError) {
      console.error('Error running migration:', addColumnError)
      return NextResponse.json({
        error: 'Failed to update schema',
        details: addColumnError
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Successfully updated schema for 0-100 scale'
    })
  } catch (error) {
    console.error('Error in migration:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error
    }, { status: 500 })
  }
} 
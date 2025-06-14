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

const DEFAULT_BACKEND_URL = 'http://localhost:8000'

export async function POST(request: NextRequest) {
  console.log('Gap analysis migrations endpoint called')
  
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
    const { migration } = requestData
    
    if (!migration) {
      console.log('No migration type provided')
      return NextResponse.json(
        { error: 'Migration type is required' },
        { status: 400 }
      )
    }
    
    console.log(`Running migration: ${migration}`)
    
    // Create Supabase client with service role key
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
    
    // Run the appropriate migration
    if (migration === 'add_columns') {
      // Add the columns to the table
      console.log('Adding columns to baseline_skill_matrix table')
      
      await supabase.rpc('run_sql', {
        query: `
          ALTER TABLE baseline_skill_matrix
          ADD COLUMN IF NOT EXISTS competency_level_100 INTEGER,
          ADD COLUMN IF NOT EXISTS ideal_competency_level INTEGER;
        `
      })
      
      // Update existing rows to populate the new columns
      console.log('Updating existing rows with calculated values')
      await supabase.rpc('run_sql', {
        query: `
          UPDATE baseline_skill_matrix
          SET competency_level_100 = competency_level * 20
          WHERE competency_level_100 IS NULL;
        `
      })
      
      await supabase.rpc('run_sql', {
        query: `
          UPDATE baseline_skill_matrix
          SET ideal_competency_level = 80
          WHERE ideal_competency_level IS NULL;
        `
      })
      
      return NextResponse.json({
        status: 'success',
        message: 'Added columns to baseline_skill_matrix table'
      })
    } else if (migration === 'extract_skills') {
      // Extract skills from the ideal_skill_matrix table
      console.log('Extracting skills from ideal_skill_matrix table')
      
      const { data: idealSkillMatrix, error: idealSkillMatrixError } = await supabase
        .from('ideal_skill_matrix')
        .select('skill_matrix')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (idealSkillMatrixError) {
        console.error('Error getting ideal skill matrix:', idealSkillMatrixError)
        throw new Error(`Failed to get ideal skill matrix: ${idealSkillMatrixError.message}`)
      }
      
      if (!idealSkillMatrix || idealSkillMatrix.length === 0) {
        console.log('No ideal skill matrix found')
        return NextResponse.json({
          status: 'warning',
          message: 'No ideal skill matrix found'
        })
      }
      
      const skillMatrix = idealSkillMatrix[0].skill_matrix
      const skills = []
      
      // Process technical skills - only add the main skills, not associated metrics
      if (skillMatrix.technical_skills) {
        for (const skill of skillMatrix.technical_skills) {
          const skillName = skill.name.trim()
          skills.push({
            name: skillName,
            description: skill.description || '',
            category: 'Technical Skills'
          })
          
          // Log associated metrics but don't add them as skills
          if (skill.associated_metrics && Array.isArray(skill.associated_metrics)) {
            const metricNames = skill.associated_metrics
              .filter(metric => metric.name)
              .map(metric => metric.name)
            console.log(`Found associated metrics for ${skillName}: ${metricNames.join(', ')} (NOT added as skills)`)
          }
        }
      }
      
      // Process soft skills - only add the main skills, not key indicators
      if (skillMatrix.soft_skills) {
        for (const skill of skillMatrix.soft_skills) {
          const skillName = skill.name.trim()
          skills.push({
            name: skillName,
            description: skill.description || '',
            category: 'Soft Skills'
          })
          
          // Log key indicators but don't add them as skills
          if (skill.key_indicators && Array.isArray(skill.key_indicators)) {
            console.log(`Found key indicators for ${skillName}: ${skill.key_indicators.length} indicators (NOT added as skills)`)
          }
        }
      }
      
      console.log(`Found ${skills.length} skills to extract`)
      
      // For each skill, check if it exists and add if not
      let addedCount = 0
      for (const skill of skills) {
        const { data: existingSkill } = await supabase
          .from('skills')
          .select('id')
          .eq('name', skill.name)
          .limit(1)
        
        if (!existingSkill || existingSkill.length === 0) {
          // Add the skill
          await supabase.from('skills').insert(skill)
          addedCount++
        }
      }
      
      return NextResponse.json({
        status: 'success',
        message: `Added ${addedCount} new skills`,
        total: skills.length
      })
    } else if (migration === 'all') {
      // Run all migrations
      const result = await runAllMigrations(supabase)
      return NextResponse.json(result)
    }
    
    return NextResponse.json({
      status: 'error',
      message: 'Unknown migration type'
    }, { status: 400 })
    
  } catch (error: any) {
    console.error('Error running migration:', error)
    return NextResponse.json({
      status: 'error', 
      error: 'Failed to run migration',
      details: error.message
    }, { status: 500 })
  }
}

async function runAllMigrations(supabase: any) {
  console.log('Running all migrations')
  
  // First add the competency_level_100 column if it doesn't exist
  console.log('Adding competency_level_100 and ideal_competency_level columns to baseline_skill_matrix')
  
  // First check if the column already exists to avoid errors
  try {
    // Check if the check_column_exists function is available
    const { data: fnExists, error: fnCheckError } = await supabase.rpc('check_column_exists', { 
      table_name: 'baseline_skill_matrix',
      column_name: 'competency_level_100'
    }).catch(() => ({ data: null, error: { message: 'Function not available' }}))
    
    if (fnCheckError) {
      console.log('check_column_exists function not available, using direct SQL instead')
      // Use direct SQL to check if column exists
      const { data: columnData } = await supabase.rpc('run_sql', {
        query: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'baseline_skill_matrix' 
          AND column_name = 'competency_level_100'
        `
      }).catch(() => ({ data: [] }))
      
      const competencyColumnExists = columnData && columnData.length > 0
      const idealColumnExists = await checkIfColumnExists(supabase, 'baseline_skill_matrix', 'ideal_competency_level')
      
      if (!competencyColumnExists) {
        console.log('competency_level_100 column does not exist, adding it')
        await addColumn(supabase, 'baseline_skill_matrix', 'competency_level_100', 'INTEGER')
        await updateColumn(supabase, 'baseline_skill_matrix', 'competency_level_100 = competency_level * 20')
      }
      
      if (!idealColumnExists) {
        console.log('ideal_competency_level column does not exist, adding it')
        await addColumn(supabase, 'baseline_skill_matrix', 'ideal_competency_level', 'INTEGER')
        await updateColumn(supabase, 'baseline_skill_matrix', 'ideal_competency_level = 80')
      }
    } else {
      // Original approach using check_column_exists works
      const { data: columnCheck } = await supabase.rpc('check_column_exists', { 
        table_name: 'baseline_skill_matrix',
        column_name: 'competency_level_100'
      })
      
      // If the column doesn't exist, add it
      if (!columnCheck || columnCheck === false) {
        console.log('competency_level_100 column does not exist, adding it')
        await supabase.rpc('run_sql', {
          query: `
            ALTER TABLE baseline_skill_matrix
            ADD COLUMN IF NOT EXISTS competency_level_100 INTEGER;
          `
        })
        
        // Populate the new column based on the existing competency_level column
        await supabase.rpc('run_sql', {
          query: `
            UPDATE baseline_skill_matrix
            SET competency_level_100 = competency_level * 20
            WHERE competency_level_100 IS NULL AND competency_level IS NOT NULL;
          `
        })
      } else {
        console.log('competency_level_100 column already exists')
      }
      
      // Now add the ideal_competency_level column if it doesn't exist
      const { data: idealColumnCheck } = await supabase.rpc('check_column_exists', { 
        table_name: 'baseline_skill_matrix',
        column_name: 'ideal_competency_level'
      })
      
      if (!idealColumnCheck || idealColumnCheck === false) {
        console.log('ideal_competency_level column does not exist, adding it')
        await supabase.rpc('run_sql', {
          query: `
            ALTER TABLE baseline_skill_matrix
            ADD COLUMN IF NOT EXISTS ideal_competency_level INTEGER;
          `
        })
        
        // Default to 80 (skilled professional level) for the ideal level
        await supabase.rpc('run_sql', {
          query: `
            UPDATE baseline_skill_matrix
            SET ideal_competency_level = 80
            WHERE ideal_competency_level IS NULL;
          `
        })
      } else {
        console.log('ideal_competency_level column already exists')
      }
    }
  } catch (error) {
    console.error('Error checking columns:', error)
    // Fallback to direct ALTER TABLE which will just ignore if columns exist
    try {
      await supabase.rpc('run_sql', {
        query: `
          ALTER TABLE baseline_skill_matrix
          ADD COLUMN IF NOT EXISTS competency_level_100 INTEGER,
          ADD COLUMN IF NOT EXISTS ideal_competency_level INTEGER;
        `
      })
      
      await supabase.rpc('run_sql', {
        query: `
          UPDATE baseline_skill_matrix
          SET competency_level_100 = competency_level * 20
          WHERE competency_level_100 IS NULL AND competency_level IS NOT NULL;
          
          UPDATE baseline_skill_matrix
          SET ideal_competency_level = 80
          WHERE ideal_competency_level IS NULL;
        `
      })
      
      console.log('Added columns using fallback method')
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError)
    }
  }
  
  // Add enhanced metrics columns (technical_specificity, domain_expertise, reasoning)
  console.log('Adding enhanced metrics columns to baseline_skill_matrix')
  try {
    await supabase.rpc('run_sql', {
      query: `
        ALTER TABLE baseline_skill_matrix
        ADD COLUMN IF NOT EXISTS technical_specificity SMALLINT,
        ADD COLUMN IF NOT EXISTS domain_expertise SMALLINT,
        ADD COLUMN IF NOT EXISTS reasoning TEXT;
      `
    })
    console.log('Successfully added enhanced metrics columns')
  } catch (error) {
    console.error('Failed to add enhanced metrics columns:', error)
  }
  
  // Extract skills from ideal_skill_matrix
  console.log('Extracting skills from ideal_skill_matrix')
  try {
    // Get skills from the ideal_skill_matrix
    const { data: idealMatrixData, error: idealMatrixError } = await supabase
      .from('ideal_skill_matrix')
      .select('skill_matrix')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (idealMatrixError) {
      console.error('Error fetching ideal skill matrix:', idealMatrixError)
    } else if (idealMatrixData && idealMatrixData.length > 0 && idealMatrixData[0].skill_matrix) {
      console.log('Found ideal skill matrix, extracting skills')
      
      const skillMatrix = idealMatrixData[0].skill_matrix
      const skills = []
      
      // Process technical skills
      if (skillMatrix.technical_skills) {
        for (const skill of skillMatrix.technical_skills) {
          const skillName = skill.name.trim()
          skills.push({
            name: skillName,
            description: skill.description || '',
            category: 'Technical Skills'
          })
          
          // Log associated metrics but don't add them as skills
          if (skill.associated_metrics && Array.isArray(skill.associated_metrics)) {
            const metricNames = skill.associated_metrics
              .filter(metric => metric.name)
              .map(metric => metric.name)
            console.log(`Found associated metrics for ${skillName}: ${metricNames.join(', ')} (NOT added as skills)`)
          }
        }
      }
      
      // Process soft skills
      if (skillMatrix.soft_skills) {
        for (const skill of skillMatrix.soft_skills) {
          const skillName = skill.name.trim()
          skills.push({
            name: skillName,
            description: skill.description || '',
            category: 'Soft Skills'
          })
          
          // Log key indicators but don't add them as skills
          if (skill.key_indicators && Array.isArray(skill.key_indicators)) {
            console.log(`Found key indicators for ${skillName}: ${skill.key_indicators.length} indicators (NOT added as skills)`)
          }
        }
      }
      
      console.log(`Extracted ${skills.length} skills from matrix`)
      
      // For each skill, check if it exists and insert if it doesn't
      const insertedSkills = []
      for (const skill of skills) {
        try {
          // Check if skill already exists by name
          const { data: existingSkills } = await supabase
            .from('skills')
            .select('id')
            .eq('name', skill.name)
            .limit(1)
          
          if (existingSkills && existingSkills.length > 0) {
            console.log(`Skill "${skill.name}" already exists, skipping...`)
            insertedSkills.push(existingSkills[0])
          } else {
            // Insert new skill
            const { data: newSkill, error: insertError } = await supabase
              .from('skills')
              .insert(skill)
              .select()
            
            if (insertError) {
              console.error(`Error inserting skill "${skill.name}":`, insertError)
            } else if (newSkill && newSkill.length > 0) {
              console.log(`Inserted skill "${skill.name}"`)
              insertedSkills.push(newSkill[0])
            }
          }
        } catch (error) {
          console.error(`Error processing skill "${skill.name}":`, error)
        }
      }
      
      console.log(`Successfully processed ${insertedSkills.length} out of ${skills.length} skills`)
    } else {
      console.log('No ideal skill matrix found or matrix contains no skills')
    }
  } catch (error) {
    console.error('Error extracting skills from matrix:', error)
    return {
      status: 'error',
      message: 'Failed to extract skills from ideal matrix'
    }
  }
  
  // Update any existing skill records to ensure consistency
  try {
    console.log('Ensuring all baseline_skill_matrix records have competency_level_100 values')
    await supabase.rpc('run_sql', {
      query: `
        UPDATE baseline_skill_matrix
        SET competency_level_100 = competency_level * 20
        WHERE competency_level_100 IS NULL AND competency_level IS NOT NULL;
      `
    })
    
    console.log('Ensuring all baseline_skill_matrix records have ideal_competency_level values')
    await supabase.rpc('run_sql', {
      query: `
        UPDATE baseline_skill_matrix
        SET ideal_competency_level = 80
        WHERE ideal_competency_level IS NULL;
      `
    })
  } catch (e) {
    console.error('Error updating existing records:', e)
    return {
      status: 'error',
      message: 'Failed to update existing records'
    }
  }
  
  return {
    status: 'success',
    message: 'All migrations completed successfully'
  }
}

// Helper function to check if a column exists
async function checkIfColumnExists(supabase: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    const { data } = await supabase.rpc('run_sql', {
      query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        AND column_name = '${columnName}'
      `
    }).catch(() => ({ data: [] }))
    
    return data && data.length > 0
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists:`, error)
    return false
  }
}

// Helper function to add a column
async function addColumn(supabase: any, tableName: string, columnName: string, dataType: string): Promise<void> {
  try {
    await supabase.rpc('run_sql', {
      query: `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${dataType};`
    }).catch(() => console.error(`Failed to add column ${columnName}`))
  } catch (error) {
    console.error(`Error adding column ${columnName}:`, error)
  }
}

// Helper function to update a column
async function updateColumn(supabase: any, tableName: string, updateQuery: string): Promise<void> {
  try {
    await supabase.rpc('run_sql', {
      query: `UPDATE ${tableName} SET ${updateQuery};`
    }).catch(() => console.error(`Failed to update column with query: ${updateQuery}`))
  } catch (error) {
    console.error(`Error updating column:`, error)
  }
} 
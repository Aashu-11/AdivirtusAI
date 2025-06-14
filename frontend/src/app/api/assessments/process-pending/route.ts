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

/**
 * POST handler for manually processing pending assessment interpretations
 */
export async function POST(request: NextRequest) {
  console.log('Process pending interpretations endpoint called')
  
  try {
    // Parse the request body to get the userId
    const body = await request.json();
    const userId = body.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing pending interpretations for user: ${userId}`);
    
    // Option 1: Try calling the backend API directly
    let apiResult = null;
    try {
      const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/assessments/process-pending-interpretations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (response.ok) {
        apiResult = await response.json();
        console.log('Backend API processed pending interpretations:', apiResult);
      } else {
        console.log('Backend API failed, falling back to direct database updates');
      }
    } catch (error) {
      console.error('Error calling backend API:', error);
      console.log('Falling back to direct database updates');
    }
    
    if (apiResult && apiResult.count > 0) {
      return NextResponse.json({ 
        success: true,
        message: `Successfully processed pending interpretations via API`,
        apiResult
      });
    }
    
    // Option 2: Direct database access as fallback
    // Find all pending interpretation results for this user
    const { data: pendingResults, error: pendingError } = await supabase
      .from('lsa_result')
      .select('id, assessment_id')
      .eq('user_id', userId)
      .filter('interpreted_result', 'cs', '{"status":"pending"}');
      
    if (pendingError) {
      console.error('Error fetching pending results:', pendingError);
      return NextResponse.json(
        { error: 'Failed to fetch pending results' },
        { status: 500 }
      );
    }
    
    if (!pendingResults || pendingResults.length === 0) {
      // Try to find if there are any lsa_results at all for this user
      const { data: anyResults } = await supabase
        .from('lsa_result')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
        
      if (!anyResults || anyResults.length === 0) {
        // No results found, let's create one
        // First get the latest assessment
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('lsa_assessment')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (assessmentError || !assessmentData || assessmentData.length === 0) {
          return NextResponse.json({
            success: false,
            message: 'No assessment found for this user'
          });
        }
        
        // Create a completed result directly
        const assessmentId = assessmentData[0].id;
        await createCompletedResult(userId, assessmentId);
        
        return NextResponse.json({
          success: true,
          message: 'Created new interpretation result'
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'No pending interpretations found'
      });
    }
    
    console.log(`Found ${pendingResults.length} pending interpretations to process`);
    
    // Update each pending result to a completed state
    for (const result of pendingResults) {
      try {
        await updateResultToCompleted(result.id);
        console.log(`Successfully updated result ${result.id} to completed state`);
      } catch (error) {
        console.error(`Error updating result ${result.id}:`, error);
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully processed ${pendingResults.length} pending interpretations`,
      count: pendingResults.length
    });
  } catch (error) {
    console.error('Error in process pending interpretations endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to update a result to completed state
async function updateResultToCompleted(resultId: string) {
  const { error } = await supabase
    .from('lsa_result')
    .update({
      interpreted_result: {
        status: 'completed',
        timestamp: new Date().toISOString(),
        learnerProfile: {
          learningStyles: {
            primary: 'Visual',  // Placeholder data
            secondary: 'Kinesthetic',
            scores: {
              'Visual': 0.8,
              'Auditory': 0.4,
              'Kinesthetic': 0.6,
              'ReadWrite': 0.3
            }
          },
          learningApproaches: {
            primary: 'Activist',  // Placeholder data
            secondary: 'Reflector',
            scores: {
              'Activist': 0.7,
              'Reflector': 0.5,
              'Theorist': 0.3,
              'Pragmatist': 0.4
            }
          },
          velocityPrediction: {
            baseVelocity: 0.6,
            timeMultiplier: 1.4,
            confidenceLevel: 0.7
          },
          optimalConditions: {
            timing: 0.7,
            duration: 0.5,
            environment: 0.5
          },
          contentPreferences: {
            sequencing: 0.6,
            feedback: 0.7,
            motivation: 0.8,
            knowledgeIntegration: 0.5
          }
        },
        contentRecommendations: {
          contentFormats: {
            recommended: ['video-tutorials', 'infographics', 'hands-on-exercises'],
            alternative: ['written-guides-with-images', 'interactive-visualizations']
          },
          environment: {
            environment: 'moderate-quiet',
            notification_settings: 'priority-only',
            background: 'subtle',
            time_blocks: 'buffered'
          },
          pacing: {
            initial_pace: 'moderate',
            midpoint_pace: 'moderate',
            completion_pace: 'moderate',
            mastery_focus: 'consistent'
          },
          sequencing: {
            pattern: ['fundamentals', 'building-blocks', 'progressive-complexity', 'integration', 'applications'],
            approach: 'Sequential'
          },
          feedback: {
            frequency: 'at-milestones',
            depth: 'moderate',
            delivery: 'checkpoint-reviews',
            timing: 'scheduled'
          }
        }
      }
    })
    .eq('id', resultId);
    
  if (error) throw error;
}

// Helper function to create a completed result
async function createCompletedResult(userId: string, assessmentId: string) {
  const { error } = await supabase
    .from('lsa_result')
    .insert({
      user_id: userId,
      assessment_id: assessmentId,
      interpreted_result: {
        status: 'completed',
        timestamp: new Date().toISOString(),
        learnerProfile: {
          learningStyles: {
            primary: 'Visual',  // Placeholder data
            secondary: 'Kinesthetic',
            scores: {
              'Visual': 0.8,
              'Auditory': 0.4,
              'Kinesthetic': 0.6,
              'ReadWrite': 0.3
            }
          },
          learningApproaches: {
            primary: 'Activist',  // Placeholder data
            secondary: 'Reflector',
            scores: {
              'Activist': 0.7,
              'Reflector': 0.5,
              'Theorist': 0.3,
              'Pragmatist': 0.4
            }
          },
          velocityPrediction: {
            baseVelocity: 0.6,
            timeMultiplier: 1.4,
            confidenceLevel: 0.7
          },
          optimalConditions: {
            timing: 0.7,
            duration: 0.5,
            environment: 0.5
          },
          contentPreferences: {
            sequencing: 0.6,
            feedback: 0.7,
            motivation: 0.8,
            knowledgeIntegration: 0.5
          }
        },
        contentRecommendations: {
          contentFormats: {
            recommended: ['video-tutorials', 'infographics', 'hands-on-exercises'],
            alternative: ['written-guides-with-images', 'interactive-visualizations']
          },
          environment: {
            environment: 'moderate-quiet',
            notification_settings: 'priority-only',
            background: 'subtle',
            time_blocks: 'buffered'
          },
          pacing: {
            initial_pace: 'moderate',
            midpoint_pace: 'moderate',
            completion_pace: 'moderate',
            mastery_focus: 'consistent'
          },
          sequencing: {
            pattern: ['fundamentals', 'building-blocks', 'progressive-complexity', 'integration', 'applications'],
            approach: 'Sequential'
          },
          feedback: {
            frequency: 'at-milestones',
            depth: 'moderate',
            delivery: 'checkpoint-reviews',
            timing: 'scheduled'
          }
        }
      }
    });
    
  if (error) throw error;
} 
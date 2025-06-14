'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { InterpretedResult } from '@/types/assessment'
import { createClient } from '@/utils/supabase/client'

interface AssessmentSummaryProps {
  userId: string
}

interface AssessmentAnswer {
  parameter: string;
  value: string | string[];
  questionType: string;
  prompt: string;
  timestamp: string;
}

interface AssessmentData {
  id: string;
  user_id: string;
  answers: Record<string, AssessmentAnswer>;
  completed_at: string;
  time_taken: number;
  is_completed: boolean;
  total_questions: number;
  assessment_version: string;
  lsa_result: Array<{
    id: string;
    interpreted_result: InterpretedResult;
  }>;
}

export default function AssessmentSummary({ userId }: AssessmentSummaryProps) {
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [interpretationStatus, setInterpretationStatus] = useState<string>('pending')
  const router = useRouter()

  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from('lsa_assessment')
          .select('*, lsa_result(*)')
          .eq('user_id', userId)
          .single()

        if (error) throw error
        setAssessmentData(data as AssessmentData)
        
        // Check interpretation status
        if (data.lsa_result && data.lsa_result.length > 0) {
          const status = data.lsa_result[0]?.interpreted_result?.status || 'pending';
          setInterpretationStatus(status);
          
          // If interpretation is pending, poll for updates
          if (status === 'pending') {
            pollInterpretationStatus(userId);
          }
        }
      } catch (err: any) {
        console.error('Error fetching assessment data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchAssessmentData()
    }
    
    // Clean up polling interval
    return () => {
      stopPolling();
    };
  }, [userId])

  // Polling variables
  let pollingInterval: NodeJS.Timeout | null = null;
  const pollTime = 5000; // 5 seconds
  
  const pollInterpretationStatus = (userId: string) => {
    // Clear any existing polling
    stopPolling();
    
    // Start new polling
    pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/assessments/interpret?userId=${userId}`);
        const data = await response.json();
        
        console.log('Interpretation status poll:', data);
        
        if (data.status === 'completed') {
          stopPolling();
          
          // Fetch the latest assessment data with completed interpretation
          const supabase = createClient()
          const { data: freshData, error } = await supabase.from('lsa_assessment')
            .select('*, lsa_result(*)')
            .eq('user_id', userId)
            .single();
            
          if (!error && freshData) {
            setAssessmentData(freshData as AssessmentData);
            setInterpretationStatus('completed');
          }
        }
      } catch (err) {
        console.error('Error polling interpretation status:', err);
      }
    }, pollTime);
  };
  
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };

  const triggerInterpretation = async () => {
    try {
      setLoading(true);
      setInterpretationStatus('pending');
      
      const response = await fetch('/api/assessments/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger interpretation');
      }
      
      const result = await response.json();
      console.log('Triggered interpretation:', result);
      
      // Start polling for updates
      pollInterpretationStatus(userId);
      
    } catch (err: any) {
      console.error('Error triggering interpretation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processPendingInterpretations = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/assessments/process-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process pending interpretations');
      }
      
      const result = await response.json();
      console.log('Processed pending interpretations:', result);
      
      // Fetch the latest assessment data
      const supabase = createClient()
      const { data: freshData, error } = await supabase.from('lsa_assessment')
        .select('*, lsa_result(*)')
        .eq('user_id', userId)
        .single();
        
      if (!error && freshData) {
        setAssessmentData(freshData as AssessmentData);
        setInterpretationStatus('completed');
      }
      
    } catch (err: any) {
      console.error('Error processing pending interpretations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderReinterpretButton = () => {
    // Check if we already have enhanced data
    const hasEnhancedData = assessmentData?.lsa_result?.[0]?.interpreted_result?.processingMetadata?.version &&
      parseFloat(assessmentData.lsa_result[0].interpreted_result.processingMetadata.version) >= 1.1;
    
    if (hasEnhancedData) {
      return null; // Don't show button if already using enhanced interpreter
    }
    
    return (
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800">Enhanced Interpretation Available</h3>
        <p className="mt-2 text-sm text-blue-600">
          We've upgraded our learning style interpreter with enhanced cognitive load analysis and more precise learning velocity predictions.
        </p>
        <ul className="mt-3 list-disc list-inside text-sm text-blue-600 space-y-1">
          <li>Get detailed cognitive load factor analysis</li>
          <li>See probabilistic learning time ranges</li>
          <li>View response consistency scores</li>
          <li>Receive more accurate recommendations</li>
        </ul>
        
        <button
          onClick={triggerInterpretation}
          disabled={loading || interpretationStatus === 'pending'}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:bg-blue-300"
        >
          {loading || interpretationStatus === 'pending' ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Upgrade Interpretation'
          )}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-[#0A0A0A]/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-gray-400">Loading assessment data...</p>
        </div>
      </div>
    )
  }

  if (error || !assessmentData) {
    return (
      <div className="bg-[#0A0A0A]/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-2">Assessment Data</h3>
        <p className="text-red-400">No assessment data found. Please complete the assessment.</p>
        <button
          onClick={() => router.push('/assessments')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Take Assessment
        </button>
      </div>
    )
  }

  // Get interpretation data if available
  const interpretationData = assessmentData.lsa_result && 
    assessmentData.lsa_result.length > 0 && 
    assessmentData.lsa_result[0].interpreted_result.status === 'completed'
      ? assessmentData.lsa_result[0].interpreted_result
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A0A0A]/90 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50"
    >
      <h3 className="text-lg font-semibold text-white mb-2">Learning Style Assessment Summary</h3>
      
      <div className="mt-6">
        <h4 className="text-gray-300 text-sm font-medium mb-2">Results Status</h4>
        <div className="bg-[#111111]/80 rounded-lg p-4">
          {interpretationStatus === 'pending' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                <span className="text-gray-300">Processing your assessment results...</span>
              </div>
              <button
                onClick={processPendingInterpretations}
                className="px-3 py-1 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
              >
                Force Process
              </button>
            </div>
          ) : interpretationStatus === 'completed' && interpretationData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-green-400 font-medium">Analysis completed</span>
                <button
                  onClick={() => router.push('/learning-profile')}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                >
                  View Full Results
                </button>
              </div>
              
              {/* Learning style summary */}
              {interpretationData.learnerProfile && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <h5 className="text-white text-sm font-medium mb-2">Your Learning Style</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-400 text-xs">Primary Style</span>
                      <p className="text-white font-medium">{interpretationData.learnerProfile.learningStyles.primary}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Secondary Style</span>
                      <p className="text-white font-medium">{interpretationData.learnerProfile.learningStyles.secondary}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Learning Approach</span>
                      <p className="text-white font-medium">{interpretationData.learnerProfile.learningApproaches.primary}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">Secondary Approach</span>
                      <p className="text-white font-medium">{interpretationData.learnerProfile.learningApproaches.secondary}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Content recommendations preview */}
              {interpretationData.contentRecommendations && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <h5 className="text-white text-sm font-medium mb-2">Recommended Content Formats</h5>
                  <div className="flex flex-wrap gap-2">
                    {interpretationData.contentRecommendations.contentFormats.recommended.slice(0, 3).map((format) => (
                      <span 
                        key={format}
                        className="bg-green-500/10 text-green-300 text-xs px-3 py-1 rounded-full"
                      >
                        {format.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-gray-400 mb-3">Results not yet processed</span>
              {renderReinterpretButton()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
} 
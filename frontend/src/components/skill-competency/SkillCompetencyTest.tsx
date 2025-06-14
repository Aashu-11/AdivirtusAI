'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, CheckCircle, BarChart3, Edit3, ChevronLeft, ChevronRight, AlertTriangle, Lightbulb, Code, Target, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GapAnalysisButton } from '@/components/GapAnalysisButton'
import { createClient } from '@/utils/supabase/client'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'

interface Skill {
  id: string
  name: string
  category: string
}

interface Question {
  id: string
  question: string
  context?: string
  expected_skills?: string[]  // Old format
  skills?: Skill[] | any      // New format - made more flexible to handle potential inconsistencies
  difficulty: string
  importance?: string
  type?: string               // Question type (pure_coding, debugging, theory, etc.)
  code?: string              // Buggy code for debugging questions
  code_template?: string     // Code template for coding questions
  language?: string          // Programming language
  file_extension?: string    // File extension
  task_instruction?: string  // Specific task instructions
  expected_behavior?: string // Expected behavior for debugging questions
  input_example?: string     // Input example for coding questions
  expected_output?: string   // Expected output for coding questions
}

interface Answer {
  questionId: string
  answer: string
}

interface SkillCompetencyTestProps {
  onCompleted?: () => void
}

export default function SkillCompetencyTest({ onCompleted }: SkillCompetencyTestProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingExistingAnalysis, setIsCheckingExistingAnalysis] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sctInitialId, setSctInitialId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Check the session first
        const { data: { session }, error: sessionError } = await createClient().auth.getSession()
        console.log('Session check:', { 
          hasSession: !!session, 
          sessionError, 
          userId: session?.user?.id 
        })

        if (sessionError) {
          console.error('Session error:', sessionError)
          toast.error('Session error. Please sign in again.')
          return
        }

        if (!session?.user?.id) {
          toast.error('No active session. Please sign in to take the test')
          return
        }

        const user = session.user
        setUserId(user.id)

        // DIAGNOSTIC: Let's test basic Supabase connectivity and auth
        console.log('=== DIAGNOSTIC START ===')
        const supabaseClient = createClient()
        
        // Test 1: Check if we can access the auth object
        const { data: userData, error: userError } = await supabaseClient.auth.getUser()
        console.log('Auth getUser test:', { userData: userData?.user?.id, userError })
        
        // Test 2: Try to access a simple table without RLS first (if any)
        // Test 3: Try to access our target table with minimal select
        try {
          const { data: testData, error: testError, status, statusText } = await supabaseClient
            .from('sct_initial')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
          
          console.log('Simple sct_initial test:', { 
            testData, 
            testError, 
            status, 
            statusText,
            hasData: !!testData && testData.length > 0 
          })
        } catch (testErr) {
          console.error('Simple test failed:', testErr)
        }
        
        // Test 4: Check if environment variables are accessible
        console.log('Environment check:', {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
        })
        console.log('=== DIAGNOSTIC END ===')

        // ENHANCED DEBUG: Check if user has completed analysis via API
        console.log('=== CHECKING FOR EXISTING ANALYSIS ===')
        setIsCheckingExistingAnalysis(true)
        try {
          // Try to access without RLS by using a service call
          const debugResponse = await fetch(`/api/gap-analysis/debug?userId=${user.id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (debugResponse.ok) {
            const debugData = await debugResponse.json()
            console.log('Debug API response:', debugData)
            
            // If user has completed analysis, redirect them
            if (debugData.baseline && debugData.baseline.id) {
              console.log('Found completed analysis, redirecting...')
              toast.success('Found your existing analysis! Redirecting...')
              // Add a small delay to ensure proper state cleanup
              setTimeout(() => {
                router.push(`/skill-gap-analysis/${debugData.baseline.id}`)
              }, 1000)
              return
            }
            
            // If user has answers but no completed analysis, show appropriate message
            if (debugData.hasAnswers && !debugData.baseline) {
              console.log('User has submitted answers but analysis is not ready')
              toast.info('Your assessment has been submitted. Analysis is being processed.')
              setIsCheckingExistingAnalysis(false)
              return
            }
            
            // If user has questions but no answers, continue with normal flow
            if (debugData.hasQuestions && !debugData.hasAnswers) {
              console.log('User has questions, continuing with normal assessment flow')
              // Continue to normal question fetching below
            }
          }
        } catch (debugError) {
          console.error('Debug API failed:', debugError)
          // Continue with normal flow if debug API fails
        }
        setIsCheckingExistingAnalysis(false)
        console.log('=== END ANALYSIS CHECK ===')
        

        // Fetch questions from sct_initial table
        console.log('Fetching questions for user:', user.id)
        
        // First, let's try to check if we can find any record for this user
        const { data: checkData, error: checkError } = await supabaseClient
          .from('sct_initial')
          .select('id, user_id, created_at')
          .eq('user_id', user.id)
        
        console.log('Initial check:', { checkData, checkError })
        
        // If we can't find any record, this user hasn't done the assessment
        if (checkError) {
          console.error('Check error:', checkError)
          if (checkError.code === 'PGRST116') {
            toast.error('No assessment found. Please complete the initial assessment first.')
            return
          }
          throw checkError
        }
        
        if (!checkData || checkData.length === 0) {
          toast.error('No assessment found. Please complete the initial assessment first.')
          return
        }
        
        console.log('Found records for user:', checkData)
        
        // Now fetch the full data
        const { data, error } = await supabaseClient
          .from('sct_initial')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Supabase error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          
          // If it's a PGRST116 error (no rows found), that's different from auth issues
          if (error.code === 'PGRST116') {
            console.log('No sct_initial record found for user')
            toast.error('No assessment found. Please complete the initial assessment first.')
            return
          }
          
          throw error
        }

        // Save the sct_initial_id
        if (data && data.id) {
          setSctInitialId(data.id)
        }

        console.log("SCT Initial data:", data);
        
        // Handle the nested questions structure
        let extractedQuestions: Question[] = [];
        
        if (data?.questions?.final_questions) {
          extractedQuestions = data.questions.final_questions;
        } else if (data?.questions?.questions) {
          extractedQuestions = data.questions.questions;
        } else if (Array.isArray(data?.questions)) {
          extractedQuestions = data.questions;
        }
        
        // Make sure each question has either expected_skills or skills converted to expected_skills format
        const processedQuestions = extractedQuestions.map(q => {
          // Ensure we have a proper question object
          if (!q || typeof q !== 'object') {
            console.warn('Invalid question format:', q);
            return q;
          }
          
          // Handle different skills formats
          let expectedSkills: string[] = [];
          
          // If q.expected_skills exists and is an array, use it directly
          if (q.expected_skills && Array.isArray(q.expected_skills)) {
            expectedSkills = q.expected_skills;
          } 
          // If q.skills exists, try to extract skill names
          else if (q.skills) {
            // Handle case where skills is an array of objects with name property
            if (Array.isArray(q.skills)) {
              expectedSkills = q.skills.map(s => 
                typeof s === 'object' && s !== null && 'name' in s ? s.name : 
                typeof s === 'string' ? s : 
                'Unknown Skill'
              );
            } 
            // Handle case where skills is an object (not in an array)
            else if (typeof q.skills === 'object' && q.skills !== null) {
              // If it has a 'name' property, treat it as a single skill
              if ('name' in q.skills) {
                expectedSkills = [q.skills.name];
              }
              // Otherwise, try to use all string values as skill names
              else {
                expectedSkills = Object.values(q.skills)
                  .filter(val => typeof val === 'string')
                  .map(val => val as string);
              }
            }
          }
          
          // Return a cleaned up question object with normalized skills representation
          return {
            ...q,
            expected_skills: expectedSkills.length > 0 ? expectedSkills : q.expected_skills || [],
            // Keep original skills property if it exists
            skills: q.skills
          };
        });
        
        setQuestions(processedQuestions);
        console.log("Processed questions:", processedQuestions);

        // Check if already submitted
        if (data?.answers) {
          setHasSubmitted(true)
          toast.info('You have already submitted your answers')
          
          // Check if baseline analysis exists and redirect if available
          try {
            const { data: baselineData } = await createClient()
              .from('baseline_skill_matrix')
              .select('id, status, gap_analysis_dashboard')
              .eq('sct_initial_id', data.id)
              .single()
            
            if (baselineData && baselineData.gap_analysis_dashboard) {
              // Redirect to gap analysis page
              toast.success('Redirecting to your gap analysis...')
              router.push(`/skill-gap-analysis/${baselineData.id}`)
              return
            } else if (baselineData && baselineData.status === 'pending') {
              // Analysis is still in progress
              toast.info('Your analysis is still being processed. Please check back in a few minutes.')
            }
          } catch (baselineError) {
            console.error('Error checking baseline:', baselineError)
            // Continue with normal flow if baseline check fails
          }
        }
      } catch (error) {
        console.error('Error fetching questions:', error)
        toast.error('Failed to load questions')
      } finally {
        setIsLoading(false)
        setIsCheckingExistingAnalysis(false)
      }
    }

    fetchQuestions()
  }, [])

  const handleAnswerChange = (answer: string) => {
    if (!questions || questions.length === 0) return

    setAnswers(prev => {
      const newAnswers = [...prev]
      const existingIndex = newAnswers.findIndex(a => a.questionId === questions[currentQuestionIndex].id)
      
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = { questionId: questions[currentQuestionIndex].id, answer }
      } else {
        newAnswers.push({ questionId: questions[currentQuestionIndex].id, answer })
      }
      
      return newAnswers
    })
  }

  const handleNext = () => {
    if (!questions || currentQuestionIndex >= questions.length - 1) return
    setCurrentQuestionIndex(prev => prev + 1)
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('Please sign in to submit answers')
      return
    }

    if (!questions || questions.length === 0) {
      toast.error('No questions available to submit')
      return
    }

    // Check if all questions are answered
    const allQuestionsAnswered = questions.every(question => 
      answers.find(answer => answer.questionId === question.id)?.answer.trim()
    )

    if (!allQuestionsAnswered) {
      toast.error('Please answer all questions before submitting')
      return
    }

    setIsSubmitting(true)

    try {
      // Submit answers to Supabase
      const { error } = await createClient()
        .from('sct_initial')
        .update({ answers: answers })
        .eq('user_id', userId)

      if (error) throw error

      setHasSubmitted(true)
      toast.success('Assessment submitted successfully!')

      if (onCompleted) {
        onCompleted()
      }
    } catch (error) {
      console.error('Error submitting answers:', error)
      toast.error('Failed to submit answers')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartGapAnalysis = async () => {
    if (!sctInitialId) {
      toast.error('No assessment ID found')
      return
    }

    setIsAnalyzing(true)
    
    try {
      // Create baseline first
      const baselineResponse = await fetch('/api/gap-analysis/check-baseline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sctInitialId }),
      })

      if (!baselineResponse.ok) {
        throw new Error('Failed to create baseline')
      }

      const baselineData = await baselineResponse.json()
      
      if (baselineData.baselineId) {
        router.push(`/skill-gap-analysis/${baselineData.baselineId}`)
      } else {
        throw new Error('No baseline ID returned')
      }
    } catch (error) {
      console.error('Error creating baseline:', error)
      toast.error('Failed to generate analysis. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (isLoading || isCheckingExistingAnalysis) {
    return (
      <div className={utils.cn("min-h-screen flex items-center justify-center", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
               style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <div>
            <h2 className={utils.cn(tw.text.primary, "text-xl font-medium")}>
              {isCheckingExistingAnalysis ? 'Checking Assessment Status' : 'Loading Assessment'}
            </h2>
            <p className={utils.cn(tw.text.secondary, "text-sm mt-2")}>
              {isCheckingExistingAnalysis 
                ? 'Verifying your current assessment progress...'
                : 'Preparing your personalized questions...'
              }
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!questions || questions.length === 0) {
    return (
      <div className={utils.cn("min-h-screen flex items-center justify-center", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md mx-auto p-8"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
               style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
          <div>
            <h2 className={utils.cn(tw.text.primary, "text-xl font-medium mb-2")}>
              No Questions Available
            </h2>
            <p className={utils.cn(tw.text.secondary, "text-sm leading-relaxed")}>
              We couldn't load your assessment questions. Please try refreshing the page or contact support if the issue persists.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className={utils.cn(
              "px-6 py-3 bg-blue-500 text-white rounded-2xl font-medium transition-all",
              "hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
            )}
          >
            Retry
          </button>
        </motion.div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)?.answer || ''
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Get skills to display for current question
  const getSkillsToDisplay = (question: Question): string[] => {
    if (question.expected_skills && Array.isArray(question.expected_skills)) {
      return question.expected_skills;
    }
    
    if (question.skills) {
      if (Array.isArray(question.skills)) {
        return question.skills.map(s => 
          typeof s === 'object' && s !== null && 'name' in s ? s.name : 
          typeof s === 'string' ? s : 
          'Unknown Skill'
        );
      } else if (typeof question.skills === 'object' && question.skills !== null) {
        if ('name' in question.skills) {
          return [question.skills.name];
        }
      }
    }
    
    return [];
  };

  // Get difficulty level styling and label
  const getDifficultyInfo = (question: Question) => {
    const difficulty = (question.difficulty || '').toLowerCase();
    const importance = question.importance?.toLowerCase() || '';
    
    // First check importance
    if (importance === 'high') {
      return { 
        color: 'rose', 
        label: 'Advanced',
        bgColor: 'bg-rose-500/15',
        textColor: 'text-rose-400',
        borderColor: 'border-rose-500/30'
      };
    } else if (importance === 'medium') {
      return { 
        color: 'amber', 
        label: 'Intermediate',
        bgColor: 'bg-amber-500/15',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30'
      };
    } else if (importance === 'low') {
      return { 
        color: 'emerald', 
        label: 'Beginner',
        bgColor: 'bg-emerald-500/15',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30'
      };
    }
    // If importance doesn't exist, fall back to difficulty
    else if (difficulty.includes('easy') || difficulty.includes('beginner') || difficulty === 'basic' || difficulty === 'fundamental' || difficulty === 'low') {
      return { 
        color: 'emerald', 
        label: 'Beginner',
        bgColor: 'bg-emerald-500/15',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30'
      };
    } else if (difficulty.includes('high') || difficulty.includes('hard') || difficulty.includes('advanced') || difficulty === 'expert' || difficulty === 'complex') {
      return { 
        color: 'rose', 
        label: 'Advanced',
        bgColor: 'bg-rose-500/15',
        textColor: 'text-rose-400',
        borderColor: 'border-rose-500/30'
      };
    } else if (difficulty.includes('medium') || difficulty.includes('intermediate') || difficulty === 'application' || difficulty === 'applied' || difficulty === 'moderate') {
      return { 
        color: 'amber', 
        label: 'Intermediate',
        bgColor: 'bg-amber-500/15',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30'
      };
    } else {
      // Default to Intermediate if neither importance nor difficulty are recognized
      return { 
        color: 'amber', 
        label: 'Intermediate',
        bgColor: 'bg-amber-500/15',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30'
      };
    }
  };

  const difficultyInfo = getDifficultyInfo(currentQuestion);

  if (hasSubmitted) {
    return (
      <div className={utils.cn("min-h-screen", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            {/* Success Header */}
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
                   style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h1 className={utils.cn(
                  'text-4xl sm:text-5xl font-light tracking-tight mb-4',
                  tw.text.primary
                )}>
                  Assessment Complete!
                </h1>
                <p className={utils.cn(
                  'text-lg font-light leading-relaxed max-w-2xl mx-auto',
                  tw.text.secondary
                )}>
                  Thank you for completing the technical assessment. Your responses have been submitted successfully.
                </p>
              </div>
            </div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-3xl backdrop-blur-xl mx-auto max-w-lg"
              style={{
                background: 'rgba(10, 10, 12, 0.7)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className={utils.cn(
                    tw.typography.monoNumbers,
                    tw.text.primary,
                    'text-3xl font-bold mb-1'
                  )}>
                    {questions.length}
                  </div>
                  <div className={utils.cn(tw.text.secondary, 'text-sm')}>
                    Questions Answered
                  </div>
                </div>
                <div className="text-center">
                  <div className={utils.cn(
                    tw.typography.monoNumbers,
                    tw.text.emerald,
                    'text-3xl font-bold mb-1'
                  )}>
                    100%
                  </div>
                  <div className={utils.cn(tw.text.secondary, 'text-sm')}>
                    Completion Rate
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div>
                <h2 className={utils.cn(tw.text.primary, "text-2xl font-medium mb-3")}>
                  What's Next?
                </h2>
                <p className={utils.cn(tw.text.secondary, "text-base leading-relaxed max-w-xl mx-auto")}>
                  Generate your personalized skill gap analysis to discover your strengths and areas for improvement.
                </p>
              </div>

              <button
                onClick={handleStartGapAnalysis}
                disabled={isAnalyzing}
                className={utils.cn(
                  "px-8 py-4 bg-blue-500 text-white rounded-2xl font-medium transition-all",
                  "hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-3 mx-auto"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5" />
                    Generate Skill Gap Analysis
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={utils.cn("min-h-screen", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header with Progress */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mb-8"
        >
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={utils.cn(tw.text.secondary, "text-sm font-medium")}>
                Progress
              </span>
              <span className={utils.cn(tw.text.primary, "text-sm font-medium")}>
                {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={utils.cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                currentQuestionIndex === 0
                  ? "text-gray-500 cursor-not-allowed"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Previous</span>
            </button>

            <div className="text-center px-6 py-2 rounded-xl bg-white/5 backdrop-blur-sm">
              <span className={utils.cn(tw.text.blue, "text-lg font-medium")}>
                Question {currentQuestionIndex + 1}
              </span>
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={utils.cn(
                  "flex items-center gap-2 px-6 py-2 rounded-xl transition-all",
                  "bg-emerald-500 text-white hover:bg-emerald-600",
                  "hover:shadow-lg hover:shadow-emerald-500/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Submitting...</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium">Submit</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className={utils.cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                  "text-gray-300 hover:text-white hover:bg-white/10"
                )}
              >
                <span className="text-sm font-medium">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 xl:gap-20"
        >
          {/* Question Panel */}
          <div className="space-y-6">
            <div className="p-6 sm:p-8 lg:p-10 rounded-3xl backdrop-blur-xl"
                 style={{
                   background: 'rgba(10, 10, 12, 0.7)',
                   backdropFilter: 'blur(20px)',
                 }}>
              
              {/* Question Header */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h2 className={utils.cn(
                      tw.text.primary,
                      'text-xl sm:text-2xl font-medium leading-relaxed'
                    )}>
                      {currentQuestion.question}
                    </h2>
                  </div>
                  <div className={utils.cn(
                    "px-3 py-1 rounded-full text-xs font-medium flex-shrink-0",
                    difficultyInfo.bgColor,
                    difficultyInfo.textColor
                  )}>
                    {difficultyInfo.label}
                  </div>
                </div>

                {/* Context */}
                {currentQuestion.context && (
                  <div className="p-4 rounded-2xl bg-white/5">
                    <p className={utils.cn(tw.text.secondary, "text-base leading-relaxed")}>
                      {currentQuestion.context}
                    </p>
                  </div>
                )}

                {/* Skills Tags */}
                {getSkillsToDisplay(currentQuestion).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getSkillsToDisplay(currentQuestion).map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-500/15 text-blue-400 rounded-full text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Instructions */}
              {currentQuestion.task_instruction && (
                <div className={utils.cn(
                  "p-4 rounded-2xl mt-6",
                  difficultyInfo.bgColor
                )}>
                  <div className="flex items-start gap-3">
                    <Lightbulb className={utils.cn("w-5 h-5 flex-shrink-0 mt-0.5", difficultyInfo.textColor)} />
                    <div>
                      <h4 className={utils.cn(tw.text.primary, "font-medium mb-2")}>
                        Task Instructions
                      </h4>
                      <p className={utils.cn(tw.text.secondary, "text-sm leading-relaxed")}>
                        {currentQuestion.task_instruction}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expected Behavior */}
              {currentQuestion.expected_behavior && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 mt-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className={utils.cn(tw.text.primary, "font-medium mb-2")}>
                        Expected Behavior
                      </h4>
                      <p className={utils.cn(tw.text.secondary, "text-sm leading-relaxed")}>
                        {currentQuestion.expected_behavior}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Code Block */}
              {(currentQuestion.code || currentQuestion.code_template) && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="w-5 h-5 text-blue-400" />
                    <h4 className={utils.cn(tw.text.primary, "font-medium")}>
                      {currentQuestion.code ? 'Code to Debug' : 'Code Template'}
                      {currentQuestion.language && ` (${currentQuestion.language})`}
                    </h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-900/50 relative overflow-hidden">
                    {currentQuestion.language && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                          {currentQuestion.language}
                        </span>
                      </div>
                    )}
                    <pre className={utils.cn(
                      "text-sm leading-relaxed overflow-x-auto font-mono whitespace-pre-wrap break-words",
                      tw.text.primary
                    )}>
                      <code>{currentQuestion.code || currentQuestion.code_template}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Input/Output Examples */}
              {(currentQuestion.input_example || currentQuestion.expected_output) && (
                <div className="grid grid-cols-1 gap-4 mt-6">
                  {currentQuestion.input_example && (
                    <div className="p-4 rounded-2xl bg-blue-500/10">
                      <h5 className={utils.cn(tw.text.primary, "font-medium mb-3 text-sm")}>
                        Input Example
                      </h5>
                      <div className="bg-gray-900/50 rounded-lg overflow-hidden">
                        <pre className={utils.cn(
                          "text-sm font-mono p-3 overflow-x-auto whitespace-pre-wrap break-words",
                          tw.text.primary
                        )}>
                          <code>{currentQuestion.input_example}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                  {currentQuestion.expected_output && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10">
                      <h5 className={utils.cn(tw.text.primary, "font-medium mb-3 text-sm")}>
                        Expected Output
                      </h5>
                      <div className="bg-gray-900/50 rounded-lg overflow-hidden">
                        <pre className={utils.cn(
                          "text-sm font-mono p-3 overflow-x-auto whitespace-pre-wrap break-words",
                          tw.text.primary
                        )}>
                          <code>{currentQuestion.expected_output}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Answer Panel */}
          <div className="space-y-6">
            <div className="p-6 sm:p-8 lg:p-10 rounded-3xl backdrop-blur-xl h-full"
                 style={{
                   background: 'rgba(10, 10, 12, 0.7)',
                   backdropFilter: 'blur(20px)',
                 }}>
              
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center gap-3">
                  <Edit3 className="w-5 h-5 text-blue-400" />
                  <h3 className={utils.cn(tw.text.primary, "text-lg font-medium")}>
                    Your Answer
                  </h3>
                </div>

                <div className="flex-1 flex flex-col">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className={utils.cn(
                      "w-full flex-1 min-h-[400px] p-5 rounded-2xl resize-none",
                      "bg-white/5 focus:bg-white/10 transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
                      tw.text.primary,
                      "placeholder:text-gray-500 text-base leading-relaxed"
                    )}
                    placeholder="Type your detailed answer here... Be specific and provide examples where possible."
                  />
                  
                  <div className="flex justify-between items-center mt-4 text-sm">
                    <span className={utils.cn(tw.text.secondary)}>
                      {currentAnswer ? `${currentAnswer.length} characters` : 'Start typing your response'}
                    </span>
                    {currentAnswer && (
                      <span className={utils.cn(tw.text.emerald, "flex items-center gap-1")}>
                        <CheckCircle className="w-4 h-4" />
                        Answered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
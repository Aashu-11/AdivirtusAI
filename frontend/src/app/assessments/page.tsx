'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import assessmentData from './questions.json'
import QuestionWrapper from '@/components/assessment/questions/QuestionWrapper'
import { colors, fonts, tw, components, animations, utils } from '@/config/design-system'
import { CheckCircle, Info, Loader2, Clock, BarChart3, ChevronLeft, ChevronRight, Send, Target } from 'lucide-react'

interface Answer {
  questionId: string
  value: any // Changed from 'string | string[]' to 'any' to handle complex objects
}

interface Question {
  id: string
  parameter?: string
  type: 'MCQ' | 'text' | 'image' | 'audio' | 'interactive'
  prompt: string
  options?: Array<{
    text: string
    value: any // Allow for complex value types
  }>
  media?: {
    type: string
    url: string
    alt: string
  }
  presentation?: string
  reasoning?: string // Additional property that might exist
}

interface AssessmentData {
  assessment: {
    title: string
    description: string
    questions: Question[]
    resources: Array<{
      id: string
      type: string
      url: string
      alt: string
      description: string
    }>
  }
}

export default function AssessmentPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  
  const router = useRouter()

  const questions = assessmentData.assessment.questions
  const totalQuestions = questions.length
  const estimatedTimePerQuestion = 60 // seconds

  // Redirect to onboarding-assessment-result if assessment is already submitted
  useEffect(() => {
    if (hasSubmitted) {
      router.push('/onboarding-assessment-result')
    }
  }, [hasSubmitted, router])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await createClient().auth.getSession()
      if (!session) {
        const currentPath = window.location.pathname
        router.push(`/auth/signin?redirect=${encodeURIComponent(currentPath)}`)
        return
      }
      setUser(session.user)

      // Check for existing assessment
      const { data: existingAssessment } = await createClient().from('lsa_assessment')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (existingAssessment) {
        setHasSubmitted(true)
      }

      setAuthChecked(true)
    }
    
    checkAuth()

    const { data: authListener } = createClient().auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/auth/signin')
        return
      }
      setUser(session.user)
      setAuthChecked(true)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (!startTime) {
      setStartTime(new Date())
    }

    const timer = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime])

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => {
      const existingAnswer = prev.find(a => a.questionId === questionId)
      if (existingAnswer) {
        return prev.map(a => a.questionId === questionId ? { ...a, value } : a)
      }
      return [...prev, { questionId, value }]
    })
  }

  const handleNext = () => {
    // Check if current question has been answered
    const currentQuestion = questions[currentQuestionIndex]
    const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)

    if (!currentAnswer || 
        currentAnswer.value === undefined || 
        currentAnswer.value === null || 
        (Array.isArray(currentAnswer.value) && currentAnswer.value.length === 0) || 
        (typeof currentAnswer.value === 'string' && currentAnswer.value.trim() === '')) {
      toast.error('Please answer the current question before proceeding')
      return
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to submit your assessment')
      return
    }

    // Check if all questions are answered
    const allQuestionsAnswered = questions.every(question => 
      answers.some(answer => 
        answer.questionId === question.id && 
        answer.value !== undefined && 
        answer.value !== null && 
        !(Array.isArray(answer.value) && answer.value.length === 0) &&
        !(typeof answer.value === 'string' && answer.value.trim() === '')
      )
    )

    if (!allQuestionsAnswered) {
      toast.error('Please answer all questions before submitting')
      return
    }

    try {
      setIsSubmitting(true)
      
      // First check if user has already submitted
      const { data: existingAssessment, error: checkError } = await createClient().from('lsa_assessment')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingAssessment) {
        toast.error('You have already submitted this assessment')
        setHasSubmitted(true)
        return
      }

      // Format answers as a proper JSONB object with more metadata
      const formattedAnswers = answers.reduce((acc, curr) => {
        const question = questions.find(q => q.id === curr.questionId);
        return {
          ...acc,
          [curr.questionId]: {
            value: curr.value,
            parameter: question?.parameter || 'unknown',
            questionType: question?.type || 'unknown',
            prompt: question?.prompt || 'unknown',
            timestamp: new Date().toISOString()
          }
        };
      }, {})

      console.log('Submitting formatted answers:', formattedAnswers);

      const submissionData = {
        user_id: user.id,
        answers: formattedAnswers,
        completed_at: new Date().toISOString(),
        time_taken: elapsedTime,
        is_completed: true,
        total_questions: totalQuestions,
        assessment_version: '1.0'
      }

      const { data, error: insertError } = await createClient().from('lsa_assessment')
        .insert([submissionData])
        .select()

      if (insertError) {
        console.error('Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details
        })
        throw new Error(`Failed to submit assessment: ${insertError.message}`)
      }

      console.log('Assessment submitted successfully:', data);
      
      // Create initial LSA result entry with pending status
      try {
        const lsaResult = await createClient().from('lsa_result').insert([{
          user_id: user.id,
          assessment_id: data?.[0]?.id,
          interpreted_result: {
            status: 'pending',
            creation_timestamp: new Date().toISOString()
          }
        }]).select();
        
        console.log('Created initial LSA result:', lsaResult);
        
        // Trigger the interpretation process
        const interpretResponse = await fetch('/api/assessments/interpret', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            assessmentId: data?.[0]?.id
          })
        });
        
        if (!interpretResponse.ok) {
          console.warn('Failed to trigger interpretation, but continuing with success flow');
        } else {
          const interpretResult = await interpretResponse.json();
          console.log('Interpretation triggered:', interpretResult);
        }
      } catch (resultError) {
        console.error('Failed to create initial LSA result or trigger interpretation:', resultError);
        // Non-blocking error - continue with success flow
      }
      
      setShowSuccessModal(true)
      setHasSubmitted(true)
      
      setTimeout(() => {
        router.push('/onboarding-assessment-result')
      }, 3000)

    } catch (error) {
      console.error('Submission error details:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit assessment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)
  const canProceed = currentAnswer && currentAnswer.value && 
    !(Array.isArray(currentAnswer.value) && currentAnswer.value.length === 0) &&
    !(typeof currentAnswer.value === 'string' && currentAnswer.value.trim() === '')
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  if (hasSubmitted) {
    // Show loading while redirecting
    return (
      <div className={utils.cn("min-h-screen flex items-center justify-center", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 p-8 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(10, 10, 12, 0.7)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
               style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
          <p className={utils.cn(tw.text.secondary, "text-base")}>Redirecting to results...</p>
        </motion.div>
      </div>
    )
  }

  if (!authChecked) {
    return (
      <div className={utils.cn("min-h-screen flex items-center justify-center", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 p-8 rounded-3xl backdrop-blur-xl"
          style={{
            background: 'rgba(10, 10, 12, 0.7)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
               style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
          <p className={utils.cn(tw.text.secondary, "text-base")}>Loading assessment...</p>
        </motion.div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className={utils.cn("min-h-screen", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8 mb-12"
        >
          {/* Title Section */}
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex-1">
                <h1 className={utils.cn(
                  'text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight mb-4',
                  tw.text.primary
                )}>
                  {assessmentData.assessment.title}
                </h1>
                <p className={utils.cn(
                  'text-lg font-light leading-relaxed max-w-5xl',
                  tw.text.secondary
                )}>
                  {assessmentData.assessment.description}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Progress Section */}
          <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl"
               style={{
                 background: 'rgba(10, 10, 12, 0.7)',
                 backdropFilter: 'blur(20px)',
               }}>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              {/* Progress Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                       style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className={utils.cn(tw.text.tertiary, "text-xs font-medium uppercase tracking-wider mb-1")}>
                      Progress
                    </div>
                    <div className={utils.cn(tw.text.primary, "text-lg font-medium")}>
                      Question <span className={tw.text.blue}>{currentQuestionIndex + 1}</span> of {totalQuestions}
                    </div>
                  </div>
                </div>
                
                {/* Time */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                       style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                    <Clock className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className={utils.cn(tw.text.tertiary, "text-xs font-medium uppercase tracking-wider mb-1")}>
                      Time Elapsed
                    </div>
                    <div className={utils.cn(tw.text.primary, "text-lg font-medium")}>
                      {formatTime(elapsedTime)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Stats */}
              <div className="text-left sm:text-right">
                <div className={utils.cn(tw.text.tertiary, "text-xs font-medium uppercase tracking-wider mb-1")}>
                  Completion
                </div>
                <div className={utils.cn(tw.text.primary, "text-2xl font-bold")}>
                  {Math.round(progress)}%
                </div>
                <div className={utils.cn(tw.text.secondary, "text-sm")}>
                  {totalQuestions - (currentQuestionIndex + 1)} remaining
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              
              {/* Question Indicators */}
              <div className="flex justify-between px-1">
                {Array.from({ length: Math.min(totalQuestions, 25) }).map((_, i) => (
                  <div
                    key={i}
                    className={utils.cn(
                      "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                      i < currentQuestionIndex ? 'bg-blue-400' : 
                      i === currentQuestionIndex ? 'bg-blue-300' : 'bg-gray-700'
                    )}
                  />
                ))}
                {totalQuestions > 25 && (
                  <span className={utils.cn(tw.text.tertiary, "text-xs")}>
                    +{totalQuestions - 25} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Question Section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <QuestionWrapper
              question={currentQuestion as any}
              answer={currentAnswer?.value}
              onAnswer={handleAnswer}
            />
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between gap-4"
        >
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={utils.cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all",
              currentQuestionIndex === 0
                ? "text-gray-500 cursor-not-allowed"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">Previous</span>
          </button>

          <div className="text-center px-6 py-2 rounded-xl bg-white/5 backdrop-blur-sm">
            <span className={utils.cn(tw.text.blue, "text-sm font-medium")}>
              {currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className={utils.cn(
                "flex items-center gap-3 px-8 py-3 rounded-2xl font-medium transition-all",
                canProceed && !isSubmitting
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Assessment</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={utils.cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all",
                canProceed
                  ? "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              )}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="max-w-md w-full p-8 rounded-3xl backdrop-blur-xl text-center space-y-6"
                style={{
                  background: 'rgba(10, 10, 12, 0.9)',
                  backdropFilter: 'blur(30px)',
                }}
              >
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
                     style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                
                <div>
                  <h3 className={utils.cn(tw.text.primary, "text-2xl font-medium mb-3")}>
                    Assessment Complete!
                  </h3>
                  <p className={utils.cn(tw.text.secondary, "leading-relaxed")}>
                    Your responses have been recorded and your personalized learning profile will be generated.
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl bg-blue-500/10">
                  <div className="flex items-center gap-3 justify-center">
                    <Info className="w-5 h-5 text-blue-400" />
                    <p className={utils.cn(tw.text.secondary, "text-sm")}>
                      Redirecting to results in a moment...
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 

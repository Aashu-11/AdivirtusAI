'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { tw, components, utils } from '@/config/design-system'
import { CheckCircle, Clock, AlertCircle, User, FileText, Shield, ArrowRight, RotateCcw } from 'lucide-react'

export default function OnboardingAssessmentResultPage() {
  const [user, setUser] = useState<any>(null)
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingForced, setProcessingForced] = useState(false)
  const [forcingProcess, setForcingProcess] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await createClient().auth.getSession()
      if (!session) {
        router.push('/auth/signin')
        return
      }
      
      setUser(session.user)
      
      try {
        // Fetch assessment data
        const { data: assessmentData, error: assessmentError } = await createClient()
          .from('lsa_assessment')
          .select(`
            *,
            lsa_result (*)
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          
        if (assessmentError) {
          throw assessmentError
        }
        
        setAssessmentData(assessmentData)
      } catch (error: any) {
        console.error('Error fetching data:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  // Add force process function
  const forceProcess = async () => {
    if (!user || !assessmentData || forcingProcess) return
    
    try {
      setForcingProcess(true)
      
      // Call the interpret API endpoint to force processing
      const response = await fetch('/api/assessments/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          assessmentId: assessmentData.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to force processing')
      }
      
      setProcessingForced(true)
      
      // Refresh the data after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error: any) {
      console.error('Error forcing process:', error)
      setError(error.message)
    } finally {
      setForcingProcess(false)
    }
  }
  
  // Determine interpretation status
  const getInterpretationStatus = () => {
    if (!assessmentData?.lsa_result?.length) return 'pending'
    
    const result = assessmentData.lsa_result[0]
    return result.interpreted_result?.status || 'pending'
  }
  
  const interpretationStatus = assessmentData ? getInterpretationStatus() : 'pending'
  
  if (loading) {
    return (
      <div className={utils.cn("min-h-screen flex items-center justify-center", tw.bg.primary)}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={utils.cn("w-12 h-12 rounded-full border-4 border-t-transparent", tw.text.blue)}
        />
      </div>
    )
  }
  
  return (
    <div className={utils.cn("min-h-screen p-4 sm:p-6 lg:p-8", tw.bg.primary)}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className={utils.cn(tw.typography.mainHeading, "mb-2")}>
            Assessment Results
          </h1>
          <p className={utils.cn(tw.typography.bodyText, "text-base")}>
            Your onboarding assessment has been completed
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Welcome Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={utils.cn(components.card.primary, "relative overflow-hidden")}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
              
              <div className="flex items-start gap-4">
                <div className={utils.cn(components.iconContainer.blue, "flex-shrink-0")}>
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className={utils.cn(tw.typography.sectionHeading, "mb-3")}>
                    Welcome, {user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className={utils.cn(tw.typography.bodyText, "leading-relaxed")}>
                    Thank you for completing your onboarding assessment. Our AI is analyzing your responses to create a personalized learning profile.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Assessment Results section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={utils.cn(components.card.primary, "relative overflow-hidden")}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -z-10"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className={utils.cn(components.iconContainer.blue, "w-8 h-8")}>
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className={tw.typography.sectionHeading}>Assessment Status</h3>
              </div>
              
              {error ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={utils.cn(
                    components.card.nested,
                    tw.bgAccent.rose,
                    tw.border.rose,
                    "mb-6"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={utils.cn(components.iconContainer.rose, "w-8 h-8 flex-shrink-0")}>
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={utils.cn(tw.text.rose, "font-medium mb-1")}>Error: {error}</p>
                      <p className={utils.cn(tw.typography.smallLabel, "leading-relaxed")}>
                        Please try refreshing the page or contact support if the issue persists.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}
              
              {interpretationStatus === 'pending' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={utils.cn(
                    components.card.nested,
                    tw.bgAccent.blue,
                    tw.border.blue,
                    "text-center py-8"
                  )}
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className={utils.cn(components.iconContainer.blue, "w-16 h-16 mb-4")}
                    >
                      <Clock className="w-8 h-8" />
                    </motion.div>
                    
                    <h4 className={utils.cn(tw.typography.cardHeading, tw.text.blue, "mb-2")}>
                      Processing your results...
                    </h4>
                    <p className={utils.cn(tw.typography.bodyText, "mb-6 max-w-sm")}>
                      This may take a few moments while our AI analyzes your responses.
                    </p>
                    
                    {/* Force Process Button */}
                    {processingForced ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={utils.cn(
                          components.card.interactive,
                          tw.bgAccent.emerald,
                          tw.border.emerald,
                          "px-4 py-3"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={utils.cn(components.iconContainer.emerald, "w-6 h-6")}>
                            <CheckCircle className="w-3 h-3" />
                          </div>
                          <span className={utils.cn(tw.text.emerald, "text-sm font-medium")}>
                            Processing forced! Page will refresh shortly...
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.button
                        onClick={forceProcess}
                        disabled={forcingProcess}
                        whileHover={{ scale: forcingProcess ? 1 : 1.02 }}
                        whileTap={{ scale: forcingProcess ? 1 : 0.98 }}
                        className={utils.cn(
                          "group relative px-6 py-3 rounded-xl font-medium overflow-hidden",
                          "transition-all duration-300 text-sm",
                          forcingProcess
                            ? "bg-blue-500/20 text-blue-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative flex items-center gap-2">
                          {forcingProcess ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </motion.div>
                              <span>Forcing Process...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-4 h-4" />
                              <span>Force Process</span>
                            </>
                          )}
                        </div>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ) : interpretationStatus === 'completed' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={utils.cn(
                    components.card.nested,
                    tw.bgAccent.emerald,
                    tw.border.emerald
                  )}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={utils.cn(components.iconContainer.emerald, "w-12 h-12")}>
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={utils.cn(tw.typography.cardHeading, tw.text.emerald)}>
                        Analysis Complete
                      </h4>
                      <p className={utils.cn(tw.typography.smallLabel, "mt-1")}>
                        Your learning profile has been generated
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Link 
                      href="/learning-profile"
                      className={utils.cn(
                        "group relative px-6 py-3 rounded-xl font-medium overflow-hidden",
                        "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
                        "text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/25",
                        "transition-all duration-300 text-sm"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative flex items-center gap-2">
                        <span>View Your Learning Profile</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={utils.cn(
                    components.card.nested,
                    tw.bgAccent.rose,
                    tw.border.rose,
                    "text-center py-6"
                  )}
                >
                  <div className="flex flex-col items-center">
                    <div className={utils.cn(components.iconContainer.rose, "w-12 h-12 mb-4")}>
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className={utils.cn(tw.text.rose, "font-medium mb-1")}>
                      There was an issue processing your assessment.
                    </p>
                    <p className={utils.cn(tw.typography.smallLabel)}>
                      Please contact support for assistance.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            {/* What's Next section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={utils.cn(components.card.primary, "relative overflow-hidden")}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -z-10"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className={utils.cn(components.iconContainer.amber, "w-8 h-8")}>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <h3 className={tw.typography.sectionHeading}>What's Next</h3>
              </div>
              
              <ul className="space-y-4">
                {[
                  {
                    number: "1",
                    title: "Review Your Learning Profile",
                    description: "Once processing is complete, review your learning profile to understand your learning style and preferences."
                  },
                  {
                    number: "2", 
                    title: "Explore Dashboard",
                    description: "Visit your dashboard to see personalized content recommendations based on your assessment."
                  },
                  {
                    number: "3",
                    title: "Complete Technical Assessment", 
                    description: "Take the technical assessment to further personalize your learning experience."
                  }
                ].map((item, index) => (
                  <motion.li
                    key={item.number}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className={utils.cn(components.iconContainer.blue, "w-8 h-8 flex-shrink-0 mt-0.5")}>
                      <span className={utils.cn(tw.typography.monoNumbers, "text-xs")}>
                        {item.number}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className={utils.cn(tw.typography.cardHeading, "mb-1")}>
                        {item.title}
                      </h4>
                      <p className={utils.cn(tw.typography.bodyText, "leading-relaxed")}>
                        {item.description}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={utils.cn(components.card.primary, "relative overflow-hidden")}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl -z-10"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className={utils.cn(components.iconContainer.blue, "w-8 h-8")}>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <h3 className={tw.typography.sectionHeading}>Quick Actions</h3>
              </div>
              
              <div className="space-y-3">
                <Link 
                  href="/learning-profile"
                  className={utils.cn(
                    components.card.interactive,
                    tw.hover.blue,
                    "group flex items-center gap-3"
                  )}
                >
                  <div className={utils.cn(components.iconContainer.blue, "w-8 h-8 flex-shrink-0")}>
                    <User className="w-4 h-4" />
                  </div>
                  <span className={utils.cn(tw.typography.cardHeading, "group-hover:text-blue-400 transition-colors")}>
                    Learning Profile
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300 ml-auto" />
                </Link>
                
                <Link 
                  href="/technical-assessment"
                  className={utils.cn(
                    components.card.interactive,
                    tw.hover.emerald,
                    "group flex items-center gap-3"
                  )}
                >
                  <div className={utils.cn(components.iconContainer.emerald, "w-8 h-8 flex-shrink-0")}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className={utils.cn(tw.typography.cardHeading, "group-hover:text-emerald-400 transition-colors")}>
                    Technical Assessment
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300 ml-auto" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 
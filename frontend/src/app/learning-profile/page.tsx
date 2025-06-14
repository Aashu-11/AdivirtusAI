'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { InterpretedResult } from '@/types/assessment'
import { tw, components, fonts, utils } from '@/config/design-system'
import { Brain, BookOpen, Target, ArrowRight, Loader2, AlertTriangle, PlayCircle, Sparkles, User, TrendingUp } from 'lucide-react'

// Import the new components
import LearningStyles from '@/components/LearningProfile/LearningStyles'
import LearningRecommendations from '@/components/LearningProfile/LearningRecommendations'
import LearningVelocity from '@/components/LearningProfile/LearningVelocity'
import FeedbackPreferences from '@/components/LearningProfile/FeedbackPreferences'
import EnhancedLearningProfile from '@/components/LearningProfile/EnhancedLearningProfile'

export default function LearningProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [interpretationData, setInterpretationData] = useState<InterpretedResult | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/signin')
        return
      }
      setUser(session.user)
      
      // Fetch interpretation results
      try {
        const { data, error } = await supabase
          .from('lsa_result')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          
        if (error) throw error
        
        if (data && data.interpreted_result && data.interpreted_result.status === 'completed') {
          setInterpretationData(data.interpreted_result)
        }
      } catch (err) {
        console.error('Error fetching interpretation data:', err)
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className={utils.cn("min-h-screen flex items-center justify-center", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
               style={{ 
                 background: 'rgba(59, 130, 246, 0.15)',
                 backdropFilter: 'blur(20px)' 
               }}>
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
          <div>
            <h2 className={utils.cn(tw.text.primary, "text-2xl font-light mb-3")}>
              Loading Your Profile
            </h2>
            <p className={utils.cn(tw.text.secondary, "text-base leading-relaxed")}>
              Retrieving your personalized learning insights...
            </p>
          </div>
        </motion.div>
      </div>
    )
  }
  
  if (!interpretationData) {
    return (
      <div className={utils.cn("min-h-screen", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          
          {/* Enhanced Header with animated background */}
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16 relative"
          >
            <div className="absolute inset-0 -z-10">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-full h-full rounded-full"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
                }}
              />
            </div>
            
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <h1 className={utils.cn(
                'text-5xl sm:text-6xl lg:text-7xl font-extralight tracking-tight mb-6',
                tw.text.primary,
                'bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent'
              )}>
                Learning Profile
              </h1>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <p className={utils.cn(
                  'text-xl font-light leading-relaxed max-w-3xl',
                  tw.text.secondary
                )}>
                  Discover your unique learning patterns and personalized insights
                </p>
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-5xl mx-auto"
          >
            <div className="p-10 sm:p-16 rounded-3xl backdrop-blur-xl text-center space-y-12 relative overflow-hidden"
                 style={{
                   background: 'rgba(10, 10, 12, 0.7)',
                   backdropFilter: 'blur(20px)',
                 }}>
              
              {/* Animated background pattern */}
              <div className="absolute inset-0 -z-10">
                <motion.div 
                  animate={{ 
                    background: [
                      'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                      'radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
                      'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
                      'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
                    ]
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full h-full"
                />
              </div>
              
              {/* Icon and Status */}
              <div className="space-y-8">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="w-32 h-32 rounded-3xl flex items-center justify-center mx-auto relative"
                  style={{ background: 'rgba(239, 68, 68, 0.15)' }}
                >
                  <AlertTriangle className="w-16 h-16 text-rose-400" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-3xl"
                    style={{ border: '2px solid rgba(239, 68, 68, 0.2)' }}
                  />
                </motion.div>
                
                <div>
                  <h2 className={utils.cn(
                    tw.text.primary,
                    'text-4xl sm:text-5xl font-extralight mb-6'
                  )}>
                    Profile Not Available
                  </h2>
                  <p className={utils.cn(
                    tw.text.secondary,
                    'text-xl leading-relaxed max-w-3xl mx-auto'
                  )}>
                    Your learning profile hasn't been generated yet. Complete our comprehensive assessment to unlock your personalized learning insights and discover how you learn best.
                  </p>
                </div>
              </div>

              {/* Enhanced Benefits Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
                {[
                  {
                    icon: Brain,
                    title: "Learning Style Analysis",
                    description: "Discover how you learn best with detailed cognitive insights and personalized strategies",
                    color: "blue",
                    delay: 0.5
                  },
                  {
                    icon: BookOpen,
                    title: "Content Recommendations",
                    description: "Get personalized learning materials, study strategies, and optimal content formats",
                    color: "emerald",
                    delay: 0.6
                  },
                  {
                    icon: Target,
                    title: "Learning Velocity",
                    description: "Understand your optimal learning pace, patterns, and personalized feedback preferences",
                    color: "purple",
                    delay: 0.7
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: benefit.delay }}
                    className="p-8 rounded-2xl text-center group hover:scale-105 transition-all duration-300"
                    style={{ 
                      background: benefit.color === 'blue' ? 'rgba(59, 130, 246, 0.08)' :
                                  benefit.color === 'emerald' ? 'rgba(16, 185, 129, 0.08)' :
                                  'rgba(168, 85, 247, 0.08)'
                    }}
                  >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300"
                         style={{ 
                           background: benefit.color === 'blue' ? 'rgba(59, 130, 246, 0.15)' :
                                       benefit.color === 'emerald' ? 'rgba(16, 185, 129, 0.15)' :
                                       'rgba(168, 85, 247, 0.15)'
                         }}>
                      <benefit.icon className={`w-8 h-8 ${
                        benefit.color === 'blue' ? 'text-blue-400' :
                        benefit.color === 'emerald' ? 'text-emerald-400' :
                        'text-purple-400'
                      }`} />
                    </div>
                    <h3 className={utils.cn(tw.text.primary, "font-medium text-lg mb-4")}>
                      {benefit.title}
                    </h3>
                    <p className={utils.cn(tw.text.secondary, "text-sm leading-relaxed")}>
                      {benefit.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Enhanced Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-6"
              >
                <button
                  onClick={() => router.push('/assessments')}
                  className={utils.cn(
                    "group relative flex items-center gap-4 px-10 py-5 mx-auto",
                    "bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-medium transition-all duration-300",
                    "hover:from-blue-600 hover:to-purple-700 hover:shadow-2xl hover:shadow-blue-500/25",
                    "hover:scale-105 active:scale-95 overflow-hidden"
                  )}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <PlayCircle className="w-6 h-6 relative z-10" />
                  <span className="text-lg relative z-10">Start Learning Assessment</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2 relative z-10" />
                </button>
                
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className={utils.cn(tw.text.tertiary)}>15-20 minutes</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className={utils.cn(tw.text.tertiary)}>Instant results</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span className={utils.cn(tw.text.tertiary)}>Personalized insights</span>
                  </div>
                </div>
              </motion.div>

              {/* Additional Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="pt-8"
                style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <p className={utils.cn(tw.text.tertiary, "text-sm leading-relaxed")}>
                  Already completed the assessment? Your results may still be processing. 
                  <br />
                  Please check back in a few minutes or contact support if this persists.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Extract data for rendering with null checks
  const { learnerProfile, contentRecommendations } = interpretationData
  if (!learnerProfile || !contentRecommendations) {
    return (
      <div className={utils.cn("min-h-screen", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
                 style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
              <AlertTriangle className="w-10 h-10 text-rose-400" />
            </div>
            <div>
              <h1 className={utils.cn(
                tw.text.primary,
                'text-3xl sm:text-4xl font-light mb-4'
              )}>
                Data Processing Error
              </h1>
              <p className={utils.cn(
                tw.text.secondary,
                'text-lg leading-relaxed max-w-2xl mx-auto'
              )}>
                Unable to load your learning profile data. This might be a temporary issue.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className={utils.cn(
                "px-6 py-3 bg-blue-500 text-white rounded-2xl font-medium transition-all",
                "hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
              )}
            >
              Try Again
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  const { learningStyles, velocityPrediction } = learnerProfile

  return (
    <div className={utils.cn("min-h-screen", tw.bg.primary)} style={{ fontFamily: fonts.primary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-16 relative"
        >
          <div className="relative">
            <motion.h1 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className={utils.cn(
                'text-5xl sm:text-6xl lg:text-7xl font-extralight tracking-tight mb-4',
                tw.text.primary,
                'bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent'
              )}
            >
              Learning Profile
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3"
            >
              <User className="w-5 h-5 text-blue-400" />
              <p className={utils.cn(
                'text-xl font-light leading-relaxed',
                tw.text.secondary
              )}>
                Your personalized learning insights
              </p>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 lg:mt-0"
          >
            <div className="flex items-center gap-4 p-4 rounded-2xl backdrop-blur-xl"
                 style={{ background: 'rgba(10, 10, 12, 0.4)' }}>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className={utils.cn(tw.text.secondary, "text-sm")}>
                Profile Generated
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </motion.div>
        </motion.div>
        
        {/* Enhanced Component Sections with staggered animations */}
        <div className="space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <LearningStyles learningStyles={learningStyles} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LearningRecommendations contentRecommendations={contentRecommendations} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <LearningVelocity velocityPrediction={velocityPrediction} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <FeedbackPreferences 
              contentRecommendations={contentRecommendations} 
              velocityPrediction={velocityPrediction} 
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <EnhancedLearningProfile interpretationData={interpretationData} />
          </motion.div>
        </div>
      </div>
    </div>
  )
} 
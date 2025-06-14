'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { tw, components, fonts, utils } from '@/config/design-system'
import { Eye, Volume2, Hand, BookOpen, Sparkles } from 'lucide-react'

interface LearningStyle {
  primary?: string
  secondary?: string
  scores?: Record<string, number>
  is_multimodal?: boolean
}

interface LearningStylesProps {
  learningStyles: LearningStyle | undefined
}

// Helper function to format percentage
const formatPercentage = (value: number) => {
  return `${Math.round(value * 100)}%`
}

// Helper function to get learning style description
function getLearningStyleDescription(style: string): string {
  const descriptions: Record<string, string> = {
    'Visual': 'You learn best through visual aids, diagrams, charts, and written instructions. Visual organization and color-coding help you process information effectively.',
    'Auditory': 'You learn best through listening, discussions, and verbal explanations. You benefit from hearing information and talking through concepts.',
    'Kinesthetic': 'You learn best through hands-on experiences, movement, and physical activity. You prefer to learn by doing and touching.',
    'ReadWrite': 'You learn best through reading and writing activities. You prefer text-based information, note-taking, and written assignments.'
  }
  return descriptions[style] || 'Learning style preference identified through assessment analysis.'
}

export default function LearningStyles({ learningStyles }: LearningStylesProps) {
  return (
    <div className="mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <h2 className={utils.cn(
            'text-3xl sm:text-4xl font-extralight tracking-tight',
            tw.text.primary
          )} style={{ fontFamily: fonts.primary }}>
            Learning Styles
          </h2>
        </div>
        <p className={utils.cn(tw.text.secondary, "text-lg font-light leading-relaxed")}>
          Discover your unique cognitive preferences and learning patterns
        </p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-8"
        style={{ fontFamily: fonts.primary }}
      >
        {/* Primary and Secondary Styles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl backdrop-blur-xl group hover:scale-105 transition-all duration-300"
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                   style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={utils.cn(tw.text.tertiary, "text-sm font-medium mb-1 uppercase tracking-wider")}>
                  Primary Learning Style
                </div>
                <div className={utils.cn(tw.text.primary, "text-2xl font-light mb-3")}>
                  {learningStyles?.primary || 'N/A'}
                </div>
              </div>
            </div>
            <p className={utils.cn(tw.text.secondary, "leading-relaxed")}>
              {getLearningStyleDescription(learningStyles?.primary || '')}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-3xl backdrop-blur-xl group hover:scale-105 transition-all duration-300"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                   style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <Volume2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={utils.cn(tw.text.tertiary, "text-sm font-medium mb-1 uppercase tracking-wider")}>
                  Secondary Learning Style
                </div>
                <div className={utils.cn(tw.text.primary, "text-2xl font-light mb-3")}>
                  {learningStyles?.secondary || 'N/A'}
                </div>
              </div>
            </div>
            <p className={utils.cn(tw.text.secondary, "leading-relaxed")}>
              {getLearningStyleDescription(learningStyles?.secondary || '')}
            </p>
          </motion.div>
        </div>
        
        {/* Learning Style Distribution */}
        {learningStyles?.scores && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-10 rounded-3xl backdrop-blur-xl"
            style={{
              background: 'rgba(10, 10, 12, 0.7)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="text-center mb-10">
              <h4 className={utils.cn(tw.text.primary, "text-2xl font-light mb-3")}>
                Learning Style Distribution
              </h4>
              <p className={utils.cn(tw.text.secondary, "text-base leading-relaxed")}>
                Understanding your cognitive preferences across different learning modalities
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              {Object.entries(learningStyles.scores).map(([style, score], index) => {
                const styleIcons: Record<string, React.ReactElement> = {
                  'Visual': <Eye className="w-7 h-7" />,
                  'Auditory': <Volume2 className="w-7 h-7" />,
                  'Kinesthetic': <Hand className="w-7 h-7" />,
                  'ReadWrite': <BookOpen className="w-7 h-7" />
                };
                
                const styleColors: Record<string, string> = {
                  'Visual': 'text-blue-400',
                  'Auditory': 'text-emerald-400',
                  'Kinesthetic': 'text-amber-400',
                  'ReadWrite': 'text-rose-400'
                };
                
                const styleBgColors: Record<string, string> = {
                  'Visual': 'from-blue-500 to-blue-600',
                  'Auditory': 'from-emerald-500 to-emerald-600',
                  'Kinesthetic': 'from-amber-500 to-amber-600',
                  'ReadWrite': 'from-rose-500 to-rose-600'
                };
                
                const percentage = Math.round((score as number) * 100);
                
                return (
                  <motion.div 
                    key={style} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center group"
                  >
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                           style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <div className={styleColors[style] || 'text-gray-400'}>
                          {styleIcons[style] || <span className="font-mono text-lg">{style[0]}</span>}
                        </div>
                      </div>
                      
                      {/* Animated circular progress */}
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="absolute inset-0 transform -rotate-90" width="80" height="80">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="8"
                            fill="none"
                          />
                          <motion.circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke={`url(#gradient-${style})`}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={226}
                            initial={{ strokeDashoffset: 226 }}
                            animate={{ strokeDashoffset: 226 - (226 * (score as number)) }}
                            transition={{ duration: 1.5, delay: 0.7 + index * 0.1, ease: "easeOut" }}
                          />
                          <defs>
                            <linearGradient id={`gradient-${style}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" className={styleColors[style]?.replace('text-', 'stop-')} />
                              <stop offset="100%" className={styleColors[style]?.replace('text-', 'stop-').replace('400', '600')} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={utils.cn(tw.text.primary, "text-lg font-bold")}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className={utils.cn(tw.text.primary, "font-medium text-lg mb-2")}>
                        {style}
                      </div>
                      <div className="w-24 h-2 rounded-full overflow-hidden mx-auto"
                           style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                        <motion.div 
                          className={`h-full bg-gradient-to-r ${styleBgColors[style] || 'from-gray-500 to-gray-600'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Learning Style Compatibility */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="p-6 rounded-2xl"
              style={{ background: 'rgba(255, 255, 255, 0.03)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={utils.cn(tw.text.primary, "font-medium text-lg mb-1")}>
                    Learning Style Flexibility
                  </div>
                  <div className={utils.cn(tw.text.secondary, "text-sm")}>
                    {learningStyles.is_multimodal ? 
                      'You adapt well to different learning formats and environments' : 
                      'You have strong preferences for specific learning approaches'
                    }
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-32 rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-500 to-rose-500 overflow-hidden">
                    <motion.div
                      className="h-full bg-white/20"
                      initial={{ width: 0 }}
                      animate={{ width: learningStyles.is_multimodal ? '100%' : '60%' }}
                      transition={{ duration: 1.5, delay: 1 }}
                    />
                  </div>
                  <span className={utils.cn(
                    tw.text.primary, 
                    "text-sm font-semibold px-3 py-1 rounded-full",
                    learningStyles.is_multimodal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  )}>
                    {learningStyles.is_multimodal ? 'Multimodal' : 'Specialized'}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
} 
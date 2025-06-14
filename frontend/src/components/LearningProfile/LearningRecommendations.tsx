'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { tw, components, fonts, utils } from '@/config/design-system'
import { Lightbulb, Settings, Users, Volume2, Eye, Hand, BookOpen, Sparkles } from 'lucide-react'

interface ContentRecommendations {
  contentFormats?: {
    recommended?: string[]
    alternative?: string[]
  }
  environment?: Record<string, string>
}

interface LearningRecommendationsProps {
  contentRecommendations: ContentRecommendations | undefined
}

// Helper function to convert camelCase to Title Case with spaces
const formatLabel = (str: string) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (firstChar) => firstChar.toUpperCase())
}

export default function LearningRecommendations({ contentRecommendations }: LearningRecommendationsProps) {
  return (
    <div className="mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-6 h-6 text-emerald-400" />
          <h2 className={utils.cn(
            'text-3xl sm:text-4xl font-extralight tracking-tight',
            tw.text.primary
          )} style={{ fontFamily: fonts.primary }}>
            Learning Recommendations
          </h2>
        </div>
        <p className={utils.cn(tw.text.secondary, "text-lg font-light leading-relaxed")}>
          Personalized strategies and optimal formats tailored to your learning style
        </p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-12"
        style={{ fontFamily: fonts.primary }}
      >
        {/* Content Formats Section */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h3 className={utils.cn(
              tw.text.primary, 
              "text-2xl font-light mb-3 flex items-center gap-3"
            )}>
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              Optimal Content Formats
            </h3>
            <p className={utils.cn(tw.text.secondary, "text-base leading-relaxed")}>
              Choose content formats that align with your learning preferences
            </p>
          </motion.div>

          {contentRecommendations?.contentFormats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
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
                    <Eye className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={utils.cn(tw.text.primary, "text-xl font-medium mb-2")}>
                      Recommended Formats
                    </h4>
                    <p className={utils.cn(tw.text.secondary, "text-sm")}>
                      Best suited to your learning style
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {contentRecommendations.contentFormats.recommended?.map((format, index) => (
                    <motion.span 
                      key={format}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 hover:scale-105"
                      style={{ 
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981'
                      }}
                    >
                      {format.replace(/-/g, ' ')}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="p-8 rounded-3xl backdrop-blur-xl group hover:scale-105 transition-all duration-300"
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                       style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                    <BookOpen className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={utils.cn(tw.text.primary, "text-xl font-medium mb-2")}>
                      Alternative Formats
                    </h4>
                    <p className={utils.cn(tw.text.secondary, "text-sm")}>
                      Additional options to explore
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {contentRecommendations.contentFormats.alternative?.map((format, index) => (
                    <motion.span 
                      key={format}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 hover:scale-105"
                      style={{ 
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6'
                      }}
                    >
                      {format.replace(/-/g, ' ')}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Environment Preferences Section */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h3 className={utils.cn(
              tw.text.primary, 
              "text-2xl font-light mb-3 flex items-center gap-3"
            )}>
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              Optimal Learning Environment
            </h3>
            <p className={utils.cn(tw.text.secondary, "text-base leading-relaxed")}>
              Environmental conditions that maximize your learning potential
            </p>
          </motion.div>

          {contentRecommendations?.environment && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-10 rounded-3xl backdrop-blur-xl"
              style={{
                background: 'rgba(10, 10, 12, 0.7)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(contentRecommendations.environment).map(([key, value], index) => {
                  // Define enhanced icons for different environment settings
                  const environmentIcons: Record<string, React.ReactElement> = {
                    'noise': <Volume2 className="w-7 h-7" />,
                    'lighting': (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    ),
                    'arrangement': <Settings className="w-7 h-7" />,
                    'temperature': (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    ),
                    'collaboration': <Users className="w-7 h-7" />,
                    'setting': (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )
                  };
                  
                  // Default icon if no specific one is found
                  const defaultIcon = <Sparkles className="w-7 h-7" />;
                  
                  const iconKey = key.toLowerCase();
                  const icon = environmentIcons[iconKey] || defaultIcon;
                  
                  // Color schemes for different environment types
                  const getColorScheme = (setting: string) => {
                    const colors = [
                      { bg: 'rgba(59, 130, 246, 0.08)', icon: 'text-blue-400' },
                      { bg: 'rgba(16, 185, 129, 0.08)', icon: 'text-emerald-400' },
                      { bg: 'rgba(168, 85, 247, 0.08)', icon: 'text-purple-400' },
                      { bg: 'rgba(245, 158, 11, 0.08)', icon: 'text-amber-400' },
                      { bg: 'rgba(239, 68, 68, 0.08)', icon: 'text-rose-400' },
                      { bg: 'rgba(99, 102, 241, 0.08)', icon: 'text-indigo-400' }
                    ];
                    return colors[index % colors.length];
                  };
                  
                  const strValue = String(value).replace(/-/g, ' ');
                  const colorScheme = getColorScheme(strValue.toLowerCase());
                  
                  return (
                    <motion.div 
                      key={key} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="p-6 rounded-2xl transition-all duration-300 hover:scale-105 group"
                      style={{ background: colorScheme.bg }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                             style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                          <div className={colorScheme.icon}>
                            {icon}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className={utils.cn(tw.text.primary, "font-medium text-lg mb-1")}>
                            {formatLabel(key)}
                          </h5>
                          <p className={utils.cn(tw.text.secondary, "text-sm capitalize leading-relaxed")}>
                            {strValue}
                          </p>
                        </div>
                      </div>
                      
                      {/* Optional progress or indicator */}
                      <div className="w-full h-1 rounded-full overflow-hidden"
                           style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                        <motion.div
                          className="h-full bg-gradient-to-r from-white/30 to-white/10"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
} 
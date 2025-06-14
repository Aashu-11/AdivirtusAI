'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { tw, components, fonts, utils } from '@/config/design-system'

interface ContentRecommendations {
  feedback?: Record<string, string>
}

interface VelocityPrediction {
  measurementPreference?: string
}

interface FeedbackPreferencesProps {
  contentRecommendations: ContentRecommendations | undefined
  velocityPrediction: VelocityPrediction | undefined
}

// Helper function to format labels for better readability
function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

export default function FeedbackPreferences({ contentRecommendations, velocityPrediction }: FeedbackPreferencesProps) {
  if (!contentRecommendations?.feedback) return null

  return (
    <div className="mb-6">
      <h2 className={utils.cn(tw.typography.sectionHeading, "mb-4")} style={{ fontFamily: fonts.primary }}>Feedback Preferences</h2>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ fontFamily: fonts.primary }}
      >
        <div className={components.card.primary}>
          <h4 className={utils.cn(tw.text.primary, "text-sm font-semibold mb-4 tracking-tight")}>Optimal Feedback Approach</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.entries(contentRecommendations.feedback).map(([key, value]) => {
              // Background color based on the feedback type
              const getBgColor = (feedback: string) => {
                // Use consistent nested background for all items
                return utils.cn(components.card.nested, "transition-all duration-300");
              };
              
              const strValue = String(value).replace(/-/g, ' ');
              const bgColorClass = getBgColor(strValue.toLowerCase());
              
              return (
                <div key={key} className={utils.cn("rounded-lg p-4 transition-all duration-300", bgColorClass)}>
                  <div className="flex items-center mb-2">
                    <span className={utils.cn("text-sm font-semibold", tw.text.primary)}>{formatLabel(key)}</span>
                  </div>
                  <p className={utils.cn("text-sm opacity-90 capitalize", tw.text.secondary)}>{strValue}</p>
                </div>
              );
            })}
          </div>
          
          {velocityPrediction?.measurementPreference && (
            <div className={utils.cn("rounded-lg p-4", tw.bg.nested)}>
              <div className="flex items-start">
                <div className="mt-1 mr-3">
                  <svg className={utils.cn("w-5 h-5", tw.text.emerald)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className={utils.cn(tw.text.emerald, "text-sm font-semibold mb-2 tracking-tight")}>Preferred Progress Measurement</h5>
                  <div className={utils.cn(tw.text.primary, "capitalize font-semibold mb-2")}>{velocityPrediction.measurementPreference}</div>
                  <p className={utils.cn(tw.typography.bodyText, "mb-4")}>
                    {velocityPrediction.measurementPreference === 'objective' ? 
                      'You prefer tracking concrete completion of specific objectives and milestones, with clear metrics of success.' :
                    velocityPrediction.measurementPreference === 'applied' ? 
                      'You evaluate progress by your ability to apply knowledge in real scenarios and practical contexts.' :
                    velocityPrediction.measurementPreference === 'conceptual' ?
                      'You measure progress by your ability to explain concepts to others and communicate understanding clearly.' :
                      'You gauge progress by your personal confidence and comfort level with the material.'}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className={utils.cn("rounded-lg py-2 px-3 text-center text-xs transition-all duration-200", 
                      velocityPrediction.measurementPreference === 'objective' 
                        ? utils.cn(tw.bgAccent.emerald, tw.text.emerald)
                        : utils.cn(tw.bg.card, tw.text.tertiary, tw.hover.subtle)
                    )}>
                      Objective
                    </div>
                    <div className={utils.cn("rounded-lg py-2 px-3 text-center text-xs transition-all duration-200", 
                      velocityPrediction.measurementPreference === 'applied' 
                        ? utils.cn(tw.bgAccent.blue, tw.text.blue)
                        : utils.cn(tw.bg.card, tw.text.tertiary, tw.hover.subtle)
                    )}>
                      Applied
                    </div>
                    <div className={utils.cn("rounded-lg py-2 px-3 text-center text-xs transition-all duration-200", 
                      velocityPrediction.measurementPreference === 'conceptual' 
                        ? utils.cn(tw.bgAccent.amber, tw.text.amber)
                        : utils.cn(tw.bg.card, tw.text.tertiary, tw.hover.subtle)
                    )}>
                      Conceptual
                    </div>
                    <div className={utils.cn("rounded-lg py-2 px-3 text-center text-xs transition-all duration-200", 
                      velocityPrediction.measurementPreference === 'subjective' 
                        ? utils.cn(tw.bgAccent.rose, tw.text.rose)
                        : utils.cn(tw.bg.card, tw.text.tertiary, tw.hover.subtle)
                    )}>
                      Subjective
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
} 
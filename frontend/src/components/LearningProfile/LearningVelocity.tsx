'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { tw, components, fonts, utils } from '@/config/design-system'

interface VelocityPrediction {
  timeMultiplier: number
  baseVelocity: number
  confidenceLevel: number
  pattern?: string
  phaseDurations?: {
    initial: number
    midpoint: number
    completion: number
  }
  phaseVelocity?: {
    initial: number
    midpoint: number
    completion: number
  }
  retentionProfile?: {
    shortTerm: number
    mediumTerm: number
    longTerm: number
  }
  probabilisticRanges?: Record<string, any>
}

interface LearningVelocityProps {
  velocityPrediction: VelocityPrediction | undefined
}

// Helper function to format percentage
const formatPercentage = (value: number) => {
  return `${Math.round(value * 100)}%`
}

export default function LearningVelocity({ velocityPrediction }: LearningVelocityProps) {
  if (!velocityPrediction) return null

  return (
    <div className="mb-6">
      <h2 className={utils.cn(tw.typography.sectionHeading, "mb-4")} style={{ fontFamily: fonts.primary }}>Learning Velocity & Feedback</h2>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-8"
        style={{ fontFamily: fonts.primary }}
      >
        {/* Learning Velocity Profile Section */}
        <div>
          <h3 className={utils.cn(tw.typography.cardHeading, "mb-4 tracking-tight")}>Learning Velocity Profile</h3>
          
          {/* Learning Phase Distribution */}
          {velocityPrediction.phaseDurations && (
            <div className={utils.cn(components.card.primary, "mb-6")}>
              <h4 className={utils.cn(tw.text.primary, "text-sm font-semibold mb-4 tracking-tight")}>Learning Phase Distribution</h4>
              <div className="mb-6">
                <div className="w-full h-12 rounded-lg flex overflow-hidden shadow-inner">
                  <div 
                    className="bg-blue-500 text-xs flex items-center justify-center text-white font-semibold hover:bg-blue-600 transition-all duration-300" 
                    style={{ width: `${velocityPrediction.phaseDurations.initial}%` }}
                  >
                    <span style={{ fontFamily: fonts.mono }}>{velocityPrediction.phaseDurations.initial}%</span>
                  </div>
                  <div 
                    className="bg-emerald-500 text-xs flex items-center justify-center text-white font-semibold hover:bg-emerald-600 transition-all duration-300" 
                    style={{ width: `${velocityPrediction.phaseDurations.midpoint}%` }}
                  >
                    <span style={{ fontFamily: fonts.mono }}>{velocityPrediction.phaseDurations.midpoint}%</span>
                  </div>
                  <div 
                    className="bg-amber-500 text-xs flex items-center justify-center text-white font-semibold hover:bg-amber-600 transition-all duration-300" 
                    style={{ width: `${velocityPrediction.phaseDurations.completion}%` }}
                  >
                    <span style={{ fontFamily: fonts.mono }}>{velocityPrediction.phaseDurations.completion}%</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span>Initial Phase</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                    <span>Midpoint Phase</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                    <span>Mastery Phase</span>
                  </div>
                </div>
              </div>
            
              {velocityPrediction.phaseVelocity && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={utils.cn(tw.text.secondary, "text-sm")}>Initial Speed</span>
                      <span className={utils.cn(tw.text.blue, "text-sm font-semibold")} style={{ fontFamily: fonts.mono }}>{formatPercentage(velocityPrediction.phaseVelocity.initial)}</span>
                    </div>
                    <div className={utils.cn("w-full rounded-full h-2", tw.bg.nested)}>
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${velocityPrediction.phaseVelocity.initial * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={utils.cn(tw.text.secondary, "text-sm")}>Midpoint Speed</span>
                      <span className={utils.cn(tw.text.emerald, "text-sm font-semibold")} style={{ fontFamily: fonts.mono }}>{formatPercentage(velocityPrediction.phaseVelocity.midpoint)}</span>
                    </div>
                    <div className={utils.cn("w-full rounded-full h-2", tw.bg.nested)}>
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${velocityPrediction.phaseVelocity.midpoint * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={utils.cn(tw.text.secondary, "text-sm")}>Mastery Speed</span>
                      <span className={utils.cn(tw.text.amber, "text-sm font-semibold")} style={{ fontFamily: fonts.mono }}>{formatPercentage(velocityPrediction.phaseVelocity.completion)}</span>
                    </div>
                    <div className={utils.cn("w-full rounded-full h-2", tw.bg.nested)}>
                      <div 
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${velocityPrediction.phaseVelocity.completion * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Retention Profile */}
          {velocityPrediction.retentionProfile && (
            <div className={components.card.primary}>
              <h4 className={utils.cn(tw.text.primary, "text-sm font-semibold mb-4 tracking-tight")}>Knowledge Retention Profile</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={utils.cn(tw.text.secondary, "text-sm")}>Short-term</span>
                    <span className={utils.cn(tw.text.blue, "text-sm font-semibold")} style={{ fontFamily: fonts.mono }}>{formatPercentage(velocityPrediction.retentionProfile.shortTerm)}</span>
                  </div>
                  <div className={utils.cn("w-full rounded-full h-2", tw.bg.nested)}>
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${velocityPrediction.retentionProfile.shortTerm * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={utils.cn(tw.text.secondary, "text-sm")}>Medium-term</span>
                    <span className={utils.cn(tw.text.emerald, "text-sm font-semibold")} style={{ fontFamily: fonts.mono }}>{formatPercentage(velocityPrediction.retentionProfile.mediumTerm)}</span>
                  </div>
                  <div className={utils.cn("w-full rounded-full h-2", tw.bg.nested)}>
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${velocityPrediction.retentionProfile.mediumTerm * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={utils.cn(tw.text.secondary, "text-sm")}>Long-term</span>
                    <span className={utils.cn(tw.text.amber, "text-sm font-semibold")} style={{ fontFamily: fonts.mono }}>{formatPercentage(velocityPrediction.retentionProfile.longTerm)}</span>
                  </div>
                  <div className={utils.cn("w-full rounded-full h-2", tw.bg.nested)}>
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${velocityPrediction.retentionProfile.longTerm * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Velocity Metrics Section */}
        <div>
          <h3 className={utils.cn(tw.typography.cardHeading, "mb-4 tracking-tight")}>Learning Efficiency Metrics</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Multiplier Visualization */}
            <div className={components.card.primary}>
              <h4 className={utils.cn(tw.text.primary, "text-sm font-semibold mb-4 tracking-tight")}>Learning Speed Analysis</h4>
              
              {/* Time Multiplier Dial */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="#374151" 
                      strokeWidth="8"
                      strokeLinecap="round" />
                      
                    {/* Colored progress - inverted scale (lower is better) */}
                    <circle cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke={velocityPrediction.timeMultiplier <= 1 ? "#10B981" : 
                            velocityPrediction.timeMultiplier <= 1.5 ? "#F59E0B" : "#F43F5E"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min(283, (velocityPrediction.timeMultiplier / 2) * 283)} 283`}
                      transform="rotate(-90 50 50)" />
                      
                    {/* Inner circle */}
                    <circle cx="50" cy="50" r="35" fill="rgb(10, 10, 12)" className="dark:fill-white" />
                    
                    {/* Text */}
                    <text x="50" y="48" textAnchor="middle" fill="white" className="dark:fill-black" fontSize="14" fontWeight="bold" fontFamily={fonts.mono}>
                      {velocityPrediction.timeMultiplier.toFixed(2)}x
                    </text>
                    <text x="50" y="62" textAnchor="middle" fill="rgb(156, 163, 175)" className="dark:fill-gray-600" fontSize="8">
                      Time Factor
                    </text>
                  </svg>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Base Velocity */}
                <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                  <div className={utils.cn(tw.text.secondary, "text-xs mb-1")}>Base Velocity</div>
                  <div className={utils.cn(tw.text.primary, "font-semibold")} style={{ fontFamily: fonts.mono }}>{formatPercentage(velocityPrediction.baseVelocity)}</div>
                </div>
                
                {/* Confidence Level */}
                <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                  <div className={utils.cn(tw.text.secondary, "text-xs mb-1")}>Confidence</div>
                  <div className={utils.cn(tw.text.primary, "font-semibold")} style={{ fontFamily: fonts.mono }}>{formatPercentage(velocityPrediction.confidenceLevel)}</div>
                </div>
              </div>
            </div>

            {/* Learning Time Estimation */}
            <div className={components.card.primary}>
              <h4 className={utils.cn(tw.text.primary, "text-sm font-semibold mb-4 tracking-tight")}>Learning Time Estimates</h4>
              <p className={utils.cn(tw.typography.bodyText, "mb-4")}>These ranges predict how quickly you may complete learning activities.</p>
              
              {/* Time Scenarios */}
              <div className="space-y-4 mb-6">
                <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={utils.cn(tw.text.secondary, "text-sm")}>5-hour Course</span>
                    <span className={utils.cn(tw.text.emerald, "text-lg font-bold")} style={{ fontFamily: fonts.mono }}>{Math.round(5 * velocityPrediction.timeMultiplier)}h</span>
                  </div>
                  <div className={utils.cn("w-full rounded-full h-1.5", tw.bg.nested)}>
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (5 * velocityPrediction.timeMultiplier / 10) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={utils.cn(tw.text.secondary, "text-sm")}>10-hour Course</span>
                    <span className={utils.cn(tw.text.blue, "text-lg font-bold")} style={{ fontFamily: fonts.mono }}>{Math.round(10 * velocityPrediction.timeMultiplier)}h</span>
                  </div>
                  <div className={utils.cn("w-full rounded-full h-1.5", tw.bg.nested)}>
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (10 * velocityPrediction.timeMultiplier / 20) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={utils.cn(tw.text.secondary, "text-sm")}>20-hour Course</span>
                    <span className={utils.cn(tw.text.amber, "text-lg font-bold")} style={{ fontFamily: fonts.mono }}>{Math.round(20 * velocityPrediction.timeMultiplier)}h</span>
                  </div>
                  <div className={utils.cn("w-full rounded-full h-1.5", tw.bg.nested)}>
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (20 * velocityPrediction.timeMultiplier / 40) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Time Multiplier Info Section */}
              <div className={utils.cn(components.card.nested, "mb-4")}>
                <div className={utils.cn(tw.text.secondary, "text-xs mb-2")}>Time Multiplier Ranges</div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className={utils.cn(tw.text.emerald, "text-lg font-bold")} style={{ fontFamily: fonts.mono }}>Faster</div>
                    <div className={utils.cn(tw.text.secondary, "text-xs")}>Optimistic</div>
                    <div className={utils.cn(tw.text.emerald, "text-sm font-semibold")} style={{ fontFamily: fonts.mono }}>1.2x</div>
                  </div>
                  <div className="text-center">
                    <div className={utils.cn(tw.text.blue, "text-lg font-bold")} style={{ fontFamily: fonts.mono }}>Average</div>
                    <div className={utils.cn(tw.text.secondary, "text-xs")}>Expected</div>
                    <div className={utils.cn(tw.text.blue, "text-sm font-semibold")} style={{ fontFamily: fonts.mono }}>1.3x</div>
                  </div>
                  <div className="text-center">
                    <div className={utils.cn(tw.text.amber, "text-lg font-bold")} style={{ fontFamily: fonts.mono }}>Slower</div>
                    <div className={utils.cn(tw.text.secondary, "text-xs")}>Conservative</div>
                    <div className={utils.cn(tw.text.amber, "text-sm font-semibold")} style={{ fontFamily: fonts.mono }}>1.4x</div>
                  </div>
                </div>
                <div className={utils.cn(tw.typography.smallLabel, "italic")}>
                  What this means: These multipliers represent how your learning time compares to an average learner. A multiplier of 1.0x means average pace, lower is faster, higher is more deliberate.
                </div>
              </div>
              
              {/* Pattern Type */}
              <div className={utils.cn(components.card.nested, "transition-all duration-300")}>
                <div className={utils.cn(tw.text.secondary, "text-xs mb-1")}>Velocity Pattern</div>
                <div className={utils.cn(tw.text.primary, "font-semibold text-sm")}>
                  {velocityPrediction.pattern?.replace(/([A-Z])/g, ' $1').trim() || "Adaptive"}
                </div>
              </div>
            </div>
          </div>

          {/* Time Ranges */}
          {velocityPrediction.probabilisticRanges && (
            <div className={utils.cn(components.card.primary, "mt-6")}>
              <h4 className={utils.cn(tw.text.primary, "text-sm font-semibold mb-4 tracking-tight")}>Probabilistic Time Ranges</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(velocityPrediction.probabilisticRanges).slice(0, 3).map(([duration, ranges]) => (
                  <div key={duration} className={utils.cn(components.card.nested, "transition-all duration-300")}>
                    <div className={utils.cn(tw.text.secondary, "text-xs mb-2 capitalize")}>{duration.replace('_', ' ')}</div>
                    <div className="space-y-2">
                      {ranges && typeof ranges === 'object' && Object.entries(ranges).map(([percentile, value]) => (
                        <div key={percentile} className="flex justify-between text-xs">
                          <span className={tw.text.secondary}>{percentile}:</span>
                          <span className={utils.cn(tw.text.primary, "font-semibold")} style={{ fontFamily: fonts.mono }}>
                            {typeof value === 'number' ? `${value.toFixed(1)}h` : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
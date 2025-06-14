import { motion } from 'framer-motion'
import { tw, utils } from '@/config/design-system'
import { SkillIcons } from './SkillIcons'

interface RadarTooltipProps {
  active?: boolean
  payload?: any[]
  data?: any[]
}

export const RadarTooltip = ({ active, payload, data }: RadarTooltipProps) => {
  if (!active || !payload || !payload.length || !data) return null

  const skill = data.find(item => item.subject === payload[0].payload.subject)
  if (!skill) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="backdrop-blur-xl p-6 rounded-2xl shadow-2xl max-w-md"
      style={{
        background: 'rgba(10, 10, 12, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }}
    >
      {/* Header with Skill Icon and Title */}
      <div className="flex items-center space-x-3 mb-5">
        <div className="p-2.5 rounded-lg"
             style={{
               background: 'rgba(59, 130, 246, 0.15)',
               border: '1px solid rgba(59, 130, 246, 0.2)',
             }}>
          <div className="text-blue-400 w-5 h-5">
            {SkillIcons[skill.icon] || SkillIcons.technical}
          </div>
        </div>
        <div>
          <h4 className={utils.cn(tw.text.primary, "font-medium text-lg")}>{skill.subject}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-blue-400">{skill.proficiencyLevel}</span>
            <span className={utils.cn(tw.text.tertiary, "text-sm")}>•</span>
            <span className="text-sm text-green-400">{skill.learningVelocity} Velocity</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className={utils.cn(tw.text.secondary, "text-sm mb-5 leading-relaxed")}>
        {skill.description}
      </p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-4 rounded-xl" 
             style={{
               background: 'rgba(10, 10, 12, 0.9)',
               border: '1px solid rgba(59, 130, 246, 0.1)',
             }}>
          <div className="flex items-center justify-between mb-2">
            <span className={utils.cn(tw.text.tertiary, "text-xs")}>Current Level</span>
            <div className="px-2 py-0.5 bg-blue-500/10 rounded-full">
              <span className="text-xs font-medium text-blue-400">
                +{skill.growth}
              </span>
            </div>
          </div>
          <div className={utils.cn(tw.typography.monoNumbers, "text-xl font-semibold text-blue-400")}>
            {skill.value}%
          </div>
        </div>
        
        <div className="p-4 rounded-xl"
             style={{
               background: 'rgba(10, 10, 12, 0.9)',
               border: '1px solid rgba(16, 185, 129, 0.1)',
             }}>
          <span className={utils.cn(tw.text.tertiary, "text-xs")}>Ideal Level</span>
          <div className={utils.cn(tw.typography.monoNumbers, "text-xl font-semibold text-emerald-400 mt-2")}>
            {skill.idealLevel}%
          </div>
        </div>
        
        <div className="p-4 rounded-xl"
             style={{
               background: 'rgba(10, 10, 12, 0.9)',
               border: '1px solid rgba(34, 197, 94, 0.1)',
             }}>
          <span className={utils.cn(tw.text.tertiary, "text-xs")}>Learning Velocity</span>
          <div className="flex items-center space-x-2 mt-2">
            <div className={utils.cn(tw.typography.monoNumbers, "text-xl font-semibold text-green-400")}>
              {skill.learningVelocity}
            </div>
            <svg className="w-4 h-4 text-green-400" 
              viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        
        <div className="p-4 rounded-xl"
             style={{
               background: 'rgba(10, 10, 12, 0.9)',
               border: '1px solid rgba(239, 68, 68, 0.1)',
             }}>
          <span className={utils.cn(tw.text.tertiary, "text-xs")}>Top Percentile</span>
          <div className={utils.cn(tw.typography.monoNumbers, "text-xl font-semibold text-red-400 mt-2")}>
            {skill.topLevel}%
          </div>
        </div>
      </div>

      {/* Critical Gaps */}
      {skill.criticalGaps && skill.criticalGaps.length > 0 && (
        <div className="pt-3 border-t border-gray-800/30">
          <span className={utils.cn(tw.text.tertiary, "text-xs")}>Critical Gaps</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {skill.criticalGaps.map((gap: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full">
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Time to Next Level */}
      <div className="mt-4 pt-4 border-t border-gray-800/30">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className={utils.cn(tw.text.tertiary, "text-xs")}>Time to Next Level</span>
            <div className="text-sm font-medium text-blue-400 mt-1">{skill.timeToNextLevel}</div>
          </div>
          <div>
            <span className={utils.cn(tw.text.tertiary, "text-xs")}>Growth Rate</span>
            <div className="text-sm font-medium text-green-400 mt-1">{skill.growth}</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 
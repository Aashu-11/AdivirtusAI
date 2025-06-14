import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { tw, utils } from '@/config/design-system'
import { RadarTooltip } from './RadarTooltip'
import { 
  transformSkillDataForRadar, 
  CHART_COLORS, 
  VIEW_OPTIONS, 
  ViewMode,
  RadarSkillData
} from '../utils/radarDataTransform'
import { CategorySummary } from '../types'

interface SkillRadarChartProps {
  categorySummaries: CategorySummary[]
  activeTab: string
  onTabChange: (tab: string) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
}

export function SkillRadarChart({ categorySummaries, activeTab, onTabChange }: SkillRadarChartProps) {
  const [activeView, setActiveView] = useState<ViewMode>('all')

  // Transform data for radar chart
  const radarData: RadarSkillData[] = useMemo(() => 
    transformSkillDataForRadar(categorySummaries), 
    [categorySummaries]
  )

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const total = radarData.reduce((acc, curr) => acc + curr.value, 0)
    return Math.round(total / radarData.length)
  }, [radarData])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 sm:p-8 lg:p-10 rounded-3xl backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="flex justify-between items-start mb-8"
      >
        <div>
          <h3 className={utils.cn(
            'text-3xl font-light tracking-tight mb-2',
            tw.text.primary
          )}>
            Skill Matrix
          </h3>
          <p className={utils.cn(
            'text-base tracking-wide',
            tw.text.secondary
          )}>
            Professional Competency Overview
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className={utils.cn(
              'text-2xl font-light text-blue-400',
              tw.typography.monoNumbers
            )}>
              {overallProgress}%
            </div>
            <span className={utils.cn(tw.text.tertiary, 'text-sm')}>
              Overall Progress
            </span>
          </div>
        </div>
        
        {/* View Toggle Buttons */}
        <div className="flex gap-2 p-1 rounded-lg"
             style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          {VIEW_OPTIONS.map((view) => (
            <motion.button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={utils.cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeView === view.id ? 'shadow-lg' : tw.text.secondary
              )}
              style={{
                backgroundColor: activeView === view.id ? `${view.color}20` : 'transparent',
                color: activeView === view.id ? view.color : undefined,
                border: activeView === view.id ? `1px solid ${view.color}40` : '1px solid transparent'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {view.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Radar Chart */}
      <motion.div 
        variants={itemVariants}
        className="h-[600px] relative"
      >
        <div className="absolute inset-0 rounded-2xl opacity-50"
             style={{
               background: 'linear-gradient(to bottom, rgba(44, 126, 255, 0.05), transparent)'
             }} />
        
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid 
              stroke="rgba(59, 130, 246, 0.3)" 
              strokeDasharray="2 2" 
              gridType="polygon"
              radialLines={true}
            />
            <PolarAngleAxis 
              dataKey="subject" 
              stroke="#9CA3AF"
              tickLine={false}
              fontSize={13}
              fontFamily="system-ui"
              className={tw.text.secondary}
            />
            <Tooltip 
              content={(props) => (
                <RadarTooltip 
                  active={props.active} 
                  payload={props.payload} 
                  data={radarData} 
                />
              )} 
            />
            
            {/* Ideal Level Line */}
            {(activeView === 'all' || activeView === 'ideal') && (
              <Radar
                name="Ideal Level"
                dataKey="idealLevel"
                stroke={CHART_COLORS.ideal.stroke}
                fill={CHART_COLORS.ideal.fill}
                fillOpacity={activeView === 'all' ? 0.15 : CHART_COLORS.ideal.opacity}
                strokeWidth={2}
                strokeDasharray="4 4"
                strokeOpacity={0.8}
              />
            )}
            
            {/* Current Skills */}
            {(activeView === 'all' || activeView === 'current') && (
              <Radar
                name="Current"
                dataKey="value"
                stroke={CHART_COLORS.current.stroke}
                fill="url(#blueGradient)"
                fillOpacity={activeView === 'all' ? 0.4 : 0.5}
                strokeWidth={3}
                strokeOpacity={0.9}
              />
            )}
            
            {/* Top Percentile */}
            {(activeView === 'all' || activeView === 'top') && (
              <Radar
                name="Top Percentile"
                dataKey="topLevel"
                stroke={CHART_COLORS.top.stroke}
                fill={CHART_COLORS.top.fill}
                fillOpacity={activeView === 'all' ? 0.1 : CHART_COLORS.top.opacity}
                strokeWidth={1}
                strokeDasharray="6 3"
                strokeOpacity={0.7}
              />
            )}
            
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                {CHART_COLORS.current.gradient.map((stop) => (
                  <stop 
                    key={stop.offset}
                    offset={stop.offset}
                    stopColor={stop.color}
                    stopOpacity={activeView === 'all' ? stop.opacity * 0.8 : stop.opacity}
                  />
                ))}
              </linearGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Legend */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-wrap justify-center gap-6 mt-6 pt-6 border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className={utils.cn(tw.text.secondary, 'text-sm')}>Current Level</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-emerald-500 opacity-80" style={{ borderRadius: '1px' }}></div>
          <span className={utils.cn(tw.text.secondary, 'text-sm')}>Ideal Level</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-red-400 opacity-60" style={{ borderRadius: '1px' }}></div>
          <span className={utils.cn(tw.text.secondary, 'text-sm')}>Top Percentile</span>
        </div>
      </motion.div>
    </motion.div>
  )
} 
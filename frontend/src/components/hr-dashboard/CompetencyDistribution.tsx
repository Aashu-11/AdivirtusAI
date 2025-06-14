'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts'
import { 
  Users, 
  TrendingUp, 
  Award,
  RefreshCw
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { hrAnalyticsService } from '@/services/hr-analytics'
import { CompetencyDistributionData, CompetencyLevelData } from '@/types/hr-analytics'

interface CompetencyDistributionProps {
  onRefresh?: () => void
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload as CompetencyLevelData

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="backdrop-blur-xl p-4 rounded-xl shadow-2xl"
      style={{
        background: 'rgba(10, 10, 12, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        maxWidth: '280px'
      }}
    >
      <div className="flex items-center space-x-3 mb-2">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: data.color }}
        />
        <h4 className={utils.cn(tw.text.primary, "font-medium text-sm")}>
          {data.level}
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>Employees</p>
          <div className={utils.cn(tw.typography.monoNumbers, "text-lg font-semibold text-blue-400")}>
            {data.count}
          </div>
        </div>
        
        <div>
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>Percentage</p>
          <div className={utils.cn(tw.typography.monoNumbers, "text-lg font-semibold text-emerald-400")}>
            {data.percentage}%
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function CompetencyDistribution({ 
  onRefresh 
}: CompetencyDistributionProps) {
  const [data, setData] = useState<CompetencyDistributionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await hrAnalyticsService.getCompetencyDistribution()
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setData(response.data || null)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load competency distribution')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    loadData()
    onRefresh?.()
  }

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          <div className="h-64 bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="text-center">
          <div className="text-red-400 mb-2">Error loading competency data</div>
          <p className={utils.cn(tw.text.secondary, "text-sm")}>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data || !data.distribution.length) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h4 className={utils.cn(tw.text.primary, "text-lg font-medium mb-2")}>
            No Competency Data
          </h4>
          <p className={utils.cn(tw.text.secondary, "text-sm")}>
            No employee assessments found for competency analysis.
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="flex justify-between items-start mb-6"
      >
        <div>
          <h3 className={utils.cn(
            'text-2xl font-light tracking-tight mb-2',
            tw.text.primary
          )}>
            Competency Distribution
          </h3>
          <p className={utils.cn(
            'text-sm tracking-wide',
            tw.text.secondary
          )}>
            Organization-wide skill competency levels
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-blue-400" />
            <span className={tw.text.tertiary}>
              {data.employees_with_data} assessed
            </span>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl backdrop-blur-sm border border-gray-600/40 text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200 disabled:opacity-50 shadow-lg"
            style={{ backgroundColor: '#0A0A0C' }}
          >
            <RefreshCw className={utils.cn(
              "w-4 h-4",
              isLoading && "animate-spin"
            )} />
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Donut Chart */}
        <motion.div variants={itemVariants}>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {data.distribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="rgba(10, 10, 12, 0.5)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className={utils.cn(
                'text-3xl font-light text-blue-400 mb-1',
                tw.typography.monoNumbers
              )}>
                {data.average_competency}%
              </div>
              <span className={utils.cn(tw.text.tertiary, 'text-xs')}>
                Average
              </span>
            </div>
          </div>
        </motion.div>

        {/* Statistics Panel */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl backdrop-blur-sm border border-blue-500/20" 
                 style={{ backgroundColor: '#0A0A0C' }}>
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className={utils.cn(tw.text.secondary, 'text-sm')}>Total</span>
              </div>
              <div className={utils.cn(
                'text-2xl font-light text-blue-400',
                tw.typography.monoNumbers
              )}>
                {data.total_employees}
              </div>
            </div>
            
            <div className="p-4 rounded-xl backdrop-blur-sm border border-emerald-500/20" 
                 style={{ backgroundColor: '#0A0A0C' }}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className={utils.cn(tw.text.secondary, 'text-sm')}>Assessed</span>
              </div>
              <div className={utils.cn(
                'text-2xl font-light text-emerald-400',
                tw.typography.monoNumbers
              )}>
                {data.employees_with_data}
              </div>
            </div>
          </div>

          {/* Level Breakdown */}
          <div className="space-y-3">
            <h4 className={utils.cn(tw.text.primary, 'text-lg font-medium mb-4')}>
              Level Breakdown
            </h4>
            
            {data.distribution.map((level, index) => (
              <div 
                key={level.level}
                className="p-3 rounded-xl backdrop-blur-sm border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200"
                style={{ backgroundColor: '#0A0A0C' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: level.color }}
                    />
                    <span className={utils.cn(tw.text.primary, 'text-sm font-medium')}>
                      {level.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={utils.cn(tw.text.secondary, 'text-sm')}>
                      {level.count} employees
                    </span>
                    <span className={utils.cn(
                      'text-sm font-medium',
                      tw.typography.monoNumbers
                    )} style={{ color: level.color }}>
                      {level.percentage}%
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${level.percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: level.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
} 
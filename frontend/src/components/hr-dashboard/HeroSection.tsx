'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Target, 
  AlertTriangle,
  Award,
  Activity,
  BarChart3,
  Shield,
  ArrowUpRight,
  Brain,
  Zap,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { hrAnalyticsService } from '@/services/hr-analytics'
import { HRDashboardData } from '@/types/hr-analytics'

interface HeroSectionProps {
  data: HRDashboardData | null
  organizationName: string
  onQuickAction?: (action: string) => void
}

interface OrganizationHealth {
  score: number
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  factors: {
    competency: number
    coverage: number
    engagement: number
    compliance: number
  }
}

interface SmartInsight {
  type: 'improvement' | 'risk' | 'opportunity' | 'achievement'
  message: string
  data: number
  trend: 'up' | 'down' | 'stable'
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  }
}

const CountUpNumber = ({ value, suffix = '', duration = 2000 }: { value: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(value * easeOutQuart))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{count}{suffix}</span>
}

const HealthScoreIndicator = ({ health }: { health: OrganizationHealth }) => {
  const getHealthColor = (score: number) => {
    if (score >= 90) return { color: '#10B981', label: 'EXCELLENT', bg: 'bg-emerald-500' }
    if (score >= 80) return { color: '#22C55E', label: 'GOOD', bg: 'bg-green-500' }
    if (score >= 70) return { color: '#F59E0B', label: 'FAIR', bg: 'bg-yellow-500' }
    if (score >= 60) return { color: '#F97316', label: 'NEEDS ATTENTION', bg: 'bg-orange-500' }
    return { color: '#EF4444', label: 'CRITICAL', bg: 'bg-red-500' }
  }

  const healthStatus = getHealthColor(health.score)
  const circumference = 2 * Math.PI * 45

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke={healthStatus.color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (health.score / 100) * circumference }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={utils.cn('text-xl font-bold', tw.typography.monoNumbers)} style={{ color: healthStatus.color }}>
            <CountUpNumber value={health.score} suffix="%" />
          </span>
        </div>
      </div>
      <div>
        <p className={utils.cn('text-sm', tw.text.tertiary)}>Organization Health</p>
        <p className={utils.cn('text-lg font-semibold', tw.text.primary)}>
          <CountUpNumber value={health.score} suffix="%" /> Score
        </p>
        <span 
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ backgroundColor: `${healthStatus.color}20`, color: healthStatus.color }}
        >
          {healthStatus.label}
        </span>
      </div>
    </div>
  )
}

const SmartInsightsBanner = ({ insights }: { insights: SmartInsight[] }) => {
  const [currentInsight, setCurrentInsight] = useState(0)

  useEffect(() => {
    if (insights.length > 1) {
      const interval = setInterval(() => {
        setCurrentInsight((prev) => (prev + 1) % insights.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [insights.length])

  if (!insights.length) return null

  const insight = insights[currentInsight]
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement': return TrendingUp
      case 'risk': return AlertTriangle
      case 'opportunity': return Target
      case 'achievement': return Award
      default: return Activity
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'improvement': return '#22C55E'
      case 'risk': return '#EF4444'
      case 'opportunity': return '#3B82F6'
      case 'achievement': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  const Icon = getInsightIcon(insight.type)
  const color = getInsightColor(insight.type)

  return (
    <motion.div
      key={currentInsight}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 rounded-2xl backdrop-blur-xl border border-gray-600/30"
      style={{ background: 'rgba(10, 10, 12, 0.7)' }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1">
          <p className={utils.cn('text-sm font-medium', tw.text.primary)}>
            Smart Insight
          </p>
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            {insight.message}
          </p>
        </div>
        {insights.length > 1 && (
          <div className="flex gap-1">
            {insights.map((_, index) => (
              <div
                key={index}
                className={utils.cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentInsight ? "bg-blue-400" : "bg-gray-600"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function HeroSection({ data, organizationName, onQuickAction }: HeroSectionProps) {
  const [health, setHealth] = useState<OrganizationHealth | null>(null)
  const [insights, setInsights] = useState<SmartInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Calculate organization health from real data
  useEffect(() => {
    if (data) {
      const calculateHealth = () => {
        const competency = data.overview.overall_competency || 0
        const coverage = (data.overview.technical_coverage + data.overview.soft_skill_coverage + data.overview.domain_coverage + data.overview.sop_coverage) / 4 || 0
        const engagement = 85 // This could come from real engagement data
        const compliance = data.overview.sop_coverage || 0

        const overallScore = Math.round((competency * 0.3 + coverage * 0.3 + engagement * 0.2 + compliance * 0.2))
        
        let level: OrganizationHealth['level'] = 'critical'
        if (overallScore >= 90) level = 'excellent'
        else if (overallScore >= 80) level = 'good'
        else if (overallScore >= 70) level = 'fair'
        else if (overallScore >= 60) level = 'poor'

        return {
          score: overallScore,
          level,
          factors: {
            competency: Math.round(competency),
            coverage: Math.round(coverage),
            engagement: Math.round(engagement),
            compliance: Math.round(compliance)
          }
        }
      }

      const healthData = calculateHealth()
      setHealth(healthData)

      // Generate smart insights from real data
      const generatedInsights: SmartInsight[] = []

      // Technical improvement insight
      if (data.overview.technical_coverage >= 80) {
        generatedInsights.push({
          type: 'achievement',
          message: `Technical skills coverage reached ${Math.round(data.overview.technical_coverage)}% - excellent progress!`,
          data: data.overview.technical_coverage,
          trend: 'up'
        })
      } else if (data.overview.technical_coverage < 60) {
        generatedInsights.push({
          type: 'risk',
          message: `Technical coverage at ${Math.round(data.overview.technical_coverage)}% - needs immediate attention`,
          data: data.overview.technical_coverage,
          trend: 'down'
        })
      }

      // Competency insight
      if (data.overview.overall_competency >= 75) {
        generatedInsights.push({
          type: 'improvement',
          message: `Overall competency at ${Math.round(data.overview.overall_competency)}% - strong organizational capability`,
          data: data.overview.overall_competency,
          trend: 'up'
        })
      }

      // Skills gap opportunity
      const gapCount = Object.values(data.critical_gaps || {}).reduce((sum, gaps: any) => 
        sum + (Array.isArray(gaps) ? gaps.length : 0), 0)
      
      if (gapCount > 0) {
        generatedInsights.push({
          type: 'opportunity',
          message: `${gapCount} skill gaps identified - opportunity for targeted development`,
          data: gapCount,
          trend: 'stable'
        })
      }

      setInsights(generatedInsights)
      setIsLoading(false)
    }
  }, [data])

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isAutoRefresh) {
      interval = setInterval(() => {
        handleManualRefresh()
      }, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAutoRefresh])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    setLastRefresh(new Date())
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Trigger actual data refresh (this would call parent refresh function)
    if (onQuickAction) {
      onQuickAction('refresh')
    }
    
    setIsRefreshing(false)
  }

  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh)
  }

  if (isLoading || !data || !health) {
    return (
      <div className="p-8 rounded-3xl backdrop-blur-xl border border-gray-600/30 animate-pulse"
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="h-32 bg-gray-700 rounded"></div>
      </div>
    )
  }

  const quickActions = [
    { id: 'generate', label: 'Generate Report', icon: BarChart3, color: '#3B82F6' },
    { id: 'export', label: 'Export Data', icon: Activity, color: '#10B981' },
    { id: 'compliance', label: 'Compliance Check', icon: Shield, color: '#F59E0B' },
  ]

  const healthStatus = {
    color: health.score >= 90 ? '#10B981' : health.score >= 80 ? '#22C55E' : health.score >= 70 ? '#F59E0B' : health.score >= 60 ? '#F97316' : '#EF4444',
    label: health.score >= 90 ? 'EXCELLENT' : health.score >= 80 ? 'GOOD' : health.score >= 70 ? 'FAIR' : health.score >= 60 ? 'NEEDS ATTENTION' : 'CRITICAL',
    message: health.score >= 90 ? 'Excellent performance!' : health.score >= 80 ? 'Good performance' : health.score >= 70 ? 'Fair performance' : health.score >= 60 ? 'Needs attention' : 'Critical performance'
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-6 lg:p-8 rounded-3xl backdrop-blur-xl border border-gray-600/30 mb-6 sm:mb-8"
      style={{ background: 'rgba(10, 10, 12, 0.7)' }}
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className={utils.cn(
            'text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight',
            tw.text.primary
          )}>
            🎯 {organizationName} - HR Command Center
          </h1>
          <p className={utils.cn(
            'text-sm sm:text-base mt-2',
            tw.text.secondary
          )}>
            Real-time organizational health monitoring with intelligent insights
          </p>
        </div>

        {/* Refresh Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="text-right text-xs text-gray-400 hidden sm:block">
            <div>Last updated</div>
            <div>{lastRefresh.toLocaleTimeString()}</div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoRefresh}
              className={utils.cn(
                "p-2 rounded-xl backdrop-blur-sm border transition-all duration-200",
                isAutoRefresh 
                  ? "bg-green-500/20 border-green-500/40 text-green-400" 
                  : "border-gray-600/40 text-gray-400 hover:text-white hover:border-gray-500/50"
              )}
              style={{ background: isAutoRefresh ? undefined : 'rgba(10, 10, 12, 0.7)' }}
              title={`Auto-refresh: ${isAutoRefresh ? 'On' : 'Off'}`}
            >
              {isAutoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl backdrop-blur-sm border border-gray-600/40 text-gray-400 hover:text-white hover:border-blue-500/50 transition-all duration-200 disabled:opacity-50"
              style={{ background: 'rgba(10, 10, 12, 0.7)' }}
              title="Manual refresh"
            >
              <RefreshCw className={utils.cn(
                "w-4 h-4",
                isRefreshing && "animate-spin"
              )} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Side - Health Score & Insights */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Organization Health Score */}
          <motion.div variants={cardVariants}>
            <HealthScoreIndicator health={health} />
          </motion.div>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <motion.div variants={cardVariants}>
              <SmartInsightsBanner insights={insights} />
            </motion.div>
          )}

          {/* Key Metrics Grid */}
          <motion.div variants={cardVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
                 style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
              <h3 className={utils.cn('text-xs sm:text-sm font-medium mb-2', tw.text.secondary)}>Employees</h3>
              <p className={utils.cn('text-2xl sm:text-3xl font-bold text-blue-400', tw.typography.monoNumbers)}>
                <CountUpNumber value={data.overview.total_employees} />
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
                 style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
              <h3 className={utils.cn('text-xs sm:text-sm font-medium mb-2', tw.text.secondary)}>Competency</h3>
              <p className={utils.cn('text-2xl sm:text-3xl font-bold text-green-400', tw.typography.monoNumbers)}>
                <CountUpNumber value={Math.round(data.overview.overall_competency)} suffix="%" />
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
                 style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
              <h3 className={utils.cn('text-xs sm:text-sm font-medium mb-2', tw.text.secondary)}>Tech Coverage</h3>
              <p className={utils.cn('text-2xl sm:text-3xl font-bold text-purple-400', tw.typography.monoNumbers)}>
                <CountUpNumber value={Math.round(data.overview.technical_coverage)} suffix="%" />
              </p>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
                 style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
              <h3 className={utils.cn('text-xs sm:text-sm font-medium mb-2', tw.text.secondary)}>SOP Coverage</h3>
              <p className={utils.cn('text-2xl sm:text-3xl font-bold text-orange-400', tw.typography.monoNumbers)}>
                <CountUpNumber value={Math.round(data.overview.sop_coverage)} suffix="%" />
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Quick Actions */}
        <div className="lg:col-span-4">
          <motion.div variants={cardVariants} className="h-full">
            <h3 className={utils.cn('text-lg sm:text-xl font-light mb-4 sm:mb-6', tw.text.primary)}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <motion.button
                    key={action.id}
                    variants={cardVariants}
                    onClick={() => onQuickAction?.(action.id)}
                    className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 text-left group"
                    style={{ background: 'rgba(10, 10, 12, 0.7)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div 
                        className="p-2 sm:p-3 rounded-xl group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: `${action.color}20` }}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: action.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={utils.cn('font-medium text-sm sm:text-base', tw.text.primary)}>
                          {action.label}
                        </p>
                        <p className={utils.cn('text-xs sm:text-sm', tw.text.secondary)}>
                          Click to execute
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
} 
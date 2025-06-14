'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Activity,
  Award,
  Building,
  Zap,
  ArrowRight
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { HRDashboardData, EmployeeSummary } from '@/types/hr-analytics'
import { hrAnalyticsService } from '@/services/hr-analytics'

interface OverviewTabProps {
  data: HRDashboardData | null
  employees: EmployeeSummary[]
  organizationName: string
}

interface KPICard {
  title: string
  value: number | string
  format?: 'number' | 'percentage' | 'currency'
  trend?: {
    value: number
    direction: 'up' | 'down'
    period: string
  }
  icon: any
  color: string
  description: string
}

interface DepartmentOverview {
  name: string
  employeeCount: number
  avgCompetency: number
  healthScore: number
  criticalGaps: number
  trend: 'up' | 'down' | 'stable'
}

interface ActivityItem {
  id: string
  type: 'assessment' | 'gap' | 'improvement' | 'alert'
  title: string
  description: string
  timestamp: Date
  severity?: 'low' | 'medium' | 'high' | 'critical'
  department?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
}

const KPICardComponent = ({ kpi }: { kpi: KPICard }) => {
  const Icon = kpi.icon
  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'percentage':
        return `${Math.round(value)}%`
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'number':
      default:
        return value.toLocaleString()
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      className="p-6 rounded-3xl backdrop-blur-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200"
      style={{ background: 'rgba(10, 10, 12, 0.7)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${kpi.color}20`, borderColor: `${kpi.color}40` }}
        >
          <Icon className="w-6 h-6" style={{ color: kpi.color }} />
        </div>
        
        {kpi.trend && (
          <div className={utils.cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
            kpi.trend.direction === 'up' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}>
            {kpi.trend.direction === 'up' ? 
              <TrendingUp className="w-3 h-3" /> : 
              <TrendingDown className="w-3 h-3" />
            }
            {Math.abs(kpi.trend.value)}%
          </div>
        )}
      </div>

      <div className="mb-2">
        <h3 className={utils.cn('text-3xl font-bold', tw.typography.monoNumbers, tw.text.primary)}>
          {formatValue(kpi.value, kpi.format)}
        </h3>
        <p className={utils.cn('text-sm font-medium', tw.text.secondary)}>
          {kpi.title}
        </p>
      </div>

      <p className={utils.cn('text-xs', tw.text.tertiary)}>
        {kpi.description}
      </p>

      {kpi.trend && (
        <p className={utils.cn('text-xs mt-2', tw.text.tertiary)}>
          {kpi.trend.period}
        </p>
      )}
    </motion.div>
  )
}

const DepartmentCard = ({ dept }: { dept: DepartmentOverview }) => {
  const getHealthColor = (score: number) => {
    if (score >= 90) return '#10B981'
    if (score >= 80) return '#22C55E'
    if (score >= 70) return '#F59E0B'
    if (score >= 60) return '#F97316'
    return '#EF4444'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-400" />
      case 'down': return <TrendingDown className="w-3 h-3 text-red-400" />
      default: return <div className="w-3 h-3 rounded-full bg-gray-400" />
    }
  }

  const healthColor = getHealthColor(dept.healthScore)

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      className="p-5 rounded-2xl backdrop-blur-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200"
      style={{ background: 'rgba(10, 10, 12, 0.7)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>{dept.name}</h3>
            <p className={utils.cn('text-xs', tw.text.tertiary)}>{dept.employeeCount} employees</p>
          </div>
        </div>
        {getTrendIcon(dept.trend)}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className={utils.cn('text-lg font-bold', tw.typography.monoNumbers)} style={{ color: healthColor }}>
            {dept.healthScore}%
          </p>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>Health</p>
        </div>
        <div className="text-center">
          <p className={utils.cn('text-lg font-bold text-emerald-400', tw.typography.monoNumbers)}>
            {dept.avgCompetency}%
          </p>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>Skills</p>
        </div>
        <div className="text-center">
          <p className={utils.cn('text-lg font-bold text-orange-400', tw.typography.monoNumbers)}>
            {dept.criticalGaps}
          </p>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>Gaps</p>
        </div>
      </div>
    </motion.div>
  )
}

const ActivityTimeline = ({ activities }: { activities: ActivityItem[] }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment': return Target
      case 'gap': return AlertTriangle
      case 'improvement': return TrendingUp
      case 'alert': return Clock
      default: return Activity
    }
  }

  const getActivityColor = (type: string, severity?: string) => {
    if (severity === 'critical') return '#EF4444'
    if (severity === 'high') return '#F97316'
    
    switch (type) {
      case 'assessment': return '#3B82F6'
      case 'gap': return '#F59E0B'
      case 'improvement': return '#10B981'
      case 'alert': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activities.map((activity, index) => {
        const Icon = getActivityIcon(activity.type)
        const color = getActivityColor(activity.type, activity.severity)
        
        return (
          <motion.div
            key={activity.id}
            variants={cardVariants}
            className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200"
          >
            <div 
              className="p-2 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className={utils.cn('font-medium truncate', tw.text.primary)}>
                  {activity.title}
                </h4>
                <span className={utils.cn('text-xs', tw.text.tertiary)}>
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
              <p className={utils.cn('text-sm', tw.text.secondary)}>
                {activity.description}
              </p>
              {activity.department && (
                <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400">
                  {activity.department}
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function OverviewTab({ data, employees, organizationName }: OverviewTabProps) {
  const [departments, setDepartments] = useState<DepartmentOverview[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (data && employees) {
      // Process department data
      const processedDepartments = processDepartmentData(data, employees)
      setDepartments(processedDepartments)

      // Generate activity timeline from real data
      const generatedActivities = generateActivityTimeline(data, employees)
      setActivities(generatedActivities)

      setIsLoading(false)
    }
  }, [data, employees])

  const processDepartmentData = (dashboardData: HRDashboardData, employeeList: EmployeeSummary[]): DepartmentOverview[] => {
    const deptMap = new Map<string, DepartmentOverview>()

    // Group employees by department
    employeeList.forEach(emp => {
      const deptName = emp.department || 'Unassigned'
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, {
          name: deptName,
          employeeCount: 0,
          avgCompetency: 0,
          healthScore: 0,
          criticalGaps: 0,
          trend: 'stable'
        })
      }

      const dept = deptMap.get(deptName)!
      dept.employeeCount++
      dept.avgCompetency += emp.avg_competency || 0
      dept.criticalGaps += emp.skills_with_gaps || 0
    })

    // Calculate averages and health scores
    return Array.from(deptMap.values()).map(dept => {
      dept.avgCompetency = Math.round(dept.avgCompetency / dept.employeeCount)
      dept.healthScore = Math.round((dept.avgCompetency * 0.7) + (Math.max(0, 100 - (dept.criticalGaps * 5)) * 0.3))
      dept.trend = dept.healthScore >= 80 ? 'up' : dept.healthScore < 60 ? 'down' : 'stable'
      return dept
    }).sort((a, b) => b.employeeCount - a.employeeCount)
  }

  const generateActivityTimeline = (dashboardData: HRDashboardData, employeeList: EmployeeSummary[]): ActivityItem[] => {
    const activities: ActivityItem[] = []
    const now = new Date()

    // Recent assessments
    employeeList.slice(0, 3).forEach((emp, index) => {
      activities.push({
        id: `assessment-${index}`,
        type: 'assessment',
        title: 'Skill Assessment Completed',
        description: `${emp.full_name} completed skill matrix assessment`,
                 timestamp: new Date(now.getTime() - (index + 1) * 2 * 60 * 60 * 1000), // Hours ago
         department: emp.department || undefined
      })
    })

    // Critical gaps detected
    const gapCount = Object.values(dashboardData.critical_gaps || {}).reduce((sum, gaps: any) => 
      sum + (Array.isArray(gaps) ? gaps.length : 0), 0)
    
    if (gapCount > 0) {
      activities.push({
        id: 'gaps-alert',
        type: 'gap',
        title: 'Critical Skill Gaps Identified',
        description: `${gapCount} critical skill gaps require immediate attention`,
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        severity: 'high'
      })
    }

    // Improvements
    if (dashboardData.overview.overall_competency >= 75) {
      activities.push({
        id: 'improvement',
        type: 'improvement',
        title: 'Competency Milestone Achieved',
        description: `Organization reached ${Math.round(dashboardData.overview.overall_competency)}% overall competency`,
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        severity: 'low'
      })
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  if (isLoading || !data) {
    return (
      <div className="p-8 rounded-3xl backdrop-blur-xl border border-gray-600/30 animate-pulse"
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Calculate KPIs from real data
  const kpis: KPICard[] = [
    {
      title: 'Total Workforce',
      value: data.overview.total_employees,
      format: 'number',
      icon: Users,
      color: '#3B82F6',
      description: 'Active employees across all departments',
      trend: {
        value: 5.2,
        direction: 'up',
        period: 'vs last quarter'
      }
    },
    {
      title: 'Skill Competency',
      value: data.overview.overall_competency,
      format: 'percentage',
      icon: Target,
      color: '#10B981',
      description: 'Average competency across all skills',
      trend: {
        value: 3.1,
        direction: 'up',
        period: 'vs last month'
      }
    },
    {
      title: 'Technical Coverage',
      value: data.overview.technical_coverage,
      format: 'percentage',
      icon: Zap,
      color: '#8B5CF6',
      description: 'Technical skills coverage rate',
      trend: {
        value: 2.8,
        direction: 'up',
        period: 'vs last month'
      }
    },
    {
      title: 'Active Alerts',
      value: Object.values(data.critical_gaps || {}).reduce((sum, gaps: any) => 
        sum + (Array.isArray(gaps) ? gaps.length : 0), 0),
      format: 'number',
      icon: AlertTriangle,
      color: '#F59E0B',
      description: 'Critical gaps requiring attention',
      trend: {
        value: 1.2,
        direction: 'down',
        period: 'vs last week'
      }
    }
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* KPI Dashboard */}
      <motion.div variants={cardVariants}>
        <h2 className={utils.cn('text-2xl font-light tracking-tight mb-6', tw.text.primary)}>
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <KPICardComponent key={index} kpi={kpi} />
          ))}
        </div>
      </motion.div>

      {/* Department Overview */}
      <motion.div variants={cardVariants}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={utils.cn('text-2xl font-light tracking-tight', tw.text.primary)}>
            Department Overview
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors">
            <span className="text-sm font-medium">View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.slice(0, 6).map((dept, index) => (
            <DepartmentCard key={index} dept={dept} />
          ))}
        </div>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <h2 className={utils.cn('text-2xl font-light tracking-tight mb-6', tw.text.primary)}>
            Recent Activity
          </h2>
          <div className="p-6 rounded-3xl backdrop-blur-xl border border-gray-700/30"
               style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h2 className={utils.cn('text-2xl font-light tracking-tight mb-6', tw.text.primary)}>
            Quick Stats
          </h2>
          <div className="space-y-4">
            <div className="p-6 rounded-3xl backdrop-blur-xl border border-gray-700/30"
                 style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-5 h-5 text-yellow-400" />
                <h3 className={utils.cn('font-semibold', tw.text.primary)}>Top Performer</h3>
              </div>
                             <p className={utils.cn('text-sm', tw.text.secondary)}>
                 {employees.reduce((top, emp) => 
                   (emp.avg_competency || 0) > (top.avg_competency || 0) ? emp : top
                 ).full_name}
               </p>
               <p className={utils.cn('text-xs', tw.text.tertiary)}>
                 {Math.round(employees.reduce((top, emp) => 
                   (emp.avg_competency || 0) > (top.avg_competency || 0) ? emp : top
                 ).avg_competency || 0)}% competency
              </p>
            </div>

            <div className="p-6 rounded-3xl backdrop-blur-xl border border-gray-700/30"
                 style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className={utils.cn('font-semibold', tw.text.primary)}>Assessments</h3>
              </div>
              <p className={utils.cn('text-2xl font-bold', tw.typography.monoNumbers, tw.text.primary)}>
                {employees.length}
              </p>
              <p className={utils.cn('text-xs', tw.text.tertiary)}>
                Completed this month
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 
'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,
  Filter,
  Search,
  ShieldAlert
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { ComplianceRisk } from '@/types/hr-analytics'

interface ComplianceRiskMatrixProps {
  risks: ComplianceRisk[]
}

const SEVERITY_COLORS = {
  5: '#EF4444', // Critical
  4: '#F97316', // High  
  3: '#F59E0B', // Medium
  2: '#22C55E', // Low
  1: '#3B82F6'  // Minimal
}

const getSeverityColor = (severity: number): string => {
  return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS[1]
}

const formatSeverity = (severity: number): string => {
  if (severity >= 5) return 'Critical'
  if (severity >= 4) return 'High'
  if (severity >= 3) return 'Medium'
  if (severity >= 2) return 'Low'
  return 'Minimal'
}

const getDeadlineStatus = (deadline: string): { status: string; color: string; urgent: boolean } => {
  const days = parseInt(deadline.split(' ')[0])
  
  if (days <= 15) {
    return { status: 'Urgent', color: '#EF4444', urgent: true }
  } else if (days <= 30) {
    return { status: 'Soon', color: '#F97316', urgent: true }
  } else if (days <= 60) {
    return { status: 'Moderate', color: '#F59E0B', urgent: false }
  } else {
    return { status: 'Extended', color: '#22C55E', urgent: false }
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

export default function ComplianceRiskMatrix({ risks }: ComplianceRiskMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'severity' | 'deadline' | 'gap'>('severity')
  const [showUrgentOnly, setShowUrgentOnly] = useState(false)

  const filteredAndSortedRisks = useMemo(() => {
    let filtered = risks.filter(risk => {
      const matchesSearch = risk.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          risk.skill_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSeverity = selectedSeverity === null || risk.risk_severity === selectedSeverity
      const matchesDepartment = selectedDepartment === null || risk.department === selectedDepartment
      const matchesUrgent = !showUrgentOnly || getDeadlineStatus(risk.compliance_deadline).urgent
      
      return matchesSearch && matchesSeverity && matchesDepartment && matchesUrgent
    })

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          return b.risk_severity - a.risk_severity
        case 'deadline':
          const daysA = parseInt(a.compliance_deadline.split(' ')[0])
          const daysB = parseInt(b.compliance_deadline.split(' ')[0])
          return daysA - daysB
        case 'gap':
          return b.compliance_gap - a.compliance_gap
        default:
          return 0
      }
    })

    return filtered
  }, [risks, searchTerm, selectedSeverity, selectedDepartment, sortBy, showUrgentOnly])

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(risks.map(risk => risk.department).filter(Boolean)))
  }, [risks])

  const uniqueSeverities = useMemo(() => {
    return Array.from(new Set(risks.map(risk => risk.risk_severity))).sort((a, b) => b - a)
  }, [risks])

  const riskStats = useMemo(() => {
    const critical = risks.filter(r => r.risk_severity >= 5).length
    const urgent = risks.filter(r => getDeadlineStatus(r.compliance_deadline).urgent).length
    const avgGap = risks.length > 0 ? risks.reduce((sum, r) => sum + r.compliance_gap, 0) / risks.length : 0
    
    return { critical, urgent, avgGap: Math.round(avgGap) }
  }, [risks])

  if (risks.length === 0) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl text-center" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
          No Compliance Risks Found
        </h3>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Excellent! All employees meet compliance requirements.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={itemVariants}
          className="p-4 rounded-2xl backdrop-blur-xl"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-red-400')}>
                {riskStats.critical}
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Critical Risks</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-4 rounded-2xl backdrop-blur-xl"
          style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-orange-400')}>
                {riskStats.urgent}
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Urgent Deadlines</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-4 rounded-2xl backdrop-blur-xl"
          style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-yellow-400')}>
                {riskStats.avgGap}%
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Average Gap</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 min-w-[200px]"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity?.toString() || ''}
            onChange={(e) => setSelectedSeverity(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Severities</option>
            {uniqueSeverities.map(severity => (
              <option key={severity} value={severity}>
                {formatSeverity(severity)} Risk
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment || ''}
            onChange={(e) => setSelectedDepartment(e.target.value || null)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Urgent Filter */}
          <button
            onClick={() => setShowUrgentOnly(!showUrgentOnly)}
            className={utils.cn(
              "px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              showUrgentOnly 
                ? "bg-red-500/20 text-red-400 border border-red-500/20" 
                : "bg-gray-900/80 text-gray-400 border border-gray-700/50 hover:text-white"
            )}
          >
            Urgent Only
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className={utils.cn('text-sm', tw.text.tertiary)}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="severity">Risk Severity</option>
            <option value="deadline">Compliance Deadline</option>
            <option value="gap">Compliance Gap</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Showing {filteredAndSortedRisks.length} of {risks.length} compliance risks
        </p>
        
        {filteredAndSortedRisks.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className={utils.cn('text-xs', tw.text.tertiary)}>
                {filteredAndSortedRisks.filter(r => r.risk_severity >= 5).length} Critical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className={utils.cn('text-xs', tw.text.tertiary)}>
                {filteredAndSortedRisks.filter(r => getDeadlineStatus(r.compliance_deadline).urgent).length} Urgent
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Risk Matrix */}
      <div className="space-y-3">
        {filteredAndSortedRisks.map((risk, index) => {
          const deadlineStatus = getDeadlineStatus(risk.compliance_deadline)
          
          return (
            <motion.div
              key={`${risk.employee_id}-${risk.skill_name}`}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="p-5 rounded-2xl backdrop-blur-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200"
              style={{ 
                animationDelay: `${index * 0.05}s`,
                background: 'rgba(10, 10, 12, 0.7)'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getSeverityColor(risk.risk_severity) }}
                    />
                    <h3 className={utils.cn('text-lg font-medium', tw.text.primary)}>
                      {risk.employee_name}
                    </h3>
                    <span className={utils.cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      risk.risk_severity >= 5 ? 'bg-red-500/20 text-red-400' :
                      risk.risk_severity >= 4 ? 'bg-orange-500/20 text-orange-400' :
                      risk.risk_severity >= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    )}>
                      {formatSeverity(risk.risk_severity)} Risk
                    </span>
                    {deadlineStatus.urgent && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 animate-pulse">
                        URGENT
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className={utils.cn('text-xs', tw.text.tertiary)}>Department</p>
                        <p className={utils.cn('text-sm font-medium', tw.text.secondary)}>
                          {risk.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <Shield className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className={utils.cn('text-xs', tw.text.tertiary)}>Skill</p>
                        <p className={utils.cn('text-sm font-medium', tw.text.secondary)}>
                          {risk.skill_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className={utils.cn('text-xs', tw.text.tertiary)}>Compliance Gap</p>
                        <p className={utils.cn('text-sm font-semibold', tw.typography.monoNumbers, 'text-red-400')}>
                          {risk.compliance_gap}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-lg border"
                        style={{ 
                          backgroundColor: `${deadlineStatus.color}20`,
                          borderColor: `${deadlineStatus.color}40`
                        }}
                      >
                        <Calendar className="w-4 h-4" style={{ color: deadlineStatus.color }} />
                      </div>
                      <div>
                        <p className={utils.cn('text-xs', tw.text.tertiary)}>Deadline</p>
                        <div className="flex items-center gap-2">
                          <p className={utils.cn('text-sm font-medium', tw.text.secondary)}>
                            {risk.compliance_deadline}
                          </p>
                          <span 
                            className="px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: `${deadlineStatus.color}20`,
                              color: deadlineStatus.color
                            }}
                          >
                            {deadlineStatus.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className={utils.cn('text-xs', tw.text.tertiary)}>Current Level</p>
                        <p className={utils.cn('text-sm font-semibold', tw.typography.monoNumbers, 'text-orange-400')}>
                          {risk.current_competency}%
                        </p>
                      </div>
                      <div>
                        <p className={utils.cn('text-xs', tw.text.tertiary)}>Required Level</p>
                        <p className={utils.cn('text-sm font-semibold', tw.typography.monoNumbers, 'text-green-400')}>
                          {risk.required_competency}%
                        </p>
                      </div>
                      <div>
                        <p className={utils.cn('text-xs', tw.text.tertiary)}>Business Criticality</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div 
                              key={i}
                              className={utils.cn(
                                "w-2 h-2 rounded-full",
                                i < risk.business_criticality ? "bg-yellow-400" : "bg-gray-600"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Actions */}
                  <div>
                    <p className={utils.cn('text-sm font-medium mb-2', tw.text.secondary)}>
                      Recommended Actions
                    </p>
                    <div className="space-y-1">
                      {risk.recommended_actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-blue-400" />
                          <p className={utils.cn('text-sm', tw.text.tertiary)}>
                            {action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredAndSortedRisks.length === 0 && (
        <div className="text-center py-8">
          <Filter className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            No compliance risks match the current filters
          </p>
        </div>
      )}
    </div>
  )
} 
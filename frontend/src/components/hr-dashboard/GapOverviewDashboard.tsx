'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  Shield,
  Target,
  RefreshCw,
  BarChart3,
  BookOpen,
  UserCheck,
  Clock
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { hrAnalyticsService } from '@/services/hr-analytics'
import { CriticalSkillGapsData, RiskSummary } from '@/types/hr-analytics'
import CriticalGapsList from './CriticalGapsList'
import ComplianceRiskMatrix from './ComplianceRiskMatrix'
import LeadershipGapRadar from './LeadershipGapRadar'
import DomainKnowledgeMatrix from './DomainKnowledgeMatrix'

interface GapOverviewDashboardProps {
  organizationName: string
}

const RISK_COLORS = {
  critical: '#EF4444',    // Red
  high: '#F97316',        // Orange  
  medium: '#F59E0B',      // Amber
  low: '#22C55E',         // Green
  opportunity: '#3B82F6'  // Blue
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

const getRiskColor = (riskLevel: number): string => {
  if (riskLevel >= 5) return RISK_COLORS.critical
  if (riskLevel >= 4) return RISK_COLORS.high
  if (riskLevel >= 3) return RISK_COLORS.medium
  if (riskLevel >= 2) return RISK_COLORS.low
  return RISK_COLORS.opportunity
}

const formatRiskLevel = (riskLevel: number): string => {
  if (riskLevel >= 5) return 'Critical'
  if (riskLevel >= 4) return 'High'
  if (riskLevel >= 3) return 'Medium'
  if (riskLevel >= 2) return 'Low'
  return 'Minimal'
}

export default function GapOverviewDashboard({ organizationName }: GapOverviewDashboardProps) {
  const [gapData, setGapData] = useState<CriticalSkillGapsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'compliance' | 'leadership' | 'domain'>('overview')

  useEffect(() => {
    loadGapAnalysis()
  }, [organizationName])

  const loadGapAnalysis = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await hrAnalyticsService.getCriticalSkillGaps()
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setGapData(response.data || null)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load gap analysis')
    } finally {
      setIsLoading(false)
    }
  }

  const renderRiskSummaryCard = (riskSummary: RiskSummary) => (
    <motion.div
      variants={itemVariants}
      className="p-6 rounded-3xl backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className={utils.cn('text-xl font-medium', tw.text.primary)}>
              Risk Summary
            </h3>
            <p className={utils.cn('text-sm', tw.text.tertiary)}>
              Organization-wide gap analysis
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={utils.cn('text-2xl font-light', tw.typography.monoNumbers, 'text-red-400')}>
            {riskSummary.overall_risk_score}%
          </div>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>
            Overall Risk Score
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-800/30">
          <div className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-white')}>
            {riskSummary.total_gaps_identified}
          </div>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>
            Total Gaps
          </p>
        </div>
        
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-red-400')}>
            {riskSummary.critical_gaps_count}
          </div>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>
            Critical Risks
          </p>
        </div>
        
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-orange-400')}>
            {riskSummary.high_risk_percentage}%
          </div>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>
            High Risk
          </p>
        </div>
        
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-blue-400')}>
            {gapData?.total_employees_analyzed || 0}
          </div>
          <p className={utils.cn('text-xs', tw.text.tertiary)}>
            Employees Analyzed
          </p>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="mt-6">
        <h4 className={utils.cn('text-sm font-medium mb-3', tw.text.secondary)}>
          Risk Distribution
        </h4>
        <div className="space-y-2">
          {Object.entries(riskSummary.risk_distribution).map(([level, count]) => {
            const riskLevel = parseInt(level)
            const percentage = riskSummary.total_gaps_identified > 0 
              ? (count / riskSummary.total_gaps_identified * 100) 
              : 0
            
            return (
              <div key={level} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getRiskColor(riskLevel) }}
                  />
                  <span className={utils.cn('text-sm', tw.text.secondary)}>
                    {formatRiskLevel(riskLevel)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={utils.cn('text-sm', tw.typography.monoNumbers, tw.text.tertiary)}>
                    {count}
                  </span>
                  <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getRiskColor(riskLevel)
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-700 rounded-xl"></div>
            <div className="h-64 bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
            Failed to Load Gap Analysis
          </h3>
          <p className={utils.cn('text-sm mb-4', tw.text.secondary)}>{error}</p>
          <button
            onClick={loadGapAnalysis}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!gapData) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
            No Gap Analysis Data
          </h3>
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            No skill gap data available for analysis
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
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-start">
        <div>
          <h2 className={utils.cn(
            'text-3xl font-light tracking-tight mb-2',
            tw.text.primary
          )}>
            Critical Skill Gap Analysis
          </h2>
          <p className={utils.cn(
            'text-base tracking-wide',
            tw.text.secondary
          )}>
            Advanced analytics for strategic workforce development
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className={utils.cn(tw.text.tertiary, 'text-sm')}>
                {new Date(gapData.analysis_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className={utils.cn(tw.text.tertiary, 'text-sm')}>
                {gapData.total_employees_analyzed} employees analyzed
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={loadGapAnalysis}
          disabled={isLoading}
          className="p-2 rounded-xl bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200 disabled:opacity-50 shadow-lg"
        >
          <RefreshCw className={utils.cn(
            "w-4 h-4",
            isLoading && "animate-spin"
          )} />
        </button>
      </motion.div>

      {/* Risk Summary */}
      {renderRiskSummaryCard(gapData.risk_summary)}

      {/* Navigation Tabs */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center backdrop-blur-xl rounded-2xl p-1.5 border border-gray-600/40 shadow-xl" style={{ backgroundColor: '#0A0A0C' }}>
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'technical', label: 'Technical Gaps', icon: Target },
            { id: 'compliance', label: 'Compliance Risks', icon: Shield },
            { id: 'leadership', label: 'Leadership', icon: UserCheck },
            { id: 'domain', label: 'Domain Knowledge', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={utils.cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 min-w-[100px]",
                  activeTab === tab.id
                    ? "text-white shadow-lg border border-gray-500/50 transform scale-[0.98]" 
                    : "text-gray-300 hover:text-white hover:border hover:border-gray-600/30"
                )}
                style={{
                  backgroundColor: activeTab === tab.id ? '#1F2937' : 'transparent'
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl backdrop-blur-xl" style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
                <h3 className={utils.cn('text-xl font-medium mb-4', tw.text.primary)}>
                  Gap Categories
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <div>
                        <p className={utils.cn('font-medium', tw.text.primary)}>High-Impact Technical</p>
                        <p className={utils.cn('text-sm', tw.text.tertiary)}>Critical skill gaps</p>
                      </div>
                    </div>
                    <span className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-red-400')}>
                      {gapData.high_impact_gaps.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className={utils.cn('font-medium', tw.text.primary)}>Compliance Risks</p>
                        <p className={utils.cn('text-sm', tw.text.tertiary)}>Regulatory concerns</p>
                      </div>
                    </div>
                    <span className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-orange-400')}>
                      {gapData.compliance_risks.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className={utils.cn('font-medium', tw.text.primary)}>Leadership Gaps</p>
                        <p className={utils.cn('text-sm', tw.text.tertiary)}>Management skills</p>
                      </div>
                    </div>
                    <span className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-yellow-400')}>
                      {gapData.leadership_gaps.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className={utils.cn('font-medium', tw.text.primary)}>Domain Deficits</p>
                        <p className={utils.cn('text-sm', tw.text.tertiary)}>Business knowledge</p>
                      </div>
                    </div>
                    <span className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-blue-400')}>
                      {gapData.domain_deficits.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-6 rounded-3xl backdrop-blur-xl" style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
                <h3 className={utils.cn('text-xl font-medium mb-4', tw.text.primary)}>
                  Priority Recommendations
                </h3>
                <div className="space-y-3">
                  {gapData.recommendations.slice(0, 4).map((rec, index) => (
                    <div key={index} className="p-3 rounded-xl bg-gray-800/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className={utils.cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                              rec.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-blue-500/20 text-blue-400'
                            )}
                          >
                            {rec.priority}
                          </div>
                          <span className={utils.cn('text-xs', tw.text.tertiary)}>
                            {rec.category}
                          </span>
                        </div>
                        <span className={utils.cn('text-xs', tw.text.tertiary)}>
                          {rec.estimated_timeline}
                        </span>
                      </div>
                      <h4 className={utils.cn('font-medium text-sm mb-1', tw.text.primary)}>
                        {rec.title}
                      </h4>
                      <p className={utils.cn('text-xs', tw.text.secondary)}>
                        {rec.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'technical' && (
            <CriticalGapsList 
              gaps={gapData.high_impact_gaps}
              type="technical"
            />
          )}

          {activeTab === 'compliance' && (
            <ComplianceRiskMatrix 
              risks={gapData.compliance_risks}
            />
          )}

          {activeTab === 'leadership' && (
            <LeadershipGapRadar 
              gaps={gapData.leadership_gaps}
            />
          )}

          {activeTab === 'domain' && (
            <DomainKnowledgeMatrix 
              deficits={gapData.domain_deficits}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
} 
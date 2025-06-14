'use client'

import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { HRDashboardData } from '@/types/hr-analytics'
import GapOverviewDashboard from './GapOverviewDashboard'

interface InsightsTabProps {
  data: HRDashboardData | null
  organizationName: string
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

export default function InsightsTab({ data, organizationName }: InsightsTabProps) {
  if (!data) {
    return (
      <div className="p-8 rounded-3xl backdrop-blur-xl border border-gray-600/30 text-center"
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <Brain className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
          No Analytics Data Available
        </h3>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Complete skill assessments to generate insights and recommendations.
        </p>
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
      <motion.div variants={cardVariants}>
        <h2 className={utils.cn('text-2xl font-light tracking-tight', tw.text.primary)}>
          🧠 AI-Powered Skills Gap Analysis
        </h2>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Critical analysis of skill gaps, compliance risks, and growth opportunities
        </p>
      </motion.div>

      {/* Gap Analysis Dashboard */}
      <motion.div variants={cardVariants}>
        <GapOverviewDashboard organizationName={organizationName} />
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>Critical Gaps</h3>
          </div>
          <p className={utils.cn('text-3xl font-bold text-red-400', tw.typography.monoNumbers)}>
            {Object.values(data.critical_gaps || {}).reduce((sum, gaps: any) => 
              sum + (Array.isArray(gaps) ? gaps.length : 0), 0)}
          </p>
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            Require immediate attention
          </p>
        </div>

        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>Overall Score</h3>
          </div>
          <p className={utils.cn('text-3xl font-bold text-green-400', tw.typography.monoNumbers)}>
            {Math.round(data.overview.overall_competency)}%
          </p>
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            Organization competency
          </p>
        </div>

        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-blue-400" />
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>Coverage</h3>
          </div>
          <p className={utils.cn('text-3xl font-bold text-blue-400', tw.typography.monoNumbers)}>
            {Math.round((data.overview.technical_coverage + data.overview.soft_skill_coverage + data.overview.domain_coverage + data.overview.sop_coverage) / 4)}%
          </p>
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            Average skill coverage
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
} 
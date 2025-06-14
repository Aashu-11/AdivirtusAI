'use client'

import { motion } from 'framer-motion'
import { Radar, BarChart3, TrendingUp, Target } from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { HRDashboardData } from '@/types/hr-analytics'
import DepartmentSkillMatrix from './DepartmentSkillMatrix'
import CompetencyDistribution from './CompetencyDistribution'
import SkillMaturityHeatmap from './SkillMaturityHeatmap'

interface AnalyticsTabProps {
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

export default function AnalyticsTab({ data, organizationName }: AnalyticsTabProps) {
  if (!data) {
    return (
      <div className="p-8 rounded-3xl backdrop-blur-xl border border-gray-600/30 text-center"
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <Radar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
          No Analytics Data Available
        </h3>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Complete skill assessments to generate analytics and radar visualizations.
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
          📊 Advanced Analytics & Radar View
        </h2>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Interactive skill matrix visualization and competency analytics
        </p>
      </motion.div>

      {/* Radar Chart Section */}
      <motion.div variants={cardVariants}>
        <DepartmentSkillMatrix organizationName={organizationName} />
      </motion.div>

      {/* Analytics Grid */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Competency Distribution */}
        <div className="space-y-6">
          <h3 className={utils.cn('text-xl font-medium flex items-center gap-3', tw.text.primary)}>
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Competency Distribution
          </h3>
          <CompetencyDistribution />
        </div>

        {/* Skill Maturity Heatmap */}
        <div className="space-y-6">
          <h3 className={utils.cn('text-xl font-medium flex items-center gap-3', tw.text.primary)}>
            <Target className="w-5 h-5 text-purple-400" />
            Skill Maturity Matrix
          </h3>
          <SkillMaturityHeatmap />
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            Average competency across all skills
          </p>
        </div>

        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-blue-400" />
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>Technical Coverage</h3>
          </div>
          <p className={utils.cn('text-3xl font-bold text-blue-400', tw.typography.monoNumbers)}>
            {Math.round(data.overview.technical_coverage)}%
          </p>
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            Technical skills competency
          </p>
        </div>

        <div className="p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h3 className={utils.cn('font-semibold', tw.text.primary)}>Soft Skills</h3>
          </div>
          <p className={utils.cn('text-3xl font-bold text-purple-400', tw.typography.monoNumbers)}>
            {Math.round(data.overview.soft_skill_coverage)}%
          </p>
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            Soft skills development
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
} 
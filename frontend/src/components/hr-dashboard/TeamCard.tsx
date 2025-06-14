'use client'

import { motion } from 'framer-motion'
import { tw, utils } from '@/config/design-system'
import { TeamCardProps } from '@/types/hr-analytics'
import { hrAnalyticsUtils } from '@/services/hr-analytics'

export default function TeamCard({ team, onClick }: TeamCardProps) {
  const competencyLevel = hrAnalyticsUtils.getCompetencyLevel(team.avg_competency);
  
  const handleClick = () => {
    if (onClick) {
      onClick(team);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={handleClick}
      className={utils.cn(
        "p-6 rounded-xl border transition-all duration-300 cursor-pointer",
        tw.bg.card,
        tw.border.primary,
        "hover:shadow-lg hover:scale-[1.02]",
        onClick && "hover:border-blue-500/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={utils.cn(tw.typography.cardHeading, "mb-1")}>
            {team.team_name}
          </h3>
          <p className={tw.typography.smallLabel}>
            {team.employee_count} {team.employee_count === 1 ? 'employee' : 'employees'}
          </p>
        </div>
        
        {/* Competency Badge */}
        <div className={utils.cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          competencyLevel.color === 'emerald' && tw.bgAccent.emerald + ' ' + tw.text.emerald,
          competencyLevel.color === 'blue' && tw.bgAccent.blue + ' ' + tw.text.blue,
          competencyLevel.color === 'amber' && tw.bgAccent.amber + ' ' + tw.text.amber,
          competencyLevel.color === 'rose' && tw.bgAccent.rose + ' ' + tw.text.rose
        )}>
          {competencyLevel.label}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className={utils.cn("text-2xl font-bold", tw.text.primary)}>
            {hrAnalyticsUtils.formatCompetency(team.avg_competency)}
          </div>
          <div className={tw.typography.smallLabel}>
            Avg Competency
          </div>
        </div>
        
        <div>
          <div className={utils.cn("text-2xl font-bold", tw.text.primary)}>
            {team.total_gaps}
          </div>
          <div className={tw.typography.smallLabel}>
            Total Gaps
          </div>
        </div>
      </div>

      {/* Coverage Metrics */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={tw.typography.bodyText}>Technical</span>
          <span className={tw.text.primary}>
            {hrAnalyticsUtils.formatCompetency(team.technical_coverage)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={tw.typography.bodyText}>Soft Skills</span>
          <span className={tw.text.primary}>
            {hrAnalyticsUtils.formatCompetency(team.soft_skill_coverage)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={tw.typography.bodyText}>Domain</span>
          <span className={tw.text.primary}>
            {hrAnalyticsUtils.formatCompetency(team.domain_coverage)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={tw.typography.bodyText}>SOPs</span>
          <span className={tw.text.primary}>
            {hrAnalyticsUtils.formatCompetency(team.sop_coverage)}
          </span>
        </div>
      </div>

      {/* Critical Gaps Indicator */}
      {team.critical_gaps > 0 && (
        <div className={utils.cn(
          "mt-4 p-3 rounded-lg flex items-center gap-2",
          tw.bgAccent.rose
        )}>
          <svg className={utils.cn("w-4 h-4", tw.text.rose)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className={utils.cn("text-xs font-medium", tw.text.rose)}>
            {team.critical_gaps} critical {team.critical_gaps === 1 ? 'employee' : 'employees'}
          </span>
        </div>
      )}

      {/* Click indicator */}
      {onClick && (
        <div className="mt-4 flex items-center justify-center">
          <svg className={utils.cn("w-4 h-4", tw.text.secondary)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </motion.div>
  );
} 
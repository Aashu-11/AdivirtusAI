import { motion, AnimatePresence } from 'framer-motion'
import { tw, components, utils } from '@/config/design-system'
import { Skill, CompetencyColorScheme } from '../types'

interface SkillsListProps {
  skills: Skill[]
  isDetailedView: boolean
}

function getCompetencyColor(competency: number): CompetencyColorScheme {
  if (competency >= 80) return 'emerald'
  if (competency >= 70) return 'amber'
  return 'rose'
}

function SkillCard({ skill, index, isDetailedView }: { 
  skill: Skill
  index: number
  isDetailedView: boolean 
}) {
  const competency = skill.competency || skill.competency_level || 0
  const hasGap = competency < 70
  const gapAmount = hasGap ? 70 - competency : 0
  const colorScheme = getCompetencyColor(competency)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.03 }}
      className={utils.cn(
        'p-4 sm:p-5 lg:p-6 rounded-2xl',
        'shadow-sm hover:shadow-md transition-all duration-300',
        tw.bg.card
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <h4 className={utils.cn(
          tw.typography.cardHeading, 
          'mb-3 text-sm sm:text-base lg:text-lg leading-tight font-semibold'
        )}>
          {skill.name}
        </h4>
        
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className={utils.cn(tw.text.secondary, 'font-medium')}>Competency</span>
            <span className={utils.cn(
              tw.typography.monoNumbers,
              'font-bold text-lg',
              colorScheme === 'emerald' ? tw.text.emerald :
              colorScheme === 'amber' ? tw.text.amber : tw.text.rose
            )}>
              {competency}%
            </span>
          </div>
          
          {hasGap && (
            <div className="flex items-center justify-between">
              <span className={utils.cn(tw.text.rose, 'font-medium')}>Gap</span>
              <span className={utils.cn(tw.text.rose, tw.typography.monoNumbers, 'font-bold')}>
                {gapAmount}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar - Minimal and Clean */}
      <div className="w-full bg-gray-800/50 rounded-full h-2 mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${competency}%` }}
          transition={{ duration: 0.8, delay: 0.1 + index * 0.05 }}
          className={utils.cn(
            'h-full rounded-full relative',
            colorScheme === 'emerald' ? 'bg-emerald-500' :
            colorScheme === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
          )}
        >
          {/* Subtle glow */}
          <div className={utils.cn(
            'absolute inset-0 rounded-full opacity-40',
            colorScheme === 'emerald' ? 'shadow-emerald-500/40' :
            colorScheme === 'amber' ? 'shadow-amber-500/40' : 'shadow-rose-500/40'
          )} />
        </motion.div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        {hasGap ? (
          <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium">
            Needs Improvement
          </div>
        ) : (
          <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
            Proficient
          </div>
        )}
      </div>

      {/* Detailed View Content */}
      <AnimatePresence mode="wait">
        {isDetailedView && (
          <motion.div
            key={`detailed-${skill.id || index}`}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ 
              opacity: 1, 
              height: 'auto', 
              marginTop: '1rem',
              transition: { duration: 0.3, ease: "easeInOut" }
            }}
            exit={{ 
              opacity: 0, 
              height: 0, 
              marginTop: 0,
              transition: { duration: 0.2, ease: "easeInOut" }
            }}
            className="space-y-4 pt-4 overflow-hidden"
            style={{ 
              borderTop: `1px solid ${hasGap ? 'rgb(239 68 68 / 0.2)' : 'rgb(75 85 99 / 0.2)'}` 
            }}
          >
            {skill.description && (
              <div>
                <h5 className={utils.cn(tw.text.primary, 'text-sm font-semibold mb-2')}>
                  Description
                </h5>
                <p className={utils.cn(tw.text.secondary, 'text-sm leading-relaxed')}>
                  {skill.description}
                </p>
              </div>
            )}

            {skill.assessment_details?.root_problem && (
              <div>
                <h5 className={utils.cn(tw.text.primary, 'text-sm font-semibold mb-2')}>
                  {hasGap ? 'Gap Analysis' : 'Assessment Notes'}
                </h5>
                <p className={utils.cn(
                  hasGap ? tw.text.rose : tw.text.secondary,
                  'text-sm leading-relaxed'
                )}>
                  {skill.assessment_details.root_problem}
                </p>
              </div>
            )}

            {skill.assessment_details?.evidence && (
              <div>
                <h5 className={utils.cn(tw.text.primary, 'text-sm font-semibold mb-2')}>
                  Evidence
                </h5>
                <p className={utils.cn(tw.text.secondary, 'text-sm leading-relaxed')}>
                  {skill.assessment_details.evidence}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function SkillsList({ skills, isDetailedView }: SkillsListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {skills.length === 0 ? (
        <div className={utils.cn(
          'text-center py-12 sm:py-16 lg:py-20', 
          tw.bg.card, 
          'rounded-2xl shadow-sm'
        )}>
          <div className="max-w-md mx-auto px-4">
            <div className={utils.cn('w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4', tw.bgAccent.blue)}>
              <svg className={utils.cn('w-8 h-8', tw.text.blue)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className={utils.cn(tw.typography.sectionHeading, 'mb-2')}>
              No Skills Found
            </h3>
            <p className={utils.cn(tw.text.secondary, 'text-sm leading-relaxed')}>
              No skills found in this category. Try selecting a different category or check if your assessment has been completed.
            </p>
          </div>
        </div>
      ) : (
        /* 2-Column Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {skills.map((skill, index) => (
            <SkillCard
              key={`skill-${skill.id || index}-${isDetailedView ? 'detailed' : 'simple'}`}
              skill={skill}
              index={index}
              isDetailedView={isDetailedView}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
} 
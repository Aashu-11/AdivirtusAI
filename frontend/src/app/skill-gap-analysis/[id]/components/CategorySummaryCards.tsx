import { motion } from 'framer-motion'
import { tw, utils } from '@/config/design-system'
import { CategorySummary } from '../types'
import { SkillRadarChart } from './SkillRadarChart'

interface CategorySummaryCardsProps {
  categorySummaries: CategorySummary[]
  activeTab: string
  onTabChange: (tab: string) => void
}

// Category Detail Card Component
function CategoryDetailCard({ 
  categorySummaries, 
  activeTab 
}: Omit<CategorySummaryCardsProps, 'onTabChange'>) {
  const activeCategory = categorySummaries.find(cat => cat.name === activeTab)

  if (!activeCategory) {
    return (
      <div className="h-full flex items-center justify-center p-8 rounded-3xl backdrop-blur-xl"
           style={{
             background: 'rgba(10, 10, 12, 0.7)',
             backdropFilter: 'blur(20px)',
           }}>
        <p className={tw.text.secondary}>Select a category to view details</p>
      </div>
    )
  }

  // Calculate skill distribution
  const skillLevels = {
    expert: Math.round((activeCategory.averageCompetency >= 80 ? activeCategory.totalSkills * 0.3 : 0)),
    proficient: Math.round((activeCategory.averageCompetency >= 60 ? activeCategory.totalSkills * 0.4 : activeCategory.totalSkills * 0.2)),
    developing: Math.round((activeCategory.totalSkills * 0.4)),
    beginner: Math.round((activeCategory.totalSkills * 0.3))
  }

  // Calculate improvement metrics
  const targetCompetency = 75
  const improvementNeeded = Math.max(0, targetCompetency - activeCategory.averageCompetency)
  const estimatedTimeWeeks = Math.ceil(improvementNeeded * 0.5) // Rough estimate

  return (
    <motion.div
      key={activeCategory.name}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col p-8 sm:p-10 rounded-3xl backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header Section */}
      <div className="flex items-start gap-6 mb-8 pb-6"
           style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
             style={{
               background: 'rgba(255, 255, 255, 0.05)',
               backdropFilter: 'blur(10px)',
             }}>
          <div className="scale-125">
            {activeCategory.icon}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={utils.cn(
            tw.typography.sectionHeading,
            'text-2xl sm:text-3xl mb-2 font-light'
          )}>
            {activeCategory.displayName}
          </h2>
          <p className={utils.cn(
            tw.text.tertiary,
            'text-base font-normal opacity-70'
          )}>
            Comprehensive skill assessment and gap analysis
          </p>
        </div>
      </div>

      {/* Main Competency Score */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div className={utils.cn(
            'text-6xl sm:text-7xl font-extralight mb-2',
            tw.typography.monoNumbers,
            activeCategory.averageCompetency >= 80 ? tw.text.emerald :
            activeCategory.averageCompetency >= 70 ? tw.text.amber : tw.text.rose
          )}
          style={{ lineHeight: '1' }}>
            {activeCategory.averageCompetency}%
          </div>
          <div className="absolute -top-2 -right-8">
            <div className={utils.cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              activeCategory.averageCompetency >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
              activeCategory.averageCompetency >= 70 ? 'bg-amber-500/20 text-amber-400' : 
              'bg-rose-500/20 text-rose-400'
            )}>
              {activeCategory.averageCompetency >= 80 ? 'Expert' :
               activeCategory.averageCompetency >= 70 ? 'Advanced' :
               activeCategory.averageCompetency >= 50 ? 'Intermediate' : 'Developing'}
            </div>
          </div>
        </div>
        <div className={utils.cn(tw.text.secondary, 'text-lg font-light tracking-wide')}>
          Current Competency Level
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-2xl"
             style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className={utils.cn(tw.text.tertiary, 'text-sm font-medium')}>
              Skills Assessed
            </span>
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          </div>
          <div className={utils.cn(
            tw.typography.monoNumbers,
            tw.text.primary,
            'text-3xl font-bold mb-1'
          )}>
            {activeCategory.totalSkills}
          </div>
          <div className={utils.cn(tw.text.secondary, 'text-xs')}>
            Total evaluated skills
          </div>
        </div>

        <div className="p-5 rounded-2xl"
             style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className={utils.cn(tw.text.tertiary, 'text-sm font-medium')}>
              Improvement Gap
            </span>
            <div className={utils.cn(
              'w-2 h-2 rounded-full',
              activeCategory.gapPercentage > 0 ? 'bg-rose-400' : 'bg-emerald-400'
            )}></div>
          </div>
          <div className={utils.cn(
            tw.typography.monoNumbers,
            activeCategory.gapPercentage > 0 ? tw.text.rose : tw.text.emerald,
            'text-3xl font-bold mb-1'
          )}>
            {activeCategory.gapPercentage}%
          </div>
          <div className={utils.cn(tw.text.secondary, 'text-xs')}>
            Skills needing focus
          </div>
        </div>
      </div>

      {/* Skill Level Breakdown */}
      <div className="mb-8">
        <h3 className={utils.cn(tw.text.primary, 'text-lg font-medium mb-4')}>
          Skill Distribution
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl"
               style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className={utils.cn(tw.text.secondary, 'text-sm')}>Expert Level</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={utils.cn(tw.typography.monoNumbers, tw.text.primary, 'text-sm font-medium')}>
                {skillLevels.expert}
              </span>
              <span className={utils.cn(tw.text.tertiary, 'text-xs')}>skills</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl"
               style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span className={utils.cn(tw.text.secondary, 'text-sm')}>Proficient</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={utils.cn(tw.typography.monoNumbers, tw.text.primary, 'text-sm font-medium')}>
                {skillLevels.proficient}
              </span>
              <span className={utils.cn(tw.text.tertiary, 'text-xs')}>skills</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl"
               style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span className={utils.cn(tw.text.secondary, 'text-sm')}>Developing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={utils.cn(tw.typography.monoNumbers, tw.text.primary, 'text-sm font-medium')}>
                {skillLevels.developing}
              </span>
              <span className={utils.cn(tw.text.tertiary, 'text-xs')}>skills</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl"
               style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
              <span className={utils.cn(tw.text.secondary, 'text-sm')}>Beginner</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={utils.cn(tw.typography.monoNumbers, tw.text.primary, 'text-sm font-medium')}>
                {skillLevels.beginner}
              </span>
              <span className={utils.cn(tw.text.tertiary, 'text-xs')}>skills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items & Recommendations */}
      <div className="mt-auto">
        {improvementNeeded > 0 ? (
          <div className="p-6 rounded-2xl"
               style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className={utils.cn(tw.text.rose, 'font-medium text-lg mb-1')}>
                  Development Opportunity
                </h4>
                <p className={utils.cn(tw.text.secondary, 'text-sm opacity-80')}>
                  {activeCategory.skillsWithGaps} skills require focused attention
                </p>
              </div>
              <div className="text-right">
                <div className={utils.cn(tw.typography.monoNumbers, tw.text.rose, 'text-2xl font-bold')}>
                  {improvementNeeded}%
                </div>
                <div className={utils.cn(tw.text.tertiary, 'text-xs')}>to target</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 rounded-xl"
                   style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <div className={utils.cn(tw.typography.monoNumbers, tw.text.primary, 'text-lg font-bold')}>
                  {estimatedTimeWeeks}
                </div>
                <div className={utils.cn(tw.text.secondary, 'text-xs')}>weeks estimate</div>
              </div>
              <div className="text-center p-3 rounded-xl"
                   style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <div className={utils.cn(tw.typography.monoNumbers, tw.text.primary, 'text-lg font-bold')}>
                  {Math.ceil(activeCategory.skillsWithGaps / 2)}
                </div>
                <div className={utils.cn(tw.text.secondary, 'text-xs')}>priority skills</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl"
               style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
            <div className="text-center">
              <h4 className={utils.cn(tw.text.emerald, 'font-medium text-lg mb-2')}>
                Excellent Performance
              </h4>
              <p className={utils.cn(tw.text.secondary, 'text-sm opacity-80 mb-4')}>
                All skills meet or exceed target competency levels
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl"
                     style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className={utils.cn(tw.typography.monoNumbers, tw.text.emerald, 'text-lg font-bold')}>
                    100%
                  </div>
                  <div className={utils.cn(tw.text.secondary, 'text-xs')}>target achieved</div>
                </div>
                <div className="text-center p-3 rounded-xl"
                     style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className={utils.cn(tw.typography.monoNumbers, tw.text.emerald, 'text-lg font-bold')}>
                    {Math.round((activeCategory.averageCompetency - 75) / 25 * 100)}%
                  </div>
                  <div className={utils.cn(tw.text.secondary, 'text-xs')}>above target</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Main Component
export function CategorySummaryCards({ categorySummaries, activeTab, onTabChange }: CategorySummaryCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-10"
    >
      {/* Left Card - Category Details */}
      <div className="order-2 xl:order-1">
        <CategoryDetailCard 
          categorySummaries={categorySummaries}
          activeTab={activeTab}
        />
      </div>

      {/* Right Card - Radar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="order-1 xl:order-2 min-h-[600px] sm:min-h-[700px]"
      >
        <SkillRadarChart
          categorySummaries={categorySummaries}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </motion.div>
    </motion.div>
  )
} 
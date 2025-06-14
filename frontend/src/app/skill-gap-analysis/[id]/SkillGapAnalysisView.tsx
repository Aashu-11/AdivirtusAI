'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { tw, components, utils, fonts } from '@/config/design-system'
import { CategorySummaryCards } from './components/CategorySummaryCards'
import { TabsAndControls } from './components/TabsAndControls'
import { SkillsList } from './components/SkillsList'
import { LoadingState } from './components/LoadingState'
import { ErrorState } from './components/ErrorState'
import { useSkillGapData } from './hooks/useSkillGapData'
import { useSkillCategories } from './hooks/useSkillCategories'

interface SkillGapAnalysisViewProps {
  baselineId: string
}

export function SkillGapAnalysisView({ baselineId }: SkillGapAnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<string>('technical')
  const [isDetailedView, setIsDetailedView] = useState(false)
  
  const { gapData, loading, error } = useSkillGapData(baselineId)
  const { categorySummaries, getSkillsByCategory } = useSkillCategories(gapData)

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  const activeSkills = getSkillsByCategory(activeTab)

  return (
    <div
      className={utils.cn('w-full py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6', tw.bg.primary)}
      style={{ fontFamily: fonts.primary }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 lg:mb-10"
        >
          <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className={utils.cn(
                  tw.typography.mainHeading, 
                  'mb-2 text-2xl sm:text-3xl lg:text-4xl'
                )}>
                  Skill Gap Analysis
                </h1>
                <p className={utils.cn(
                  tw.typography.bodyText, 
                  'text-sm sm:text-base max-w-full lg:max-w-3xl leading-relaxed'
                )}>
                  Compare your current skill levels against the required competencies to identify areas for growth.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="/learning-profile"
                  className={utils.cn(
                    components.button.secondary,
                    'flex items-center justify-center w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base',
                    'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
                  )}
                >
                  <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">Back to Profile</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Summary Cards */}
        <CategorySummaryCards
          categorySummaries={categorySummaries}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tabs and Controls */}
        <TabsAndControls
          categorySummaries={categorySummaries}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isDetailedView={isDetailedView}
          onDetailedViewChange={setIsDetailedView}
        />

        {/* Skills List */}
        <SkillsList
          skills={activeSkills}
          isDetailedView={isDetailedView}
        />
      </div>
    </div>
  )
} 
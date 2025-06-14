import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { tw, components, utils } from '@/config/design-system'
import { CategorySummary } from '../types'

interface TabsAndControlsProps {
  categorySummaries: CategorySummary[]
  activeTab: string
  onTabChange: (tab: string) => void
  isDetailedView: boolean
  onDetailedViewChange: (detailed: boolean) => void
}

export function TabsAndControls({ 
  categorySummaries, 
  activeTab, 
  onTabChange, 
  isDetailedView, 
  onDetailedViewChange 
}: TabsAndControlsProps) {
  const handleDetailedToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDetailedViewChange(!isDetailedView)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={utils.cn('p-3 sm:p-4 lg:p-5 rounded-2xl mb-4 sm:mb-6', tw.bg.card, tw.border.primary)}
    >
      <div className="flex flex-col gap-4 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {categorySummaries.map((category) => (
            <button
              key={category.name}
              onClick={() => onTabChange(category.name)}
              className={utils.cn(
                'px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                activeTab === category.name
                  ? `${tw.bgAccent.blue} ${tw.text.blue} ${tw.border.blue} border`
                  : `${tw.bg.nested} ${tw.text.secondary} ${tw.hover.subtle} border border-transparent hover:border-gray-700`
              )}
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span className="flex-shrink-0">{category.icon}</span>
                <span className="hidden sm:inline truncate">{category.displayName}</span>
                <span className="sm:hidden truncate">
                  {category.displayName.split(' ')[0]}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex justify-end sm:justify-start">
          <button
            onClick={handleDetailedToggle}
            className={utils.cn(
              components.button.secondary,
              'flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
              'relative z-10 pointer-events-auto' // Ensure button is clickable
            )}
          >
            {isDetailedView ? (
              <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            ) : (
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {isDetailedView ? 'Simplified' : 'Detailed'}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  )
} 
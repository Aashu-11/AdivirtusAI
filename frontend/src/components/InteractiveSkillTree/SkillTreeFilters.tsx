'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { FilterOptions } from '../../types/InteractiveSkillTree.types'
import { tw, components, fonts, utils } from '@/config/design-system'

interface SkillTreeFiltersProps {
  showFilters: boolean
  filterOptions: FilterOptions
  setFilterOptions: (options: FilterOptions | ((prev: FilterOptions) => FilterOptions)) => void
  availableCategories: string[]
}

export default function SkillTreeFilters({
  showFilters,
  filterOptions,
  setFilterOptions,
  availableCategories
}: SkillTreeFiltersProps) {
  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-4 overflow-hidden"
        >
          <div className={utils.cn("p-4 rounded-xl border space-y-4", tw.bg.card, tw.border.primary)}>
            {/* Search */}
            <div>
              <label className={utils.cn("mb-2 block", tw.typography.smallLabel)}>Search Skills</label>
              <div className="relative">
                <Search className={utils.cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", tw.text.tertiary)} />
                <input
                  type="text"
                  value={filterOptions.searchTerm}
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder="Search by name or category..."
                  className={utils.cn(
                    "w-full pl-10 pr-3 py-2 rounded-lg text-sm border transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                    tw.bg.nested,
                    tw.border.primary,
                    tw.text.primary,
                    "placeholder:" + tw.text.tertiary
                  )}
                />
              </div>
            </div>
            
            {/* Categories */}
            <div>
              <label className={utils.cn("mb-2 block", tw.typography.smallLabel)}>Categories</label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setFilterOptions(prev => ({
                        ...prev,
                        categories: prev.categories.includes(category)
                          ? prev.categories.filter(c => c !== category)
                          : [...prev.categories, category]
                      }))
                    }}
                    className={utils.cn(
                      "px-3 py-1 rounded-lg text-xs transition-all duration-200 border",
                      filterOptions.categories.includes(category)
                        ? utils.cn(tw.bgAccent.blue, tw.text.blue, tw.border.blue)
                        : utils.cn(tw.bg.nested, tw.text.tertiary, tw.border.primary)
                    )}
                  >
                    {category.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Status Filters */}
            <div>
              <label className={utils.cn("mb-2 block", tw.typography.smallLabel)}>Status</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterOptions(prev => ({ ...prev, showAchieved: !prev.showAchieved }))}
                  className={utils.cn(
                    "px-3 py-1 rounded-lg text-xs transition-all duration-200 flex items-center gap-2 border",
                    filterOptions.showAchieved
                      ? utils.cn(tw.bgAccent.emerald, tw.text.emerald, tw.border.emerald)
                      : utils.cn(tw.bg.nested, tw.text.tertiary, tw.border.primary)
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Achieved
                </button>
                <button
                  onClick={() => setFilterOptions(prev => ({ ...prev, showInProgress: !prev.showInProgress }))}
                  className={utils.cn(
                    "px-3 py-1 rounded-lg text-xs transition-all duration-200 flex items-center gap-2 border",
                    filterOptions.showInProgress
                      ? utils.cn(tw.bgAccent.blue, tw.text.blue, tw.border.blue)
                      : utils.cn(tw.bg.nested, tw.text.tertiary, tw.border.primary)
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  In Progress
                </button>
                <button
                  onClick={() => setFilterOptions(prev => ({ ...prev, showNeedsWork: !prev.showNeedsWork }))}
                  className={utils.cn(
                    "px-3 py-1 rounded-lg text-xs transition-all duration-200 flex items-center gap-2 border",
                    filterOptions.showNeedsWork
                      ? utils.cn(tw.bgAccent.rose, tw.text.rose, tw.border.rose)
                      : utils.cn(tw.bg.nested, tw.text.tertiary, tw.border.primary)
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Needs Work
                </button>
              </div>
            </div>
            
            {/* Competency Range */}
            <div>
              <label className={utils.cn("mb-2 block", tw.typography.smallLabel)}>
                Competency Range: {filterOptions.competencyRange[0]}% - {filterOptions.competencyRange[1]}%
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterOptions.competencyRange[0]}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    competencyRange: [parseInt(e.target.value), prev.competencyRange[1]]
                  }))}
                  className="flex-1 accent-blue-500"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filterOptions.competencyRange[1]}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    competencyRange: [prev.competencyRange[0], parseInt(e.target.value)]
                  }))}
                  className="flex-1 accent-blue-500"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 
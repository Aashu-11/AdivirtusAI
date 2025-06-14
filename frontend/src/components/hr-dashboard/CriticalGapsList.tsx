'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingDown, 
  Users, 
  AlertTriangle,
  ChevronDown,
  Filter,
  Search,
  Target,
  Clock
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { HighImpactGap } from '@/types/hr-analytics'

interface CriticalGapsListProps {
  gaps: HighImpactGap[]
  type: 'technical' | 'general'
}

const RISK_COLORS = {
  5: '#EF4444', // Critical - Red
  4: '#F97316', // High - Orange  
  3: '#F59E0B', // Medium - Amber
  2: '#22C55E', // Low - Green
  1: '#3B82F6'  // Minimal - Blue
}

const getRiskColor = (riskLevel: number): string => {
  return RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS[1]
}

const formatRiskLevel = (riskLevel: number): string => {
  if (riskLevel >= 5) return 'Critical'
  if (riskLevel >= 4) return 'High'
  if (riskLevel >= 3) return 'Medium'
  if (riskLevel >= 2) return 'Low'
  return 'Minimal'
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
}

export default function CriticalGapsList({ gaps, type }: CriticalGapsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'risk_level' | 'gap_percentage' | 'affected_count'>('risk_level')
  const [expandedGap, setExpandedGap] = useState<string | null>(null)

  const filteredAndSortedGaps = useMemo(() => {
    let filtered = gaps.filter(gap => {
      const matchesSearch = gap.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          gap.skill_category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRisk = selectedRiskLevel === null || gap.risk_level === selectedRiskLevel
      const matchesCategory = selectedCategory === null || gap.skill_category === selectedCategory
      
      return matchesSearch && matchesRisk && matchesCategory
    })

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'risk_level':
          return b.risk_level - a.risk_level
        case 'gap_percentage':
          return b.average_gap_percentage - a.average_gap_percentage
        case 'affected_count':
          return b.affected_employee_count - a.affected_employee_count
        default:
          return 0
      }
    })

    return filtered
  }, [gaps, searchTerm, selectedRiskLevel, selectedCategory, sortBy])

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(gaps.map(gap => gap.skill_category)))
  }, [gaps])

  const uniqueRiskLevels = useMemo(() => {
    return Array.from(new Set(gaps.map(gap => gap.risk_level))).sort((a, b) => b - a)
  }, [gaps])

  if (gaps.length === 0) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl text-center" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <Target className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
          No Critical Gaps Found
        </h3>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Great news! No critical {type} gaps were identified in the analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 min-w-[200px]"
            />
          </div>

          {/* Risk Level Filter */}
          <select
            value={selectedRiskLevel?.toString() || ''}
            onChange={(e) => setSelectedRiskLevel(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Risk Levels</option>
            {uniqueRiskLevels.map(level => (
              <option key={level} value={level}>
                {formatRiskLevel(level)} Risk
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>
                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className={utils.cn('text-sm', tw.text.tertiary)}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="risk_level">Risk Level</option>
            <option value="gap_percentage">Gap Percentage</option>
            <option value="affected_count">Affected Employees</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Showing {filteredAndSortedGaps.length} of {gaps.length} critical gaps
        </p>
        
        {filteredAndSortedGaps.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className={utils.cn('text-xs', tw.text.tertiary)}>
                {filteredAndSortedGaps.filter(g => g.risk_level >= 5).length} Critical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className={utils.cn('text-xs', tw.text.tertiary)}>
                {filteredAndSortedGaps.filter(g => g.risk_level === 4).length} High
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Gaps List */}
      <div className="space-y-4">
        {filteredAndSortedGaps.map((gap, index) => (
          <motion.div
            key={`${gap.skill_name}-${gap.skill_category}`}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="p-6 rounded-3xl backdrop-blur-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              background: 'rgba(10, 10, 12, 0.7)'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getRiskColor(gap.risk_level) }}
                  />
                  <h3 className={utils.cn('text-lg font-medium', tw.text.primary)}>
                    {gap.skill_name}
                  </h3>
                  <span className={utils.cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    gap.risk_level >= 5 ? 'bg-red-500/20 text-red-400' :
                    gap.risk_level >= 4 ? 'bg-orange-500/20 text-orange-400' :
                    gap.risk_level >= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  )}>
                    {formatRiskLevel(gap.risk_level)} Risk
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Average Gap</p>
                      <p className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-red-400')}>
                        {gap.average_gap_percentage}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <Users className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Affected Employees</p>
                      <p className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-orange-400')}>
                        {gap.affected_employee_count}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Max Gap</p>
                      <p className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-yellow-400')}>
                        {gap.max_gap_percentage}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className={utils.cn('text-sm font-medium mb-1', tw.text.secondary)}>
                    Business Impact
                  </p>
                  <p className={utils.cn('text-sm', tw.text.tertiary)}>
                    {gap.business_impact}
                  </p>
                </div>

                {/* Recommended Actions */}
                <div className="mb-4">
                  <p className={utils.cn('text-sm font-medium mb-2', tw.text.secondary)}>
                    Recommended Actions
                  </p>
                  <div className="space-y-1">
                    {gap.recommended_actions.slice(0, 3).map((action, actionIndex) => (
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

              <button
                onClick={() => setExpandedGap(expandedGap === gap.skill_name ? null : gap.skill_name)}
                className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors ml-4"
              >
                <ChevronDown className={utils.cn(
                  "w-4 h-4 transition-transform duration-200",
                  expandedGap === gap.skill_name && "rotate-180"
                )} />
              </button>
            </div>

            {/* Expanded Details */}
            {expandedGap === gap.skill_name && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-700/30"
              >
                <h4 className={utils.cn('text-sm font-medium mb-3', tw.text.secondary)}>
                  Affected Employees ({gap.affected_employees.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gap.affected_employees.map((employee, empIndex) => (
                    <div 
                      key={employee.employee_id} 
                      className="p-3 rounded-xl bg-gray-800/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className={utils.cn('font-medium text-sm', tw.text.primary)}>
                          {employee.name}
                        </p>
                        <span className={utils.cn('text-xs', tw.text.tertiary)}>
                          {employee.department}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={utils.cn('text-xs', tw.text.tertiary)}>
                            Current:
                          </span>
                          <span className={utils.cn('text-sm font-medium', tw.typography.monoNumbers, 'text-orange-400')}>
                            {employee.current_competency}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={utils.cn('text-xs', tw.text.tertiary)}>
                            Gap:
                          </span>
                          <span className={utils.cn('text-sm font-medium', tw.typography.monoNumbers, 'text-red-400')}>
                            {employee.gap_percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredAndSortedGaps.length === 0 && (
        <div className="text-center py-8">
          <Filter className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            No gaps match the current filters
          </p>
        </div>
      )}
    </div>
  )
} 
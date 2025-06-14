'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  UserCheck, 
  TrendingDown, 
  Users,
  Target,
  Crown,
  Filter,
  Search
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { LeadershipGap } from '@/types/hr-analytics'

interface LeadershipGapRadarProps {
  gaps: LeadershipGap[]
}

const PRIORITY_COLORS = {
  5: '#EF4444', // Critical
  4: '#F97316', // High  
  3: '#F59E0B', // Medium
  2: '#22C55E', // Low
  1: '#3B82F6'  // Minimal
}

const getPriorityColor = (priority: number): string => {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS[1]
}

const formatPriority = (priority: number): string => {
  if (priority >= 5) return 'Critical'
  if (priority >= 4) return 'High'
  if (priority >= 3) return 'Medium'
  if (priority >= 2) return 'Low'
  return 'Minimal'
}

const getPositionLevel = (position: string): number => {
  const senior = ['director', 'vp', 'head', 'chief', 'president']
  const middle = ['manager', 'lead', 'supervisor']
  
  const posLower = position.toLowerCase()
  
  if (senior.some(title => posLower.includes(title))) return 3
  if (middle.some(title => posLower.includes(title))) return 2
  return 1
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
}

export default function LeadershipGapRadar({ gaps }: LeadershipGapRadarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<number | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'priority' | 'readiness' | 'gap_count'>('priority')

  const filteredAndSortedGaps = useMemo(() => {
    let filtered = gaps.filter(gap => {
      const matchesSearch = gap.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          gap.position.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPriority = selectedPriority === null || gap.priority_level === selectedPriority
      const matchesDepartment = selectedDepartment === null || gap.department === selectedDepartment
      const matchesLevel = selectedLevel === null || getPositionLevel(gap.position) === selectedLevel
      
      return matchesSearch && matchesPriority && matchesDepartment && matchesLevel
    })

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority_level - a.priority_level
        case 'readiness':
          return a.leadership_readiness_score - b.leadership_readiness_score
        case 'gap_count':
          return b.gap_count - a.gap_count
        default:
          return 0
      }
    })

    return filtered
  }, [gaps, searchTerm, selectedPriority, selectedDepartment, selectedLevel, sortBy])

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(gaps.map(gap => gap.department).filter(Boolean)))
  }, [gaps])

  const uniquePriorities = useMemo(() => {
    return Array.from(new Set(gaps.map(gap => gap.priority_level))).sort((a, b) => b - a)
  }, [gaps])

  const leadershipStats = useMemo(() => {
    const critical = gaps.filter(g => g.priority_level >= 5).length
    const avgReadiness = gaps.length > 0 ? gaps.reduce((sum, g) => sum + g.leadership_readiness_score, 0) / gaps.length : 0
    const totalSkillGaps = gaps.reduce((sum, g) => sum + g.gap_count, 0)
    
    return { critical, avgReadiness: Math.round(avgReadiness), totalSkillGaps }
  }, [gaps])

  if (gaps.length === 0) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl text-center" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <Crown className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
          No Leadership Gaps Found
        </h3>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          All leaders meet the required leadership competency standards.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={itemVariants}
          className="p-4 rounded-2xl backdrop-blur-xl"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-red-400')}>
                {leadershipStats.critical}
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Critical Priorities</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-4 rounded-2xl backdrop-blur-xl"
          style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-blue-400')}>
                {leadershipStats.avgReadiness}%
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Avg Readiness</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-4 rounded-2xl backdrop-blur-xl"
          style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Users className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-yellow-400')}>
                {leadershipStats.totalSkillGaps}
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Total Skill Gaps</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leaders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 min-w-[200px]"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={selectedPriority?.toString() || ''}
            onChange={(e) => setSelectedPriority(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Priorities</option>
            {uniquePriorities.map(priority => (
              <option key={priority} value={priority}>
                {formatPriority(priority)} Priority
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment || ''}
            onChange={(e) => setSelectedDepartment(e.target.value || null)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={selectedLevel?.toString() || ''}
            onChange={(e) => setSelectedLevel(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Levels</option>
            <option value="3">Senior Leadership</option>
            <option value="2">Middle Management</option>
            <option value="1">Team Leads</option>
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
            <option value="priority">Priority Level</option>
            <option value="readiness">Readiness Score</option>
            <option value="gap_count">Gap Count</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Showing {filteredAndSortedGaps.length} of {gaps.length} leadership gaps
        </p>
        
        {filteredAndSortedGaps.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className={utils.cn('text-xs', tw.text.tertiary)}>
                {filteredAndSortedGaps.filter(g => g.priority_level >= 5).length} Critical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className={utils.cn('text-xs', tw.text.tertiary)}>
                {filteredAndSortedGaps.filter(g => g.priority_level === 4).length} High
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Leadership Gaps List */}
      <div className="space-y-4">
        {filteredAndSortedGaps.map((gap, index) => {
          const positionLevel = getPositionLevel(gap.position)
          const readinessColor = gap.leadership_readiness_score >= 80 ? '#22C55E' : 
                                gap.leadership_readiness_score >= 60 ? '#F59E0B' : '#EF4444'
          
          return (
            <motion.div
              key={gap.employee_id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="p-6 rounded-3xl backdrop-blur-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200"
              style={{ 
                animationDelay: `${index * 0.05}s`,
                background: 'rgba(10, 10, 12, 0.7)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPriorityColor(gap.priority_level) }}
                  />
                  <div>
                    <h3 className={utils.cn('text-lg font-medium', tw.text.primary)}>
                      {gap.employee_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={utils.cn('text-sm', tw.text.secondary)}>
                        {gap.position}
                      </span>
                      <span className={utils.cn('text-xs', tw.text.tertiary)}>
                        • {gap.department}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={utils.cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    gap.priority_level >= 5 ? 'bg-red-500/20 text-red-400' :
                    gap.priority_level >= 4 ? 'bg-orange-500/20 text-orange-400' :
                    gap.priority_level >= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  )}>
                    {formatPriority(gap.priority_level)} Priority
                  </span>
                  
                  {positionLevel === 3 && (
                    <Crown className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gray-800/30">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg border"
                      style={{ 
                        backgroundColor: `${readinessColor}20`,
                        borderColor: `${readinessColor}40`
                      }}
                    >
                      <Target className="w-4 h-4" style={{ color: readinessColor }} />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Leadership Readiness</p>
                      <p className={utils.cn('text-xl font-semibold', tw.typography.monoNumbers)} style={{ color: readinessColor }}>
                        {gap.leadership_readiness_score}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Average Gap</p>
                      <p className={utils.cn('text-xl font-semibold', tw.typography.monoNumbers, 'text-red-400')}>
                        {gap.average_gap}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <Users className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Skill Gaps</p>
                      <p className={utils.cn('text-xl font-semibold', tw.typography.monoNumbers, 'text-yellow-400')}>
                        {gap.gap_count}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Gaps Breakdown */}
              <div className="mb-4">
                <p className={utils.cn('text-sm font-medium mb-3', tw.text.secondary)}>
                  Specific Skill Gaps ({gap.skill_gaps.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gap.skill_gaps.slice(0, 6).map((skillGap, skillIndex) => (
                    <div key={skillIndex} className="p-3 rounded-xl bg-gray-800/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className={utils.cn('font-medium text-sm', tw.text.primary)}>
                          {skillGap.skill_name}
                        </p>
                        <span className={utils.cn('text-xs', tw.text.tertiary)}>
                          {skillGap.skill_category.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={utils.cn('text-xs', tw.text.tertiary)}>
                            Current:
                          </span>
                          <span className={utils.cn('text-sm font-medium', tw.typography.monoNumbers, 'text-orange-400')}>
                            {skillGap.current_competency}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={utils.cn('text-xs', tw.text.tertiary)}>
                            Gap:
                          </span>
                          <span className={utils.cn('text-sm font-medium', tw.typography.monoNumbers, 'text-red-400')}>
                            {skillGap.gap_percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {gap.skill_gaps.length > 6 && (
                    <div className="p-3 rounded-xl bg-gray-800/20 flex items-center justify-center">
                      <p className={utils.cn('text-sm', tw.text.tertiary)}>
                        +{gap.skill_gaps.length - 6} more gaps
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Development Recommendations */}
              <div>
                <p className={utils.cn('text-sm font-medium mb-3', tw.text.secondary)}>
                  Development Recommendations
                </p>
                <div className="space-y-2">
                  {gap.development_recommendations.map((rec, recIndex) => (
                    <div key={recIndex} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-400" />
                      <p className={utils.cn('text-sm', tw.text.tertiary)}>
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredAndSortedGaps.length === 0 && (
        <div className="text-center py-8">
          <Filter className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            No leadership gaps match the current filters
          </p>
        </div>
      )}
    </div>
  )
} 
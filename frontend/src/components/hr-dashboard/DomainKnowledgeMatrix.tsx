'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  TrendingDown, 
  Building,
  Users,
  AlertCircle,
  Filter,
  Search,
  BarChart3
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { DomainDeficit } from '@/types/hr-analytics'

interface DomainKnowledgeMatrixProps {
  deficits: DomainDeficit[]
}

const CRITICALITY_COLORS = {
  5: '#EF4444', // Critical
  4: '#F97316', // High  
  3: '#F59E0B', // Medium
  2: '#22C55E', // Low
  1: '#3B82F6'  // Minimal
}

const getCriticalityColor = (criticality: number): string => {
  return CRITICALITY_COLORS[criticality as keyof typeof CRITICALITY_COLORS] || CRITICALITY_COLORS[1]
}

const formatCriticality = (criticality: number): string => {
  if (criticality >= 5) return 'Critical'
  if (criticality >= 4) return 'High'
  if (criticality >= 3) return 'Medium'
  if (criticality >= 2) return 'Low'
  return 'Minimal'
}

const getImpactIcon = (impact: string) => {
  if (impact.toLowerCase().includes('severe')) return AlertCircle
  if (impact.toLowerCase().includes('moderate')) return TrendingDown
  return BarChart3
}

const getImpactColor = (impact: string): string => {
  if (impact.toLowerCase().includes('severe')) return '#EF4444'
  if (impact.toLowerCase().includes('moderate')) return '#F59E0B'
  return '#22C55E'
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
}

export default function DomainKnowledgeMatrix({ deficits }: DomainKnowledgeMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCriticality, setSelectedCriticality] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'criticality' | 'deficit_percentage' | 'affected_count'>('criticality')
  const [minDeficitPercentage, setMinDeficitPercentage] = useState<number>(0)

  const filteredAndSortedDeficits = useMemo(() => {
    let filtered = deficits.filter(deficit => {
      const matchesSearch = deficit.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          deficit.skill_category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCriticality = selectedCriticality === null || deficit.business_criticality === selectedCriticality
      const matchesCategory = selectedCategory === null || deficit.skill_category === selectedCategory
      const matchesDeficit = deficit.deficit_percentage >= minDeficitPercentage
      
      return matchesSearch && matchesCriticality && matchesCategory && matchesDeficit
    })

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'criticality':
          return b.business_criticality - a.business_criticality
        case 'deficit_percentage':
          return b.deficit_percentage - a.deficit_percentage
        case 'affected_count':
          return b.affected_employee_count - a.affected_employee_count
        default:
          return 0
      }
    })

    return filtered
  }, [deficits, searchTerm, selectedCriticality, selectedCategory, sortBy, minDeficitPercentage])

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(deficits.map(deficit => deficit.skill_category)))
  }, [deficits])

  const uniqueCriticalities = useMemo(() => {
    return Array.from(new Set(deficits.map(deficit => deficit.business_criticality))).sort((a, b) => b - a)
  }, [deficits])

  const domainStats = useMemo(() => {
    const critical = deficits.filter(d => d.business_criticality >= 5).length
    const avgDeficit = deficits.length > 0 ? deficits.reduce((sum, d) => sum + d.deficit_percentage, 0) / deficits.length : 0
    const totalAffected = deficits.reduce((sum, d) => sum + d.affected_employee_count, 0)
    const uniqueDepartments = new Set(deficits.flatMap(d => d.affected_departments)).size
    
    return { critical, avgDeficit: Math.round(avgDeficit), totalAffected, uniqueDepartments }
  }, [deficits])

  if (deficits.length === 0) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl text-center" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <BookOpen className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
          No Domain Knowledge Deficits
        </h3>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Great! No significant domain knowledge gaps were identified across the organization.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          variants={itemVariants}
          className="p-4 rounded-2xl backdrop-blur-xl"
          style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-red-400')}>
                {domainStats.critical}
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Critical Areas</p>
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
              <TrendingDown className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-yellow-400')}>
                {domainStats.avgDeficit}%
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Avg Deficit</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-4 rounded-2xl backdrop-blur-xl"
          style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-orange-400')}>
                {domainStats.totalAffected}
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Affected Employees</p>
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
              <Building className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className={utils.cn('text-2xl font-semibold', tw.typography.monoNumbers, 'text-blue-400')}>
                {domainStats.uniqueDepartments}
              </p>
              <p className={utils.cn('text-sm', tw.text.tertiary)}>Departments</p>
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
              placeholder="Search domain knowledge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 min-w-[200px]"
            />
          </div>

          {/* Criticality Filter */}
          <select
            value={selectedCriticality?.toString() || ''}
            onChange={(e) => setSelectedCriticality(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">All Criticalities</option>
            {uniqueCriticalities.map(criticality => (
              <option key={criticality} value={criticality}>
                {formatCriticality(criticality)} Criticality
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

          {/* Minimum Deficit Filter */}
          <div className="flex items-center gap-2">
            <span className={utils.cn('text-sm', tw.text.tertiary)}>Min deficit:</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minDeficitPercentage}
              onChange={(e) => setMinDeficitPercentage(parseInt(e.target.value))}
              className="w-20"
            />
            <span className={utils.cn('text-sm font-medium', tw.typography.monoNumbers, tw.text.secondary)}>
              {minDeficitPercentage}%
            </span>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className={utils.cn('text-sm', tw.text.tertiary)}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-900/80 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="criticality">Business Criticality</option>
            <option value="deficit_percentage">Deficit Percentage</option>
            <option value="affected_count">Affected Employees</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Showing {filteredAndSortedDeficits.length} of {deficits.length} domain knowledge deficits
        </p>
        
        {filteredAndSortedDeficits.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className={utils.cn('text-xs', tw.text.tertiary)}>
                {filteredAndSortedDeficits.filter(d => d.business_criticality >= 5).length} Critical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className={utils.cn('text-xs', tw.text.tertiary)}>
                {filteredAndSortedDeficits.filter(d => d.business_criticality === 4).length} High
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Domain Knowledge Matrix */}
      <div className="space-y-4">
        {filteredAndSortedDeficits.map((deficit, index) => {
          const ImpactIcon = getImpactIcon(deficit.productivity_impact)
          const impactColor = getImpactColor(deficit.productivity_impact)
          
          return (
            <motion.div
              key={`${deficit.skill_name}-${deficit.skill_category}`}
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
                    style={{ backgroundColor: getCriticalityColor(deficit.business_criticality) }}
                  />
                  <div>
                    <h3 className={utils.cn('text-lg font-medium', tw.text.primary)}>
                      {deficit.skill_name}
                    </h3>
                    <p className={utils.cn('text-sm', tw.text.secondary)}>
                      {deficit.skill_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={utils.cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    deficit.business_criticality >= 5 ? 'bg-red-500/20 text-red-400' :
                    deficit.business_criticality >= 4 ? 'bg-orange-500/20 text-orange-400' :
                    deficit.business_criticality >= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  )}>
                    {formatCriticality(deficit.business_criticality)} Criticality
                  </span>
                  
                  {/* Criticality Stars */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div 
                        key={i}
                        className={utils.cn(
                          "w-2 h-2 rounded-full",
                          i < deficit.business_criticality ? "bg-yellow-400" : "bg-gray-600"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gray-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Deficit Percentage</p>
                      <p className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-red-400')}>
                        {deficit.deficit_percentage}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <Users className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Affected Employees</p>
                      <p className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-orange-400')}>
                        {deficit.affected_employee_count}/{deficit.total_employee_count}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Average Competency</p>
                      <p className={utils.cn('text-lg font-semibold', tw.typography.monoNumbers, 'text-blue-400')}>
                        {deficit.average_competency}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/30">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg border"
                      style={{ 
                        backgroundColor: `${impactColor}20`,
                        borderColor: `${impactColor}40`
                      }}
                    >
                      <ImpactIcon className="w-4 h-4" style={{ color: impactColor }} />
                    </div>
                    <div>
                      <p className={utils.cn('text-xs', tw.text.tertiary)}>Productivity Impact</p>
                      <p className={utils.cn('text-xs font-medium')} style={{ color: impactColor }}>
                        {deficit.productivity_impact.split(' - ')[0]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Affected Departments */}
              <div className="mb-4">
                <p className={utils.cn('text-sm font-medium mb-2', tw.text.secondary)}>
                  Affected Departments ({deficit.affected_departments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {deficit.affected_departments.map((dept, deptIndex) => (
                    <span 
                      key={deptIndex}
                      className="px-2 py-1 rounded text-xs bg-gray-800/50 text-gray-300"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Productivity Impact Details */}
              <div className="mb-4">
                <p className={utils.cn('text-sm font-medium mb-2', tw.text.secondary)}>
                  Business Impact
                </p>
                <p className={utils.cn('text-sm', tw.text.tertiary)}>
                  {deficit.productivity_impact}
                </p>
              </div>

              {/* Recommended Actions */}
              <div>
                <p className={utils.cn('text-sm font-medium mb-2', tw.text.secondary)}>
                  Recommended Actions
                </p>
                <div className="space-y-1">
                  {deficit.recommended_actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-400" />
                      <p className={utils.cn('text-sm', tw.text.tertiary)}>
                        {action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredAndSortedDeficits.length === 0 && (
        <div className="text-center py-8">
          <Filter className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className={utils.cn('text-sm', tw.text.secondary)}>
            No domain knowledge deficits match the current filters
          </p>
        </div>
      )}
    </div>
  )
} 
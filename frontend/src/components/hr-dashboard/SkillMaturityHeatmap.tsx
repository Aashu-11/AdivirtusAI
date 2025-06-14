'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { hrAnalyticsService } from '@/services/hr-analytics'
import { SkillMaturityHeatmapData, DepartmentSkillMatrix } from '@/types/hr-analytics'

interface SkillMaturityHeatmapProps {
  onRefresh?: () => void
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
}

// Helper function to get color intensity based on competency score
const getCompetencyColor = (score: number): { bg: string; text: string; intensity: string } => {
  if (score >= 80) return { bg: '#10B981', text: '#000000', intensity: 'Expert' }
  if (score >= 60) return { bg: '#3B82F6', text: '#FFFFFF', intensity: 'Advanced' }
  if (score >= 40) return { bg: '#F59E0B', text: '#000000', intensity: 'Intermediate' }
  if (score >= 20) return { bg: '#F97316', text: '#FFFFFF', intensity: 'Basic' }
  return { bg: '#EF4444', text: '#FFFFFF', intensity: 'Novice' }
}

// Format skill category names for display
const formatCategoryName = (category: string): string => {
  const mapping: { [key: string]: string } = {
    'technical_skills': 'Technical',
    'soft_skills': 'Soft Skills',
    'domain_knowledge': 'Domain',
    'sop_skills': 'SOPs'
  }
  return mapping[category] || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

interface HeatmapCellProps {
  department: string
  category: string
  score: number
  x: number
  y: number
  width: number
  height: number
  onHover: (data: { department: string; category: string; score: number } | null) => void
}

const HeatmapCell = ({ department, category, score, x, y, width, height, onHover }: HeatmapCellProps) => {
  const colorData = getCompetencyColor(score)
  
  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={colorData.bg}
      stroke="rgba(10, 10, 12, 0.8)"
      strokeWidth={1}
      rx={4}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => onHover({ department, category: formatCategoryName(category), score })}
      onMouseLeave={() => onHover(null)}
      className="cursor-pointer"
    />
  )
}

export default function SkillMaturityHeatmap({ 
  onRefresh 
}: SkillMaturityHeatmapProps) {
  const [data, setData] = useState<SkillMaturityHeatmapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ department: string; category: string; score: number } | null>(null)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await hrAnalyticsService.getSkillMaturityHeatmap()
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setData(response.data || null)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load skill maturity heatmap')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    loadData()
    onRefresh?.()
  }

  // Calculate heatmap dimensions and statistics
  const heatmapStats = useMemo(() => {
    if (!data || !data.heatmap_data.length) return null

    const totalCells = data.heatmap_data.length * data.skill_categories.length
    let strongCells = 0
    let weakCells = 0
    let totalScore = 0

    data.heatmap_data.forEach(dept => {
      data.skill_categories.forEach(category => {
        const score = dept[category as keyof DepartmentSkillMatrix] as number
        totalScore += score
        if (score >= 70) strongCells++
        if (score < 40) weakCells++
      })
    })

    return {
      averageScore: Math.round(totalScore / totalCells),
      strongAreas: strongCells,
      weakAreas: weakCells,
      totalAreas: totalCells
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          <div className="h-80 bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="text-center">
          <div className="text-red-400 mb-2">Error loading heatmap data</div>
          <p className={utils.cn(tw.text.secondary, "text-sm")}>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data || !data.heatmap_data.length) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h4 className={utils.cn(tw.text.primary, "text-lg font-medium mb-2")}>
            No Heatmap Data
          </h4>
          <p className={utils.cn(tw.text.secondary, "text-sm")}>
            No department skill data available for heatmap visualization.
          </p>
        </div>
      </div>
    )
  }

  // Heatmap dimensions
  const cellWidth = 80
  const cellHeight = 50
  const labelWidth = 120
  const labelHeight = 30
  const margin = { top: 40, right: 20, bottom: 20, left: labelWidth }
  
  const svgWidth = margin.left + (data.skill_categories.length * cellWidth) + margin.right
  const svgHeight = margin.top + (data.heatmap_data.length * cellHeight) + margin.bottom

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="flex justify-between items-start mb-6"
      >
        <div>
          <h3 className={utils.cn(
            'text-2xl font-light tracking-tight mb-2',
            tw.text.primary
          )}>
            Skill Maturity Heatmap
          </h3>
          <p className={utils.cn(
            'text-sm tracking-wide',
            tw.text.secondary
          )}>
            Department vs skill category competency matrix
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {heatmapStats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className={tw.text.tertiary}>
                  {heatmapStats.strongAreas} strong areas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className={tw.text.tertiary}>
                  {heatmapStats.weakAreas} areas need attention
                </span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl backdrop-blur-sm border border-gray-600/40 text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200 disabled:opacity-50 shadow-lg"
            style={{ backgroundColor: '#0A0A0C' }}
          >
            <RefreshCw className={utils.cn(
              "w-4 h-4",
              isLoading && "animate-spin"
            )} />
          </button>
        </div>
      </motion.div>

      {/* Statistics Summary */}
      {heatmapStats && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl backdrop-blur-sm border border-blue-500/20" 
               style={{ backgroundColor: '#0A0A0C' }}>
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className={utils.cn(tw.text.secondary, 'text-sm')}>Average</span>
            </div>
            <div className={utils.cn(
              'text-2xl font-light text-blue-400',
              tw.typography.monoNumbers
            )}>
              {heatmapStats.averageScore}%
            </div>
          </div>
          
          <div className="p-4 rounded-xl backdrop-blur-sm border border-emerald-500/20" 
               style={{ backgroundColor: '#0A0A0C' }}>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className={utils.cn(tw.text.secondary, 'text-sm')}>Strong</span>
            </div>
            <div className={utils.cn(
              'text-2xl font-light text-emerald-400',
              tw.typography.monoNumbers
            )}>
              {heatmapStats.strongAreas}
            </div>
          </div>
          
          <div className="p-4 rounded-xl backdrop-blur-sm border border-amber-500/20" 
               style={{ backgroundColor: '#0A0A0C' }}>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className={utils.cn(tw.text.secondary, 'text-sm')}>Needs Focus</span>
            </div>
            <div className={utils.cn(
              'text-2xl font-light text-amber-400',
              tw.typography.monoNumbers
            )}>
              {heatmapStats.weakAreas}
            </div>
          </div>
          
          <div className="p-4 rounded-xl backdrop-blur-sm border border-gray-500/20" 
               style={{ backgroundColor: '#0A0A0C' }}>
            <div className="flex items-center gap-3 mb-2">
              <Info className="w-5 h-5 text-gray-400" />
              <span className={utils.cn(tw.text.secondary, 'text-sm')}>Total Areas</span>
            </div>
            <div className={utils.cn(
              'text-2xl font-light text-gray-400',
              tw.typography.monoNumbers
            )}>
              {heatmapStats.totalAreas}
            </div>
          </div>
        </motion.div>
      )}

      {/* Heatmap Visualization */}
      <motion.div variants={itemVariants} className="relative">
        <div className="overflow-x-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            className="bg-transparent"
            style={{ minWidth: svgWidth }}
          >
            {/* Column Headers (Skill Categories) */}
            {data.skill_categories.map((category, colIndex) => (
              <text
                key={category}
                x={margin.left + (colIndex * cellWidth) + (cellWidth / 2)}
                y={margin.top - 10}
                textAnchor="middle"
                className={utils.cn(tw.text.secondary, "text-sm font-medium")}
                fill="currentColor"
              >
                {formatCategoryName(category)}
              </text>
            ))}

            {/* Row Headers (Departments) and Heatmap Cells */}
            {data.heatmap_data.map((dept, rowIndex) => (
              <g key={dept.department}>
                {/* Department Label */}
                <text
                  x={margin.left - 10}
                  y={margin.top + (rowIndex * cellHeight) + (cellHeight / 2)}
                  textAnchor="end"
                  className={utils.cn(tw.text.primary, "text-sm font-medium")}
                  fill="currentColor"
                >
                  {dept.department}
                </text>

                {/* Heatmap Cells for this department */}
                {data.skill_categories.map((category, colIndex) => {
                  const score = dept[category as keyof DepartmentSkillMatrix] as number || 0
                  return (
                    <HeatmapCell
                      key={`${dept.department}-${category}`}
                      department={dept.department}
                      category={category}
                      score={score}
                      x={margin.left + (colIndex * cellWidth)}
                      y={margin.top + (rowIndex * cellHeight)}
                      width={cellWidth}
                      height={cellHeight}
                      onHover={setHoveredCell}
                    />
                  )
                })}
              </g>
            ))}

            {/* Score Text Overlays */}
            {data.heatmap_data.map((dept, rowIndex) => 
              data.skill_categories.map((category, colIndex) => {
                const score = dept[category as keyof DepartmentSkillMatrix] as number || 0
                const colorData = getCompetencyColor(score)
                return (
                  <text
                    key={`text-${dept.department}-${category}`}
                    x={margin.left + (colIndex * cellWidth) + (cellWidth / 2)}
                    y={margin.top + (rowIndex * cellHeight) + (cellHeight / 2) + 4}
                    textAnchor="middle"
                    className="text-sm font-bold pointer-events-none"
                    fill={colorData.text}
                  >
                    {Math.round(score)}
                  </text>
                )
              })
            )}
          </svg>
        </div>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 right-4 backdrop-blur-xl p-4 rounded-xl shadow-2xl pointer-events-none z-10"
              style={{
                background: 'rgba(10, 10, 12, 0.95)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                maxWidth: '280px'
              }}
            >
              <h4 className={utils.cn(tw.text.primary, "font-medium mb-2")}>
                {hoveredCell.department}
              </h4>
              <div className="flex items-center justify-between mb-2">
                <span className={utils.cn(tw.text.secondary, 'text-sm')}>
                  {hoveredCell.category}
                </span>
                <span className={utils.cn(
                  'text-sm font-bold',
                  tw.typography.monoNumbers
                )} style={{ color: getCompetencyColor(hoveredCell.score).bg }}>
                  {Math.round(hoveredCell.score)}%
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {getCompetencyColor(hoveredCell.score).intensity} Level
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Legend */}
      <motion.div variants={itemVariants} className="mt-8">
        <h4 className={utils.cn(tw.text.primary, 'text-sm font-medium mb-4')}>
          Competency Scale
        </h4>
        <div className="flex flex-wrap gap-4">
          {[
            { range: '80-100%', color: '#10B981', label: 'Expert' },
            { range: '60-79%', color: '#3B82F6', label: 'Advanced' },
            { range: '40-59%', color: '#F59E0B', label: 'Intermediate' },
            { range: '20-39%', color: '#F97316', label: 'Basic' },
            { range: '0-19%', color: '#EF4444', label: 'Novice' }
          ].map((item) => (
            <div key={item.range} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm" 
                style={{ backgroundColor: item.color }}
              />
              <span className={utils.cn(tw.text.secondary, 'text-sm')}>
                {item.label} ({item.range})
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
} 
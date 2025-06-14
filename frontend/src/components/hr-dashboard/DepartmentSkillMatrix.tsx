'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { 
  Users, 
  Target, 
  Filter,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { hrAnalyticsService } from '@/services/hr-analytics'

interface DepartmentSkillMatrixProps {
  organizationName: string
  onDepartmentChange?: (department: string | null) => void
}

interface Department {
  department: string
  employee_count: number
  avg_competency: number
  has_skill_data: boolean
}

interface RadarSkillData {
  subject: string
  value: number
  current_value: number
  ideal_value: number
  gap_percentage: number
  totalSkills: number
  skillCount: number
  category: string
  department: string
}

interface IdealRadarSkillData {
  subject: string
  value: number
  category: string
  department: string
  is_ideal: boolean
}

interface DepartmentSkillMatrixData {
  radar_data: RadarSkillData[]
  ideal_radar_data: IdealRadarSkillData[]
  skill_matrix: Record<string, unknown>
  metadata: {
    department: string
    organization: string
    employee_count: number
    employees_with_data: number
    total_categories: number
    has_ideal_data: boolean
    ideal_skills_count: number
    current_skills_count: number
    generated_at?: number
  }
}

const CHART_COLORS = {
  current: {
    stroke: '#2C7EFF',
    fill: 'url(#blueGradient)',
    fillOpacity: 0.4
  },
  ideal: {
    stroke: '#10B981',
    fill: '#10B981',
    fillOpacity: 0.15
  },
  primary: {
    stroke: '#2C7EFF',
    fill: 'url(#blueGradient)',
    fillOpacity: 0.4
  }
}

type ViewMode = 'current' | 'ideal' | 'both'

const VIEW_OPTIONS = [
  { id: 'both', label: 'Both', color: '#2C7EFF' },
  { id: 'current', label: 'Current', color: '#2C7EFF' },
  { id: 'ideal', label: 'Ideal', color: '#10B981' }
] as const

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

const CustomTooltip = ({ active, payload, data }: { active?: boolean; payload?: any[]; data?: RadarSkillData[] }) => {
  if (!active || !payload || !payload.length || !data) return null

  const skillData = data.find((item: RadarSkillData) => item.subject === payload[0].payload.subject)
  if (!skillData) return null

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="backdrop-blur-xl p-4 rounded-xl shadow-2xl"
      style={{
        background: 'rgba(10, 10, 12, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        maxWidth: '320px'
      }}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <BarChart3 className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h4 className={utils.cn(tw.text.primary, "font-medium")}>{skillData.subject}</h4>
          <p className={utils.cn(tw.text.tertiary, "text-sm")}>{skillData.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>Current Level</p>
          <div className={utils.cn(tw.typography.monoNumbers, "text-lg font-semibold text-blue-400")}>
            {skillData.current_value || skillData.value}%
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>Ideal Level</p>
          <div className={utils.cn(tw.typography.monoNumbers, "text-lg font-semibold text-emerald-400")}>
            {skillData.ideal_value || 70}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gray-800/50">
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>Gap</p>
          <div className={utils.cn(tw.typography.monoNumbers, "text-lg font-semibold text-rose-400")}>
            {skillData.gap_percentage || 0}%
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-gray-800/50">
          <p className={utils.cn(tw.text.tertiary, "text-xs")}>Skills Assessed</p>
          <div className={utils.cn(tw.typography.monoNumbers, "text-lg font-semibold text-amber-400")}>
            {skillData.skillCount}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className={utils.cn(tw.text.tertiary, "text-xs")}>Department</p>
        <p className={utils.cn(tw.text.secondary, "text-sm font-medium")}>{skillData.department}</p>
      </div>
    </motion.div>
  )
}

export default function DepartmentSkillMatrix({ 
  organizationName, 
  onDepartmentChange 
}: DepartmentSkillMatrixProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [skillMatrixData, setSkillMatrixData] = useState<DepartmentSkillMatrixData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ViewMode>('both')

  // Load departments on mount
  useEffect(() => {
    loadDepartments()
  }, [organizationName])

  // Load skill matrix when department changes
  useEffect(() => {
    if (selectedDepartment !== null) {
      loadDepartmentSkillMatrix(selectedDepartment)
    }
  }, [selectedDepartment])

  const loadDepartments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Check HR status first
      const hrStatusResponse = await hrAnalyticsService.checkHRStatus()
      
      if (hrStatusResponse.error) {
        throw new Error(`HR Status Check Failed: ${hrStatusResponse.error}`)
      }
      
      if (!hrStatusResponse.data?.is_hr) {
        throw new Error('User is not authorized as HR personnel')
      }
      const response = await hrAnalyticsService.getDepartments()
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      const departmentsData = (response.data?.departments as unknown as Department[]) || []
      setDepartments(departmentsData)
      
      // Auto-select first department with skill data
      const departmentWithData = departmentsData.find((dept: Department) => dept.has_skill_data)
      if (departmentWithData) {
        setSelectedDepartment(departmentWithData.department)
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load departments')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDepartmentSkillMatrix = async (department: string | null) => {
    try {
      setIsLoadingMatrix(true)
      setError(null)
      
      const response = await hrAnalyticsService.getDepartmentSkillMatrix(department)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setSkillMatrixData((response.data as unknown as DepartmentSkillMatrixData) || null)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load skill matrix')
      setSkillMatrixData(null)
    } finally {
      setIsLoadingMatrix(false)
    }
  }

  const handleDepartmentChange = (department: string | null) => {
    setSelectedDepartment(department)
    onDepartmentChange?.(department)
  }

  const handleRefresh = () => {
    if (selectedDepartment !== null) {
      loadDepartmentSkillMatrix(selectedDepartment)
    }
  }

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (!skillMatrixData?.radar_data?.length) return 0
    const total = skillMatrixData.radar_data.reduce((acc, curr) => acc + (curr.current_value || curr.value), 0)
    return Math.round(total / skillMatrixData.radar_data.length)
  }, [skillMatrixData])

  // Calculate ideal progress
  const idealProgress = useMemo(() => {
    if (!skillMatrixData?.radar_data?.length) return 0
    const total = skillMatrixData.radar_data.reduce((acc, curr) => acc + (curr.ideal_value || 70), 0)
    return Math.round(total / skillMatrixData.radar_data.length)
  }, [skillMatrixData])

  // Calculate gap percentage
  const overallGap = useMemo(() => {
    if (!skillMatrixData?.radar_data?.length) return 0
    return Math.max(0, idealProgress - overallProgress)
  }, [overallProgress, idealProgress])

  const metadata = skillMatrixData?.metadata

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 rounded-3xl backdrop-blur-xl" 
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <div className="text-center">
          <div className="text-red-400 mb-2">Error loading department data</div>
          <p className={utils.cn(tw.text.secondary, "text-sm")}>{error}</p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={loadDepartments}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry Departments
            </button>
            {selectedDepartment && (
              <button
                onClick={() => loadDepartmentSkillMatrix(selectedDepartment)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Retry Skill Matrix
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-6 lg:p-8 xl:p-10 rounded-3xl backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 12, 0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 sm:mb-8"
      >
        <div className="min-w-0 flex-1">
          <h3 className={utils.cn(
            'text-2xl sm:text-3xl font-light tracking-tight mb-2',
            tw.text.primary
          )}>
            Department Skill Matrix
          </h3>
          <p className={utils.cn(
            'text-sm sm:text-base tracking-wide',
            tw.text.secondary
          )}>
            Skill competency overview by department
          </p>
          {metadata && (
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className={utils.cn(tw.text.tertiary, 'text-sm')}>
                  {metadata.employee_count} employees
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className={utils.cn(tw.text.tertiary, 'text-sm')}>
                  {metadata.total_categories} skill categories
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 flex-shrink-0">
          {/* View Mode Tabs */}
          {skillMatrixData?.metadata?.has_ideal_data && (
            <div className="flex items-center backdrop-blur-xl rounded-2xl p-1.5 border border-gray-600/40 shadow-xl w-full sm:w-auto" style={{ backgroundColor: '#0A0A0C' }}>
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setActiveView(option.id as ViewMode)}
                  className={utils.cn(
                    "px-4 sm:px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 min-w-[70px] sm:min-w-[80px] flex-1 sm:flex-none",
                    activeView === option.id
                      ? "text-white shadow-lg border border-gray-500/50 transform scale-[0.98]" 
                      : "text-gray-300 hover:text-white hover:border hover:border-gray-600/30"
                  )}
                  style={{
                    backgroundColor: activeView === option.id ? '#1F2937' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeView !== option.id) {
                      e.currentTarget.style.backgroundColor = '#374151'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeView !== option.id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          
          {/* Department Selector */}
          <div className="relative group w-full sm:w-auto">
            <div className="flex items-center gap-3 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-gray-600/40 shadow-xl hover:border-gray-500/50 transition-all duration-300 min-w-[180px] sm:min-w-[200px]" style={{ backgroundColor: '#0A0A0C' }}>
              <Filter className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-200 flex-shrink-0" />
              <select
                value={selectedDepartment || ''}
                onChange={(e) => handleDepartmentChange(e.target.value || null)}
                className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer min-w-0 flex-1 appearance-none"
              >
                <option value="" className="bg-gray-900 text-white py-2">All Departments</option>
                {departments.filter(dept => dept.has_skill_data).map((dept) => (
                  <option key={dept.department} value={dept.department} className="bg-gray-900 text-white py-2">
                    {dept.department} ({dept.employee_count})
                  </option>
                ))}
              </select>
              <svg 
                className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-200 pointer-events-none flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoadingMatrix}
            className="p-2 rounded-xl bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200 disabled:opacity-50 shadow-lg flex-shrink-0"
          >
            <RefreshCw className={utils.cn(
              "w-4 h-4",
              isLoadingMatrix && "animate-spin"
            )} />
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoadingMatrix ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[400px] sm:h-[500px] flex items-center justify-center"
          >
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
              <p className={utils.cn(tw.text.secondary, "text-sm")}>
                Loading skill matrix...
              </p>
            </div>
          </motion.div>
        ) : !skillMatrixData?.radar_data?.length ? (
          <motion.div
            key="no-data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[400px] sm:h-[500px] flex items-center justify-center"
          >
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h4 className={utils.cn(tw.text.primary, "text-lg font-medium mb-2")}>
                No Skill Data Available
              </h4>
              <p className={utils.cn(tw.text.secondary, "text-sm")}>
                {selectedDepartment 
                  ? `No skill assessments found for ${selectedDepartment} department.`
                  : 'No skill assessments found for any department.'
                }
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="radar-chart"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            {/* Progress Summary */}
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              {skillMatrixData?.metadata?.has_ideal_data ? (
                <div className="flex flex-col items-center w-full max-w-3xl">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 w-full">
                    <div className="text-center flex-1">
                      <div className={utils.cn(
                        'text-2xl sm:text-3xl md:text-4xl font-light text-blue-400 mb-1',
                        tw.typography.monoNumbers
                      )}>
                        {overallProgress}%
                      </div>
                      <span className={utils.cn(tw.text.tertiary, 'text-xs sm:text-sm')}>
                        Current Average
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-500 px-2">
                      <div className="w-6 sm:w-8 h-px bg-gray-600"></div>
                      <span className="mx-2 text-xs">vs</span>
                      <div className="w-6 sm:w-8 h-px bg-gray-600"></div>
                    </div>
                    
                    <div className="text-center flex-1">
                      <div className={utils.cn(
                        'text-2xl sm:text-3xl md:text-4xl font-light text-emerald-400 mb-1',
                        tw.typography.monoNumbers
                      )}>
                        {idealProgress}%
                      </div>
                      <span className={utils.cn(tw.text.tertiary, 'text-xs sm:text-sm')}>
                        Ideal Target
                      </span>
                    </div>
                    
                    <div className="text-center min-w-0">
                      <div className={utils.cn(
                        'text-base sm:text-lg md:text-xl font-medium text-rose-400 mb-1',
                        tw.typography.monoNumbers
                      )}>
                        {overallGap}%
                      </div>
                      <span className={utils.cn(tw.text.tertiary, 'text-xs sm:text-sm')}>
                        Gap
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className={utils.cn(
                    'text-3xl sm:text-4xl md:text-5xl font-light text-blue-400 mb-1',
                    tw.typography.monoNumbers
                  )}>
                    {overallProgress}%
                  </div>
                  <span className={utils.cn(tw.text.tertiary, 'text-sm')}>
                    Average Department Score
                  </span>
                </div>
              )}
            </div>

            {/* Radar Chart */}
            <div className="h-[350px] sm:h-[450px] md:h-[500px] relative px-2">
              <div className="absolute inset-0 rounded-2xl opacity-50"
                   style={{
                     background: 'linear-gradient(to bottom, rgba(249, 249, 249, 0.05), transparent)'
                   }} />
              
              <ResponsiveContainer width="100%" height="120%">
                <RadarChart cx="50%" cy="50%" outerRadius="85%" data={skillMatrixData.radar_data}>
                  <PolarGrid 
                    stroke="rgba(59, 130, 246, 0.3)" 
                    strokeDasharray="2 2" 
                    gridType="polygon"
                    radialLines={true}
                  />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    stroke="#9CA3AF"
                    tickLine={false}
                    fontSize={10}
                    fontFamily="system-ui"
                    className={tw.text.secondary}
                  />
                  <Tooltip 
                    content={(props) => (
                      <CustomTooltip 
                        active={props.active} 
                        payload={props.payload} 
                        data={skillMatrixData.radar_data} 
                      />
                    )} 
                  />
                  
                  {/* Current Skills */}
                  {(activeView === 'current' || activeView === 'both') && (
                    <Radar
                      name="Current"
                      dataKey="current_value"
                      stroke={CHART_COLORS.current.stroke}
                      fill="url(#blueGradient)"
                      fillOpacity={activeView === 'both' ? 0.3 : 0.4}
                      strokeWidth={3}
                      strokeOpacity={0.9}
                    />
                  )}
                  
                  {/* Ideal Level */}
                  {(activeView === 'ideal' || activeView === 'both') && (
                    <Radar
                      name="Ideal"
                      dataKey="ideal_value"
                      stroke={CHART_COLORS.ideal.stroke}
                      fill={CHART_COLORS.ideal.fill}
                      fillOpacity={activeView === 'both' ? 0.1 : 0.2}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      strokeOpacity={0.8}
                    />
                  )}
                  
                  {/* Gradient Definitions */}
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2C7EFF" stopOpacity={0.9} />
                      <stop offset="50%" stopColor="#2563eb" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-4 md:gap-6 mt-3 pt-3 border-t"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              {(activeView === 'current' || activeView === 'both') && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className={utils.cn(tw.text.secondary, 'text-sm')}>
                    Current Level
                  </span>
                </div>
              )}
              
              {(activeView === 'ideal' || activeView === 'both') && skillMatrixData?.metadata?.has_ideal_data && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-emerald-500 opacity-80" style={{ borderRadius: '1px' }}></div>
                  <span className={utils.cn(tw.text.secondary, 'text-sm')}>
                    Ideal Level
                  </span>
                </div>
              )}
              
              {!skillMatrixData?.metadata?.has_ideal_data && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className={utils.cn(tw.text.secondary, 'text-sm')}>
                    {selectedDepartment || 'Organization'} Average
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 
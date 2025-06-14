'use client'

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import { HRDashboardData, EmployeeSummary } from '@/types/hr-analytics'
import EmployeeTable from './EmployeeTable'

interface WorkforceTabProps {
  data: HRDashboardData | null
  employees: EmployeeSummary[]
  organizationName: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
}

export default function WorkforceTab({ data, employees, organizationName }: WorkforceTabProps) {
  const handleEmployeeClick = (employee: EmployeeSummary) => {
    console.log('Employee clicked:', employee)
  }

  // Safe calculation of average competency
  const calculateAvgCompetency = () => {
    if (!employees || employees.length === 0) return 0
    
    const validCompetencies = employees
      .map(emp => emp.avg_competency || 0)
      .filter(comp => comp && !isNaN(comp) && isFinite(comp))
    
    if (validCompetencies.length === 0) return 0
    
    return Math.round(validCompetencies.reduce((sum, comp) => sum + comp, 0) / validCompetencies.length)
  }

  // Safe calculation of total skills
  const calculateTotalSkills = () => {
    if (!employees || employees.length === 0) return 0
    return employees.reduce((sum, emp) => sum + (emp.total_skills || 0), 0)
  }

  // Safe calculation of skill gaps
  const calculateSkillGaps = () => {
    if (!employees || employees.length === 0) return 0
    return employees.reduce((sum, emp) => sum + (emp.skills_with_gaps || 0), 0)
  }

  if (!data || !employees.length) {
    return (
      <div className="p-6 sm:p-8 lg:p-12 rounded-3xl backdrop-blur-xl border border-gray-600/30 text-center"
           style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
        <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className={utils.cn('text-lg font-medium mb-2', tw.text.primary)}>
          No Employee Data Available
        </h3>
        <p className={utils.cn('text-sm', tw.text.secondary)}>
          Employee assessments are required to display workforce analytics.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-8"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="px-2 sm:px-4">
        <h2 className={utils.cn('text-2xl sm:text-3xl font-light tracking-tight', tw.text.primary)}>
          👥 Workforce Management
        </h2>
        <p className={utils.cn('text-sm sm:text-base mt-2', tw.text.secondary)}>
          Comprehensive employee directory with skills analysis and performance metrics
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={cardVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <h3 className={utils.cn('text-xs sm:text-sm font-medium mb-2', tw.text.secondary)}>Total Employees</h3>
          <p className={utils.cn('text-2xl sm:text-3xl font-bold text-blue-400', tw.typography.monoNumbers)}>
            {employees.length}
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <h3 className={utils.cn('text-xs sm:text-sm font-medium mb-2', tw.text.secondary)}>Avg Competency</h3>
          <p className={utils.cn('text-2xl sm:text-3xl font-bold text-green-400', tw.typography.monoNumbers)}>
            {calculateAvgCompetency()}%
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <h3 className={utils.cn('text-xs sm:text-sm font-medium mb-2', tw.text.secondary)}>Total Skills</h3>
          <p className={utils.cn('text-2xl sm:text-3xl font-bold text-purple-400', tw.typography.monoNumbers)}>
            {calculateTotalSkills()}
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-gray-700/30"
             style={{ background: 'rgba(10, 10, 12, 0.7)' }}>
          <h3 className={utils.cn('text-xs sm:text-sm font-medium mb-2', tw.text.secondary)}>Skills Gaps</h3>
          <p className={utils.cn('text-2xl sm:text-3xl font-bold text-orange-400', tw.typography.monoNumbers)}>
            {calculateSkillGaps()}
          </p>
        </div>
      </motion.div>

      {/* Employee Table */}
      <motion.div variants={cardVariants} className="px-2 sm:px-4">
        <h3 className={utils.cn('text-xl sm:text-2xl font-light tracking-tight mb-4 sm:mb-6', tw.text.primary)}>
          Employee Directory
        </h3>
        <EmployeeTable
          employees={employees}
          onEmployeeClick={handleEmployeeClick}
          isLoading={false}
        />
      </motion.div>
    </motion.div>
  )
} 
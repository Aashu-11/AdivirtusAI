'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Target,
  TrendingUp,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'
import CompetencyDistribution from './CompetencyDistribution'
import SkillMaturityHeatmap from './SkillMaturityHeatmap'
import GapOverviewDashboard from './GapOverviewDashboard'

interface AdvancedAnalyticsProps {
  organizationName: string
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.2
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

type ViewTab = 'distribution' | 'heatmap' | 'gaps' | 'both'

const TABS = [
  { 
    id: 'both' as ViewTab, 
    label: 'All Analytics', 
    icon: TrendingUp,
    description: 'View all advanced analytics' 
  },
  { 
    id: 'distribution' as ViewTab, 
    label: 'Competency Distribution', 
    icon: BarChart3,
    description: 'Organization-wide skill level breakdown' 
  },
  { 
    id: 'heatmap' as ViewTab, 
    label: 'Skill Heatmap', 
    icon: Target,
    description: 'Department vs skill category matrix' 
  },
  { 
    id: 'gaps' as ViewTab, 
    label: 'Gap Analysis', 
    icon: AlertTriangle,
    description: 'Critical skill gaps and risk assessment' 
  }
] as const

export default function AdvancedAnalytics({ 
  organizationName 
}: AdvancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('both')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header Section */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h2 className={utils.cn(
            'text-3xl lg:text-4xl font-light tracking-tight mb-3',
            tw.text.primary
          )}>
            Advanced Analytics
          </h2>
          <p className={utils.cn(
            'text-base tracking-wide',
            tw.text.secondary
          )}>
            Deep insights into organizational skill competency and maturity patterns
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center backdrop-blur-xl rounded-2xl p-1.5 border border-gray-600/40 shadow-xl" 
               style={{ backgroundColor: '#0A0A0C' }}>
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={utils.cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 min-w-fit",
                    activeTab === tab.id
                      ? "text-white shadow-lg border border-gray-500/50 transform scale-[0.98]" 
                      : "text-gray-300 hover:text-white hover:border hover:border-gray-600/30"
                  )}
                  style={{
                    backgroundColor: activeTab === tab.id ? '#1F2937' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = '#374151'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
          
          {/* Global Refresh */}
          <button
            onClick={handleRefresh}
            className="p-3 rounded-xl backdrop-blur-sm border border-gray-600/40 text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200 shadow-lg"
            style={{ backgroundColor: '#0A0A0C' }}
            title="Refresh all analytics"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Tab Description */}
      <motion.div variants={itemVariants}>
        {TABS.map((tab) => 
          activeTab === tab.id && (
            <div key={tab.id} className="p-4 rounded-2xl backdrop-blur-sm border border-blue-500/20"
                 style={{ backgroundColor: '#0A0A0C' }}>
              <div className="flex items-center gap-3">
                <tab.icon className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className={utils.cn(tw.text.primary, 'font-medium')}>
                    {tab.label}
                  </h3>
                  <p className={utils.cn(tw.text.secondary, 'text-sm')}>
                    {tab.description}
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </motion.div>

      {/* Analytics Content */}
      <motion.div variants={itemVariants} className="space-y-8">
        {(activeTab === 'distribution' || activeTab === 'both') && (
          <motion.div
            key={`distribution-${refreshKey}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CompetencyDistribution onRefresh={handleRefresh} />
          </motion.div>
        )}
        
        {(activeTab === 'heatmap' || activeTab === 'both') && (
          <motion.div
            key={`heatmap-${refreshKey}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SkillMaturityHeatmap onRefresh={handleRefresh} />
          </motion.div>
        )}
        
        {(activeTab === 'gaps' || activeTab === 'both') && (
          <motion.div
            key={`gaps-${refreshKey}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <GapOverviewDashboard organizationName={organizationName} />
          </motion.div>
        )}
      </motion.div>

      {/* Organization Info Footer */}
      <motion.div 
        variants={itemVariants}
        className="flex items-center justify-center pt-8 border-t"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className={tw.text.tertiary}>Organization:</span>
          </div>
          <span className={tw.text.secondary}>{organizationName}</span>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className={tw.text.tertiary}>Last Updated:</span>
          </div>
          <span className={tw.text.secondary}>{new Date().toLocaleDateString()}</span>
        </div>
      </motion.div>
    </motion.div>
  )
} 
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard,
  Users,
  BarChart3,
  Lightbulb,
  FileText,
  Search,
  Filter,
  Calendar,
  Download,
  Settings,
  Radar,
  Brain
} from 'lucide-react'
import { tw, utils } from '@/config/design-system'

export type TabId = 'overview' | 'workforce' | 'analytics' | 'insights' | 'reports'

interface TabDefinition {
  id: TabId
  label: string
  icon: any
  description: string
  badge?: number
  color: string
}

interface MainNavigationProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  criticalAlertsCount?: number
  onGlobalSearch?: (query: string) => void
  onFilter?: () => void
  onExport?: () => void
  className?: string
}

const tabDefinitions: TabDefinition[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Executive dashboard and KPIs',
    color: '#3B82F6'
  },
  {
    id: 'workforce',
    label: 'Workforce',
    icon: Users,
    description: 'Employee directory and teams',
    color: '#10B981'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: Radar,
    description: 'Skills and performance analytics',
    color: '#8B5CF6'
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Brain,
    description: 'Gap analysis and recommendations',
    color: '#F59E0B'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    description: 'Reports and data exports',
    color: '#EF4444'
  }
]

const containerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
}

const tabVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
}

export default function MainNavigation({ 
  activeTab, 
  onTabChange, 
  criticalAlertsCount,
  onGlobalSearch,
  onFilter,
  onExport,
  className 
}: MainNavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={utils.cn(
        "sticky top-0 z-50 backdrop-blur-xl border-b border-gray-600/30 mb-6 sm:mb-8",
        className
      )}
      style={{ background: 'rgba(10, 10, 12, 0.8)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-center">
          {/* Main Tabs */}
          <motion.div 
            className="flex items-center gap-2 p-2 rounded-3xl backdrop-blur-xl border border-gray-600/40"
            style={{ background: 'rgba(15, 15, 20, 0.95)' }}
          >
            {tabDefinitions.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <motion.button
                  key={tab.id}
                  variants={tabVariants}
                  onClick={() => onTabChange(tab.id)}
                  className={utils.cn(
                    "relative flex items-center gap-3 px-4 xl:px-5 py-3 xl:py-3.5 rounded-2xl transition-all duration-300 min-w-[140px] xl:min-w-[160px]",
                    isActive
                      ? "text-white shadow-lg transform scale-[0.98]" 
                      : "text-gray-300 hover:text-white hover:scale-[1.02]"
                  )}
                  style={{
                    backgroundColor: isActive ? tab.color : 'transparent',
                    borderColor: isActive ? `${tab.color}40` : 'transparent'
                  }}
                  whileHover={{ scale: isActive ? 0.98 : 1.02 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="text-sm font-medium truncate">{tab.label}</div>
                    <div className={utils.cn(
                      "text-xs truncate",
                      isActive ? "text-white/80" : "text-gray-400"
                    )}>
                      {tab.description}
                    </div>
                  </div>
                  
                  {/* Badge for critical alerts */}
                  {tab.id === 'insights' && criticalAlertsCount && criticalAlertsCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      {criticalAlertsCount > 9 ? '9+' : criticalAlertsCount}
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </div>

        {/* Tablet Navigation */}
        <div className="hidden md:flex lg:hidden items-center justify-center">
          {/* Compact Tabs */}
          <motion.div 
            className="flex items-center gap-1 p-1.5 rounded-2xl backdrop-blur-xl border border-gray-600/40"
            style={{ background: 'rgba(15, 15, 20, 0.95)' }}
          >
            {tabDefinitions.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <motion.button
                  key={tab.id}
                  variants={tabVariants}
                  onClick={() => onTabChange(tab.id)}
                  className={utils.cn(
                    "relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all duration-300 flex-1",
                    isActive
                      ? "text-white shadow-lg" 
                      : "text-gray-300 hover:text-white"
                  )}
                  style={{
                    backgroundColor: isActive ? tab.color : 'transparent'
                  }}
                  title={tab.description}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium truncate">{tab.label}</span>
                  
                  {tab.id === 'insights' && criticalAlertsCount && criticalAlertsCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                    >
                      {criticalAlertsCount > 9 ? '9+' : criticalAlertsCount}
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          {/* Mobile Header */}
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-sm border border-gray-600/40 text-white"
              style={{ background: 'rgba(15, 15, 20, 0.95)' }}
            >
              {(() => {
                const activeTabDef = tabDefinitions.find(t => t.id === activeTab)
                const Icon = activeTabDef?.icon || LayoutDashboard
                return (
                  <>
                    <Icon className="w-5 h-5" style={{ color: activeTabDef?.color }} />
                    <span className="font-medium">{activeTabDef?.label}</span>
                    <motion.div
                      animate={{ rotate: showMobileMenu ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </>
                )
              })()}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 p-3 rounded-2xl backdrop-blur-xl border border-gray-600/40 mb-4"
              style={{ background: 'rgba(15, 15, 20, 0.95)' }}
            >
              {tabDefinitions.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id)
                      setShowMobileMenu(false)
                    }}
                    className={utils.cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "text-white shadow-lg" 
                        : "text-gray-300 hover:text-white"
                    )}
                    style={{
                      backgroundColor: isActive ? tab.color : 'transparent'
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium truncate">{tab.label}</div>
                      <div className={utils.cn(
                        "text-xs truncate",
                        isActive ? "text-white/80" : "text-gray-400"
                      )}>
                        {tab.description}
                      </div>
                    </div>
                    
                    {tab.id === 'insights' && criticalAlertsCount && criticalAlertsCount > 0 && (
                      <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                        {criticalAlertsCount > 9 ? '9+' : criticalAlertsCount}
                      </div>
                    )}
                  </button>
                )
              })}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
} 
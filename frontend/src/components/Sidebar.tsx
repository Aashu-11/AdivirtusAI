'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CompactThemeToggle } from './ThemeToggle'
import { colors, tw, components, animations, utils } from '@/config/design-system'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface User {
  email?: string | undefined
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
  id?: string
}

interface NavItem {
  name: string
  path: string
  icon: string
  badge?: string
  isDropdown?: boolean
  dropdownItems?: NavItem[]
  dynamicPath?: boolean
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [gapAnalysisId, setGapAnalysisId] = useState<string | null>(null)
  const [loadingGapAnalysis, setLoadingGapAnalysis] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user?.id) {
        fetchGapAnalysisId(user.id)
      }
    }
    
    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user?.id) {
        fetchGapAnalysisId(session.user.id)
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])
  
  const fetchGapAnalysisId = async (userId: string): Promise<string | null> => {
    try {
      setLoadingGapAnalysis(true)
      
      // Use the API endpoint instead of direct Supabase query
      const response = await fetch(`/api/gap-analysis/check-baseline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userId 
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch gap analysis')
      }
      
      const data = await response.json()
      
      if (data.exists && data.baselineId) {
        console.log('Gap Analysis ID found:', data.baselineId)
        setGapAnalysisId(data.baselineId)
        return data.baselineId
      } else {
        console.log('No gap analysis found for user')
        setGapAnalysisId(null)
        return null
      }
    } catch (error) {
      console.error('Error fetching gap analysis ID:', error)
      setGapAnalysisId(null)
      return null
    } finally {
      setLoadingGapAnalysis(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/auth/signin')
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  // Handle click for Gap Analysis if the ID isn't loaded yet
  const handleGapAnalysisClick = async (e: React.MouseEvent) => {
    e.preventDefault() // Always prevent default navigation
    router.push('/technical-assessment')
  }

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
      name: 'HR Dashboard',
      path: '/hrdashboard',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    },
    {
      name: 'Learning Profile',
      path: '/learning-profile',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
    },
    {
      name: 'Roadmap',
      path: '/roadmap',
      icon: 'M3 7l6 6-6 6M21 7l-6 6 6 6', // Path icon (arrows)
    },
    {
      name: 'Gap Analysis',
      path: '/technical-assessment',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      dynamicPath: true
    },
    {
      name: 'Assessments',
      path: '#',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      isDropdown: true,
      dropdownItems: [
        {
          name: 'Onboarding Assessment',
          path: '/assessments',
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
        },
        {
          name: 'Technical Assessment',
          path: '/technical-assessment',
          icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        }
      ]
    },
    {
      name: 'Developer',
      path: '#',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      isDropdown: true,
      dropdownItems: [
        {
          name: 'Design System',
          path: '/design',
          icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a4 4 0 004 4z'
        }
      ]
    }
  ]

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  // Helper function to get nav item classes
  const getNavItemClasses = (isActive: boolean) => {
    return utils.cn(
      "flex items-center px-3 py-2.5 rounded-xl",
      animations.css.transition,
      isActive 
        ? utils.cn(tw.bgAccent.blue, tw.text.blue, tw.border.blue)
        : utils.cn(tw.text.secondary, tw.hover.subtle, "hover:text-white dark:hover:text-black")
    )
  }

  // Helper function to get dropdown button classes
  const getDropdownButtonClasses = (isOpen: boolean) => {
    return utils.cn(
      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl",
      animations.css.transition,
      isOpen 
        ? utils.cn(tw.bgAccent.blue, tw.text.blue)
        : utils.cn(tw.text.secondary, tw.hover.subtle, "hover:text-white dark:hover:text-black")
    )
  }

  // Helper function to get icon container classes
  const getIconContainerClasses = () => {
    return utils.cn(
      "w-7 h-7 rounded-full flex items-center justify-center",
      tw.bg.nested
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modern blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} // slightly faster
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 dark:bg-white/50"
          />

          {/* Design System Sidebar */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 40,
              mass: 1
              // no delay
            }}
            className={utils.cn(
              "fixed left-0 top-0 bottom-0 w-72 backdrop-blur-xl z-50 shadow-2xl",
              tw.bg.secondary,
              tw.border.primary,
              "border-r"
            )}
          >
            <div className="h-full flex flex-col">
              {/* App Logo */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }} // remove delay
                className="p-6 flex items-center"
              >
                <div className={utils.cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shadow-lg",
                  components.iconContainer.blue
                )}>
                  <span className={utils.cn("text-lg font-semibold", tw.text.primary)}>A</span>
                </div>
                <span className={utils.cn("ml-3 text-base font-medium", tw.text.primary)}>
                  Adivirtus
                </span>
              </motion.div>
              
              {/* Navigation Section */}
              <div className="flex-1 overflow-y-auto py-4 px-4">
                <nav className="space-y-1">
                  {navItems.map((item, index) => (
                    <motion.div 
                      key={item.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0 }} // remove delay between nav items
                    >
                      {item.isDropdown ? (
                        <div className="mb-1">
                          <button
                            onClick={() => toggleDropdown(item.name)}
                            className={getDropdownButtonClasses(openDropdown === item.name)}
                          >
                            <div className="flex items-center">
                              <div className={getIconContainerClasses()}>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d={item.icon}
                                  />
                                </svg>
                              </div>
                              <span className={utils.cn("ml-2.5 font-medium", tw.typography.bodyText)}>
                                {item.name}
                              </span>
                            </div>
                            
                            <motion.svg
                              animate={{ rotate: openDropdown === item.name ? 180 : 0 }}
                              className={utils.cn("w-4 h-4", tw.text.tertiary)}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 9l-7 7-7-7"
                              />
                            </motion.svg>
                          </button>
                          
                          <AnimatePresence>
                            {openDropdown === item.name && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }} // slightly faster
                                className="overflow-hidden mt-1 ml-2"
                              >
                                <div className={utils.cn(
                                  "pl-5 space-y-1 border-l ml-3.5",
                                  tw.border.primary
                                )}>
                                  {item.dropdownItems?.map((subItem) => (
                                    <Link
                                      key={subItem.name}
                                      href={subItem.path}
                                      className={utils.cn(
                                        "flex items-center py-2 px-3 rounded-lg",
                                        animations.css.transition,
                                        pathname === subItem.path 
                                          ? utils.cn(tw.bgAccent.blue, tw.text.blue)
                                          : utils.cn(tw.text.tertiary, tw.hover.subtle, "hover:text-white dark:hover:text-black")
                                      )}
                                    >
                                      <svg
                                        className={utils.cn("w-4 h-4", tw.text.tertiary)}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={1.5}
                                          d={subItem.icon}
                                        />
                                      </svg>
                                      <span className={utils.cn("ml-2 font-medium", tw.typography.bodyText)}>
                                        {subItem.name}
                                      </span>
                                      {subItem.badge && (
                                        <span className={utils.cn(
                                          "ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded-md",
                                          subItem.badge === 'New' 
                                            ? utils.cn(tw.bgAccent.emerald, tw.text.emerald)
                                            : utils.cn(tw.bgAccent.blue, tw.text.blue)
                                        )}>
                                          {subItem.badge}
                                        </span>
                                      )}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        item.dynamicPath ? (
                          <button
                            onClick={handleGapAnalysisClick}
                            className={utils.cn(
                              "w-full",
                              getNavItemClasses(pathname === '/technical-assessment')
                            )}
                          >
                            <div className={getIconContainerClasses()}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                              </svg>
                            </div>
                            <span className={utils.cn("ml-2.5 font-medium", tw.typography.bodyText)}>
                              {item.name}
                            </span>
                            {loadingGapAnalysis && (
                              <svg className={utils.cn("animate-spin ml-auto h-3 w-3", tw.text.tertiary)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                          </button>
                        ) : (
                          <Link
                            href={item.path}
                            className={getNavItemClasses(pathname === item.path)}
                          >
                            <div className={getIconContainerClasses()}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                              </svg>
                            </div>
                            <span className={utils.cn("ml-2.5 font-medium", tw.typography.bodyText)}>
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className={utils.cn(
                                "ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded-md",
                                tw.bgAccent.emerald,
                                tw.text.emerald
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )
                      )}
                    </motion.div>
                  ))}
                </nav>
              </div>

              {/* Theme Toggle Section */}
              <div className="px-4 pb-4">
                <div className={utils.cn(
                  "flex items-center justify-between p-3 rounded-xl border",
                  tw.bg.nested,
                  tw.border.primary
                )}>
                  <div className="flex items-center">
                    <div className={getIconContainerClasses()}>
                      <svg className={utils.cn("w-4 h-4", tw.text.secondary)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 21h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a4 4 0 004 4z" />
                      </svg>
                    </div>
                    <span className={utils.cn("ml-2.5 font-medium", tw.typography.bodyText, tw.text.secondary)}>
                      Theme
                    </span>
                  </div>
                  <CompactThemeToggle />
                </div>
              </div>

              {/* User Profile Section */}
              {user && (
                <div className={utils.cn(
                  "p-4 mx-4 mb-4 rounded-xl border",
                  tw.bg.nested,
                  tw.border.primary
                )}>
                  <div className="flex items-center space-x-3">
                    <div className={utils.cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shadow-lg",
                      components.iconContainer.blue
                    )}>
                      {user.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className={utils.cn("text-sm font-bold", tw.text.primary)}>
                          {(user.user_metadata?.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={utils.cn("font-medium truncate", tw.typography.bodyText, tw.text.primary)}>
                        {user.user_metadata?.name || 'User'}
                      </p>
                      <p className={utils.cn("text-xs truncate", tw.text.tertiary)}>
                        {user.email?.split('@')[0]}
                      </p>
                    </div>
                    <button 
                      onClick={handleSignOut} 
                      className={utils.cn(
                        "text-xs transition-colors",
                        tw.text.tertiary,
                        "hover:text-white dark:hover:text-black"
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
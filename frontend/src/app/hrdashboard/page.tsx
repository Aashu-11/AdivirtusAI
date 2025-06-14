'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { tw, utils } from '@/config/design-system'
import { hrAnalyticsService, hrAnalyticsUtils } from '@/services/hr-analytics'
import { HRDashboardData, EmployeeSummary, DashboardState } from '@/types/hr-analytics'

// Import new tab-based components
import HeroSection from '@/components/hr-dashboard/HeroSection'
import MainNavigation from '@/components/hr-dashboard/MainNavigation'
import OverviewTab from '@/components/hr-dashboard/OverviewTab'
import WorkforceTab from '@/components/hr-dashboard/WorkforceTab'
import AnalyticsTab from '@/components/hr-dashboard/AnalyticsTab'
import InsightsTab from '@/components/hr-dashboard/InsightsTab'
import ReportsTab from '@/components/hr-dashboard/ReportsTab'
import type { TabId } from '@/components/hr-dashboard/MainNavigation'

export default function HRDashboard() {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    isLoading: true,
    data: null,
    error: null,
    lastRefresh: null
  });

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [isGeneratingAnalytics, setIsGeneratingAnalytics] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(false);
  const [liveUpdatesController, setLiveUpdatesController] = useState<{ stop: () => void } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setDashboardState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check HR status first
      const hrStatusResponse = await hrAnalyticsService.checkHRStatus();
      if (hrStatusResponse.error || !hrStatusResponse.data?.is_hr) {
        throw new Error(hrStatusResponse.error || 'Not authorized as HR personnel');
      }

      // Load dashboard data
      const [dashboardResponse, employeesResponse] = await Promise.all([
        hrAnalyticsService.getDashboardData(),
        hrAnalyticsService.getEmployeeList()
      ]);

      if (dashboardResponse.error) {
        throw new Error(dashboardResponse.error);
      }

      if (employeesResponse.error) {
        console.warn('Failed to load employees:', employeesResponse.error);
      }

      setDashboardState({
        isLoading: false,
        data: dashboardResponse.data || null,
        error: null,
        lastRefresh: new Date()
      });

      setEmployees(employeesResponse.data || []);

    } catch (error) {
      setDashboardState({
        isLoading: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
        lastRefresh: null
      });
    }
  }, []);

  // Generate analytics
  const generateAnalytics = async () => {
    setIsGeneratingAnalytics(true);
    try {
      const response = await hrAnalyticsService.generateAnalytics({
        job_type: 'full_analysis',
        force_refresh: true
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Reload dashboard data after generation
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to generate analytics:', error);
    } finally {
      setIsGeneratingAnalytics(false);
    }
  };

  // Setup live updates
  const setupLiveUpdates = useCallback(async () => {
    // Close any existing connection first
    setLiveUpdatesController(prevController => {
      if (prevController) {
        hrAnalyticsService.closeLiveUpdates(prevController);
      }
      return null;
    });

    try {
      const newController = await hrAnalyticsService.setupLiveUpdates(
        (data) => {
          console.log('Live update received:', data);
          // Update dashboard with live data
          if (data.type === 'update' && data.overall_competency !== undefined) {
            setDashboardState(prev => {
              if (!prev.data) return prev;
              return {
                ...prev,
                data: {
                  ...prev.data,
                  overview: {
                    ...prev.data.overview,
                    overall_competency: data.overall_competency,
                    total_employees: data.employee_count
                  },
                  last_updated: data.timestamp
                }
              };
            });
          }
        },
        (error) => {
          console.error('Live updates error:', error);
          setLiveUpdatesEnabled(false);
          setLiveUpdatesController(null);
        }
      );

      if (newController) {
        setLiveUpdatesController(newController);
        setLiveUpdatesEnabled(true);
      } else {
        setLiveUpdatesEnabled(false);
      }
    } catch (error) {
      console.error('Failed to setup live updates:', error);
      setLiveUpdatesEnabled(false);
      setLiveUpdatesController(null);
    }
  }, []);

  // Toggle live updates
  const toggleLiveUpdates = useCallback(() => {
    if (liveUpdatesEnabled) {
      // Disable live updates
      setLiveUpdatesController(prevController => {
        if (prevController) {
          hrAnalyticsService.closeLiveUpdates(prevController);
        }
        return null;
      });
      setLiveUpdatesEnabled(false);
    } else {
      // Enable live updates
      setupLiveUpdates();
    }
  }, [liveUpdatesEnabled, setupLiveUpdates]);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
    
    // Cleanup on unmount
    return () => {
      if (liveUpdatesController) {
        hrAnalyticsService.closeLiveUpdates(liveUpdatesController);
      }
    };
  }, [loadDashboardData]);

  // Handle tab change
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'refresh':
        generateAnalytics();
        break;
      case 'toggle-live':
        toggleLiveUpdates();
        break;
      case 'view-insights':
        setActiveTab('insights');
        break;
      case 'export-data':
        setActiveTab('reports');
        break;
      default:
        console.log('Quick action:', action);
    }
  };

  if (dashboardState.isLoading) {
    return (
      <div className={utils.cn("min-h-screen", tw.bg.primary)}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8 pt-20">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (dashboardState.error) {
    return (
      <div className={utils.cn("min-h-screen", tw.bg.primary)}>
        <div className="max-w-7xl mx-auto px-6 py-8 pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl backdrop-blur-xl border border-gray-600/30 text-center"
            style={{ background: 'rgba(10, 10, 12, 0.7)' }}
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className={utils.cn('text-2xl font-bold mb-4', tw.text.primary)}>Access Denied</h2>
            <p className={utils.cn('text-sm mb-6', tw.text.secondary)}>
              {dashboardState.error}
            </p>
            <button
              onClick={loadDashboardData}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const data = dashboardState.data;

  if (!data || !data.has_data) {
    return (
      <div className={utils.cn("min-h-screen", tw.bg.primary)}>
        <div className="max-w-7xl mx-auto px-6 py-8 pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl backdrop-blur-xl border border-gray-600/30 text-center"
            style={{ background: 'rgba(10, 10, 12, 0.7)' }}
          >
            <div className="text-6xl mb-4">📊</div>
            <h2 className={utils.cn('text-2xl font-bold mb-4', tw.text.primary)}>No Analytics Data</h2>
            <p className={utils.cn('text-sm mb-6', tw.text.secondary)}>
              Analytics data hasn't been generated yet. Click below to generate your first analytics report.
            </p>
            <button
              onClick={generateAnalytics}
              disabled={isGeneratingAnalytics}
              className={utils.cn(
                "px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors",
                isGeneratingAnalytics && "opacity-50 cursor-not-allowed"
              )}
            >
              {isGeneratingAnalytics ? 'Generating...' : 'Generate Analytics'}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const criticalAlertsCount = Object.values(data.critical_gaps || {}).reduce((sum, gaps: any) => 
    sum + (Array.isArray(gaps) ? gaps.length : 0), 0);

  return (
    <div className={utils.cn("min-h-screen", tw.bg.primary)}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <HeroSection 
            data={data}
            organizationName={data.organization}
            onQuickAction={handleQuickAction}
          />
        </motion.div>

        {/* Main Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <MainNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            criticalAlertsCount={criticalAlertsCount}
          />
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab 
              data={data}
              employees={employees}
              organizationName={data.organization}
            />
          )}
          
          {activeTab === 'workforce' && (
            <WorkforceTab 
              data={data}
              employees={employees}
              organizationName={data.organization}
            />
          )}
          
          {activeTab === 'analytics' && (
            <AnalyticsTab data={data} organizationName={data.organization} />
          )}
          
          {activeTab === 'insights' && (
            <InsightsTab 
              data={data}
              organizationName={data.organization}
            />
          )}
          
          {activeTab === 'reports' && (
            <ReportsTab 
              data={data}
              organizationName={data.organization}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
} 
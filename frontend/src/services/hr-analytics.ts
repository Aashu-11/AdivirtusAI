/**
 * HR Analytics API Service
 * Handles all API calls for HR dashboard functionality
 */

import { 
  HRUser, 
  HRDashboardData, 
  EmployeeSummary, 
  EmployeeDetail, 
  OrganizationStats,
  AnalyticsRefreshStatus,
  GenerateAnalyticsRequest,
  GenerateAnalyticsResponse,
  CompetencyDistributionData,
  SkillMaturityHeatmapData,
  CriticalSkillGapsData,
  APIResponse 
} from '@/types/hr-analytics';
import { createClient } from '@/utils/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const HR_API_BASE = `${API_BASE_URL}/api/hr-analytics`;

class HRAnalyticsService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${HR_API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error(`HR Analytics API Error (${endpoint}):`, error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Check if current user is HR personnel
   */
  async checkHRStatus(): Promise<APIResponse<HRUser>> {
    return this.makeRequest<HRUser>('/hr/status/');
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<APIResponse<HRDashboardData>> {
    return this.makeRequest<HRDashboardData>('/dashboard/');
  }

  /**
   * Get list of employees for the organization
   */
  async getEmployeeList(): Promise<APIResponse<EmployeeSummary[]>> {
    return this.makeRequest<EmployeeSummary[]>('/employees/');
  }

  /**
   * Get detailed information for a specific employee
   */
  async getEmployeeDetail(employeeId: string): Promise<APIResponse<EmployeeDetail>> {
    return this.makeRequest<EmployeeDetail>(`/employees/${employeeId}/`);
  }

  /**
   * Generate or refresh analytics data
   */
  async generateAnalytics(request: GenerateAnalyticsRequest = {}): Promise<APIResponse<GenerateAnalyticsResponse>> {
    return this.makeRequest<GenerateAnalyticsResponse>('/generate/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(): Promise<APIResponse<OrganizationStats>> {
    return this.makeRequest<OrganizationStats>('/organization/stats/');
  }

  /**
   * Get list of departments for the organization
   */
  async getDepartments(): Promise<APIResponse<{ departments: Array<Record<string, unknown>>, organization: string, total_departments: number }>> {
    return this.makeRequest('/departments/');
  }

  /**
   * Get department skill matrix for radar visualization
   */
  async getDepartmentSkillMatrix(department: string | null): Promise<APIResponse<Record<string, unknown>>> {
    const params = department ? `?department=${encodeURIComponent(department)}` : '';
    return this.makeRequest(`/departments/skill-matrix/${params}`);
  }

  /**
   * Get comprehensive analytics for a specific department
   */
  async getDepartmentAnalytics(department: string): Promise<APIResponse<Record<string, unknown>>> {
    return this.makeRequest(`/departments/analytics/?department=${encodeURIComponent(department)}`);
  }

  /**
   * Get competency level distribution for the organization
   */
  async getCompetencyDistribution(): Promise<APIResponse<CompetencyDistributionData>> {
    return this.makeRequest<CompetencyDistributionData>('/analytics/competency-distribution/');
  }

  /**
   * Get skill maturity heatmap data for the organization
   */
  async getSkillMaturityHeatmap(): Promise<APIResponse<SkillMaturityHeatmapData>> {
    return this.makeRequest<SkillMaturityHeatmapData>('/analytics/skill-maturity-heatmap/');
  }

  /**
   * Get critical skill gap analysis for the organization
   */
  async getCriticalSkillGaps(): Promise<APIResponse<CriticalSkillGapsData>> {
    return this.makeRequest<CriticalSkillGapsData>('/analytics/critical-skill-gaps/');
  }

  /**
   * Check if analytics data needs refresh
   */
  async getRefreshStatus(): Promise<APIResponse<AnalyticsRefreshStatus>> {
    return this.makeRequest<AnalyticsRefreshStatus>('/refresh/status/');
  }

  /**
   * Set up polling-based live updates (more reliable than SSE)
   */
  async setupLiveUpdates(onUpdate: (data: any) => void, onError: (error: string) => void): Promise<{ stop: () => void } | null> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        onError('No authentication token available');
        return null;
      }

      let isRunning = true;
      let pollCount = 0;

      const poll = async () => {
        if (!isRunning) return;

        try {
          pollCount++;
          console.log(`Live updates poll #${pollCount}`);

          // Get current dashboard data
          const response = await this.getDashboardData();
          
          if (response.error) {
            console.error('Live updates poll error:', response.error);
            onError(response.error);
            return;
          }

          if (response.data) {
            const updateData = {
              type: 'update',
              timestamp: new Date().toISOString(),
              organization: response.data.organization,
              employee_count: response.data.overview.total_employees,
              overall_competency: response.data.overview.overall_competency,
              last_updated: response.data.last_updated,
              poll_count: pollCount
            };

            onUpdate(updateData);
          }

        } catch (error) {
          console.error('Live updates poll exception:', error);
          onError(error instanceof Error ? error.message : 'Polling error');
        }

        // Schedule next poll
        if (isRunning) {
          setTimeout(poll, 30000); // Poll every 30 seconds
        }
      };

      // Send initial connected message
      onUpdate({
        type: 'connected',
        message: 'Live updates started (polling mode)',
        timestamp: new Date().toISOString()
      });

      // Start polling
      setTimeout(poll, 2000); // First poll after 2 seconds

      // Return control object
      return {
        stop: () => {
          isRunning = false;
          console.log('Live updates polling stopped');
        }
      };

    } catch (error) {
      console.error('Failed to setup live updates:', error);
      onError('Failed to setup live updates');
      return null;
    }
  }

  /**
   * Close live updates connection (now for polling)
   */
  closeLiveUpdates(controller: { stop: () => void } | null) {
    if (controller && typeof controller.stop === 'function') {
      try {
        controller.stop();
      } catch (error) {
        console.error('Error stopping live updates:', error);
      }
    }
  }
}

// Export singleton instance
export const hrAnalyticsService = new HRAnalyticsService();

// Export class for testing
export { HRAnalyticsService };

// Utility functions for data processing
export const hrAnalyticsUtils = {
  /**
   * Format competency score as percentage
   */
  formatCompetency(score: number): string {
    return `${Math.round(score)}%`;
  },

  /**
   * Get competency level label
   */
  getCompetencyLevel(score: number): { label: string; color: string } {
    if (score >= 85) return { label: 'Excellent', color: 'emerald' };
    if (score >= 70) return { label: 'Good', color: 'blue' };
    if (score >= 60) return { label: 'Satisfactory', color: 'amber' };
    return { label: 'Needs Improvement', color: 'rose' };
  },

  /**
   * Calculate coverage percentage
   */
  calculateCoverage(total: number, gaps: number): number {
    if (total === 0) return 0;
    return Math.max(0, ((total - gaps) / total) * 100);
  },

  /**
   * Sort employees by specified field
   */
  sortEmployees(
    employees: EmployeeSummary[], 
    field: keyof EmployeeSummary, 
    direction: 'asc' | 'desc' = 'asc'
  ): EmployeeSummary[] {
    return [...employees].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  },

  /**
   * Filter employees by criteria
   */
  filterEmployees(
    employees: EmployeeSummary[],
    filters: {
      department?: string;
      competency_range?: [number, number];
      has_gaps?: boolean;
    }
  ): EmployeeSummary[] {
    return employees.filter(employee => {
      // Department filter
      if (filters.department && employee.department !== filters.department) {
        return false;
      }

      // Competency range filter
      if (filters.competency_range) {
        const [min, max] = filters.competency_range;
        if (employee.avg_competency < min || employee.avg_competency > max) {
          return false;
        }
      }

      // Has gaps filter
      if (filters.has_gaps !== undefined) {
        const hasGaps = employee.skills_with_gaps > 0;
        if (filters.has_gaps !== hasGaps) {
          return false;
        }
      }

      return true;
    });
  },

  /**
   * Get unique departments from employee list
   */
  getUniqueDepartments(employees: EmployeeSummary[]): string[] {
    const departments = employees
      .map(emp => emp.department)
      .filter((dept): dept is string => dept !== null && dept !== undefined);
    
    return Array.from(new Set(departments)).sort();
  },

  /**
   * Calculate team statistics from employee data
   */
  calculateTeamStats(employees: EmployeeSummary[]) {
    if (employees.length === 0) {
      return {
        avgCompetency: 0,
        totalGaps: 0,
        criticalEmployees: 0,
        highPerformers: 0
      };
    }

    const avgCompetency = employees.reduce((sum, emp) => sum + emp.avg_competency, 0) / employees.length;
    const totalGaps = employees.reduce((sum, emp) => sum + emp.skills_with_gaps, 0);
    const criticalEmployees = employees.filter(emp => emp.avg_competency < 60).length;
    const highPerformers = employees.filter(emp => emp.avg_competency >= 85).length;

    return {
      avgCompetency: Math.round(avgCompetency * 100) / 100,
      totalGaps,
      criticalEmployees,
      highPerformers
    };
  },

  /**
   * Format date for display
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  },

  /**
   * Calculate time ago from date string
   */
  timeAgo(dateString: string | null): string {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;
    } catch {
      return 'Unknown';
    }
  }
}; 
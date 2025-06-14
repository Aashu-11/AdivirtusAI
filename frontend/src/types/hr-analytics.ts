/**
 * TypeScript types for HR Analytics Dashboard
 */

export interface HRUser {
  is_hr: boolean;
  organization_name: string | null;
  hr_name: string | null;
  permissions: string[];
}

export interface OverviewMetrics {
  total_employees: number;
  overall_competency: number;
  technical_coverage: number;
  soft_skill_coverage: number;
  domain_coverage: number;
  sop_coverage: number;
}

export interface TeamAnalytics {
  team_name: string;
  employee_count: number;
  avg_competency: number;
  total_gaps: number;
  critical_gaps: number;
  technical_coverage: number;
  soft_skill_coverage: number;
  domain_coverage: number;
  sop_coverage: number;
}

export interface CriticalEmployee {
  user_id: string;
  employee_name: string;
  department: string | null;
  job_title: string | null;
  competency: number;
  gaps_count: number;
}

export interface CriticalGaps {
  technical_critical: CriticalEmployee[];
  soft_skills_critical: CriticalEmployee[];
  domain_critical: CriticalEmployee[];
  sop_critical: CriticalEmployee[];
}

export interface EmployeeSummary {
  user_id: string;
  email: string;
  full_name: string;
  department: string | null;
  job_title: string | null;
  avg_competency: number;
  total_skills: number;
  skills_with_gaps: number;
  technical_gaps: number;
  soft_skill_gaps: number;
  domain_gaps: number;
  sop_gaps: number;
  assessment_date: string | null;
}

export interface HRDashboardData {
  organization: string;
  hr_name: string;
  last_updated: string;
  overview: OverviewMetrics;
  team_analytics: TeamAnalytics[];
  critical_gaps: CriticalGaps;
  skill_breakdown: Record<string, any>;
  employee_summary: EmployeeSummary[];
  has_data: boolean;
}

export interface EmployeeDetail {
  basic_info: {
    user_id: string;
    email: string;
    department: string | null;
    job_title: string | null;
    organization: string;
  };
  competency_overview: {
    overall_competency: number;
    total_skills: number;
    skills_with_gaps: number;
    assessment_completion: number;
  };
  skill_breakdown: {
    technical_skills: number;
    technical_gaps: number;
    soft_skills: number;
    soft_skill_gaps: number;
    domain_knowledge: number;
    domain_gaps: number;
    sop_skills: number;
    sop_gaps: number;
  };
  detailed_analysis: Record<string, any>;
}

export interface OrganizationStats {
  organization_name: string;
  total_employees: number;
  employees_with_assessments: number;
  departments: string[];
  latest_analytics_date: string | null;
  analytics_frequency: string;
}

export interface AnalyticsRefreshStatus {
  needs_refresh: boolean;
  reason: string;
  last_generated: string | null;
  data_age_hours: number | null;
}

export interface GenerateAnalyticsRequest {
  job_type?: 'full_analysis' | 'incremental' | 'refresh';
  force_refresh?: boolean;
}

export interface GenerateAnalyticsResponse {
  success: boolean;
  message: string;
  job_id: string | null;
  analytics_id: string | null;
  estimated_completion_time: number | null;
}

export interface LiveUpdateData {
  timestamp: string;
  organization: string;
  employee_count: number;
  overall_competency: number;
  last_updated: string;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface CompetencyDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface SkillCategoryData {
  category: string;
  total_skills: number;
  gaps: number;
  coverage_percentage: number;
}

// API Response types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard state types
export interface DashboardState {
  isLoading: boolean;
  data: HRDashboardData | null;
  error: string | null;
  lastRefresh: Date | null;
}

export interface EmployeeListState {
  isLoading: boolean;
  employees: EmployeeSummary[];
  error: string | null;
  filters: {
    department?: string;
    competency_range?: [number, number];
    has_gaps?: boolean;
  };
}

// Filter and sort types
export type SortField = 'full_name' | 'email' | 'department' | 'avg_competency' | 'total_skills' | 'skills_with_gaps';
export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  field: SortField;
  direction: SortDirection;
}

// Component prop types
export interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'blue' | 'emerald' | 'amber' | 'rose';
  format?: 'number' | 'percentage' | 'currency';
}

export interface ChartProps {
  data: ChartDataPoint[];
  title: string;
  height?: number;
  showLegend?: boolean;
  color?: string;
}

export interface TeamCardProps {
  team: TeamAnalytics;
  onClick?: (team: TeamAnalytics) => void;
}

export interface EmployeeRowProps {
  employee: EmployeeSummary;
  onClick?: (employee: EmployeeSummary) => void;
}

// Real-time update types
export interface WebSocketMessage {
  type: 'analytics_update' | 'employee_update' | 'error';
  data: any;
  timestamp: string;
}

export interface RealTimeConfig {
  enabled: boolean;
  updateInterval: number; // in seconds
  autoRefresh: boolean;
}

// Competency Analytics Types
export interface CompetencyLevelData {
  level: string;
  count: number;
  percentage: number;
  color: string;
}

export interface CompetencyDistributionData {
  distribution: CompetencyLevelData[];
  total_employees: number;
  employees_with_data: number;
  average_competency: number;
  organization: string;
}

export interface DepartmentSkillMatrix {
  department: string;
  employee_count: number;
  technical_skills: number;
  soft_skills: number;
  domain_knowledge: number;
  sop_skills: number;
}

export interface ColorScale {
  min: number;
  max: number;
  thresholds: number[];
}

export interface SkillMaturityHeatmapData {
  heatmap_data: DepartmentSkillMatrix[];
  skill_categories: string[];
  departments: string[];
  color_scale: ColorScale;
  organization: string;
}

// Critical Skill Gap Analysis types
export interface AffectedEmployee {
  employee_id: string;
  name: string;
  department: string;
  current_competency: number;
  target_competency: number;
  gap_percentage: number;
}

export interface HighImpactGap {
  skill_name: string;
  skill_category: string;
  gap_type: string;
  average_gap_percentage: number;
  max_gap_percentage: number;
  affected_employee_count: number;
  business_impact: string;
  risk_level: number;
  affected_employees: AffectedEmployee[];
  recommended_actions: string[];
}

export interface ComplianceRisk {
  employee_id: string;
  employee_name: string;
  department: string;
  skill_name: string;
  skill_category: string;
  current_competency: number;
  required_competency: number;
  compliance_gap: number;
  risk_severity: number;
  compliance_deadline: string;
  business_criticality: number;
  recommended_actions: string[];
}

export interface LeadershipSkillGap {
  skill_name: string;
  skill_category: string;
  current_competency: number;
  target_competency: number;
  gap_percentage: number;
}

export interface LeadershipGap {
  employee_id: string;
  employee_name: string;
  department: string;
  position: string;
  leadership_readiness_score: number;
  skill_gaps: LeadershipSkillGap[];
  gap_count: number;
  average_gap: number;
  priority_level: number;
  development_recommendations: string[];
}

export interface DomainDeficit {
  skill_name: string;
  skill_category: string;
  average_competency: number;
  deficit_percentage: number;
  affected_employee_count: number;
  total_employee_count: number;
  affected_departments: string[];
  business_criticality: number;
  productivity_impact: string;
  recommended_actions: string[];
}

export interface RiskSummary {
  total_gaps_identified: number;
  critical_gaps_count: number;
  high_risk_percentage: number;
  risk_distribution: Record<number, number>;
  overall_risk_score: number;
}

export interface GapRecommendation {
  priority: string;
  category: string;
  title: string;
  description: string;
  estimated_timeline: string;
  expected_impact: string;
  action_items: string[];
}

export interface CriticalSkillGapsData {
  high_impact_gaps: HighImpactGap[];
  compliance_risks: ComplianceRisk[];
  leadership_gaps: LeadershipGap[];
  domain_deficits: DomainDeficit[];
  risk_summary: RiskSummary;
  recommendations: GapRecommendation[];
  organization: string;
  analysis_date: string;
  total_employees_analyzed: number;
  error?: string;
} 
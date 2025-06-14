"""
URL configuration for HR Analytics API
"""

from django.urls import path
from . import views

app_name = 'hr_analytics'

urlpatterns = [
    # HR Authentication & Status
    path('hr/status/', views.hr_status_check, name='hr_status_check'),
    
    # Debug endpoint
    path('debug/user/', views.debug_user_info, name='debug_user_info'),
    
    # Main Dashboard
    path('dashboard/', views.HRDashboardView.as_view(), name='hr_dashboard'),
    
    # Employee Management
    path('employees/', views.EmployeeListView.as_view(), name='employee_list'),
    path('employees/<str:employee_id>/', views.EmployeeDetailView.as_view(), name='employee_detail'),
    
    # Department Analytics - NEW
    path('departments/', views.DepartmentListView.as_view(), name='department_list'),
    path('departments/skill-matrix/', views.DepartmentSkillMatrixView.as_view(), name='department_skill_matrix'),
    path('departments/analytics/', views.DepartmentAnalyticsView.as_view(), name='department_analytics'),
    
    # Analytics Generation
    path('generate/', views.GenerateAnalyticsView.as_view(), name='generate_analytics'),
    path('generate-analytics/', views.generate_analytics, name='generate_analytics_post'),
    
    # Advanced Analytics
    path('analytics/competency-distribution/', views.CompetencyDistributionView.as_view(), name='competency_distribution'),
    path('analytics/skill-maturity-heatmap/', views.SkillMaturityHeatmapView.as_view(), name='skill_maturity_heatmap'),
    path('analytics/critical-skill-gaps/', views.CriticalSkillGapsView.as_view(), name='critical_skill_gaps'),
    
    # Organization Statistics
    path('organization/stats/', views.OrganizationStatsView.as_view(), name='organization_stats'),
    
    # Real-time Updates
    path('refresh/status/', views.analytics_refresh_status, name='analytics_refresh_status'),
    path('live-updates/', views.analytics_live_updates, name='analytics_live_updates'),
    path('test-sse-auth/', views.test_sse_auth, name='test_sse_auth'),
    path('simple-sse/', views.simple_sse_test, name='simple_sse_test'),
    path('basic-test/', views.basic_test, name='basic_test'),
] 
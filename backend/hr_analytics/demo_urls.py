"""
Demo URL configuration for HR Analytics API
"""

from django.urls import path
from . import demo_views

app_name = 'hr_analytics_demo'

urlpatterns = [
    # HR Authentication & Status
    path('hr/status/', demo_views.demo_hr_status_check, name='demo_hr_status_check'),
    
    # Main Dashboard
    path('dashboard/', demo_views.DemoHRDashboardView.as_view(), name='demo_dashboard'),
    
    # Employee Management
    path('employees/', demo_views.DemoEmployeeListView.as_view(), name='demo_employee_list'),
    path('employees/<str:employee_id>/', demo_views.demo_employee_detail, name='demo_employee_detail'),
    
    # Analytics Generation
    path('generate/', demo_views.DemoGenerateAnalyticsView.as_view(), name='demo_generate_analytics'),
    
    # Organization Statistics
    path('organization/stats/', demo_views.demo_organization_stats, name='demo_organization_stats'),
    
    # Real-time Updates
    path('refresh/status/', demo_views.demo_analytics_refresh_status, name='demo_refresh_status'),
    path('live-updates/', demo_views.demo_analytics_live_updates, name='demo_live_updates'),
] 
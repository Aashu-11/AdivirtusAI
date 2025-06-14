"""
Django REST Framework serializers for HR Analytics API
"""

from rest_framework import serializers
from .models import HRPersonnel, HRAnalytics, HRAnalyticsJob, HRAnalyticsConfig


class HRPersonnelSerializer(serializers.ModelSerializer):
    """Serializer for HR Personnel model"""
    
    class Meta:
        model = HRPersonnel
        fields = ['id', 'name', 'email', 'organization_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class HRAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for HR Analytics model"""
    
    class Meta:
        model = HRAnalytics
        fields = [
            'id', 'hr_user_id', 'organization_name', 'analysis_date', 'employee_count',
            'overall_competency_score', 'overall_technical_coverage', 'overall_soft_skill_coverage',
            'overall_domain_coverage', 'overall_sop_coverage', 'team_analytics', 'employee_summary',
            'critical_gaps', 'skill_category_breakdown', 'custom_metrics', 'trend_data',
            'benchmark_data', 'recommendations', 'data_freshness', 'computation_metadata',
            'version', 'generated_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'generated_at', 'created_at', 'updated_at']


class HRAnalyticsJobSerializer(serializers.ModelSerializer):
    """Serializer for HR Analytics Job model"""
    
    class Meta:
        model = HRAnalyticsJob
        fields = [
            'id', 'hr_user_id', 'organization_name', 'status', 'job_type', 'employees_processed',
            'total_employees', 'processing_started_at', 'processing_completed_at', 'analytics',
            'error_message', 'processing_log', 'job_parameters', 'performance_metrics',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HRAnalyticsConfigSerializer(serializers.ModelSerializer):
    """Serializer for HR Analytics Configuration model"""
    
    class Meta:
        model = HRAnalyticsConfig
        fields = [
            'id', 'organization_name', 'config_type', 'config_name', 'config_value',
            'description', 'is_active', 'created_by', 'version', 'parent_config',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HRDashboardDataSerializer(serializers.Serializer):
    """Serializer for HR Dashboard response data"""
    
    organization = serializers.CharField()
    hr_name = serializers.CharField()
    last_updated = serializers.DateTimeField(allow_null=True)
    has_data = serializers.BooleanField(default=True)
    
    overview = serializers.DictField()
    team_analytics = serializers.ListField()
    critical_gaps = serializers.DictField()
    skill_breakdown = serializers.DictField()
    employee_summary = serializers.ListField()


class EmployeeListSerializer(serializers.Serializer):
    """Serializer for employee list data"""
    
    user_id = serializers.UUIDField()
    email = serializers.EmailField()
    full_name = serializers.CharField(allow_null=True)
    department = serializers.CharField(allow_null=True)
    job_title = serializers.CharField(allow_null=True)
    avg_competency = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    total_skills = serializers.IntegerField(allow_null=True)
    skills_with_gaps = serializers.IntegerField(allow_null=True)
    assessment_status = serializers.CharField()
    last_assessment = serializers.DateTimeField(allow_null=True)


class EmployeeDetailSerializer(serializers.Serializer):
    """Serializer for detailed employee information"""
    
    basic_info = serializers.DictField()
    competency_overview = serializers.DictField()
    skill_breakdown = serializers.DictField()
    detailed_analysis = serializers.DictField()


class GenerateAnalyticsRequestSerializer(serializers.Serializer):
    """Serializer for analytics generation request"""
    
    job_type = serializers.ChoiceField(
        choices=['full_analysis', 'incremental', 'refresh'],
        default='full_analysis'
    )
    force_refresh = serializers.BooleanField(default=False)


class GenerateAnalyticsResponseSerializer(serializers.Serializer):
    """Serializer for analytics generation response"""
    
    success = serializers.BooleanField()
    message = serializers.CharField()
    job_id = serializers.UUIDField(allow_null=True)
    analytics_id = serializers.UUIDField(allow_null=True)
    estimated_completion_time = serializers.IntegerField(allow_null=True)  # in seconds


class HRStatusCheckSerializer(serializers.Serializer):
    """Serializer for HR status check response"""
    
    is_hr = serializers.BooleanField()
    organization_name = serializers.CharField(allow_null=True)
    hr_name = serializers.CharField(allow_null=True)
    permissions = serializers.ListField(child=serializers.CharField(), default=list)


class AnalyticsJobStatusSerializer(serializers.Serializer):
    """Serializer for job status response"""
    
    job_id = serializers.UUIDField()
    status = serializers.CharField()
    progress_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    employees_processed = serializers.IntegerField()
    total_employees = serializers.IntegerField()
    estimated_time_remaining = serializers.IntegerField(allow_null=True)  # in seconds
    error_message = serializers.CharField(allow_null=True)


class OrganizationStatsSerializer(serializers.Serializer):
    """Serializer for organization statistics"""
    
    organization_name = serializers.CharField()
    total_employees = serializers.IntegerField()
    employees_with_assessments = serializers.IntegerField()
    departments = serializers.ListField(child=serializers.CharField())
    latest_analytics_date = serializers.DateTimeField(allow_null=True)
    analytics_frequency = serializers.CharField()  # daily, weekly, monthly 
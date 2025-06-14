from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
import json


class HRPersonnel(models.Model):
    """Model representing HR personnel with organization mapping"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    organization_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_personnel'
        verbose_name = 'HR Personnel'
        verbose_name_plural = 'HR Personnel'

    def __str__(self):
        return f"{self.name} ({self.organization_name})"


class HRAnalytics(models.Model):
    """Model representing comprehensive HR analytics data"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hr_user_id = models.UUIDField()  # References auth.users
    organization_name = models.CharField(max_length=255)
    analysis_date = models.DateField(auto_now_add=True)
    employee_count = models.IntegerField(default=0)
    
    # Core competency metrics
    overall_competency_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_technical_coverage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_soft_skill_coverage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_domain_coverage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_sop_coverage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Extensible analytics data (JSONB)
    team_analytics = models.JSONField(default=dict, blank=True)
    employee_summary = models.JSONField(default=dict, blank=True)
    critical_gaps = models.JSONField(default=dict, blank=True)
    skill_category_breakdown = models.JSONField(default=dict, blank=True)
    
    # Future extensibility fields
    custom_metrics = models.JSONField(default=dict, blank=True)
    trend_data = models.JSONField(default=dict, blank=True)
    benchmark_data = models.JSONField(default=dict, blank=True)
    recommendations = models.JSONField(default=dict, blank=True)
    
    # Metadata
    data_freshness = models.DateTimeField(null=True, blank=True)
    computation_metadata = models.JSONField(default=dict, blank=True)
    version = models.IntegerField(default=1)
    
    # Timestamps
    generated_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_analytics'
        ordering = ['-generated_at']
        verbose_name = 'HR Analytics'
        verbose_name_plural = 'HR Analytics'

    def __str__(self):
        return f"{self.organization_name} Analytics ({self.analysis_date})"


class HRAnalyticsJob(models.Model):
    """Model for tracking analytics computation jobs"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    TYPE_CHOICES = [
        ('full_analysis', 'Full Analysis'),
        ('incremental', 'Incremental Update'),
        ('refresh', 'Data Refresh'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hr_user_id = models.UUIDField()
    organization_name = models.CharField(max_length=255)
    
    # Job status and metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    job_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='full_analysis')
    
    # Processing details
    employees_processed = models.IntegerField(default=0)
    total_employees = models.IntegerField(default=0)
    processing_started_at = models.DateTimeField(null=True, blank=True)
    processing_completed_at = models.DateTimeField(null=True, blank=True)
    
    # Results and error tracking
    analytics = models.ForeignKey(HRAnalytics, on_delete=models.SET_NULL, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    processing_log = models.JSONField(default=dict, blank=True)
    
    # Extensible metadata
    job_parameters = models.JSONField(default=dict, blank=True)
    performance_metrics = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_analytics_jobs'
        ordering = ['-created_at']
        verbose_name = 'HR Analytics Job'
        verbose_name_plural = 'HR Analytics Jobs'

    def __str__(self):
        return f"{self.organization_name} - {self.job_type} ({self.status})"


class HRAnalyticsConfig(models.Model):
    """Model for storing customizable analytics configurations"""
    CONFIG_TYPE_CHOICES = [
        ('thresholds', 'Thresholds'),
        ('weights', 'Weights'),
        ('kpis', 'KPIs'),
        ('display', 'Display'),
        ('notifications', 'Notifications'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization_name = models.CharField(max_length=255)
    
    # Configuration categories
    config_type = models.CharField(max_length=20, choices=CONFIG_TYPE_CHOICES)
    config_name = models.CharField(max_length=100)
    
    # Flexible configuration data
    config_value = models.JSONField()
    
    # Metadata
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.UUIDField(null=True, blank=True)  # References auth.users
    
    # Version control
    version = models.IntegerField(default=1)
    parent_config = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_analytics_config'
        unique_together = [['organization_name', 'config_type', 'config_name', 'is_active']]
        verbose_name = 'HR Analytics Configuration'
        verbose_name_plural = 'HR Analytics Configurations'

    def __str__(self):
        return f"{self.organization_name} - {self.config_type}: {self.config_name}"

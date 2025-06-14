from django.urls import path
from . import views

urlpatterns = [
    path('upload-technical-assessment/', views.upload_technical_assessment, name='upload_technical_assessment'),
    path('test/', views.test_connection, name='test_connection'),
    
    # Gap analysis endpoints
    path('create-gap-analysis/', views.create_gap_analysis, name='create_gap_analysis'),
    path('create-gap-analysis-public/', views.create_gap_analysis_public, name='create_gap_analysis_public'),
    path('start-gap-analysis/', views.start_gap_analysis_api, name='start_gap_analysis'),
    path('gap-analysis-status/<str:baseline_id>/', views.get_gap_analysis_status, name='get_gap_analysis_status'),
    path('baseline-skill-matrix/<str:baseline_id>/', views.get_baseline_skill_matrix, name='get_baseline_skill_matrix'),

    # Add new path for assessment interpretation
    path('process-assessment/', views.process_assessment, name='process_assessment'),
    path('trigger-interpretation/', views.trigger_interpretation, name='trigger_interpretation'),
    path('interpretation-results/', views.get_interpretation_results, name='get_interpretation_results'),
    path('process-pending-interpretations/', views.process_pending_interpretations, name='process_pending_interpretations'),
] 
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestModelViewSet, health_check, test_endpoint, chat, get_baseline_skill_matrix, start_gap_analysis
from .skills_management import get_skills_management_urls

router = DefaultRouter()
router.register(r'test', TestModelViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health_check'),
    path('test/', test_endpoint, name='test_endpoint'),
    path('chat/', chat, name='chat'),
    path('assessments/baseline-skill-matrix/<uuid:baseline_id>/', get_baseline_skill_matrix, name='get_baseline_skill_matrix'),
    path('assessments/start-gap-analysis/<uuid:baseline_id>/', start_gap_analysis, name='start_gap_analysis'),
    # Skills management endpoints
    path('skills/', include(get_skills_management_urls())),
    path('roadmap/', include('api.urls_roadmap')),
] 
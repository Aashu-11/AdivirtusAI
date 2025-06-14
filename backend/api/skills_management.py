"""
Skills Management API
Handles skills taxonomy, pending skills review, and skill approval workflows
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from services.skills_embedding_service import SkillsEmbeddingService

# Import auto-learning system
try:
    from skill_matrix.auto_learning import AutoLearningEngine, run_auto_learning_analysis, execute_auto_promotion
except ImportError:
    logger.warning("Auto-learning system not available")
    AutoLearningEngine = None

logger = logging.getLogger(__name__)

# Initialize Skills Service
try:
    skills_service = SkillsEmbeddingService()
    logger.info("Skills service initialized for API")
except Exception as e:
    logger.error(f"Failed to initialize skills service: {str(e)}")
    skills_service = None

@method_decorator(csrf_exempt, name='dispatch')
class PendingSkillsView(View):
    """API for managing pending skills"""
    
    def get(self, request):
        """Get list of pending skills for review"""
        try:
            if not skills_service:
                return JsonResponse({'error': 'Skills service not available'}, status=500)
            
            # Get query parameters
            status = request.GET.get('status', 'pending')
            category = request.GET.get('category')
            organization = request.GET.get('organization')
            limit = int(request.GET.get('limit', 50))
            offset = int(request.GET.get('offset', 0))
            
            # Build query
            query = skills_service.supabase.table('pending_skills').select('*')
            
            if status:
                query = query.eq('status', status)
            if category:
                query = query.eq('category', category)
            if organization:
                query = query.eq('organization', organization)
            
            # Order by confidence score (highest first) and created_at
            query = query.order('confidence_score', desc=True).order('created_at', desc=True)
            
            # Apply pagination
            if limit:
                query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            
            pending_skills = result.data if result.data else []
            
            return JsonResponse({
                'success': True,
                'pending_skills': pending_skills,
                'count': len(pending_skills)
            })
            
        except Exception as e:
            logger.error(f"Error fetching pending skills: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def post(self, request):
        """Create a new pending skill"""
        try:
            if not skills_service:
                return JsonResponse({'error': 'Skills service not available'}, status=500)
            
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['skill_name', 'category']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
            
            # Create pending skill
            pending_id = skills_service.create_pending_skill(
                skill_name=data['skill_name'],
                category=data['category'],
                description=data.get('description', ''),
                source_type=data.get('source_type', 'manual'),
                source_data=data.get('source_data'),
                organization=data.get('organization'),
                suggested_competency=data.get('suggested_competency')
            )
            
            if pending_id:
                return JsonResponse({
                    'success': True,
                    'pending_id': pending_id,
                    'message': 'Pending skill created successfully'
                })
            else:
                return JsonResponse({'error': 'Failed to create pending skill'}, status=500)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            logger.error(f"Error creating pending skill: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SkillApprovalView(View):
    """API for approving/rejecting pending skills"""
    
    def post(self, request, pending_id):
        """Approve or reject a pending skill"""
        try:
            if not skills_service:
                return JsonResponse({'error': 'Skills service not available'}, status=500)
            
            data = json.loads(request.body)
            action = data.get('action')  # 'approve' or 'reject'
            reviewer_id = data.get('reviewer_id')
            reason = data.get('reason', '')
            
            if action not in ['approve', 'reject']:
                return JsonResponse({'error': 'Action must be "approve" or "reject"'}, status=400)
            
            if action == 'approve':
                success = skills_service.approve_pending_skill(pending_id, reviewer_id)
                if success:
                    return JsonResponse({
                        'success': True,
                        'message': 'Skill approved and added to taxonomy'
                    })
                else:
                    return JsonResponse({'error': 'Failed to approve skill'}, status=500)
            
            elif action == 'reject':
                # Update pending skill status to rejected
                update_result = skills_service.supabase.table('pending_skills').update({
                    'status': 'rejected',
                    'reviewed_at': datetime.now().isoformat(),
                    'reviewed_by': reviewer_id,
                    'rejection_reason': reason
                }).eq('id', pending_id).execute()
                
                if update_result.data:
                    return JsonResponse({
                        'success': True,
                        'message': 'Skill rejected'
                    })
                else:
                    return JsonResponse({'error': 'Failed to reject skill'}, status=500)
                    
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            logger.error(f"Error processing skill approval: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SkillsTaxonomyView(View):
    """API for managing skills taxonomy"""
    
    def get(self, request):
        """Get skills from taxonomy"""
        try:
            if not skills_service:
                return JsonResponse({'error': 'Skills service not available'}, status=500)
            
            # Get query parameters
            category = request.GET.get('category')
            search = request.GET.get('search')
            limit = int(request.GET.get('limit', 100))
            offset = int(request.GET.get('offset', 0))
            
            # Build query
            query = skills_service.supabase.table('skills_taxonomy').select('*')
            
            if category:
                query = query.eq('category', category)
            if search:
                query = query.or_(f'canonical_name.ilike.%{search}%,description.ilike.%{search}%')
            
            # Only active skills
            query = query.eq('status', 'active')
            
            # Order by usage count and name
            query = query.order('usage_count', desc=True).order('canonical_name', asc=True)
            
            # Apply pagination
            if limit:
                query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            
            skills = result.data if result.data else []
            
            return JsonResponse({
                'success': True,
                'skills': skills,
                'count': len(skills)
            })
            
        except Exception as e:
            logger.error(f"Error fetching skills taxonomy: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def post(self, request):
        """Add skill directly to taxonomy (for admin use)"""
        try:
            if not skills_service:
                return JsonResponse({'error': 'Skills service not available'}, status=500)
            
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['skill_name', 'category']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
            
            # Add skill directly to taxonomy
            skill_id = skills_service.add_skill_to_taxonomy(
                skill_name=data['skill_name'],
                category=data['category'],
                description=data.get('description', ''),
                source_type=data.get('source_type', 'manual'),
                organization=data.get('organization'),
                subcategory=data.get('subcategory')
            )
            
            if skill_id:
                return JsonResponse({
                    'success': True,
                    'skill_id': skill_id,
                    'message': 'Skill added to taxonomy successfully'
                })
            else:
                return JsonResponse({'error': 'Failed to add skill to taxonomy'}, status=500)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            logger.error(f"Error adding skill to taxonomy: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SkillSimilarityView(View):
    """API for finding similar skills"""
    
    def post(self, request):
        """Find similar skills for a given skill name"""
        try:
            if not skills_service:
                return JsonResponse({'error': 'Skills service not available'}, status=500)
            
            data = json.loads(request.body)
            
            skill_name = data.get('skill_name')
            description = data.get('description', '')
            category = data.get('category')
            similarity_threshold = float(data.get('similarity_threshold', 0.8))
            
            if not skill_name:
                return JsonResponse({'error': 'skill_name is required'}, status=400)
            
            # Find similar skills
            similar_skills, should_add_as_new = skills_service.find_similar_skills_for_new_skill(
                skill_name=skill_name,
                description=description,
                category=category,
                similarity_threshold=similarity_threshold
            )
            
            return JsonResponse({
                'success': True,
                'similar_skills': similar_skills,
                'should_add_as_new': should_add_as_new,
                'recommendation': 'add_as_new' if should_add_as_new else 'use_existing' if similar_skills else 'review_required'
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            logger.error(f"Error finding similar skills: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SkillStatsView(View):
    """API for skills taxonomy statistics"""
    
    def get(self, request):
        """Get taxonomy statistics"""
        try:
            if not skills_service:
                return JsonResponse({'error': 'Skills service not available'}, status=500)
            
            # Get taxonomy stats
            taxonomy_stats = skills_service.supabase.table('skills_taxonomy').select('category, count(*)', count='exact').eq('status', 'active').execute()
            
            # Get pending stats
            pending_stats = skills_service.supabase.table('pending_skills').select('status, count(*)', count='exact').execute()
            
            # Get category breakdown
            category_result = skills_service.supabase.rpc('get_skills_by_category_stats').execute()
            
            return JsonResponse({
                'success': True,
                'taxonomy_count': taxonomy_stats.count if taxonomy_stats else 0,
                'pending_count': pending_stats.count if pending_stats else 0,
                'category_breakdown': category_result.data if category_result.data else [],
                'last_updated': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error fetching skill stats: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

# URL patterns helper
@method_decorator(csrf_exempt, name='dispatch')
class AutoLearningView(View):
    """API for auto-learning analysis and taxonomy improvement"""
    
    def get(self, request):
        """Get auto-learning analysis and taxonomy health metrics"""
        try:
            if not AutoLearningEngine:
                return JsonResponse({'error': 'Auto-learning system not available'}, status=500)
            
            # Run comprehensive analysis
            results = run_auto_learning_analysis()
            
            return JsonResponse({
                'success': True,
                'results': results
            })
            
        except Exception as e:
            logger.error(f"Error running auto-learning analysis: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def post(self, request):
        """Execute auto-promotion of skills"""
        try:
            if not AutoLearningEngine:
                return JsonResponse({'error': 'Auto-learning system not available'}, status=500)
            
            data = json.loads(request.body) if request.body else {}
            dry_run = data.get('dry_run', True)  # Default to dry run for safety
            
            # Execute auto-promotion
            results = execute_auto_promotion(dry_run=dry_run)
            
            return JsonResponse({
                'success': True,
                'results': results,
                'message': f"Auto-promotion {'simulated' if dry_run else 'executed'} successfully"
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            logger.error(f"Error executing auto-promotion: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class TaxonomyHealthView(View):
    """API for taxonomy health monitoring"""
    
    def get(self, request):
        """Get detailed taxonomy health metrics"""
        try:
            if not AutoLearningEngine:
                return JsonResponse({'error': 'Auto-learning system not available'}, status=500)
            
            engine = AutoLearningEngine()
            health_metrics = engine.get_taxonomy_health_metrics()
            
            return JsonResponse({
                'success': True,
                'health_metrics': health_metrics
            })
            
        except Exception as e:
            logger.error(f"Error getting taxonomy health metrics: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)

def get_skills_management_urls():
    """Return URL patterns for skills management"""
    from django.urls import path
    
    return [
        path('pending-skills/', PendingSkillsView.as_view(), name='pending_skills'),
        path('pending-skills/<str:pending_id>/approve/', SkillApprovalView.as_view(), name='skill_approval'),
        path('taxonomy/', SkillsTaxonomyView.as_view(), name='skills_taxonomy'),
        path('similarity/', SkillSimilarityView.as_view(), name='skill_similarity'),
        path('stats/', SkillStatsView.as_view(), name='skill_stats'),
        # Auto-learning endpoints
        path('auto-learning/', AutoLearningView.as_view(), name='auto_learning'),
        path('taxonomy/health/', TaxonomyHealthView.as_view(), name='taxonomy_health'),
    ] 
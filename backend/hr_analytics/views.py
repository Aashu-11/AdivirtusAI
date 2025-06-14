"""
HR Analytics API Views - REST endpoints for the HR dashboard
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Optional

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse, StreamingHttpResponse
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from .analytics_engine import HRAnalyticsEngine
from .serializers import (
    HRDashboardDataSerializer,
    EmployeeListSerializer,
    EmployeeDetailSerializer,
    GenerateAnalyticsRequestSerializer,
    GenerateAnalyticsResponseSerializer,
    HRStatusCheckSerializer,
    AnalyticsJobStatusSerializer,
    OrganizationStatsSerializer,
    HRAnalyticsSerializer,
    HRAnalyticsJobSerializer,
    HRAnalyticsConfigSerializer
)
from .models import HRAnalytics, HRAnalyticsJob, HRAnalyticsConfig, HRPersonnel

logger = logging.getLogger(__name__)


# Debug endpoint to check authentication
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_user_info(request):
    """Debug endpoint to check user information"""
    user_info = {
        'user_id': getattr(request.user, 'id', None),
        'username': getattr(request.user, 'username', None),
        'email': getattr(request.user, 'email', None),
        'is_authenticated': request.user.is_authenticated,
        'user_type': type(request.user).__name__,
        'user_attributes': [attr for attr in dir(request.user) if not attr.startswith('_')],
    }
    
    # Check if it's a JWT token
    if hasattr(request.auth, 'payload'):
        user_info['jwt_payload'] = request.auth.payload
    
    return Response(user_info)


class HRPermissionMixin:
    """Mixin to check HR permissions"""
    
    def get_hr_info(self, request) -> tuple:
        """Get HR information from request user"""
        user_email = None
        
        # With SupabaseAuthentication, request.user should have email attribute
        if hasattr(request.user, 'email') and request.user.email:
            user_email = request.user.email
        elif hasattr(request.user, 'username'):
            # Fallback to username (might be email in some cases)
            user_email = request.user.username
        
        if not user_email:
            logger.error(f"No email found for user. User: {request.user}, "
                        f"User type: {type(request.user)}, "
                        f"Has email attr: {hasattr(request.user, 'email')}, "
                        f"Email value: {getattr(request.user, 'email', 'None')}, "
                        f"Username: {getattr(request.user, 'username', 'None')}")
            return False, None, None, "User email not found"
        
        logger.info(f"Checking HR status for email: {user_email}")
        
        # Check with analytics engine
        engine = HRAnalyticsEngine()
        is_hr, org_name, hr_name = engine.is_user_hr(user_email)
        
        if not is_hr:
            logger.warning(f"User {user_email} is not authorized as HR personnel")
            return False, None, None, "User is not authorized as HR personnel"
        
        logger.info(f"HR access granted for {user_email} at {org_name}")
        return True, org_name, hr_name, None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hr_status_check(request):
    """Check if the current user is HR personnel"""
    mixin = HRPermissionMixin()
    is_hr, org_name, hr_name, error = mixin.get_hr_info(request)
    
    response_data = {
        'is_hr': is_hr,
        'organization_name': org_name,
        'hr_name': hr_name,
        'permissions': ['view_analytics', 'view_employees'] if is_hr else []
    }
    
    if error:
        response_data['error'] = error
        return Response(response_data, status=status.HTTP_403_FORBIDDEN)
    
    serializer = HRStatusCheckSerializer(response_data)
    return Response(serializer.data)


class HRDashboardView(APIView, HRPermissionMixin):
    """Main HR Dashboard data endpoint"""
    
    permission_classes = [IsAuthenticated]
    
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def get(self, request):
        """Get comprehensive dashboard data"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Initialize analytics engine
            engine = HRAnalyticsEngine()
            
            # Get latest analytics data
            latest_analytics = engine.get_latest_analytics()
            
            if not latest_analytics:
                return Response({
                    'message': 'No analytics data available. Please generate analytics first.',
                    'organization': org_name,
                    'hr_name': hr_name,
                    'has_data': False
                }, status=status.HTTP_200_OK)
            
            # Format dashboard data
            dashboard_data = {
                'organization': org_name,
                'hr_name': hr_name,
                'last_updated': latest_analytics.get('generated_at'),
                'overview': {
                    'total_employees': latest_analytics.get('employee_count', 0),
                    'overall_competency': float(latest_analytics.get('overall_competency_score', 0) or 0),
                    'technical_coverage': float(latest_analytics.get('overall_technical_coverage', 0) or 0),
                    'soft_skill_coverage': float(latest_analytics.get('overall_soft_skill_coverage', 0) or 0),
                    'domain_coverage': float(latest_analytics.get('overall_domain_coverage', 0) or 0),
                    'sop_coverage': float(latest_analytics.get('overall_sop_coverage', 0) or 0),
                },
                'team_analytics': latest_analytics.get('team_analytics', []),
                'critical_gaps': latest_analytics.get('critical_gaps', {}),
                'skill_breakdown': latest_analytics.get('skill_category_breakdown', {}),
                'employee_summary': latest_analytics.get('employee_summary', []),
                'has_data': True
            }
            
            return Response(dashboard_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching dashboard data: {str(e)}")
            return Response({'error': 'Failed to fetch dashboard data'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmployeeListView(APIView, HRPermissionMixin):
    """Employee list endpoint for HR"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of employees for the organization"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            engine = HRAnalyticsEngine()
            employees = engine.get_employees_by_organization(org_name)
            
            # Format employee data
            employee_list = []
            for emp in employees:
                # Calculate competency and skills for this employee
                skill_matrix = engine.get_employee_skill_matrix(emp['id'])
                avg_competency = 0
                total_skills = 0
                skills_with_gaps = 0
                
                if skill_matrix:
                    avg_competency = engine.calculate_overall_competency_from_matrix(skill_matrix)
                    # Count total skills across all categories
                    for category_key, category_data in skill_matrix.items():
                        if category_key.startswith('_') or category_key.endswith('_context'):
                            continue
                        
                        if isinstance(category_data, dict) and 'skills' in category_data:
                            skills = category_data.get('skills', [])
                            total_skills += len(skills)
                            # Count skills with competency below 60% as gaps
                            skills_with_gaps += len([s for s in skills if s.get('competency', 0) < 60])
                        elif isinstance(category_data, list):
                            total_skills += len(category_data)
                            skills_with_gaps += len([s for s in category_data if s.get('competency', 0) < 60])
                
                employee_list.append({
                    'user_id': emp.get('id'),
                    'email': emp.get('email'),
                    'full_name': emp.get('full_name'),
                    'department': emp.get('department'),
                    'job_title': emp.get('position'),
                    'avg_competency': round(avg_competency, 1),
                    'total_skills': total_skills,
                    'skills_with_gaps': skills_with_gaps,
                    'assessment_status': 'completed' if total_skills > 0 else 'pending',
                    'last_assessment': emp.get('created_at')
                })
            
            serializer = EmployeeListSerializer(employee_list, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching employee list: {str(e)}")
            return Response({'error': 'Failed to fetch employee list'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmployeeDetailView(APIView, HRPermissionMixin):
    """Detailed employee information endpoint"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, employee_id):
        """Get detailed information for a specific employee"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            engine = HRAnalyticsEngine()
            
            # Get employee details from Supabase
            employee_details = engine.supabase.rpc(
                'get_employee_details',
                {'emp_user_id': employee_id, 'org_name': org_name}
            ).execute()
            
            if not employee_details.data:
                return Response({'error': 'Employee not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            data = employee_details.data[0] if isinstance(employee_details.data, list) else employee_details.data
            
            # Format detailed employee data
            detail_data = {
                'basic_info': {
                    'user_id': data.get('user_id'),
                    'email': data.get('email'),
                    'department': data.get('department'),
                    'job_title': data.get('job_title'),
                    'organization': org_name
                },
                'competency_overview': {
                    'overall_competency': float(data.get('avg_competency', 0) or 0),
                    'total_skills': data.get('total_skills', 0),
                    'skills_with_gaps': data.get('skills_with_gaps', 0),
                    'assessment_completion': data.get('assessment_completion_percentage', 0)
                },
                'skill_breakdown': {
                    'technical_skills': data.get('technical_skills', 0),
                    'technical_gaps': data.get('technical_gaps_count', 0),
                    'soft_skills': data.get('soft_skills', 0),
                    'soft_skill_gaps': data.get('soft_skill_gaps_count', 0),
                    'domain_knowledge': data.get('domain_knowledge_skills', 0),
                    'domain_gaps': data.get('domain_gaps_count', 0),
                    'sop_skills': data.get('sop_skills', 0),
                    'sop_gaps': data.get('sop_gaps_count', 0)
                },
                'detailed_analysis': data.get('detailed_skill_analysis', {})
            }
            
            serializer = EmployeeDetailSerializer(detail_data)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching employee details: {str(e)}")
            return Response({'error': 'Failed to fetch employee details'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateAnalyticsView(APIView, HRPermissionMixin):
    """Generate or refresh analytics data"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Generate new analytics data"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = GenerateAnalyticsRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            engine = HRAnalyticsEngine()
            
            # Get Supabase user UUID from authenticated request
            # The SupabaseAuthentication sets request.user.username to the Supabase user UUID
            user_uuid = None
            if hasattr(request.user, 'username') and request.user.username:
                # Validate it's a proper UUID
                try:
                    import uuid
                    uuid.UUID(request.user.username)
                    user_uuid = request.user.username
                    logger.info(f"Using Supabase user UUID from username: {user_uuid}")
                except ValueError:
                    logger.warning(f"User username is not a valid UUID: {request.user.username}")
            
            # Fallback: try to get UUID directly from Supabase auth if needed
            if not user_uuid:
                from assessments.authentication import SupabaseAuthentication
                auth_header = request.META.get('HTTP_AUTHORIZATION', '')
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
                    try:
                        # Get user info from Supabase using the token
                        supabase_client = engine.supabase
                        user_response = supabase_client.auth.get_user(token)
                        if user_response.user:
                            user_uuid = user_response.user.id
                            logger.info(f"Retrieved Supabase user UUID via direct auth: {user_uuid}")
                    except Exception as e:
                        logger.error(f"Failed to get Supabase user UUID: {str(e)}")
            
            if not user_uuid:
                logger.error(f"Could not determine valid UUID for user. Username: {getattr(request.user, 'username', 'None')}")
                return Response({'error': 'Could not identify user for analytics generation'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"Generating analytics for user UUID: {user_uuid}")
            
            # Generate analytics
            success, analytics_id, result = engine.generate_analytics_report(user_uuid)
            
            if success:
                response_data = {
                    'success': True,
                    'message': 'Analytics generated successfully',
                    'analytics_id': analytics_id,
                    'job_id': None,  # Synchronous generation
                    'estimated_completion_time': None
                }
            else:
                response_data = {
                    'success': False,
                    'message': result,  # Error message
                    'analytics_id': None,
                    'job_id': None,
                    'estimated_completion_time': None
                }
            
            response_serializer = GenerateAnalyticsResponseSerializer(response_data)
            return Response(response_serializer.data)
            
        except Exception as e:
            logger.error(f"Error generating analytics: {str(e)}")
            return Response({'error': 'Failed to generate analytics'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrganizationStatsView(APIView, HRPermissionMixin):
    """Organization statistics endpoint"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get organization statistics"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            engine = HRAnalyticsEngine()
            employees = engine.get_employees_by_organization(org_name)
            latest_analytics = engine.get_latest_analytics()
            
            # Get unique departments
            departments = list(set(emp.get('department') for emp in employees if emp.get('department')))
            
            # Count employees with assessments
            employees_with_assessments = sum(1 for emp in employees if emp.get('total_skills', 0) > 0)
            
            stats_data = {
                'organization_name': org_name,
                'total_employees': len(employees),
                'employees_with_assessments': employees_with_assessments,
                'departments': departments,
                'latest_analytics_date': latest_analytics.get('generated_at') if latest_analytics else None,
                'analytics_frequency': 'on-demand'  # Can be configured later
            }
            
            serializer = OrganizationStatsSerializer(stats_data)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching organization stats: {str(e)}")
            return Response({'error': 'Failed to fetch organization statistics'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_refresh_status(request):
    """Check if analytics data needs refresh"""
    mixin = HRPermissionMixin()
    is_hr, org_name, hr_name, error = mixin.get_hr_info(request)
    
    if not is_hr:
        return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        engine = HRAnalyticsEngine()
        latest_analytics = engine.get_latest_analytics()
        
        if not latest_analytics:
            return Response({
                'needs_refresh': True,
                'reason': 'No analytics data exists',
                'last_generated': None,
                'data_age_hours': None
            })
        
        # Calculate data age
        last_generated = latest_analytics.get('generated_at')
        if last_generated:
            if isinstance(last_generated, str):
                from datetime import datetime
                last_generated = datetime.fromisoformat(last_generated.replace('Z', '+00:00'))
            
            data_age = datetime.now(timezone.utc) - last_generated
            data_age_hours = data_age.total_seconds() / 3600
            
            # Consider data stale after 24 hours
            needs_refresh = data_age_hours > 24
            
            return Response({
                'needs_refresh': needs_refresh,
                'reason': 'Data is stale' if needs_refresh else 'Data is current',
                'last_generated': last_generated.isoformat(),
                'data_age_hours': round(data_age_hours, 2)
            })
        
        return Response({
            'needs_refresh': True,
            'reason': 'Invalid generation date',
            'last_generated': None,
            'data_age_hours': None
        })
        
    except Exception as e:
        logger.error(f"Error checking refresh status: {str(e)}")
        return Response({'error': 'Failed to check refresh status'}, 
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Simple test SSE endpoint for debugging
def simple_sse_test(request):
    """Simple SSE endpoint for testing without authentication"""
    def event_stream():
        import time
        import json
        
        # Send initial message
        yield f"data: {json.dumps({'type': 'connected', 'message': 'Simple SSE test working', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
        
        # Send a few test messages
        for i in range(3):
            time.sleep(2)
            data = {
                'type': 'test',
                'count': i + 1,
                'message': f'Test message {i + 1}',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            yield f"data: {json.dumps(data)}\n\n"
        
        # Final message
        yield f"data: {json.dumps({'type': 'complete', 'message': 'Test complete'})}\n\n"
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Credentials'] = 'true'
    
    return response


# Server-Sent Events endpoint for real-time updates
def analytics_live_updates(request):
    """Server-Sent Events endpoint for real-time analytics updates"""
    # Note: We can't use @api_view or permission_classes decorators with StreamingHttpResponse
    # So we'll handle authentication manually
    
    logger.info(f"Live updates request received from {request.META.get('REMOTE_ADDR')}")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request query params: {dict(request.GET)}")
    
    from django.contrib.auth.models import AnonymousUser
    from assessments.authentication import SupabaseAuthentication
    
    try:
        # Manual authentication - try header first, then query parameter
        authenticator = SupabaseAuthentication()
        auth_result = authenticator.authenticate(request)
        
        # If header auth failed, try token from query parameter
        if not auth_result:
            token = request.GET.get('token')
            logger.info(f"Trying query parameter token: {'***' + token[-10:] if token and len(token) > 10 else 'None'}")
            
            if token:
                # Create a mock request with the token in the Authorization header
                from django.http import HttpRequest
                mock_request = HttpRequest()
                mock_request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
                
                auth_result = authenticator.authenticate(mock_request)
                logger.info(f"Query parameter auth result: {auth_result is not None}")
        
        if not auth_result:
            logger.warning("Authentication failed for live updates")
            from django.http import JsonResponse
            return JsonResponse({'error': 'Authentication required'}, status=403)
        
        user, token = auth_result
        request.user = user
        logger.info(f"Authenticated user: {user}")
        
        # Check HR permissions
        mixin = HRPermissionMixin()
        is_hr, org_name, hr_name, error = mixin.get_hr_info(request)
        
        logger.info(f"HR check result: is_hr={is_hr}, org_name={org_name}, error={error}")
        
        if not is_hr:
            logger.warning(f"HR permission denied: {error}")
            from django.http import JsonResponse
            return JsonResponse({'error': error}, status=403)
        
        def event_stream():
            """Generator for Server-Sent Events"""
            import time
            import json
            
            logger.info(f"Starting SSE stream for {org_name}")
            
            try:
                # Send initial connection message
                yield f"data: {json.dumps({'type': 'connected', 'organization': org_name, 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
                
                counter = 0
                while True:
                    counter += 1
                    try:
                        engine = HRAnalyticsEngine()
                        latest_analytics = engine.get_latest_analytics()
                        
                        if latest_analytics:
                            data = {
                                'type': 'update',
                                'counter': counter,
                                'timestamp': datetime.now(timezone.utc).isoformat(),
                                'organization': org_name,
                                'employee_count': latest_analytics.get('employee_count', 0),
                                'overall_competency': float(latest_analytics.get('overall_competency_score', 0) or 0),
                                'last_updated': latest_analytics.get('generated_at')
                            }
                        else:
                            data = {
                                'type': 'no_data',
                                'counter': counter,
                                'timestamp': datetime.now(timezone.utc).isoformat(),
                                'organization': org_name,
                                'message': 'No analytics data available'
                            }
                        
                        yield f"data: {json.dumps(data)}\n\n"
                        logger.debug(f"Sent SSE update #{counter} for {org_name}")
                        
                        time.sleep(30)  # Update every 30 seconds
                        
                    except Exception as e:
                        logger.error(f"Error in live updates stream: {str(e)}")
                        error_data = {
                            'type': 'error',
                            'counter': counter,
                            'error': str(e),
                            'timestamp': datetime.now(timezone.utc).isoformat()
                        }
                        yield f"data: {json.dumps(error_data)}\n\n"
                        time.sleep(30)
                        
            except GeneratorExit:
                # Client disconnected
                logger.info(f"Live updates client disconnected for {org_name}")
            except Exception as e:
                logger.error(f"Fatal error in SSE stream: {str(e)}")
        
        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['Connection'] = 'keep-alive'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Credentials'] = 'true'
        
        logger.info("SSE response created successfully")
        return response
        
    except Exception as e:
        logger.error(f"Exception in analytics_live_updates: {str(e)}")
        from django.http import JsonResponse
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)


# Test endpoint for SSE debugging
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_sse_auth(request):
    """Test endpoint to verify SSE authentication will work"""
    mixin = HRPermissionMixin()
    is_hr, org_name, hr_name, error = mixin.get_hr_info(request)
    
    return Response({
        'is_hr': is_hr,
        'organization': org_name,
        'hr_name': hr_name,
        'error': error,
        'user_id': str(request.user.id) if hasattr(request.user, 'id') else None,
        'user_email': getattr(request.user, 'email', None),
        'message': 'SSE authentication test successful' if is_hr else 'SSE authentication failed'
    })


# Very simple test endpoint
def basic_test(request):
    """Basic test endpoint"""
    from django.http import JsonResponse
    return JsonResponse({'message': 'Basic test working', 'timestamp': datetime.now(timezone.utc).isoformat()})


class DepartmentListView(APIView, HRPermissionMixin):
    """API endpoint to get list of departments for an organization"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get departments for the current user's organization"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get departments using analytics engine
            analytics_engine = HRAnalyticsEngine()
            departments = analytics_engine.get_organization_departments(org_name)
            
            return Response({
                'departments': departments,
                'organization': org_name,
                'total_departments': len(departments)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting departments: {str(e)}")
            return Response(
                {'error': 'Failed to fetch departments'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DepartmentSkillMatrixView(APIView, HRPermissionMixin):
    """API endpoint to get department skill matrix for radar visualization"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get department skill matrix data for radar chart"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            department = request.query_params.get('department')

            # Get department skill matrix using analytics engine
            analytics_engine = HRAnalyticsEngine()
            
            # Get raw skill matrix
            skill_matrix = analytics_engine.calculate_department_skill_matrix(
                org_name, 
                department
            )
            
            # Get radar-formatted data with both current and ideal
            radar_result = analytics_engine.get_department_skill_matrix_for_radar(
                org_name, 
                department
            )
            
            # Get metadata from skill matrix
            metadata = skill_matrix.get('_metadata', {})
            
            # Extract radar data and ideal data from result
            radar_data = radar_result.get('radar_data', [])
            ideal_radar_data = radar_result.get('ideal_radar_data', [])
            radar_metadata = radar_result.get('metadata', {})
            
            response_data = {
                'radar_data': radar_data,
                'ideal_radar_data': ideal_radar_data,
                'skill_matrix': skill_matrix,
                'metadata': {
                    'department': department or 'ALL_DEPARTMENTS',
                    'organization': org_name,
                    'employee_count': metadata.get('employee_count', 0),
                    'employees_with_data': metadata.get('employees_with_data', 0),
                    'generated_at': metadata.get('generated_at'),
                    'total_categories': len(radar_data),
                    'has_ideal_data': radar_metadata.get('has_ideal_data', False),
                    'ideal_skills_count': radar_metadata.get('ideal_skills_count', 0),
                    'current_skills_count': radar_metadata.get('current_skills_count', 0)
                }
            }
            
            if not radar_data:
                return Response({
                    'radar_data': [],
                    'ideal_radar_data': [],
                    'skill_matrix': {},
                    'metadata': response_data['metadata'],
                    'message': 'No skill data found for the selected department'
                }, status=status.HTTP_200_OK)
            
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting department skill matrix: {str(e)}")
            return Response(
                {'error': 'Failed to fetch department skill matrix'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DepartmentAnalyticsView(APIView, HRPermissionMixin):
    """API endpoint to get comprehensive analytics for a specific department"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get detailed analytics for a department"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            department = request.query_params.get('department')
            
            if not department:
                return Response(
                    {'error': 'Department parameter is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            analytics_engine = HRAnalyticsEngine()
            
            # Get department employees
            all_employees = analytics_engine.get_employees_by_organization(org_name)
            dept_employees = [emp for emp in all_employees if emp.get('department') == department]
            
            if not dept_employees:
                return Response({
                    'message': f'No employees found in department: {department}',
                    'department': department,
                    'employee_count': 0,
                    'employees': []
                }, status=status.HTTP_200_OK)
            
            # Calculate department-specific metrics
            dept_metrics = {
                'employee_count': len(dept_employees),
                'employees_with_assessments': 0,
                'overall_competency': 0,
                'technical_coverage': 0,
                'soft_skill_coverage': 0,
                'domain_coverage': 0,
                'sop_coverage': 0
            }
            
            employee_details = []
            competencies = []
            
            for employee in dept_employees:
                skill_matrix = analytics_engine.get_employee_skill_matrix(employee['id'])
                
                emp_detail = {
                    'user_id': employee['id'],
                    'email': employee.get('email', ''),
                    'full_name': employee.get('full_name', ''),
                    'job_title': employee.get('position', ''),
                    'has_assessment': skill_matrix is not None,
                    'competency': 0
                }
                
                if skill_matrix:
                    dept_metrics['employees_with_assessments'] += 1
                    competency = analytics_engine.calculate_overall_competency_from_matrix(skill_matrix)
                    emp_detail['competency'] = competency
                    competencies.append(competency)
                
                employee_details.append(emp_detail)
            
            # Calculate department averages
            if competencies:
                dept_metrics['overall_competency'] = round(sum(competencies) / len(competencies), 2)
            
            return Response({
                'department': department,
                'organization': org_name,
                'metrics': dept_metrics,
                'employees': employee_details,
                'generated_at': datetime.now(timezone.utc).isoformat()
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error getting department analytics: {str(e)}")
            return Response(
                {'error': 'Failed to fetch department analytics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CompetencyDistributionView(APIView, HRPermissionMixin):
    """API endpoint for competency level distribution analytics"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get competency level distribution for the organization"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            engine = HRAnalyticsEngine()
            distribution_data = engine.get_competency_level_distribution(org_name)
            
            return Response(distribution_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching competency distribution: {str(e)}")
            return Response({'error': 'Failed to fetch competency distribution'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SkillMaturityHeatmapView(APIView, HRPermissionMixin):
    """API endpoint for skill maturity heatmap data"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get skill maturity heatmap data for the organization"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            engine = HRAnalyticsEngine()
            heatmap_data = engine.get_skill_maturity_heatmap(org_name)
            
            return Response(heatmap_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching skill maturity heatmap: {str(e)}")
            return Response({'error': 'Failed to fetch skill maturity heatmap'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CriticalSkillGapsView(APIView, HRPermissionMixin):
    """API endpoint for critical skill gap analysis"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get comprehensive skill gap analysis"""
        is_hr, org_name, hr_name, error = self.get_hr_info(request)
        
        if not is_hr:
            return Response({'error': error}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            engine = HRAnalyticsEngine()
            gap_analysis = engine.get_critical_skill_gaps(org_name)
            
            logger.info(f"Gap analysis completed for {org_name}: {gap_analysis.get('total_employees_analyzed', 0)} employees analyzed")
            
            return Response(gap_analysis)
            
        except Exception as e:
            logger.error(f"Error fetching critical skill gaps: {str(e)}")
            return Response({'error': 'Failed to fetch skill gap analysis'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_analytics(request):
    """Generate HR analytics for the organization"""
    try:
        user_email = request.user.email
        if not user_email:
            return Response(
                {'error': 'User email not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is HR
        try:
            hr_person = HRPersonnel.objects.get(email=user_email, is_hr=True)
            organization_name = hr_person.organization_name
        except HRPersonnel.DoesNotExist:
            return Response(
                {'error': 'Access denied. User is not authorized HR personnel.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Create analytics job
        analytics_job = HRAnalyticsJob.objects.create(
            hr_user_id=str(request.user.pk),
            organization_name=organization_name,
            status='pending'
        )

        # TODO: Implement async analytics generation
        # For now, return job ID for tracking
        
        serializer = HRAnalyticsJobSerializer(analytics_job)
        
        return Response({
            'success': True,
            'job': serializer.data,
            'message': 'Analytics generation started'
        }, status=status.HTTP_202_ACCEPTED)

    except Exception as e:
        logger.error(f"Error generating analytics: {str(e)}")
        return Response(
            {'error': 'Failed to start analytics generation'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

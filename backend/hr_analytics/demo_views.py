"""
Demo HR Analytics Views - Works without Supabase for testing
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Optional

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny  # For demo purposes
from django.http import JsonResponse

from .demo_data import DEMO_HR_PERSONNEL, DEMO_EMPLOYEES, generate_demo_analytics
from .serializers import (
    HRDashboardDataSerializer,
    EmployeeListSerializer,
    GenerateAnalyticsResponseSerializer,
    HRStatusCheckSerializer,
)

logger = logging.getLogger(__name__)

# Demo storage for analytics data
DEMO_ANALYTICS_STORAGE = {}

@api_view(['GET'])
@permission_classes([AllowAny])  # For demo - normally would require auth
def demo_hr_status_check(request):
    """Demo HR status check - always returns Aditya as HR"""
    response_data = {
        'is_hr': True,
        'organization_name': 'Adivirtus AI',
        'hr_name': 'Aditya Kamble',
        'permissions': ['view_analytics', 'view_employees']
    }
    
    serializer = HRStatusCheckSerializer(response_data)
    return Response(serializer.data)


class DemoHRDashboardView(APIView):
    """Demo HR Dashboard data endpoint"""
    
    permission_classes = [AllowAny]  # For demo
    
    def get(self, request):
        """Get demo dashboard data"""
        try:
            # Generate or get cached analytics
            if 'adivirtus_ai' not in DEMO_ANALYTICS_STORAGE:
                DEMO_ANALYTICS_STORAGE['adivirtus_ai'] = generate_demo_analytics()
            
            dashboard_data = DEMO_ANALYTICS_STORAGE['adivirtus_ai']
            
            serializer = HRDashboardDataSerializer(dashboard_data)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching demo dashboard data: {str(e)}")
            return Response({'error': 'Failed to fetch dashboard data'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DemoEmployeeListView(APIView):
    """Demo employee list endpoint"""
    
    permission_classes = [AllowAny]  # For demo
    
    def get(self, request):
        """Get demo employee list"""
        try:
            # Format employee data for the frontend
            employee_list = []
            for emp in DEMO_EMPLOYEES:
                employee_list.append({
                    'user_id': emp['user_id'],
                    'email': emp['email'],
                    'department': emp['department'],
                    'job_title': emp['job_title'],
                    'avg_competency': emp['avg_competency'],
                    'total_skills': emp['total_skills'],
                    'skills_with_gaps': emp['skills_with_gaps'],
                    'assessment_status': 'completed',
                    'last_assessment': emp['analysis_completed_at']
                })
            
            serializer = EmployeeListSerializer(employee_list, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching demo employee list: {str(e)}")
            return Response({'error': 'Failed to fetch employee list'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DemoGenerateAnalyticsView(APIView):
    """Demo analytics generation endpoint"""
    
    permission_classes = [AllowAny]  # For demo
    
    def post(self, request):
        """Generate demo analytics data"""
        try:
            # Generate fresh analytics
            analytics_data = generate_demo_analytics()
            DEMO_ANALYTICS_STORAGE['adivirtus_ai'] = analytics_data
            
            response_data = {
                'success': True,
                'message': 'Demo analytics generated successfully',
                'analytics_id': analytics_data['analytics_id'],
                'job_id': None,
                'estimated_completion_time': None
            }
            
            response_serializer = GenerateAnalyticsResponseSerializer(response_data)
            return Response(response_serializer.data)
            
        except Exception as e:
            logger.error(f"Error generating demo analytics: {str(e)}")
            return Response({'error': 'Failed to generate analytics'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # For demo
def demo_analytics_refresh_status(request):
    """Demo refresh status check"""
    try:
        if 'adivirtus_ai' in DEMO_ANALYTICS_STORAGE:
            last_generated = DEMO_ANALYTICS_STORAGE['adivirtus_ai']['generated_at']
            
            # Parse the timestamp
            last_gen_dt = datetime.fromisoformat(last_generated.replace('Z', '+00:00'))
            data_age = datetime.now(timezone.utc) - last_gen_dt
            data_age_hours = data_age.total_seconds() / 3600
            
            return Response({
                'needs_refresh': data_age_hours > 1,  # Demo: refresh every hour
                'reason': 'Demo data is fresh' if data_age_hours <= 1 else 'Demo data needs refresh',
                'last_generated': last_generated,
                'data_age_hours': round(data_age_hours, 2)
            })
        else:
            return Response({
                'needs_refresh': True,
                'reason': 'No demo analytics data exists',
                'last_generated': None,
                'data_age_hours': None
            })
        
    except Exception as e:
        logger.error(f"Error checking demo refresh status: {str(e)}")
        return Response({'error': 'Failed to check refresh status'}, 
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # For demo
def demo_analytics_live_updates(request):
    """Demo live updates endpoint"""
    import json
    import time
    
    def event_stream():
        """Generator for demo live updates"""
        while True:
            try:
                if 'adivirtus_ai' in DEMO_ANALYTICS_STORAGE:
                    analytics = DEMO_ANALYTICS_STORAGE['adivirtus_ai']
                    data = {
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'organization': 'Adivirtus AI',
                        'employee_count': analytics['overview']['total_employees'],
                        'overall_competency': analytics['overview']['overall_competency'],
                        'last_updated': analytics['generated_at']
                    }
                    
                    yield f"data: {json.dumps(data)}\n\n"
                
                time.sleep(30)  # Update every 30 seconds
                
            except Exception as e:
                error_data = {
                    'error': str(e),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                time.sleep(30)
    
    response = JsonResponse({"stream": "demo_live_updates"})
    response['Content-Type'] = 'text/event-stream'
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    
    return response


@api_view(['GET'])
@permission_classes([AllowAny])  # For demo
def demo_organization_stats(request):
    """Demo organization statistics"""
    try:
        departments = list(set(emp['department'] for emp in DEMO_EMPLOYEES))
        employees_with_assessments = len([emp for emp in DEMO_EMPLOYEES if emp['total_skills'] > 0])
        
        latest_analytics_date = None
        if 'adivirtus_ai' in DEMO_ANALYTICS_STORAGE:
            latest_analytics_date = DEMO_ANALYTICS_STORAGE['adivirtus_ai']['generated_at']
        
        stats_data = {
            'organization_name': 'Adivirtus AI',
            'total_employees': len(DEMO_EMPLOYEES),
            'employees_with_assessments': employees_with_assessments,
            'departments': departments,
            'latest_analytics_date': latest_analytics_date,
            'analytics_frequency': 'on-demand'
        }
        
        return Response(stats_data)
        
    except Exception as e:
        logger.error(f"Error fetching demo organization stats: {str(e)}")
        return Response({'error': 'Failed to fetch organization statistics'}, 
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # For demo
def demo_employee_detail(request, employee_id):
    """Demo employee detail endpoint"""
    try:
        # Find employee by ID
        employee = None
        for emp in DEMO_EMPLOYEES:
            if emp['user_id'] == employee_id:
                employee = emp
                break
        
        if not employee:
            return Response({'error': 'Employee not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Format detailed employee data
        detail_data = {
            'basic_info': {
                'user_id': employee['user_id'],
                'email': employee['email'],
                'department': employee['department'],
                'job_title': employee['job_title'],
                'organization': 'Adivirtus AI'
            },
            'competency_overview': {
                'overall_competency': employee['avg_competency'],
                'total_skills': employee['total_skills'],
                'skills_with_gaps': employee['skills_with_gaps'],
                'assessment_completion': 100  # Demo: assume complete
            },
            'skill_breakdown': {
                'technical_skills': employee['technical_skills'],
                'technical_gaps': employee['technical_gaps_count'],
                'soft_skills': employee['soft_skills'],
                'soft_skill_gaps': employee['soft_skill_gaps_count'],
                'domain_knowledge': employee['domain_knowledge_skills'],
                'domain_gaps': employee['domain_gaps_count'],
                'sop_skills': employee['sop_skills'],
                'sop_gaps': employee['sop_gaps_count']
            },
            'detailed_analysis': {
                'strengths': ['Problem solving', 'Team collaboration'],
                'improvement_areas': ['Time management', 'Technical documentation'],
                'recommendations': ['Complete advanced React course', 'Practice code reviews']
            }
        }
        
        return Response(detail_data)
        
    except Exception as e:
        logger.error(f"Error fetching demo employee details: {str(e)}")
        return Response({'error': 'Failed to fetch employee details'}, 
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR) 
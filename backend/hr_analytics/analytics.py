"""
HR Analytics Engine - Core logic for processing employee skill data and generating analytics
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from decimal import Decimal

from django.conf import settings
from supabase import create_client, Client
import os

logger = logging.getLogger(__name__)


class HRAnalyticsEngine:
    """Core analytics engine for processing HR skill data"""
    
    def __init__(self, organization_name: str):
        self.organization_name = organization_name
        self.supabase = self._get_supabase_client()
        
    def _get_supabase_client(self) -> Client:
        """Initialize Supabase client"""
        url = os.environ.get('SUPABASE_URL')
        key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_SERVICE_KEY')
        
        if not url or not key:
            raise ValueError("Supabase credentials not found in environment variables")
            
        return create_client(url, key)
    
    def get_organization_employees(self) -> List[Dict]:
        """Get all employees for the organization with their skill data"""
        try:
            response = self.supabase.rpc(
                'get_organization_employees',
                {'org_name': self.organization_name}
            ).execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error fetching organization employees: {str(e)}")
            return []
    
    def get_employee_analytics_base(self) -> List[Dict]:
        """Get detailed employee analytics data using secure function"""
        try:
            # Use the new secure function instead of direct table access
            response = self.supabase.rpc(
                'get_hr_employee_analytics_base',
                {'org_name': self.organization_name}
            ).execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error fetching employee analytics base: {str(e)}")
            return []
    
    def calculate_overall_metrics(self, employees_data: List[Dict]) -> Dict:
        """Calculate organization-wide competency metrics"""
        if not employees_data:
            return {
                'total_employees': 0,
                'avg_competency': 0,
                'total_skills_assessed': 0,
                'total_gaps': 0,
                'critical_employees': 0,
                'high_performers': 0
            }
        
        total_employees = len(employees_data)
        competencies = [float(emp.get('avg_competency', 0) or 0) for emp in employees_data]
        avg_competency = sum(competencies) / total_employees if competencies else 0
        
        total_skills = sum(int(emp.get('total_skills', 0) or 0) for emp in employees_data)
        total_gaps = sum(int(emp.get('skills_with_gaps', 0) or 0) for emp in employees_data)
        
        critical_employees = sum(1 for comp in competencies if comp < 60)
        high_performers = sum(1 for comp in competencies if comp >= 85)
        
        return {
            'total_employees': total_employees,
            'avg_competency': round(avg_competency, 2),
            'total_skills_assessed': total_skills,
            'total_gaps': total_gaps,
            'critical_employees': critical_employees,
            'high_performers': high_performers
        }
    
    def calculate_coverage_metrics(self, employees_data: List[Dict]) -> Dict:
        """Calculate skill category coverage percentages"""
        if not employees_data:
            return {
                'technical_coverage': 0,
                'soft_skill_coverage': 0,
                'domain_coverage': 0,
                'sop_coverage': 0
            }
        
        def safe_coverage(skills, gaps):
            if not skills or skills == 0:
                return 0
            return max(0, ((skills - gaps) / skills) * 100)
        
        coverages = {
            'technical': [],
            'soft_skill': [],
            'domain': [],
            'sop': []
        }
        
        for emp in employees_data:
            tech_skills = int(emp.get('technical_skills', 0) or 0)
            tech_gaps = int(emp.get('technical_gaps_count', 0) or 0)
            coverages['technical'].append(safe_coverage(tech_skills, tech_gaps))
            
            soft_skills = int(emp.get('soft_skills', 0) or 0)
            soft_gaps = int(emp.get('soft_skill_gaps_count', 0) or 0)
            coverages['soft_skill'].append(safe_coverage(soft_skills, soft_gaps))
            
            domain_skills = int(emp.get('domain_knowledge_skills', 0) or 0)
            domain_gaps = int(emp.get('domain_gaps_count', 0) or 0)
            coverages['domain'].append(safe_coverage(domain_skills, domain_gaps))
            
            sop_skills = int(emp.get('sop_skills', 0) or 0)
            sop_gaps = int(emp.get('sop_gaps_count', 0) or 0)
            coverages['sop'].append(safe_coverage(sop_skills, sop_gaps))
        
        return {
            'technical_coverage': round(sum(coverages['technical']) / len(coverages['technical']), 2),
            'soft_skill_coverage': round(sum(coverages['soft_skill']) / len(coverages['soft_skill']), 2),
            'domain_coverage': round(sum(coverages['domain']) / len(coverages['domain']), 2),
            'sop_coverage': round(sum(coverages['sop']) / len(coverages['sop']), 2)
        }
    
    def analyze_team_breakdown(self, employees_data: List[Dict]) -> List[Dict]:
        """Generate team-wise analytics breakdown"""
        teams = {}
        
        for emp in employees_data:
            department = emp.get('department') or 'Unassigned'
            
            if department not in teams:
                teams[department] = []
            teams[department].append(emp)
        
        team_analytics = []
        
        for team_name, team_employees in teams.items():
            team_metrics = self.calculate_overall_metrics(team_employees)
            team_coverage = self.calculate_coverage_metrics(team_employees)
            
            team_analytics.append({
                'team_name': team_name,
                'employee_count': team_metrics['total_employees'],
                'avg_competency': team_metrics['avg_competency'],
                'total_gaps': team_metrics['total_gaps'],
                'critical_gaps': team_metrics['critical_employees'],
                'technical_coverage': team_coverage['technical_coverage'],
                'soft_skill_coverage': team_coverage['soft_skill_coverage'],
                'domain_coverage': team_coverage['domain_coverage'],
                'sop_coverage': team_coverage['sop_coverage']
            })
        
        return team_analytics
    
    def identify_critical_gaps(self, employees_data: List[Dict]) -> Dict:
        """Identify employees with critical skill gaps"""
        critical_technical = []
        critical_soft_skills = []
        critical_domain = []
        critical_sop = []
        
        for emp in employees_data:
            avg_competency = float(emp.get('avg_competency', 0) or 0)
            
            # Only consider employees with competency < 60 as critical
            if avg_competency < 60:
                employee_info = {
                    'user_id': emp.get('user_id'),
                    'employee_name': emp.get('email'),
                    'department': emp.get('department'),
                    'job_title': emp.get('job_title'),
                    'competency': avg_competency
                }
                
                tech_gaps = int(emp.get('technical_gaps_count', 0) or 0)
                if tech_gaps > 0:
                    employee_info['gaps_count'] = tech_gaps
                    critical_technical.append(employee_info)
                
                soft_gaps = int(emp.get('soft_skill_gaps_count', 0) or 0)
                if soft_gaps > 0:
                    employee_info['gaps_count'] = soft_gaps
                    critical_soft_skills.append(employee_info)
                
                domain_gaps = int(emp.get('domain_gaps_count', 0) or 0)
                if domain_gaps > 0:
                    employee_info['gaps_count'] = domain_gaps
                    critical_domain.append(employee_info)
                
                sop_gaps = int(emp.get('sop_gaps_count', 0) or 0)
                if sop_gaps > 0:
                    employee_info['gaps_count'] = sop_gaps
                    critical_sop.append(employee_info)
        
        return {
            'technical_critical': critical_technical,
            'soft_skills_critical': critical_soft_skills,
            'domain_critical': critical_domain,
            'sop_critical': critical_sop
        }
    
    def create_employee_summary(self, employees_data: List[Dict]) -> List[Dict]:
        """Create detailed employee summary data"""
        summary = []
        
        for emp in employees_data:
            summary.append({
                'user_id': emp.get('user_id'),
                'email': emp.get('email'),
                'department': emp.get('department'),
                'job_title': emp.get('job_title'),
                'avg_competency': float(emp.get('avg_competency', 0) or 0),
                'total_skills': int(emp.get('total_skills', 0) or 0),
                'skills_with_gaps': int(emp.get('skills_with_gaps', 0) or 0),
                'technical_gaps': int(emp.get('technical_gaps_count', 0) or 0),
                'soft_skill_gaps': int(emp.get('soft_skill_gaps_count', 0) or 0),
                'domain_gaps': int(emp.get('domain_gaps_count', 0) or 0),
                'sop_gaps': int(emp.get('sop_gaps_count', 0) or 0),
                'assessment_date': emp.get('analysis_completed_at')
            })
        
        return sorted(summary, key=lambda x: x['avg_competency'], reverse=True)
    
    def generate_analytics_report(self, hr_user_id: str) -> Tuple[bool, Optional[str], Optional[Dict]]:
        """
        Generate comprehensive analytics report for the organization
        Returns: (success, analytics_id, error_message)
        """
        try:
            # Get employee data
            employees_data = self.get_employee_analytics_base()
            
            if not employees_data:
                return False, None, "No employee data found for organization"
            
            # Calculate metrics
            overall_metrics = self.calculate_overall_metrics(employees_data)
            coverage_metrics = self.calculate_coverage_metrics(employees_data)
            team_analytics = self.analyze_team_breakdown(employees_data)
            critical_gaps = self.identify_critical_gaps(employees_data)
            employee_summary = self.create_employee_summary(employees_data)
            
            # Call Supabase function to generate analytics
            response = self.supabase.rpc(
                'generate_hr_analytics',
                {
                    'org_name': self.organization_name,
                    'hr_user_uuid': hr_user_id
                }
            ).execute()
            
            if response.data:
                analytics_id = response.data
                
                # Return the analytics data for immediate use
                analytics_data = {
                    'analytics_id': analytics_id,
                    'organization': self.organization_name,
                    'employee_count': overall_metrics['total_employees'],
                    'overall_metrics': overall_metrics,
                    'coverage_metrics': coverage_metrics,
                    'team_analytics': team_analytics,
                    'critical_gaps': critical_gaps,
                    'employee_summary': employee_summary,
                    'generated_at': datetime.now(timezone.utc).isoformat()
                }
                
                return True, analytics_id, analytics_data
            else:
                return False, None, "Failed to generate analytics in database"
                
        except Exception as e:
            logger.error(f"Error generating analytics report: {str(e)}")
            return False, None, str(e)
    
    def get_latest_analytics(self) -> Optional[Dict]:
        """Get the latest analytics data for the organization"""
        try:
            response = self.supabase.table('hr_analytics')\
                .select('*')\
                .eq('organization_name', self.organization_name)\
                .order('generated_at', desc=True)\
                .limit(1)\
                .execute()
            
            if response.data:
                return response.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error fetching latest analytics: {str(e)}")
            return None
    
    def is_user_hr(self, user_email: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Check if user is HR personnel for this organization
        Returns: (is_hr, organization_name, hr_name)
        """
        try:
            response = self.supabase.rpc(
                'is_user_hr',
                {'user_email': user_email}
            ).execute()
            
            if response.data:
                data = response.data[0] if isinstance(response.data, list) else response.data
                return data.get('is_hr', False), data.get('organization_name'), data.get('hr_name')
            
            return False, None, None
            
        except Exception as e:
            logger.error(f"Error checking HR status: {str(e)}")
            return False, None, None 
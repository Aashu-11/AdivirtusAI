import logging
import json
import os
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from collections import defaultdict
from supabase import create_client, Client
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Load Supabase credentials from environment variables
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

class HRAnalyticsEngine:
    def __init__(self):
        """Initialize HR Analytics Engine with Supabase connection"""
        try:
            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
            
            if not supabase_url or not supabase_key:
                raise ValueError("Missing Supabase configuration")
            
            self.supabase = create_client(supabase_url, supabase_key)
            logger.info("HRAnalyticsEngine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize HRAnalyticsEngine: {str(e)}")
            raise

    def get_employees_by_organization(self, organization_name: str) -> List[Dict[str, Any]]:
        """Get all employees for a specific organization from user_data table"""
        try:
            logger.info(f"Fetching employees for organization: {organization_name}")
            
            # Query user_data table for employees in the organization
            result = self.supabase.table('user_data').select('*').eq('company', organization_name).execute()
            
            if not result.data:
                logger.warning(f"No employees found for organization: {organization_name}")
                return []
            
            employees = []
            for user in result.data:
                # Get email from auth.users if not in user_data
                email = user.get('email')
                full_name = user.get('full_name')
                
                # If email or name is missing, try to get from auth system
                if not email or not full_name:
                    try:
                        auth_user = self.supabase.auth.admin.get_user_by_id(user.get('id'))
                        if auth_user.user:
                            if not email:
                                email = auth_user.user.email
                            if not full_name:
                                # Try to get name from raw_user_meta_data
                                if hasattr(auth_user.user, 'raw_user_meta_data') and auth_user.user.raw_user_meta_data:
                                    full_name = auth_user.user.raw_user_meta_data.get('name')
                                
                                # Fallback: try user_metadata
                                if not full_name and hasattr(auth_user.user, 'user_metadata') and auth_user.user.user_metadata:
                                    full_name = auth_user.user.user_metadata.get('name')
                                
                                # Last resort: Create a display name from email
                                if not full_name and email:
                                    username = email.split('@')[0]
                                    full_name = username.replace('.', ' ').replace('_', ' ').title()
                    except Exception as e:
                        logger.debug(f"Could not fetch auth info for user {user.get('id')}: {str(e)}")
                
                employee = {
                    'id': user.get('id'),
                    'email': email,
                    'full_name': full_name or 'Unknown User',
                    'department': user.get('department'),
                    'position': user.get('job_title'),
                    'company': user.get('company'),
                    'created_at': user.get('created_at')
                }
                employees.append(employee)
            
            logger.info(f"Found {len(employees)} employees for organization: {organization_name}")
            return employees
            
        except Exception as e:
            logger.error(f"Error fetching employees by organization: {str(e)}")
            return []

    def get_employee_skill_matrix(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get skill matrix for a specific employee from baseline_skill_matrix table"""
        try:
            # Query baseline_skill_matrix table for completed skill matrices
            result = self.supabase.table('baseline_skill_matrix').select('*').eq('user_id', user_id).eq('status', 'completed').execute()
            
            if not result.data:
                logger.debug(f"No completed skill matrix found for user: {user_id}")
                return None
            
            # Get the most recent skill matrix
            skill_matrices = sorted(result.data, key=lambda x: x.get('created_at', ''), reverse=True)
            latest_matrix = skill_matrices[0]
            
            skill_matrix = latest_matrix.get('skill_matrix', {})
            
            if not skill_matrix:
                logger.debug(f"Empty skill matrix for user: {user_id}")
                return None
            
            return skill_matrix
            
        except Exception as e:
            logger.error(f"Error fetching employee skill matrix: {str(e)}")
            return None

    def calculate_overall_competency_from_matrix(self, skill_matrix: Dict[str, Any]) -> float:
        """Calculate overall competency score from skill matrix"""
        try:
            if not skill_matrix:
                return 0.0
            
            total_competency = 0
            skill_count = 0
            
            for category_key, category_data in skill_matrix.items():
                # Skip metadata entries
                if category_key.startswith('_') or category_key.endswith('_context'):
                    continue
                
                if isinstance(category_data, dict):
                    # Handle standard {"skills": [...]} structure
                    if 'skills' in category_data:
                        skills = category_data.get('skills', [])
                        for skill in skills:
                            if isinstance(skill, dict) and 'competency' in skill:
                                competency = skill.get('competency', 0)
                                if isinstance(competency, (int, float)):
                                    total_competency += competency
                                    skill_count += 1
                    
                elif isinstance(category_data, list):
                    # Handle array-based structure
                    for skill in category_data:
                        if isinstance(skill, dict) and 'competency' in skill:
                            competency = skill.get('competency', 0)
                            if isinstance(competency, (int, float)):
                                total_competency += competency
                                skill_count += 1
            
            if skill_count == 0:
                return 0.0
            
            overall_competency = total_competency / skill_count
            return round(overall_competency, 2)
            
        except Exception as e:
            logger.error(f"Error calculating competency from matrix: {str(e)}")
            return 0.0

    def get_organization_departments(self, organization_name: str) -> List[Dict[str, Any]]:
        """Get list of departments for an organization with employee counts and competency data"""
        employees = self.get_employees_by_organization(organization_name)
        department_stats = defaultdict(lambda: {
            'department': '',
            'employee_count': 0,
            'employees_with_data': 0,
            'total_competency': 0,
            'avg_competency': 0,
            'has_skill_data': False
        })
        
        for employee in employees:
            dept = employee.get('department') or 'Unassigned'
            department_stats[dept]['department'] = dept
            department_stats[dept]['employee_count'] += 1
            
            # Check if employee has skill matrix data
            skill_matrix = self.get_employee_skill_matrix(employee['id'])
            if skill_matrix:
                competency = self.calculate_overall_competency_from_matrix(skill_matrix)
                department_stats[dept]['employees_with_data'] += 1
                department_stats[dept]['total_competency'] += competency
                department_stats[dept]['has_skill_data'] = True
        
        # Calculate averages
        for dept_data in department_stats.values():
            if dept_data['employees_with_data'] > 0:
                dept_data['avg_competency'] = round(
                    dept_data['total_competency'] / dept_data['employees_with_data'], 2
                )
        
        # Convert to list and sort by employee count
        departments = list(department_stats.values())
        departments.sort(key=lambda x: x['employee_count'], reverse=True)
        
        logger.info(f"Found {len(departments)} departments for organization: {organization_name}")
        return departments

    def calculate_department_skill_matrix(self, organization_name: str, department: str = None) -> Dict[str, Any]:
        """
        Calculate aggregated skill matrix for a department or entire organization
        
        Args:
            organization_name: Name of the organization
            department: Specific department name (if None, calculates for all departments)
            
        Returns:
            Aggregated skill matrix with department averages
        """
        try:
            # Get employees for the organization/department
            employees = self.get_employees_by_organization(organization_name)
            
            if department:
                employees = [emp for emp in employees if emp.get('department') == department]
            
            if not employees:
                logger.warning(f"No employees found for organization: {organization_name}, department: {department}")
                return {}
            
            logger.info(f"Processing {len(employees)} employees for department skill matrix")
            
            # Collect all skill matrices
            skill_matrices = []
            for employee in employees:
                skill_matrix = self.get_employee_skill_matrix(employee['id'])
                if skill_matrix:
                    skill_matrices.append(skill_matrix)
            
            if not skill_matrices:
                logger.warning(f"No skill matrices found for department: {department}")
                return {}
            
            # Aggregate skill matrices
            aggregated_matrix = self._aggregate_skill_matrices(skill_matrices)
            
            # Add metadata
            aggregated_matrix['_metadata'] = {
                'department': department or 'ALL_DEPARTMENTS',
                'organization': organization_name,
                'employee_count': len(employees),
                'employees_with_data': len(skill_matrices),
                'aggregation_type': 'department_average',
                'generated_at': datetime.now(timezone.utc).timestamp(),
                'data_source': 'baseline_skill_matrix'
            }
            
            logger.info(f"Department skill matrix calculation completed for {len(skill_matrices)} employees")
            return aggregated_matrix
            
        except Exception as e:
            logger.error(f"Error calculating department skill matrix: {str(e)}")
            return {}

    def _aggregate_skill_matrices(self, skill_matrices: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate multiple skill matrices into a single averaged matrix
        
        Args:
            skill_matrices: List of individual skill matrices
            
        Returns:
            Aggregated skill matrix with averaged competency scores
        """
        if not skill_matrices:
            return {}
        
        # Initialize skill aggregation storage
        skill_aggregation = defaultdict(lambda: defaultdict(list))
        aggregated_matrix = {}
        
        # Process each skill matrix
        for matrix in skill_matrices:
            for category_key, category_data in matrix.items():
                # Skip metadata entries
                if category_key.endswith('_context') or category_key == '_metadata':
                    aggregated_matrix[category_key] = category_data
                    continue
                
                # Handle standard structure: {"category": {"skills": [...]}}
                if isinstance(category_data, dict) and 'skills' in category_data:
                    skills = category_data.get('skills', [])
                    for skill in skills:
                        if isinstance(skill, dict) and ('name' in skill or 'skill_name' in skill):
                            skill_name = skill.get('name') or skill.get('skill_name')
                            competency = skill.get('competency', 0)
                            if isinstance(competency, (int, float)):
                                skill_aggregation[category_key][skill_name].append({
                                    'competency': competency,
                                    'full_skill_data': skill
                                })
                
                # Handle array-based categories (like SOPs)
                elif isinstance(category_data, list):
                    for skill in category_data:
                        if isinstance(skill, dict) and ('name' in skill or 'skill_name' in skill):
                            skill_name = skill.get('name') or skill.get('skill_name')
                            competency = skill.get('competency', 0)
                            if isinstance(competency, (int, float)):
                                # Normalize SOP categories to standard structure
                                normalized_key = 'standard_operating_procedures' if 'sop' in category_key.lower() else category_key
                                skill_aggregation[normalized_key][skill_name].append({
                                    'competency': competency,
                                    'full_skill_data': skill
                                })
        
        # Calculate averages for each skill
        for category_key, skills_data in skill_aggregation.items():
            category_skills = []
            
            for skill_name, skill_entries in skills_data.items():
                if not skill_entries:
                    continue
                
                # Calculate average competency
                competencies = [entry['competency'] for entry in skill_entries]
                avg_competency = sum(competencies) / len(competencies)
                
                # Determine competency level
                competency_level = (
                    4 if avg_competency >= 80 else
                    3 if avg_competency >= 60 else
                    2 if avg_competency >= 40 else
                    1 if avg_competency >= 20 else
                    0
                )
                
                # Use the most recent skill data as template
                template_skill = skill_entries[-1]['full_skill_data'].copy()
                template_skill.update({
                    'competency': round(avg_competency, 1),
                    'competency_level': competency_level,
                    'employee_count': len(skill_entries),
                    'department_average': True
                })
                
                category_skills.append(template_skill)
            
            # Add to aggregated matrix with standard structure
            if category_skills:
                aggregated_matrix[category_key] = {'skills': category_skills}
        
        return aggregated_matrix

    def get_department_skill_matrix_for_radar(self, organization_name: str, department: str = None) -> Dict[str, Any]:
        """
        Get department skill matrix formatted for radar chart visualization with both current and ideal data
        
        Args:
            organization_name: Name of the organization
            department: Specific department name
            
        Returns:
            Dict containing current radar data, ideal radar data, and metadata
        """
        # Get current skill matrix
        current_skill_matrix = self.calculate_department_skill_matrix(organization_name, department)
        
        # Get ideal skill matrix aggregation
        ideal_skill_matrix = self.calculate_department_ideal_skill_matrix(organization_name, department)
        
        if not current_skill_matrix:
            return {
                'radar_data': [],
                'ideal_radar_data': [],
                'metadata': {
                    'has_ideal_data': False,
                    'ideal_skills_count': 0
                }
            }
        
        radar_data = []
        ideal_radar_data = []
        
        # Process current skill matrix
        for category_key, category_data in current_skill_matrix.items():
            # Skip metadata and context entries
            if category_key.endswith('_context') or category_key == '_metadata':
                continue
            
            if isinstance(category_data, dict) and 'skills' in category_data:
                skills = category_data.get('skills', [])
                
                if skills:
                    # Calculate current category average
                    competencies = [
                        skill.get('competency', 0) for skill in skills 
                        if isinstance(skill.get('competency'), (int, float))
                    ]
                    
                    if competencies:
                        current_avg = sum(competencies) / len(competencies)
                        
                        # Get ideal average for this category
                        ideal_avg = self._get_ideal_category_average(ideal_skill_matrix, category_key)
                        
                        # Calculate gap percentage
                        gap_percentage = max(0, ideal_avg - current_avg) if ideal_avg > 0 else 0
                        
                        # Create radar data point with both current and ideal
                        radar_point = {
                            'subject': self._format_category_name(category_key),
                            'current_value': round(current_avg, 1),
                            'ideal_value': round(ideal_avg, 1),
                            'value': round(current_avg, 1),  # Keep for backward compatibility
                            'gap_percentage': round(gap_percentage, 1),
                            'totalSkills': len(skills),
                            'averageLevel': round(current_avg, 1),
                            'skillCount': len(competencies),
                            'category': category_key,
                            'department': department or 'ALL_DEPARTMENTS'
                        }
                        
                        radar_data.append(radar_point)
        
                        # Create ideal radar data point
                        ideal_point = {
                            'subject': self._format_category_name(category_key),
                            'value': round(ideal_avg, 1),
                            'category': category_key,
                            'department': department or 'ALL_DEPARTMENTS',
                            'is_ideal': True
                        }
                        
                        ideal_radar_data.append(ideal_point)
        
        # Sort by current competency score (highest first)
        radar_data.sort(key=lambda x: x['current_value'], reverse=True)
        ideal_radar_data.sort(key=lambda x: x['value'], reverse=True)
        
        logger.info(f"Generated radar data with {len(radar_data)} categories for department: {department}")
        logger.info(f"Generated ideal radar data with {len(ideal_radar_data)} categories")
        
        return {
            'radar_data': radar_data,
            'ideal_radar_data': ideal_radar_data,
            'metadata': {
                'has_ideal_data': len(ideal_radar_data) > 0,
                'ideal_skills_count': len(ideal_radar_data),
                'current_skills_count': len(radar_data)
            }
        }

    def calculate_department_ideal_skill_matrix(self, organization_name: str, department: str = None) -> Dict[str, Any]:
        """
        Calculate aggregated ideal skill matrix for a department or entire organization
        
        Args:
            organization_name: Name of the organization
            department: Specific department name
            
        Returns:
            Aggregated ideal skill matrix with department averages
        """
        try:
            # Get employees for the organization/department
            employees = self.get_employees_by_organization(organization_name)
            
            if department:
                employees = [emp for emp in employees if emp.get('department') == department]
            
            if not employees:
                logger.warning(f"No employees found for ideal matrix calculation: {organization_name}, department: {department}")
                return {}
            
            logger.info(f"Processing {len(employees)} employees for ideal skill matrix calculation")
            
            # Collect all ideal skill matrices
            ideal_skill_matrices = []
            for employee in employees:
                ideal_matrix = self.get_employee_ideal_skill_matrix(employee['id'])
                if ideal_matrix:
                    ideal_skill_matrices.append(ideal_matrix)
            
            if not ideal_skill_matrices:
                logger.warning(f"No ideal skill matrices found for department: {department}")
                return {}
            
            # Aggregate ideal skill matrices
            aggregated_ideal_matrix = self._aggregate_ideal_skill_matrices(ideal_skill_matrices)
            
            logger.info(f"Ideal skill matrix calculation completed for {len(ideal_skill_matrices)} employees")
            return aggregated_ideal_matrix
            
        except Exception as e:
            logger.error(f"Error calculating department ideal skill matrix: {str(e)}")
            return {}

    def get_employee_ideal_skill_matrix(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the ideal skill matrix for a specific employee based on their baseline skill matrix
        
        Args:
            user_id: The employee's user ID
            
        Returns:
            Ideal skill matrix or None if not found
        """
        try:
            # Get the baseline skill matrix for the user
            baseline_response = self.supabase.table('baseline_skill_matrix')\
                .select('ideal_skill_matrix_id')\
                .eq('user_id', user_id)\
                .eq('status', 'completed')\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()
            
            if not baseline_response.data:
                logger.debug(f"No completed baseline found for user: {user_id}")
                return None
            
            ideal_matrix_id = baseline_response.data[0]['ideal_skill_matrix_id']
            
            if not ideal_matrix_id:
                logger.debug(f"No ideal skill matrix ID found for user: {user_id}")
                return None
            
            # Get the ideal skill matrix
            ideal_response = self.supabase.table('ideal_skill_matrix')\
                .select('skill_matrix')\
                .eq('id', ideal_matrix_id)\
                .single()\
                .execute()
            
            if ideal_response.data and ideal_response.data.get('skill_matrix'):
                return ideal_response.data['skill_matrix']
                
            return None
            
        except Exception as e:
            logger.error(f"Error getting ideal skill matrix for user {user_id}: {str(e)}")
            return None

    def _aggregate_ideal_skill_matrices(self, ideal_skill_matrices: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate multiple ideal skill matrices into a single averaged matrix
        
        Args:
            ideal_skill_matrices: List of individual ideal skill matrices
            
        Returns:
            Aggregated ideal skill matrix with averaged competency levels
        """
        if not ideal_skill_matrices:
            return {}
        
        # Initialize skill aggregation storage
        skill_aggregation = defaultdict(lambda: defaultdict(list))
        aggregated_matrix = {}
        
        # Process each ideal skill matrix
        for matrix in ideal_skill_matrices:
            for category_key, category_data in matrix.items():
                # Skip metadata entries
                if category_key.endswith('_context') or category_key == '_metadata':
                    aggregated_matrix[category_key] = category_data
                    continue
                
                # Handle standard structure: {"category": {"skills": [...]}}
                if isinstance(category_data, dict) and 'skills' in category_data:
                    skills = category_data.get('skills', [])
                    for skill in skills:
                        if isinstance(skill, dict) and ('name' in skill or 'skill_name' in skill):
                            skill_name = skill.get('name') or skill.get('skill_name')
                            # Use competency_level for ideal, falling back to competency
                            competency_level = skill.get('competency_level', skill.get('competency', 0))
                            if isinstance(competency_level, (int, float)):
                                skill_aggregation[category_key][skill_name].append({
                                    'competency_level': competency_level,
                                    'full_skill_data': skill
                                })
                
                # Handle array-based categories
                elif isinstance(category_data, list):
                    for skill in category_data:
                        if isinstance(skill, dict) and ('name' in skill or 'skill_name' in skill):
                            skill_name = skill.get('name') or skill.get('skill_name')
                            competency_level = skill.get('competency_level', skill.get('competency', 0))
                            if isinstance(competency_level, (int, float)):
                                skill_aggregation[category_key][skill_name].append({
                                    'competency_level': competency_level,
                                    'full_skill_data': skill
                                })
        
        # Calculate averages for each skill
        for category_key, skills_data in skill_aggregation.items():
            category_skills = []
            
            for skill_name, skill_entries in skills_data.items():
                if not skill_entries:
                    continue
                
                # Calculate average ideal competency level
                competency_levels = [entry['competency_level'] for entry in skill_entries]
                avg_competency_level = sum(competency_levels) / len(competency_levels)
                
                # Use the most recent skill data as template
                template_skill = skill_entries[-1]['full_skill_data'].copy()
                template_skill.update({
                    'competency_level': round(avg_competency_level, 1),
                    'competency': round(avg_competency_level, 1),  # For compatibility
                    'employee_count': len(skill_entries),
                    'is_ideal': True
                })
                
                category_skills.append(template_skill)
            
            # Add to aggregated matrix with standard structure
            if category_skills:
                aggregated_matrix[category_key] = {'skills': category_skills}
        
        return aggregated_matrix

    def _get_ideal_category_average(self, ideal_skill_matrix: Dict[str, Any], category_key: str) -> float:
        """
        Get the average ideal competency level for a specific category
        
        Args:
            ideal_skill_matrix: The aggregated ideal skill matrix
            category_key: The category to get average for
            
        Returns:
            Average ideal competency level for the category
        """
        if not ideal_skill_matrix or category_key not in ideal_skill_matrix:
            return 70.0  # Default ideal level if no data available
        
        category_data = ideal_skill_matrix[category_key]
        
        if isinstance(category_data, dict) and 'skills' in category_data:
            skills = category_data.get('skills', [])
            
            if skills:
                competency_levels = [
                    skill.get('competency_level', skill.get('competency', 70)) for skill in skills 
                    if isinstance(skill.get('competency_level', skill.get('competency', 70)), (int, float))
                ]
                
                if competency_levels:
                    return sum(competency_levels) / len(competency_levels)
        
        return 70.0  # Default ideal level

    def _format_category_name(self, category_key: str) -> str:
        """Format category name for display"""
        # Handle special cases
        category_mapping = {
            'technical_skills': 'Technical Skills',
            'soft_skills': 'Soft Skills',
            'domain_knowledge': 'Domain Knowledge',
            'standard_operating_procedures': 'SOPs',
            'leadership': 'Leadership',
            'programming': 'Programming',
            'frameworks': 'Frameworks',
            'databases': 'Databases',
            'tools': 'Tools',
            'communication': 'Communication',
            'project_management': 'Project Management'
        }
        
        return category_mapping.get(category_key, category_key.replace('_', ' ').title())

    def calculate_employee_metrics(self, organization_name: str) -> Dict[str, Any]:
        """Calculate comprehensive employee metrics for the organization"""
        employees = self.get_employees_by_organization(organization_name)
        
        if not employees:
            return {}

        metrics = {
            'total_employees': len(employees),
            'employees_with_assessments': 0,
            'overall_competency': 0,
            'technical_coverage': 0,
            'soft_skill_coverage': 0,
            'domain_coverage': 0,
            'sop_coverage': 0
        }

        competencies = []
        tech_coverage = []
        soft_coverage = []
        domain_coverage = []
        sop_coverage = []

        for employee in employees:
            skill_matrix = self.get_employee_skill_matrix(employee['id'])
            if skill_matrix:
                metrics['employees_with_assessments'] += 1
                
                # Calculate overall competency
                competency = self.calculate_overall_competency_from_matrix(skill_matrix)
                competencies.append(competency)

                # Calculate category-wise coverage
                tech_cov = self._calculate_category_coverage(skill_matrix, ['technical_skills', 'programming', 'frameworks', 'databases', 'tools'])
                soft_cov = self._calculate_category_coverage(skill_matrix, ['soft_skills', 'communication', 'leadership'])
                domain_cov = self._calculate_category_coverage(skill_matrix, ['domain_knowledge'])
                sop_cov = self._calculate_category_coverage(skill_matrix, ['standard_operating_procedures'])

                tech_coverage.append(tech_cov)
                soft_coverage.append(soft_cov)
                domain_coverage.append(domain_cov)
                sop_coverage.append(sop_cov)

        # Calculate averages
        if competencies:
            metrics['overall_competency'] = round(sum(competencies) / len(competencies), 2)
        if tech_coverage:
            metrics['technical_coverage'] = round(sum(tech_coverage) / len(tech_coverage), 2)
        if soft_coverage:
            metrics['soft_skill_coverage'] = round(sum(soft_coverage) / len(soft_coverage), 2)
        if domain_coverage:
            metrics['domain_coverage'] = round(sum(domain_coverage) / len(domain_coverage), 2)
        if sop_coverage:
            metrics['sop_coverage'] = round(sum(sop_coverage) / len(sop_coverage), 2)

        return metrics

    def _calculate_category_coverage(self, skill_matrix: Dict[str, Any], category_keys: List[str]) -> float:
        """Calculate coverage percentage for specific skill categories"""
        total_skills = 0
        competent_skills = 0

        for category_key in category_keys:
            category_data = skill_matrix.get(category_key)
            if not category_data:
                continue

            if isinstance(category_data, dict) and 'skills' in category_data:
                skills = category_data.get('skills', [])
                for skill in skills:
                    if isinstance(skill, dict) and 'competency' in skill:
                        total_skills += 1
                        competency = skill.get('competency', 0)
                        if isinstance(competency, (int, float)) and competency >= 60:  # 60% threshold for competency
                            competent_skills += 1

            elif isinstance(category_data, list):
                for skill in category_data:
                    if isinstance(skill, dict) and 'competency' in skill:
                        total_skills += 1
                        competency = skill.get('competency', 0)
                        if isinstance(competency, (int, float)) and competency >= 60:
                            competent_skills += 1

        return (competent_skills / total_skills * 100) if total_skills > 0 else 0

    def is_user_hr(self, user_email: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Check if user is HR personnel
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

    def get_latest_analytics(self) -> Optional[Dict[str, Any]]:
        """Get the latest analytics data for the organization"""
        try:
            # For now, we'll generate analytics data on-demand using the current employee data
            # This simulates what would be stored in hr_analytics table
            
            # Get all employees for the organization (we'll use a known org for now)
            employees = self.get_employees_by_organization('Adivirtus AI')
            
            if not employees:
                logger.info("No employees found, returning None for analytics")
                return None
            
            # Calculate overall metrics
            total_employees = len(employees)
            employees_with_data = 0
            total_competency = 0
            technical_coverage = 0
            soft_coverage = 0
            domain_coverage = 0
            sop_coverage = 0
            
            employee_summaries = []
            
            for emp in employees:
                skill_matrix = self.get_employee_skill_matrix(emp['id'])
                if skill_matrix:
                    employees_with_data += 1
                    competency = self.calculate_overall_competency_from_matrix(skill_matrix)
                    total_competency += competency
                    
                    # Calculate coverage metrics
                    tech_cov = self._calculate_category_coverage(skill_matrix, ['technical_skills', 'programming', 'frameworks', 'databases', 'tools'])
                    soft_cov = self._calculate_category_coverage(skill_matrix, ['soft_skills', 'communication', 'leadership'])
                    domain_cov = self._calculate_category_coverage(skill_matrix, ['domain_knowledge'])
                    sop_cov = self._calculate_category_coverage(skill_matrix, ['standard_operating_procedures'])
                    
                    technical_coverage += tech_cov
                    soft_coverage += soft_cov
                    domain_coverage += domain_cov
                    sop_coverage += sop_cov
                    
                    # Add to employee summary
                    employee_summaries.append({
                        'user_id': emp['id'],
                        'email': emp.get('email'),
                        'department': emp.get('department'),
                        'position': emp.get('position'),
                        'competency': competency,
                        'technical_coverage': tech_cov,
                        'soft_skill_coverage': soft_cov,
                        'domain_coverage': domain_cov,
                        'sop_coverage': sop_cov
                    })
            
            # Calculate averages
            if employees_with_data > 0:
                avg_competency = total_competency / employees_with_data
                avg_technical = technical_coverage / employees_with_data
                avg_soft = soft_coverage / employees_with_data
                avg_domain = domain_coverage / employees_with_data
                avg_sop = sop_coverage / employees_with_data
            else:
                avg_competency = avg_technical = avg_soft = avg_domain = avg_sop = 0
            
            # Create analytics data structure
            analytics_data = {
                'employee_count': total_employees,
                'overall_competency_score': round(avg_competency, 2),
                'overall_technical_coverage': round(avg_technical, 2),
                'overall_soft_skill_coverage': round(avg_soft, 2),
                'overall_domain_coverage': round(avg_domain, 2),
                'overall_sop_coverage': round(avg_sop, 2),
                'team_analytics': [],  # Can be populated with department-wise data
                'critical_gaps': {},
                'skill_category_breakdown': {},
                'employee_summary': employee_summaries,
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'data_source': 'on_demand_calculation'
            }
            
            logger.info(f"Generated analytics data for {total_employees} employees, {employees_with_data} with data")
            return analytics_data
            
        except Exception as e:
            logger.error(f"Error fetching latest analytics: {str(e)}")
            return None

    def get_competency_level_distribution(self, organization_name: str) -> Dict[str, Any]:
        """
        Calculate organization-wide competency level distribution
        
        Args:
            organization_name: Name of the organization
            
        Returns:
            Dictionary with competency level distribution data
        """
        try:
            logger.info(f"Calculating competency distribution for organization: {organization_name}")
            
            employees = self.get_employees_by_organization(organization_name)
            
            if not employees:
                return {
                    'distribution': [],
                    'total_employees': 0,
                    'average_competency': 0,
                    'organization': organization_name
                }
            
            # Initialize competency level counters
            competency_levels = {
                'Expert (80-100)': {'count': 0, 'color': '#10B981'},
                'Advanced (60-79)': {'count': 0, 'color': '#3B82F6'},
                'Intermediate (40-59)': {'count': 0, 'color': '#F59E0B'},
                'Basic (20-39)': {'count': 0, 'color': '#F97316'},
                'Novice (0-19)': {'count': 0, 'color': '#EF4444'}
            }
            
            total_competency = 0
            employees_with_data = 0
            
            # Process each employee
            for employee in employees:
                skill_matrix = self.get_employee_skill_matrix(employee['id'])
                if skill_matrix:
                    competency = self.calculate_overall_competency_from_matrix(skill_matrix)
                    total_competency += competency
                    employees_with_data += 1
                    
                    # Categorize by competency level
                    if competency >= 80:
                        competency_levels['Expert (80-100)']['count'] += 1
                    elif competency >= 60:
                        competency_levels['Advanced (60-79)']['count'] += 1
                    elif competency >= 40:
                        competency_levels['Intermediate (40-59)']['count'] += 1
                    elif competency >= 20:
                        competency_levels['Basic (20-39)']['count'] += 1
                    else:
                        competency_levels['Novice (0-19)']['count'] += 1
            
            # Calculate percentages and build distribution array
            distribution = []
            for level, data in competency_levels.items():
                percentage = (data['count'] / employees_with_data * 100) if employees_with_data > 0 else 0
                distribution.append({
                    'level': level,
                    'count': data['count'],
                    'percentage': round(percentage, 1),
                    'color': data['color']
                })
            
            average_competency = (total_competency / employees_with_data) if employees_with_data > 0 else 0
            
            result = {
                'distribution': distribution,
                'total_employees': len(employees),
                'employees_with_data': employees_with_data,
                'average_competency': round(average_competency, 1),
                'organization': organization_name
            }
            
            logger.info(f"Competency distribution calculated: {employees_with_data} employees analyzed")
            return result
            
        except Exception as e:
            logger.error(f"Error calculating competency distribution: {str(e)}")
            return {
                'distribution': [],
                'total_employees': 0,
                'average_competency': 0,
                'organization': organization_name,
                'error': str(e)
            }

    def get_skill_maturity_heatmap(self, organization_name: str) -> Dict[str, Any]:
        """
        Generate department vs skill category competency matrix for heatmap visualization
        
        Args:
            organization_name: Name of the organization
            
        Returns:
            Dictionary with heatmap data structure
        """
        try:
            logger.info(f"Generating skill maturity heatmap for organization: {organization_name}")
            
            # Get departments
            departments_data = self.get_organization_departments(organization_name)
            
            if not departments_data:
                return {
                    'heatmap_data': [],
                    'skill_categories': [],
                    'departments': [],
                    'color_scale': {'min': 0, 'max': 100, 'thresholds': [20, 40, 60, 80, 100]}
                }
            
            # Skill categories to analyze
            skill_categories = [
                'technical_skills',
                'soft_skills', 
                'domain_knowledge',
                'standard_operating_procedures'
            ]
            
            heatmap_data = []
            departments_list = []
            
            # Process each department
            for dept_info in departments_data:
                if not dept_info.get('has_skill_data'):
                    continue
                    
                department_name = dept_info['department']
                departments_list.append(department_name)
                
                # Get department skill matrix
                dept_skill_matrix = self.calculate_department_skill_matrix(organization_name, department_name)
                
                dept_row = {
                    'department': department_name,
                    'employee_count': dept_info['employee_count']
                }
                
                # Calculate average competency for each skill category
                for category in skill_categories:
                    category_avg = self._calculate_category_average_competency(dept_skill_matrix, category)
                    # Normalize category names for frontend
                    category_key = category.replace('standard_operating_procedures', 'sop_skills')
                    dept_row[category_key] = round(category_avg, 1)
                
                heatmap_data.append(dept_row)
            
            # Prepare skill categories for frontend (normalized names)
            normalized_categories = [
                'technical_skills',
                'soft_skills',
                'domain_knowledge', 
                'sop_skills'
            ]
            
            result = {
                'heatmap_data': heatmap_data,
                'skill_categories': normalized_categories,
                'departments': departments_list,
                'color_scale': {
                    'min': 0,
                    'max': 100,
                    'thresholds': [20, 40, 60, 80, 100]
                },
                'organization': organization_name
            }
            
            logger.info(f"Skill maturity heatmap generated: {len(departments_list)} departments, {len(normalized_categories)} skill categories")
            return result
            
        except Exception as e:
            logger.error(f"Error generating skill maturity heatmap: {str(e)}")
            return {
                'heatmap_data': [],
                'skill_categories': [],
                'departments': [],
                'color_scale': {'min': 0, 'max': 100, 'thresholds': [20, 40, 60, 80, 100]},
                'error': str(e)
            }

    def _calculate_category_average_competency(self, skill_matrix: Dict[str, Any], category: str) -> float:
        """
        Calculate average competency for a specific skill category
        
        Args:
            skill_matrix: Department skill matrix
            category: Skill category name
            
        Returns:
            Average competency score for the category
        """
        if not skill_matrix or category not in skill_matrix:
            return 0.0
        
        category_data = skill_matrix[category]
        
        # Handle standard structure {"skills": [...]}
        if isinstance(category_data, dict) and 'skills' in category_data:
            skills = category_data.get('skills', [])
        elif isinstance(category_data, list):
            skills = category_data
        else:
            return 0.0
        
        if not skills:
            return 0.0
        
        # Calculate average competency
        competencies = []
        for skill in skills:
            if isinstance(skill, dict):
                competency = skill.get('competency', skill.get('competency_level', 0))
                if isinstance(competency, (int, float)):
                    competencies.append(competency)
        
        if not competencies:
            return 0.0
        
        return sum(competencies) / len(competencies)

    def get_critical_skill_gaps(self, organization_name: str) -> Dict[str, Any]:
        """
        Analyze critical skill gaps across the organization
        
        Args:
            organization_name: Name of the organization
            
        Returns:
            Comprehensive gap analysis with categorized risks
        """
        try:
            logger.info(f"Analyzing critical skill gaps for organization: {organization_name}")
            
            employees = self.get_employees_by_organization(organization_name)
            
            if not employees:
                return self._empty_gap_analysis_result(organization_name)
            
            # Collect all skill matrices for analysis
            employee_skill_data = []
            for employee in employees:
                skill_matrix = self.get_employee_skill_matrix(employee['id'])
                if skill_matrix:
                    employee_skill_data.append({
                        'employee': employee,
                        'skill_matrix': skill_matrix
                    })
            
            if not employee_skill_data:
                return self._empty_gap_analysis_result(organization_name)
            
            # Perform different types of gap analysis
            high_impact_gaps = self._identify_high_impact_gaps(employee_skill_data)
            compliance_risks = self._assess_compliance_risks(employee_skill_data)
            leadership_gaps = self._analyze_leadership_gaps(employee_skill_data)
            domain_deficits = self._evaluate_domain_knowledge_deficits(employee_skill_data)
            
            # Generate risk summary and recommendations
            risk_summary = self._calculate_risk_summary([
                high_impact_gaps, compliance_risks, leadership_gaps, domain_deficits
            ])
            
            recommendations = self._generate_gap_recommendations({
                'high_impact_gaps': high_impact_gaps,
                'compliance_risks': compliance_risks,
                'leadership_gaps': leadership_gaps,
                'domain_deficits': domain_deficits
            })
            
            result = {
                'high_impact_gaps': high_impact_gaps,
                'compliance_risks': compliance_risks,
                'leadership_gaps': leadership_gaps,
                'domain_deficits': domain_deficits,
                'risk_summary': risk_summary,
                'recommendations': recommendations,
                'organization': organization_name,
                'analysis_date': datetime.now(timezone.utc).isoformat(),
                'total_employees_analyzed': len(employee_skill_data)
            }
            
            logger.info(f"Gap analysis completed: {len(high_impact_gaps)} high-impact gaps, {len(compliance_risks)} compliance risks")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing critical skill gaps: {str(e)}")
            return self._empty_gap_analysis_result(organization_name, str(e))

    def _identify_high_impact_gaps(self, employee_skill_data: List[Dict[str, Any]], threshold: float = 30) -> List[Dict[str, Any]]:
        """Identify high-impact technical skill gaps > threshold%"""
        high_impact_gaps = []
        
        # Technical skill categories to analyze
        technical_categories = ['technical_skills', 'programming', 'frameworks', 'databases', 'tools']
        
        skill_gap_aggregation = defaultdict(lambda: {
            'total_employees': 0,
            'employees_with_gap': 0,
            'average_gap': 0,
            'max_gap': 0,
            'affected_employees': []
        })
        
        for emp_data in employee_skill_data:
            employee = emp_data['employee']
            skill_matrix = emp_data['skill_matrix']
            
            for category in technical_categories:
                if category in skill_matrix:
                    category_data = skill_matrix[category]
                    skills = category_data.get('skills', []) if isinstance(category_data, dict) else category_data
                    
                    for skill in skills:
                        if isinstance(skill, dict) and 'name' in skill:
                            skill_name = skill['name']
                            current_competency = skill.get('competency', 0)
                            ideal_competency = skill.get('ideal_competency', 80)  # Default target
                            
                            gap_percentage = max(0, ideal_competency - current_competency)
                            
                            if gap_percentage >= threshold:
                                key = f"{category}:{skill_name}"
                                skill_gap_aggregation[key]['total_employees'] += 1
                                skill_gap_aggregation[key]['employees_with_gap'] += 1
                                skill_gap_aggregation[key]['average_gap'] += gap_percentage
                                skill_gap_aggregation[key]['max_gap'] = max(skill_gap_aggregation[key]['max_gap'], gap_percentage)
                                skill_gap_aggregation[key]['affected_employees'].append({
                                    'employee_id': employee['id'],
                                    'name': employee.get('full_name', 'Unknown'),
                                    'department': employee.get('department', 'Unassigned'),
                                    'current_competency': current_competency,
                                    'target_competency': ideal_competency,
                                    'gap_percentage': gap_percentage
                                })
        
        # Process aggregated data
        for skill_key, data in skill_gap_aggregation.items():
            if data['employees_with_gap'] > 0:
                category, skill_name = skill_key.split(':', 1)
                average_gap = data['average_gap'] / data['employees_with_gap']
                
                gap_info = {
                    'skill_name': skill_name,
                    'skill_category': category,
                    'gap_type': 'high_impact_technical',
                    'average_gap_percentage': round(average_gap, 1),
                    'max_gap_percentage': round(data['max_gap'], 1),
                    'affected_employee_count': data['employees_with_gap'],
                    'business_impact': self._assess_business_impact(average_gap, data['employees_with_gap']),
                    'risk_level': self._calculate_risk_level(average_gap, data['employees_with_gap']),
                    'affected_employees': data['affected_employees'][:10],  # Limit for performance
                    'recommended_actions': self._suggest_technical_gap_actions(skill_name, average_gap)
                }
                
                high_impact_gaps.append(gap_info)
        
        # Sort by risk level and gap percentage
        high_impact_gaps.sort(key=lambda x: (x['risk_level'], x['average_gap_percentage']), reverse=True)
        return high_impact_gaps[:20]  # Return top 20 critical gaps

    def _assess_compliance_risks(self, employee_skill_data: List[Dict[str, Any]], compliance_threshold: float = 70) -> List[Dict[str, Any]]:
        """Assess compliance risks for SOP and regulatory skills"""
        compliance_risks = []
        
        # SOP and compliance-related categories
        compliance_categories = ['standard_operating_procedures', 'sop_skills', 'regulatory_compliance']
        
        for emp_data in employee_skill_data:
            employee = emp_data['employee']
            skill_matrix = emp_data['skill_matrix']
            
            for category in compliance_categories:
                if category in skill_matrix:
                    category_data = skill_matrix[category]
                    skills = category_data.get('skills', []) if isinstance(category_data, dict) else category_data
                    
                    for skill in skills:
                        if isinstance(skill, dict) and 'name' in skill:
                            competency = skill.get('competency', 0)
                            
                            if competency < compliance_threshold:
                                risk_severity = self._calculate_compliance_risk_severity(competency, compliance_threshold)
                                
                                compliance_risk = {
                                    'employee_id': employee['id'],
                                    'employee_name': employee.get('full_name', 'Unknown'),
                                    'department': employee.get('department', 'Unassigned'),
                                    'skill_name': skill['name'],
                                    'skill_category': category,
                                    'current_competency': competency,
                                    'required_competency': compliance_threshold,
                                    'compliance_gap': compliance_threshold - competency,
                                    'risk_severity': risk_severity,
                                    'compliance_deadline': self._estimate_compliance_deadline(skill['name']),
                                    'business_criticality': self._assess_compliance_criticality(skill['name']),
                                    'recommended_actions': self._suggest_compliance_actions(skill['name'], competency)
                                }
                                
                                compliance_risks.append(compliance_risk)
        
        # Sort by risk severity and compliance gap
        compliance_risks.sort(key=lambda x: (x['risk_severity'], x['compliance_gap']), reverse=True)
        return compliance_risks[:15]  # Return top 15 compliance risks

    def _analyze_leadership_gaps(self, employee_skill_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze leadership and management skill gaps"""
        leadership_gaps = []
        
        # Leadership and soft skill categories
        leadership_categories = ['soft_skills', 'leadership', 'communication', 'project_management']
        management_keywords = ['manager', 'director', 'lead', 'supervisor', 'head']
        
        for emp_data in employee_skill_data:
            employee = emp_data['employee']
            skill_matrix = emp_data['skill_matrix']
            
            # Check if employee is in management position
            position = employee.get('position', '').lower()
            is_management = any(keyword in position for keyword in management_keywords)
            
            if is_management:
                leadership_skill_gaps = []
                
                for category in leadership_categories:
                    if category in skill_matrix:
                        category_data = skill_matrix[category]
                        skills = category_data.get('skills', []) if isinstance(category_data, dict) else category_data
                        
                        for skill in skills:
                            if isinstance(skill, dict) and 'name' in skill:
                                competency = skill.get('competency', 0)
                                leadership_threshold = 75  # Higher threshold for leadership roles
                                
                                if competency < leadership_threshold:
                                    gap_info = {
                                        'skill_name': skill['name'],
                                        'skill_category': category,
                                        'current_competency': competency,
                                        'target_competency': leadership_threshold,
                                        'gap_percentage': leadership_threshold - competency
                                    }
                                    leadership_skill_gaps.append(gap_info)
                
                if leadership_skill_gaps:
                    # Calculate overall leadership readiness score
                    avg_gap = sum(gap['gap_percentage'] for gap in leadership_skill_gaps) / len(leadership_skill_gaps)
                    
                    leadership_gap = {
                        'employee_id': employee['id'],
                        'employee_name': employee.get('full_name', 'Unknown'),
                        'department': employee.get('department', 'Unassigned'),
                        'position': employee.get('position', 'Unknown'),
                        'leadership_readiness_score': round(100 - avg_gap, 1),
                        'skill_gaps': leadership_skill_gaps,
                        'gap_count': len(leadership_skill_gaps),
                        'average_gap': round(avg_gap, 1),
                        'priority_level': self._calculate_leadership_priority(avg_gap, position),
                        'development_recommendations': self._suggest_leadership_development(leadership_skill_gaps)
                    }
                    
                    leadership_gaps.append(leadership_gap)
        
        # Sort by priority and average gap
        leadership_gaps.sort(key=lambda x: (x['priority_level'], x['average_gap']), reverse=True)
        return leadership_gaps

    def _evaluate_domain_knowledge_deficits(self, employee_skill_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Evaluate business-critical domain knowledge gaps"""
        domain_deficits = []
        
        # Domain knowledge categories
        domain_categories = ['domain_knowledge', 'business_knowledge', 'industry_expertise']
        
        domain_skill_analysis = defaultdict(lambda: {
            'skill_name': '',
            'category': '',
            'total_employees': 0,
            'below_threshold_count': 0,
            'average_competency': 0,
            'business_impact_score': 0,
            'affected_departments': set()
        })
        
        for emp_data in employee_skill_data:
            employee = emp_data['employee']
            skill_matrix = emp_data['skill_matrix']
            
            for category in domain_categories:
                if category in skill_matrix:
                    category_data = skill_matrix[category]
                    skills = category_data.get('skills', []) if isinstance(category_data, dict) else category_data
                    
                    for skill in skills:
                        if isinstance(skill, dict) and 'name' in skill:
                            skill_name = skill['name']
                            competency = skill.get('competency', 0)
                            domain_threshold = 65  # Business-critical threshold
                            
                            key = f"{category}:{skill_name}"
                            domain_skill_analysis[key]['skill_name'] = skill_name
                            domain_skill_analysis[key]['category'] = category
                            domain_skill_analysis[key]['total_employees'] += 1
                            domain_skill_analysis[key]['average_competency'] += competency
                            domain_skill_analysis[key]['affected_departments'].add(employee.get('department', 'Unassigned'))
                            
                            if competency < domain_threshold:
                                domain_skill_analysis[key]['below_threshold_count'] += 1
        
        # Process domain analysis
        for key, analysis in domain_skill_analysis.items():
            if analysis['total_employees'] > 0:
                avg_competency = analysis['average_competency'] / analysis['total_employees']
                deficit_percentage = (analysis['below_threshold_count'] / analysis['total_employees']) * 100
                
                if deficit_percentage > 25:  # More than 25% of employees below threshold
                    domain_deficit = {
                        'skill_name': analysis['skill_name'],
                        'skill_category': analysis['category'],
                        'average_competency': round(avg_competency, 1),
                        'deficit_percentage': round(deficit_percentage, 1),
                        'affected_employee_count': analysis['below_threshold_count'],
                        'total_employee_count': analysis['total_employees'],
                        'affected_departments': list(analysis['affected_departments']),
                        'business_criticality': self._assess_domain_criticality(analysis['skill_name']),
                        'productivity_impact': self._estimate_productivity_impact(deficit_percentage, avg_competency),
                        'recommended_actions': self._suggest_domain_knowledge_actions(analysis['skill_name'], deficit_percentage)
                    }
                    
                    domain_deficits.append(domain_deficit)
        
        # Sort by business criticality and deficit percentage
        domain_deficits.sort(key=lambda x: (x['business_criticality'], x['deficit_percentage']), reverse=True)
        return domain_deficits

    # Helper methods for gap analysis
    def _calculate_risk_level(self, gap_percentage: float, affected_count: int) -> int:
        """Calculate risk level (1-5) based on gap severity and impact"""
        if gap_percentage >= 50 and affected_count >= 5:
            return 5  # Critical
        elif gap_percentage >= 40 and affected_count >= 3:
            return 4  # High
        elif gap_percentage >= 30 and affected_count >= 2:
            return 3  # Medium
        elif gap_percentage >= 20:
            return 2  # Low
        else:
            return 1  # Minimal

    def _assess_business_impact(self, gap_percentage: float, affected_count: int) -> str:
        """Assess business impact based on gap metrics"""
        if gap_percentage >= 50:
            return "Critical - Significant productivity loss and project delays expected"
        elif gap_percentage >= 40:
            return "High - Moderate productivity impact and quality concerns"
        elif gap_percentage >= 30:
            return "Medium - Some efficiency reduction and training needs"
        else:
            return "Low - Minor impact on day-to-day operations"

    def _calculate_compliance_risk_severity(self, current: float, required: float) -> int:
        """Calculate compliance risk severity (1-5)"""
        gap = required - current
        if gap >= 40:
            return 5  # Critical compliance risk
        elif gap >= 30:
            return 4  # High risk
        elif gap >= 20:
            return 3  # Medium risk
        elif gap >= 10:
            return 2  # Low risk
        else:
            return 1  # Minimal risk

    def _calculate_leadership_priority(self, avg_gap: float, position: str) -> int:
        """Calculate leadership development priority"""
        # Higher priority for senior positions
        senior_keywords = ['director', 'vp', 'head', 'chief']
        is_senior = any(keyword in position.lower() for keyword in senior_keywords)
        
        if avg_gap >= 40 and is_senior:
            return 5
        elif avg_gap >= 30 and is_senior:
            return 4
        elif avg_gap >= 40:
            return 3
        elif avg_gap >= 25:
            return 2
        else:
            return 1

    def _suggest_technical_gap_actions(self, skill_name: str, gap_percentage: float) -> List[str]:
        """Suggest actions for technical skill gaps"""
        actions = []
        if gap_percentage >= 40:
            actions.extend([
                f"Immediate intensive training program for {skill_name}",
                "Assign senior mentor for hands-on guidance",
                "Consider external training or certification"
            ])
        elif gap_percentage >= 25:
            actions.extend([
                f"Structured learning path for {skill_name}",
                "Pair programming or knowledge sharing sessions",
                "Internal workshop or lunch-and-learn"
            ])
        else:
            actions.append(f"Self-paced learning resources for {skill_name}")
        
        return actions

    def _suggest_compliance_actions(self, skill_name: str, competency: float) -> List[str]:
        """Suggest actions for compliance gaps"""
        if competency < 50:
            return [
                f"Mandatory compliance training for {skill_name}",
                "Regular assessment and monitoring",
                "Documented completion verification"
            ]
        else:
            return [
                f"Refresher training for {skill_name}",
                "Quarterly compliance check-ins"
            ]

    def _suggest_leadership_development(self, skill_gaps: List[Dict[str, Any]]) -> List[str]:
        """Suggest leadership development actions"""
        recommendations = []
        
        # Group by category for targeted recommendations
        category_gaps = defaultdict(list)
        for gap in skill_gaps:
            category_gaps[gap['skill_category']].append(gap)
        
        if 'communication' in category_gaps:
            recommendations.append("Executive communication coaching program")
        if 'leadership' in category_gaps:
            recommendations.append("Leadership development workshop series")
        if 'project_management' in category_gaps:
            recommendations.append("Advanced project management certification")
        
        recommendations.append("360-degree feedback assessment")
        recommendations.append("Executive mentorship program")
        
        return recommendations

    def _suggest_domain_knowledge_actions(self, skill_name: str, deficit_percentage: float) -> List[str]:
        """Suggest actions for domain knowledge gaps"""
        if deficit_percentage >= 50:
            return [
                f"Organization-wide {skill_name} training initiative",
                "Subject matter expert knowledge transfer sessions",
                "Comprehensive documentation and knowledge base creation"
            ]
        else:
            return [
                f"Targeted {skill_name} workshops",
                "Cross-functional collaboration projects",
                "Industry conference or training attendance"
            ]

    def _calculate_risk_summary(self, gap_categories: List[List[Dict[str, Any]]]) -> Dict[str, Any]:
        """Calculate overall risk summary across all gap categories"""
        total_gaps = sum(len(category) for category in gap_categories)
        
        risk_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        for category in gap_categories:
            for gap in category:
                risk_level = gap.get('risk_level', gap.get('priority_level', gap.get('risk_severity', 1)))
                risk_distribution[risk_level] += 1
        
        critical_count = risk_distribution[5] + risk_distribution[4]
        
        return {
            'total_gaps_identified': total_gaps,
            'critical_gaps_count': critical_count,
            'high_risk_percentage': round((critical_count / total_gaps * 100) if total_gaps > 0 else 0, 1),
            'risk_distribution': risk_distribution,
            'overall_risk_score': self._calculate_overall_risk_score(risk_distribution, total_gaps)
        }

    def _calculate_overall_risk_score(self, risk_distribution: Dict[int, int], total_gaps: int) -> float:
        """Calculate weighted overall risk score (0-100)"""
        if total_gaps == 0:
            return 0
        
        weighted_score = sum(level * count for level, count in risk_distribution.items())
        max_possible_score = total_gaps * 5
        
        return round((weighted_score / max_possible_score) * 100, 1)

    def _generate_gap_recommendations(self, gap_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate prioritized recommendations based on gap analysis"""
        recommendations = []
        
        # High-impact technical gaps
        if gap_analysis['high_impact_gaps']:
            top_technical_gaps = sorted(gap_analysis['high_impact_gaps'], 
                                      key=lambda x: x['risk_level'], reverse=True)[:3]
            for gap in top_technical_gaps:
                recommendations.append({
                    'priority': 'High',
                    'category': 'Technical Skills',
                    'title': f"Address {gap['skill_name']} skill gap",
                    'description': f"Critical technical gap affecting {gap['affected_employee_count']} employees",
                    'estimated_timeline': '30-60 days',
                    'expected_impact': 'Improved productivity and code quality',
                    'action_items': gap['recommended_actions']
                })
        
        # Compliance risks
        if gap_analysis['compliance_risks']:
            critical_compliance = [r for r in gap_analysis['compliance_risks'] if r['risk_severity'] >= 4]
            if critical_compliance:
                recommendations.append({
                    'priority': 'Critical',
                    'category': 'Compliance',
                    'title': 'Address critical compliance gaps',
                    'description': f'{len(critical_compliance)} employees at compliance risk',
                    'estimated_timeline': '15-30 days',
                    'expected_impact': 'Reduced regulatory risk and improved compliance',
                    'action_items': ['Immediate compliance training', 'Regular monitoring', 'Documentation review']
                })
        
        # Leadership development
        if gap_analysis['leadership_gaps']:
            high_priority_leaders = [l for l in gap_analysis['leadership_gaps'] if l['priority_level'] >= 4]
            if high_priority_leaders:
                recommendations.append({
                    'priority': 'High',
                    'category': 'Leadership Development',
                    'title': 'Leadership skill enhancement program',
                    'description': f'{len(high_priority_leaders)} leaders need skill development',
                    'estimated_timeline': '60-90 days',
                    'expected_impact': 'Improved team performance and employee satisfaction',
                    'action_items': ['Leadership coaching', '360 feedback', 'Management training']
                })
        
        return recommendations

    def _empty_gap_analysis_result(self, organization_name: str, error: str = None) -> Dict[str, Any]:
        """Return empty gap analysis result structure"""
        return {
            'high_impact_gaps': [],
            'compliance_risks': [],
            'leadership_gaps': [],
            'domain_deficits': [],
            'risk_summary': {
                'total_gaps_identified': 0,
                'critical_gaps_count': 0,
                'high_risk_percentage': 0,
                'risk_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                'overall_risk_score': 0
            },
            'recommendations': [],
            'organization': organization_name,
            'analysis_date': datetime.now(timezone.utc).isoformat(),
            'total_employees_analyzed': 0,
            'error': error
        }

    def _estimate_compliance_deadline(self, skill_name: str) -> str:
        """Estimate compliance deadline based on skill type"""
        # This could be enhanced with actual compliance requirements from database
        compliance_deadlines = {
            'safety': '30 days',
            'security': '15 days',
            'data_protection': '45 days',
            'quality': '60 days'
        }
        
        skill_lower = skill_name.lower()
        for key, deadline in compliance_deadlines.items():
            if key in skill_lower:
                return deadline
        
        return '90 days'  # Default

    def _assess_compliance_criticality(self, skill_name: str) -> int:
        """Assess business criticality (1-5) of compliance skill"""
        critical_keywords = ['safety', 'security', 'gdpr', 'hipaa', 'sox']
        skill_lower = skill_name.lower()
        
        if any(keyword in skill_lower for keyword in critical_keywords):
            return 5
        elif 'compliance' in skill_lower:
            return 4
        elif any(word in skill_lower for word in ['audit', 'regulation', 'policy']):
            return 3
        else:
            return 2

    def _assess_domain_criticality(self, skill_name: str) -> int:
        """Assess business criticality of domain knowledge"""
        critical_domain_keywords = ['product', 'customer', 'market', 'business_process']
        skill_lower = skill_name.lower()
        
        if any(keyword in skill_lower for keyword in critical_domain_keywords):
            return 5
        elif any(word in skill_lower for word in ['industry', 'domain', 'expertise']):
            return 4
        else:
            return 3

    def _estimate_productivity_impact(self, deficit_percentage: float, avg_competency: float) -> str:
        """Estimate productivity impact of domain knowledge deficits"""
        if deficit_percentage >= 50 and avg_competency < 50:
            return "Severe - Major productivity loss and quality issues"
        elif deficit_percentage >= 30 and avg_competency < 60:
            return "Moderate - Noticeable efficiency reduction"
        else:
            return "Mild - Minor impact on specialized tasks"

    def get_organization_employees(self) -> List[Dict[str, Any]]:
        """Get all employees for the organization (deprecated - use get_employees_by_organization)"""
        try:
            # This method is deprecated, use get_employees_by_organization instead
            return []
            
        except Exception as e:
            logger.error(f"Error fetching organization employees: {str(e)}")
            return []

    def generate_analytics_report(self, hr_user_id: str) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """
        Generate comprehensive analytics report for the organization
        Returns: (success, analytics_id, analytics_data)
        """
        try:
            logger.info(f"Generating analytics report for HR user: {hr_user_id}")
            
            # For now, return a placeholder success response
            # TODO: Implement full analytics generation
            analytics_data = {
                'analytics_id': f'temp_analytics_{hr_user_id}',
                'organization': 'Adivirtus AI',  # Placeholder
                'employee_count': 0,
                'overall_metrics': {},
                'coverage_metrics': {},
                'team_analytics': [],
                'critical_gaps': {},
                'employee_summary': [],
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'status': 'placeholder'
            }
            
            return True, analytics_data['analytics_id'], analytics_data
            
        except Exception as e:
            logger.error(f"Error generating analytics report: {str(e)}")
            return False, None, str(e) 
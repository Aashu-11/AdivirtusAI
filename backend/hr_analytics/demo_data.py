"""
Demo data for HR Analytics system testing
"""

from datetime import datetime, timezone
import uuid

# Demo HR personnel data
DEMO_HR_PERSONNEL = {
    "ceo@adivirtus.com": {
        "is_hr": True,
        "organization_name": "Adivirtus AI",
        "hr_name": "Aditya Kamble"
    },
    "hr@adivirtus.com": {
        "is_hr": True,
        "organization_name": "Adivirtus AI", 
        "hr_name": "HR Manager"
    }
}

# Demo employee data
DEMO_EMPLOYEES = [
    {
        "user_id": str(uuid.uuid4()),
        "email": "john.doe@adivirtus.com",
        "department": "Product",
        "job_title": "Frontend Developer",
        "organization_name": "Adivirtus AI",
        "avg_competency": 67.6,
        "total_skills": 14,
        "skills_with_gaps": 2,
        "technical_skills": 7,
        "technical_gaps_count": 1,
        "soft_skills": 3,
        "soft_skill_gaps_count": 0,
        "domain_knowledge_skills": 2,
        "domain_gaps_count": 0,
        "sop_skills": 2,
        "sop_gaps_count": 1,
        "analysis_completed_at": "2024-06-05T10:30:00Z"
    },
    {
        "user_id": str(uuid.uuid4()),
        "email": "jane.smith@adivirtus.com",
        "department": "Engineering",
        "job_title": "Backend Developer",
        "organization_name": "Adivirtus AI",
        "avg_competency": 82.4,
        "total_skills": 16,
        "skills_with_gaps": 1,
        "technical_skills": 10,
        "technical_gaps_count": 1,
        "soft_skills": 3,
        "soft_skill_gaps_count": 0,
        "domain_knowledge_skills": 2,
        "domain_gaps_count": 0,
        "sop_skills": 1,
        "sop_gaps_count": 0,
        "analysis_completed_at": "2024-06-05T09:15:00Z"
    },
    {
        "user_id": str(uuid.uuid4()),
        "email": "mike.wilson@adivirtus.com",
        "department": "Product",
        "job_title": "Product Manager",
        "organization_name": "Adivirtus AI",
        "avg_competency": 75.8,
        "total_skills": 12,
        "skills_with_gaps": 3,
        "technical_skills": 4,
        "technical_gaps_count": 1,
        "soft_skills": 5,
        "soft_skill_gaps_count": 1,
        "domain_knowledge_skills": 2,
        "domain_gaps_count": 1,
        "sop_skills": 1,
        "sop_gaps_count": 0,
        "analysis_completed_at": "2024-06-04T14:20:00Z"
    },
    {
        "user_id": str(uuid.uuid4()),
        "email": "sarah.johnson@adivirtus.com",
        "department": "Design",
        "job_title": "UX Designer",
        "organization_name": "Adivirtus AI",
        "avg_competency": 88.2,
        "total_skills": 11,
        "skills_with_gaps": 1,
        "technical_skills": 5,
        "technical_gaps_count": 0,
        "soft_skills": 4,
        "soft_skill_gaps_count": 0,
        "domain_knowledge_skills": 1,
        "domain_gaps_count": 1,
        "sop_skills": 1,
        "sop_gaps_count": 0,
        "analysis_completed_at": "2024-06-05T11:45:00Z"
    },
    {
        "user_id": str(uuid.uuid4()),
        "email": "alex.brown@adivirtus.com",
        "department": "Engineering",
        "job_title": "DevOps Engineer",
        "organization_name": "Adivirtus AI",
        "avg_competency": 55.3,
        "total_skills": 13,
        "skills_with_gaps": 6,
        "technical_skills": 8,
        "technical_gaps_count": 4,
        "soft_skills": 2,
        "soft_skill_gaps_count": 1,
        "domain_knowledge_skills": 2,
        "domain_gaps_count": 1,
        "sop_skills": 1,
        "sop_gaps_count": 0,
        "analysis_completed_at": "2024-06-03T16:30:00Z"
    }
]

# Demo analytics data
def generate_demo_analytics():
    """Generate demo analytics data"""
    employees = DEMO_EMPLOYEES
    
    # Calculate overall metrics
    total_employees = len(employees)
    avg_competency = sum(emp['avg_competency'] for emp in employees) / total_employees
    total_skills = sum(emp['total_skills'] for emp in employees)
    total_gaps = sum(emp['skills_with_gaps'] for emp in employees)
    
    # Calculate coverage metrics
    def calculate_coverage(skill_type, gap_type):
        total_skills = sum(emp[skill_type] for emp in employees)
        total_gaps = sum(emp[gap_type] for emp in employees)
        if total_skills == 0:
            return 0
        return ((total_skills - total_gaps) / total_skills) * 100
    
    technical_coverage = calculate_coverage('technical_skills', 'technical_gaps_count')
    soft_skill_coverage = calculate_coverage('soft_skills', 'soft_skill_gaps_count')
    domain_coverage = calculate_coverage('domain_knowledge_skills', 'domain_gaps_count')
    sop_coverage = calculate_coverage('sop_skills', 'sop_gaps_count')
    
    # Team analytics
    teams = {}
    for emp in employees:
        dept = emp['department']
        if dept not in teams:
            teams[dept] = []
        teams[dept].append(emp)
    
    team_analytics = []
    for team_name, team_employees in teams.items():
        team_avg_competency = sum(emp['avg_competency'] for emp in team_employees) / len(team_employees)
        team_total_gaps = sum(emp['skills_with_gaps'] for emp in team_employees)
        critical_employees = sum(1 for emp in team_employees if emp['avg_competency'] < 60)
        
        team_analytics.append({
            "team_name": team_name,
            "employee_count": len(team_employees),
            "avg_competency": round(team_avg_competency, 2),
            "total_gaps": team_total_gaps,
            "critical_gaps": critical_employees,
            "technical_coverage": calculate_coverage('technical_skills', 'technical_gaps_count'),
            "soft_skill_coverage": calculate_coverage('soft_skills', 'soft_skill_gaps_count'),
            "domain_coverage": calculate_coverage('domain_knowledge_skills', 'domain_gaps_count'),
            "sop_coverage": calculate_coverage('sop_skills', 'sop_gaps_count')
        })
    
    # Critical gaps
    critical_gaps = {
        "technical_critical": [emp for emp in employees if emp['avg_competency'] < 60 and emp['technical_gaps_count'] > 0],
        "soft_skills_critical": [emp for emp in employees if emp['avg_competency'] < 60 and emp['soft_skill_gaps_count'] > 0],
        "domain_critical": [emp for emp in employees if emp['avg_competency'] < 60 and emp['domain_gaps_count'] > 0],
        "sop_critical": [emp for emp in employees if emp['avg_competency'] < 60 and emp['sop_gaps_count'] > 0]
    }
    
    # Employee summary (sorted by competency)
    employee_summary = sorted(employees, key=lambda x: x['avg_competency'], reverse=True)
    
    return {
        "analytics_id": str(uuid.uuid4()),
        "organization": "Adivirtus AI",
        "hr_name": "Aditya Kamble",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "overview": {
            "total_employees": total_employees,
            "overall_competency": round(avg_competency, 2),
            "technical_coverage": round(technical_coverage, 2),
            "soft_skill_coverage": round(soft_skill_coverage, 2),
            "domain_coverage": round(domain_coverage, 2),
            "sop_coverage": round(sop_coverage, 2)
        },
        "team_analytics": team_analytics,
        "critical_gaps": critical_gaps,
        "skill_breakdown": {
            "technical": {"total": sum(emp['technical_skills'] for emp in employees), "gaps": sum(emp['technical_gaps_count'] for emp in employees)},
            "soft_skills": {"total": sum(emp['soft_skills'] for emp in employees), "gaps": sum(emp['soft_skill_gaps_count'] for emp in employees)},
            "domain": {"total": sum(emp['domain_knowledge_skills'] for emp in employees), "gaps": sum(emp['domain_gaps_count'] for emp in employees)},
            "sop": {"total": sum(emp['sop_skills'] for emp in employees), "gaps": sum(emp['sop_gaps_count'] for emp in employees)}
        },
        "employee_summary": employee_summary,
        "has_data": True,
        "generated_at": datetime.now(timezone.utc).isoformat()
    } 
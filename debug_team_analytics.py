#!/usr/bin/env python
"""
Debug script to investigate team analytics calculation issues
"""

import os
import sys
import django
from pathlib import Path

# Add the Django project to the path
sys.path.append('/home/thegodofcomputers/adivirtus-ai/backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hr_analytics.analytics import HRAnalyticsEngine

def debug_team_analytics():
    """Debug team analytics calculation"""
    print("🔍 Debugging Team Analytics Calculation")
    print("=" * 50)
    
    # Initialize engine
    engine = HRAnalyticsEngine("Adivirtus AI")
    
    # Get raw employee data
    print("\n📊 Getting raw employee data...")
    employees_data = engine.get_employee_analytics_base()
    
    print(f"Total employees found: {len(employees_data)}")
    
    if not employees_data:
        print("❌ No employee data found!")
        return
    
    print("\n👥 Employee Details:")
    for i, emp in enumerate(employees_data):
        print(f"\nEmployee {i+1}:")
        print(f"  Email: {emp.get('email')}")
        print(f"  Department: {emp.get('department')}")
        print(f"  Job Title: {emp.get('job_title')}")
        print(f"  Avg Competency: {emp.get('avg_competency')}")
        print(f"  Total Skills: {emp.get('total_skills')}")
        print(f"  Skills with Gaps: {emp.get('skills_with_gaps')}")
        print(f"  Technical Skills: {emp.get('technical_skills')}")
        print(f"  Technical Gaps: {emp.get('technical_gaps_count')}")
        print(f"  Soft Skills: {emp.get('soft_skills')}")
        print(f"  Soft Skill Gaps: {emp.get('soft_skill_gaps_count')}")
        print(f"  Domain Skills: {emp.get('domain_knowledge_skills')}")
        print(f"  Domain Gaps: {emp.get('domain_gaps_count')}")
        print(f"  SOP Skills: {emp.get('sop_skills')}")
        print(f"  SOP Gaps: {emp.get('sop_gaps_count')}")
    
    # Analyze team breakdown
    print("\n🏢 Team Breakdown Analysis:")
    print("-" * 30)
    
    teams = {}
    for emp in employees_data:
        department = emp.get('department') or 'Unassigned'
        if department not in teams:
            teams[department] = []
        teams[department].append(emp)
    
    print(f"Departments found: {list(teams.keys())}")
    
    for team_name, team_employees in teams.items():
        print(f"\n🏷️  {team_name} Department:")
        print(f"    Employee count: {len(team_employees)}")
        
        # Manual calculation - same as in analytics engine
        team_metrics = engine.calculate_overall_metrics(team_employees)
        team_coverage = engine.calculate_coverage_metrics(team_employees)
        
        print(f"    Avg Competency: {team_metrics['avg_competency']}")
        print(f"    Total Gaps: {team_metrics['total_gaps']}")
        print(f"    Technical Coverage: {team_coverage['technical_coverage']}")
        print(f"    Soft Skill Coverage: {team_coverage['soft_skill_coverage']}")
        print(f"    Domain Coverage: {team_coverage['domain_coverage']}")
        print(f"    SOP Coverage: {team_coverage['sop_coverage']}")
        
        print(f"    Team members:")
        for emp in team_employees:
            print(f"      - {emp.get('email')} (Competency: {emp.get('avg_competency')})")
    
    # Generate full analytics to compare
    print("\n🎯 Full Analytics Generation:")
    print("-" * 30)
    
    team_analytics = engine.analyze_team_breakdown(employees_data)
    
    print(f"Generated team analytics: {len(team_analytics)} teams")
    for team in team_analytics:
        print(f"\n📈 {team['team_name']}:")
        print(f"    Employee Count: {team['employee_count']}")
        print(f"    Avg Competency: {team['avg_competency']}")
        print(f"    Total Gaps: {team['total_gaps']}")
        print(f"    Technical Coverage: {team['technical_coverage']}")
        print(f"    Soft Skill Coverage: {team['soft_skill_coverage']}")
        print(f"    Domain Coverage: {team['domain_coverage']}")
        print(f"    SOP Coverage: {team['sop_coverage']}")

    # Check if there's an issue with data coming from Supabase view
    print(f"\n🔍 Raw employees data structure check:")
    if employees_data:
        sample_emp = employees_data[0]
        print(f"Sample employee keys: {list(sample_emp.keys())}")
    
if __name__ == "__main__":
    debug_team_analytics() 
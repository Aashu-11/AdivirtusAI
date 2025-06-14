#!/usr/bin/env python3
"""
Test script for HR Analytics system
"""

import os
import sys
import django
from django.conf import settings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adivirtus_backend.settings')
django.setup()

from hr_analytics.analytics import HRAnalyticsEngine

def test_hr_analytics():
    """Test the HR analytics system"""
    print("🧪 Testing HR Analytics System...")
    
    try:
        # Test analytics engine initialization
        print("\n1. Testing Analytics Engine Initialization...")
        engine = HRAnalyticsEngine("Adivirtus AI")
        print("✅ Analytics engine initialized successfully")
        
        # Test HR user check
        print("\n2. Testing HR User Check...")
        is_hr, org_name, hr_name = engine.is_user_hr("ceo@adivirtus.com")
        print(f"✅ HR Check Result: is_hr={is_hr}, org={org_name}, name={hr_name}")
        
        # Test employee data retrieval
        print("\n3. Testing Employee Data Retrieval...")
        employees = engine.get_organization_employees()
        print(f"✅ Found {len(employees)} employees")
        
        if employees:
            print("   Sample employee data:")
            for emp in employees[:2]:  # Show first 2 employees
                print(f"   - {emp.get('email', 'N/A')}: {emp.get('avg_competency', 0)}% competency")
        
        # Test analytics generation
        print("\n4. Testing Analytics Generation...")
        import uuid
        test_user_id = str(uuid.uuid4())
        success, analytics_id, result = engine.generate_analytics_report(test_user_id)
        
        if success:
            print(f"✅ Analytics generated successfully! ID: {analytics_id}")
            if isinstance(result, dict):
                print(f"   - Organization: {result.get('organization')}")
                print(f"   - Employee Count: {result.get('employee_count')}")
                print(f"   - Teams: {len(result.get('team_analytics', []))}")
        else:
            print(f"⚠️  Analytics generation failed: {result}")
        
        # Test latest analytics retrieval
        print("\n5. Testing Latest Analytics Retrieval...")
        latest = engine.get_latest_analytics()
        if latest:
            print("✅ Latest analytics retrieved successfully")
            print(f"   - Generated at: {latest.get('generated_at')}")
            print(f"   - Employee count: {latest.get('employee_count')}")
            print(f"   - Overall competency: {latest.get('overall_competency_score')}%")
        else:
            print("⚠️  No analytics data found")
        
        print("\n🎉 HR Analytics System Test Complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_database_functions():
    """Test Supabase database functions"""
    print("\n🗄️  Testing Database Functions...")
    
    try:
        from supabase import create_client
        
        url = os.environ.get('SUPABASE_URL')
        key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_SERVICE_KEY')
        
        if not url or not key:
            print("⚠️  Supabase credentials not found in environment")
            return False
        
        supabase = create_client(url, key)
        
        # Test is_user_hr function
        print("\n1. Testing is_user_hr function...")
        response = supabase.rpc('is_user_hr', {'user_email': 'ceo@adivirtus.com'}).execute()
        print(f"✅ is_user_hr response: {response.data}")
        
        # Test get_organization_employees function
        print("\n2. Testing get_organization_employees function...")
        response = supabase.rpc('get_organization_employees', {'org_name': 'Adivirtus AI'}).execute()
        print(f"✅ Found {len(response.data) if response.data else 0} employees")
        
        # Test generate_hr_analytics function
        print("\n3. Testing generate_hr_analytics function...")
        import uuid
        test_user_uuid = str(uuid.uuid4())
        response = supabase.rpc('generate_hr_analytics', {
            'org_name': 'Adivirtus AI',
            'hr_user_uuid': test_user_uuid
        }).execute()
        
        if response.data:
            print(f"✅ Analytics generated with ID: {response.data}")
        else:
            print("⚠️  No analytics ID returned")
        
        print("\n🎉 Database Functions Test Complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Database test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting HR Analytics System Tests...\n")
    
    # Test database functions first
    db_success = test_database_functions()
    
    # Test analytics engine
    analytics_success = test_hr_analytics()
    
    if db_success and analytics_success:
        print("\n🎊 All tests passed! HR Analytics system is ready!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Please check the errors above.")
        sys.exit(1) 
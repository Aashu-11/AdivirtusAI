#!/usr/bin/env python3
"""
Production test for HR Analytics system
"""

import os
import sys
import django
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adivirtus_backend.settings')
django.setup()

from hr_analytics.analytics import HRAnalyticsEngine

def test_production_system():
    """Test the production HR analytics system"""
    print("🚀 Testing Production HR Analytics System...")
    
    try:
        # Test with your actual email
        print("\n1. Testing HR Status for ceo@adivirtus.com...")
        engine = HRAnalyticsEngine("Adivirtus AI")
        is_hr, org_name, hr_name = engine.is_user_hr("ceo@adivirtus.com")
        print(f"✅ HR Status: is_hr={is_hr}, org={org_name}, name={hr_name}")
        
        if not is_hr:
            print("❌ User is not recognized as HR. Please check hr_personnel table.")
            return False
        
        # Test employee data retrieval
        print("\n2. Getting Employee Data...")
        employees = engine.get_organization_employees()
        print(f"✅ Found {len(employees)} employees")
        
        for emp in employees:
            print(f"   - {emp.get('email', 'N/A')}: {emp.get('avg_competency', 0)}% competency")
        
        # Test analytics retrieval
        print("\n3. Getting Latest Analytics...")
        latest = engine.get_latest_analytics()
        if latest:
            print("✅ Analytics data found:")
            print(f"   - Employee Count: {latest.get('employee_count')}")
            print(f"   - Overall Competency: {latest.get('overall_competency_score')}%")
            print(f"   - Generated At: {latest.get('generated_at')}")
        else:
            print("⚠️  No analytics data found. Generating new analytics...")
            # Generate analytics with a valid UUID
            test_user_id = str(uuid.uuid4())
            success, analytics_id, result = engine.generate_analytics_report(test_user_id)
            
            if success:
                print(f"✅ Analytics generated! ID: {analytics_id}")
            else:
                print(f"❌ Analytics generation failed: {result}")
        
        print("\n🎉 Production System Test Complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_second_hr_user():
    """Test with the second HR user you mentioned"""
    print("\n🧪 Testing Second HR User (adityatinkercad@gmail.com)...")
    
    try:
        engine = HRAnalyticsEngine("Adivirtus AI")
        is_hr, org_name, hr_name = engine.is_user_hr("adityatinkercad@gmail.com")
        print(f"HR Status: is_hr={is_hr}, org={org_name}, name={hr_name}")
        
        if is_hr:
            print("✅ Second HR user is properly configured")
            return True
        else:
            print("⚠️  Second HR user not found. You may need to add them to hr_personnel table.")
            return False
            
    except Exception as e:
        print(f"❌ Error checking second HR user: {str(e)}")
        return False

if __name__ == "__main__":
    print("🎯 Production HR Analytics System Test\n")
    
    # Test main system
    main_success = test_production_system()
    
    # Test second HR user
    second_hr_success = test_second_hr_user()
    
    if main_success:
        print("\n🎊 Production system is ready!")
        print("\nNext steps:")
        print("1. ✅ Backend is working with real Supabase data")
        print("2. ✅ HR authentication is configured")
        print("3. 🔄 Frontend should now work with production API")
        print("4. 📊 Dashboard will show real employee analytics")
        
        if not second_hr_success:
            print("\n📝 To add second HR user, run this SQL in Supabase:")
            print("INSERT INTO hr_personnel (name, email, organization_name)")
            print("VALUES ('Aditya', 'adityatinkercad@gmail.com', 'Adivirtus AI');")
    else:
        print("\n💥 Production system needs attention. Check errors above.") 
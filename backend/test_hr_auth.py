#!/usr/bin/env python
"""
Test script to verify HR authentication is working
"""
import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_hr_authentication():
    """Test HR authentication flow"""
    
    # Test email that should be HR
    test_email = "ceo@adivirtus.com"
    
    print(f"🧪 Testing HR authentication for: {test_email}")
    
    # Step 1: First try to get a token from the frontend login endpoint
    print("\n1. Testing without token (should fail)...")
    response = requests.get("http://localhost:8000/api/hr-analytics/hr/status/")
    print(f"   Status: {response.status_code}")
    if response.status_code != 200:
        print(f"   Response: {response.text}")
    
    # Step 2: Check if we can manually authenticate 
    # For this test, let's try to simulate the Supabase token
    # In a real scenario, this would come from the frontend's localStorage
    
    print("\n2. Testing debug endpoint...")
    # We need a valid Supabase token - this would normally come from frontend
    print("   ⚠️  Need valid Supabase token from frontend login")
    
    print("\n3. Instructions for manual testing:")
    print("   a. Go to http://localhost:3000/login")
    print("   b. Login with ceo@adivirtus.com")
    print("   c. Open browser DevTools > Application > Local Storage")
    print("   d. Copy the 'access_token' value")
    print("   e. Run this command:")
    print('      curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8000/api/hr-analytics/debug/user/')
    
    print("\n4. Then test HR status:")
    print('      curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8000/api/hr-analytics/hr/status/')

if __name__ == "__main__":
    test_hr_authentication() 
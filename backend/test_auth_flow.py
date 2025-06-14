#!/usr/bin/env python
"""
Test the complete authentication flow
"""
import os
import requests
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_frontend_env():
    """Check frontend environment variables"""
    print("🔍 Checking Frontend Environment")
    
    try:
        with open('frontend/.env.local', 'r') as f:
            env_content = f.read()
            
        if 'NEXT_PUBLIC_SUPABASE_URL' in env_content:
            print("✅ Frontend has NEXT_PUBLIC_SUPABASE_URL")
        else:
            print("❌ Missing NEXT_PUBLIC_SUPABASE_URL in frontend")
            
        if 'NEXT_PUBLIC_SUPABASE_ANON_KEY' in env_content:
            print("✅ Frontend has NEXT_PUBLIC_SUPABASE_ANON_KEY")
        else:
            print("❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend")
            
    except Exception as e:
        print(f"❌ Error reading frontend env: {str(e)}")

def test_supabase_auth_flow():
    """Test Supabase authentication"""
    print("\n🔐 Testing Supabase Authentication Setup")
    
    # Check backend environment
    url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not url:
        print("❌ Missing SUPABASE_URL in backend")
        return False
        
    if not service_key:
        print("❌ Missing SUPABASE_SERVICE_KEY in backend")
        return False
        
    print("✅ Backend Supabase credentials configured")
    
    # Test Supabase connection
    try:
        supabase: Client = create_client(url, service_key)
        print("✅ Supabase client created successfully")
        
        # Test if we can connect to Supabase
        # Note: This uses service key, which has admin access
        auth_info = supabase.auth.admin.list_users()
        print(f"✅ Connected to Supabase (Found {len(auth_info.users)} users)")
        
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        return False

def test_backend_auth():
    """Test backend authentication endpoints"""
    print("\n🔍 Testing Backend Authentication")
    
    # Test without authentication (should fail)
    print("1. Testing without token...")
    try:
        response = requests.get("http://localhost:8000/api/hr-analytics/hr/status/", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 403:
            data = response.json()
            print(f"   Expected 403: {data.get('detail', 'No detail')}")
        else:
            print(f"   Unexpected status: {response.text[:100]}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {str(e)}")
    
    print("\n2. Instructions for manual testing:")
    print("   📱 Frontend testing steps:")
    print("   a. Go to http://localhost:3000/auth/signin (or whatever port Next.js is using)")
    print("   b. Login with ceo@adivirtus.com")
    print("   c. After successful login, open browser DevTools (F12)")
    print("   d. Go to Console tab and run:")
    print("      const supabase = require('@/utils/supabase/client').createClient();")
    print("      supabase.auth.getSession().then(r => console.log('Token:', r.data.session?.access_token));")
    print("   e. Copy the token and test with:")
    print('      curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/hr-analytics/debug/user/')
    
    print("\n   🖥️  Alternative browser testing:")
    print("   a. After login, go to http://localhost:3000/hrdashboard")
    print("   b. Check browser DevTools Network tab for API calls")
    print("   c. Look for Authorization headers in the requests")

def test_django_server():
    """Test if Django server is responding"""
    print("\n🖥️  Testing Django Server")
    
    try:
        response = requests.get("http://localhost:8000/admin/", timeout=5)
        print(f"✅ Django server is running (Status: {response.status_code})")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Django server not responding: {str(e)}")
        return False

def test_frontend_server():
    """Test if frontend server is responding"""
    print("\n🌐 Testing Frontend Server")
    
    ports_to_try = [3000, 3001, 3002, 3003]
    
    for port in ports_to_try:
        try:
            response = requests.get(f"http://localhost:{port}/", timeout=2)
            if response.status_code == 200:
                print(f"✅ Frontend server is running on port {port}")
                return port
        except requests.exceptions.RequestException:
            continue
    
    print("❌ Frontend server not found on common ports")
    return None

if __name__ == "__main__":
    print("🚀 HR Analytics Authentication Complete Test\n")
    
    # Test frontend environment
    test_frontend_env()
    
    # Test Django server
    if not test_django_server():
        print("\n💡 Start Django server with:")
        print("   cd backend && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000")
    
    # Test frontend server
    frontend_port = test_frontend_server()
    if not frontend_port:
        print("\n💡 Start frontend server with:")
        print("   cd frontend && npm run dev")
    
    # Test Supabase setup
    if test_supabase_auth_flow():
        print("\n✅ Supabase authentication is properly configured")
    
    # Test backend authentication
    test_backend_auth()
    
    print("\n🎯 Next Steps:")
    print("1. Login via frontend at http://localhost:{}/auth/signin".format(frontend_port or "3000"))
    print("2. Use browser DevTools to get the session token")
    print("3. Test the HR dashboard functionality")
    print("4. Check Django server logs for authentication debugging info") 
#!/usr/bin/env python
"""
Test live updates functionality
"""
import requests
import time

def test_live_updates():
    """Test the live updates endpoint"""
    print("🔍 Testing Live Updates Functionality")
    
    # First test the SSE auth endpoint
    print("\n1. Testing SSE auth endpoint...")
    try:
        response = requests.get("http://localhost:8000/api/hr-analytics/test-sse-auth/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 403:
            print("   Expected: Need authentication token")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    # Test the live updates endpoint
    print("\n2. Testing live updates endpoint...")
    try:
        response = requests.get("http://localhost:8000/api/hr-analytics/live-updates/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 403:
            print("   Expected: Need authentication token")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   Error: {str(e)}")
    
    print("\n✅ Basic endpoint tests completed")
    print("\n💡 To test with authentication:")
    print("   1. Login to frontend and get token from browser DevTools")
    print("   2. Test with: curl -H 'Authorization: Bearer TOKEN' http://localhost:8000/api/hr-analytics/test-sse-auth/")
    print("   3. Test SSE with: curl -H 'Authorization: Bearer TOKEN' http://localhost:8000/api/hr-analytics/live-updates/")

if __name__ == "__main__":
    test_live_updates() 
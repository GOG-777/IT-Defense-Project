#!/usr/bin/env python3
"""
API Discovery Script - Find all working endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_endpoint(method, url, data=None, headers=None):
    """Test a single endpoint"""
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers)
        elif method == 'PUT':
            response = requests.put(url, json=data, headers=headers)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        else:
            return None
        
        return {
            'status': response.status_code,
            'data': response.json() if response.text else {}
        }
    except Exception as e:
        return {'error': str(e)}

def main():
    print("🔍 Discovering API Endpoints...\n")
    
    # First, get health check
    print("1. Testing basic endpoints:")
    print("-" * 40)
    
    # Health check
    result = test_endpoint('GET', f"{BASE_URL}/health")
    print(f"GET /api/health: {result.get('status', 'Error')}")
    
    # Test auth endpoints
    print("\n2. Testing auth endpoints:")
    print("-" * 40)
    
    # Register
    test_data = {
        "full_name": "Test User",
        "email": f"test.{requests.utils.quote('@')}uniport.edu",
        "password": "test123",
        "level": 200,
        "student_id": "TEST001"
    }
    result = test_endpoint('POST', f"{BASE_URL}/auth/register", test_data)
    print(f"POST /api/auth/register: {result.get('status', 'Error')}")
    
    # Login
    login_data = {"email": "admin@courseapp.com", "password": "admin123"}
    result = test_endpoint('POST', f"{BASE_URL}/auth/login", login_data)
    print(f"POST /api/auth/login: {result.get('status', 'Error')}")
    
    # Get token for protected routes
    token = None
    if result and result.get('status') == 200:
        token = result.get('data', {}).get('token')
        print(f"✓ Got token: {token[:30]}...")
    
    print("\n3. Testing course endpoints:")
    print("-" * 40)
    
    # Test different course endpoint patterns
    endpoints_to_test = [
        ('GET', f"{BASE_URL}/courses"),
        ('GET', f"{BASE_URL}/courses/all"),
        ('GET', f"{BASE_URL}/courses/level/200"),
        ('GET', f"{BASE_URL}/courses/200"),
        ('GET', f"{BASE_URL}/course/200"),
    ]
    
    for method, url in endpoints_to_test:
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        result = test_endpoint(method, url, headers=headers)
        print(f"{method} {url.replace(BASE_URL, '')}: {result.get('status', 'Error') if result else 'No response'}")
        if result and result.get('status') == 200:
            data = result.get('data', {})
            if isinstance(data, list):
                print(f"   Found {len(data)} items")
            elif isinstance(data, dict) and 'data' in data:
                print(f"   Found {len(data.get('data', []))} items")
    
    print("\n4. Testing enrollment endpoints:")
    print("-" * 40)
    
    enrollment_endpoints = [
        ('GET', f"{BASE_URL}/enrollments"),
        ('GET', f"{BASE_URL}/enrollments/user"),
        ('POST', f"{BASE_URL}/enrollments/enroll"),
    ]
    
    for method, url in enrollment_endpoints:
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        if method == 'POST':
            # Test data for enrollment
            enroll_data = {
                "student_id": "TEST001",
                "course_code": "CSC201",
                "semester": "First Semester 2024"
            }
            result = test_endpoint(method, url, enroll_data, headers)
        else:
            result = test_endpoint(method, url, headers=headers)
        
        print(f"{method} {url.replace(BASE_URL, '')}: {result.get('status', 'Error') if result else 'No response'}")
    
    print("\n📊 API Discovery Complete")
    print("=" * 40)

if __name__ == "__main__":
    main()
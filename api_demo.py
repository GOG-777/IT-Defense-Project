#!/usr/bin/env python3
"""
Course Registration API Demo Script - Fixed version
Run with: python3 api_demo.py
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

def print_header(text):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"📋 {text}")
    print(f"{'='*60}")

def print_success(response):
    """Print successful response in green"""
    print(f"✅ Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def print_error(response):
    """Print error response in red"""
    print(f"❌ Status: {response.status_code}")
    if response.text:
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)

def demo_health_check():
    """Test the health check endpoint"""
    print_header("1. Health Check Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success(response)
            return True
        else:
            print_error(response)
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def demo_registration():
    """Test student registration - FIXED response parsing"""
    print_header("2. Student Registration")
    
    # Generate unique email with timestamp
    timestamp = datetime.now().strftime('%H%M%S')
    
    student_data = {
        "full_name": "John Doe",
        "email": f"john.doe.{timestamp}@student.uniport.edu",
        "password": "SecurePass123!",
        "level": 200,
        "student_id": f"STU{timestamp}",
        "phone": "+2348012345678"
    }
    
    print(f"📝 Registering student: {student_data['full_name']}")
    print(f"📧 Email: {student_data['email']}")
    print(f"🎓 Level: {student_data['level']}")
    print(f"🆔 Student ID: {student_data['student_id']}")
    
    response = requests.post(f"{BASE_URL}/auth/register", json=student_data)
    
    if response.status_code in [200, 201]:
        print_success(response)
        # Your API returns token and user directly in response
        user_data = response.json().get('user', {})
        token = response.json().get('token')
        return {"user": user_data, "token": token}
    else:
        print_error(response)
        return None

def demo_login(email, password):
    """Test login and get JWT token"""
    print_header("3. Student Login (Get JWT Token)")
    
    login_data = {
        "email": email,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        print_success(response)
        token = response.json().get('token')
        if token:
            print(f"🔑 Token received: {token[:50]}...")
            return token
    else:
        print_error(response)
    
    return None

def demo_get_courses(level, token=None):
    """Get courses for a specific level"""
    print_header(f"4. Get {level}-Level Courses")
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    url = f"{BASE_URL}/courses/{level}"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        courses = response.json().get('data', [])
        print(f"✅ Status: {response.status_code}")
        print(f"📚 Found {len(courses)} courses for {level}-Level")
        
        # Show first 3 courses as sample
        if courses:
            print("\n📖 Sample Courses:")
            for i, course in enumerate(courses[:3], 1):
                print(f"  {i}. {course.get('course_code', 'N/A')}: {course.get('course_name', 'N/A')}")
                print(f"     Credits: {course.get('credits', 'N/A')}")
                print(f"     Semester: {course.get('semester', 'N/A')}")
        
        # Show total credits
        total_credits = sum(course.get('credits', 0) for course in courses)
        print(f"\n📊 Total Credit Units: {total_credits}")
        
        return courses
    else:
        print_error(response)
        return []

def demo_enrollment(token, student_id, course_code):
    """Test course enrollment"""
    print_header("5. Course Enrollment")
    
    enrollment_data = {
        "student_id": student_id,
        "course_code": course_code,
        "semester": "First Semester 2024"
    }
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print(f"🎯 Enrolling in: {course_code}")
    print(f"👤 Student ID: {student_id}")
    print(f"📅 Semester: {enrollment_data['semester']}")
    
    response = requests.post(f"{BASE_URL}/enrollments/enroll", 
                           json=enrollment_data, 
                           headers=headers)
    
    if response.status_code == 200:
        print_success(response)
        return True
    else:
        print_error(response)
        return False

def demo_get_user_profile(token):
    """Get user profile (requires authentication)"""
    print_header("6. Get User Profile (Authenticated)")
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
    
    if response.status_code == 200:
        print_success(response)
        return response.json().get('data', {})
    else:
        print_error(response)
        return {}

def main():
    """Main demo function - FIXED logic flow"""
    print("\n" + "🚀" * 25)
    print("   COURSE REGISTRATION API DEMO   ")
    print("🚀" * 25)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 API Base URL: {BASE_URL}")
    print()
    
    # Check if server is running
    if not demo_health_check():
        print("\n❌ Exiting: Cannot connect to API server")
        sys.exit(1)
    
    # Demo registration
    registration_result = demo_registration()
    if not registration_result:
        print("\n⚠️  Skipping further demos due to registration failure")
        sys.exit(1)
    
    # Extract user data and token from registration
    user_data = registration_result.get('user', {})
    token = registration_result.get('token')
    
    if token:
        print(f"\n🔐 Using token from registration: {token[:50]}...")
        
        # Demo getting user profile
        user_profile = demo_get_user_profile(token)
        
        # Demo getting courses
        courses = demo_get_courses(200, token)
        
        # Demo enrollment if we have courses and student_id
        if courses and token and user_data.get('student_id'):
            # Use first course for enrollment demo
            course_code = courses[0].get('course_code') if courses else 'MTH 270.1'
            demo_enrollment(token, user_data.get('student_id'), course_code)
    else:
        # If no token from registration, try login
        email = user_data.get('email', 'john.doe@student.uniport.edu')
        password = "SecurePass123!"
        token = demo_login(email, password)
        
        if token:
            # Demo getting courses
            courses = demo_get_courses(200, token)
    
    print_header("Demo Complete")
    print("✅ API testing completed!")
    print(f"\n📊 Summary:")
    print(f"   - Health Check: ✓")
    print(f"   - Registration: ✓ (User ID: {user_data.get('id', 'N/A')})")
    print(f"   - Login & Auth: {'✓' if token else '✗'}")
    print(f"   - User Profile: {'✓' if user_profile else '✗'}")
    print(f"   - Course Fetch: {'✓' if courses else '✗'}")
    print(f"\n🎉 API endpoints are functional!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Demo interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)
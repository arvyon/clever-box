#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class CMS_API_Tester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"    URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            print(f"    Status: {response.status_code}")
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ {name} - PASSED")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ {name} - FAILED (Expected {expected_status}, got {response.status_code})")
                try:
                    error_detail = response.json()
                    print(f"    Error: {error_detail}")
                except:
                    error_detail = response.text
                    print(f"    Error: {error_detail}")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": error_detail
                })
                return False, error_detail

        except Exception as e:
            print(f"❌ {name} - ERROR: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, str(e)

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Flow")
        
        # Test login with valid credentials
        success, response = self.run_test(
            "Login with valid credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@demo.com", "password": "demo123"}
        )
        
        if success and isinstance(response, dict) and 'token' in response:
            self.token = response['token']
            print(f"    Token received: {self.token[:20]}...")
            
            # Test get current user
            self.run_test("Get current user", "GET", "auth/me", 200)
        else:
            print(f"❌ Login failed - cannot proceed with authenticated tests")
            return False
            
        # Test login with invalid credentials
        self.run_test(
            "Login with invalid credentials",
            "POST", 
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrong"}
        )
        
        return True

    def test_schools_crud(self):
        """Test schools CRUD operations"""
        print("\n🏫 Testing Schools CRUD")
        
        # Get schools list
        success, schools_list = self.run_test("Get schools list", "GET", "schools", 200)
        
        # Create new school
        test_school = {
            "name": f"Test School {datetime.now().strftime('%H%M%S')}",
            "slug": f"test-school-{datetime.now().strftime('%H%M%S')}",
            "primary_color": "#FF6B6B",
            "secondary_color": "#4ECDC4"
        }
        
        success, created_school = self.run_test(
            "Create new school",
            "POST",
            "schools",
            200,
            data=test_school
        )
        
        school_id = None
        if success and isinstance(created_school, dict):
            school_id = created_school.get('id')
            print(f"    Created school ID: {school_id}")
            
            # Get specific school
            self.run_test("Get specific school", "GET", f"schools/{school_id}", 200)
        
        # Test invalid school ID
        self.run_test("Get non-existent school", "GET", "schools/invalid-id", 404)
        
        # Clean up - delete test school
        if school_id:
            self.run_test("Delete test school", "DELETE", f"schools/{school_id}", 200)
        
        return school_id

    def test_pages_crud(self):
        """Test pages CRUD operations"""
        print("\n📄 Testing Pages CRUD")
        
        # Create a test school first for pages
        test_school = {
            "name": f"Page Test School {datetime.now().strftime('%H%M%S')}",
            "slug": f"page-test-school-{datetime.now().strftime('%H%M%S')}"
        }
        
        success, created_school = self.run_test(
            "Create school for pages test",
            "POST",
            "schools",
            200,
            data=test_school
        )
        
        if not success:
            print("❌ Cannot test pages - school creation failed")
            return False
            
        school_id = created_school.get('id')
        
        # Create test page
        test_page = {
            "school_id": school_id,
            "name": "Test Home Page",
            "slug": "home",
            "components": [
                {
                    "type": "hero",
                    "props": {
                        "title": "Test Hero Title",
                        "subtitle": "Test subtitle"
                    },
                    "order": 0
                }
            ]
        }
        
        success, created_page = self.run_test(
            "Create new page",
            "POST",
            "pages",
            200,
            data=test_page
        )
        
        page_id = None
        if success and isinstance(created_page, dict):
            page_id = created_page.get('id')
            print(f"    Created page ID: {page_id}")
            
            # Get specific page
            self.run_test("Get specific page", "GET", f"pages/{page_id}", 200)
            
            # Update page
            update_data = {
                "name": "Updated Page Name",
                "is_published": True
            }
            self.run_test("Update page", "PUT", f"pages/{page_id}", 200, data=update_data)
            
            # Get pages for school
            self.run_test("Get pages for school", "GET", "pages", 200, params={"school_id": school_id})
        
        # Get all pages
        self.run_test("Get all pages", "GET", "pages", 200)
        
        # Test invalid page ID
        self.run_test("Get non-existent page", "GET", "pages/invalid-id", 404)
        
        # Clean up
        if page_id:
            self.run_test("Delete test page", "DELETE", f"pages/{page_id}", 200)
        if school_id:
            self.run_test("Delete test school", "DELETE", f"schools/{school_id}", 200)
        
        return True

    def test_templates(self):
        """Test template endpoints"""
        print("\n🧩 Testing Component Templates")
        
        success, templates = self.run_test("Get component templates", "GET", "templates/components", 200)
        
        if success and isinstance(templates, dict):
            widgets = templates.get('widgets', [])
            categories = templates.get('categories', [])
            print(f"    Found {len(widgets)} widgets and {len(categories)} categories")
            
            # Verify essential widget types exist
            widget_types = [w.get('type') for w in widgets]
            essential_types = ['hero', 'text', 'heading', 'image', 'button']
            
            for widget_type in essential_types:
                if widget_type in widget_types:
                    print(f"    ✅ {widget_type} widget available")
                else:
                    print(f"    ❌ {widget_type} widget missing")
                    
        return success

    def test_seed_data(self):
        """Test seed data functionality"""
        print("\n🌱 Testing Seed Data")
        
        # Test seeding
        success, response = self.run_test("Seed demo data", "POST", "seed", 200)
        
        if success:
            print("    ✅ Demo data seeded successfully")
            
            # Verify demo school exists
            success, schools = self.run_test("Get schools after seeding", "GET", "schools", 200)
            if success and isinstance(schools, list):
                demo_school = next((s for s in schools if s.get('id') == 'demo-school-1'), None)
                if demo_school:
                    print("    ✅ Demo school found: Sunshine Elementary")
                else:
                    print("    ❌ Demo school not found after seeding")
                    
        return success

    def test_api_root(self):
        """Test API root endpoint"""
        print("\n🏠 Testing API Root")
        success, response = self.run_test("API Root", "GET", "", 200)
        
        if success and isinstance(response, dict):
            if response.get('message') and 'CMS' in response.get('message', ''):
                print("    ✅ API root response is valid")
            else:
                print(f"    ⚠️ Unexpected root response: {response}")
                
        return success

def main():
    print("🚀 Starting CleverCampus CMS API Tests")
    print("=" * 50)
    
    tester = CMS_API_Tester()
    
    # Test sequence
    tests = [
        ("API Root", tester.test_api_root),
        ("Authentication", tester.test_auth_flow),
        ("Seed Data", tester.test_seed_data),
        ("Component Templates", tester.test_templates),
        ("Schools CRUD", tester.test_schools_crud),
        ("Pages CRUD", tester.test_pages_crud),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} test crashed: {str(e)}")
            tester.failed_tests.append({
                "test": test_name,
                "error": f"Test crashed: {str(e)}"
            })
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 FINAL TEST RESULTS")
    print("=" * 50)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / max(tester.tests_run, 1)) * 100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS ({len(tester.failed_tests)}):")
        for i, test in enumerate(tester.failed_tests, 1):
            print(f"  {i}. {test.get('test', 'Unknown')} - {test.get('error', 'No details')}")
    else:
        print("\n✅ ALL TESTS PASSED!")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
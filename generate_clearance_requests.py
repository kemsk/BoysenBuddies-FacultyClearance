#!/usr/bin/env python
"""
Generate clearance requests for faculty entries 5-34 from the 2501 Faculty Clearance CSV
"""
import os
import sys
import django
from datetime import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'XUFC.settings')
django.setup()

from FC.models import (
    User, Faculty, ClearanceRequest, ClearanceTimeline, 
    Requirement, College, Department, Office, ApproverFlowConfig, ApproverFlowStep,
    Role, UserRole
)

def get_or_create_college(college_name):
    """Get or create a college"""
    college, _ = College.objects.get_or_create(
        name=college_name,
        defaults={'is_active': True}
    )
    return college

def get_or_create_department(college, dept_name):
    """Get or create a department"""
    department, _ = Department.objects.get_or_create(
        college=college,
        name=dept_name,
        defaults={'is_active': True}
    )
    return department

def get_or_create_office(office_name):
    """Get or create an office"""
    office, _ = Office.objects.get_or_create(
        name=office_name,
        defaults={'is_active': True}
    )
    return office

def get_or_create_user(email, university_id, first_name, middle_name, last_name):
    """Get or create a user"""
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'university_id': university_id,
            'first_name': first_name,
            'middle_name': middle_name,
            'last_name': last_name
        }
    )
    return user

def get_or_create_faculty(user, first_name, middle_name, last_name, faculty_type, college, department, office):
    """Get or create a faculty"""
    faculty, created = Faculty.objects.get_or_create(
        user=user,
        defaults={
            'first_name': first_name,
            'middle_name': middle_name,
            'last_name': last_name,
            'faculty_type': faculty_type,
            'college': college,
            'department': department,
            'office': office
        }
    )
    return faculty

def get_active_clearance_timeline():
    """Get the currently active clearance timeline"""
    timeline = ClearanceTimeline.objects.filter(is_active=True).first()
    if not timeline:
        raise Exception("No active clearance timeline found. Please ensure there is an active timeline in the system.")
    return timeline

def get_existing_approver_flow():
    """Get existing approver flow configuration and steps"""
    config = ApproverFlowConfig.objects.first()
    if not config:
        raise Exception("No approver flow configuration found. Please run the entrypoint script first.")
    
    steps = ApproverFlowStep.objects.filter(config=config).order_by('order')
    if not steps.exists():
        raise Exception("No approver flow steps found. Please run the entrypoint script first.")
    
    return config, steps

def create_requirement(timeline, title, approver_step):
    """Create a requirement with proper recipient scope"""
    # Determine recipient scope based on approver flow step
    if approver_step.office:
        # Office-based requirement
        recipient_scope = 'office'
        description = f'Requirement for {title} - {approver_step.office.name}'
    elif approver_step.category == "Department Chair":
        # Department Chair requirement - should be department-scoped
        recipient_scope = 'department'
        description = f'Requirement for {title} - All Departments'
    else:
        # College Dean requirement - should be college-scoped
        recipient_scope = 'college'
        description = f'Requirement for {title} - All Colleges'
    
    requirement, created = Requirement.objects.get_or_create(
        title=title,
        clearance_timeline=timeline,
        defaults={
            'description': description,
            'is_active': True,
            'recipient_scope': recipient_scope,
            'approver_flow_step': approver_step
        }
    )
    
    # Set target recipients based on scope
    if created:
        if approver_step.office:
            # Office-based: link to the specific office
            requirement.target_offices.add(approver_step.office)
        elif recipient_scope == 'department':
            # Department-based: link to all departments
            from FC.models import Department
            all_departments = Department.objects.all()
            requirement.target_departments.set(all_departments)
        else:
            # College-based: link to all colleges (for College Dean clearance)
            from FC.models import College
            all_colleges = College.objects.all()
            requirement.target_colleges.set(all_colleges)
    
    return requirement

def generate_request_id(faculty, requirement, index):
    """Generate unique request ID"""
    year = datetime.now().year
    university_id = faculty.user.university_id.split('-')[-1] if '-' in faculty.user.university_id else faculty.user.university_id
    college_code = 'IT' if faculty.college and 'Computer' in faculty.college.name else 'GEN'
    return f"{year}-{university_id}-{college_code}-{index:03d}"

def create_faculty_users_and_profiles():
    """Create all faculty users and faculty profiles from the CSV data"""
    print("Creating faculty users and profiles...")
    
    # Faculty data from CSV lines 5-34
    faculty_data = [
        ("maria.santos@xu.edu.ph", "2024-000015", "Maria", "L.", "Santos", "Full-time", "College of Computer Studies", "Computer Science"),
        ("juan.cruz@xu.edu.ph", "2024-000016", "Juan", "P.", "Cruz", "Full-time", "College of Engineering", "Civil Engineering"),
        ("elena.reyes@xu.edu.ph", "2024-000017", "Elena", "M.", "Reyes", "Part-time", "College of Arts and Sciences", "English"),
        ("rodrigo.diaz@xu.edu.ph", "2024-000018", "Rodrigo", "", "Diaz", "Full-time", "School of Business and Management", "Accountancy"),
        ("carmela.torres@xu.edu.ph", "2024-000019", "Carmela", "J.", "Torres", "Full-time", "College of Arts and Sciences", "Biology"),
        ("antonio.de_la_rosa@xu.edu.ph", "2024-000020", "Antonio", "S.", "De la Rosa", "Part-time", "College of Computer Studies", "Information Technology"),
        ("patricia.lim@xu.edu.ph", "2024-000021", "Patricia", "", "Lim", "Full-time", "College of Arts and Sciences", "Psychology"),
        ("miguel.hernandez@xu.edu.ph", "2024-000022", "Miguel", "R.", "Hernandez", "Full-time", "College of Engineering", "Electrical Engineering"),
        ("sophia.chan@xu.edu.ph", "2024-000023", "Sophia", "", "Chan", "Part-time", "School of Business and Management", "Business and Administration"),
        ("daniel.garcia@xu.edu.ph", "2024-000024", "Daniel", "A.", "Garcia", "Full-time", "College of Arts and Sciences", "English"),
        ("isabella.mendoza@xu.edu.ph", "2024-000025", "Isabella", "L.", "Mendoza", "Full-time", "College of Computer Studies", "Computer Science"),
        ("carlos.paredes@xu.edu.ph", "2024-000026", "Carlos", "", "Paredes", "Part-time", "College of Arts and Sciences", "Biology"),
        ("angelica.flores@xu.edu.ph", "2024-000027", "Angelica", "M.", "Flores", "Full-time", "College of Engineering", "Mechanical Engineering"),
        ("jose.ramos@xu.edu.ph", "2024-000028", "Jose", "P.", "Ramos", "Full-time", "College of Arts and Sciences", "Chemistry"),
        ("katherine.ong@xu.edu.ph", "2024-000029", "Katherine", "", "Ong", "Part-time", "School of Business and Management", "Accountancy"),
        ("francisco.vargas@xu.edu.ph", "2024-000030", "Francisco", "S.", "Vargas", "Full-time", "College of Arts and Sciences", "Development Communications"),
        ("lucia.santillan@xu.edu.ph", "2024-000031", "Lucia", "A.", "Santillan", "Full-time", "College of Computer Studies", "Information Technology"),
        ("ricardo.morales@xu.edu.ph", "2024-000032", "Ricardo", "", "Morales", "Part-time", "College of Arts and Sciences", "Chemistry"),
        ("monica.salazar@xu.edu.ph", "2024-000033", "Monica", "J.", "Salazar", "Full-time", "College of Engineering", "Chemical Engineering"),
        ("eduardo.romero@xu.edu.ph", "2024-000034", "Eduardo", "L.", "Romero", "Full-time", "School of Business and Management", "Business and Administration"),
        ("teresa.aguilar@xu.edu.ph", "2024-000035", "Teresa", "", "Aguilar", "Part-time", "College of Arts and Sciences", "Psychology"),
        ("luis.fernandez@xu.edu.ph", "2024-000036", "Luis", "M.", "Fernandez", "Full-time", "College of Arts and Sciences", "International Studies"),
        ("raquel.del_rosario@xu.edu.ph", "2024-000037", "Raquel", "A.", "Del Rosario", "Full-time", "College of Computer Studies", "Computer Science"),
        ("benjamin.castillo@xu.edu.ph", "2024-000038", "Benjamin", "", "Castillo", "Part-time", "College of Arts and Sciences", "Physics"),
        ("diana.pascual@xu.edu.ph", "2024-000039", "Diana", "L.", "Pascual", "Full-time", "College of Engineering", "Computer Engineering"),
        ("alejandro.reyes@xu.edu.ph", "2024-000040", "Alejandro", "S.", "Reyes", "Full-time", "School of Business and Management", "Accountancy"),
        ("constance.santos@xu.edu.ph", "2024-000041", "Constance", "", "Santos", "Part-time", "College of Arts and Sciences", "Philosophy"),
        ("gabriel.mendoza@xu.edu.ph", "2024-000042", "Gabriel", "J.", "Mendoza", "Full-time", "College of Arts and Sciences", "General Education & Integrated Discipline Studies"),
        ("vanessa.lim@xu.edu.ph", "2024-000043", "Vanessa", "A.", "Lim", "Full-time", "College of Computer Studies", "Information Technology"),
        ("jorge.tan@xu.edu.ph", "2024-000044", "Jorge", "", "Tan", "Part-time", "College of Arts and Sciences", "Math")
    ]
    
    # Get Faculty role
    faculty_role = Role.objects.get(name='Faculty')
    
    faculty_list = []
    for i, (email, university_id, first_name, middle_name, last_name, faculty_type, college_name, dept_name) in enumerate(faculty_data):
        print(f"Creating faculty {i+1}/30: {first_name} {last_name}")
        
        # Create or get college and department
        college = get_or_create_college(college_name)
        department = get_or_create_department(college, dept_name)
        # Don't create office from college - offices should be separate entities
        office = None
        
        # Create or get user
        user = get_or_create_user(email, university_id, first_name, middle_name, last_name)
        
        # Assign Faculty role if not already assigned
        UserRole.objects.get_or_create(
            user=user,
            role=faculty_role,
            defaults={'assigned_by': user, 'is_active': True}
        )
        
        # Create or get faculty profile
        faculty = get_or_create_faculty(user, first_name, middle_name, last_name, faculty_type, college, department, office)
        faculty_list.append(faculty)
    
    print(f"Created {len(faculty_list)} faculty users and profiles")
    return faculty_list

def main():
    # Step 1: Create all faculty users and profiles first
    faculty_list = create_faculty_users_and_profiles()
    
    # Step 2: Get active clearance timeline and existing approver flow
    print("\nGetting active clearance timeline and existing approver flow...")
    timeline = get_active_clearance_timeline()
    print(f"Using active timeline: {timeline.name}")
    
    # Get existing approver flow configuration and steps
    config, approver_steps = get_existing_approver_flow()
    print(f"Found {len(approver_steps)} approver flow steps")
    
    # Step 3: Create proper requirements linked to approver flow steps
    requirements = []
    requirement_mappings = [
        ("Department Chair Clearance", "Department Chair"),
        ("College Dean Clearance", "College Dean"),
        ("University Registrar Clearance", "University Registrar"),
        ("Library Clearance", "University Library"),
        ("OVPHE Clearance", "Office of the Vice President for Higher Education"),
        ("HR Clearance", "Human Resources Office")
    ]
    
    for req_title, step_category in requirement_mappings:
        # Find the corresponding approver flow step
        step = approver_steps.filter(category=step_category).first()
        if step:
            req = create_requirement(timeline, req_title, step)
            requirements.append(req)
            print(f"  Created requirement: {req_title} -> {step.category}")
        else:
            print(f"  Warning: No approver flow step found for {step_category}")
    
    print(f"Created {len(requirements)} requirements")
    
    # Step 4: Generate clearance requests for all faculty
    request_count = 1
    
    for i, faculty in enumerate(faculty_list):
        print(f"\nGenerating requests for faculty {i+1}/30: {faculty.first_name} {faculty.last_name}")
        
        # Create clearance requests for each requirement
        for req in requirements:
            request_id = generate_request_id(faculty, req, request_count)
            
            clearance_request, created = ClearanceRequest.objects.get_or_create(
                request_id=request_id,
                defaults={
                    'faculty': faculty,
                    'requirement': req,
                    'clearance_timeline': timeline,
                    'submission_notes': 'N',
                    'submission_link': '',
                    'status': 'PENDING',
                    'remarks': ''
                }
            )
            
            if created:
                print(f"  Created request: {request_id}")
                request_count += 1
            else:
                print(f"  Request already exists: {request_id}")
    
    print(f"\nSummary:")
    print(f"  Processed {len(faculty_list)} faculty members")
    print(f"  Created {len(requirements)} requirements")
    print(f"  Generated {request_count - 1} clearance requests")
    
    # Display sample output in requested format
    print(f"\nSample clearance requests:")
    print("| id | request_id              | submission_notes | submission_link | status  | submitted_date             | approved_date | remarks | clearance_timeline_id | faculty_id | requirement_id | approved_by_id |")
    print("+----+-------------------------+------------------+-----------------+---------+----------------------------+---------------+---------+-----------------------+------------+----------------+----------------+")
    
    sample_requests = ClearanceRequest.objects.all()[:10]
    for req in sample_requests:
        print(f"| {req.id:2d} | {req.request_id:23s} | {req.submission_notes:16s} | {req.submission_link:15s} | {req.status:7s} | {req.submitted_date.strftime('%Y-%m-%d %H:%M:%S.%f') if req.submitted_date else 'NULL':26s} | {'NULL':13s} | {req.remarks:7s} | {req.clearance_timeline_id:23d} | {req.faculty_id:10d} | {req.requirement_id:14d} | {'NULL':13s} |")

if __name__ == "__main__":
    main()

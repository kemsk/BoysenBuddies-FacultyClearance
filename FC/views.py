from datetime import datetime
import os
import secrets
import requests as http_requests
from urllib.parse import urlencode
from dotenv import load_dotenv
from google.oauth2 import id_token
import google.auth.transport.requests as google_requests
import hashlib
import base64

from django.db import models
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_protect
from django.utils import timezone

from .models import *

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

def dashboard_view(request):
    # Return dashboard data as JSON for React frontend
    if request.session.get('user_authenticated'):
        from .decorators import ROLE_MAPPING
        role_value = request.session.get('user_role_value')
        return JsonResponse({
            'success': True,
            'message': 'Dashboard access granted',
            'user_info': {
                'id': request.session.get('user_id'),
                'email': request.session.get('user_email'),
                'role_value': role_value,
                'role_name': ROLE_MAPPING.get(role_value, 'Unknown'),
                'first_name': request.session.get('user_first_name'),
                'last_name': request.session.get('user_last_name')
            }
        })
    else:
        return JsonResponse({
            'success': False,
            'message': 'Authentication required',
            'redirect': '/login'
        }, status=401)


def ciso_profile_api(request):
    ciso_admin = (
        SystemAdmin.objects.select_related("user")
        .filter(admin_role=SystemAdmin.AdminRole.CISO, is_active=True)
        .first()
    )

    if not ciso_admin:
        return JsonResponse({"detail": "CISO user not found"}, status=404)

    user = ciso_admin.user
    return JsonResponse(
        {
            "email": user.email,
            "university_id": user.university_id,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "role": ciso_admin.admin_role,
        }
    )


def ovphe_profile_api(request):
    ovphe_admin = (
        SystemAdmin.objects.select_related("user")
        .filter(admin_role=SystemAdmin.AdminRole.OVPHE, is_active=True)
        .first()
    )

    if not ovphe_admin:
        return JsonResponse({"detail": "OVPHE user not found"}, status=404)

    user = ovphe_admin.user
    return JsonResponse(
        {
            "email": user.email,
            "university_id": user.university_id,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "role": ovphe_admin.admin_role,
        }
    )


def _get_active_ovphe_admin():
    return (
        SystemAdmin.objects.select_related("user")
        .filter(admin_role=SystemAdmin.AdminRole.OVPHE, is_active=True)
        .first()
    )


def _get_active_ciso_admin():
    return (
        SystemAdmin.objects.select_related("user")
        .filter(admin_role=SystemAdmin.AdminRole.CISO, is_active=True)
        .first()
    )


def _format_timestamp(dt: datetime | None):
    if not dt:
        return ""
    local = timezone.localtime(dt)
    try:
        return local.strftime("%B %-d, %Y, %-I:%M %p")
    except Exception:
        return local.strftime("%B %d, %Y, %I:%M %p")


def _format_time_label(dt: datetime):
    try:
        return dt.strftime("%-I:%M %p")
    except Exception:
        return dt.strftime("%I:%M %p").lstrip("0")


def _term_to_label(term: str | None):
    if term == Clearance.Term.FIRST:
        return "First Semester"
    if term == Clearance.Term.SECOND:
        return "Second Semester"
    if term == Clearance.Term.INTERSESSION:
        return "Intersession"
    return ""


def ovphe_system_guidelines_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    guidelines = SystemGuideline.objects.select_related("created_by").order_by("-created_at", "-id")
    items = []
    for g in guidelines:
        items.append(
            {
                "id": g.id,
                "title": g.title or "",
                "description": g.body or "",
                "email": g.created_by.email if g.created_by else "",
                "timestamp": _format_timestamp(g.created_at),
                "enabled": bool(g.is_active),
            }
        )
    return JsonResponse({"items": items})


def ovphe_announcements_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    announcements = Announcement.objects.order_by("-created_at", "-id")
    items = []
    for a in announcements:
        items.append(
            {
                "id": a.id,
                "title": a.title or "",
                "description": a.body or "",
                "timestamp": _format_timestamp(a.created_at),
                "pinned": bool(a.pin_announcement),
                "enabled": bool(a.is_active),
            }
        )
    return JsonResponse({"items": items})


def ovphe_clearance_timelines_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    timelines = ClearanceTimeline.objects.order_by("-is_active", "-academic_year", "-id")
    items = []
    for t in timelines:
        start_year = str(t.academic_year or "")
        end_year = str((t.academic_year + 1) if t.academic_year else "")
        items.append(
            {
                "id": str(t.id),
                "startYear": start_year,
                "endYear": end_year,
                "semester": _term_to_label(t.term),
                "semesterStartDate": t.term_start_date.isoformat() if t.term_start_date else "",
                "semesterEndDate": t.term_end_date.isoformat() if t.term_end_date else "",
                "clearanceStartDate": t.clearance_start_date.isoformat() if t.clearance_start_date else "",
                "clearanceEndDate": t.clearance_end_date.isoformat() if t.clearance_end_date else "",
                "setAsActive": bool(t.is_active),
                "createdAt": _format_timestamp(t.created_at),
            }
        )
    return JsonResponse({"items": items})


def ovphe_org_structure_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    colleges = list(College.objects.order_by("name").values("id", "name", "abbreviation"))
    departments = list(
        Department.objects.select_related("college")
        .order_by("college__name", "name")
        .values("id", "college_id", "name", "abbreviation")
    )
    offices = list(Office.objects.order_by("name").values("id", "name", "abbreviation"))

    return JsonResponse(
        {
            "colleges": [
                {"id": str(c["id"]), "name": c["name"], "short": c["abbreviation"] or ""}
                for c in colleges
            ],
            "departments": [
                {
                    "id": str(d["id"]),
                    "collegeId": str(d["college_id"]),
                    "name": d["name"],
                    "short": d["abbreviation"] or "",
                }
                for d in departments
            ],
            "offices": [
                {"id": str(o["id"]), "name": o["name"], "short": o["abbreviation"] or ""}
                for o in offices
            ],
        }
    )


def ovphe_approver_flow_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    admin = _get_active_ovphe_admin()
    if not admin:
        return JsonResponse({"detail": "OVPHE user not found"}, status=404)

    config = ApproverFlowConfig.objects.order_by("-updated_at", "-id").first()
    if not config:
        config = ApproverFlowConfig.objects.create(created_by=admin)

    steps = config.steps.prefetch_related("colleges").all()
    return JsonResponse(
        {
            "id": str(config.id),
            "steps": [
                {
                    "id": str(s.id),
                    "category": s.category,
                    "collegeIds": [str(c.id) for c in s.colleges.all()],
                }
                for s in steps
            ],
        }
    )


def ovphe_notifications_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    admin = _get_active_ovphe_admin()
    if not admin:
        return JsonResponse({"detail": "OVPHE user not found"}, status=404)

    qs = Notification.objects.filter(user=admin.user).order_by("-created_at", "-id")
    items = []
    for n in qs:
        items.append(
            {
                "id": str(n.id),
                "title": n.title or "",
                "status": n.status,
                "details": list(n.details or []),
                "timestamp": _format_timestamp(n.created_at),
                "is_read": bool(n.is_read),
            }
        )
    return JsonResponse({"items": items})


def ovphe_system_analytics_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    academic_year = request.GET.get("academic_year")
    term = request.GET.get("term")
    college_id = request.GET.get("college_id")

    qs = SystemAnalytics.objects.select_related("college").all()
    if academic_year:
        qs = qs.filter(academic_year=academic_year)
    if term:
        qs = qs.filter(term=term)
    if college_id:
        qs = qs.filter(college_id=college_id)

    rows = []
    for a in qs.order_by("college__name"):
        rows.append(
            {
                "collegeId": str(a.college_id) if a.college_id else "",
                "collegeName": a.college.name if a.college else "",
                "completionRate": float(a.completion_rate or 0),
                "academicYear": a.academic_year,
                "term": a.term,
            }
        )
    return JsonResponse({"rows": rows})


def ovphe_activity_logs_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    q = (request.GET.get("query") or "").strip().lower()
    page = int(request.GET.get("page") or 1)
    page_size = int(request.GET.get("pageSize") or 40)

    qs = ActivityLog.objects.select_related("actor_user", "actor_admin", "faculty", "requirement").all()
    if q:
        qs = qs.filter(
            models.Q(event_type__icontains=q)
            | models.Q(approver_department__icontains=q)
            | models.Q(university_id__icontains=q)
            | models.Q(request_id__icontains=q)
            | models.Q(actor_user__email__icontains=q)
            | models.Q(actor_user__first_name__icontains=q)
            | models.Q(actor_user__last_name__icontains=q)
        )

    total = qs.count()
    start = max(0, (page - 1) * page_size)
    logs = qs.order_by("-created_at", "-id")[start : start + page_size]

    items = []
    for log in logs:
        dt = timezone.localtime(log.created_at)
        items.append(
            {
                "id": str(log.id),
                "dateLabel": dt.strftime("%m/%d/%Y"),
                "timeLabel": _format_time_label(dt),
                "variant": log.event_type,
                "actorFirstName": (log.actor_user.first_name if log.actor_user else "")
                or (log.actor_admin.user.first_name if log.actor_admin else ""),
                "actorLastName": (log.actor_user.last_name if log.actor_user else "")
                or (log.actor_admin.user.last_name if log.actor_admin else ""),
                "approverDepartment": log.approver_department or "",
                "facultyFirstName": log.faculty.first_name if log.faculty else "",
                "facultyLastName": log.faculty.last_name if log.faculty else "",
                "universityId": log.university_id or "",
                "requestId": log.request_id or "",
                "requirementTitle": log.requirement.title if log.requirement else "",
                "details": list(log.details or []),
            }
        )

    return JsonResponse({"items": items, "total": total})


def ciso_system_guidelines_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    guidelines = SystemGuideline.objects.select_related("created_by").order_by("-created_at", "-id")
    items = []
    for g in guidelines:
        items.append(
            {
                "id": g.id,
                "title": g.title or "",
                "description": g.body or "",
                "email": g.created_by.email if g.created_by else "",
                "timestamp": _format_timestamp(g.created_at),
                "enabled": bool(g.is_active),
            }
        )
    return JsonResponse({"items": items})


def ciso_announcements_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    announcements = Announcement.objects.order_by("-created_at", "-id")
    items = []
    for a in announcements:
        items.append(
            {
                "id": a.id,
                "title": a.title or "",
                "description": a.body or "",
                "timestamp": _format_timestamp(a.created_at),
                "pinned": bool(a.pin_announcement),
                "enabled": bool(a.is_active),
            }
        )
    return JsonResponse({"items": items})


def ciso_notifications_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    admin = _get_active_ciso_admin()
    if not admin:
        return JsonResponse({"detail": "CISO user not found"}, status=404)

    qs = Notification.objects.filter(user=admin.user).order_by("-created_at", "-id")
    items = []
    for n in qs:
        items.append(
            {
                "id": str(n.id),
                "title": n.title or "",
                "status": n.status,
                "details": list(n.details or []),
                "timestamp": _format_timestamp(n.created_at),
                "is_read": bool(n.is_read),
            }
        )
    return JsonResponse({"items": items})


def ciso_activity_logs_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    admin = _get_active_ciso_admin()
    if not admin:
        return JsonResponse({"detail": "CISO user not found"}, status=404)

    q = (request.GET.get("query") or "").strip().lower()
    page = int(request.GET.get("page") or 1)
    page_size = int(request.GET.get("pageSize") or 40)

    qs = ActivityLog.objects.select_related("actor_user", "actor_admin", "faculty", "requirement").filter(
        models.Q(actor_admin=admin) | models.Q(actor_user=admin.user)
    )
    if q:
        qs = qs.filter(
            models.Q(event_type__icontains=q)
            | models.Q(approver_department__icontains=q)
            | models.Q(university_id__icontains=q)
            | models.Q(request_id__icontains=q)
            | models.Q(actor_user__email__icontains=q)
            | models.Q(actor_user__first_name__icontains=q)
            | models.Q(actor_user__last_name__icontains=q)
        )

    total = qs.count()
    start = max(0, (page - 1) * page_size)
    logs = qs.order_by("-created_at", "-id")[start : start + page_size]

    items = []
    for log in logs:
        dt = timezone.localtime(log.created_at)
        items.append(
            {
                "id": str(log.id),
                "dateLabel": dt.strftime("%m/%d/%Y"),
                "timeLabel": _format_time_label(dt),
                "variant": log.event_type,
                "actorFirstName": (log.actor_user.first_name if log.actor_user else "")
                or (log.actor_admin.user.first_name if log.actor_admin else ""),
                "actorLastName": (log.actor_user.last_name if log.actor_user else "")
                or (log.actor_admin.user.last_name if log.actor_admin else ""),
                "approverDepartment": log.approver_department or "",
                "facultyFirstName": log.faculty.first_name if log.faculty else "",
                "facultyLastName": log.faculty.last_name if log.faculty else "",
                "universityId": log.university_id or "",
                "requestId": log.request_id or "",
                "requirementTitle": log.requirement.title if log.requirement else "",
                "details": list(log.details or []),
            }
        )

    return JsonResponse({"items": items, "total": total})


def ciso_system_users_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    def _full_name(u: User):
        parts = [(u.first_name or "").strip(), (u.middle_name or "").strip(), (u.last_name or "").strip()]
        parts = [p for p in parts if p]
        return " ".join(parts) if parts else u.email

    items = []

    admins = SystemAdmin.objects.select_related("user").filter(is_active=True).order_by("id")
    for a in admins:
        u = a.user
        items.append(
            {
                "id": str(u.id),
                "name": _full_name(u),
                "systemId": f"SYS-{u.id}",
                "userRole": "System Admin",
                "universityId": u.university_id or "",
                "college": "N/A",
                "department": a.admin_role,
                "email": u.email,
            }
        )

    approvers = (
        Approver.objects.select_related("user", "college", "department", "office")
        .filter(user__is_active=True)
        .order_by("id")
    )
    for ap in approvers:
        u = ap.user
        items.append(
            {
                "id": str(u.id),
                "name": _full_name(u),
                "systemId": f"SYS-{u.id}",
                "userRole": "Approver",
                "universityId": u.university_id or "",
                "college": ap.college.name if ap.college else "N/A",
                "department": (
                    ap.department.name
                    if ap.department
                    else (ap.office.name if ap.office else "N/A")
                ),
                "email": u.email,
            }
        )

    assistants = (
        StudentAssistant.objects.select_related("user", "college", "department")
        .filter(user__is_active=True)
        .order_by("id")
    )
    for sa in assistants:
        u = sa.user
        items.append(
            {
                "id": str(u.id),
                "name": _full_name(u),
                "systemId": f"SYS-{u.id}",
                "userRole": "Assistant Approver",
                "universityId": u.university_id or "",
                "college": sa.college.name if sa.college else "N/A",
                "department": sa.department.name if sa.department else "N/A",
                "email": u.email,
            }
        )

    return JsonResponse({"items": items})


# Authentication Helper Functions
def hash_password(value):
    salt = os.urandom(16)
    value_salt_combined = value.encode('utf-8') + salt
    hashed_value = hashlib.sha256(value_salt_combined).hexdigest()
    stored_hash = base64.b64encode(salt + hashed_value.encode('utf-8')).decode('utf-8')
    return stored_hash

def verify_password(stored_hash, input_value):
    decoded = base64.b64decode(stored_hash)
    salt = decoded[:16]
    stored_hashed_value = decoded[16:].decode('utf-8')
    value_salt_combined = input_value.encode('utf-8') + salt
    hashed_input_value = hashlib.sha256(value_salt_combined).hexdigest()
    return hashed_input_value == stored_hashed_value

# Authentication Views
@csrf_protect
def login_view(request):
    if request.method == 'POST':
        # Check if this is an API request (from React frontend)
        is_api = request.headers.get('Content-Type') == 'application/json'
        
        if is_api:
            import json
            data = json.loads(request.body)
        else:
            data = request.POST

        # Step 1: Handle Email + Password
        if data.get('email') and data.get('password'):
            email = data.get('email')
            password = data.get('password')

            try:
                user = User.objects.get(email=email)

                if user.check_password(password):
                    request.session['temp_user_id'] = user.id
                    request.session['user_email'] = user.email
                    request.session['user_role_value'] = user.role_value
                    request.session['user_authenticated'] = True
                    request.session.modified = True

                    return JsonResponse({
                            'success': True,
                            'message': 'Password verified. Please enter PIN.',
                            'requires_pin': True,
                            'user_info': {
                                'email': user.email,
                                'first_name': user.first_name,
                                'last_name': user.last_name
                            }
                        })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Invalid email or password.'
                    }, status=401)
            except User.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'User not found.'
                }, status=404)

        # Step 2: Handle PIN
        elif request.session.get('temp_user_id') and data.get('user_pin'):
            entered_pin = data.get('user_pin')
            stored_user_id = request.session.get('temp_user_id')
            
            try:
                user = User.objects.get(id=stored_user_id)
                
                if hasattr(user, 'user_pin') and verify_password(user.user_pin, entered_pin):
                    # Save permanent session data
                    request.session['user_authenticated'] = True
                    request.session['user_id'] = user.id
                    request.session['user_email'] = user.email
                    request.session['user_role_value'] = user.role_value
                    request.session['user_first_name'] = user.first_name
                    request.session['user_last_name'] = user.last_name
                    # Remove temp session key
                    request.session.pop('temp_user_id', None)
                    request.session.modified = True

                    from .decorators import get_role_dashboard_url
                    return JsonResponse({
                        'success': True,
                        'message': 'Login successful!',
                        'user_info': {
                            'id': user.id,
                            'email': user.email,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'role_value': user.role_value,
                            'role_name': user.get_role_value_display(),
                            'university_id': user.university_id,
                            'dashboard_url': get_role_dashboard_url(user.role_value)
                        }
                    })
                else:
                    return JsonResponse({
                        'success': False,
                        'message': 'Invalid PIN.'
                    }, status=401)
            except User.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'User not found.'
                }, status=404)
        
        if is_api:
            return JsonResponse({
                'success': False,
                'message': 'Invalid request.'
            }, status=400)
        else:
            return redirect('fc:login')

    # Handle GET requests - API only since React frontend is used
    if request.session.get('user_authenticated'):
        from .decorators import ROLE_MAPPING
        role_value = request.session.get('user_role_value')
        return JsonResponse({
            'authenticated': True,
            'user_info': {
                'email': request.session.get('user_email'),
                'role_value': role_value,
                'role_name': ROLE_MAPPING.get(role_value, 'Unknown'),
                'first_name': request.session.get('user_first_name'),
                'last_name': request.session.get('user_last_name')
            }
        })
    else:
        return JsonResponse({
            'authenticated': False,
            'user_info': None
        })


def google_login(request):
    state = secrets.token_urlsafe(32)
    request.session['google_oauth_state'] = state
    request.session.modified = True

    params = {
        'client_id': GOOGLE_CLIENT_ID,
        'redirect_uri': GOOGLE_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'offline',
        'prompt': 'select_account consent',
        'state': state
    }
    google_auth_url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urlencode(params)
    return redirect(google_auth_url)


def google_callback(request):
    returned_state = request.GET.get('state')
    expected_state = request.session.pop('google_oauth_state', None)

    if not expected_state or not returned_state or returned_state != expected_state:
        return JsonResponse({
            'success': False,
            'message': 'Invalid or missing state. Possible CSRF attack.'
        }, status=400)

    code = request.GET.get('code')
    if not code:
        return JsonResponse({
            'success': False,
            'message': 'Authorization failed. No code provided.'
        }, status=400)

    token_url = 'https://oauth2.googleapis.com/token'
    data = {
        'code': code,
        'client_id': os.getenv('GOOGLE_CLIENT_ID'),
        'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
        'redirect_uri': os.getenv('GOOGLE_REDIRECT_URI'),
        'grant_type': 'authorization_code',
    }

    try:
        response = http_requests.post(token_url, data=data, timeout=10)
        response.raise_for_status()
        token_info = response.json()
    except http_requests.exceptions.RequestException as e:
        return JsonResponse({
            'success': False,
            'message': f"Failed to connect to Google: {str(e)}"
        }, status=500)

    id_token_jwt = token_info.get('id_token')
    if not id_token_jwt:
        return JsonResponse({
            'success': False,
            'message': "No ID token received from Google."
        }, status=400)

    try:
        user_data = id_token.verify_oauth2_token(
            id_token_jwt,
            google_requests.Request(),
            audience=os.getenv('GOOGLE_CLIENT_ID')
        )

        if not user_data['iss'].endswith("accounts.google.com"):
            raise ValueError(f"Issuer not allowed: {user_data['iss']}")

    except ValueError as e:
        return JsonResponse({
            'success': False,
            'message': f"Invalid ID token: {e}"
        }, status=400)

    email = user_data.get('email')
    if not email:
        return JsonResponse({
            'success': False,
            'message': "Google did not return an email address."
        }, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': "This Google account is not registered in our system."
        }, status=404)

    # Set Session Data
    request.session['user_authenticated'] = True
    request.session['user_id'] = user.id
    request.session['user_email'] = user.email
    request.session['user_role_value'] = user.role_value
    request.session['user_first_name'] = user.first_name
    request.session['user_last_name'] = user.last_name
    request.session.modified = True

    from .decorators import get_role_dashboard_url
    return JsonResponse({
        'success': True,
        'message': 'Google login successful!',
        'user_info': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role_value': user.role_value,
            'role_name': user.get_role_value_display(),
            'university_id': user.university_id,
            'dashboard_url': get_role_dashboard_url(user.role_value)
        }
    })


def sso_login(request):
    """
    Handle SSO login requests
    This can be integrated with institutional SSO systems like SAML, LDAP, or other identity providers
    """
    if request.method == 'POST':
        import json
        data = json.loads(request.body) if request.headers.get('Content-Type') == 'application/json' else request.POST

        # Get SSO token or credentials from request
        sso_token = data.get('sso_token')
        sso_provider = data.get('sso_provider', 'default')
        
        if not sso_token:
            return JsonResponse({
                'success': False,
                'message': 'SSO token is required.'
            }, status=400)

        try:
            # TODO: Implement actual SSO verification logic here
            # This would depend on your SSO provider (SAML, LDAP, ADFS, etc.)
            # For now, we'll simulate SSO verification
            
            # Example SSO verification (replace with actual implementation):
            # user_info = verify_sso_token(sso_token, sso_provider)
            # user = User.objects.get(email=user_info['email'])
            
            # For demonstration, we'll use a mock user lookup
            # In production, this should be replaced with actual SSO verification
            user = User.objects.filter(email__endswith='@xu.edu.ph').first()
            
            if not user:
                return JsonResponse({
                    'success': False,
                    'message': 'User not found in system.'
                }, status=404)

            # Set session data for SSO login
            request.session['user_authenticated'] = True
            request.session['user_id'] = user.id
            request.session['user_email'] = user.email
            request.session['user_role_value'] = user.role_value
            request.session['user_first_name'] = user.first_name
            request.session['user_last_name'] = user.last_name
            request.session['sso_provider'] = sso_provider
            request.session.modified = True

            from .decorators import get_role_dashboard_url
            return JsonResponse({
                'success': True,
                'message': 'SSO login successful!',
                'user_info': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role_value': user.role_value,
                    'role_name': user.get_role_value_display(),
                    'university_id': user.university_id,
                    'dashboard_url': get_role_dashboard_url(user.role_value)
                }
            })

        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'SSO login failed: {str(e)}'
            }, status=500)
    
    # Handle GET request - return SSO login info
    return JsonResponse({
        'message': 'SSO login endpoint. POST with sso_token to authenticate.',
        'supported_providers': ['saml', 'ldap', 'adfs', 'azure', 'default']
    })


def serve_react_app(request):
    """
    Serve the React frontend application
    This view serves the React app for all non-API routes
    """
    from django.http import HttpResponse
    import os
    
    # Path to the React build index.html
    react_build_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Frontend', 'build', 'index.html')
    
    try:
        with open(react_build_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    except FileNotFoundError:
        return HttpResponse("""
        <html>
            <head><title>XU Faculty Clearance</title></head>
            <body>
                <h1>XU Faculty Clearance System</h1>
                <p>React frontend not built yet. Please run:</p>
                <pre>cd Frontend && npm run build</pre>
            </body>
        </html>
        """, content_type='text/html')


def logout_view(request):
    request.session.flush()
    
    return JsonResponse({
        'success': True,
        'message': 'Logged out successfully.'
    })

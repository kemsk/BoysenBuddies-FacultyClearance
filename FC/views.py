from django.shortcuts import render, HttpResponseRedirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.db import transaction
from django.db.models import Q, Count, Sum, Avg, Max, Min, Prefetch
from django.core.paginator import Paginator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
import json
import logging
import os
import secrets
import urllib.request
import urllib.error
import io
import csv
from urllib.parse import urlencode
from datetime import datetime, timedelta
from decimal import Decimal
from .decorators import (
    login_required, role_required, ciso_required, ovphe_required, 
    approver_required, assistant_required, faculty_required
)
from .models import *
from .jwt_utils import generate_jwt_token


def _json_error(detail: str, status: int = 400):
    return JsonResponse({"detail": detail}, status=status)


def _normalize_email(value: str | None) -> str:
    return (value or "").strip().lower()


def _login(request, user):
    """Login function that doesn't use Django auth"""
    from .decorators import get_role_value_for_user, get_role_value_for_name
    
    # Check if there's an intended role in the session
    intended_role = request.session.get('intended_role', '').strip()
    
    if intended_role:
        # Use the intended role if specified
        role_value = get_role_value_for_name(intended_role)
        if role_value is None:
            # Invalid role name, fall back to priority-based selection
            print(f"GOOGLE OAUTH: Invalid intended role '{intended_role}', falling back to priority-based role")
            role_value = get_role_value_for_user(user)
        else:
            print(f"GOOGLE OAUTH: Using intended role '{intended_role}' with value {role_value}")
    else:
        # Fall back to priority-based role selection
        role_value = get_role_value_for_user(user)
        print(f"GOOGLE OAUTH: No intended role, using priority-based role value {role_value}")
    
    request.session['user_authenticated'] = True
    request.session['user_id'] = str(user.id)
    request.session['user_email'] = user.email
    request.session['user_role_value'] = role_value
    request.session.modified = True

    print(
        f"SESSION: logging in -> session_key={request.session.session_key} user_id={user.id} email={user.email} role_value={role_value}"
    )


def _logout(request):
    """Logout function that doesn't use Django auth"""
    request.session.flush()


def _get_authenticated_user(request):
    """Get currently authenticated user"""
    if request.session.get('user_authenticated'):
        user_id = request.session.get('user_id')
        if user_id:
            try:
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
    return None






def _validate_and_redirect_by_role(intended_role: str, user_roles: list) -> str | None:
    """
    Validate the intended role against user's actual roles and return appropriate redirect URL.
    Returns None if role validation fails.
    """
    print(f"GOOGLE OAUTH: _validate_and_redirect_by_role called with intended_role='{intended_role}', user_roles={user_roles}")
    
    role_mapping = {
        'faculty': ['Faculty'],
        'approver': ['Approver'],
        'assistant': ['Student Assistant'],
        'ciso': ['CISO'],
        'ovphe': ['OVPHE']
    }
    
    # Check if intended role is valid
    if intended_role not in role_mapping:
        print(f"GOOGLE OAUTH: Invalid intended role: {intended_role}")
        print(f"GOOGLE OAUTH: Valid roles are: {list(role_mapping.keys())}")
        return None
    
    # Check if user has the required role(s)
    required_roles = role_mapping[intended_role]
    has_required_role = any(role in user_roles for role in required_roles)
    
    print(f"GOOGLE OAUTH: Required roles for {intended_role}: {required_roles}")
    print(f"GOOGLE OAUTH: User has required role: {has_required_role}")
    
    if not has_required_role:
        print(f"GOOGLE OAUTH: User {user_roles} does not have required role(s) {required_roles} for intended role {intended_role}")
        return None
    
    # Return appropriate dashboard URL based on intended role
    dashboard_urls = {
        'faculty': '/faculty-dashboard',
        'approver': '/approver-dashboard',
        'assistant': '/assistant-approver-dashboard',
        'ciso': '/CISO-dashboard',
        'ovphe': '/OVPHE-dashboard'
    }
    
    result = dashboard_urls.get(intended_role, '/faculty-dashboard')
    print(f"GOOGLE OAUTH: Returning dashboard URL: {result}")
    return result


def _dashboard_route_for_user(user: "User") -> str:
    # Check user's active roles and return appropriate dashboard
    user_roles = user.get_active_roles().values_list('role__name', flat=True)
    
    # Priority routing for admin roles
    if 'CISO' in user_roles:
        return "/CISO-dashboard"
    
    if 'OVPHE' in user_roles:
        return "/OVPHE-dashboard"
    
    # All approver roles (College Admin, Department Chair, Office Admin) go to approver dashboard
    approver_roles = ['College Admin', 'Department Chair', 'Office Admin']
    if any(role in user_roles for role in approver_roles):
        return "/approver-dashboard"
    
    # Student Assistant / Assistant Approver
    if 'Student Assistant' in user_roles:
        return "/assistant-approver-dashboard"
    
    # Default to faculty dashboard for Faculty role or fallback
    if 'Faculty' in user_roles:
        return "/faculty-dashboard"
    
    return "/"


def _verify_google_id_token(id_token: str, expected_aud: str | None):
    query = urlencode({"id_token": id_token})
    url = f"https://oauth2.googleapis.com/tokeninfo?{query}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = ""
        raise ValueError(f"Token verification failed: {body or str(e)}")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")

    try:
        payload = json.loads(body)
    except Exception:
        raise ValueError("Token verification failed: invalid response")

    email = (payload.get("email") or "").strip().lower()
    aud = (payload.get("aud") or "").strip()
    email_verified = str(payload.get("email_verified") or "").lower() == "true"

    if not email:
        raise ValueError("Token verification failed: missing email")
    if expected_aud and aud and aud != expected_aud:
        raise ValueError("Token verification failed: audience mismatch")
    if not email_verified:
        raise ValueError("Email not verified")

    return {"email": email, "payload": payload}


def _get_google_redirect_uri() -> str:
    raw = (os.getenv("GOOGLE_OAUTH_REDIRECT_URIS") or "").strip()
    if not raw:
        return ""
    return raw.split(",")[0].strip()


def _google_token_exchange(code: str, redirect_uri: str, client_id: str, client_secret: str) -> dict:
    data = urlencode(
        {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        url="https://oauth2.googleapis.com/token",
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = ""
        raise ValueError(f"Token exchange failed: {body or str(e)}")
    except Exception as e:
        raise ValueError(f"Token exchange failed: {str(e)}")

    try:
        return json.loads(body)
    except Exception:
        raise ValueError("Token exchange failed: invalid response")


def google_oauth_start(request):
    client_id = (os.getenv("GOOGLE_OAUTH_CLIENT_ID") or "").strip()
    redirect_uri = _get_google_redirect_uri()
    if not client_id or not redirect_uri:
        return _json_error("Google OAuth is not configured", status=500)
    
    # Clear any existing authentication to prevent role conflicts
    _logout(request)
    
    # Get the intended role from URL parameter
    intended_role = request.GET.get('role', '').strip()
    print(f"GOOGLE OAUTH: google_oauth_start called with role parameter: '{intended_role}'")
    
    #session
    state = secrets.token_urlsafe(24)
    request.session["google_oauth_state"] = state
    request.session["intended_role"] = intended_role
    request.session.modified = True
    
    print(f"GOOGLE OAUTH: Stored intended_role in session: '{intended_role}'")

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return HttpResponseRedirect(url)


def google_oauth_callback(request):
    print(f"GOOGLE OAUTH: Starting callback...")
    print(f"GOOGLE OAUTH: Session before login: {dict(request.session)}")
    print(f"GOOGLE OAUTH: Session key before: {request.session.session_key}")
    
    code = (request.GET.get("code") or "").strip()
    state = (request.GET.get("state") or "").strip()
    expected_state = request.session.get("google_oauth_state")
    intended_role = request.session.get("intended_role", "").strip()
    
    print(f"GOOGLE OAUTH: OAuth state found: {bool(expected_state)}")
    print(f"GOOGLE OAUTH: Intended role: {intended_role}")

    if not code:
        return _json_error("Missing code", status=400)
    if not state or not expected_state or state != expected_state:
        return _json_error("Invalid state", status=400)

    client_id = (os.getenv("GOOGLE_OAUTH_CLIENT_ID") or "").strip()
    client_secret = (os.getenv("GOOGLE_OAUTH_CLIENT_SECRET") or "").strip()
    redirect_uri = _get_google_redirect_uri()
    if not client_id or not client_secret or not redirect_uri:
        return _json_error("Google OAuth is not configured", status=500)

    try:
        token_data = _google_token_exchange(
            code=code,
            redirect_uri=redirect_uri,
            client_id=client_id,
            client_secret=client_secret,
        )
    except ValueError as e:
        return _json_error(str(e), status=401)

    id_token = (token_data.get("id_token") or "").strip()
    if not id_token:
        return _json_error("Missing id_token from Google", status=401)

    try:
        verified = _verify_google_id_token(id_token=id_token, expected_aud=client_id)
    except ValueError as e:
        return _json_error(str(e), status=401)

    email = verified["email"]
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return _json_error("Email is not registered in the system", status=403)

    print(f"GOOGLE OAUTH: User found: {user.email} (ID: {user.id})")
    print(f"GOOGLE OAUTH: About to call login...")
    
    # Validate intended role against user's actual roles
    user_roles = user.get_active_roles().values_list('role__name', flat=True)
    user_roles_list = list(user_roles)
    print(f"GOOGLE OAUTH: User email: {user.email}")
    print(f"GOOGLE OAUTH: User roles: {user_roles_list}")
    print(f"GOOGLE OAUTH: Intended role: '{intended_role}'")
    
    # If no intended role, redirect back to login with error
    if not intended_role:
        error_url = "/?error=no_role_selected"
        print(f"GOOGLE OAUTH: No role selected, redirecting to: {error_url}")
        return HttpResponseRedirect(error_url)
    
    # Validate that the intended role is one of the supported roles
    valid_roles = ['faculty', 'approver', 'assistant', 'ciso', 'ovphe']
    if intended_role not in valid_roles:
        # Clear the invalid role from session
        request.session.pop("intended_role", None)
        request.session.modified = True
        error_url = "/?error=invalid_role"
        print(f"GOOGLE OAUTH: Invalid role '{intended_role}', cleared from session, redirecting to: {error_url}")
        return HttpResponseRedirect(error_url)
    
    # Role validation and redirection logic
    redirect_to = _validate_and_redirect_by_role(intended_role, user_roles_list)
    print(f"GOOGLE OAUTH: Validation result: {redirect_to}")

    if redirect_to is None:
        # Role mismatch - clear the intended role and redirect to login with error message
        request.session.pop("intended_role", None)
        request.session.modified = True
        error_url = "/?error=role_mismatch"
        print(f"GOOGLE OAUTH: Role mismatch detected, cleared intended role, redirecting to: {error_url}")
        return HttpResponseRedirect(error_url)

    _login(request, user)

    try:
        jwt_token = generate_jwt_token(user)
        print(f"GOOGLE OAUTH: JWT Token generated for user: {user.email}")
        print(f"GOOGLE OAUTH: JWT Token (first 50 chars): {jwt_token[:50]}...")
    except Exception as e:
        print(f"GOOGLE OAUTH: Error generating JWT token: {str(e)}")

    print(f"GOOGLE OAUTH: Session after login: {dict(request.session)}")
    print(f"GOOGLE OAUTH: User authenticated: {request.session.get('user_authenticated')}")
    print(f"GOOGLE OAUTH: User ID in session: {request.session.get('user_id')}")
    print(f"GOOGLE OAUTH: Redirecting to: {redirect_to}")

    request.session.pop("intended_role", None)
    request.session.modified = True

    return HttpResponseRedirect(redirect_to)


@csrf_exempt
def google_sign_in_api(request):
    if request.method != "POST":
        return _json_error("Method not allowed", status=405)

    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        data = {}

    id_token = (data.get("id_token") or "").strip()
    if not id_token:
        return _json_error("Missing id_token", status=400)

    expected_aud = (os.getenv("GOOGLE_OAUTH_CLIENT_ID") or "").strip() or None
    try:
        verified = _verify_google_id_token(id_token=id_token, expected_aud=expected_aud)
    except ValueError as e:
        return _json_error(str(e), status=401)

    email = verified["email"]
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return _json_error("Email is not registered in the system", status=403)

    _login(request, user)

    try:
        jwt_token = generate_jwt_token(user)
        print(f"GOOGLE SIGN IN API: JWT Token generated for user: {user.email}")
        print(f"GOOGLE SIGN IN API: JWT Token (first 50 chars): {jwt_token[:50]}...")
    except Exception as e:
        print(f"GOOGLE SIGN IN API: Error generating JWT token: {str(e)}")

    redirect_to = "/login-prompt"
    return JsonResponse(
        {
            "ok": True,
            "email": user.email,
            "roles": list(user.get_active_roles().values_list('role__name', flat=True)),
            "redirect": redirect_to,
        }
    )


@csrf_exempt
def logout_api(request):
    if request.method not in {"POST", "GET"}:
        return _json_error("Method not allowed", status=405)
    
    print(f"LOGOUT: Starting logout... method={request.method}")
    print(f"SESSION: used session is now being cleared -> session_key={request.session.session_key}")
    print(f"LOGOUT: Session before: {dict(request.session)}")
    
    try:
        _logout(request)
        print(f"LOGOUT: Session flushed successfully")
    except Exception as e:
        print(f"LOGOUT: Logout error: {e}")
    
    print(f"SESSION: cleared -> session_key={getattr(request.session, 'session_key', 'None')}")

    if request.method == 'GET':
        from django.http import HttpResponseRedirect
        response = HttpResponseRedirect('/')
        response.delete_cookie('sessionid', path='/')
        response.delete_cookie('csrftoken', path='/')
        print(f"LOGOUT: GET request -> redirecting to /")
        return response

    response = JsonResponse({"ok": True, "message": "Logged out successfully"})
    response.delete_cookie('sessionid', path='/')
    response.delete_cookie('sessionid', path='/', domain='localhost')
    response.delete_cookie('sessionid', path='/', domain='127.0.0.1')
    response.delete_cookie('csrftoken', path='/')
    print(f"LOGOUT: POST request -> returning JSON")
    return response


@csrf_exempt
def heartbeat_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    now = timezone.now()
    request.session["last_seen"] = now.isoformat()
    request.session.modified = True

    payload = {
        "ok": True,
        "authenticated": bool(request.session.get("user_authenticated")),
        "server_time": now.isoformat(),
        "last_seen": request.session.get("last_seen"),
    }

    if not payload["authenticated"]:
        return JsonResponse(payload, status=401)

    return JsonResponse(payload)


def me_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    from .decorators import get_role_value_for_user, get_role_name_for_value
    role_value = get_role_value_for_user(user)
    role_name = get_role_name_for_value(role_value)

    return JsonResponse(
        {
            "email": user.email,
            "university_id": user.university_id,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "role_value": request.session.get("user_role_value"),
        }
    )


@csrf_exempt
def idle_check_api(request):
    """
    API endpoint that forces Django middleware to run and check idle timeout.
    This will trigger the IdleTimeoutMiddleware to clear session if needed.
    """
    print(f"IDLE CHECK: {request.method} request received")
    print(f"IDLE CHECK: User authenticated: {request.user.is_authenticated}")
    print(f"IDLE CHECK: User email: {request.user.email if request.user.is_authenticated else 'Anonymous'}")
    
    if request.method != "POST":
        print(f"IDLE CHECK: Method not allowed: {request.method}")
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        print(f"IDLE CHECK: User not authenticated, session already cleared")
        return JsonResponse({"status": "logged_out", "message": "User not authenticated"})

    # If we reach here, middleware didn't clear the session, so user is still active
    current_time = timezone.now().timestamp()
    last_activity = request.session.get('last_activity', current_time)
    
    print(f"IDLE CHECK: User still active. Last activity: {last_activity}, Current: {current_time}")
    
    return JsonResponse({
        "status": "active",
        "last_activity": last_activity,
        "current_time": current_time,
        "user": user.email if hasattr(user, 'email') else 'Unknown'
    })


def dashboard_view(request):
    return render(request, 'system/dashboard.html')


def ciso_profile_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    # Check if user has CISO role
    if not user.userrole_set.filter(role__name='CISO', is_active=True).exists():
        return JsonResponse({"detail": "Forbidden"}, status=403)

    return JsonResponse(
        {
            "email": user.email,
            "university_id": user.university_id,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "role": "CISO",
        }
    )


def ovphe_profile_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    # Check if user has OVPHE role
    if not user.userrole_set.filter(role__name='OVPHE', is_active=True).exists():
        return JsonResponse({"detail": "Forbidden"}, status=403)

    return JsonResponse(
        {
            "email": user.email,
            "university_id": user.university_id,
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "role": "OVPHE",
        }
    )

def _get_active_ovphe_admin(request):
    user = _get_authenticated_user(request)
    if not user:
        return None
    
    # Check if user has OVPHE role
    if user.userrole_set.filter(role__name='OVPHE', is_active=True).exists():
        return user
    return None


def _require_ovphe_admin(request):
    admin = _get_active_ovphe_admin(request)
    if not admin:
        return None, JsonResponse({"detail": "OVPHE user not found"}, status=404)
    return admin, None


def _parse_json_body(request):
    try:
        raw = request.body.decode("utf-8") if request.body else ""
        if not raw:
            return {}, None
        return json.loads(raw), None
    except Exception:
        return None, JsonResponse({"detail": "Invalid JSON"}, status=400)


def _validate_xu_email(value: str):
    e = (value or "").strip().lower()
    if not e:
        return None
    if not (e.endswith("@xu.edu.ph") or e.endswith("@my.xu.edu.ph")):
        return None
    return e


def _json_method_not_allowed():
    return JsonResponse({"detail": "Method not allowed"}, status=405)


def _as_int(v, default=0):
    try:
        return int(v)
    except Exception:
        return default


def _is_college_referenced(college: College):
    return (
        Faculty.objects.filter(college=college).exists()
        or Approver.objects.filter(college=college).exists()
        or StudentAssistant.objects.filter(college=college).exists()
        or ApproverFlowStep.colleges.through.objects.filter(college_id=college.id).exists()
        or Department.objects.filter(college=college).exists()
    )


def _is_department_referenced(dept: Department):
    return (
        Faculty.objects.filter(department=dept).exists()
        or Approver.objects.filter(department=dept).exists()
        or StudentAssistant.objects.filter(department=dept).exists()
    )


def _is_office_referenced(office: Office):
    return (
        Faculty.objects.filter(office=office).exists()
        or Approver.objects.filter(office=office).exists()
        # Requirement currently has no offices m2m; rely on direct usages instead.
        or ApproverFlowStep.objects.filter(office=office).exists()
    )


def _get_active_ciso_admin(request=None):
    # Get the currently authenticated user with CISO role
    if not request:
        return None
    
    user = _get_authenticated_user(request)
    if not user:
        return None
    
    # Check if user has active CISO role
    if user.userrole_set.filter(role__name='CISO', is_active=True).exists():
        return user
    
    return None


def _require_ciso_admin_user(request):
    user = _get_authenticated_user(request)
    if not user:
        return None, JsonResponse({"detail": "Authentication required"}, status=401)

    # Check if user has CISO role
    if not user.userrole_set.filter(role__name='CISO', is_active=True).exists():
        return None, JsonResponse({"detail": "Forbidden"}, status=403)

    return user, None


def _require_approver_user(request):
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return None, JsonResponse({"detail": "Authentication required"}, status=401)

    # Check if user has approver-related role
    approver_roles = ['Department Chair', 'Office Admin', 'College Admin']
    user_roles = user.get_active_roles().values_list('role__name', flat=True)
    if not any(role in user_roles for role in approver_roles):
        return None, JsonResponse({"detail": "Forbidden"}, status=403)

    return user, None


def _format_timestamp(dt: datetime | None):
    if not dt:
        return ""
    local = timezone.localtime(dt)
    try:
        return local.strftime("%B %-d, %Y, %-I:%M %p")
    except Exception:
        return local.strftime("%B %d, %Y, %I:%M %p")


def _json_body(request):
    if not request.body:
        return {}
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return None
    return payload if isinstance(payload, dict) else None


def _serialize_guideline(g: SystemGuideline):
    return {
        "id": g.id,
        "title": g.title or "",
        "description": g.body or "",
        "email": g.created_by.email if g.created_by else "",
        "timestamp": _format_timestamp(g.created_at),
        "enabled": bool(g.is_active),
    }


def _serialize_announcement(a: Announcement):
    return {
        "id": a.id,
        "title": a.title or "",
        "description": a.body or "",
        "email": a.created_by.email if a.created_by else "",
        "timestamp": _format_timestamp(a.created_at),
        "pinned": bool(a.pin_announcement),
        "enabled": bool(a.is_active),
    }


def _get_active_admin_for_role(request, role: str | None):
    if role == "ovphe":
        return _get_active_ovphe_admin(request)
    if role == "ciso":
        return _get_active_ciso_admin(request)
    return None


@csrf_exempt
def _system_guidelines_api(request, role: str):
    if request.method == "GET":
        guidelines = SystemGuideline.objects.select_related("created_by").order_by("-created_at", "-id")
        return JsonResponse({"items": [_serialize_guideline(g) for g in guidelines]})

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    title = (payload.get("title") or "").strip()
    description = (payload.get("description") or "").strip()
    enabled = payload.get("enabled")

    if not title:
        return JsonResponse({"detail": "title is required"}, status=400)

    admin = _get_active_admin_for_role(request, role)
    created_by = admin if admin else None

    guideline = SystemGuideline.objects.create(
        title=title,
        body=description,
        created_by=created_by,
        is_active=bool(enabled) if enabled is not None else True,
    )
    try:
        ActivityLog.objects.create(
            event_type=ActivityLog.EventType.CREATED_GUIDELINE,
            user=admin if admin else None,
            details=[f"Guideline: {title}"],
        )
    except Exception:
        pass
    return JsonResponse({"item": _serialize_guideline(guideline)})


@csrf_exempt
def _system_guideline_detail_api(request, role: str, guideline_id: int):
    try:
        guideline = SystemGuideline.objects.select_related("created_by").get(pk=guideline_id)
    except SystemGuideline.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

    admin = _get_active_admin_for_role(request, role)
    editor_user = admin if admin else None

    if request.method == "PUT":
        payload = _json_body(request)
        if payload is None:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

        title = (payload.get("title") or "").strip()
        description = (payload.get("description") or "").strip()
        if not title:
            return JsonResponse({"detail": "title is required"}, status=400)

        guideline.title = title
        guideline.body = description
        guideline.created_at = timezone.now()
        if editor_user is not None:
            guideline.created_by = editor_user
        guideline.save(update_fields=["title", "body", "created_at", "created_by"])
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.EDITED_GUIDELINE,
                user=admin if admin else None,
                details=[f"Guideline: {title}"],
            )
        except Exception:
            pass
        return JsonResponse({"item": _serialize_guideline(guideline)})

    if request.method == "PATCH":
        payload = _json_body(request)
        if payload is None:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

        if "enabled" not in payload:
            return JsonResponse({"detail": "enabled is required"}, status=400)

        guideline.is_active = bool(payload.get("enabled"))
        guideline.created_at = timezone.now()
        if editor_user is not None:
            guideline.created_by = editor_user
        guideline.save(update_fields=["is_active", "created_at", "created_by"])
        try:
            evt = ActivityLog.EventType.ENABLED_GUIDELINE if guideline.is_active else ActivityLog.EventType.DISABLED_GUIDELINE
            ActivityLog.objects.create(
                event_type=evt,
                user=admin if admin else None,
                details=[f"Guideline: {guideline.title}"],
            )
            if not guideline.is_active:
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.ARCHIVED_GUIDELINE,
                    user=admin if admin else None,
                    details=[f"Guideline: {guideline.title}"],
                )
        except Exception:
            pass
        return JsonResponse({"item": _serialize_guideline(guideline)})

    if request.method == "DELETE":
        guideline_title = guideline.title
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.ARCHIVED_GUIDELINE,
                user=admin if admin else None,
                details=[f"Guideline: {guideline_title}"],
            )
        except Exception:
            pass
        guideline.delete()
        return JsonResponse({"ok": True})

    if request.method == "GET":
        return JsonResponse({"item": _serialize_guideline(guideline)})

    return JsonResponse({"detail": "Method not allowed"}, status=405)


@csrf_exempt
def _announcements_api(request, role: str):
    if request.method == "GET":
        announcements = Announcement.objects.order_by("-created_at", "-id")
        return JsonResponse({"items": [_serialize_announcement(a) for a in announcements]})

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    title = (payload.get("title") or "").strip()
    description = (payload.get("description") or "").strip()
    pinned = payload.get("pinned")
    enabled = payload.get("enabled")

    if not title:
        return JsonResponse({"detail": "title is required"}, status=400)

    admin = _get_active_admin_for_role(request, role)

    announcement = Announcement.objects.create(
        title=title,
        body=description,
        created_by=admin,
        pin_announcement=bool(pinned) if pinned is not None else False,
        is_active=bool(enabled) if enabled is not None else True,
    )
    try:
        notification_body = f"{title}. Check announcements section for more details."
        notification_details = [f'Announcement title = "{title}"']
        Notification.objects.bulk_create(
            [
                Notification(
                    user=None,
                    user_role=target_role,
                    title="New Announcement",
                    status=None,
                    body=notification_body,
                    details=notification_details,
                    is_read=False,
                )
                for target_role in ["Approver", "CISO", "OVPHE", "Assistant"]
            ]
        )
    except Exception:
        pass
    return JsonResponse({"item": _serialize_announcement(announcement)})


@csrf_exempt
def _announcement_detail_api(request, role: str, announcement_id: int):
    try:
        announcement = Announcement.objects.get(pk=announcement_id)
    except Announcement.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

    admin = _get_active_admin_for_role(request, role)

    if request.method == "PUT":
        payload = _json_body(request)
        if payload is None:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

        title = (payload.get("title") or "").strip()
        description = (payload.get("description") or "").strip()
        pinned = payload.get("pinned")

        if not title:
            return JsonResponse({"detail": "title is required"}, status=400)

        announcement.title = title
        announcement.body = description
        if pinned is not None:
            announcement.pin_announcement = bool(pinned)
        announcement.created_at = timezone.now()
        if admin is not None:
            announcement.created_by = admin
        announcement.save(update_fields=["title", "body", "pin_announcement", "created_at", "created_by"])
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.EDITED_ANNOUNCEMENT,
                user=admin.user if admin else None,
                details=[f"Announcement: {title}"] if title else [],
            )
        except Exception:
            pass
        return JsonResponse({"item": _serialize_announcement(announcement)})

    if request.method == "PATCH":
        payload = _json_body(request)
        if payload is None:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

        updated_fields = []
        if "enabled" in payload:
            announcement.is_active = bool(payload.get("enabled"))
            updated_fields.append("is_active")
        if "pinned" in payload:
            announcement.pin_announcement = bool(payload.get("pinned"))
            updated_fields.append("pin_announcement")

        announcement.created_at = timezone.now()
        updated_fields.append("created_at")
        if admin is not None:
            announcement.created_by = admin
            updated_fields.append("created_by")

        if not updated_fields:
            return JsonResponse({"detail": "No fields to update"}, status=400)

        announcement.save(update_fields=updated_fields)
        try:
            if "enabled" in payload:
                evt = (
                    ActivityLog.EventType.ENABLED_ANNOUNCEMENT
                    if announcement.is_active
                    else ActivityLog.EventType.DISABLED_ANNOUNCEMENT
                )
                ActivityLog.objects.create(
                    event_type=evt,
                    user=admin.user if admin else None,
                    details=[f"Announcement: {announcement.title}"] if announcement.title else [],
                )
        except Exception:
            pass
        return JsonResponse({"item": _serialize_announcement(announcement)})

    if request.method == "DELETE":
        announcement_title = announcement.title
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.DELETED_ANNOUNCEMENT,
                user=admin.user if admin else None,
                details=[f"Announcement: {announcement_title}"] if announcement_title else [],
            )
        except Exception:
            pass
        announcement.delete()
        return JsonResponse({"ok": True})

    if request.method == "GET":
        return JsonResponse({"item": _serialize_announcement(announcement)})

    return JsonResponse({"detail": "Method not allowed"}, status=405)


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


def _label_to_term(label: str | None):
    if label == "First Semester":
        return Clearance.Term.FIRST
    if label == "Second Semester":
        return Clearance.Term.SECOND
    if label == "Intersession":
        return Clearance.Term.INTERSESSION
    return None


def _parse_iso_date(value: str | None):
    value = (value or "").strip()
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except Exception:
        return None


def _parse_int(value: str | None):
    value = (value or "").strip()
    if not value:
        return None
    try:
        return int(value)
    except Exception:
        return None

 
 
def _to_request_status(value: str | None):
    if value == ClearanceRequest.Status.APPROVED:
        return "approved"
    if value == ClearanceRequest.Status.REJECTED:
        return "rejected"
    return "pending"


def clearance_requests_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    active_timeline = _get_active_timeline()
    if not active_timeline:
        return JsonResponse({"items": []})

    qs = (
        ClearanceRequest.objects.select_related(
            "faculty",
            "faculty__college",
            "faculty__department",
        )
        .filter(clearance_timeline=active_timeline)
        .order_by("-id")
    )

    items = []
    for r in qs:
        faculty = getattr(r, "faculty", None)

        first_name = (getattr(faculty, "first_name", "") or "").strip()
        middle_name = (getattr(faculty, "middle_name", "") or "").strip()
        last_name = (getattr(faculty, "last_name", "") or "").strip()

        parts = [p for p in [first_name, middle_name, last_name] if p]
        full_name = " ".join(parts)

        college = getattr(getattr(faculty, "college", None), "name", "") or ""
        department = getattr(getattr(faculty, "department", None), "name", "") or ""
        faculty_type = getattr(faculty, "faculty_type", "") or ""

        employee_id = getattr(faculty, "employee_id", "") or ""

        items.append(
            {
                "id": str(r.id),
                "requestId": str(r.id),
                "employeeId": employee_id,
                "name": full_name,
                "college": college,
                "department": department,
                "facultyType": faculty_type,
                "status": _to_request_status(r.status),
            }
        )

    return JsonResponse({"items": items})


@csrf_exempt
def ciso_system_user_detail_api(request, user_id: int):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({"detail": "User not found"}, status=404)

    def _full_name(u: User):
        parts = [(u.first_name or "").strip(), (u.middle_name or "").strip(), (u.last_name or "").strip()]
        parts = [p for p in parts if p]
        return " ".join(parts) if parts else u.email

    if request.method == "GET":
        # Get user's active roles
        user_roles = user.get_active_roles()
        role = "Unknown"
        college_label = "N/A"
        dept_label = "N/A"

        if user_roles:
            # Get the highest priority role for display
            role_priority = ['CISO', 'OVPHE', 'College Admin', 'Department Chair', 'Office Admin', 'Student Assistant', 'Faculty']
            
            for priority_role in role_priority:
                user_role = user_roles.filter(role__name=priority_role).first()
                if user_role:
                    role = priority_role
                    # Set college/department labels based on role assignment
                    if user_role.college:
                        college_label = user_role.college.name
                    if user_role.department:
                        dept_label = user_role.department.name
                    elif user_role.office:
                        dept_label = user_role.office.name
                    break

        return JsonResponse(
            {
                "item": {
                    "id": str(user.id),
                    "name": _full_name(user),
                    "systemId": f"SYS-{user.id}",
                    "userRole": role,
                    "universityId": user.university_id or "",
                    "college": college_label,
                    "department": dept_label,
                    "email": user.email,
                    # Derive active status from any active role assignments
                    "isActive": user.get_active_roles().exists(),
                }
            }
        )

    if request.method == "DELETE":
        with transaction.atomic():
            # Delete related profiles first
            approver_profile = getattr(user, "approver_profile", None)
            if approver_profile:
                approver_profile.delete()
            
            assistant_profile = getattr(user, "assistant_profile", None)
            if assistant_profile:
                assistant_profile.delete()
            
            # Delete user role assignments
            user.userrole_set.all().delete()
            
            # Delete the user completely
            user.delete()

        return JsonResponse({"ok": True})

    if request.method not in {"PUT", "PATCH"}:
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data, parse_err = _parse_json_body(request)
    if parse_err:
        return parse_err
    if not isinstance(data, dict):
        return JsonResponse({"detail": "Invalid payload"}, status=400)

    first_name = (data.get("firstName") or "").strip()
    middle_name = (data.get("middleName") or "").strip()
    last_name = (data.get("lastName") or "").strip()
    university_id = (data.get("universityId") or "").strip()
    email = _validate_xu_email(data.get("email") or "")
    is_active = bool(data.get("isActive", True))

    if not email:
        return JsonResponse({"detail": "Email must be an XU email (@xu.edu.ph or @my.xu.edu.ph)"}, status=400)
    if not university_id or not university_id.isdigit():
        return JsonResponse({"detail": "University ID must be a valid number"}, status=400)

    system_admin_office = (data.get("systemAdminOffice") or "").strip()
    approver_type = (data.get("approverType") or "").strip()

    with transaction.atomic():
        if User.objects.filter(email__iexact=email).exclude(pk=user.id).exists():
            return JsonResponse({"detail": "Email already exists"}, status=400)
        if User.objects.filter(university_id__iexact=university_id).exclude(pk=user.id).exists():
            return JsonResponse({"detail": "University ID already exists"}, status=400)

        user.email = email
        user.university_id = university_id
        user.first_name = first_name
        user.middle_name = middle_name
        user.last_name = last_name
        user.save(update_fields=[
            "email",
            "university_id",
            "first_name",
            "middle_name",
            "last_name",
        ])

        # Update all role assignments to reflect the desired active status
        user.userrole_set.update(is_active=is_active)

        if system_admin_office:
            office_norm = system_admin_office.strip().upper()
            if office_norm not in {"CISO", "OVPHE"}:
                return JsonResponse({"detail": "Invalid system admin office"}, status=400)

            # Get or create the appropriate role
            from .models import Role
            role_name = "CISO" if office_norm == "CISO" else "OVPHE"
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': f'{role_name} admin role'}
            )
            
            # Remove existing admin roles for this user
            user.userrole_set.filter(role__name__in=['CISO', 'OVPHE']).delete()
            
            # Create new role assignment
            from .models import UserRole
            UserRole.objects.create(
                user=user,
                role=role,
                is_active=True,
                # Use the authenticated CISO admin as the assigner
                assigned_by=admin,
            )

        assistant_profile = getattr(user, "assistant_profile", None)
        if assistant_profile and not system_admin_office:
            if approver_type:
                atype = approver_type.strip().lower()
                if atype != "college":
                    return JsonResponse({"detail": "Assistant approvers must be department-based"}, status=400)

            college_name = (data.get("college") or "").strip()
            dept_name = (data.get("department") or "").strip()
            if not college_name:
                return JsonResponse({"detail": "College is required"}, status=400)
            if not dept_name:
                return JsonResponse({"detail": "Department is required"}, status=400)

            college = College.objects.filter(name__iexact=college_name, is_active=True).first()
            if not college:
                return JsonResponse({"detail": "College not found"}, status=400)

            department = Department.objects.filter(
                name__iexact=dept_name,
                college=college,
                is_active=True,
            ).first()
            if not department:
                return JsonResponse({"detail": "Department not found"}, status=400)

            assistant_profile.college = college
            assistant_profile.department = department
            assistant_profile.save(update_fields=["college", "department"])

            approver_profile = getattr(user, "approver_profile", None)
            if approver_profile:
                approver_profile.delete()

            # Assign Student Assistant role
            from .models import Role, UserRole
            student_role, created = Role.objects.get_or_create(
                name='Student Assistant',
                defaults={'description': 'Student Assistant role'}
            )
            UserRole.objects.get_or_create(
                user=user,
                role=student_role,
                defaults={'is_active': True}
            )

        elif approver_type:
            atype = approver_type.strip().lower()
            if atype not in {"college", "office"}:
                return JsonResponse({"detail": "Invalid approver type"}, status=400)

            approver_profile, _ = Approver.objects.get_or_create(user=user)
            approver_profile.approver_type = "College" if atype == "college" else "Office"

            if atype == "college":
                college_name = (data.get("college") or "").strip()
                dept_name = (data.get("department") or "").strip()
                if not college_name:
                    return JsonResponse({"detail": "College is required"}, status=400)
                if not dept_name:
                    return JsonResponse({"detail": "Department is required"}, status=400)

                college = College.objects.filter(name__iexact=college_name, is_active=True).first()
                if not college:
                    return JsonResponse({"detail": "College not found"}, status=400)

                department = Department.objects.filter(
                    name__iexact=dept_name,
                    college=college,
                    is_active=True,
                ).first()
                if not department:
                    return JsonResponse({"detail": "Department not found"}, status=400)

                approver_profile.college = college
                approver_profile.department = department
                approver_profile.office = None

            if atype == "office":
                office_name = (data.get("office") or "").strip()
                if not office_name:
                    return JsonResponse({"detail": "Office is required"}, status=400)

                office = Office.objects.filter(name__iexact=office_name, is_active=True).first()
                if not office:
                    return JsonResponse({"detail": "Office not found"}, status=400)

                approver_profile.office = office
                approver_profile.college = None
                approver_profile.department = None

            approver_profile.save(update_fields=["approver_type", "office", "college", "department"])
            
            # Assign appropriate role based on approver type
            from .models import Role, UserRole
            if atype == "college":
                role_name = "College Admin"
            else:
                role_name = "Office Admin"
            
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': f'{role_name} role'}
            )
            user_role, _ = UserRole.objects.get_or_create(
                user=user,
                role=role,
                defaults={'is_active': True},
            )
            # Respect the requested active flag for all roles on this user
            if not is_active and user_role.is_active:
                user_role.is_active = False
                user_role.save(update_fields=["is_active"])

    return JsonResponse({"ok": True})


def _legacy_active_clearance_timeline_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    t = _get_active_timeline()
    if not t:
        return JsonResponse({"academicYear": "", "semester": ""})

    if t.academic_year_start is not None and t.academic_year_end is not None:
        academic_year = f"{t.academic_year_start}–{t.academic_year_end}"
    else:
        academic_year = ""

    semester = _term_to_label(t.term)
    return JsonResponse({"academicYear": academic_year, "semester": semester})


def _label_to_term(label: str | None):
    if label == "First Semester":
        return Clearance.Term.FIRST
    if label == "Second Semester":
        return Clearance.Term.SECOND
    if label == "Intersession":
        return Clearance.Term.INTERSESSION
    return None


def _parse_iso_date(value: str | None):
    value = (value or "").strip()
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except Exception:
        return None


def _parse_int(value: str | None):
    value = (value or "").strip()
    if not value:
        return None
    try:
        return int(value)
    except Exception:
        return None


def _get_active_timeline():
    return ClearanceTimeline.objects.filter(is_active=True).order_by("-id").first()


def _to_request_status(value: str | None):
    if value == ClearanceRequest.Status.APPROVED:
        return "approved"
    if value == ClearanceRequest.Status.REJECTED:
        return "rejected"
    return "pending"


def clearance_requests_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    active_timeline = _get_active_timeline()
    if not active_timeline:
        return JsonResponse({"items": []})

    qs = (
        ClearanceRequest.objects.select_related(
            "faculty",
            "faculty__college",
            "faculty__department",
        )
        .filter(clearance_timeline=active_timeline)
        .order_by("-id")
    )

    items = []
    for r in qs:
        faculty = getattr(r, "faculty", None)

        first_name = (getattr(faculty, "first_name", "") or "").strip()
        middle_name = (getattr(faculty, "middle_name", "") or "").strip()
        last_name = (getattr(faculty, "last_name", "") or "").strip()

        parts = [p for p in [first_name, middle_name, last_name] if p]
        full_name = " ".join(parts)

        college = getattr(getattr(faculty, "college", None), "name", "") or ""
        department = getattr(getattr(faculty, "department", None), "name", "") or ""
        faculty_type = getattr(faculty, "faculty_type", "") or ""

        employee_id = getattr(faculty, "employee_id", "") or ""

        items.append(
            {
                "id": str(r.id),
                "requestId": str(r.id),
                "employeeId": employee_id,
                "name": full_name,
                "college": college,
                "department": department,
                "facultyType": faculty_type,
                "status": _to_request_status(r.status),
            }
        )

    return JsonResponse({"items": items})


def active_clearance_timeline_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    t = _get_active_timeline()
    if not t:
        return JsonResponse({"academicYear": "", "semester": ""})

    if t.academic_year_start is not None and t.academic_year_end is not None:
        academic_year = f"{t.academic_year_start}–{t.academic_year_end}"
    else:
        academic_year = ""

    semester = _term_to_label(t.term)
    return JsonResponse({"academicYear": academic_year, "semester": semester})

@csrf_exempt
@ciso_required
def ciso_faculty_dump_template_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    headers = [
        "email",
        "university_id",
        "employee_id",
        "first_name",
        "middle_name",
        "last_name",
        "faculty_type",
        "phone_number",
        "office",
        "college",
        "department",
    ]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)

    sample_rows = [
        {
            "email": "new.faculty13@xu.edu.ph",
            "university_id": "2024-000013",
            "employee_id": "EMP-000013",
            "first_name": "New",
            "middle_name": "A.",
            "last_name": "Faculty",
            "faculty_type": "Full-time",
            "phone_number": "09171234567",
            "office": "",
            "college": "College of Computer Studies",
            "department": "Information Technology",
        },
        {
            "email": "new.faculty14@xu.edu.ph",
            "university_id": "2024-000014",
            "employee_id": "EMP-000014",
            "first_name": "Faculty",
            "middle_name": "B.",
            "last_name": "New",
            "faculty_type": "Part-time",
            "phone_number": "09987654321",
            "office": "",
            "college": "College of Arts and Sciences",
            "department": "Mathematics",
        },
    ]

    for row in sample_rows:
        writer.writerow([row.get(h, "") for h in headers])

    # Add UTF-8 bom for excel compatibility
    csv_content = output.getvalue()
    bom_content = '\ufeff' + csv_content
    resp = HttpResponse(bom_content, content_type="text/csv;charset=utf-8")
    resp["Content-Disposition"] = 'attachment; filename="faculty_template.csv"'
    return resp


@csrf_exempt
def ciso_faculty_dump_import_api(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    # Validate clearance timeline / semester selection.
    # Primary path: use explicit clearance_timeline_id coming from the
    # frontend. If it is missing (e.g., older bundle), fall back to the
    # single active ClearanceTimeline if one exists.
    timeline_id = (request.POST.get("clearance_timeline_id") or "").strip()

    clearance_timeline: ClearanceTimeline | None = None
    if timeline_id:
        try:
            clearance_timeline = ClearanceTimeline.objects.get(id=timeline_id)
        except ClearanceTimeline.DoesNotExist:
            return JsonResponse(
                {"detail": "Selected semester does not exist in the current clearance timelines."},
                status=400,
            )
    else:
        # Graceful fallback: use the active timeline, if there is one.
        clearance_timeline = (
            ClearanceTimeline.objects.filter(is_active=True)
            .order_by("-academic_year_start", "-academic_year_end", "-id")
            .first()
        )
        if not clearance_timeline:
            return JsonResponse(
                {
                    "detail": "Missing clearance_timeline_id and no active clearance timeline found; please configure a clearance timeline first.",
                },
                status=400,
            )

    upload = request.FILES.get("file")
    if not upload:
        return JsonResponse({"detail": "Missing file"}, status=400)

    if not upload.name.lower().endswith(".csv"):
        return JsonResponse({"detail": "Only CSV files are supported"}, status=400)

    raw = upload.read()
    text = None
    # Try common encodings: UTF-8 with BOM, plain UTF-8, then Latin-1/Windows-1252
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except Exception:
            continue
    if text is None:
        return JsonResponse({"detail": "Unable to decode CSV; please upload a UTF-8 or Latin-1 encoded csv"}, status=400)

    reader = csv.DictReader(io.StringIO(text))
    required_cols = {"email", "university_id", "employee_id"}
    header_cols = set((reader.fieldnames or []))
    missing_cols = sorted(required_cols - header_cols)
    if missing_cols:
        return JsonResponse(
            {"detail": "Missing required columns", "missing": missing_cols},
            status=400,
        )

    created_count = 0
    updated_count = 0
    skipped_count = 0
    errors: list[dict] = []

    def _clean(value: str | None):
        return (value or "").strip()

    # Get or create Faculty role
    try:
        faculty_role = Role.objects.get(name='Faculty')
    except Role.DoesNotExist:
        faculty_role = Role.objects.create(name='Faculty', description='Faculty member', is_system_role=True)

    # Process CSV and create faculty directly
    for idx, row in enumerate(reader, start=2):
        email = _clean(row.get("email"))
        university_id = _clean(row.get("university_id"))
        employee_id = _clean(row.get("employee_id"))

        if not employee_id:
            errors.append({"row": idx, "message": "employee_id is required"})
            skipped_count += 1
            continue
        if not email:
            errors.append({"row": idx, "message": "email is required"})
            skipped_count += 1
            continue
        if not university_id:
            errors.append({"row": idx, "message": "university_id is required"})
            skipped_count += 1
            continue

        first_name = _clean(row.get("first_name"))
        middle_name = _clean(row.get("middle_name"))
        last_name = _clean(row.get("last_name"))
        faculty_type = _clean(row.get("faculty_type"))
        phone_number = _clean(row.get("phone_number"))
        office_name = _clean(row.get("office"))
        college_name = _clean(row.get("college"))
        department_name = _clean(row.get("department"))

        try:
            with transaction.atomic():
                # Create or update User
                user, user_created = User.objects.get_or_create(
                    email=email.lower(),
                    defaults={
                        'university_id': university_id,
                        'first_name': first_name,
                        'middle_name': middle_name,
                        'last_name': last_name,
                    }
                )
                
                if not user_created:
                    # Update existing user
                    user.university_id = university_id
                    user.first_name = first_name
                    user.middle_name = middle_name
                    user.last_name = last_name
                    user.save()

                # Create or update Faculty profile
                faculty, faculty_created = Faculty.objects.get_or_create(
                    user=user,
                    defaults={
                        'employee_id': employee_id,
                        'faculty_type': faculty_type,
                        'phone_number': phone_number,
                        'first_name': first_name,
                        'middle_name': middle_name,
                        'last_name': last_name,
                    }
                )
                
                if not faculty_created:
                    # Update existing faculty
                    faculty.employee_id = employee_id
                    faculty.faculty_type = faculty_type
                    faculty.phone_number = phone_number
                    faculty.first_name = first_name
                    faculty.middle_name = middle_name
                    faculty.last_name = last_name
                    faculty.save()

                # Handle relationships
                if college_name:
                    college, _ = College.objects.get_or_create(
                        name=college_name,
                        defaults={'is_active': True}
                    )
                    faculty.college = college
                
                if department_name and college_name:
                    department, _ = Department.objects.get_or_create(
                        name=department_name,
                        college=college,
                        defaults={'is_active': True}
                    )
                    faculty.department = department
                
                if office_name:
                    office, _ = Office.objects.get_or_create(
                        name=office_name,
                        defaults={'is_active': True}
                    )
                    faculty.office = office
                
                faculty.save()

                # Assign Faculty role
                UserRole.objects.get_or_create(
                    user=user,
                    role=faculty_role,
                    defaults={'is_active': True}
                )

                if user_created or faculty_created:
                    created_count += 1
                else:
                    updated_count += 1

        except Exception as e:
            errors.append({"row": idx, "message": f"Error creating faculty: {str(e)}"})
            skipped_count += 1

    # After processing rows, save the uploaded CSV to disk and create
    # a FacultyDumpArchive entry tied to the selected clearance timeline.
    try:
        import os
        from django.conf import settings

        media_root = getattr(settings, "MEDIA_ROOT", "") or ""
        dumps_dir = os.path.join(media_root, "faculty_dumps")
        os.makedirs(dumps_dir, exist_ok=True)

        # Build a unique filename for each import so that multiple dumps for
        # the same timeline create distinct archive entries and do not
        # overwrite the previous file on disk.
        safe_name = upload.name.replace("/", "_").replace("\\", "_")
        timestamp = timezone.localtime().strftime("%Y%m%d%H%M%S")
        file_name = f"timeline-{clearance_timeline.id}-{timestamp}-{safe_name}"
        file_path = os.path.join(dumps_dir, file_name)

        with open(file_path, "wb") as f:
            f.write(raw)

        size_bytes = os.path.getsize(file_path)
        size_mb = size_bytes / (1024 * 1024) if size_bytes else 0
        size_label = f"{size_mb:.0f} MB" if size_mb >= 1 else f"{size_bytes} B"

        # Store relative path from MEDIA_ROOT
        relative_path = os.path.relpath(file_path, media_root) if media_root else file_name

        FacultyDumpArchive.objects.create(
            clearance_timeline=clearance_timeline,
            academic_year_start=clearance_timeline.academic_year_start,
            academic_year_end=clearance_timeline.academic_year_end,
            term=clearance_timeline.term,
            dump_file_path=relative_path,
            dump_file_size=size_label,
        )
    except Exception as e:
        errors.append({"row": 0, "message": f"Error saving dump archive: {str(e)}"})

    return JsonResponse(
        {
            "created_count": created_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "errors": errors,
        }
    )


def ovphe_system_guidelines_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    guidelines = SystemGuideline.objects.select_related("created_by").order_by("-created_at", "-id")
    items = []
    for g in guidelines:
        items.append(
            {
                "id": str(g.id),
                "title": g.title or "",
                "description": g.body or "",
                "email": g.created_by.email if g.created_by else "",
                "timestamp": _format_timestamp(g.created_at),
                "enabled": bool(g.is_active),
            }
        )
    return JsonResponse({"items": items})
@csrf_exempt
def ovphe_system_guidelines_api(request):
    return _system_guidelines_api(request, "ovphe")


@csrf_exempt
def ovphe_announcements_api(request):
    return _announcements_api(request, "ovphe")


@csrf_exempt
def ovphe_system_guideline_detail_api(request, guideline_id: int):
    return _system_guideline_detail_api(request, "ovphe", guideline_id)


@csrf_exempt
def ovphe_announcement_detail_api(request, announcement_id: int):
    return _announcement_detail_api(request, "ovphe", announcement_id)


def _parse_int(value: str | None):
    value = (value or "").strip()
    if not value:
        return None
    try:
        return int(value)
    except Exception:
        return None


def _clearance_term_code(term: str | None):
    if term == Clearance.Term.FIRST:
        return "01"
    if term == Clearance.Term.SECOND:
        return "02"
    if term == Clearance.Term.INTERSESSION:
        return "03"
    return ""


def _clearance_timeline_name(start_year: int | None, end_year: int | None, term: str | None):
    year_code = str(start_year)[-2:] if start_year else ""
    term_code = _clearance_term_code(term)
    if year_code and term_code:
        return f"{year_code}{term_code} Faculty Clearance"
    if year_code:
        return f"{year_code} Faculty Clearance"
    return "Faculty Clearance"


def _archive_clearance_timeline_records(timeline: ClearanceTimeline):
    clearance_rows = (
        Clearance.objects.filter(
            academic_year=timeline.academic_year_start,
            term=timeline.term,
        )
        .select_related("faculty", "faculty__user")
        .order_by("faculty_id", "-id")
    )

    latest_clearances: dict[int, Clearance] = {}
    for clearance in clearance_rows:
        if clearance.faculty_id not in latest_clearances:
            latest_clearances[clearance.faculty_id] = clearance

    request_rows = (
        ClearanceRequest.objects.filter(clearance_timeline=timeline)
        .select_related("requirement", "approved_by")
        .order_by("faculty_id", "id")
    )

    requests_by_faculty: dict[int, list[ClearanceRequest]] = {}
    for req in request_rows:
        requests_by_faculty.setdefault(req.faculty_id, []).append(req)

    archived_at = timeline.archive_date or timezone.now()
    faculty_ids = set(latest_clearances.keys()) | set(requests_by_faculty.keys())

    for faculty_id in faculty_ids:
        clearance = latest_clearances.get(faculty_id)
        faculty_requests = requests_by_faculty.get(faculty_id, [])
        faculty = clearance.faculty if clearance else (faculty_requests[0].faculty if faculty_requests else None)
        if not faculty:
            continue

        missing_approval = ", ".join(
            req.requirement.title
            for req in faculty_requests
            if req.status != ClearanceRequest.Status.APPROVED and req.requirement
        )

        approved_count = sum(
            1 for req in faculty_requests if req.status == ClearanceRequest.Status.APPROVED
        )
        inferred_completed = bool(faculty_requests) and approved_count == len(faculty_requests)
        clearance_status = (
            ArchivedClearance.Status.COMPLETED
            if (clearance and clearance.status == Clearance.Status.COMPLETED) or (not clearance and inferred_completed)
            else ArchivedClearance.Status.INCOMPLETE
        )

        ArchivedClearance.objects.update_or_create(
            faculty=faculty,
            clearance_timeline=timeline,
            defaults={
                "academic_year": f"{timeline.academic_year_start}-{timeline.academic_year_end}",
                "semester": _term_to_label(timeline.term),
                "status": clearance_status,
                "clearance_period_start": timeline.clearance_start_date.date(),
                "clearance_period_end": timeline.clearance_end_date.date(),
                "last_updated": archived_at,
                "clearance_data": {
                    "clearance_status": clearance.status if clearance else clearance_status,
                    "employeeId": faculty.employee_id or "",
                    "name": _archived_faculty_display_name(faculty),
                    "college": faculty.college.name if faculty.college else "",
                    "department": faculty.department.name if faculty.department else "",
                    "facultyType": faculty.faculty_type or "",
                    "missing_approval": missing_approval,
                    "request_count": len(faculty_requests),
                    "approved_count": approved_count,
                    "requests": [
                        {
                            "requestId": req.request_id,
                            "title": req.requirement.title if req.requirement else "",
                            "status": req.status,
                            "submissionNotes": req.submission_notes,
                            "submissionLink": req.submission_link,
                            "submittedDate": req.submitted_date.isoformat() if req.submitted_date else None,
                            "approvedDate": req.approved_date.isoformat() if req.approved_date else None,
                            "approvedBy": req.approved_by.get_full_name() if req.approved_by else None,
                            "remarks": req.remarks,
                        }
                        for req in faculty_requests
                    ],
                },
            },
        )


def _ensure_archived_timeline_records(timeline: ClearanceTimeline):
    if not timeline or not timeline.archive_date:
        return
    if ArchivedClearance.objects.filter(clearance_timeline=timeline).exists():
        return
    _archive_clearance_timeline_records(timeline)


def _archived_faculty_display_name(faculty: Faculty | None):
    if not faculty:
        return ""
    return f"{faculty.first_name or ''} {faculty.middle_name or ''} {faculty.last_name or ''}".strip()


def _serialize_archived_faculty_item(archived: ArchivedClearance):
    faculty = archived.faculty
    archived_data = archived.clearance_data or {}
    return {
        "id": str(archived.id),
        "employeeId": archived_data.get("employeeId") or getattr(faculty, "employee_id", "") or "",
        "name": archived_data.get("name") or _archived_faculty_display_name(faculty),
        "college": archived_data.get("college") or (faculty.college.name if faculty and faculty.college else ""),
        "department": archived_data.get("department") or (faculty.department.name if faculty and faculty.department else ""),
        "facultyType": archived_data.get("facultyType") or getattr(faculty, "faculty_type", "") or "",
        "status": archived.status,
        "missingApproval": archived_data.get("missing_approval", ""),
        "lastUpdated": archived.last_updated.strftime("%B %d, %Y, %H:%M %p") if archived.last_updated else "",
    }


def _archived_clearance_items_for_timeline(timeline: ClearanceTimeline, status_filter: str = ""):
    _ensure_archived_timeline_records(timeline)

    archived_clearances = ArchivedClearance.objects.filter(
        clearance_timeline=timeline
    ).select_related('faculty', 'faculty__user', 'faculty__college', 'faculty__department').order_by('faculty__last_name', 'faculty__first_name')

    if status_filter in ['COMPLETED', 'INCOMPLETE']:
        archived_clearances = archived_clearances.filter(status=status_filter)

    return [_serialize_archived_faculty_item(archived) for archived in archived_clearances]


def _clearance_timelines_api(request, admin_getter, not_found_detail: str):
    if request.method == "GET":
        timelines = ClearanceTimeline.objects.filter(archive_date__isnull=True).order_by("-is_active", "-academic_year_start", "-id")
        items = []
        for t in timelines:
            start_year = str(t.academic_year_start or "")
            end_year = str(t.academic_year_end or "")
            items.append(
                {
                    "id": str(t.id),
                    "name": t.name or _clearance_timeline_name(t.academic_year_start, t.academic_year_end, t.term),
                    "academicYearStart": start_year,
                    "academicYearEnd": end_year,
                    "term": _term_to_label(t.term),
                    "clearanceStartDate": t.clearance_start_date.date().isoformat() if t.clearance_start_date else "",
                    "clearanceEndDate": t.clearance_end_date.date().isoformat() if t.clearance_end_date else "",
                    "setAsActive": bool(t.is_active),
                    "createdAt": _format_timestamp(t.created_at),
                }
            )
        return JsonResponse({"items": items})

    if request.method not in {"POST", "PUT", "DELETE"}:
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        payload = json.loads((request.body or b"{}").decode("utf-8"))
    except Exception:
        payload = {}

    admin = admin_getter(request)
    if not admin:
        return JsonResponse({"detail": not_found_detail}, status=404)

    if request.method == "DELETE":
        timeline_id = payload.get("id")
        action = (payload.get("action") or "archive").strip().lower()
        if not timeline_id:
            return JsonResponse({"detail": "Missing id"}, status=400)

        t = ClearanceTimeline.objects.filter(id=timeline_id, archive_date__isnull=True).first()
        if not t:
            return JsonResponse({"detail": "Timeline not found"}, status=404)

        if action == "delete":
            return JsonResponse({"detail": "Delete is not allowed for clearance timelines"}, status=405)

        with transaction.atomic():
            _archive_clearance_timeline_records(t)
            t.archive_date = timezone.now()
            t.is_active = False
            t.save(update_fields=["archive_date", "is_active", "updated_at"])
        return JsonResponse({"ok": True, "archived": True})

    start_year = _parse_int(payload.get("academicYearStart") or payload.get("startYear"))
    end_year = _parse_int(payload.get("academicYearEnd") or payload.get("endYear")) or ((start_year + 1) if start_year is not None else None)
    term = _label_to_term(payload.get("term") or payload.get("semester"))
    clearance_start_date = _parse_iso_date(payload.get("clearanceStartDate") or payload.get("semesterStartDate"))
    clearance_end_date = _parse_iso_date(payload.get("clearanceEndDate") or payload.get("semesterEndDate"))
    set_as_active = bool(payload.get("setAsActive"))

    if start_year is None or end_year is None or term is None or clearance_start_date is None or clearance_end_date is None:
        return JsonResponse({"detail": "Missing or invalid timeline fields"}, status=400)

    if request.method == "POST":
        if set_as_active:
            prev_active = list(ClearanceTimeline.objects.filter(is_active=True))
            ClearanceTimeline.objects.filter(is_active=True).update(is_active=False)
            for prev in prev_active:
                try:
                    prev_sy = f"S.Y. {prev.academic_year_start}-{(prev.academic_year_start or 0) + 1}"
                    prev_sem = _term_to_label(prev.term)
                    ActivityLog.objects.create(
                        event_type=ActivityLog.EventType.INACTIVE_TIMELINE,
                        user=admin,
                        details=[prev_sy, f"Semester: {prev_sem}", "Replaced with new timeline"],
                    )
                except Exception:
                    pass

        t = ClearanceTimeline.objects.create(
            name=_clearance_timeline_name(start_year, end_year, term),
            academic_year_start=start_year,
            academic_year_end=end_year,
            term=term,
            clearance_start_date=clearance_start_date,
            clearance_end_date=clearance_end_date,
            created_by=admin,
            is_active=set_as_active,
        )
        try:
            new_sy = f"S.Y. {start_year}-{end_year or (start_year or 0) + 1}"
            new_sem = _term_to_label(term)
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.ACTIVE_TIMELINE,
                user=admin,
                details=[new_sy, f"Semester: {new_sem}"],
            )
        except Exception:
            pass
        return JsonResponse({"id": str(t.id)}, status=201)

    timeline_id = payload.get("id")
    if not timeline_id:
        return JsonResponse({"detail": "Missing id"}, status=400)

    t = ClearanceTimeline.objects.filter(id=timeline_id).first()
    if not t:
        return JsonResponse({"detail": "Timeline not found"}, status=404)

    if set_as_active:
        prev_active = list(ClearanceTimeline.objects.exclude(id=t.id).filter(is_active=True))
        ClearanceTimeline.objects.exclude(id=t.id).filter(is_active=True).update(is_active=False)
        for prev in prev_active:
            try:
                prev_sy = f"S.Y. {prev.academic_year_start}-{(prev.academic_year_start or 0) + 1}"
                prev_sem = _term_to_label(prev.term)
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.INACTIVE_TIMELINE,
                    user=admin,
                    details=[prev_sy, f"Semester: {prev_sem}", "Replaced with new timeline"],
                )
            except Exception:
                pass

    t.name = _clearance_timeline_name(start_year, end_year, term)
    t.academic_year_start = start_year
    t.academic_year_end = end_year
    t.term = term
    t.clearance_start_date = clearance_start_date
    t.clearance_end_date = clearance_end_date
    t.is_active = set_as_active
    t.save(update_fields=[
        "name",
        "academic_year_start",
        "academic_year_end",
        "term",
        "clearance_start_date",
        "clearance_end_date",
        "is_active",
    ])

    return JsonResponse({"id": str(t.id)})


@csrf_exempt
def ovphe_clearance_timelines_api(request):
    return _clearance_timelines_api(request, _get_active_ovphe_admin, "OVPHE user not found")


def _legacy_faculty_dashboard_api_v1(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    email = (request.GET.get("email") or "").strip()
    university_id = (request.GET.get("university_id") or "").strip()
    timeline_id = (request.GET.get("timelineId") or request.GET.get("timeline_id") or "").strip()

    if not email and not university_id:
        email = "faculty.seed@xu.edu.ph"

    # Our custom User model has no is_active flag; rely on existence of Faculty rows instead
    qs = Faculty.objects.select_related("user", "college", "department")
    if email:
        qs = qs.filter(user__email=email)
    if university_id:
        qs = qs.filter(user__university_id=university_id)

    faculty = qs.order_by("id").first()
    if not faculty:
        return JsonResponse({"detail": "Faculty not found"}, status=404)

    timeline = None
    if timeline_id:
        timeline = ClearanceTimeline.objects.filter(id=timeline_id).first()
        if not timeline:
            return JsonResponse({"detail": "Timeline not found"}, status=404)
    else:
        timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year_start", "-id").first()
    academic_year = timeline.academic_year_start if timeline else None
    term = timeline.term if timeline else None

    clearance = None
    if academic_year and term:
        clearance = (
            Clearance.objects.filter(faculty=faculty, academic_year=academic_year, term=term)
            .order_by("-id")
            .first()
        )

    if timeline:
        timeline_requests = ClearanceRequest.objects.filter(
            faculty=faculty,
            clearance_timeline=timeline,
        )
    else:
        timeline_requests = ClearanceRequest.objects.none()

    total_reqs = 0
    approved_reqs = 0
    status = "Pending"
    steps_payload = []
    if clearance:
        if clearance.status == Clearance.Status.PENDING:
            status = "Pending"
        elif clearance.status == Clearance.Status.IN_PROGRESS:
            status = "In Progress"
        elif clearance.status == Clearance.Status.COMPLETED:
            status = "Completed"
        elif clearance.status == Clearance.Status.REJECTED:
            status = "Rejected"
        else:
            status = str(clearance.status)

        total_reqs = timeline_requests.count()
        approved_reqs = timeline_requests.filter(
            status=ClearanceRequest.Status.APPROVED
        ).count()

    return JsonResponse(
        {
            "faculty": {
                "email": faculty.user.email,
                "universityId": faculty.user.university_id or "",
                "firstName": faculty.user.first_name or faculty.first_name or "",
                "middleName": faculty.user.middle_name or faculty.middle_name or "",
                "lastName": faculty.user.last_name or faculty.last_name or "",
                "college": faculty.college.name if faculty.college else "",
                "department": faculty.department.name if faculty.department else "",
                "facultyType": faculty.faculty_type or "",
            },
            "timeline": {
                "academicYear": academic_year,
                "term": term,
            },
            "clearance": {
                "status": status,
                "approvedCount": approved_reqs,
                "totalCount": total_reqs,
            },
            "steps": steps_payload,
        }
    )


def faculty_notifications_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    email = (request.GET.get("email") or "").strip()
    university_id = (request.GET.get("university_id") or "").strip()

    if not email and not university_id:
        email = "faculty.seed@xu.edu.ph"

    qs = User.objects.filter(is_active=True, user_type=User.UserType.FACULTY)
    if email:
        qs = qs.filter(email=email)
    if university_id:
        qs = qs.filter(university_id=university_id)

    user = qs.order_by("id").first()
    if not user:
        return JsonResponse({"detail": "Faculty user not found"}, status=404)

    notifications = Notification.objects.filter(user=user).order_by("-created_at", "-id")
    items = []
    for n in notifications:
        items.append(
            {
                "id": str(n.id),
                "title": n.title or "",
                "description": n.body or "",
                "status": n.status,
                "details": list(n.details or []),
                "timestamp": _format_timestamp(n.created_at),
                "is_read": bool(n.is_read),
            }
        )

    return JsonResponse({"items": items})


def ciso_org_structure_api(request):
    if request.method != "GET":
        return _json_method_not_allowed()

    colleges = list(
        College.objects.filter(is_active=True)
        .order_by("name", "id")
        .values("id", "name", "abbreviation")
    )
    departments = list(
        Department.objects.select_related("college")
        .filter(is_active=True, college__is_active=True)
        .order_by("college__name", "name", "id")
        .values("id", "college_id", "name", "abbreviation")
    )
    offices = list(
        Office.objects.filter(is_active=True)
        .order_by("display_order", "name", "id")
        .values("id", "name", "abbreviation", "display_order")
    )

    return JsonResponse(
        {
            "colleges": [
                {
                    "id": str(c["id"]),
                    "name": c["name"],
                    "short": c["abbreviation"] or "",
                }
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
                {
                    "id": str(o["id"]),
                    "name": o["name"],
                    "short": o["abbreviation"] or "",
                    "displayOrder": int(o.get("display_order") or 0),
                }
                for o in offices
            ],
        }
    )


def ciso_approver_flow_api(request):
    if request.method != "GET":
        return _json_method_not_allowed()

    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    # Get timeline_id from query parameter
    timeline_id = request.GET.get('timeline_id')
    
    # Try to get timeline-specific config first, then fallback to global config
    config = None
    if timeline_id:
        try:
            timeline = ClearanceTimeline.objects.get(id=timeline_id)
            config = ApproverFlowConfig.objects.filter(clearance_timeline=timeline).order_by("-updated_at", "pk").first()
        except ClearanceTimeline.DoesNotExist:
            return JsonResponse({"detail": "Timeline not found"}, status=404)
    
    # Fallback to global config (null clearance_timeline)
    if not config:
        config = ApproverFlowConfig.objects.filter(clearance_timeline__isnull=True).order_by("-updated_at", "pk").first()
    
    if not config:
        # Create new config - if timeline_id provided, create timeline-specific, otherwise global
        config = ApproverFlowConfig.objects.create(
            created_by=admin,
            clearance_timeline=ClearanceTimeline.objects.get(id=timeline_id) if timeline_id else None
        )

    steps = (
        config.steps.select_related("office")
        .prefetch_related("colleges")
        .all()
        .order_by("order", "id")
    )
    return JsonResponse(
        {
            "id": str(config.id),
            "timelineId": str(config.clearance_timeline.id) if config.clearance_timeline else None,
            "isGlobal": config.clearance_timeline is None,
            "steps": [
                {
                    "id": str(s.id),
                    "category": s.category,
                    "officeId": str(s.office_id) if s.office_id else "",
                    "collegeIds": [str(c.id) for c in s.colleges.all()],
                    "order": int(s.order),
                }
                for s in steps
            ],
        }
    )


def _resolve_office_for_flow_step(*, category: str, office_id):
    if office_id:
        return Office.objects.filter(pk=office_id, is_active=True).first()

    cat = (category or "").strip()
    if not cat:
        return None

    return (
        Office.objects.filter(is_active=True)
        .filter(models.Q(name__iexact=cat) | models.Q(abbreviation__iexact=cat))
        .first()
    )


def _relink_flow_steps_for_office(*, office: Office, timeline_id=None):
    if not office or not office.is_active:
        return

    # Try timeline-specific config first if timeline_id is provided
    config = None
    if timeline_id:
        try:
            timeline = ClearanceTimeline.objects.get(id=timeline_id)
            config = ApproverFlowConfig.objects.filter(clearance_timeline=timeline).order_by("-updated_at", "-id").first()
        except ClearanceTimeline.DoesNotExist:
            pass
    
    # Fallback to global config
    if not config:
        config = ApproverFlowConfig.objects.filter(clearance_timeline__isnull=True).order_by("-updated_at", "-id").first()
    
    if not config:
        return

    config.steps.filter(office__isnull=True).filter(
        models.Q(category__iexact=office.name)
        | models.Q(category__iexact=(office.abbreviation or ""))
    ).update(office=office)


@csrf_exempt
def ciso_colleges_api(request):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    if request.method == "POST":
        data, jerr = _parse_json_body(request)
        if jerr:
            return jerr
        name = (data.get("name") or "").strip()
        short = (data.get("short") or "").strip()
        if not name:
            return JsonResponse({"detail": "name is required"}, status=400)

        existing_active = College.objects.filter(name__iexact=name, is_active=True).first()
        if existing_active:
            return JsonResponse(
                {"detail": "A college with this name already exists", "id": str(existing_active.id)},
                status=409,
            )

        existing_inactive = College.objects.filter(name__iexact=name, is_active=False).first()
        if existing_inactive:
            existing_inactive.is_active = True
            existing_inactive.abbreviation = short or None
            existing_inactive.save(update_fields=["is_active", "abbreviation"])

            try:
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.CREATED_COLLEGE,
                    user=admin.user if admin else None,
                    details=[f"College: {existing_inactive.name}"] if existing_inactive.name else [],
                )
            except Exception:
                pass
            return JsonResponse(
                {
                    "id": str(existing_inactive.id),
                    "name": existing_inactive.name,
                    "short": existing_inactive.abbreviation or "",
                    "isActive": bool(existing_inactive.is_active),
                    "reactivated": True,
                },
                status=200,
            )

        obj = College.objects.create(
            name=name,
            abbreviation=short or None,
            is_active=True,
        )

        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.CREATED_COLLEGE,
                user=admin.user if admin else None,
                details=[f"College: {obj.name}"] if obj.name else [],
            )
        except Exception:
            pass
        return JsonResponse(
            {
                "id": str(obj.id),
                "name": obj.name,
                "short": obj.abbreviation or "",
                "isActive": bool(obj.is_active),
            },
            status=201,
        )

    return _json_method_not_allowed()


@csrf_exempt
def ciso_college_detail_api(request, college_id: int):
    print(f"[DEBUG] ovphe_college_detail_api called: method={request.method}, college_id={college_id}")
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    try:
        obj = College.objects.get(pk=college_id)
    except College.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "id": str(obj.id),
            "name": obj.name,
            "short": obj.abbreviation or "",
            "isActive": bool(obj.is_active),
        })

    if request.method == "PATCH":
        data, jerr = _parse_json_body(request)
        if jerr:
            return jerr

        if "name" in data:
            obj.name = (data.get("name") or "").strip()
        if "short" in data:
            short = (data.get("short") or "").strip()
            obj.abbreviation = short or None
        if "isActive" in data:
            obj.is_active = bool(data.get("isActive"))

        if not (obj.name or "").strip():
            return JsonResponse({"detail": "name is required"}, status=400)
        obj.save(update_fields=["name", "abbreviation", "is_active"])
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.EDITED_COLLEGE,
                user=admin.user if admin else None,
                details=[f"College: {obj.name}"],
            )
        except Exception:
            pass
        return JsonResponse(
            {
                "id": str(obj.id),
                "name": obj.name,
                "short": obj.abbreviation or "",
                "isActive": bool(obj.is_active),
            }
        )

    if request.method == "DELETE":
        college_name = getattr(obj, "name", "") or ""
        print(f"[DEBUG] Deleting college {college_name} (id={college_id}) by admin {admin}")
        try:
            log = ActivityLog.objects.create(
                event_type=ActivityLog.EventType.DELETED_COLLEGE,
                user=admin if admin else None,
                details=[f"College: {college_name}"] if college_name else [],
            )
            print(f"[DEBUG] ActivityLog created: id={log.id}, event_type={log.event_type}, details={log.details}")
        except Exception as e:
            print(f"[ERROR] Failed to create ActivityLog for deleted_college: {e}")
        if _is_college_referenced(obj):
            if obj.is_active:
                obj.is_active = False
                obj.save(update_fields=["is_active"])
            return JsonResponse({"id": str(obj.id), "softDeleted": True})
        obj.delete()
        return JsonResponse({"id": str(college_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ciso_departments_api(request):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    if request.method == "POST":
        data, jerr = _parse_json_body(request)
        if jerr:
            return jerr
        name = (data.get("name") or "").strip()
        short = (data.get("short") or "").strip()
        college_id = data.get("collegeId")
        if not name:
            return JsonResponse({"detail": "name is required"}, status=400)
        if not college_id:
            return JsonResponse({"detail": "collegeId is required"}, status=400)
        try:
            college = College.objects.get(pk=college_id)
        except College.DoesNotExist:
            return JsonResponse({"detail": "college not found"}, status=404)

        existing_active = Department.objects.filter(
            college=college, name__iexact=name, is_active=True
        ).first()
        if existing_active:
            return JsonResponse(
                {"detail": "A department with this name already exists", "id": str(existing_active.id)},
                status=409,
            )

        existing_inactive = Department.objects.filter(
            college=college, name__iexact=name, is_active=False
        ).first()
        if existing_inactive:
            existing_inactive.is_active = True
            existing_inactive.abbreviation = short or None
            existing_inactive.save(update_fields=["is_active", "abbreviation"])
            try:
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.CREATED_DEPARTMENT,
                    user=admin.user if admin else None,
                    details=[f"Department: {existing_inactive.name}", f"College: {college.name}"],
                )
            except Exception:
                pass
            return JsonResponse(
                {
                    "id": str(existing_inactive.id),
                    "collegeId": str(existing_inactive.college_id),
                    "name": existing_inactive.name,
                    "short": existing_inactive.abbreviation or "",
                    "isActive": bool(existing_inactive.is_active),
                    "reactivated": True,
                },
                status=200,
            )

        obj = Department.objects.create(
            college=college,
            name=name,
            abbreviation=short or None,
            is_active=True,
        )
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.CREATED_DEPARTMENT,
                user=admin.user if admin else None,
                details=[f"Department: {obj.name}", f"College: {college.name}"],
            )
        except Exception:
            pass
        return JsonResponse(
            {
                "id": str(obj.id),
                "collegeId": str(obj.college_id),
                "name": obj.name,
                "short": obj.abbreviation or "",
                "isActive": bool(obj.is_active),
            },
            status=201,
        )

    return _json_method_not_allowed()


@csrf_exempt
def ciso_department_detail_api(request, department_id: int):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    try:
        obj = Department.objects.select_related("college").get(pk=department_id)
    except Department.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "id": str(obj.id),
            "collegeId": str(obj.college_id),
            "name": obj.name,
            "short": obj.abbreviation or "",
            "isActive": bool(obj.is_active),
        })

    if request.method == "PATCH":
        data, jerr = _parse_json_body(request)
        if jerr:
            return jerr

        if "name" in data:
            obj.name = (data.get("name") or "").strip()
        if "short" in data:
            short = (data.get("short") or "").strip()
            obj.abbreviation = short or None
        if "isActive" in data:
            obj.is_active = bool(data.get("isActive"))
        if "collegeId" in data and data.get("collegeId"):
            try:
                obj.college = College.objects.get(pk=data.get("collegeId"))
            except College.DoesNotExist:
                return JsonResponse({"detail": "college not found"}, status=404)

        if not (obj.name or "").strip():
            return JsonResponse({"detail": "name is required"}, status=400)
        obj.save(update_fields=["name", "abbreviation", "is_active", "college"])
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.EDITED_DEPARTMENT,
                user=admin.user if admin else None,
                details=[f"Department: {obj.name}", f"College: {obj.college.name}"],
            )
        except Exception:
            pass
        return JsonResponse(
            {
                "id": str(obj.id),
                "collegeId": str(obj.college_id),
                "name": obj.name,
                "short": obj.abbreviation or "",
                "isActive": bool(obj.is_active),
            }
        )

    if request.method == "DELETE":
        dept_name = obj.name
        college_name = obj.college.name if obj.college else ""
        if _is_department_referenced(obj):
            if obj.is_active:
                obj.is_active = False
                obj.save(update_fields=["is_active"])
            try:
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.DELETED_DEPARTMENT,
                    user=admin if admin else None,
                    details=[f"Department: {dept_name}", f"College: {college_name}"],
                )
            except Exception:
                pass
            return JsonResponse({"id": str(obj.id), "softDeleted": True})
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.DELETED_DEPARTMENT,
                user=admin if admin else None,
                details=[f"Department: {dept_name}", f"College: {college_name}"],
            )
        except Exception:
            pass
        obj.delete()
        return JsonResponse({"id": str(department_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ciso_offices_api(request):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    if request.method == "POST":
        data, jerr = _parse_json_body(request)
        if jerr:
            return jerr
        name = (data.get("name") or "").strip()
        short = (data.get("short") or "").strip()
        display_order = _as_int(data.get("displayOrder"), 0)
        if not name:
            return JsonResponse({"detail": "name is required"}, status=400)

        existing_active = Office.objects.filter(name__iexact=name, is_active=True).first()
        if existing_active:
            return JsonResponse(
                {"detail": "An office with this name already exists", "id": str(existing_active.id)},
                status=409,
            )

        existing_inactive = Office.objects.filter(name__iexact=name, is_active=False).first()
        if existing_inactive:
            existing_inactive.is_active = True
            existing_inactive.abbreviation = short or None
            existing_inactive.display_order = display_order
            existing_inactive.save(update_fields=["is_active", "abbreviation", "display_order"])
            _relink_flow_steps_for_office(office=existing_inactive)
            try:
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.CREATED_OFFICE,
                    user=admin.user if admin else None,
                    details=[f"Office: {existing_inactive.name}"],
                )
            except Exception:
                pass
            return JsonResponse(
                {
                    "id": str(existing_inactive.id),
                    "name": existing_inactive.name,
                    "short": existing_inactive.abbreviation or "",
                    "displayOrder": int(existing_inactive.display_order),
                    "isActive": bool(existing_inactive.is_active),
                    "reactivated": True,
                },
                status=200,
            )

        obj = Office.objects.create(
            name=name,
            abbreviation=short or None,
            is_active=True,
            display_order=display_order,
        )
        _relink_flow_steps_for_office(office=obj)
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.CREATED_OFFICE,
                user=admin.user if admin else None,
                details=[f"Office: {obj.name}"],
            )
        except Exception:
            pass
        return JsonResponse(
            {
                "id": str(obj.id),
                "name": obj.name,
                "short": obj.abbreviation or "",
                "displayOrder": int(obj.display_order),
                "isActive": bool(obj.is_active),
            },
            status=201,
        )

    return _json_method_not_allowed()


@csrf_exempt
def ciso_office_detail_api(request, office_id: int):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    try:
        obj = Office.objects.get(pk=office_id)
    except Office.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "id": str(obj.id),
            "name": obj.name,
            "short": obj.abbreviation or "",
            "displayOrder": int(obj.display_order),
            "isActive": bool(obj.is_active),
        })

    if request.method == "PATCH":
        data, jerr = _parse_json_body(request)
        if jerr:
            return jerr

        if "name" in data:
            obj.name = (data.get("name") or "").strip()
        if "short" in data:
            short = (data.get("short") or "").strip()
            obj.abbreviation = short or None
        if "displayOrder" in data:
            obj.display_order = _as_int(data.get("displayOrder"), obj.display_order)
        if "isActive" in data:
            obj.is_active = bool(data.get("isActive"))

        if not (obj.name or "").strip():
            return JsonResponse({"detail": "name is required"}, status=400)
        obj.save(update_fields=["name", "abbreviation", "display_order", "is_active"])
        _relink_flow_steps_for_office(office=obj)
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.EDITED_OFFICE,
                user=admin.user if admin else None,
                details=[f"Office: {obj.name}"],
            )
        except Exception:
            pass
        return JsonResponse(
            {
                "id": str(obj.id),
                "name": obj.name,
                "short": obj.abbreviation or "",
                "displayOrder": int(obj.display_order),
                "isActive": bool(obj.is_active),
            }
        )

    if request.method == "DELETE":
        office_name = obj.name
        if _is_office_referenced(obj):
            if obj.is_active:
                obj.is_active = False
                obj.save(update_fields=["is_active"])
            try:
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.DELETED_OFFICE,
                    user=admin if admin else None,
                    details=[f"Office: {office_name}"],
                )
            except Exception:
                pass
            return JsonResponse({"id": str(obj.id), "softDeleted": True})
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.DELETED_OFFICE,
                user=admin if admin else None,
                details=[f"Office: {office_name}"],
            )
        except Exception:
            pass
        obj.delete()
        return JsonResponse({"id": str(office_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ciso_org_structure_order_api(request):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    if request.method != "PUT":
        return _json_method_not_allowed()

    data, jerr = _parse_json_body(request)
    if jerr:
        return jerr
    office_ids = data.get("offices") or []

    with transaction.atomic():
        for idx, oid in enumerate(office_ids):
            Office.objects.filter(pk=oid).update(display_order=idx)

    return JsonResponse({"ok": True})


@csrf_exempt
def ciso_approver_flow_steps_api(request):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    # Get timeline_id from query parameter
    timeline_id = request.GET.get('timeline_id')
    
    # Try to get timeline-specific config first, then fallback to global config
    config = None
    if timeline_id:
        try:
            timeline = ClearanceTimeline.objects.get(id=timeline_id)
            config = ApproverFlowConfig.objects.filter(clearance_timeline=timeline).order_by("-updated_at", "pk").first()
        except ClearanceTimeline.DoesNotExist:
            return JsonResponse({"detail": "Timeline not found"}, status=404)
    
    # Fallback to global config (null clearance_timeline)
    if not config:
        config = ApproverFlowConfig.objects.filter(clearance_timeline__isnull=True).order_by("-updated_at", "pk").first()
    
    if not config:
        # Create new config - if timeline_id provided, create timeline-specific, otherwise global
        config = ApproverFlowConfig.objects.create(
            created_by=admin,
            clearance_timeline=ClearanceTimeline.objects.get(id=timeline_id) if timeline_id else None
        )

    if request.method == "POST":
        data, jerr = _parse_json_body(request)
        if jerr:
            return jerr
        category = (data.get("category") or "").strip()
        office_id = data.get("officeId") or None
        college_ids = data.get("collegeIds") or []
        order = _as_int(data.get("order"), 0)
        if not category:
            return JsonResponse({"detail": "category is required"}, status=400)

        office = _resolve_office_for_flow_step(category=category, office_id=office_id)
        step = ApproverFlowStep.objects.create(
            config=config,
            category=category,
            order=order,
            office=office,
        )
        if college_ids:
            step.colleges.set(College.objects.filter(pk__in=college_ids, is_active=True))
        try:
            college_names = [c.name for c in step.colleges.all()]
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.ADDED_TO_APPROVER_FLOW,
                user=admin.user if admin else None,
                details=[
                    f"Category: {step.category}",
                    f"Colleges: {', '.join(college_names)}" if college_names else "",
                ],
            )
        except Exception:
            pass
        return JsonResponse(
            {
                "id": str(step.id),
                "category": step.category,
                "officeId": str(step.office_id) if step.office_id else "",
                "collegeIds": [str(c.id) for c in step.colleges.all()],
                "order": int(step.order),
            },
            status=201,
        )

    return _json_method_not_allowed()


@csrf_exempt
def ciso_approver_flow_step_detail_api(request, step_id: int):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    try:
        step = ApproverFlowStep.objects.select_related("config").prefetch_related("colleges").get(pk=step_id)
    except ApproverFlowStep.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

    if request.method == "PATCH":
        data, jerr = _parse_json_body(request)
        if jerr:
            return jerr
        if "category" in data:
            step.category = (data.get("category") or "").strip()
        if "order" in data:
            step.order = _as_int(data.get("order"), step.order)
        if "officeId" in data:
            office_id = data.get("officeId") or None
            step.office = _resolve_office_for_flow_step(category=step.category, office_id=office_id)
        elif "category" in data and not step.office_id:
            step.office = _resolve_office_for_flow_step(category=step.category, office_id=None)
        if not (step.category or "").strip():
            return JsonResponse({"detail": "category is required"}, status=400)
        step.save(update_fields=["category", "order", "office"])

        if "collegeIds" in data:
            college_ids = data.get("collegeIds") or []
            step.colleges.set(College.objects.filter(pk__in=college_ids, is_active=True))

        try:
            college_names = [c.name for c in step.colleges.all()]
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.EDITED_APPROVER_FLOW,
                user=admin.user if admin else None,
                details=[
                    f"Category: {step.category}",
                    f"Colleges: {', '.join(college_names)}" if college_names else "",
                ],
            )
        except Exception:
            pass
        return JsonResponse(
            {
                "id": str(step.id),
                "category": step.category,
                "officeId": str(step.office_id) if step.office_id else "",
                "collegeIds": [str(c.id) for c in step.colleges.all()],
                "order": int(step.order),
            }
        )

    if request.method == "DELETE":
        step_category = step.category
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.REMOVED_FROM_APPROVER_FLOW,
                user=admin.user if admin else None,
                details=[f"Category: {step_category}"],
            )
        except Exception:
            pass
        step.delete()
        return JsonResponse({"id": str(step_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ciso_approver_flow_order_api(request):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    if request.method != "PUT":
        return _json_method_not_allowed()

    data, jerr = _parse_json_body(request)
    if jerr:
        return jerr
    step_ids = data.get("stepIds") or []

    with transaction.atomic():
        for idx, sid in enumerate(step_ids):
            ApproverFlowStep.objects.filter(pk=sid).update(order=idx)

    try:
        ActivityLog.objects.create(
            event_type=ActivityLog.EventType.EDITED_APPROVER_FLOW,
            user=admin.user if admin else None,
            details=["Updated approver flow order."],
        )
    except Exception:
        pass

    return JsonResponse({"ok": True})


def ovphe_notifications_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    admin = _get_active_ovphe_admin(request)
    if not admin:
        return JsonResponse({"detail": "OVPHE user not found"}, status=404)

    qs = Notification.objects.filter(
        models.Q(user=admin.user) | models.Q(user_role__istartswith="CISO")
    ).order_by("-created_at", "-id")
    items = []
    for n in qs:
        items.append(
            {
                "id": str(n.id),
                "title": n.title or "",
                "description": n.body or "",
                "status": n.status,
                "details": list(n.details or []),
                "timestamp": _format_timestamp(n.created_at),
                "is_read": bool(n.is_read),
            }
        )
    return JsonResponse({"items": items})


@csrf_exempt
def ovphe_export_clearance_results_api(request):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    academic_year = (request.GET.get("academic_year") or "").strip()
    term = (request.GET.get("term") or "").strip()
    college_id = (request.GET.get("college_id") or "").strip()

    try:
        academic_year_int = int(academic_year) if academic_year else None
    except Exception:
        academic_year_int = None

    term_upper = term.upper()
    if term_upper == "FIRST":
        term_normalized = Clearance.Term.FIRST
    elif term_upper == "SECOND":
        term_normalized = Clearance.Term.SECOND
    elif term_upper in {"INTERSESSION", str(Clearance.Term.INTERSESSION)}:
        term_normalized = Clearance.Term.INTERSESSION
    elif term:
        term_normalized = term
    else:
        term_normalized = None

    college_name = ""
    if college_id:
        try:
            college = College.objects.get(id=college_id)
            college_name = college.name
        except College.DoesNotExist:
            pass

    # Log the export
    try:
        ActivityLog.objects.create(
            event_type=ActivityLog.EventType.EXPORTED_CLEARANCE_RESULTS,
            user=admin.user if admin else None,
            details=[
                college_name or "All Colleges",
                f"School Year: {academic_year or 'All'}",
                f"Term: {term_normalized or 'All'}",
            ],
        )
    except Exception:
        pass

    # Generate Excel file (simplified placeholder - you'd implement actual Excel generation here)
    import io
    import openpyxl
    from openpyxl import Workbook
    from django.http import HttpResponse

    wb = Workbook()
    ws = wb.active
    ws.title = "Clearance Results"

    # Headers
    ws.append(["Faculty Name", "College", "Department", "Status", "Completion Date"])

    # Sample data - replace with actual query
    ws.append(["Sample Faculty", college_name or "Sample College", "Sample Dept", "Completed", "2025-01-15"])

    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="clearance_results_{academic_year or "all"}_{term or "all"}.xlsx"',
        },
    )
    wb.save(response)
    return response


def ovphe_system_analytics_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    academic_year = (request.GET.get("academic_year") or "").strip()
    term = (request.GET.get("term") or "").strip()
    college_id = (request.GET.get("college_id") or "").strip()

    admin = _get_active_ovphe_admin(request) or _get_active_ciso_admin(request)

    try:
        year_val = int(academic_year) if academic_year else None
    except Exception:
        return JsonResponse({"detail": "Invalid academic_year"}, status=400)

    term_val = term or None

    if not year_val or not term_val:
        active_timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year_start", "-id").first()
        if active_timeline:
            year_val = year_val or active_timeline.academic_year_start
            term_val = term_val or active_timeline.term

    if not year_val or not term_val:
        return JsonResponse({"rows": []})

    clearances = Clearance.objects.select_related("faculty", "faculty__college").filter(
        academic_year=year_val,
        term=term_val,
    )
    if college_id:
        clearances = clearances.filter(faculty__college_id=college_id)

    aggregates = (
        clearances.values("faculty__college_id", "faculty__college__name")
        .annotate(
            total=models.Count("id"),
            completed=models.Count("id", filter=models.Q(status=Clearance.Status.COMPLETED)),
        )
        .order_by("faculty__college__name")
    )

    rows = []
    for r in aggregates:
        c_id = r["faculty__college_id"]
        c_name = r["faculty__college__name"] or ""
        total = int(r["total"] or 0)
        completed = int(r["completed"] or 0)
        incomplete = max(0, total - completed)
        rate = (Decimal(completed) / Decimal(total) * Decimal("100")) if total else Decimal("0")

        if c_id:
            SystemAnalytics.objects.update_or_create(
                academic_year=year_val,
                term=term_val,
                college_id=c_id,
                defaults={
                    "completion_rate": rate,
                    "generated_by": admin,
                },
            )

        rows.append(
            {
                "collegeId": str(c_id) if c_id else "",
                "collegeName": c_name,
                "completionRate": float(rate),
                "academicYear": year_val,
                "term": term_val,
                "completedCount": completed,
                "incompleteCount": incomplete,
                "totalCount": total,
            }
        )

    return JsonResponse({"rows": rows})


@csrf_exempt
def ovphe_activity_logs_api(request):
    if request.method == "POST":
        admin = _get_active_ovphe_admin(request)
        if not admin:
            return JsonResponse({"detail": "OVPHE user not found"}, status=404)

        data, jerr = _parse_json_body(request)
        if jerr:
            return jerr
        if data is None:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)

        event_type = (data.get("event_type") or "").strip()
        details = data.get("details") or []

        if not event_type:
            return JsonResponse({"detail": "event_type is required"}, status=400)
        if event_type not in {c[0] for c in ActivityLog.EventType.choices}:
            return JsonResponse({"detail": "Invalid event_type"}, status=400)
        if not isinstance(details, list):
            return JsonResponse({"detail": "details must be a list"}, status=400)

        obj = ActivityLog.objects.create(
            event_type=event_type,
            user=admin.user if admin else None,
            details=[str(x) for x in details if x is not None],
        )

        return JsonResponse(
            {
                "id": str(obj.id),
                "event_type": obj.event_type,
                "details": list(obj.details or []),
                "created_at": obj.created_at.isoformat() if obj.created_at else None,
            },
            status=201,
        )

    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    q = (request.GET.get("query") or "").strip().lower()
    page = int(request.GET.get("page") or 1)
    page_size = int(request.GET.get("pageSize") or 40)

    qs = ActivityLog.objects.select_related("user", "faculty", "requirement").all()
    if q:
        qs = qs.filter(
            models.Q(event_type__icontains=q)
            | models.Q(approver_department__icontains=q)
            | models.Q(university_id__icontains=q)
            | models.Q(request_id__icontains=q)
            | models.Q(user__email__icontains=q)
            | models.Q(user__first_name__icontains=q)
            | models.Q(user__last_name__icontains=q)
        )

    total = qs.count()
    start = max(0, (page - 1) * page_size)
    logs = qs.order_by("-created_at", "pk")[start : start + page_size]

    items = []
    for log in logs:
        dt = timezone.localtime(log.created_at)
        title = str(log.event_type)
        if log.approver_department:
            title = f"{title} - {log.approver_department}"
        description = ""
        if log.request_id:
            description = f"Request: {log.request_id}"
        items.append(
            {
                "id": str(log.id),
                "dateLabel": dt.strftime("%m/%d/%Y"),
                "timeLabel": _format_time_label(dt),
                "variant": log.event_type,
                "title": title,
                "description": description,
                "firstName": (log.user.first_name if log.user else ""),
                "lastName": (log.user.last_name if log.user else ""),
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


@csrf_exempt
@ciso_required
def ciso_system_guidelines_api(request):
    return _system_guidelines_api(request, "ciso")


@csrf_exempt
def ciso_announcements_api(request):
    return _announcements_api(request, "ciso")


@csrf_exempt
def ciso_system_guideline_detail_api(request, guideline_id: int):
    return _system_guideline_detail_api(request, "ciso", guideline_id)


@csrf_exempt
def ciso_announcement_detail_api(request, announcement_id: int):
    return _announcement_detail_api(request, "ciso", announcement_id)


def ciso_notifications_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    admin = _get_active_ciso_admin(request)
    if not admin:
        return JsonResponse({"detail": "CISO user not found"}, status=404)

    qs = Notification.objects.filter(user=admin.user).order_by("-created_at", "-id")
    items = []
    for n in qs:
        items.append(
            {
                "id": str(n.id),
                "title": n.title or "",
                "description": n.body or "",
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

    admin = _get_active_ciso_admin(request)
    if not admin:
        return JsonResponse({"detail": "CISO user not found"}, status=404)

    q = (request.GET.get("query") or "").strip().lower()
    page = int(request.GET.get("page") or 1)
    page_size = int(request.GET.get("pageSize") or 40)

    qs = ActivityLog.objects.select_related("user", "faculty", "requirement").filter(
        user=admin.user
    )
    if q:
        qs = qs.filter(
            models.Q(event_type__icontains=q)
            | models.Q(approver_department__icontains=q)
            | models.Q(university_id__icontains=q)
            | models.Q(request_id__icontains=q)
            | models.Q(user__email__icontains=q)
            | models.Q(user__first_name__icontains=q)
            | models.Q(user__last_name__icontains=q)
        )

    total = qs.count()
    start = max(0, (page - 1) * page_size)
    logs = qs.order_by("-created_at", "pk")[start : start + page_size]

    items = []
    for log in logs:
        dt = timezone.localtime(log.created_at)
        title = str(log.event_type)
        if log.approver_department:
            title = f"{title} - {log.approver_department}"
        description = ""
        if log.request_id:
            description = f"Request: {log.request_id}"
        items.append(
            {
                "id": str(log.id),
                "dateLabel": dt.strftime("%m/%d/%Y"),
                "timeLabel": _format_time_label(dt),
                "variant": log.event_type,
                "title": title,
                "description": description,
                "firstName": (log.user.first_name if log.user else ""),
                "lastName": (log.user.last_name if log.user else ""),
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


@csrf_exempt
def ciso_system_users_api(request):
    admin, err = _require_ciso_admin_user(request)
    if err:
        return err

    def _full_name(u: User):
        parts = [(u.first_name or "").strip(), (u.middle_name or "").strip(), (u.last_name or "").strip()]
        parts = [p for p in parts if p]
        return " ".join(parts) if parts else u.email

    items = []

    # Get users with admin roles (CISO, OVPHE)
    from .models import UserRole, Role
    admin_roles = ['CISO', 'OVPHE']
    admin_user_roles = UserRole.objects.filter(
        role__name__in=admin_roles, 
        is_active=True
    ).select_related('user', 'role').order_by('user__id')
    
    for user_role in admin_user_roles:
        u = user_role.user
        items.append(
            {
                "id": str(u.id),
                "name": _full_name(u),
                "systemId": f"SYS-{u.id}",
                "userRole": user_role.role.name,
                "universityId": u.university_id or "",
                "college": "N/A",
                "department": user_role.role.name,
                "email": u.email,
                # A user is considered active if they have any active roles
                "isActive": u.get_active_roles().exists(),
            }
        )

    approvers = (
        Approver.objects.select_related("user", "college", "department", "office")
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
                "isActive": u.get_active_roles().exists(),
            }
        )

    assistants = (
        StudentAssistant.objects.select_related("user", "college", "department")
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
                "isActive": u.get_active_roles().exists(),
            }
        )

    def _role_rank(item: dict) -> int:
        role = (item.get("userRole") or "").strip().lower()
        if "admin" in role:
            return 3
        if "assistant" in role:
            return 2
        if "approver" in role:
            return 1
        return 0

    deduped: dict[str, dict] = {}
    for it in items:
        uid = str(it.get("id") or "")
        if not uid:
            continue
        prev = deduped.get(uid)
        if not prev or _role_rank(it) > _role_rank(prev):
            deduped[uid] = it

    items = list(deduped.values())

    if request.method == "GET":
        return JsonResponse({"items": items})

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data, parse_err = _parse_json_body(request)
    if parse_err:
        return parse_err
    if not isinstance(data, dict):
        return JsonResponse({"detail": "Invalid payload"}, status=400)

    first_name = (data.get("firstName") or "").strip()
    middle_name = (data.get("middleName") or "").strip()
    last_name = (data.get("lastName") or "").strip()
    university_id = (data.get("universityId") or "").strip()
    email = _validate_xu_email(data.get("email") or "")
    is_active = bool(data.get("isActive", True))

    if not email:
        return JsonResponse({"detail": "Email must be an XU email (@xu.edu.ph or @my.xu.edu.ph)"}, status=400)
    if not university_id or not university_id.isdigit():
        return JsonResponse({"detail": "University ID must be a valid number"}, status=400)

    system_admin_office = (data.get("systemAdminOffice") or "").strip()
    approver_type = (data.get("approverType") or "").strip()

    if not system_admin_office and not approver_type:
        return JsonResponse({"detail": "Missing user type"}, status=400)

    with transaction.atomic():
        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse({"detail": "Email already exists"}, status=400)
        if User.objects.filter(university_id__iexact=university_id).exists():
            return JsonResponse({"detail": "University ID already exists"}, status=400)

        # Our custom User model does not have a create_user manager or is_active/is_staff fields
        user = User.objects.create(
            email=email,
            university_id=university_id,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
        )

        if system_admin_office:
            office_norm = system_admin_office.strip().upper()
            if office_norm not in {"CISO", "OVPHE"}:
                return JsonResponse({"detail": "Invalid system admin office"}, status=400)

            # Assign appropriate role for system admin users
            from .models import Role, UserRole
            # Create role if it doesn't exist
            role, created = Role.objects.get_or_create(
                name=office_norm,
                defaults={'description': f'{office_norm} admin role'}
            )
            UserRole.objects.get_or_create(
                user=user,
                role=role,
                defaults={'is_active': True}
            )

        if approver_type:
            atype = approver_type.strip().lower()
            if atype not in {"college", "office"}:
                return JsonResponse({"detail": "Invalid approver type"}, status=400)

            college = None
            department = None
            office = None

            if atype == "college":
                college_name = (data.get("college") or "").strip()
                dept_name = (data.get("department") or "").strip()
                if not college_name:
                    return JsonResponse({"detail": "College is required"}, status=400)
                if not dept_name:
                    return JsonResponse({"detail": "Department is required"}, status=400)

                college = College.objects.filter(name__iexact=college_name, is_active=True).first()
                if not college:
                    return JsonResponse({"detail": f"College '{college_name}' not found"}, status=400)

                department = Department.objects.filter(
                    name__iexact=dept_name,
                    college=college,
                    is_active=True,
                ).first()
                if not department:
                    return JsonResponse({"detail": f"Department '{dept_name}' not found in college '{college_name}'"}, status=400)

            if atype == "office":
                office_name = (data.get("office") or "").strip()
                if not office_name:
                    return JsonResponse({"detail": "Office is required"}, status=400)
                office = Office.objects.filter(name__iexact=office_name, is_active=True).first()
                if not office:
                    return JsonResponse({"detail": f"Office '{office_name}' not found"}, status=400)

            Approver.objects.create(
                user=user,
                approver_type="College" if atype == "college" else "Office",
                college=college,
                department=department,
                office=office,
            )
            
            # Assign appropriate role based on approver type
            from .models import Role, UserRole
            if atype == "college":
                role_name = "College Admin"
            else:
                role_name = "Office Admin"
            
            # Create role if it doesn't exist
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': f'{role_name} role'}
            )
            UserRole.objects.get_or_create(
                user=user,
                role=role,
                defaults={'is_active': True}
            )

    return JsonResponse({"ok": True, "id": str(user.id)})


def _legacy_faculty_dashboard_api_v2(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    email = (request.GET.get("email") or "").strip()
    university_id = (request.GET.get("university_id") or "").strip()
    timeline_id = (request.GET.get("timelineId") or request.GET.get("timeline_id") or "").strip()

    if not email and not university_id:
        email = "faculty.seed@xu.edu.ph"

    # Our custom User model has no is_active flag; rely on existence of Faculty rows instead
    qs = Faculty.objects.select_related("user", "college", "department")
    if email:
        qs = qs.filter(user__email=email)
    if university_id:
        qs = qs.filter(user__university_id=university_id)

    faculty = qs.order_by("id").first()
    if not faculty:
        return JsonResponse({"detail": "Faculty not found"}, status=404)

    timeline = None
    if timeline_id:
        timeline = ClearanceTimeline.objects.filter(id=timeline_id).first()
        if not timeline:
            return JsonResponse({"detail": "Timeline not found"}, status=404)
    else:
        timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year_start", "-id").first()
    academic_year = timeline.academic_year_start if timeline else None
    term = timeline.term if timeline else None

    clearance = None
    if academic_year and term:
        clearance = (
            Clearance.objects.filter(faculty=faculty, academic_year=academic_year, term=term)
            .order_by("-id")
            .first()
        )

    if timeline:
        timeline_requests = ClearanceRequest.objects.filter(
            faculty=faculty,
            clearance_timeline=timeline,
        )
    else:
        timeline_requests = ClearanceRequest.objects.none()

    total_reqs = 0
    approved_reqs = 0
    status = "Pending"
    if clearance:
        if clearance.status == Clearance.Status.PENDING:
            status = "Pending"
        elif clearance.status == Clearance.Status.IN_PROGRESS:
            status = "In Progress"
        elif clearance.status == Clearance.Status.COMPLETED:
            status = "Completed"
        elif clearance.status == Clearance.Status.REJECTED:
            status = "Rejected"
        else:
            status = str(clearance.status)

        total_reqs = timeline_requests.count()
        approved_reqs = timeline_requests.filter(
            status=ClearanceRequest.Status.APPROVED
        ).count()

        config = get_approver_flow_config(timeline_id=timeline.id if timeline else None)
        if config:
            flow_steps = (
                ApproverFlowStep.objects.select_related("office")
                .prefetch_related("colleges")
                .filter(config=config)
                .order_by("order", "id")
            )

            # Collect applicable requirements per step based on requirement associations.
            # Department Chair: requirements tied to the faculty department
            # College Dean: requirements tied to the faculty college
            # Office-based steps: requirements tied to that office
            dept_reqs = Requirement.objects.filter(
                clearance_timeline=timeline,
                target_departments=faculty.department,
                is_active=True,
            ).distinct() if faculty.department_id else Requirement.objects.none()
            college_reqs = Requirement.objects.filter(
                clearance_timeline=timeline,
                target_colleges=faculty.college,
                is_active=True,
            ).distinct() if faculty.college_id else Requirement.objects.none()
            office_requirements = {}
            office_ids = [fs.office_id for fs in flow_steps if fs.office_id]
            if office_ids:
                for office_id in set(office_ids):
                    office_requirements[office_id] = list(
                        Requirement.objects.filter(
                            clearance_timeline=timeline,
                            target_offices__id=office_id,
                            is_active=True,
                        ).distinct().order_by("id")
                    )

            # Map clearance request status by requirement
            req_status_by_id = {
                cr.requirement_id: cr.status
                for cr in timeline_requests.select_related("requirement")
            }

            def _step_status_label(req_statuses):
                if not req_statuses:
                    return "PENDING"
                if any(s == ClearanceRequest.Status.REJECTED for s in req_statuses):
                    return "REJECTED"
                if all(s == ClearanceRequest.Status.APPROVED for s in req_statuses):
                    return "APPROVED"
                return "PENDING"

            def _status_variant(label: str) -> str:
                if label == "APPROVED":
                    return "success"
                if label == "REJECTED":
                    return "destructive"
                return "warning"

            index = 1
            for fs in flow_steps:
                # Apply college scoping if the step has explicit colleges assigned
                step_college_ids = {c.id for c in fs.colleges.all()}
                if step_college_ids and faculty.college_id and faculty.college_id not in step_college_ids:
                    continue

                if (fs.category or "").strip().lower() == "department chair":
                    reqs = list(dept_reqs.order_by("id"))
                elif (fs.category or "").strip().lower() == "college dean":
                    reqs = list(college_reqs.order_by("id"))
                elif fs.office_id:
                    reqs = office_requirements.get(fs.office_id, [])
                else:
                    reqs = []

                req_items = []
                req_statuses = []
                for r in reqs:
                    s = req_status_by_id.get(r.id, ClearanceRequest.Status.PENDING)
                    req_statuses.append(s)
                    req_items.append(
                        {
                            "id": str(r.id),
                            "title": r.title,
                            "description": r.description or "",
                            "status": s,
                            "completed": s == ClearanceRequest.Status.APPROVED,
                        }
                    )

                step_label = _step_status_label(req_statuses)
                steps_payload.append(
                    {
                        "index": index,
                        "title": fs.category or (fs.office.name if fs.office else ""),
                        "statusLabel": step_label,
                        "statusVariant": _status_variant(step_label),
                        "collapsedType": "status",
                        "requirements": req_items,
                    }
                )
                index += 1

    return JsonResponse(
        {
            "faculty": {
                "email": faculty.user.email,
                "universityId": faculty.user.university_id or "",
                "firstName": faculty.user.first_name or faculty.first_name or "",
                "middleName": faculty.user.middle_name or faculty.middle_name or "",
                "lastName": faculty.user.last_name or faculty.last_name or "",
                "college": faculty.college.name if faculty.college else "",
                "department": faculty.department.name if faculty.department else "",
                "facultyType": faculty.faculty_type or "",
            },
            "timeline": {
                "academicYear": academic_year,
                "term": term,
            },
            "clearance": {
                "status": status,
                "approvedCount": approved_reqs,
                "totalCount": total_reqs,
            },
        }
    )


def faculty_notifications_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    email = (request.GET.get("email") or "").strip()
    university_id = (request.GET.get("university_id") or "").strip()

    if not email and not university_id:
        email = "faculty.seed@xu.edu.ph"

    qs = User.objects.filter(is_active=True, user_type=User.UserType.FACULTY)
    if email:
        qs = qs.filter(email=email)
    if university_id:
        qs = qs.filter(university_id=university_id)

    user = qs.order_by("id").first()
    if not user:
        return JsonResponse({"detail": "Faculty user not found"}, status=404)

    notifications = Notification.objects.filter(
        models.Q(user=user) | models.Q(user_role__istartswith="Assistant")
    ).order_by("-created_at", "-id")
    items = []
    for n in notifications:
        items.append(
            {
                "id": str(n.id),
                "title": n.title or "",
                "description": n.body or "",
                "status": n.status,
                "details": list(n.details or []),
                "timestamp": _format_timestamp(n.created_at),
                "is_read": bool(n.is_read),
            }
        )

    return JsonResponse({"items": items})


@faculty_required
def faculty_dashboard_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    # Get the authenticated user
    authenticated_user = _get_authenticated_user(request)
    if not authenticated_user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    email = (request.GET.get("email") or "").strip()
    university_id = (request.GET.get("university_id") or "").strip()
    timeline_id = (request.GET.get("timelineId") or request.GET.get("timeline_id") or "").strip()

    # Use authenticated user's email if no specific email provided
    if not email and not university_id:
        email = authenticated_user.email

    qs = Faculty.objects.select_related("user", "college", "department")
    if email:
        qs = qs.filter(user__email=email)
    if university_id:
        qs = qs.filter(user__university_id=university_id)

    faculty = qs.order_by("id").first()
    if not faculty:
        return JsonResponse({"detail": "Faculty not found"}, status=404)

    timeline = None
    if timeline_id:
        timeline = ClearanceTimeline.objects.filter(id=timeline_id).first()
        if not timeline:
            return JsonResponse({"detail": "Timeline not found"}, status=404)
    else:
        timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year_start", "-id").first()
    academic_year = timeline.academic_year_start if timeline else None
    term = timeline.term if timeline else None

    clearance = None
    if academic_year and term:
        clearance = (
            Clearance.objects.filter(faculty=faculty, academic_year=academic_year, term=term)
            .order_by("-id")
            .first()
        )

    if timeline:
        timeline_requests = ClearanceRequest.objects.filter(
            faculty=faculty,
            clearance_timeline=timeline,
        )
    else:
        timeline_requests = ClearanceRequest.objects.none()

    total_reqs = 0
    approved_reqs = 0
    status = "Pending"
    if clearance:
        if clearance.status == Clearance.Status.PENDING:
            status = "Pending"
        elif clearance.status == Clearance.Status.IN_PROGRESS:
            status = "In Progress"
        elif clearance.status == Clearance.Status.COMPLETED:
            status = "Completed"
        elif clearance.status == Clearance.Status.REJECTED:
            status = "Rejected"
        else:
            status = str(clearance.status)
    elif timeline_requests.filter(status=ClearanceRequest.Status.APPROVED).exists():
        status = "In Progress"

    total_reqs = timeline_requests.count()
    approved_reqs = timeline_requests.filter(status=ClearanceRequest.Status.APPROVED).count()

    # Generate steps data for frontend
    steps = []
    if timeline:
        # Get clearance requests grouped by approver category/office
        clearance_requests = timeline_requests.select_related('requirement')
        
        # Get approver flow configuration from active timeline
        approver_flow_config = timeline.approver_flow_configs.first()
        
        if approver_flow_config:
            # Use dynamic approver flow from timeline configuration
            flow_steps = approver_flow_config.steps.order_by('order').prefetch_related('colleges')
            
            display_index = 1  # Use separate index for display after filtering
            for flow_step in flow_steps:
                # Check if this step applies to the faculty's college
                # If step has no colleges specified, it applies to all
                # If step has colleges specified, only show if faculty's college is included
                step_colleges = list(flow_step.colleges.all())
                if step_colleges and faculty.college and faculty.college not in step_colleges:
                    # This step doesn't apply to this faculty's college, skip it
                    continue
                
                # Generate dynamic step title based on faculty's college/department
                step_title = flow_step.category
                if flow_step.category.lower() == "department chair" and faculty.department:
                    step_title = f"{faculty.department.name} Department Chair"
                elif flow_step.category.lower() == "college dean" and faculty.college:
                    step_title = f"{faculty.college.name} Dean"
                
                # Find requests for this step
                step_requests = clearance_requests.filter(
                    requirement__title__icontains=flow_step.category
                )
                
                if step_requests.exists():
                    # Determine step status based on requests
                    approved_count = step_requests.filter(status=ClearanceRequest.Status.APPROVED).count()
                    total_count = step_requests.count()
                    
                    if approved_count == total_count and total_count > 0:
                        status_label = "APPROVED"
                        status_variant = "success"
                        collapsed_type = "status"
                    elif approved_count > 0:
                        status_label = "IN_PROGRESS"
                        status_variant = "warning"
                        collapsed_type = "status"
                    else:
                        status_label = "PENDING"
                        status_variant = "warning"
                        collapsed_type = "status"
                    
                    # Get requirements for this step
                    requirements = []
                    for req in step_requests:
                        requirements.append({
                            "title": req.requirement.title,
                            "description": req.requirement.description or "",
                            "completed": req.status == ClearanceRequest.Status.APPROVED
                        })
                    
                    steps.append({
                        "index": display_index,
                        "title": step_title,
                        "statusLabel": status_label,
                        "statusVariant": status_variant,
                        "collapsedType": collapsed_type,
                        "submittedTo": f"{step_title}",
                        "submittedOn": clearance.submitted_date.strftime("%B %d, %Y") if clearance and clearance.submitted_date else "",
                        "requirements": requirements
                    })
                    display_index += 1
                else:
                    # Step not applicable or locked
                    steps.append({
                        "index": display_index,
                        "title": step_title,
                        "statusLabel": "LOCKED",
                        "statusVariant": "muted",
                        "collapsedType": "locked",
                        "submittedTo": f"{step_title}",
                        "submittedOn": "",
                        "requirements": []
                    })
                    display_index += 1
        else:
            # No approver flow configuration found - return empty steps
            # This requires administrators to configure approver flows for clearance timelines
            pass

    return JsonResponse(
        {
            "faculty": {
                "email": faculty.user.email,
                "universityId": faculty.user.university_id or "",
                "firstName": faculty.user.first_name or faculty.first_name or "",
                "middleName": faculty.user.middle_name or faculty.middle_name or "",
                "lastName": faculty.user.last_name or faculty.last_name or "",
                "college": faculty.college.name if faculty.college else "",
                "department": faculty.department.name if faculty.department else "",
                "facultyType": faculty.faculty_type or "",
            },
            "timeline": {
                "academicYear": academic_year,
                "term": term,
            },
            "clearance": {
                "status": status,
                "approvedCount": approved_reqs,
                "totalCount": total_reqs,
            },
            "steps": steps,
        }
    )


def faculty_notifications_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    email = (request.GET.get("email") or "").strip()
    university_id = (request.GET.get("university_id") or "").strip()

    if not email and not university_id:
        email = "faculty.seed@xu.edu.ph"

    qs = User.objects.filter(is_active=True, user_type=User.UserType.FACULTY)
    if email:
        qs = qs.filter(email=email)
    if university_id:
        qs = qs.filter(university_id=university_id)

    user = qs.order_by("id").first()
    if not user:
        return JsonResponse({"detail": "Faculty user not found"}, status=404)

    notifications = Notification.objects.filter(user=user).order_by("-created_at", "-id")
    items = []
    for n in notifications:
        items.append(
            {
                "id": str(n.id),
                "title": n.title or "",
                "description": n.body or "",
                "status": n.status,
                "details": list(n.details or []),
                "timestamp": _format_timestamp(n.created_at),
                "is_read": bool(n.is_read),
            }
        )

    return JsonResponse({"items": items})


@csrf_exempt
def approver_assistant_approvers_api(request):
    user, err = _require_approver_user(request)
    if err:
        return err

    def _full_name(u: User):
        parts = [(u.first_name or "").strip(), (u.middle_name or "").strip(), (u.last_name or "").strip()]
        parts = [p for p in parts if p]
        return " ".join(parts) if parts else u.email

    items = []

    assistants = (
        StudentAssistant.objects.select_related("user", "college", "department")
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
                "isActive": u.get_active_roles().exists(),
            }
        )

    if request.method == "GET":
        return JsonResponse({"items": items})

    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data, parse_err = _parse_json_body(request)
    if parse_err:
        return parse_err
    if not isinstance(data, dict):
        return JsonResponse({"detail": "Invalid payload"}, status=400)

    first_name = (data.get("firstName") or "").strip()
    middle_name = (data.get("middleName") or "").strip()
    last_name = (data.get("lastName") or "").strip()
    university_id = (data.get("universityId") or "").strip()
    email = _validate_xu_email(data.get("email") or "")
    is_active = bool(data.get("isActive", True))

    if not email:
        return JsonResponse({"detail": "Email must be an XU email (@xu.edu.ph or @my.xu.edu.ph)"}, status=400)
    if not university_id or not university_id.isdigit():
        return JsonResponse({"detail": "University ID must be a valid number"}, status=400)

    college_name = (data.get("college") or "").strip()
    dept_name = (data.get("department") or "").strip()
    if not college_name:
        return JsonResponse({"detail": "College is required"}, status=400)
    if not dept_name:
        return JsonResponse({"detail": "Department is required"}, status=400)

    college = College.objects.filter(name__iexact=college_name, is_active=True).first()
    if not college:
        return JsonResponse({"detail": "College not found"}, status=400)

    department = Department.objects.filter(
        name__iexact=dept_name,
        college=college,
        is_active=True,
    ).first()
    if not department:
        return JsonResponse({"detail": "Department not found"}, status=400)

    with transaction.atomic():
        if User.objects.filter(email__iexact=email).exists():
            return JsonResponse({"detail": "Email already exists"}, status=400)
        if User.objects.filter(university_id__iexact=university_id).exists():
            return JsonResponse({"detail": "University ID already exists"}, status=400)

        user = User.objects.create_user(
            email=email,
            university_id=university_id,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            is_active=is_active,
            is_staff=True,
        )

        StudentAssistant.objects.create(
            user=user,
            college=college,
            department=department,
            supervisor_approver=user,  # Assign the current approver as supervisor
        )
        
        # Assign Student Assistant role
        from .models import Role, UserRole
        student_role, created = Role.objects.get_or_create(
            name='Student Assistant',
            defaults={'description': 'Student Assistant role'}
        )
        UserRole.objects.get_or_create(
            user=user,
            role=student_role,
            defaults={'is_active': True}
        )

    return JsonResponse({"ok": True, "id": str(user.id)})


@csrf_exempt
def approver_assistant_approver_detail_api(request, user_id):
    user, err = _require_approver_user(request)
    if err:
        return err

    try:
        user_id_int = int(user_id)
    except ValueError:
        return JsonResponse({"detail": "Invalid user ID"}, status=400)

    try:
        user = User.objects.get(pk=user_id_int)
    except User.DoesNotExist:
        return JsonResponse({"detail": "User not found"}, status=404)

    def _full_name(u: User):
        parts = [(u.first_name or "").strip(), (u.middle_name or "").strip(), (u.last_name or "").strip()]
        parts = [p for p in parts if p]
        return " ".join(parts) if parts else u.email

    if request.method == "GET":
        assistant_profile = getattr(user, "assistant_profile", None)
        if not assistant_profile:
            return JsonResponse({"detail": "Assistant profile not found"}, status=404)

        return JsonResponse(
            {
                "item": {
                    "id": str(user.id),
                    "name": _full_name(user),
                    "systemId": f"SYS-{u.id}",
                    "userRole": "Assistant Approver",
                    "universityId": user.university_id or "",
                    "college": assistant_profile.college.name if assistant_profile.college else "N/A",
                    "department": assistant_profile.department.name if assistant_profile.department else "N/A",
                    "email": user.email,
                    "isActive": bool(user.is_active),
                }
            }
        )

    if request.method == "DELETE":
        assistant_profile = getattr(user, "assistant_profile", None)
        if not assistant_profile:
            return JsonResponse({"detail": "Assistant profile not found"}, status=404)

        with transaction.atomic():
            # Delete related profiles first
            assistant_profile.delete()

            # Delete the user completely
            user.delete()

        return JsonResponse({"ok": True})

    if request.method not in {"PUT", "PATCH"}:
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    data, parse_err = _parse_json_body(request)
    if parse_err:
        return parse_err
    if not isinstance(data, dict):
        return JsonResponse({"detail": "Invalid payload"}, status=400)

    first_name = (data.get("firstName") or "").strip()
    middle_name = (data.get("middleName") or "").strip()
    last_name = (data.get("lastName") or "").strip()
    university_id = (data.get("universityId") or "").strip()
    email = _validate_xu_email(data.get("email") or "")
    is_active = bool(data.get("isActive", True))

    if not email:
        return JsonResponse({"detail": "Email must be an XU email (@xu.edu.ph or @my.xu.edu.ph)"}, status=400)
    if not university_id or not university_id.isdigit():
        return JsonResponse({"detail": "University ID must be a valid number"}, status=400)

    college_name = (data.get("college") or "").strip()
    dept_name = (data.get("department") or "").strip()
    if not college_name:
        return JsonResponse({"detail": "College is required"}, status=400)
    if not dept_name:
        return JsonResponse({"detail": "Department is required"}, status=400)

    college = College.objects.filter(name__iexact=college_name, is_active=True).first()
    if not college:
        return JsonResponse({"detail": "College not found"}, status=400)

    department = Department.objects.filter(
        name__iexact=dept_name,
        college=college,
        is_active=True,
    ).first()
    if not department:
        return JsonResponse({"detail": "Department not found"}, status=400)

    assistant_profile = getattr(user, "assistant_profile", None)
    if not assistant_profile:
        return JsonResponse({"detail": "Assistant profile not found"}, status=404)

    with transaction.atomic():
        if User.objects.filter(email__iexact=email).exclude(pk=user.id).exists():
            return JsonResponse({"detail": "Email already exists"}, status=400)
        if User.objects.filter(university_id__iexact=university_id).exclude(pk=user.id).exists():
            return JsonResponse({"detail": "University ID already exists"}, status=400)

        user.email = email
        user.university_id = university_id
        user.first_name = first_name
        user.middle_name = middle_name
        user.last_name = last_name
        user.is_active = is_active
        user.save(update_fields=[
            "email",
            "university_id",
            "first_name",
            "middle_name",
            "last_name",
            "is_active",
        ])

        assistant_profile.college = college
        assistant_profile.department = department
        assistant_profile.save(update_fields=["college", "department"])

    return JsonResponse({"ok": True})


def get_approver_flow_config(timeline_id=None):
    """
    Get approver flow configuration for a specific timeline.
    Falls back to global config if no timeline-specific config exists.
    """
    config = None
    
    if timeline_id:
        try:
            timeline = ClearanceTimeline.objects.get(id=timeline_id)
            config = ApproverFlowConfig.objects.filter(clearance_timeline=timeline).order_by("-updated_at", "pk").first()
        except ClearanceTimeline.DoesNotExist:
            pass
        return config
    
    # Fallback to global config (null clearance_timeline)
    if not config:
        config = ApproverFlowConfig.objects.filter(clearance_timeline__isnull=True).order_by("-updated_at", "pk").first()
    
    return config


# New endpoints for Frontend V2

# Faculty additional endpoints
def faculty_archived_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)
    
    faculty = getattr(user, "faculty_profile", None)
    if not faculty:
        return JsonResponse({"detail": "Faculty profile not found"}, status=404)
    
    archived_timelines = ClearanceTimeline.objects.filter(archive_date__isnull=False).order_by("-archive_date")
    for timeline in archived_timelines:
        _ensure_archived_timeline_records(timeline)

    items = []
    for timeline in archived_timelines:
        has_archived_snapshot = ArchivedClearance.objects.filter(
            clearance_timeline=timeline,
            faculty=faculty,
        ).exists()
        has_live_clearance = Clearance.objects.filter(
            faculty=faculty,
            academic_year=timeline.academic_year_start,
            term=timeline.term,
        ).exists()
        has_timeline_request = ClearanceRequest.objects.filter(
            faculty=faculty,
            clearance_timeline=timeline,
        ).exists()

        if not (has_archived_snapshot or has_live_clearance or has_timeline_request):
            continue

        start_year = str(timeline.academic_year_start or "")
        end_year = str(timeline.academic_year_end or "")
        items.append({
            "id": str(timeline.id),
            "name": timeline.name or _clearance_timeline_name(timeline.academic_year_start, timeline.academic_year_end, timeline.term),
            "academicYear": f"{start_year}-{end_year}",
            "semester": _term_to_label(timeline.term),
            "clearancePeriodStart": timeline.clearance_start_date.strftime("%m/%d/%Y"),
            "clearancePeriodEnd": timeline.clearance_end_date.strftime("%m/%d/%Y"),
            "lastUpdated": timeline.updated_at.strftime("%B %d, %Y, %H:%M %p"),
            "archivedDate": timeline.archive_date.strftime("%B %d, %Y, %H:%M %p"),
        })
    
    return JsonResponse({"items": items})

def faculty_view_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)
    
    faculty = getattr(user, "faculty_profile", None)
    if not faculty:
        return JsonResponse({"detail": "Faculty profile not found"}, status=404)

    timeline_id = (request.GET.get("timelineId") or request.GET.get("timeline_id") or "").strip()

    timeline = None
    if timeline_id:
        timeline = ClearanceTimeline.objects.filter(id=timeline_id).first()
        if not timeline:
            return JsonResponse({"detail": "Timeline not found"}, status=404)
    else:
        timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year_start", "-id").first()
    if not timeline:
        return JsonResponse({"detail": "No active clearance timeline"}, status=404)
    if timeline.archive_date:
        _ensure_archived_timeline_records(timeline)
        archived = ArchivedClearance.objects.filter(
            faculty=faculty,
            clearance_timeline=timeline,
        ).first()

        if not archived:
            return JsonResponse({"detail": "Archived clearance not found"}, status=404)

        archived_data = archived.clearance_data or {}
        archived_requests = archived_data.get("requests") or []
        clearance_requests = []
        for index, req in enumerate(archived_requests, start=1):
            clearance_requests.append({
                "id": req.get("id") or index,
                "requestId": req.get("requestId") or "",
                "title": req.get("title") or "",
                "description": req.get("description") or "",
                "status": req.get("status") or ClearanceRequest.Status.PENDING,
                "submissionNotes": req.get("submissionNotes") or "",
                "submissionLink": req.get("submissionLink") or "",
                "submittedDate": req.get("submittedDate"),
                "approvedDate": req.get("approvedDate"),
                "approvedBy": req.get("approvedBy"),
                "remarks": req.get("remarks") or "",
            })

        return JsonResponse({
            "timeline": {
                "id": str(timeline.id),
                "name": timeline.name or _clearance_timeline_name(timeline.academic_year_start, timeline.academic_year_end, timeline.term),
                "academicYear": f"{timeline.academic_year_start}-{timeline.academic_year_end}",
                "semester": _term_to_label(timeline.term),
                "archivedDate": timeline.archive_date.strftime("%B %d, %Y, %H:%M %p") if timeline.archive_date else None,
            },
            "clearance": {
                "id": archived.id,
                "academicYear": archived.academic_year,
                "term": archived.semester,
                "status": archived.status,
                "submittedDate": None,
                "completedDate": archived.last_updated.strftime("%Y-%m-%d %H:%M:%S") if archived.last_updated else None,
                "lastUpdated": archived.last_updated.strftime("%Y-%m-%d %H:%M:%S") if archived.last_updated else None,
                "missingApproval": archived_data.get("missing_approval", ""),
                "approvedCount": archived_data.get("approved_count", 0),
                "totalCount": archived_data.get("request_count", len(clearance_requests)),
            },
            "requests": clearance_requests,
        })

    clearance = Clearance.objects.filter(
        faculty=faculty, 
        academic_year=timeline.academic_year_start, 
        term=timeline.term
    ).first()
    
    if not clearance:
        return JsonResponse({"detail": "Clearance not found"}, status=404)
    
    requests = ClearanceRequest.objects.filter(
        faculty=faculty,
        clearance_timeline=timeline,
    ).select_related('requirement', 'approved_by')
    
    clearance_requests = []
    for req in requests:
        clearance_requests.append({
            "id": req.id,
            "requestId": req.request_id,
            "title": req.requirement.title,
            "description": req.requirement.description or "",
            "status": req.status,
            "submissionNotes": req.submission_notes,
            "submissionLink": req.submission_link,
            "submittedDate": req.submitted_date.strftime("%Y-%m-%d %H:%M:%S") if req.submitted_date else None,
            "approvedDate": req.approved_date.strftime("%Y-%m-%d %H:%M:%S") if req.approved_date else None,
            "approvedBy": req.approved_by.get_full_name() if req.approved_by else None,
            "remarks": req.remarks,
        })
    
    return JsonResponse({
        "timeline": {
            "id": str(timeline.id),
            "name": timeline.name or _clearance_timeline_name(timeline.academic_year_start, timeline.academic_year_end, timeline.term),
            "academicYear": f"{timeline.academic_year_start}-{timeline.academic_year_end}",
            "semester": _term_to_label(timeline.term),
            "archivedDate": None,
        },
        "clearance": {
            "id": clearance.id,
            "academicYear": clearance.academic_year,
            "term": clearance.term,
            "status": clearance.status,
            "submittedDate": clearance.submitted_date.strftime("%Y-%m-%d %H:%M:%S") if clearance.submitted_date else None,
            "completedDate": clearance.completed_date.strftime("%Y-%m-%d %H:%M:%S") if clearance.completed_date else None,
            "lastUpdated": clearance.updated_at.strftime("%Y-%m-%d %H:%M:%S") if getattr(clearance, "updated_at", None) else None,
            "missingApproval": "",
            "approvedCount": sum(1 for req in clearance_requests if req["status"] == ClearanceRequest.Status.APPROVED),
            "totalCount": len(clearance_requests),
        },
        "requests": clearance_requests
    })

# Approver endpoints
@approver_required
def approver_dashboard_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return JsonResponse({"detail": "Authentication required"}, status=401)
    
    # Check if user is an approver
    if not user.is_approver():
        return JsonResponse({"detail": "Access denied"}, status=403)
    
    # Get active timeline
    timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year_start", "-id").first()
    
    # Get pending clearance requests for this approver
    pending_requests = []
    if timeline:
        # Get requirements that this approver needs to approve
        requirements = Requirement.objects.filter(
            clearance_timeline=timeline,
            is_active=True
        )
        
        # Get approver profile
        approver = getattr(user, "approver_profile", None)
        if approver:
            # Filter based on approver's scope
            if approver.college:
                requirements = requirements.filter(target_colleges=approver.college)
            elif approver.department:
                requirements = requirements.filter(target_departments=approver.department)
            elif approver.office:
                requirements = requirements.filter(target_offices=approver.office)
        
        clearance_requests = ClearanceRequest.objects.filter(
            clearance_timeline=timeline,
            requirement__in=requirements,
            status=ClearanceRequest.Status.PENDING
        ).select_related('faculty__user', 'requirement')
        
        for req in clearance_requests:
            pending_requests.append({
                "id": req.id,
                "requestId": req.request_id,
                "facultyName": req.faculty.user.get_full_name() or req.faculty.user.email,
                "facultyEmail": req.faculty.user.email,
                "title": req.requirement.title,
                "submittedDate": req.submitted_date.strftime("%Y-%m-%d") if req.submitted_date else None,
            })
    
    return JsonResponse({
        "pendingRequests": pending_requests,
        "pendingCount": len(pending_requests),
        "timeline": {
            "academicYear": timeline.academic_year_start if timeline else None,
            "term": timeline.term if timeline else None,
        }
    })

# Placeholder implementations for remaining endpoints
def approver_requirement_list_api(request):
    return JsonResponse({"items": []})

def approver_clearance_api(request):
    return JsonResponse({"items": []})

def approver_action_api(request):
    return JsonResponse({"success": True, "message": "Action completed"})

def approver_assistant_list_api(request):
    return JsonResponse({"items": []})

def approver_activity_logs_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    q = (request.GET.get("query") or "").strip().lower()
    page = int(request.GET.get("page") or 1)
    page_size = int(request.GET.get("pageSize") or 40)

    # Get activity logs related to this approver
    qs = ActivityLog.objects.select_related("user", "faculty", "requirement").filter(
        user=user
    )
    if q:
        qs = qs.filter(
            models.Q(event_type__icontains=q)
            | models.Q(approver_department__icontains=q)
            | models.Q(university_id__icontains=q)
            | models.Q(request_id__icontains=q)
            | models.Q(user__email__icontains=q)
            | models.Q(user__first_name__icontains=q)
            | models.Q(user__last_name__icontains=q)
        )

    total = qs.count()
    start = max(0, (page - 1) * page_size)
    logs = qs.order_by("-created_at", "pk")[start : start + page_size]

    items = []
    for log in logs:
        dt = timezone.localtime(log.created_at)
        title = str(log.event_type)
        if log.approver_department:
            title = f"{title} - {log.approver_department}"
        description = ""
        if log.request_id:
            description = f"Request: {log.request_id}"
        items.append(
            {
                "id": str(log.id),
                "dateLabel": dt.strftime("%m/%d/%Y"),
                "timeLabel": _format_time_label(dt),
                "variant": log.event_type,
                "title": title,
                "description": description,
                "firstName": (log.user.first_name if log.user else ""),
                "lastName": (log.user.last_name if log.user else ""),
            }
        )
    return JsonResponse({"items": items, "total": total})

def approver_notifications_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    notifications = Notification.objects.filter(user=user).order_by("-created_at", "-id")
    items = []
    for n in notifications:
        items.append(
            {
                "id": str(n.id),
                "title": n.title or "",
                "body": n.body or "",
                "status": n.status,
                "is_read": bool(n.is_read),
            }
        )
    return JsonResponse({"items": items})

def approver_archived_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)
    
    # Get archived timelines (where archive_date is not null)
    archived_timelines = ClearanceTimeline.objects.filter(archive_date__isnull=False).order_by("-archive_date")
    
    items = []
    for timeline in archived_timelines:
        start_year = str(timeline.academic_year_start or "")
        end_year = str(timeline.academic_year_end or "")
        items.append({
            "id": str(timeline.id),
            "name": timeline.name or _clearance_timeline_name(timeline.academic_year_start, timeline.academic_year_end, timeline.term),
            "academicYear": f"{start_year}-{end_year}",
            "semester": _term_to_label(timeline.term),
            "clearancePeriodStart": timeline.clearance_start_date.strftime("%m/%d/%Y"),
            "clearancePeriodEnd": timeline.clearance_end_date.strftime("%m/%d/%Y"),
            "lastUpdated": timeline.updated_at.strftime("%B %d, %Y, %H:%M %p"),
            "archivedDate": timeline.archive_date.strftime("%B %d, %Y, %H:%M %p"),
        })
    
    return JsonResponse({"items": items})

def approver_view_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    timeline_id = (request.GET.get("timelineId") or request.GET.get("timeline_id") or "").strip()
    status_filter = (request.GET.get("status") or "").strip().upper()

    if not timeline_id:
        return JsonResponse({"detail": "Missing timelineId"}, status=400)

    timeline = ClearanceTimeline.objects.filter(id=timeline_id, archive_date__isnull=False).first()
    if not timeline:
        return JsonResponse({"detail": "Archived timeline not found"}, status=404)

    items = _archived_clearance_items_for_timeline(timeline, status_filter)
    return JsonResponse({"items": items})

def approver_individual_approval_api(request):
    return JsonResponse({"items": []})

# Assistant Approver endpoints
@assistant_required
def assistant_approver_dashboard_api(request):
    return JsonResponse({"pendingRequests": [], "pendingCount": 0})

def assistant_approver_requirement_list_api(request):
    return JsonResponse({"items": []})

def assistant_approver_clearance_api(request):
    return JsonResponse({"items": []})

def assistant_approver_notifications_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    notifications = Notification.objects.filter(user=user).order_by("-created_at", "-id")
    items = []
    for n in notifications:
        items.append(
            {
                "id": str(n.id),
                "title": n.title or "",
                "body": n.body or "",
                "status": n.status,
                "is_read": bool(n.is_read),
            }
        )
    return JsonResponse({"items": items})

def assistant_approver_archived_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)
    
    # Get archived timelines (where archive_date is not null)
    archived_timelines = ClearanceTimeline.objects.filter(archive_date__isnull=False).order_by("-archive_date")
    
    items = []
    for timeline in archived_timelines:
        start_year = str(timeline.academic_year_start or "")
        end_year = str(timeline.academic_year_end or "")
        items.append({
            "id": str(timeline.id),
            "name": timeline.name or _clearance_timeline_name(timeline.academic_year_start, timeline.academic_year_end, timeline.term),
            "academicYear": f"{start_year}-{end_year}",
            "semester": _term_to_label(timeline.term),
            "clearancePeriodStart": timeline.clearance_start_date.strftime("%m/%d/%Y"),
            "clearancePeriodEnd": timeline.clearance_end_date.strftime("%m/%d/%Y"),
            "lastUpdated": timeline.updated_at.strftime("%B %d, %Y, %H:%M %p"),
            "archivedDate": timeline.archive_date.strftime("%B %d, %Y, %H:%M %p"),
        })
    
    return JsonResponse({"items": items})

def assistant_approver_individual_approval_api(request):
    return JsonResponse({"items": []})

def assistant_approver_view_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    timeline_id = (request.GET.get("timelineId") or request.GET.get("timeline_id") or "").strip()
    status_filter = (request.GET.get("status") or "").strip().upper()

    if not timeline_id:
        return JsonResponse({"detail": "Missing timelineId"}, status=400)

    timeline = ClearanceTimeline.objects.filter(id=timeline_id, archive_date__isnull=False).first()
    if not timeline:
        return JsonResponse({"detail": "Archived timeline not found"}, status=404)

    items = _archived_clearance_items_for_timeline(timeline, status_filter)
    return JsonResponse({"items": items})

# Additional OVPHE endpoints
def ovphe_tools_api(request):
    return JsonResponse({"tools": []})

def ovphe_archived_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)
    
    # Get archived timelines (where archive_date is not null)
    archived_timelines = ClearanceTimeline.objects.filter(archive_date__isnull=False).order_by("-archive_date")
    
    items = []
    for timeline in archived_timelines:
        start_year = str(timeline.academic_year_start or "")
        end_year = str(timeline.academic_year_end or "")
        items.append({
            "id": str(timeline.id),
            "name": timeline.name or _clearance_timeline_name(timeline.academic_year_start, timeline.academic_year_end, timeline.term),
            "academicYear": f"{start_year}-{end_year}",
            "semester": _term_to_label(timeline.term),
            "clearancePeriodStart": timeline.clearance_start_date.strftime("%m/%d/%Y"),
            "clearancePeriodEnd": timeline.clearance_end_date.strftime("%m/%d/%Y"),
            "lastUpdated": timeline.updated_at.strftime("%B %d, %Y, %H:%M %p"),
            "archivedDate": timeline.archive_date.strftime("%B %d, %Y, %H:%M %p"),
        })
    
    return JsonResponse({"items": items})

def ovphe_view_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)
    
    timeline_id = (request.GET.get("timelineId") or request.GET.get("timeline_id") or "").strip()
    status_filter = (request.GET.get("status") or "").strip().upper()
    
    if not timeline_id:
        return JsonResponse({"detail": "Missing timelineId"}, status=400)
    
    timeline = ClearanceTimeline.objects.filter(id=timeline_id, archive_date__isnull=False).first()
    if not timeline:
        return JsonResponse({"detail": "Archived timeline not found"}, status=404)

    items = _archived_clearance_items_for_timeline(timeline, status_filter)

    return JsonResponse({"items": items})

# Additional CISO endpoints
def ciso_tools_api(request):
    return JsonResponse({"tools": []})

@csrf_exempt
def ciso_college_office_configuration_api(request):
    if request.method == "GET":
        admin, err = _require_ciso_admin_user(request)
        if err:
            return err
        
        # Get colleges with their departments
        colleges = College.objects.filter(is_active=True).prefetch_related('department_set').order_by('name')
        colleges_data = []
        for college in colleges:
            departments = [{'id': dept.id, 'name': dept.name} for dept in college.department_set.filter(is_active=True).order_by('name')]
            colleges_data.append({
                'id': college.id,
                'name': college.name,
                'abbreviation': college.abbreviation or '',
                'departments': departments
            })
        
        # Get offices
        offices = Office.objects.filter(is_active=True).order_by('name')
        offices_data = [{'id': office.id, 'name': office.name, 'abbreviation': office.abbreviation or ''} for office in offices]
        
        # Get approver flow configuration
        timeline_id = request.GET.get('timeline_id')
        config = None
        if timeline_id:
            try:
                timeline = ClearanceTimeline.objects.get(id=timeline_id)
                config = ApproverFlowConfig.objects.filter(clearance_timeline=timeline).order_by("-updated_at", "pk").first()
            except ClearanceTimeline.DoesNotExist:
                return JsonResponse({"detail": "Timeline not found"}, status=404)

        if not config and not timeline_id:
            config = ApproverFlowConfig.objects.filter(clearance_timeline__isnull=True).order_by("-updated_at", "pk").first()
        
        flow_steps = []
        if config:
            flow_steps = ApproverFlowStep.objects.filter(config=config).order_by('order').prefetch_related('colleges')
            for step in flow_steps:
                colleges_list = [{'id': college.id, 'name': college.name} for college in step.colleges.all()]
                flow_steps.append({
                    'id': step.id,
                    'category': step.category,
                    'order': step.order,
                    'office': {'id': step.office.id, 'name': step.office.name} if step.office else None,
                    'collegeIds': [str(c.id) for c in step.colleges.all()]
                })
        
        configuration = {
            'colleges': colleges_data,
            'offices': offices_data,
            'approverFlow': flow_steps
        }
        
        return JsonResponse({"configuration": configuration})
    
    elif request.method == "POST":
        admin, err = _require_ciso_admin_user(request)
        if err:
            return err
        
        try:
            data = json.loads(request.body)
            timeline_id = data.get('timelineId')
            if not timeline_id:
                return JsonResponse({"detail": "Timeline ID is required"}, status=400)
            
            try:
                timeline = ClearanceTimeline.objects.get(id=timeline_id)
                if timeline.is_active:
                    return JsonResponse({"detail": "Cannot save configuration for active timeline"}, status=400)
            except ClearanceTimeline.DoesNotExist:
                return JsonResponse({"detail": "Timeline not found"}, status=400)
            
            config, created = ApproverFlowConfig.objects.get_or_create(
                clearance_timeline_id=timeline_id,
                defaults={'created_by': admin}
            )
            if not created:
                config.updated_by = admin
                config.save()
            
            config.steps.all().delete()
            approver_flow_data = data.get('approverFlow', [])
            for i, step_data in enumerate(approver_flow_data):
                step = ApproverFlowStep.objects.create(
                    config=config,
                    category=step_data.get('category', ''),
                    order=i,
                    office_id=step_data.get('officeId') if step_data.get('officeId') else None,
                )
                # Add college associations if provided
                college_ids = step_data.get('collegeIds', [])
                if college_ids:
                    step.colleges.set(College.objects.filter(pk__in=college_ids, is_active=True))
            
            return JsonResponse({"message": "Configuration saved successfully"})
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"detail": str(e)}, status=500)
    
    else:
        return _json_method_not_allowed()

def _get_active_ciso_user(request):
    user, _ = _require_ciso_admin_user(request)
    return user


@csrf_exempt
def ciso_clearance_timeline_api(request):
    """Return clearance timelines for CISO semester selection.

    Response shape is aligned with the CISO Faculty Data Dump page, which
    expects either a "timelines" or "items" array of objects with at least:
    - id
    - academicYearStart / academicYearEnd
    - term (human-readable label)
    - clearanceStartDate / clearanceEndDate (ISO strings, optional)
    - isActive (bool)
    """

    if request.method == "GET":
        user = _get_authenticated_user(request)
        if not user:
            return JsonResponse({"detail": "Authentication required"}, status=401)

        if not user.userrole_set.filter(role__name="CISO", is_active=True).exists():
            return JsonResponse({"detail": "Forbidden"}, status=403)

        timelines = (
            ClearanceTimeline.objects.filter(archive_date__isnull=True)
            .order_by("-is_active", "-academic_year_start", "-academic_year_end", "-id")
        )

        items: list[dict] = []
        for t in timelines:
            items.append(
                {
                    "id": str(t.id),
                    "name": t.name or _clearance_timeline_name(t.academic_year_start, t.academic_year_end, t.term),
                    "academicYearStart": str(t.academic_year_start or ""),
                    "academicYearEnd": str(t.academic_year_end or ""),
                    "term": _term_to_label(t.term),
                    "clearanceStartDate": t.clearance_start_date.date().isoformat() if t.clearance_start_date else "",
                    "clearanceEndDate": t.clearance_end_date.date().isoformat() if t.clearance_end_date else "",
                    "setAsActive": bool(t.is_active),
                    "isActive": bool(t.is_active),
                    "createdAt": _format_timestamp(t.created_at),
                }
            )

        return JsonResponse({"items": items, "timelines": items})

    if request.method not in {"POST", "PUT", "DELETE"}:
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    """Handle CRUD operations for clearance timelines for CISO."""

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    if not user.userrole_set.filter(role__name="CISO", is_active=True).exists():
        return JsonResponse({"detail": "Forbidden"}, status=403)

    payload = _json_body(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON body"}, status=400)

    if request.method == "DELETE":
        timeline_id = payload.get("id")
        action = (payload.get("action") or "archive").strip().lower()
        if not timeline_id:
            return JsonResponse({"detail": "Missing id"}, status=400)

        timeline = ClearanceTimeline.objects.filter(id=timeline_id, archive_date__isnull=True).first()
        if not timeline:
            return JsonResponse({"detail": "Timeline not found"}, status=404)

        if action == "delete":
            return JsonResponse({"detail": "Delete is not allowed for clearance timelines"}, status=405)

        with transaction.atomic():
            _archive_clearance_timeline_records(timeline)
            timeline.archive_date = timezone.now()
            timeline.is_active = False
            timeline.save(update_fields=["archive_date", "is_active", "updated_at"])

        return JsonResponse({"ok": True, "archived": True})

    start_year = _parse_int(payload.get("academicYearStart") or payload.get("startYear"))
    end_year = _parse_int(payload.get("academicYearEnd") or payload.get("endYear")) or ((start_year + 1) if start_year is not None else None)
    term = _label_to_term(payload.get("term") or payload.get("semester"))
    clearance_start_date = _parse_iso_date(payload.get("clearanceStartDate") or payload.get("semesterStartDate"))
    clearance_end_date = _parse_iso_date(payload.get("clearanceEndDate") or payload.get("semesterEndDate"))
    set_as_active = bool(payload.get("setAsActive"))

    if start_year is None or end_year is None or term is None or clearance_start_date is None or clearance_end_date is None:
        return JsonResponse({"detail": "Missing or invalid timeline fields"}, status=400)

    if request.method == "POST":
        if set_as_active:
            ClearanceTimeline.objects.filter(is_active=True).update(is_active=False)

        timeline = ClearanceTimeline.objects.create(
            name=_clearance_timeline_name(start_year, end_year, term),
            academic_year_start=start_year,
            academic_year_end=end_year,
            term=term,
            clearance_start_date=clearance_start_date,
            clearance_end_date=clearance_end_date,
            created_by=user,
            is_active=set_as_active,
        )
        return JsonResponse({"id": str(timeline.id)}, status=201)

    timeline_id = payload.get("id")
    if not timeline_id:
        return JsonResponse({"detail": "Missing id"}, status=400)

    timeline = ClearanceTimeline.objects.filter(id=timeline_id).first()
    if not timeline:
        return JsonResponse({"detail": "Timeline not found"}, status=404)

    if set_as_active:
        ClearanceTimeline.objects.exclude(id=timeline.id).filter(is_active=True).update(is_active=False)

    timeline.name = _clearance_timeline_name(start_year, end_year, term)
    timeline.academic_year_start = start_year
    timeline.academic_year_end = end_year
    timeline.term = term
    timeline.clearance_start_date = clearance_start_date
    timeline.clearance_end_date = clearance_end_date
    timeline.is_active = set_as_active
    timeline.save(update_fields=[
        "name",
        "academic_year_start",
        "academic_year_end",
        "term",
        "clearance_start_date",
        "clearance_end_date",
        "is_active",
        "updated_at",
    ])

    return JsonResponse({"id": str(timeline.id)})

def ciso_archived_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)
    
    # Get archived timelines (where archive_date is not null)
    archived_timelines = ClearanceTimeline.objects.filter(archive_date__isnull=False).order_by("-archive_date")
    
    items = []
    for timeline in archived_timelines:
        start_year = str(timeline.academic_year_start or "")
        end_year = str(timeline.academic_year_end or "")
        items.append({
            "id": str(timeline.id),
            "name": timeline.name or _clearance_timeline_name(timeline.academic_year_start, timeline.academic_year_end, timeline.term),
            "academicYear": f"{start_year}-{end_year}",
            "semester": _term_to_label(timeline.term),
            "clearancePeriodStart": timeline.clearance_start_date.strftime("%m/%d/%Y"),
            "clearancePeriodEnd": timeline.clearance_end_date.strftime("%m/%d/%Y"),
            "lastUpdated": timeline.updated_at.strftime("%B %d, %Y, %H:%M %p"),
            "archivedDate": timeline.archive_date.strftime("%B %d, %Y, %H:%M %p"),
        })
    
    return JsonResponse({"items": items})

def ciso_view_clearance_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    timeline_id = (request.GET.get("timelineId") or request.GET.get("timeline_id") or "").strip()
    status_filter = (request.GET.get("status") or "").strip().upper()

    if not timeline_id:
        return JsonResponse({"detail": "Missing timelineId"}, status=400)

    timeline = ClearanceTimeline.objects.filter(id=timeline_id, archive_date__isnull=False).first()
    if not timeline:
        return JsonResponse({"detail": "Archived timeline not found"}, status=404)

    items = _archived_clearance_items_for_timeline(timeline, status_filter)
    return JsonResponse({"items": items})

def ciso_archived_faculty_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    # Get authenticated CISO user
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    # Check if user has CISO role
    if not user.userrole_set.filter(role__name='CISO', is_active=True).exists():
        return JsonResponse({"detail": "Forbidden"}, status=403)

    # Get archived faculty dumps tied to clearance timelines
    dumps = FacultyDumpArchive.objects.select_related("clearance_timeline").order_by("-created_at", "-id")

    items = []
    for dump in dumps:
        tl = dump.clearance_timeline

        academic_year = (
            f"{dump.academic_year_start} - {dump.academic_year_end}"
            if dump.academic_year_start and dump.academic_year_end
            else ""
        )

        clearance_period = ""
        if tl and tl.clearance_start_date and tl.clearance_end_date:
            clearance_period = f"{tl.clearance_start_date.strftime('%m/%d/%Y')} - {tl.clearance_end_date.strftime('%m/%d/%Y')}"

        # Base filename as stored on disk (for download)
        csv_basename = ""
        if dump.dump_file_path:
            csv_basename = dump.dump_file_path.split("/")[-1]

        # Strip internal prefix "timeline-<id>-<timestamp>-" if present so that
        # the user-facing label only shows the original CSV name.
        original_name = csv_basename
        if csv_basename.startswith("timeline-"):
            parts = csv_basename.split("-", 3)
            if len(parts) == 4:
                original_name = parts[3]

        # Human-friendly display name, e.g. "2025 - 2026 First Semester - Faculty Dump.csv"
        term_label = _term_to_label(dump.term)
        if academic_year and term_label and original_name:
            csv_display_name = f"{academic_year} {term_label} - {original_name}"
        elif original_name:
            csv_display_name = original_name
        else:
            csv_display_name = ""

        items.append(
            {
                "id": str(dump.id),
                "academicYear": academic_year,
                "semester": _term_to_label(dump.term),
                "clearancePeriod": clearance_period,
                "archivedDate": _format_timestamp(dump.created_at),
                "csvFileName": csv_display_name,
                "csvFileSize": dump.dump_file_size or "",
                "totalFaculty": "",  # can be wired to analytics later
                "completedClearances": "",  # optional; not used for pure dumps
                "status": "COMPLETED",
                "facultyId": "",
                "facultyName": "",
                "employeeId": "",
                "csvDumpPath": dump.dump_file_path,
            }
        )

    return JsonResponse({"items": items})

def ciso_archived_faculty_download_api(request, archived_id: int):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    # Get authenticated CISO user
    user = _get_authenticated_user(request)
    if not user:
        return JsonResponse({"detail": "Authentication required"}, status=401)

    # Check if user has CISO role
    if not user.userrole_set.filter(role__name='CISO', is_active=True).exists():
        return JsonResponse({"detail": "Forbidden"}, status=403)

    try:
        dump = FacultyDumpArchive.objects.get(id=archived_id)
    except FacultyDumpArchive.DoesNotExist:
        return JsonResponse({"detail": "Archived faculty dump not found"}, status=404)

    if not dump.dump_file_path:
        return JsonResponse({"detail": "CSV file not available for this archived faculty dump"}, status=404)

    # Try to serve the file
    try:
        import os
        from django.conf import settings
        
        # Construct the full file path
        file_path = os.path.join(settings.MEDIA_ROOT if hasattr(settings, 'MEDIA_ROOT') else '', dump.dump_file_path)
        
        if not os.path.exists(file_path):
            return JsonResponse({"detail": "CSV file not found on server"}, status=404)
        
        # Read and serve the file
        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{dump.dump_file_path.split("/")[-1]}"'
            return response
            
    except Exception as e:
        return JsonResponse({"detail": "Error serving file: {str(e)}"}, status=500)

from datetime import datetime
import json
import os
import secrets
from urllib.parse import urlencode
import urllib.request
import urllib.error
from decimal import Decimal
from django.http import JsonResponse, HttpResponseRedirect, HttpResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login as django_login, logout as django_logout
from django.core.mail import send_mail
from django.conf import settings
from decimal import Decimal
import csv
import io
import requests
from django.db import models, transaction
from .models import *


def _json_error(detail: str, status: int = 400):
    return JsonResponse({"detail": detail}, status=status)


def _normalize_email(value: str | None) -> str:
    return (value or "").strip().lower()


def _generate_otp(length: int = 6) -> str:
    import random

    return "".join(str(random.randint(0, 9)) for _ in range(length))


def _otp_session_key(email: str) -> str:
    return f"otp:{email}"


def _hash_otp(otp: str) -> str:
    import hashlib

    return hashlib.sha256(otp.encode("utf-8")).hexdigest()


@csrf_exempt
def check_email_api(request):
    if request.method != "POST":
        return _json_error("Method not allowed", status=405)

    try:
        payload = json.loads((request.body or b"{}").decode("utf-8"))
    except Exception:
        payload = {}

    email = _normalize_email(payload.get("email"))
    if not email:
        return _json_error("Email is required", status=400)

    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if not user:
        return JsonResponse({"success": False, "message": "Email is not registered in the system"}, status=404)

    return JsonResponse({"success": True, "message": "Email found"})


@csrf_exempt
def request_otp_api(request):
    if request.method != "POST":
        return _json_error("Method not allowed", status=405)

    try:
        payload = json.loads((request.body or b"{}").decode("utf-8"))
    except Exception:
        payload = {}

    email = _normalize_email(payload.get("email"))
    if not email:
        return _json_error("Email is required", status=400)

    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if not user:
        return JsonResponse({"success": False, "message": "Email is not registered in the system"}, status=404)

    otp = _generate_otp(6)
    from datetime import timedelta

    expires_at = timezone.now() + timedelta(minutes=3)
    request.session[_otp_session_key(email)] = {
        "otp_hash": _hash_otp(otp),
        "expires_at": expires_at.isoformat(),
        "user_id": user.id,
    }
    request.session["otp_email"] = email
    request.session.modified = True

    subject = "Your verification code"
    body = f"Your verification code is: {otp}. This code will expire in 3 minutes."
    html_body = f"""
<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>{subject}</title>
  </head>
  <body style=\"margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;\">
    <div style=\"max-width:520px;margin:0 auto;padding:24px;\">
      <div style=\"background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e8eb;\">
        <div style=\"padding:18px 20px;background:#0b3a82;color:#ffffff;\">
          <div style=\"font-size:16px;font-weight:700;letter-spacing:0.2px;\">XU Faculty ClearTrack</div>
          <div style=\"font-size:13px;opacity:0.9;margin-top:6px;\">Email Verification</div>
        </div>
        <div style=\"padding:22px 20px;color:#111827;\">
          <div style=\"font-size:16px;font-weight:700;margin-bottom:8px;\">Your verification code</div>
          <div style=\"font-size:14px;line-height:1.5;color:#374151;\">Use the code below to continue signing in. This code expires in <strong>3 minutes</strong>.</div>
          <div style=\"margin:18px 0 14px 0;padding:14px 16px;border-radius:12px;background:#f3f4f6;border:1px dashed #cbd5e1;text-align:center;\">
            <div style=\"font-size:28px;letter-spacing:6px;font-weight:800;color:#111827;\"><strong>{otp}</strong></div>
          </div>
          <div style=\"font-size:12px;line-height:1.5;color:#6b7280;\">If you did not request this code, you can safely ignore this email.</div>
        </div>
      </div>
      <div style=\"font-size:11px;color:#9ca3af;text-align:center;margin-top:14px;\">Please do not reply to this email.</div>
    </div>
  </body>
</html>
"""

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None) or None,
            recipient_list=[email],
            html_message=html_body,
            fail_silently=False,
        )
    except Exception:
        return JsonResponse({"success": False, "message": "Failed to send OTP email"}, status=500)

    return JsonResponse(
        {
            "success": True,
            "message": "OTP sent",
            "requires_pin": True,
            "user_info": {
                "email": user.email,
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
            },
        }
    )


@csrf_exempt
def verify_otp_api(request):
    if request.method != "POST":
        return _json_error("Method not allowed", status=405)

    try:
        payload = json.loads((request.body or b"{}").decode("utf-8"))
    except Exception:
        payload = {}

    otp = (payload.get("otp") or "").strip()
    email = _normalize_email(payload.get("email") or request.session.get("otp_email"))

    if not email:
        return JsonResponse({"success": False, "message": "Email not found. Please go back to login."}, status=400)
    if not otp or len(otp) != 6 or not otp.isdigit():
        return JsonResponse({"success": False, "message": "Invalid OTP"}, status=400)

    entry = request.session.get(_otp_session_key(email))
    if not isinstance(entry, dict):
        return JsonResponse({"success": False, "message": "OTP expired. Please request a new code."}, status=400)

    expires_raw = entry.get("expires_at")
    expires_at = None
    if expires_raw:
        try:
            parsed = datetime.fromisoformat(expires_raw)
            expires_at = timezone.make_aware(parsed) if timezone.is_naive(parsed) else parsed
        except Exception:
            expires_at = None

    if not expires_at or timezone.now() > expires_at:
        request.session.pop(_otp_session_key(email), None)
        request.session.modified = True
        return JsonResponse({"success": False, "message": "OTP expired. Please request a new code."}, status=400)

    from django.utils.crypto import constant_time_compare

    if not constant_time_compare(str(entry.get("otp_hash") or ""), _hash_otp(otp)):
        return JsonResponse({"success": False, "message": "Wrong OTP"}, status=401)

    user_id = entry.get("user_id")
    user = User.objects.filter(id=user_id, is_active=True).first()
    if not user:
        return JsonResponse({"success": False, "message": "User not found"}, status=404)

    request.session.pop(_otp_session_key(email), None)
    request.session.modified = True

    django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    dashboard_url = _dashboard_route_for_user(user)

    return JsonResponse(
        {
            "success": True,
            "message": "OTP verified",
            "user_info": {
                "email": user.email,
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
                "roles": list(user.get_active_roles().values_list('role__name', flat=True)),
                "dashboard_url": dashboard_url,
            },
        }
    )


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
    
    #session
    state = secrets.token_urlsafe(24)
    request.session["google_oauth_state"] = state

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
    
    print(f"GOOGLE OAUTH: OAuth state found: {bool(expected_state)}")

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
    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if not user:
        return _json_error("Email is not registered in the system", status=403)

    print(f"GOOGLE OAUTH: User found: {user.email} (ID: {user.id})")
    print(f"GOOGLE OAUTH: About to call django_login...")
    
    django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    
    print(f"GOOGLE OAUTH: Session after django_login: {dict(request.session)}")
    print(f"GOOGLE OAUTH: Session key after: {request.session.session_key}")
    print(f"GOOGLE OAUTH: User authenticated: {request.user.is_authenticated}")
    print(f"GOOGLE OAUTH: User ID in session: {request.user.id}")
    
    redirect_to = _dashboard_route_for_user(user)
    print(f"GOOGLE OAUTH: Redirecting to: {redirect_to}")
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
    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if not user:
        return _json_error("Email is not registered in the system", status=403)

    django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
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
    
    print(f"LOGOUT: Starting logout...")
    print(f"LOGOUT: Session before: {dict(request.session)}")
    print(f"LOGOUT: Session key before: {request.session.session_key}")
    
    # Create response first to delete cookies
    response = JsonResponse({"ok": True, "message": "Logged out successfully"})
    
    try:
        # Django's standard logout
        django_logout(request)
        print(f"LOGOUT: Django logout completed successfully")
        
        # Force delete session cookie even if session was empty
        response.delete_cookie('sessionid', path='/')
        response.delete_cookie('sessionid', path='/', domain='localhost')
        response.delete_cookie('sessionid', path='/', domain='127.0.0.1')
        response.delete_cookie('csrftoken', path='/')
        
        print(f"LOGOUT: Session cookies force-deleted from response")
        
    except Exception as e:
        print(f"LOGOUT: Django logout error: {e}")
    
    print(f"LOGOUT: Session after: {dict(request.session)}")
    print(f"LOGOUT: Session key after: {getattr(request.session, 'session_key', 'None')}")
    print(f"LOGOUT: Logout completed with cookie deletion")
    
    return response


def me_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return JsonResponse({"detail": "Authentication required"}, status=401)

    return JsonResponse(
        {
            "email": user.email,
            "university_id": getattr(user, "university_id", ""),
            "first_name": getattr(user, "first_name", None),
            "middle_name": getattr(user, "middle_name", None),
            "last_name": getattr(user, "last_name", None),
            "roles": list(user.get_active_roles().values_list('role__name', flat=True)),
        }
    )

def dashboard_view(request):
    return render(request, 'system/dashboard.html')


def ciso_profile_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return JsonResponse({"detail": "Authentication required"}, status=401)

    # Check if user has CISO role
    if not user.is_ciso_admin():
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

    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return JsonResponse({"detail": "Authentication required"}, status=401)

    # Check if user has OVPHE role
    if not user.is_ovphe_admin():
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
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return None
    
    if user.is_ovphe_admin():
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
        or Requirement.colleges.through.objects.filter(college_id=college.id).exists()
        or ApproverFlowStep.colleges.through.objects.filter(college_id=college.id).exists()
        or Department.objects.filter(college=college).exists()
    )


def _is_department_referenced(dept: Department):
    return (
        Faculty.objects.filter(department=dept).exists()
        or Approver.objects.filter(department=dept).exists()
        or StudentAssistant.objects.filter(department=dept).exists()
        or Requirement.departments.through.objects.filter(department_id=dept.id).exists()
    )


def _is_office_referenced(office: Office):
    return (
        Faculty.objects.filter(office=office).exists()
        or Approver.objects.filter(office=office).exists()
        or Requirement.offices.through.objects.filter(office_id=office.id).exists()
    )


def _get_active_ciso_admin():
    # Get the first active CISO admin
    from .models import UserRole, Role
    ciso_role = Role.objects.get(name='CISO')
    user_role = UserRole.objects.filter(role=ciso_role, is_active=True).first()
    return user_role.user if user_role else None


def _require_ciso_admin_user(request):
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return None, JsonResponse({"detail": "Authentication required"}, status=401)

    # Check if user has CISO role
    if not user.is_ciso_admin():
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
        "email": a.created_by.user.email if getattr(a.created_by, "user", None) else "",
        "timestamp": _format_timestamp(a.created_at),
        "pinned": bool(a.pin_announcement),
        "enabled": bool(a.is_active),
    }


def _get_active_admin_for_role(request, role: str | None):
    if role == "ovphe":
        return _get_active_ovphe_admin(request)
    if role == "ciso":
        return _get_active_ciso_admin()
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
    created_by = admin.user if admin else None

    guideline = SystemGuideline.objects.create(
        title=title,
        body=description,
        created_by=created_by,
        is_active=bool(enabled) if enabled is not None else True,
    )
    try:
        ActivityLog.objects.create(
            event_type=ActivityLog.EventType.CREATED_GUIDELINE,
            actor_admin=admin,
            actor_user=getattr(admin, "user", None),
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
    editor_user = admin.user if admin else None

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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
                details=[f"Guideline: {guideline.title}"],
            )
            if not guideline.is_active:
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.ARCHIVED_GUIDELINE,
                    actor_admin=admin,
                    actor_user=getattr(admin, "user", None),
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
        ActivityLog.objects.create(
            event_type=ActivityLog.EventType.CREATED_ANNOUNCEMENT,
            actor_admin=admin,
            actor_user=getattr(admin, "user", None),
            details=[f"Announcement: {title}"] if title else [],
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
                    actor_admin=admin,
                    actor_user=getattr(admin, "user", None),
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
            "clearance",
            "clearance__faculty",
            "clearance__faculty__college",
            "clearance__faculty__department",
        )
        .filter(timeline=active_timeline)
        .order_by("-id")
    )

    items = []
    for r in qs:
        faculty = getattr(r.clearance, "faculty", None)

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
                    "isActive": bool(user.is_active),
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
        user.is_active = is_active
        user.is_staff = True
        user.save(update_fields=[
            "email",
            "university_id",
            "first_name",
            "middle_name",
            "last_name",
            "is_active",
            "is_staff",
        ])

        if system_admin_office:
            office_norm = system_admin_office.strip().upper()
            if office_norm not in {"CISO", "OVPHE"}:
                return JsonResponse({"detail": "Invalid system admin office"}, status=400)

            # Get or create the appropriate role
            from .models import Role
            role_name = "CISO" if office_norm == "CISO" else "OVPHE"
            role = Role.objects.get(name=role_name)
            
            # Remove existing admin roles for this user
            user.userrole_set.filter(role__name__in=['CISO', 'OVPHE']).delete()
            
            # Create new role assignment
            from .models import UserRole
            UserRole.objects.create(
                user=user,
                role=role,
                is_active=True,
                assigned_by=request.user if request.user.is_authenticated else user
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
            student_role = Role.objects.get(name='Student Assistant')
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
            
            role = Role.objects.get(name=role_name)
            UserRole.objects.get_or_create(
                user=user,
                role=role,
                defaults={'is_active': True}
            )

    return JsonResponse({"ok": True})


def active_clearance_timeline_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    t = _get_active_timeline()
    if not t:
        return JsonResponse({"academicYear": "", "semester": ""})

    if t.academic_year is not None:
        academic_year = f"{t.academic_year}–{t.academic_year + 1}"
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
            "clearance",
            "clearance__faculty",
            "clearance__faculty__college",
            "clearance__faculty__department",
        )
        .filter(timeline=active_timeline)
        .order_by("-id")
    )

    items = []
    for r in qs:
        faculty = getattr(r.clearance, "faculty", None)

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

    if t.academic_year is not None:
        academic_year = f"{t.academic_year}–{t.academic_year + 1}"
    else:
        academic_year = ""

    semester = _term_to_label(t.term)
    return JsonResponse({"academicYear": academic_year, "semester": semester})

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
            "office": "Department Chair",
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

    resp = HttpResponse(output.getvalue(), content_type="text/csv")
    resp["Content-Disposition"] = 'attachment; filename="faculty_template.csv"'
    return resp


@csrf_exempt
def ciso_faculty_dump_import_api(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    upload = request.FILES.get("file")
    if not upload:
        return JsonResponse({"detail": "Missing file"}, status=400)

    if not upload.name.lower().endswith(".csv"):
        return JsonResponse({"detail": "Only CSV files are supported"}, status=400)

    raw = upload.read()
    try:
        text = raw.decode("utf-8-sig")
    except Exception:
        return JsonResponse({"detail": "Unable to decode CSV; please upload a UTF-8 CSV"}, status=400)

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
    ad_success_count = 0
    ad_error_count = 0

    def _clean(value: str | None):
        return (value or "").strip()

    # Active Directory endpoint
    ad_url = "http://host.docker.internal:8002/api/faculty/batch"
    ad_headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    faculty_batch_data = []

    # Process CSV and prepare data for Active Directory
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

        # Prepare faculty data for Active Directory
        faculty_data = {
            "email": email,
            "university_id": university_id,
            "employee_id": employee_id,
            "first_name": first_name,
            "middle_name": middle_name,
            "last_name": last_name,
            "faculty_type": faculty_type,
            "phone_number": phone_number,
            "office": office_name,
            "college": college_name,
            "department": department_name,
            "is_active": True
        }
        
        faculty_batch_data.append(faculty_data)
        created_count += 1

    # Send batch data to Active Directory
    if faculty_batch_data:
        try:
            ad_response = requests.post(
                ad_url,
                json={"faculty": faculty_batch_data},
                headers=ad_headers,
                timeout=30
            )
            
            if ad_response.status_code == 200 or ad_response.status_code == 201:
                ad_result = ad_response.json()
                ad_success_count = len(faculty_batch_data)
                updated_count = ad_result.get("updated_count", 0)
            else:
                ad_error_count = len(faculty_batch_data)
                errors.append({
                    "message": f"Active Directory error: {ad_response.status_code} - {ad_response.text}"
                })
        except requests.exceptions.RequestException as e:
            ad_error_count = len(faculty_batch_data)
            errors.append({
                "message": f"Failed to connect to Active Directory: {str(e)}"
            })

    return JsonResponse(
        {
            "created_count": created_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "ad_success_count": ad_success_count,
            "ad_error_count": ad_error_count,
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


@csrf_exempt
@csrf_exempt
def ovphe_clearance_timelines_api(request):
    if request.method == "GET":
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
    if request.method == "GET":
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

    if request.method in {"POST", "PUT"}:
        try:
            payload = json.loads((request.body or b"{}").decode("utf-8"))
        except Exception:
            payload = {}

        start_year = _parse_int(payload.get("startYear"))
        term = _label_to_term(payload.get("semester"))
        term_start_date = _parse_iso_date(payload.get("semesterStartDate"))
        term_end_date = _parse_iso_date(payload.get("semesterEndDate"))
        clearance_start_date = _parse_iso_date(payload.get("clearanceStartDate"))
        clearance_end_date = _parse_iso_date(payload.get("clearanceEndDate"))
        set_as_active = bool(payload.get("setAsActive"))

        admin = _get_active_ovphe_admin(request)
        if not admin:
            return JsonResponse({"detail": "OVPHE user not found"}, status=404)

        if request.method == "POST":
            if set_as_active:
                prev_active = list(ClearanceTimeline.objects.filter(is_active=True))
                ClearanceTimeline.objects.filter(is_active=True).update(is_active=False)
                for prev in prev_active:
                    try:
                        prev_sy = f"S.Y. {prev.academic_year}-{(prev.academic_year or 0) + 1}"
                        prev_sem = _term_to_label(prev.term)
                        ActivityLog.objects.create(
                            event_type=ActivityLog.EventType.INACTIVE_TIMELINE,
                            actor_admin=admin,
                            actor_user=getattr(admin, "user", None),
                            details=[prev_sy, f"Semester: {prev_sem}", "Replaced with new timeline"],
                        )
                    except Exception:
                        pass

            t = ClearanceTimeline.objects.create(
                academic_year=start_year,
                term=term,
                term_start_date=term_start_date,
                term_end_date=term_end_date,
                clearance_start_date=clearance_start_date,
                clearance_end_date=clearance_end_date,
                created_by=admin,
                is_active=set_as_active,
            )
            try:
                new_sy = f"S.Y. {start_year}-{(start_year or 0) + 1}"
                new_sem = _term_to_label(term)
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.ACTIVE_TIMELINE,
                    actor_admin=admin,
                    actor_user=getattr(admin, "user", None),
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
                    prev_sy = f"S.Y. {prev.academic_year}-{(prev.academic_year or 0) + 1}"
                    prev_sem = _term_to_label(prev.term)
                    ActivityLog.objects.create(
                        event_type=ActivityLog.EventType.INACTIVE_TIMELINE,
                        actor_admin=admin,
                        actor_user=getattr(admin, "user", None),
                        details=[prev_sy, f"Semester: {prev_sem}", "Replaced with new timeline"],
                    )
                except Exception:
                    pass

        t.academic_year = start_year
        t.term = term
        t.term_start_date = term_start_date
        t.term_end_date = term_end_date
        t.clearance_start_date = clearance_start_date
        t.clearance_end_date = clearance_end_date
        t.is_active = set_as_active
        t.save(update_fields=[
            "academic_year",
            "term",
            "term_start_date",
            "term_end_date",
            "clearance_start_date",
            "clearance_end_date",
            "is_active",
        ])

        return JsonResponse({"id": str(t.id)})

    return JsonResponse({"detail": "Method not allowed"}, status=405)

    if request.method in {"POST", "PUT"}:
        try:
            payload = json.loads((request.body or b"{}").decode("utf-8"))
        except Exception:
            payload = {}

        start_year = _parse_int(payload.get("startYear"))
        term = _label_to_term(payload.get("semester"))
        term_start_date = _parse_iso_date(payload.get("semesterStartDate"))
        term_end_date = _parse_iso_date(payload.get("semesterEndDate"))
        clearance_start_date = _parse_iso_date(payload.get("clearanceStartDate"))
        clearance_end_date = _parse_iso_date(payload.get("clearanceEndDate"))
        set_as_active = bool(payload.get("setAsActive"))

        admin = _get_active_ovphe_admin(request)
        if not admin:
            return JsonResponse({"detail": "OVPHE user not found"}, status=404)

        if request.method == "POST":
            if set_as_active:
                ClearanceTimeline.objects.filter(is_active=True).update(is_active=False)

            t = ClearanceTimeline.objects.create(
                academic_year=start_year,
                term=term,
                term_start_date=term_start_date,
                term_end_date=term_end_date,
                clearance_start_date=clearance_start_date,
                clearance_end_date=clearance_end_date,
                created_by=admin,
                is_active=set_as_active,
            )
            return JsonResponse({"id": str(t.id)}, status=201)

        timeline_id = payload.get("id")
        if not timeline_id:
            return JsonResponse({"detail": "Missing id"}, status=400)

        t = ClearanceTimeline.objects.filter(id=timeline_id).first()
        if not t:
            return JsonResponse({"detail": "Timeline not found"}, status=404)

        if set_as_active:
            ClearanceTimeline.objects.exclude(id=t.id).filter(is_active=True).update(is_active=False)

        t.academic_year = start_year
        t.term = term
        t.term_start_date = term_start_date
        t.term_end_date = term_end_date
        t.clearance_start_date = clearance_start_date
        t.clearance_end_date = clearance_end_date
        t.is_active = set_as_active
        t.save(update_fields=[
            "academic_year",
            "term",
            "term_start_date",
            "term_end_date",
            "clearance_start_date",
            "clearance_end_date",
            "is_active",
        ])

        return JsonResponse({"id": str(t.id)})

    return JsonResponse({"detail": "Method not allowed"}, status=405)


def faculty_dashboard_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    email = (request.GET.get("email") or "").strip()
    university_id = (request.GET.get("university_id") or "").strip()

    if not email and not university_id:
        email = "faculty.seed@xu.edu.ph"

    qs = Faculty.objects.select_related("user", "college", "department").filter(user__is_active=True)
    if email:
        qs = qs.filter(user__email=email)
    if university_id:
        qs = qs.filter(user__university_id=university_id)

    faculty = qs.order_by("id").first()
    if not faculty:
        return JsonResponse({"detail": "Faculty not found"}, status=404)

    timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year", "-id").first()
    academic_year = timeline.academic_year if timeline else None
    term = timeline.term if timeline else None

    clearance = None
    if academic_year and term:
        clearance = (
            Clearance.objects.filter(faculty=faculty, academic_year=academic_year, term=term)
            .order_by("-id")
            .first()
        )

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

        total_reqs = ClearanceRequest.objects.filter(clearance=clearance).count()
        approved_reqs = ClearanceRequest.objects.filter(
            clearance=clearance, status=ClearanceRequest.Status.APPROVED
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


def ovphe_org_structure_api(request):
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


def ovphe_approver_flow_api(request):
    if request.method != "GET":
        return _json_method_not_allowed()

    admin, err = _require_ovphe_admin(request)
    if err:
        return err

    config = ApproverFlowConfig.objects.order_by("-updated_at", "pk").first()
    if not config:
        config = ApproverFlowConfig.objects.create(created_by=admin)

    steps = (
        config.steps.select_related("office")
        .prefetch_related("colleges")
        .all()
        .order_by("order", "id")
    )
    return JsonResponse(
        {
            "id": str(config.id),
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


def _relink_flow_steps_for_office(*, office: Office):
    if not office or not office.is_active:
        return

    config = ApproverFlowConfig.objects.order_by("-updated_at", "-id").first()
    if not config:
        return

    config.steps.filter(office__isnull=True).filter(
        models.Q(category__iexact=office.name)
        | models.Q(category__iexact=(office.abbreviation or ""))
    ).update(office=office)


@csrf_exempt
def ovphe_colleges_api(request):
    admin, err = _require_ovphe_admin(request)
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
                    actor_admin=admin,
                    actor_user=getattr(admin, "user", None),
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
def ovphe_college_detail_api(request, college_id: int):
    print(f"[DEBUG] ovphe_college_detail_api called: method={request.method}, college_id={college_id}")
    admin, err = _require_ovphe_admin(request)
    if err:
        return err

    try:
        obj = College.objects.get(pk=college_id)
    except College.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
def ovphe_departments_api(request):
    admin, err = _require_ovphe_admin(request)
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
                    actor_admin=admin,
                    actor_user=getattr(admin, "user", None),
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
def ovphe_department_detail_api(request, department_id: int):
    admin, err = _require_ovphe_admin(request)
    if err:
        return err

    try:
        obj = Department.objects.select_related("college").get(pk=department_id)
    except Department.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
                    actor_admin=admin,
                    actor_user=getattr(admin, "user", None),
                    details=[f"Department: {dept_name}", f"College: {college_name}"],
                )
            except Exception:
                pass
            return JsonResponse({"id": str(obj.id), "softDeleted": True})
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.DELETED_DEPARTMENT,
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
                details=[f"Department: {dept_name}", f"College: {college_name}"],
            )
        except Exception:
            pass
        obj.delete()
        return JsonResponse({"id": str(department_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ovphe_offices_api(request):
    admin, err = _require_ovphe_admin(request)
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
                    actor_admin=admin,
                    actor_user=getattr(admin, "user", None),
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
def ovphe_office_detail_api(request, office_id: int):
    admin, err = _require_ovphe_admin(request)
    if err:
        return err

    try:
        obj = Office.objects.get(pk=office_id)
    except Office.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
                ApproverFlowStep.objects.filter(office=obj).update(office=None)
            try:
                ActivityLog.objects.create(
                    event_type=ActivityLog.EventType.DELETED_OFFICE,
                    actor_admin=admin,
                    actor_user=getattr(admin, "user", None),
                    details=[f"Office: {office_name}"],
                )
            except Exception:
                pass
            return JsonResponse({"id": str(obj.id), "softDeleted": True})
        try:
            ActivityLog.objects.create(
                event_type=ActivityLog.EventType.DELETED_OFFICE,
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
                details=[f"Office: {office_name}"],
            )
        except Exception:
            pass
        obj.delete()
        return JsonResponse({"id": str(office_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ovphe_org_structure_order_api(request):
    admin, err = _require_ovphe_admin(request)
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
def ovphe_approver_flow_steps_api(request):
    admin, err = _require_ovphe_admin(request)
    if err:
        return err

    config = ApproverFlowConfig.objects.order_by("-updated_at", "-id").first()
    if not config:
        config = ApproverFlowConfig.objects.create(created_by=admin)

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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
def ovphe_approver_flow_step_detail_api(request, step_id: int):
    admin, err = _require_ovphe_admin(request)
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
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
                actor_admin=admin,
                actor_user=getattr(admin, "user", None),
                details=[f"Category: {step_category}"],
            )
        except Exception:
            pass
        step.delete()
        return JsonResponse({"id": str(step_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ovphe_approver_flow_order_api(request):
    admin, err = _require_ovphe_admin(request)
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
            actor_admin=admin,
            actor_user=getattr(admin, "user", None),
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


@csrf_exempt
def ovphe_export_clearance_results_api(request):
    admin, err = _require_ovphe_admin(request)
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
            actor_admin=admin,
            actor_user=getattr(admin, "user", None),
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

    admin = _get_active_ovphe_admin() or _get_active_ciso_admin()

    try:
        year_val = int(academic_year) if academic_year else None
    except Exception:
        return JsonResponse({"detail": "Invalid academic_year"}, status=400)

    term_val = term or None

    if not year_val or not term_val:
        active_timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year", "-id").first()
        if active_timeline:
            year_val = year_val or active_timeline.academic_year
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
            actor_admin=admin,
            actor_user=getattr(admin, "user", None),
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


@csrf_exempt
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
                "isActive": bool(u.is_active),
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
                "isActive": bool(u.is_active),
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
                "isActive": bool(u.is_active),
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

        user = User.objects.create_user(
            email=email,
            university_id=university_id,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            is_active=is_active,
            is_staff=bool(system_admin_office or approver_type),
        )

        if system_admin_office:
            office_norm = system_admin_office.strip().upper()
            if office_norm not in {"CISO", "OVPHE"}:
                return JsonResponse({"detail": "Invalid system admin office"}, status=400)

            # SystemAdmin has been removed - role assignment handled above
            # Role assignment is handled above in the system_admin_office section

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
                    return JsonResponse({"detail": "College not found"}, status=400)

                department = Department.objects.filter(
                    name__iexact=dept_name,
                    college=college,
                    is_active=True,
                ).first()
                if not department:
                    return JsonResponse({"detail": "Department not found"}, status=400)

            if atype == "office":
                office_name = (data.get("office") or "").strip()
                if not office_name:
                    return JsonResponse({"detail": "Office is required"}, status=400)
                office = Office.objects.filter(name__iexact=office_name, is_active=True).first()
                if not office:
                    return JsonResponse({"detail": "Office not found"}, status=400)

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
            
            role = Role.objects.get(name=role_name)
            UserRole.objects.get_or_create(
                user=user,
                role=role,
                defaults={'is_active': True}
            )

    return JsonResponse({"ok": True, "id": str(user.id)})


def faculty_dashboard_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    email = (request.GET.get("email") or "").strip()
    university_id = (request.GET.get("university_id") or "").strip()

    if not email and not university_id:
        email = "faculty.seed@xu.edu.ph"

    qs = Faculty.objects.select_related("user", "college", "department").filter(user__is_active=True)
    if email:
        qs = qs.filter(user__email=email)
    if university_id:
        qs = qs.filter(user__university_id=university_id)

    faculty = qs.order_by("id").first()
    if not faculty:
        return JsonResponse({"detail": "Faculty not found"}, status=404)

    timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year", "-id").first()
    academic_year = timeline.academic_year if timeline else None
    term = timeline.term if timeline else None

    clearance = None
    if academic_year and term:
        clearance = (
            Clearance.objects.filter(faculty=faculty, academic_year=academic_year, term=term)
            .order_by("-id")
            .first()
        )

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
        total_reqs = ClearanceRequest.objects.filter(clearance=clearance).count()
        approved_reqs = ClearanceRequest.objects.filter(
            clearance=clearance, status=ClearanceRequest.Status.APPROVED
        ).count()

        config = ApproverFlowConfig.objects.order_by("id").first()
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
            dept_reqs = Requirement.objects.filter(departments=faculty.department).distinct() if faculty.department_id else Requirement.objects.none()
            college_reqs = Requirement.objects.filter(colleges=faculty.college).distinct() if faculty.college_id else Requirement.objects.none()
            office_requirements = {}
            office_ids = [fs.office_id for fs in flow_steps if fs.office_id]
            if office_ids:
                for office_id in set(office_ids):
                    office_requirements[office_id] = list(
                        Requirement.objects.filter(offices__id=office_id).distinct().order_by("id")
                    )

            # Map clearance request status by requirement
            req_status_by_id = {
                cr.requirement_id: cr.status
                for cr in ClearanceRequest.objects.select_related("requirement").filter(clearance=clearance)
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

def faculty_dashboard_api(request):
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    email = (request.GET.get("email") or "").strip()
    university_id = (request.GET.get("university_id") or "").strip()

    if not email and not university_id:
        email = "faculty.seed@xu.edu.ph"

    qs = Faculty.objects.select_related("user", "college", "department").filter(user__is_active=True)
    if email:
        qs = qs.filter(user__email=email)
    if university_id:
        qs = qs.filter(user__university_id=university_id)

    faculty = qs.order_by("id").first()
    if not faculty:
        return JsonResponse({"detail": "Faculty not found"}, status=404)

    timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-academic_year", "-id").first()
    academic_year = timeline.academic_year if timeline else None
    term = timeline.term if timeline else None

    clearance = None
    if academic_year and term:
        clearance = (
            Clearance.objects.filter(faculty=faculty, academic_year=academic_year, term=term)
            .order_by("-id")
            .first()
        )

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
        total_reqs = ClearanceRequest.objects.filter(clearance=clearance).count()
        approved_reqs = ClearanceRequest.objects.filter(
            clearance=clearance, status=ClearanceRequest.Status.APPROVED
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
                "isActive": bool(u.is_active),
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
        student_role = Role.objects.get(name='Student Assistant')
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

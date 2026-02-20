from datetime import datetime
import json
import os
import secrets
from urllib.parse import urlencode

import urllib.request
import urllib.error
from decimal import Decimal

from django.db import transaction
from django.db import models
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login as django_login, logout as django_logout
from django.core.mail import send_mail
from django.conf import settings

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
                "role_value": getattr(user, "role_value", None),
                "dashboard_url": dashboard_url,
            },
        }
    )


def _dashboard_route_for_user(user: "User") -> str:
    role_value = getattr(user, "role_value", None)

    if role_value == User.RoleChoices.FACULTY:
        return "/faculty-dashboard"

    if role_value == User.RoleChoices.APPROVER:
        return "/approver-dashboard"

    if role_value == User.RoleChoices.ASSISTANT_APPROVER:
        return "/assistant-approver-dashboard"

    if role_value == User.RoleChoices.HRO:
        return "/HRO-dashboard"

    if role_value == User.RoleChoices.CISO:
        return "/CISO-dashboard"

    if role_value == User.RoleChoices.OVPHE:
        return "/OVPHE-dashboard"

    if role_value == User.RoleChoices.DUAL_ROLE:
        if hasattr(user, "approver_profile") and getattr(user.approver_profile, "is_dual_role", False):
            return "/dual-role-approver-dashboard"
        return "/dual-role-faculty-member-dashboard"

    if hasattr(user, "admin_profile"):
        role = getattr(user.admin_profile, "admin_role", None)
        if role == SystemAdmin.AdminRole.CISO:
            return "/CISO-dashboard"
        if role == SystemAdmin.AdminRole.OVPHE:
            return "/OVPHE-dashboard"

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
    code = (request.GET.get("code") or "").strip()
    state = (request.GET.get("state") or "").strip()
    expected_state = request.session.get("google_oauth_state")

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

    django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    return HttpResponseRedirect("/login-prompt")


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
            "role_value": user.role_value,
            "redirect": redirect_to,
        }
    )


@csrf_exempt
def logout_api(request):
    if request.method not in {"POST", "GET"}:
        return _json_error("Method not allowed", status=405)
    django_logout(request)
    return JsonResponse({"ok": True})


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
            "role_value": getattr(user, "role_value", None),
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

    ciso_admin = SystemAdmin.objects.select_related("user").filter(
        user=user,
        admin_role=SystemAdmin.AdminRole.CISO,
        is_active=True,
    ).first()
    if not ciso_admin:
        return JsonResponse({"detail": "Forbidden"}, status=403)

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
    if request.method != "GET":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return JsonResponse({"detail": "Authentication required"}, status=401)

    ovphe_admin = SystemAdmin.objects.select_related("user").filter(
        user=user,
        admin_role=SystemAdmin.AdminRole.OVPHE,
        is_active=True,
    ).first()
    if not ovphe_admin:
        return JsonResponse({"detail": "Forbidden"}, status=403)

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


def _require_ovphe_admin():
    admin = _get_active_ovphe_admin()
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


def _get_active_admin_for_role(role: str | None):
    if role == "ovphe":
        return _get_active_ovphe_admin()
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

    admin = _get_active_admin_for_role(role)
    created_by = admin.user if admin else None

    guideline = SystemGuideline.objects.create(
        title=title,
        body=description,
        created_by=created_by,
        is_active=bool(enabled) if enabled is not None else True,
    )
    return JsonResponse({"item": _serialize_guideline(guideline)})


@csrf_exempt
def _system_guideline_detail_api(request, role: str, guideline_id: int):
    try:
        guideline = SystemGuideline.objects.select_related("created_by").get(pk=guideline_id)
    except SystemGuideline.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

    admin = _get_active_admin_for_role(role)
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
        return JsonResponse({"item": _serialize_guideline(guideline)})

    if request.method == "DELETE":
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

    admin = _get_active_admin_for_role(role)

    announcement = Announcement.objects.create(
        title=title,
        body=description,
        created_by=admin,
        pin_announcement=bool(pinned) if pinned is not None else False,
        is_active=bool(enabled) if enabled is not None else True,
    )
    return JsonResponse({"item": _serialize_announcement(announcement)})


@csrf_exempt
def _announcement_detail_api(request, role: str, announcement_id: int):
    try:
        announcement = Announcement.objects.get(pk=announcement_id)
    except Announcement.DoesNotExist:
        return JsonResponse({"detail": "Not found"}, status=404)

    admin = _get_active_admin_for_role(role)

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
        return JsonResponse({"item": _serialize_announcement(announcement)})

    if request.method == "DELETE":
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

        admin = _get_active_ovphe_admin()
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

        admin = _get_active_ovphe_admin()
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

    admin, err = _require_ovphe_admin()
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
    admin, err = _require_ovphe_admin()
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
    admin, err = _require_ovphe_admin()
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
        return JsonResponse(
            {
                "id": str(obj.id),
                "name": obj.name,
                "short": obj.abbreviation or "",
                "isActive": bool(obj.is_active),
            }
        )

    if request.method == "DELETE":
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
    admin, err = _require_ovphe_admin()
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
    admin, err = _require_ovphe_admin()
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
        if _is_department_referenced(obj):
            if obj.is_active:
                obj.is_active = False
                obj.save(update_fields=["is_active"])
            return JsonResponse({"id": str(obj.id), "softDeleted": True})
        obj.delete()
        return JsonResponse({"id": str(department_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ovphe_offices_api(request):
    admin, err = _require_ovphe_admin()
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
    admin, err = _require_ovphe_admin()
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
        if _is_office_referenced(obj):
            if obj.is_active:
                obj.is_active = False
                obj.save(update_fields=["is_active"])
                ApproverFlowStep.objects.filter(office=obj).update(office=None)
            return JsonResponse({"id": str(obj.id), "softDeleted": True})
        obj.delete()
        return JsonResponse({"id": str(office_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ovphe_org_structure_order_api(request):
    admin, err = _require_ovphe_admin()
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
    admin, err = _require_ovphe_admin()
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
    admin, err = _require_ovphe_admin()
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
        step.delete()
        return JsonResponse({"id": str(step_id), "deleted": True})

    return _json_method_not_allowed()


@csrf_exempt
def ovphe_approver_flow_order_api(request):
    admin, err = _require_ovphe_admin()
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

    return JsonResponse({"ok": True})


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
                "description": n.body or "",
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

    colleges_qs = College.objects.order_by("name")
    if college_id:
        colleges_qs = colleges_qs.filter(id=college_id)

    rows = []
    for c in colleges_qs:
        faculty_qs = Faculty.objects.select_related("user").filter(user__is_active=True, college=c)
        total_count = faculty_qs.count()

        completed_count = 0
        if academic_year_int and term_normalized:
            completed_count = Clearance.objects.filter(
                faculty__in=faculty_qs,
                academic_year=academic_year_int,
                term=term_normalized,
                status=Clearance.Status.COMPLETED,
            ).count()

        incomplete_count = max(0, total_count - completed_count)
        completion_rate = float(completed_count / total_count) if total_count else 0.0

        rows.append(
            {
                "collegeId": str(c.id),
                "collegeName": c.name,
                "completionRate": completion_rate,
                "completedCount": completed_count,
                "incompleteCount": incomplete_count,
                "totalCount": total_count,
                "academicYear": academic_year_int,
                "term": term_normalized,
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

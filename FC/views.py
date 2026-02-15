from datetime import datetime
import json
import os
import secrets
from urllib.parse import urlencode

import urllib.request
import urllib.error

from django.db import models
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login as django_login, logout as django_logout

from .models import *


def _json_error(detail: str, status: int = 400):
    return JsonResponse({"detail": detail}, status=status)


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
    redirect_to = _dashboard_route_for_user(user)
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
    redirect_to = _dashboard_route_for_user(user)
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

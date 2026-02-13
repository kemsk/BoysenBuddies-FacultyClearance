from datetime import datetime
import json

from django.db import models
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import *

def dashboard_view(request):
    return render(request, 'system/dashboard.html')


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

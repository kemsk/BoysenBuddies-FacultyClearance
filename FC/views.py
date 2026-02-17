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

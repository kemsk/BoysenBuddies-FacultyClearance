from datetime import datetime
import json

from django.db import transaction
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
        return _json_method_not_allowed()

    colleges = list(
        College.objects.filter(is_active=True)
        .order_by("display_order", "name", "id")
        .values("id", "name", "abbreviation", "display_order")
    )
    departments = list(
        Department.objects.select_related("college")
        .filter(is_active=True, college__is_active=True)
        .order_by("college__display_order", "display_order", "name", "id")
        .values("id", "college_id", "name", "abbreviation", "display_order")
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
                    "displayOrder": int(c.get("display_order") or 0),
                }
                for c in colleges
            ],
            "departments": [
                {
                    "id": str(d["id"]),
                    "collegeId": str(d["college_id"]),
                    "name": d["name"],
                    "short": d["abbreviation"] or "",
                    "displayOrder": int(d.get("display_order") or 0),
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

    config = ApproverFlowConfig.objects.order_by("-updated_at", "-id").first()
    if not config:
        config = ApproverFlowConfig.objects.create(created_by=admin)

    steps = config.steps.prefetch_related("colleges").all().order_by("order", "id")
    return JsonResponse(
        {
            "id": str(config.id),
            "steps": [
                {
                    "id": str(s.id),
                    "category": s.category,
                    "collegeIds": [str(c.id) for c in s.colleges.all()],
                    "order": int(s.order),
                }
                for s in steps
            ],
        }
    )


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
        display_order = _as_int(data.get("displayOrder"), 0)
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
            existing_inactive.display_order = display_order
            existing_inactive.save(update_fields=["is_active", "abbreviation", "display_order"])
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

        obj = College.objects.create(
            name=name,
            abbreviation=short or None,
            is_active=True,
            display_order=display_order,
        )
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
        if "displayOrder" in data:
            obj.display_order = _as_int(data.get("displayOrder"), obj.display_order)
        if "isActive" in data:
            obj.is_active = bool(data.get("isActive"))

        if not (obj.name or "").strip():
            return JsonResponse({"detail": "name is required"}, status=400)
        obj.save(update_fields=["name", "abbreviation", "display_order", "is_active"])
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
        display_order = _as_int(data.get("displayOrder"), 0)
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
            existing_inactive.display_order = display_order
            existing_inactive.save(update_fields=["is_active", "abbreviation", "display_order"])
            return JsonResponse(
                {
                    "id": str(existing_inactive.id),
                    "collegeId": str(existing_inactive.college_id),
                    "name": existing_inactive.name,
                    "short": existing_inactive.abbreviation or "",
                    "displayOrder": int(existing_inactive.display_order),
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
            display_order=display_order,
        )
        return JsonResponse(
            {
                "id": str(obj.id),
                "collegeId": str(obj.college_id),
                "name": obj.name,
                "short": obj.abbreviation or "",
                "displayOrder": int(obj.display_order),
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
        if "displayOrder" in data:
            obj.display_order = _as_int(data.get("displayOrder"), obj.display_order)
        if "isActive" in data:
            obj.is_active = bool(data.get("isActive"))
        if "collegeId" in data and data.get("collegeId"):
            try:
                obj.college = College.objects.get(pk=data.get("collegeId"))
            except College.DoesNotExist:
                return JsonResponse({"detail": "college not found"}, status=404)

        if not (obj.name or "").strip():
            return JsonResponse({"detail": "name is required"}, status=400)
        obj.save(update_fields=["name", "abbreviation", "display_order", "is_active", "college"])
        return JsonResponse(
            {
                "id": str(obj.id),
                "collegeId": str(obj.college_id),
                "name": obj.name,
                "short": obj.abbreviation or "",
                "displayOrder": int(obj.display_order),
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

    college_ids = data.get("colleges") or []
    departments_by_college = data.get("departmentsByCollege") or {}
    office_ids = data.get("offices") or []

    with transaction.atomic():
        for idx, cid in enumerate(college_ids):
            College.objects.filter(pk=cid).update(display_order=idx)
        for college_id, dept_ids in departments_by_college.items():
            for idx, did in enumerate(dept_ids or []):
                Department.objects.filter(pk=did, college_id=college_id).update(display_order=idx)
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
        college_ids = data.get("collegeIds") or []
        order = _as_int(data.get("order"), 0)
        if not category:
            return JsonResponse({"detail": "category is required"}, status=400)

        step = ApproverFlowStep.objects.create(config=config, category=category, order=order)
        if college_ids:
            step.colleges.set(College.objects.filter(pk__in=college_ids, is_active=True))
        return JsonResponse(
            {
                "id": str(step.id),
                "category": step.category,
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
        if not (step.category or "").strip():
            return JsonResponse({"detail": "category is required"}, status=400)
        step.save(update_fields=["category", "order"])

        if "collegeIds" in data:
            college_ids = data.get("collegeIds") or []
            step.colleges.set(College.objects.filter(pk__in=college_ids, is_active=True))

        return JsonResponse(
            {
                "id": str(step.id),
                "category": step.category,
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

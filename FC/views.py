from datetime import datetime
from decimal import Decimal

import csv
import io

from django.db import models, transaction
from django.http import HttpResponse, JsonResponse
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
            "email": "jane.doe@xu.edu.ph",
            "university_id": "2024-00001",
            "employee_id": "EMP-00001",
            "first_name": "Jane",
            "middle_name": "A.",
            "last_name": "Doe",
            "faculty_type": "Full-time",
            "phone_number": "09171234567",
            "office": "Department Chair",
            "college": "College of Computer Studies",
            "department": "Information Technology",
        },
        {
            "email": "john.santos@xu.edu.ph",
            "university_id": "2024-00002",
            "employee_id": "EMP-00002",
            "first_name": "John",
            "middle_name": "B.",
            "last_name": "Santos",
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

    active_timeline = ClearanceTimeline.objects.filter(is_active=True).order_by("-id").first()

    created_count = 0
    updated_count = 0
    skipped_count = 0
    errors: list[dict] = []

    def _clean(value: str | None):
        return (value or "").strip()

    with transaction.atomic():
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

            faculty = Faculty.objects.select_related("user").filter(employee_id=employee_id).first()

            if faculty:
                user = faculty.user
                updated_count += 1
            else:
                user = User.objects.filter(email=email).first() or User.objects.filter(
                    university_id=university_id
                ).first()

                if not user:
                    user = User.objects.create(
                        email=email,
                        university_id=university_id,
                        user_type=User.UserType.FACULTY,
                        is_active=True,
                    )
                    user.set_password(employee_id)
                    user.save(update_fields=["password"])
                    created_count += 1
                else:
                    # Reuse existing user record
                    updated_count += 1

                faculty = Faculty.objects.filter(user=user).first()
                if not faculty:
                    faculty = Faculty.objects.create(user=user, employee_id=employee_id)
                else:
                    faculty.employee_id = employee_id

            user.email = email
            user.university_id = university_id
            user.user_type = User.UserType.FACULTY
            user.is_active = True
            user.first_name = first_name or user.first_name
            user.middle_name = middle_name or user.middle_name
            user.last_name = last_name or user.last_name
            user.save()

            faculty.first_name = first_name
            faculty.middle_name = middle_name
            faculty.last_name = last_name
            faculty.faculty_type = faculty_type
            faculty.phone_number = phone_number

            if office_name:
                office_obj, _ = Office.objects.get_or_create(name=office_name)
                faculty.office = office_obj
            if college_name:
                college_obj, _ = College.objects.get_or_create(name=college_name)
                faculty.college = college_obj
            if department_name and faculty.college:
                dept_obj, _ = Department.objects.get_or_create(
                    college=faculty.college,
                    name=department_name,
                )
                faculty.department = dept_obj

            faculty.save()

            if active_timeline and active_timeline.academic_year and active_timeline.term:
                Clearance.objects.get_or_create(
                    faculty=faculty,
                    academic_year=active_timeline.academic_year,
                    term=active_timeline.term,
                    defaults={"status": Clearance.Status.PENDING},
                )

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

    academic_year = request.GET.get("academic_year")
    term = request.GET.get("term")
    college_id = request.GET.get("college_id")

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

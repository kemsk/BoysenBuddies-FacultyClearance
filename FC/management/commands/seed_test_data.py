from django.core.management.base import BaseCommand
from django.utils import timezone

from FC.models import (
    Announcement,
    ActivityLog,
    Approver,
    ApproverFlowConfig,
    ApproverFlowStep,
    Clearance,
    ClearanceTimeline,
    College,
    Department,
    Notification,
    Office,
    SystemAdmin,
    SystemGuideline,
    StudentAssistant,
    User,
    SystemAnalytics,
)


class Command(BaseCommand):
    help = "Seed idempotent test data for local/dev usage."

    def handle(self, *args, **options):
        ciso_email = "20220025546@my.xu.edu.ph"
        ciso_university_id = "20220025546"
        ciso_password = "capstone"
        ciso_first_name = "Albert Floyd"
        ciso_middle_name = None
        ciso_last_name = "Villanueva"

        ovphe_email = "20190016375@my.xu.edu.ph"
        ovphe_university_id = "20190016375"
        ovphe_password = "kemeru"
        ovphe_first_name = "Nesyl"
        ovphe_middle_name = None
        ovphe_last_name = "Ylanan"

        ciso_user = self._get_or_create_user(
            email=ciso_email,
            university_id=ciso_university_id,
            user_type=User.UserType.ADMIN,
            password=ciso_password,
            first_name=ciso_first_name,
            middle_name=ciso_middle_name,
            last_name=ciso_last_name,
        )
        ovphe_user = self._get_or_create_user(
            email=ovphe_email,
            university_id=ovphe_university_id,
            user_type=User.UserType.ADMIN,
            password=ovphe_password,
            first_name=ovphe_first_name,
            middle_name=ovphe_middle_name,
            last_name=ovphe_last_name,
        )

        ciso_admin, _ = SystemAdmin.objects.get_or_create(
            user=ciso_user,
            defaults={
                "admin_role": SystemAdmin.AdminRole.CISO,
                "is_active": True,
            },
        )
        if ciso_admin.admin_role != SystemAdmin.AdminRole.CISO:
            ciso_admin.admin_role = SystemAdmin.AdminRole.CISO
            ciso_admin.save(update_fields=["admin_role"])

        ovphe_admin, _ = SystemAdmin.objects.get_or_create(
            user=ovphe_user,
            defaults={
                "admin_role": SystemAdmin.AdminRole.OVPHE,
                "is_active": True,
            },
        )
        if ovphe_admin.admin_role != SystemAdmin.AdminRole.OVPHE:
            ovphe_admin.admin_role = SystemAdmin.AdminRole.OVPHE
            ovphe_admin.save(update_fields=["admin_role"])

        self._seed_timeline(created_by_admin=ovphe_admin)
        self._seed_announcement(created_by_admin=ovphe_admin)
        self._seed_guidelines(created_by_user=ovphe_user)
        colleges = self._seed_org_structure()
        self._seed_ciso_system_users(colleges=colleges)
        self._seed_approver_flow(created_by_admin=ovphe_admin, colleges=colleges)
        self._seed_notifications(for_user=ovphe_user)
        self._seed_notifications(for_user=ciso_user)
        self._seed_activity_logs(for_user=ovphe_user, created_by_admin=ovphe_admin)
        self._seed_activity_logs(for_user=ciso_user, created_by_admin=ciso_admin)
        self._seed_system_analytics(created_by_admin=ovphe_admin, colleges=colleges)

        self.stdout.write(self.style.SUCCESS("Seed test data: OK"))

    def _get_or_create_user(self, *, email, university_id, user_type, password, first_name=None, middle_name=None, last_name=None):
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "university_id": university_id,
                "first_name": first_name,
                "middle_name": middle_name,
                "last_name": last_name,
                "user_type": user_type,
                "created_at": timezone.now(),
                "is_active": True,
                "is_staff": True,
            },
        )

        update_fields = []
        if user.university_id != university_id:
            user.university_id = university_id
            update_fields.append("university_id")
        if user.first_name != first_name:
            user.first_name = first_name
            update_fields.append("first_name")
        if user.middle_name != middle_name:
            user.middle_name = middle_name
            update_fields.append("middle_name")
        if user.last_name != last_name:
            user.last_name = last_name
            update_fields.append("last_name")
        if user.user_type != user_type:
            user.user_type = user_type
            update_fields.append("user_type")
        if not user.is_staff:
            user.is_staff = True
            update_fields.append("is_staff")
        if not user.is_active:
            user.is_active = True
            update_fields.append("is_active")

        if created:
            user.set_password(password)
            update_fields.append("password")

        if update_fields:
            user.save(update_fields=update_fields)

        return user

    def _seed_timeline(self, *, created_by_admin):
        today = timezone.localdate()
        start_year = today.year

        ClearanceTimeline.objects.update_or_create(
            academic_year=start_year,
            term=Clearance.Term.FIRST,
            defaults={
                "term_start_date": today,
                "term_end_date": today,
                "clearance_start_date": today,
                "clearance_end_date": today,
                "created_by": created_by_admin,
                "is_active": True,
            },
        )

    def _seed_announcement(self, *, created_by_admin):
        Announcement.objects.update_or_create(
            title="System Maintenance Notice",
            defaults={
                "body": "This is seeded announcement data.",
                "created_by": created_by_admin,
                "pin_announcement": True,
                "is_active": True,
                "start_date": timezone.now(),
            },
        )

        Announcement.objects.update_or_create(
            title="Welcome OVPHE",
            defaults={
                "body": "Welcome! This is seeded announcement data.",
                "created_by": created_by_admin,
                "pin_announcement": False,
                "is_active": True,
                "start_date": timezone.now(),
            },
        )

    def _seed_guidelines(self, *, created_by_user):
        SystemGuideline.objects.update_or_create(
            title="General Safety Guidelines",
            defaults={
                "body": "This is seeded guideline data.",
                "created_by": created_by_user,
                "is_active": True,
            },
        )
        SystemGuideline.objects.update_or_create(
            title="Clearance Reminders",
            defaults={
                "body": "This is seeded guideline data.",
                "created_by": created_by_user,
                "is_active": True,
            },
        )

    def _seed_org_structure(self):
        ccs, _ = College.objects.update_or_create(
            abbreviation="CCS",
            defaults={"name": "College of Computer Studies"},
        )
        cas, _ = College.objects.update_or_create(
            abbreviation="CAS",
            defaults={"name": "College of Arts and Sciences"},
        )

        Department.objects.update_or_create(
            college=ccs,
            abbreviation="CS",
            defaults={"name": "Computer Science"},
        )
        Department.objects.update_or_create(
            college=ccs,
            abbreviation="IT",
            defaults={"name": "Information Technology"},
        )

        Office.objects.update_or_create(
            abbreviation="OVPHE",
            defaults={"name": "Office of the Vice President for Higher Education"},
        )
        Office.objects.update_or_create(
            abbreviation="REG",
            defaults={"name": "University Registrar"},
        )
        Office.objects.update_or_create(
            abbreviation="LIB",
            defaults={"name": "University Library"},
        )
        Office.objects.update_or_create(
            abbreviation="HRO",
            defaults={"name": "Human Resources Office"},
        )

        return [ccs, cas]

    def _seed_approver_flow(self, *, created_by_admin, colleges):
        config = ApproverFlowConfig.objects.order_by("-updated_at", "-id").first()
        if not config:
            config = ApproverFlowConfig.objects.create(created_by=created_by_admin)
        else:
            config.created_by = created_by_admin
            config.save(update_fields=["created_by", "updated_at"])

        if not config.steps.exists():
            steps = [
                "Department Chair",
                "College Dean",
                "University Registrar",
                "University Library",
                "OVPHE",
                "Human Resources Office",
            ]
            for i, category in enumerate(steps):
                step = ApproverFlowStep.objects.create(config=config, order=i, category=category)
                step.colleges.set(colleges)

    def _seed_notifications(self, *, for_user):
        Notification.objects.update_or_create(
            user=for_user,
            title="Department Chair",
            defaults={
                "status": Notification.Status.APPROVED,
                "details": ["Submission of Syllabus", "Submission of Grades"],
                "body": "",
                "is_read": False,
            },
        )
        Notification.objects.update_or_create(
            user=for_user,
            title="University Registrar",
            defaults={
                "status": Notification.Status.REJECTED,
                "details": ["Submission of Grades", "Remarks: incomplete submission"],
                "body": "",
                "is_read": False,
            },
        )

    def _seed_activity_logs(self, *, for_user, created_by_admin):
        ActivityLog.objects.update_or_create(
            event_type=ActivityLog.EventType.APPROVED_CLEARANCE,
            request_id="2005123456789",
            defaults={
                "actor_user": for_user,
                "actor_admin": created_by_admin,
                "approver_department": "College of Computer Studies",
                "university_id": "2005123456789",
                "details": ["Seeded log"],
            },
        )

    def _seed_ciso_system_users(self, *, colleges):
        ccs = next((c for c in colleges if c.abbreviation == "CCS"), None)
        cas = next((c for c in colleges if c.abbreviation == "CAS"), None)
        any_college = ccs or cas
        any_department = None
        if any_college:
            any_department = Department.objects.filter(college=any_college).order_by("id").first()

        approver_user = self._get_or_create_user(
            email="approver.seed@xu.edu.ph",
            university_id="APPROVER-SEED-1",
            user_type=User.UserType.APPROVER,
            password="capstone",
            first_name="Angela",
            middle_name=None,
            last_name="Santos",
        )
        Approver.objects.get_or_create(
            user=approver_user,
            defaults={
                "approver_type": "College",
                "college": any_college,
                "department": any_department,
            },
        )

        assistant_user = self._get_or_create_user(
            email="assistant.seed@xu.edu.ph",
            university_id="ASSISTANT-SEED-1",
            user_type=User.UserType.ASSISTANT,
            password="capstone",
            first_name="Seed",
            middle_name=None,
            last_name="Assistant",
        )
        StudentAssistant.objects.get_or_create(
            user=assistant_user,
            defaults={
                "college": any_college,
                "department": any_department,
            },
        )

    def _seed_system_analytics(self, *, created_by_admin, colleges):
        for idx, c in enumerate(colleges):
            SystemAnalytics.objects.update_or_create(
                college=c,
                academic_year=timezone.localdate().year,
                term=Clearance.Term.FIRST,
                defaults={
                    "completion_rate": 70 + idx,
                    "generated_by": created_by_admin,
                },
            )

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

# Create your models here.


class UserManager(BaseUserManager):
    def create_user(self, email, university_id, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email must be set")
        if not university_id:
            raise ValueError("The University ID must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, university_id=university_id, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, university_id, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("user_type", User.UserType.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email=email, university_id=university_id, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class UserType(models.TextChoices):
        FACULTY = "FACULTY", "FACULTY"
        APPROVER = "APPROVER", "APPROVER"
        ASSISTANT = "ASSISTANT", "ASSISTANT"
        ADMIN = "ADMIN", "ADMIN"

    email = models.EmailField(max_length=150, unique=True)
    university_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    user_type = models.CharField(max_length=20, choices=UserType.choices)
    created_at = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["university_id"]

    def __str__(self):
        return self.email


class Office(models.Model):
    name = models.CharField(max_length=150)
    abbreviation = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return self.name


class College(models.Model):
    name = models.CharField(max_length=150)
    abbreviation = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return self.name


class Department(models.Model):
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name="departments")
    name = models.CharField(max_length=150)
    abbreviation = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return self.name


class Faculty(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="faculty_profile")
    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    faculty_type = models.CharField(max_length=50, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    office = models.ForeignKey(Office, on_delete=models.SET_NULL, null=True, blank=True, related_name="faculty")
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True, related_name="faculty")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="faculty")

    def __str__(self):
        return self.employee_id


class Approver(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="approver_profile")
    approver_type = models.CharField(max_length=50, null=True, blank=True)
    office = models.ForeignKey(Office, on_delete=models.SET_NULL, null=True, blank=True, related_name="approvers")
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True, related_name="approvers")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="approvers")
    is_dual_role = models.BooleanField(default=False)
    is_hro = models.BooleanField(default=False)

    def __str__(self):
        return str(self.user_id)


class StudentAssistant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="assistant_profile")
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True, related_name="assistants")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="assistants")
    supervisor_approver = models.ForeignKey(
        Approver,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supervised_assistants",
    )

    def __str__(self):
        return str(self.user_id)


class SystemAdmin(models.Model):
    class AdminRole(models.TextChoices):
        CISO = "CISO", "CISO"
        OVPHE = "OVPHE", "OVPHE"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="admin_profile")
    admin_role = models.CharField(max_length=20, choices=AdminRole.choices)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email} ({self.admin_role})"


class Clearance(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "PENDING"
        IN_PROGRESS = "IN_PROGRESS", "IN_PROGRESS"
        COMPLETED = "COMPLETED", "COMPLETED"
        REJECTED = "REJECTED", "REJECTED"

    class Term(models.TextChoices):
        FIRST = "1ST", "1ST"
        SECOND = "2ND", "2ND"
        INTERSESSION = "INTERSESSION", "INTERSESSION"

    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name="clearances")
    academic_year = models.IntegerField()
    term = models.CharField(max_length=20, choices=Term.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    submitted_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.faculty.employee_id} - {self.academic_year} {self.term}"


class Requirement(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    required_physical = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        Approver,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_requirements",
    )
    created_date = models.DateTimeField(auto_now_add=True)
    deadline_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    offices = models.ManyToManyField(Office, blank=True, related_name="requirements")
    colleges = models.ManyToManyField(College, blank=True, related_name="requirements")
    departments = models.ManyToManyField(Department, blank=True, related_name="requirements")

    def __str__(self):
        return self.title


class ClearanceRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "PENDING"
        APPROVED = "APPROVED", "APPROVED"
        REJECTED = "REJECTED", "REJECTED"

    clearance = models.ForeignKey(Clearance, on_delete=models.CASCADE, related_name="requests")
    timeline = models.ForeignKey(
        "ClearanceTimeline",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clearance_requests",
    )
    requirement = models.ForeignKey(Requirement, on_delete=models.CASCADE, related_name="clearance_requests")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    remarks = models.TextField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_clearance_requests",
    )
    approved_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["clearance", "requirement"], name="uniq_clearance_requirement")
        ]

    def __str__(self):
        return f"{self.clearance_id}:{self.requirement_id}"


class Announcement(models.Model):
    title = models.CharField(max_length=200, null=True, blank=True)
    body = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    pin_announcement = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title or str(self.pk)


class ApproverFlowConfig(models.Model):
    created_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approver_flow_configs",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.pk)


class ApproverFlowStep(models.Model):
    config = models.ForeignKey(
        ApproverFlowConfig,
        on_delete=models.CASCADE,
        related_name="steps",
    )
    order = models.PositiveIntegerField(default=0)
    category = models.CharField(max_length=150)
    colleges = models.ManyToManyField(College, blank=True, related_name="approver_flow_steps")

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.category} ({self.order})"


class ActivityLog(models.Model):
    class EventType(models.TextChoices):
        APPROVED_CLEARANCE = "approved_clearance", "approved_clearance"
        REJECTED_CLEARANCE = "rejected_clearance", "rejected_clearance"
        CREATE_REQUEST = "create_request", "create_request"
        CREATED_REQUIREMENTS = "created_requirements", "created_requirements"
        EDITED_REQUIREMENTS = "edited_requirements", "edited_requirements"
        DELETED_REQUIREMENTS = "deleted_requirements", "deleted_requirements"
        EDITED_ANNOUNCEMENT = "edited_announcement", "edited_announcement"
        USER_LOGOUT = "user_logout", "user_logout"
        ADDED_ASSISTANT_APPROVER = "added_assistant_approver", "added_assistant_approver"
        UPDATED_ASSISTANT_APPROVER = "updated_assistant_approver", "updated_assistant_approver"
        REMOVED_ASSISTANT_APPROVER = "removed_assistant_approver", "removed_assistant_approver"

    event_type = models.CharField(max_length=50, choices=EventType.choices)
    actor_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    actor_admin = models.ForeignKey(
        SystemAdmin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    requirement = models.ForeignKey(
        Requirement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )

    approver_department = models.CharField(max_length=150, null=True, blank=True)
    university_id = models.CharField(max_length=50, null=True, blank=True)
    request_id = models.CharField(max_length=50, null=True, blank=True)
    details = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.event_type} ({self.created_at})"


class ClearanceTimeline(models.Model):
    academic_year = models.IntegerField(null=True, blank=True)
    term = models.CharField(max_length=20, choices=Clearance.Term.choices, null=True, blank=True)
    term_start_date = models.DateField(null=True, blank=True)
    term_end_date = models.DateField(null=True, blank=True)
    clearance_start_date = models.DateField(null=True, blank=True)
    clearance_end_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_timelines",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        if self.academic_year and self.term:
            return f"{self.academic_year} {self.term}"
        return str(self.pk)


class SystemGuideline(models.Model):
    title = models.CharField(max_length=200, null=True, blank=True)
    body = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_guidelines",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title or str(self.pk)


class SystemAnalytics(models.Model):
    academic_year = models.IntegerField(null=True, blank=True)
    term = models.CharField(max_length=20, choices=Clearance.Term.choices, null=True, blank=True)
    college = models.ForeignKey(
        College,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analytics",
    )
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generated_analytics",
    )

    def __str__(self):
        return str(self.pk)


class Archive(models.Model):
    class Status(models.TextChoices):
        COMPLETED = "COMPLETED", "COMPLETED"
        INCOMPLETE = "INCOMPLETE", "INCOMPLETE"

    request = models.OneToOneField(
        ClearanceRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="archive",
    )
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name="archives")
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True, related_name="archives")
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="archives",
    )
    faculty_type = models.CharField(max_length=50, null=True, blank=True)
    missing_signatures = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices)
    term = models.CharField(max_length=20, choices=Clearance.Term.choices, null=True, blank=True)
    archived_at = models.DateTimeField(auto_now_add=True)
    archived_by = models.ForeignKey(
        Approver,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="archives_created",
    )

    def __str__(self):
        return str(self.pk)


class Notification(models.Model):
    class Status(models.TextChoices):
        APPROVED = "approved", "approved"
        REJECTED = "rejected", "rejected"
        SUBMITTED = "submitted", "submitted"

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications")
    title = models.CharField(max_length=200, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    body = models.TextField(null=True, blank=True)
    details = models.JSONField(default=list, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or str(self.pk)


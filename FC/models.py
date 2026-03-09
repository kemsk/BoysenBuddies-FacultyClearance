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

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email=email, university_id=university_id, password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=150, unique=True)
    university_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    user_pin = models.CharField(max_length=128, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["university_id"]

    def __str__(self):
        return self.email
    
    def get_active_roles(self):
        """Get all active roles for this user"""
        return self.userrole_set.filter(is_active=True).select_related('role')
    
    def has_role_permission(self, permission_name):
        """Check if user has specific permission through any of their roles"""
        return any(
            role.role.permissions.filter(codename=permission_name).exists()
            for role in self.get_active_roles()
        )
    
    def is_college_admin(self, college=None):
        """Check if user is college admin for specific college"""
        if college:
            return self.userrole_set.filter(
                role__name='College Admin',
                college=college,
                is_active=True
            ).exists()
        return self.userrole_set.filter(
            role__name='College Admin',
            is_active=True
        ).exists()
    
    def is_department_chair(self, department=None):
        """Check if user is department chair for specific department"""
        if department:
            return self.userrole_set.filter(
                role__name='Department Chair',
                department=department,
                is_active=True
            ).exists()
        return self.userrole_set.filter(
            role__name='Department Chair',
            is_active=True
        ).exists()
    
    def is_office_admin(self, office=None):
        """Check if user is office admin for specific office"""
        if office:
            return self.userrole_set.filter(
                role__name='Office Admin',
                office=office,
                is_active=True
            ).exists()
        return self.userrole_set.filter(
            role__name='Office Admin',
            is_active=True
        ).exists()
    
    def is_ciso_admin(self):
        """Check if user is CISO admin"""
        return self.userrole_set.filter(
            role__name='CISO Admin',
            is_active=True
        ).exists()
    
    def is_ovphe_admin(self):
        """Check if user is OVPHE admin"""
        return self.userrole_set.filter(
            role__name='OVPHE Admin',
            is_active=True
        ).exists()


class Office(models.Model):
    name = models.CharField(max_length=150)
    abbreviation = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class College(models.Model):
    name = models.CharField(max_length=150)
    abbreviation = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Department(models.Model):
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name="departments")
    name = models.CharField(max_length=150)
    abbreviation = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField('auth.Permission', blank=True)
    is_system_role = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    office = models.ForeignKey(Office, on_delete=models.SET_NULL, null=True, blank=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_roles')
    assigned_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'role', 'college', 'department', 'office']

    def __str__(self):
        return f"{self.user.email} - {self.role.name}"


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

    def __str__(self):
        return str(self.user_id)


class StudentAssistant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="assistant_profile")
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True, related_name="assistants")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="assistants")
    supervisor_approver = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supervised_assistants",
    )

    def __str__(self):
        return str(self.user_id)


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
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    clearance_timeline = models.ForeignKey(ClearanceTimeline, on_delete=models.CASCADE)
    last_updated = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    recipient_scope = models.CharField(
        max_length=20,
        choices=[
            ('all', 'All Faculty'),
            ('college', 'By College'),
            ('department', 'By Department'),
            ('office', 'By Office'),
            ('individual', 'Individual Faculty')
        ]
    )
    
    # Target recipients (based on scope)
    target_colleges = models.ManyToManyField(College, blank=True)
    target_departments = models.ManyToManyField(Department, blank=True)
    target_offices = models.ManyToManyField(Office, blank=True)
    target_faculty = models.ManyToManyField('Faculty', blank=True)

    def __str__(self):
        return self.title


class ClearanceRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "PENDING"
        APPROVED = "APPROVED", "APPROVED"
        REJECTED = "REJECTED", "REJECTED"

    request_id = models.CharField(max_length=50, unique=True)  # e.g., "2526-001"
    faculty = models.ForeignKey('Faculty', on_delete=models.CASCADE)
    requirement = models.ForeignKey(Requirement, on_delete=models.CASCADE, related_name="clearance_requests")
    clearance_timeline = models.ForeignKey(ClearanceTimeline, on_delete=models.CASCADE)
    submission_notes = models.TextField(blank=True)
    submission_link = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    submitted_date = models.DateTimeField(auto_now_add=True)
    
    # Simplified approver assignment - use existing approver structure
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_requests')
    approved_date = models.DateTimeField(null=True, blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["request_id"], name="uniq_request_id")
        ]

    def __str__(self):
        return self.request_id


class Announcement(models.Model):
    title = models.CharField(max_length=200, null=True, blank=True)
    body = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        User,
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
        User,
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
    office = models.ForeignKey(
        Office,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approver_flow_steps",
    )
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
    user = models.ForeignKey(
        User,
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
    name = models.CharField(max_length=200)
    academic_year_start = models.IntegerField()
    academic_year_end = models.IntegerField()
    term = models.CharField(max_length=20, choices=Clearance.Term.choices)
    clearance_start_date = models.DateTimeField()
    clearance_end_date = models.DateTimeField()
    is_active = models.BooleanField(default=False)
    archive_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['is_active'], condition=models.Q(is_active=True), name='single_active_timeline')
        ]

    def __str__(self):
        return self.name


class ArchivedClearance(models.Model):
    faculty = models.ForeignKey('Faculty', on_delete=models.CASCADE)
    clearance_timeline = models.ForeignKey(ClearanceTimeline, on_delete=models.CASCADE)
    academic_year = models.CharField(max_length=20)
    semester = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=Archive.Status.choices)
    clearance_period_start = models.DateField()
    clearance_period_end = models.DateField()
    last_updated = models.DateTimeField()
    archived_date = models.DateTimeField(auto_now_add=True)
    csv_dump_path = models.CharField(max_length=500, blank=True)
    csv_dump_size = models.CharField(max_length=50, blank=True)
    clearance_data = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.faculty.employee_id} - {self.academic_year} {self.semester}"


class ApproverAssistant(models.Model):
    assistant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assistant_assignments')
    supervisor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='supervised_assistants')
    assistant_type = models.CharField(
        max_length=20,
        choices=[
            ('college_admin', 'College Admin'),
            ('dept_chair', 'Department Chair'),
            ('office_admin', 'Office Admin'),
            ('admin_secondment', 'Administrative Secondment'),
            ('student_assistant', 'Student Assistant')
        ]
    )
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    office = models.ForeignKey(Office, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_assistants')
    assigned_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['assistant', 'supervisor', 'assistant_type']

    def __str__(self):
        return f"{self.assistant.email} - {self.get_assistant_type_display()}"


class AdministrativeSecondment(models.Model):
    primary_approver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='primary_secondments')
    secondment_approver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='secondment_assignments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True)
    office = models.ForeignKey(Office, on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    assigned_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['primary_approver', 'secondment_approver', 'department', 'office']
    
    def __str__(self):
        if self.department:
            return f"2nd Dept Chair - {self.department.name}"
        elif self.office:
            return f"2nd Office Admin - {self.office.name}"
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
    clearance_timeline = models.ForeignKey(ClearanceTimeline, on_delete=models.CASCADE)
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    total_faculty = models.IntegerField(default=0)
    completed_clearances = models.IntegerField(default=0)
    pending_clearances = models.IntegerField(default=0)
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        unique_together = ['clearance_timeline', 'college', 'department']

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
        User,
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

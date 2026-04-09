from __future__ import annotations

from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from FC.models import Clearance, ClearanceTimeline, Faculty, Notification


class Command(BaseCommand):
    help = (
        "Send 'Action Required' notifications 48 hours before and on the final day of the active clearance timeline "
        "end date (intended to be run at 8AM Asia/Manila) for faculty who have not submitted their clearance."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Compute what would be sent without writing notifications.",
        )
        parser.add_argument(
            "--skip-time-check",
            action="store_true",
            default=False,
            help="Skip the 8AM Asia/Manila guard (useful for manual runs).",
        )

    def handle(self, *args, **options):
        dry_run: bool = bool(options.get("dry_run"))
        skip_time_check: bool = bool(options.get("skip_time_check"))

        tz = ZoneInfo("Asia/Manila")
        now = timezone.now().astimezone(tz)
        today = now.date()

        if not skip_time_check:
            if now.hour != 8:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Not 8AM Asia/Manila (now={now.isoformat()}); skipping. Use --skip-time-check to override."
                    )
                )
                return

        timeline = ClearanceTimeline.objects.filter(is_active=True, archive_date__isnull=True).order_by(
            "-academic_year_start", "-id"
        ).first()
        if not timeline or not timeline.clearance_end_date or not timeline.clearance_start_date:
            self.stdout.write(self.style.WARNING("No active clearance timeline found."))
            return

        end_dt = timezone.localtime(timeline.clearance_end_date, tz)
        end_date = end_dt.date()
        start_dt = timezone.localtime(timeline.clearance_start_date, tz)
        start_date = start_dt.date()

        days_left = (end_date - today).days
        if days_left not in (2, 0):
            self.stdout.write(
                self.style.SUCCESS(
                    f"No Action Required notification to send today. End date={end_date.isoformat()} days_left={days_left}."
                )
            )
            return

        faculty_user_ids = list(
            Faculty.objects.select_related("user").order_by("user_id").values_list("user_id", flat=True)
        )
        if not faculty_user_ids:
            self.stdout.write(self.style.WARNING("No faculty users found."))
            return

        # Determine who has submitted clearance for this timeline (academic_year + term)
        submitted_user_ids = set(
            Clearance.objects.filter(
                academic_year=timeline.academic_year_start,
                term=timeline.term,
                faculty__user_id__in=faculty_user_ids,
                submitted_date__isnull=False,
            ).values_list("faculty__user_id", flat=True)
        )

        incomplete_user_ids = [uid for uid in faculty_user_ids if uid not in submitted_user_ids]
        if not incomplete_user_ids:
            self.stdout.write(self.style.SUCCESS("No incomplete faculty clearances found; nothing to notify."))
            return

        title = "Action Required"
        deadline_str = end_date.strftime("%B %d, %Y")
        if days_left == 2:
            body = (
                "Your clearance is still incomplete and is due in 48 hours. "
                f"Failure to submit by {deadline_str} at 11:59PM may result in administrative holds.\n\n"
                f"Clearance Period End Date : {deadline_str}"
            )
        else:
            body = (
                "Today is the final day to complete your clearance. Please submit your requirements by 11:59 PM  "
                "to finalize your account status.\n\n"
                f"Clearance Period End Date : {deadline_str}"
            )

        existing_user_ids = set(
            Notification.objects.filter(
                title=title,
                user_id__in=incomplete_user_ids,
                clearance_period_end_date=end_date,
                created_at__date=today,
            ).values_list("user_id", flat=True)
        )

        to_create: list[Notification] = []
        for user_id in incomplete_user_ids:
            if user_id in existing_user_ids:
                continue
            to_create.append(
                Notification(
                    user_id=user_id,
                    user_role="Faculty",
                    title=title,
                    status=None,
                    body=body,
                    details=[],
                    is_read=False,
                    created_by=None,
                    approver=None,
                    clearance_period_start_date=start_date,
                    clearance_period_end_date=end_date,
                )
            )

        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"Dry-run: would create {len(to_create)} notifications."))
            return

        if not to_create:
            self.stdout.write(self.style.SUCCESS("No new notifications to create (already sent today)."))
            return

        with transaction.atomic():
            Notification.objects.bulk_create(to_create)

        self.stdout.write(self.style.SUCCESS(f"Created {len(to_create)} notifications."))

# Generated migration to add exported_clearance_results event type

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('FC', '0021_fix_activitylog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activitylog',
            name='event_type',
            field=models.CharField(
                choices=[
                    ('approved_clearance', 'approved_clearance'),
                    ('rejected_clearance', 'rejected_clearance'),
                    ('assistant_approved_clearance', 'assistant_approved_clearance'),
                    ('assistant_rejected_clearance', 'assistant_rejected_clearance'),
                    ('assistant_individual_approved_clearance', 'assistant_individual_approved_clearance'),
                    ('assistant_individual_rejected_clearance', 'assistant_individual_rejected_clearance'),
                    ('individual_approved_clearance', 'individual_approved_clearance'),
                    ('individual_rejected_clearance', 'individual_rejected_clearance'),
                    ('create_request', 'create_request'),
                    ('created_requirements', 'created_requirements'),
                    ('edited_requirements', 'edited_requirements'),
                    ('edited_requirement', 'edited_requirement'),
                    ('deleted_requirements', 'deleted_requirements'),
                    ('edited_announcement', 'edited_announcement'),
                    ('user_login', 'user_login'),
                    ('user_logout', 'user_logout'),
                    ('added_assistant_approver', 'added_assistant_approver'),
                    ('updated_assistant_approver', 'updated_assistant_approver'),
                    ('removed_assistant_approver', 'removed_assistant_approver'),
                    ('created_guideline', 'created_guideline'),
                    ('edited_guideline', 'edited_guideline'),
                    ('enabled_guideline', 'enabled_guideline'),
                    ('disabled_guideline', 'disabled_guideline'),
                    ('delete_guideline', 'delete_guideline'),
                    ('archived_guideline', 'archived_guideline'),
                    ('created_announcement', 'created_announcement'),
                    ('enabled_announcement', 'enabled_announcement'),
                    ('disabled_announcement', 'disabled_announcement'),
                    ('deleted_announcement', 'deleted_announcement'),
                    ('created_timeline', 'created_timeline'),
                    ('edited_timeline', 'edited_timeline'),
                    ('archived_timeline', 'archived_timeline'),
                    ('enabled_timeline', 'enabled_timeline'),
                    ('disabled_timeline', 'disabled_timeline'),
                    ('active_timeline', 'active_timeline'),
                    ('inactive_timeline', 'inactive_timeline'),
                    ('created_college', 'created_college'),
                    ('edited_college', 'edited_college'),
                    ('deleted_college', 'deleted_college'),
                    ('created_department', 'created_department'),
                    ('edited_department', 'edited_department'),
                    ('deleted_department', 'deleted_department'),
                    ('created_office', 'created_office'),
                    ('edited_office', 'edited_office'),
                    ('deleted_office', 'deleted_office'),
                    ('added_to_approver_flow', 'added_to_approver_flow'),
                    ('edited_approver_flow', 'edited_approver_flow'),
                    ('removed_from_approver_flow', 'removed_from_approver_flow'),
                    ('faculty_data_dump_upload', 'faculty_data_dump_upload'),
                    ('faculty_data_dump_removed', 'faculty_data_dump_removed'),
                    ('faculty_data_dump_error', 'faculty_data_dump_error'),
                    ('exported_clearance_results', 'exported_clearance_results'),
                ],
                max_length=50
            ),
        ),
    ]

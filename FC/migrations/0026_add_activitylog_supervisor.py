from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('FC', '0025_add_individual_approval_events_fix'),
    ]

    operations = [
        migrations.AddField(
            model_name='activitylog',
            name='supervisor',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='supervised_activity_logs',
                to='FC.user',
            ),
        ),
    ]

# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('FC', '0019_merge_20260401_2014'),
    ]

    operations = [
        migrations.AddField(
            model_name='activitylog',
            name='department',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name='activitylog',
            name='office',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name='activitylog',
            name='college',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
    ]

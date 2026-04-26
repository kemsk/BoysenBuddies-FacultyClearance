from django.core.management.base import BaseCommand
from FC.email_notifications import test_email_configuration


class Command(BaseCommand):
    help = 'Test email configuration and SMTP connection'

    def handle(self, *args, **options):
        result = test_email_configuration()
        if result:
            self.stdout.write(self.style.SUCCESS('Email configuration test passed!'))
        else:
            self.stdout.write(self.style.ERROR('Email configuration test failed!'))

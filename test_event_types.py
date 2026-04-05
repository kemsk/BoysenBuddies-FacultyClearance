from FC.models import ActivityLog, User

# Check current event types
print('Current event types in model:')
for choice in ActivityLog.EventType.choices:
    if 'assistant' in choice[0]:
        print(f'  - {choice[0]}')

# Try to create an activity log with the new event type to see if it works
user = User.objects.first()
print(f'Test user: {user.email if user else "None"}')

# Test the new event types
try:
    log = ActivityLog.objects.create(
        event_type='assistant_individual_approved_clearance',
        user=user,
        details={'test': 'test'}
    )
    print('SUCCESS: Created assistant_individual_approved_clearance')
    log.delete()
except Exception as e:
    print(f'ERROR: {e}')

try:
    log = ActivityLog.objects.create(
        event_type='assistant_individual_rejected_clearance',
        user=user,
        details={'test': 'test'}
    )
    print('SUCCESS: Created assistant_individual_rejected_clearance')
    log.delete()
except Exception as e:
    print(f'ERROR: {e}')

from django.urls import path
from . import views

app_name = 'fc'

urlpatterns = [
    path('api/me', views.me_api, name='Me'),
    path('api/auth/google', views.google_sign_in_api, name='GoogleSignIn'),
    path('api/auth/logout', views.logout_api, name='Logout'),
    path('dashboard', views.dashboard_view, name='Dashboard'),
    path('api/clearance-requests', views.clearance_requests_api, name='ClearanceRequests'),
    path('api/active-clearance-timeline', views.active_clearance_timeline_api, name='ActiveClearanceTimeline'),
    path('api/ciso-profile', views.ciso_profile_api, name='CISOProfile'),
    path('api/ciso/system-guidelines', views.ciso_system_guidelines_api, name='CISOSystemGuidelines'),
    path('api/ciso/announcements', views.ciso_announcements_api, name='CISOAnnouncements'),
    path('api/ciso/notifications', views.ciso_notifications_api, name='CISONotifications'),
    path('api/ciso/activity-logs', views.ciso_activity_logs_api, name='CISOActivityLogs'),
    path('api/ciso/system-users', views.ciso_system_users_api, name='CISOSystemUsers'),
    path('api/ovphe-profile', views.ovphe_profile_api, name='OVPHEProfile'),
    path('api/ovphe/system-guidelines', views.ovphe_system_guidelines_api, name='OVPHESystemGuidelines'),
    path('api/ovphe/announcements', views.ovphe_announcements_api, name='OVPHEAnnouncements'),
    path('api/ovphe/clearance-timelines', views.ovphe_clearance_timelines_api, name='OVPHEClearanceTimelines'),
    path('api/ovphe/org-structure', views.ovphe_org_structure_api, name='OVPHEOrgStructure'),
    path('api/ovphe/approver-flow', views.ovphe_approver_flow_api, name='OVPHEApproverFlow'),
    path('api/ovphe/notifications', views.ovphe_notifications_api, name='OVPHENotifications'),
    path('api/ovphe/system-analytics', views.ovphe_system_analytics_api, name='OVPHESystemAnalytics'),
    path('api/ovphe/activity-logs', views.ovphe_activity_logs_api, name='OVPHEActivityLogs'),

    path('api/faculty/dashboard', views.faculty_dashboard_api, name='FacultyDashboard'),
    path('api/faculty/notifications', views.faculty_notifications_api, name='FacultyNotifications'),
]
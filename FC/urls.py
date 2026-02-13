from django.urls import path
from . import views

app_name = 'fc'

urlpatterns = [
    path('dashboard', views.dashboard_view, name='Dashboard'),

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
    path('api/ovphe/org-structure/order', views.ovphe_org_structure_order_api, name='OVPHEOrgStructureOrder'),
    path('api/ovphe/colleges', views.ovphe_colleges_api, name='OVPHEColleges'),
    path('api/ovphe/colleges/<int:college_id>', views.ovphe_college_detail_api, name='OVPHECollegeDetail'),
    path('api/ovphe/departments', views.ovphe_departments_api, name='OVPHEDepartments'),
    path('api/ovphe/departments/<int:department_id>', views.ovphe_department_detail_api, name='OVPHEDepartmentDetail'),
    path('api/ovphe/offices', views.ovphe_offices_api, name='OVPHEOffices'),
    path('api/ovphe/offices/<int:office_id>', views.ovphe_office_detail_api, name='OVPHEOfficeDetail'),
    path('api/ovphe/approver-flow', views.ovphe_approver_flow_api, name='OVPHEApproverFlow'),
    path('api/ovphe/approver-flow/steps', views.ovphe_approver_flow_steps_api, name='OVPHEApproverFlowSteps'),
    path('api/ovphe/approver-flow/steps/<int:step_id>', views.ovphe_approver_flow_step_detail_api, name='OVPHEApproverFlowStepDetail'),
    path('api/ovphe/approver-flow/order', views.ovphe_approver_flow_order_api, name='OVPHEApproverFlowOrder'),
    path('api/ovphe/notifications', views.ovphe_notifications_api, name='OVPHENotifications'),
    path('api/ovphe/system-analytics', views.ovphe_system_analytics_api, name='OVPHESystemAnalytics'),
    path('api/ovphe/activity-logs', views.ovphe_activity_logs_api, name='OVPHEActivityLogs'),
]
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/login/login";
import Otp from "./pages/login/otp";
import LoginPrompt from "./pages/login/login-prompt";

import Facultydashboard from "./pages/faculty/faculty_member_dashboard";
import FacultyNotification from "./pages/faculty/faculty-notification";

import Approverdashboard from "./pages/approver/approver-dashboard";
import ApproverRequirementList from "./pages/approver/approver-requirement-list";
import ApproverClearance from "./pages/approver/approver-clearance";
import ApproverAction from "./pages/approver/approver-action";
import ApproverAssistantList from "./pages/approver/approver-assistant-list";
import ApproverActivityLogs from "./pages/approver/approver-activity-logs";
import ApproverNotification from "./pages/approver/approver-notification";

import AssistantApproverDashboard from "./pages/assistant-approver/assistant-approver-dashboard";
import AssistantApproverRequirementList from "./pages/assistant-approver/assistant-approver-requirement-list";
import AssistantApproverClearance from "./pages/assistant-approver/assistant-approver-clearance";
import AssistantApproverNotification from "./pages/assistant-approver/assistant-approver-notification";

import OVPHEDashboard from "./pages/OVPHE/OVPHE-dashboard";
import OVPHETools from "./pages/OVPHE/OVPHE-tools";
import OVPHEClearanceTimeline from "./pages/OVPHE/OVPHE-clearance-timeline";
import OVPHECollegeOfficeConfiguration from "./pages/OVPHE/OVPHE-college-office-configuration";
import OVPHESystemAnalytics from "./pages/OVPHE/OVPHE-system-analytics";
import OVPHESystemGuideline from "./pages/OVPHE/OVPHE-system-guideline";
import OVPHEAnnouncements from "./pages/OVPHE/OVPHE-announcement";
import OVPHENotification from "./pages/OVPHE/OVPHE-notification";
import OVPHEActivityLogs from "./pages/OVPHE/OVPHE-activity-logs";

import CISODashboard from "./pages/CISO/CISO-dashboard";
import CISOTools from "./pages/CISO/CISO-tools";
import CISOSystemGuideline from "./pages/CISO/CISO-system-guideline";
import CISOAnnouncements from "./pages/CISO/CISO-announcement";
import CISOFacultyDataDump from "./pages/CISO/CISO-faculty-data-dump";
import CISOManageSystemUser from "./pages/CISO/CISO-manage-system-user";
import CISOActivityLogs from "./pages/CISO/CISO-activity-logs";
import CISONotification from "./pages/CISO/CISO-notification";

import HRODashboard from "./pages/HRO/HRO-dashboard";
import HROAction from "./pages/HRO/HRO-action";
import HRORequirementList from "./pages/HRO/HRO-requirement-list";
import HROExportArchiveClearance from "./pages/HRO/HRO-export-archive-clearance";
import HRONotification from "./pages/HRO/HRO-notification";
import HROAssistantList from "./pages/HRO/HRO-assistant-list";
import HROActivityLogs from "./pages/HRO/HRO-activity-logs";

import DualRoleAction from "./pages/dual-role/dual-role-action";
import DualRoleClearance from "./pages/dual-role/dual-role-clearance";
import DualRoleApproverAssistantList from "./pages/dual-role/dual-role-approver-assistant-list";
import DualRoleAnnouncements from "./pages/dual-role/dual-role-announcement";
import DualRoleNotification from "./pages/dual-role/dual-role-notification";
import DualRoleRequirementList from "./pages/dual-role/dual-role-requirement-list";
import DualRoleFacultyDashboard from "./pages/dual-role/dual-faculty-member-dashboard";
import DualRoleApproverDashboard from "./pages/dual-role/dual-approver-dashboard";
import DualRoleActivityLogs from "./pages/dual-role/dual-role-activity-logs";

import SystemAdminDashboard from "./pages/system-admin/system-admin-dashboard";
import SystemGuideline from "./pages/system-admin/system-guideline";
import Announcements from "./pages/system-admin/announcement";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/login-prompt" element={<LoginPrompt />} />

        { <Route path="/faculty-dashboard" element={<Facultydashboard />} />}
        { <Route path="/faculty-notification" element={<FacultyNotification />} />}

        { <Route path="/approver-dashboard" element={<Approverdashboard />} />}
        { <Route path="/approver-requirement-list" element={<ApproverRequirementList />} />}
        <Route path="/clearance" element={<ApproverClearance />} />
        { <Route path="/approver-clearance" element={<ApproverClearance />} />}
        { <Route path="/approver-action" element={<ApproverAction />} />}
        { <Route path="/approver-assistant-list" element={<ApproverAssistantList />} />}
        { <Route path="/approver-activity-logs" element={<ApproverActivityLogs />} />}
        { <Route path="/approver-notification" element={<ApproverNotification />} />}

        { <Route path="/assistant-approver-dashboard" element={<AssistantApproverDashboard />} />}
        { <Route path="/assistant-approver-requirement-list" element={<AssistantApproverRequirementList />} />}
        { <Route path="/assistant-approver-clearance" element={<AssistantApproverClearance />} />}
        { <Route path="/assistant-approver-notification" element={<AssistantApproverNotification />} />}

        { <Route path="/dual-role-action" element={<DualRoleAction />} />}
        { <Route path="/dual-role-clearance" element={<DualRoleClearance />} />}
        { <Route path="/dual-role-approver-assistant-list" element={<DualRoleApproverAssistantList />} />}
        { <Route path="/dual-role-announcement" element={<DualRoleAnnouncements />} />}
        { <Route path="/dual-role-notification" element={<DualRoleNotification />} />}
        { <Route path="/dual-role-requirement-list" element={<DualRoleRequirementList />} />}
        { <Route path="/dual-role-faculty-member-dashboard" element={<DualRoleFacultyDashboard />} />}
        { <Route path="/dual-role-approver-dashboard" element={<DualRoleApproverDashboard />} />}
        {<Route path="/dual-role-activity-logs" element={<DualRoleActivityLogs />} />}

        { <Route path="/HRO-dashboard" element={<HRODashboard />} />}
        { <Route path="/HRO-action" element={<HROAction />} />}
        { <Route path="/HRO-requirement-list" element={<HRORequirementList />} />}
        { <Route path="/HRO-export-archive-clearance" element={<HROExportArchiveClearance />} />}
        { <Route path="/HRO-notification" element={<HRONotification />} />}
        { <Route path="/HRO-assistant-list" element={<HROAssistantList />} />}
        {<Route path="/HRO-activity-logs" element={<HROActivityLogs />} />}

        { <Route path="/OVPHE-dashboard" element={<OVPHEDashboard />} />} 
        { <Route path="/OVPHE-tools" element={<OVPHETools />} />}
        { <Route path="/OVPHE-clearance-timeline" element={<OVPHEClearanceTimeline />} />}
        { <Route path="/OVPHE-college-office-configuration" element={<OVPHECollegeOfficeConfiguration />} />}
        { <Route path="/OVPHE-system-analytics" element={<OVPHESystemAnalytics />} />}
        { <Route path="/OVPHE-system-guideline" element={<OVPHESystemGuideline />} />}
        { <Route path="/OVPHE-announcement" element={<OVPHEAnnouncements />} />}
        { <Route path="/OVPHE-announcements" element={<OVPHEAnnouncements />} />}
        { <Route path="/OVPHE-notification" element={<OVPHENotification />} />}
        {<Route path="/OVPHE-activity-logs" element={<OVPHEActivityLogs />} />}

        { <Route path="/CISO-dashboard" element={<CISODashboard />} />}
        { <Route path="/CISO-tools" element={<CISOTools />} />}
        { <Route path="/CISO-system-guideline" element={<CISOSystemGuideline />} />}
        { <Route path="/CISO-announcement" element={<CISOAnnouncements />} />}
        { <Route path="/CISO-faculty-data-dump" element={<CISOFacultyDataDump />} />}
        { <Route path="/CISO-manage-system-user" element={<CISOManageSystemUser />} />}
        { <Route path="/CISO-notification" element={<CISONotification />} />}
        {<Route path="/CISO-activity-logs" element={<CISOActivityLogs />} />}

        { <Route path="/system-admin-dashboard" element={<SystemAdminDashboard />} />}
        { <Route path="/system-guideline" element={<SystemGuideline />} />}
        { <Route path="/announcement" element={<Announcements />} />}

        <Route path="*" element={<Login />} /> {/* fallback route */}
      </Routes>
    </Router>
  );
}

export default App;

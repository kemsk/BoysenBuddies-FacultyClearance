import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/login/login";
import Otp from "./pages/login/otp";
import LoginPrompt from "./pages/login/login-prompt";

import Facultydashboard from "./pages/faculty/faculty-dashboard";
import FacultyNotification from "./pages/faculty/faculty-notification";
import FacultyArchiveClearance from "./pages/faculty/faculty-archived-clearance";
import FacultyViewClearance from "./pages/faculty/faculty-view-clearance";

import Approverdashboard from "./pages/approver/approver-dashboard";
import ApproverRequirementList from "./pages/approver/approver-requirement-list";
import ApproverClearance from "./pages/approver/approver-clearance";
import ApproverAction from "./pages/approver/approver-action";
import ApproverAssistantList from "./pages/approver/approver-assistant-list";
import ApproverActivityLogs from "./pages/approver/approver-activity-logs";
import ApproverNotification from "./pages/approver/approver-notification";
import ApproverAchivedClearance from "./pages/approver/approver-archived-clearance";
import ApproverViewClearance from "./pages/approver/approver-view-clearance";
import ApproverIndividualApproval from "./pages/approver/approver-individual-approval";



import AssistantApproverDashboard from "./pages/assistant-approver/assistant-approver-dashboard";
import AssistantApproverRequirementList from "./pages/assistant-approver/assistant-approver-requirement-list";
import AssistantApproverClearance from "./pages/assistant-approver/assistant-approver-clearance";
import AssistantApproverNotification from "./pages/assistant-approver/assistant-approver-notification";
import AssistantApproverAchivedClearance from "./pages/assistant-approver/assistant-approver-archived-clearance";
import AssitantApproverIndividualApproval from "./pages/assistant-approver/assistant-approver-individual-approval";
import AssistantApproverViewClearance from "./pages/assistant-approver/assistant-approver-view-clearance";

import OVPHEDashboard from "./pages/OVPHE/OVPHE-dashboard";
import OVPHETools from "./pages/OVPHE/OVPHE-tools";
import OVPHESystemAnalytics from "./pages/OVPHE/OVPHE-system-analytics";
import OVPHESystemGuideline from "./pages/OVPHE/OVPHE-system-guideline";
import OVPHEAnnouncements from "./pages/OVPHE/OVPHE-announcement";
import OVPHENotification from "./pages/OVPHE/OVPHE-notification";
import OVPHEActivityLogs from "./pages/OVPHE/OVPHE-activity-logs";
import OVPHEArchiveClearance from "./pages/OVPHE/OVPHE-archived-clearance";
import OVPHEViewClearance from "./pages/OVPHE/OVPHE-view-clearance";


import CISODashboard from "./pages/CISO/CISO-dashboard";
import CISOTools from "./pages/CISO/CISO-tools";
import CISOSystemGuideline from "./pages/CISO/CISO-system-guideline";
import CISOAnnouncements from "./pages/CISO/CISO-announcement";
import CISOFacultyDataDump from "./pages/CISO/CISO-faculty-data-dump";
import CISOManageSystemUser from "./pages/CISO/CISO-manage-system-user";
import CISOActivityLogs from "./pages/CISO/CISO-activity-logs";
import CISONotification from "./pages/CISO/CISO-notification";
import CISOCollegeOfficeConfiguration from "./pages/CISO/CISO-college-office-configuration";
import CISOClearanceTimeline from "./pages/CISO/CISO-clearance-timeline";
import CISOViewClearance from "./pages/CISO/CISO-view-clearance";
import CISOArchivedClearance from "./pages/CISO/CISO-archived-clearance";
import CISOArchivedFaculty from "./pages/CISO/CISO-archived-faculty";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/login-prompt" element={<LoginPrompt />} />

        { <Route path="/faculty-dashboard" element={<Facultydashboard />} />}
        { <Route path="/faculty-notification" element={<FacultyNotification />} />}
        { <Route path="/faculty-archive-clearance" element={<FacultyArchiveClearance />} />}
        { <Route path="/faculty-view-clearance" element={<FacultyViewClearance />} />}
        


        { <Route path="/approver-dashboard" element={<Approverdashboard />} />}
        { <Route path="/approver-requirement-list" element={<ApproverRequirementList />} />}
        { <Route path="/approver-individual" element={<ApproverIndividualApproval />} />}
        { <Route path="/approver-clearance" element={<ApproverClearance />} />}
        { <Route path="/approver-action" element={<ApproverAction />} />}
        { <Route path="/approver-assistant-list" element={<ApproverAssistantList />} />}
        { <Route path="/approver-activity-logs" element={<ApproverActivityLogs />} />}
        { <Route path="/approver-notification" element={<ApproverNotification />} />}
        { <Route path="/approver-archived-clearance" element={<ApproverAchivedClearance />} />}
        { <Route path="/approver-view-clearance" element={<ApproverViewClearance />} />}
        
        { <Route path="/assistant-approver-dashboard" element={<AssistantApproverDashboard />} />}
        { <Route path="/assistant-approver-requirement-list" element={<AssistantApproverRequirementList />} />}
        { <Route path="/assistant-approver-clearance" element={<AssistantApproverClearance />} />}
        { <Route path="/assistant-approver-notification" element={<AssistantApproverNotification />} />}
        { <Route path="/assistant-approver-archived-clearance" element={<AssistantApproverAchivedClearance />} />}
        { <Route path="/assistant-approver-individual-clearance" element={<AssitantApproverIndividualApproval />} />}
        { <Route path="/assistant-approver-view-clearance" element={<AssistantApproverViewClearance/>} />}        



        { <Route path="/OVPHE-dashboard" element={<OVPHEDashboard />} />} 
        { <Route path="/OVPHE-tools" element={<OVPHETools />} />}
        { <Route path="/OVPHE-system-analytics" element={<OVPHESystemAnalytics />} />}
        { <Route path="/OVPHE-system-guideline" element={<OVPHESystemGuideline />} />}
        { <Route path="/OVPHE-announcements" element={<OVPHEAnnouncements />} />}
        { <Route path="/OVPHE-notification" element={<OVPHENotification />} />}
        {<Route path="/OVPHE-activity-logs" element={<OVPHEActivityLogs />} />}
        {<Route path="/OVPHE-archived-clearance" element={<OVPHEArchiveClearance />} />}
        {<Route path="/OVPHE-view-clearance" element={<OVPHEViewClearance />} />}

        { <Route path="/CISO-dashboard" element={<CISODashboard />} />}
        { <Route path="/CISO-tools" element={<CISOTools />} />}
        { <Route path="/CISO-system-guideline" element={<CISOSystemGuideline />} />}
        { <Route path="/CISO-announcement" element={<CISOAnnouncements />} />}
        { <Route path="/CISO-faculty-data-dump" element={<CISOFacultyDataDump />} />}
        { <Route path="/CISO-manage-system-user" element={<CISOManageSystemUser />} />}
        { <Route path="/CISO-notification" element={<CISONotification />} />}
        {<Route path="/CISO-activity-logs" element={<CISOActivityLogs />} />}
        { <Route path="/CISO-college-office-configuration" element={<CISOCollegeOfficeConfiguration />} />}
        { <Route path="/CISO-clearance-timeline" element={<CISOClearanceTimeline />} />}
        {<Route path="/CISO-archived-clearance" element={<CISOArchivedClearance />} />}
        {<Route path="/CISO-view-clearance" element={<CISOViewClearance />} />}
        {<Route path="/CISO-archived-faculty" element={<CISOArchivedFaculty />} />}

        <Route path="*" element={<Login />} /> {/* fallback route */}
      </Routes>
    </Router>
  );
}

export default App;

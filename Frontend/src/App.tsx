import { useEffect, useState, type ReactElement } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";


import Login from "./pages/login/login";
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
import ApproverArchivedIndividualApproval from "./pages/approver/approver-archived-individual";



import AssistantApproverDashboard from "./pages/assistant-approver/assistant-approver-dashboard";
import AssistantApproverRequirementList from "./pages/assistant-approver/assistant-approver-requirement-list";
import AssistantApproverClearance from "./pages/assistant-approver/assistant-approver-clearance";
import AssistantApproverNotification from "./pages/assistant-approver/assistant-approver-notification";
import AssistantApproverAchivedClearance from "./pages/assistant-approver/assistant-approver-archived-clearance";
import AssitantApproverIndividualApproval from "./pages/assistant-approver/assistant-approver-individual-approval";
import AssistantApproverViewClearance from "./pages/assistant-approver/assistant-approver-view-clearance";
import AssistantApproverArchivedIndividualApproval from "./pages/assistant-approver/assistant-approver-archived-individual";

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

function ProtectedRoute({ children }: { children: ReactElement }) {
  const [status, setStatus] = useState<"checking" | "authed" | "unauthed">(
    "checking"
  );
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/admin/xu-faculty-clearance/api/me", {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (cancelled) return;
        setStatus(res.ok ? "authed" : "unauthed");
      } catch {
        if (cancelled) return;
        setStatus("unauthed");
      }
    };

    setStatus("checking");
    check();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (status === "checking") return null;
  if (status === "unauthed") {
    return <Navigate to="/" replace />;
  }
  return children;
}

function HeartbeatManager() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const shouldHeartbeat = pathname !== "/" && pathname !== "/login-prompt";
    if (!shouldHeartbeat) return;

    let lastHeartbeat = 0;
    let lastActivityTime = Date.now();
    const HEARTBEAT_THROTTLE = 30000;
    const IDLE_CHECK_INTERVAL = 10000;
    const IDLE_TIMEOUT = 900000;

    let cancelled = false;
    let timedOut = false;
    let idleCheckInterval: number | undefined;

    const sendHeartbeat = async (reason: string) => {
      const now = Date.now();
      if (now - lastHeartbeat < HEARTBEAT_THROTTLE) {
        console.log("HEARTBEAT(UI): throttled", { path: pathname, reason });
        return;
      }

      lastHeartbeat = now;
      lastActivityTime = now;
      console.log("HEARTBEAT(UI): sending", { path: pathname, reason });

      try {
        const res = await fetch(
          "/admin/xu-faculty-clearance/api/auth/heartbeat",
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (res.status === 401) {
          console.log("HEARTBEAT(UI): unauthorized -> redirect", { path: pathname });
          window.location.href = "/";
          return;
        }

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        console.log("HEARTBEAT(UI): ok", {
          path: pathname,
          status: res.status,
          authenticated: data?.authenticated,
          server_time: data?.server_time,
          last_seen: data?.last_seen,
        });
      } catch (error) {
        console.log("HEARTBEAT(UI): error", { path: pathname, error: String(error) });
      }
    };

    const checkIdleTimeout = () => {
      const now = Date.now();
      const idleTime = now - lastActivityTime;

      if (timedOut) return;

      console.log("HEARTBEAT(UI): idle_check", {
        path: pathname,
        idle_seconds: Math.round(idleTime / 1000),
      });

      if (idleTime > IDLE_TIMEOUT) {
        timedOut = true;
        console.log("HEARTBEAT(UI): idle_timeout -> logging out", { path: pathname });

        fetch("/admin/xu-faculty-clearance/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        })
          .catch(() => {})
          .finally(() => {
            window.location.href = "/";
          });
      }
    };

    const activityEvents = ["mousedown", "keypress", "scroll", "click", "touchstart"];
    const handleActivity = (event: Event) => {
      if (cancelled) return;
      lastActivityTime = Date.now();
      sendHeartbeat((event as any).type || "activity");
    };

    activityEvents.forEach((eventName) => {
      document.addEventListener(eventName, handleActivity, { passive: true } as any);
    });

    idleCheckInterval = window.setInterval(checkIdleTimeout, IDLE_CHECK_INTERVAL);

    sendHeartbeat("initial");

    return () => {
      cancelled = true;
      activityEvents.forEach((eventName) => {
        document.removeEventListener(eventName, handleActivity);
      });
      if (idleCheckInterval) {
        window.clearInterval(idleCheckInterval);
      }
    };
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <HeartbeatManager />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login-prompt" element={<LoginPrompt />} />

        {
          <Route
            path="/faculty-dashboard"
            element={
              <ProtectedRoute>
                <Facultydashboard />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/faculty-notification"
            element={
              <ProtectedRoute>
                <FacultyNotification />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/faculty-archive-clearance"
            element={
              <ProtectedRoute>
                <FacultyArchiveClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/faculty-view-clearance"
            element={
              <ProtectedRoute>
                <FacultyViewClearance />
              </ProtectedRoute>
            }
          />
        }


        {
          <Route
            path="/approver-dashboard"
            element={
              <ProtectedRoute>
                <Approverdashboard />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-requirement-list"
            element={
              <ProtectedRoute>
                <ApproverRequirementList />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-individual"
            element={
              <ProtectedRoute>
                <ApproverIndividualApproval />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-clearance"
            element={
              <ProtectedRoute>
                <ApproverClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-action"
            element={
              <ProtectedRoute>
                <ApproverAction />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-assistant-list"
            element={
              <ProtectedRoute>
                <ApproverAssistantList />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-activity-logs"
            element={
              <ProtectedRoute>
                <ApproverActivityLogs />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-notification"
            element={
              <ProtectedRoute>
                <ApproverNotification />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-archived-clearance"
            element={
              <ProtectedRoute>
                <ApproverAchivedClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-view-clearance"
            element={
              <ProtectedRoute>
                <ApproverViewClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/approver-archived-individual"
            element={
              <ProtectedRoute>
                <ApproverArchivedIndividualApproval />
              </ProtectedRoute>
            }
          />
        }
        
        {
          <Route
            path="/assistant-approver-dashboard"
            element={
              <ProtectedRoute>
                <AssistantApproverDashboard />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/assistant-approver-requirement-list"
            element={
              <ProtectedRoute>
                <AssistantApproverRequirementList />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/assistant-approver-clearance"
            element={
              <ProtectedRoute>
                <AssistantApproverClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/assistant-approver-notification"
            element={
              <ProtectedRoute>
                <AssistantApproverNotification />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/assistant-approver-archived-clearance"
            element={
              <ProtectedRoute>
                <AssistantApproverAchivedClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/assistant-approver-individual-clearance"
            element={
              <ProtectedRoute>
                <AssitantApproverIndividualApproval />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/assistant-approver-view-clearance"
            element={
              <ProtectedRoute>
                <AssistantApproverViewClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/assistant-approver-archived-individual"
            element={
              <ProtectedRoute>
                <AssistantApproverArchivedIndividualApproval />
              </ProtectedRoute>
            }
          />
        }



        {
          <Route
            path="/OVPHE-dashboard"
            element={
              <ProtectedRoute>
                <OVPHEDashboard />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/OVPHE-tools"
            element={
              <ProtectedRoute>
                <OVPHETools />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/OVPHE-system-analytics"
            element={
              <ProtectedRoute>
                <OVPHESystemAnalytics />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/OVPHE-system-guideline"
            element={
              <ProtectedRoute>
                <OVPHESystemGuideline />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/OVPHE-announcements"
            element={
              <ProtectedRoute>
                <OVPHEAnnouncements />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/OVPHE-notification"
            element={
              <ProtectedRoute>
                <OVPHENotification />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/OVPHE-activity-logs"
            element={
              <ProtectedRoute>
                <OVPHEActivityLogs />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/OVPHE-archived-clearance"
            element={
              <ProtectedRoute>
                <OVPHEArchiveClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/OVPHE-view-clearance"
            element={
              <ProtectedRoute>
                <OVPHEViewClearance />
              </ProtectedRoute>
            }
          />
        }

        {
          <Route
            path="/CISO-dashboard"
            element={
              <ProtectedRoute>
                <CISODashboard />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-tools"
            element={
              <ProtectedRoute>
                <CISOTools />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-system-guideline"
            element={
              <ProtectedRoute>
                <CISOSystemGuideline />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-announcement"
            element={
              <ProtectedRoute>
                <CISOAnnouncements />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-faculty-data-dump"
            element={
              <ProtectedRoute>
                <CISOFacultyDataDump />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-manage-system-user"
            element={
              <ProtectedRoute>
                <CISOManageSystemUser />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-notification"
            element={
              <ProtectedRoute>
                <CISONotification />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-activity-logs"
            element={
              <ProtectedRoute>
                <CISOActivityLogs />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-college-office-configuration"
            element={
              <ProtectedRoute>
                <CISOCollegeOfficeConfiguration />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-clearance-timeline"
            element={
              <ProtectedRoute>
                <CISOClearanceTimeline />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-archived-clearance"
            element={
              <ProtectedRoute>
                <CISOArchivedClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-view-clearance"
            element={
              <ProtectedRoute>
                <CISOViewClearance />
              </ProtectedRoute>
            }
          />
        }
        {
          <Route
            path="/CISO-archived-faculty"
            element={
              <ProtectedRoute>
                <CISOArchivedFaculty />
              </ProtectedRoute>
            }
          />
        }

        <Route path="*" element={<Login />} /> {/* fallback route */}
      </Routes>
    </Router>
  );
}

export default App;

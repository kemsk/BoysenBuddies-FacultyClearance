import * as React from "react";
import "../../index.css"; 
import { DualRoleHeader } from "../../stories/components/header";

import {
  AnnouncementsCard,
  type AnnouncementItem,
  WelcomeAcademicCard,
  ApproverWelcomeMetrics,
} from "../../stories/components/cards";
import { ActionNavCard } from "../../stories/components/cards";

export default function DualRoleApproverDashboard() {
  const [timeline, setTimeline] = React.useState<{ academicYear: string; semester: string } | null>(null);
  const pendingClearance = 0;
  const totalClearanceRequests = 1;
  const approverOffice = "College of Computer Studies";

  const [profile, setProfile] = React.useState<{
    email: string;
    university_id: string;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    role_value: number | null;
  } | null>(null);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/me")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, []);

  const displayName = React.useMemo(() => {
    if (!profile) return "";
    const parts = [profile.first_name, profile.middle_name, profile.last_name]
      .map((p) => (p ?? "").trim())
      .filter(Boolean);
    return parts.length ? parts.join(" ") : profile.email;
  }, [profile]);

  const roleLabel = React.useMemo(() => {
    if (profile?.role_value === 2) return "CISO";
    if (profile?.role_value === 3) return "OVPHE";
    if (profile?.role_value === 1) return "HRO";
    if (profile?.role_value === 4) return "APPROVER";
    if (profile?.role_value === 5) return "ASSISTANT_APPROVER";
    if (profile?.role_value === 6) return "FACULTY";
    if (profile?.role_value === 7) return "DUAL_ROLE";
    return "";
  }, [profile]);
  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/active-clearance-timeline")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setTimeline(data))
      .catch(() => setTimeline(null));
  }, []);

  const requirementItems: RequirementListItem[] = [
    {
      title: "Reporting of Borrowed Books",
      description:
        "All faculty members who borrowed books are expected to report the status on said books",
      physicalSubmission: true,
      submissionDeadline: "December 3, 2025, 9:30 AM",
    },
  ];
   type AnnouncementsResponse = { items: AnnouncementItem[] };

  const [announcementItems, setAnnouncementItems] = React.useState<AnnouncementItem[]>([]);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/ovphe/announcements")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: AnnouncementsResponse) => {
        const active = (data.items ?? []).filter((item) => item.enabled !== false);
        setAnnouncementItems(active);
      })
      .catch(() => setAnnouncementItems([]));
  }, []);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <DualRoleHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3">
        <WelcomeAcademicCard
          name={displayName}
          topLeft={{ label: "Academic Year", value: timeline?.academicYear || "" }}
          topRight={{ label: "Semester", value: timeline?.semester || "" }}
          rows={[
            { label: "Approver Office", value: approverOffice },
          ]}
        />

        <ApproverWelcomeMetrics
          pendingClearance={pendingClearance}
          totalClearanceRequests={totalClearanceRequests}
        />
  
        <AnnouncementsCard 
          items={announcementItems}
          showHeaderChevron={false}
        />

        <ActionNavCard
            icon={<img src="PrimaryClipboardIcon.png" alt="Requirement List" className="h-9 w-9" />}
            title="Requirement List"
            description="View or edit the list of requirements for your Department or Office"
            to="/dual-role-requirement-list"
          />

          <ActionNavCard
            icon={<img src="PrimarySendIcon.png" alt="Clearance Requests" className="h-9 w-9" />}
            title="Clearance Requests"
            description="View all clearance requests for your Department or Office"
            to="/dual-role-clearance"
          />

        <ActionNavCard
            icon={<img src="PrimaryClockIcon.png" alt="Actions" className="h-9 w-9" />}
            title="Actions"
            description="View Approver Assistants or Check Activity Logs"
            to="/dual-role-action"
          />


      </main>

    </div>
  );
}

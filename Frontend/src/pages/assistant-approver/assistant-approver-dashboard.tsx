import React from "react";
import "../../index.css"; 
import { AssistantApproverHeader } from "../../stories/components/header";

import {
  AnnouncementsCard,
  type AnnouncementItem,
  WelcomeAcademicCard,
  ApproverWelcomeMetrics,
  RequirementsListCard,
  type RequirementListItem,
} from "../../stories/components/cards";

export default function AssistantApproverDashboard() {
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

  const announcementItems: AnnouncementItem[] = [
    {
      pinned: true,
      title: "System Maintenance Notice",
      description:
        "The faculty clearance portal will be unavailable this Saturday from 8:00 AM to 12:00 NN for scheduled maintenance",
      timestamp: "December 1, 2025, 12:00 PM",
    },
  ];

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <AssistantApproverHeader />
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
        

          <RequirementsListCard
            items={requirementItems}
            headerActionHref="/assistant-approver-requirement-list"
            headerActionImgSrc="/_WhiteArrowIcon.png"
            headerActionImgAlt="Open Requirements"
          />
  


          <AnnouncementsCard 
            items={announcementItems}
            showHeaderChevron={false}
          />



      </main>

    </div>
  );
}

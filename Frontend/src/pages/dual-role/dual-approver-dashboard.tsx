import "../../index.css"; 
import { DualRoleHeader } from "../../stories/components/header";

import {
  AnnouncementsCard,
  type AnnouncementItem,
  WelcomeAcademicCard,
  ApproverWelcomeMetrics,
  RequirementsListCard,
  type RequirementListItem,
} from "../../stories/components/cards";
import { ActionNavCard } from "../../stories/components/cards";

export default function DualRoleApproverDashboard() {
  const pendingClearance = 0;
  const totalClearanceRequests = 1;
  const approverOffice = "College of Computer Studies";

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
        <DualRoleHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3">
        <WelcomeAcademicCard
          name="John Doe"
          topLeft={{ label: "Academic Year", value: "2025–2026" }}
          topRight={{ label: "Semester", value: "1" }}
          rows={[{ label: "Approver Office", value: approverOffice }]}
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
            to="/clearance-requests"
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

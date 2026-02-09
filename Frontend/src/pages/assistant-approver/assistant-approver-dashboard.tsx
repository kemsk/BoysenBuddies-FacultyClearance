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
        <AssistantApproverHeader />
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

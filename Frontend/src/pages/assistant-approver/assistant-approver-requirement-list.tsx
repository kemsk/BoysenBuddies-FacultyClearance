import "../../index.css"; 
import { AssistantApproverHeader } from "../../stories/components/header";

import {
  AnnouncementsCard,
  type AnnouncementItem,
  WelcomeAcademicCard,
  ApproverWelcomeMetrics,
  RequirementsListCard,
  type RequirementListItem,
  RequirementEditCard,
  RequirementListCard,
} from "../../stories/components/cards";

import { AddRequirementDialog } from "../../stories/components/add-requirement-dialog";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../stories/components/button";

export default function AssistantApproverRequirementList() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <AssistantApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Requirement List</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/assistant-approver-dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Requirement List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
       
        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/assistant-approver-dashboard")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>
       
       <div className="mt-2 space-y-3">

        <RequirementListCard
            title="Reporting of Borrowed Books"
            description="All faculty members who borrowed books are expected to report the status on said books"
            physicalSubmission 
            submissionDeadline="December 3, 2025, 9:30 AM"
            onEdit={() => {}}
            onDelete={() => {}}
        />

        <RequirementListCard
            title="Reporting of Borrowed Books"
            description="All faculty members who borrowed books are expected to report the status on said books"
            physicalSubmission={false}
            submissionDeadline="December 3, 2025, 9:30 AM"
        />
       </div>

      </main>

    </div>
  );
}

import "../../index.css"; 
import { ApprovalHeader } from "../../stories/components/header";
import * as React from "react";

import {
  RequirementEditCard,
  AgreementCard,
  TrueAgreementCard,
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
import { SuccessMessageCard } from "../../stories/components/status-message-card";

export default function RequirementList() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showTrueAgreement, setShowTrueAgreement] = React.useState(false);

  const postApproverActivityLog = React.useCallback(
    async (event_type: string, details: string[] = []) => {
      try {
        await fetch("/admin/xu-faculty-clearance/api/approver/activity-logs", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ event_type, details }),
        });
      } catch {
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <ApprovalHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Requirement List</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/approver-dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Requirement List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/approver-action")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>
       
       <div className="mt-2 space-y-3">
        <AddRequirementDialog
          trigger={
            <Button variant="default" className="w-full h-12">
              <div className="flex w-full items-center justify-center gap-2">
              <img src="WhitePlusIcon.png" alt="Add Requirement" />Add Requirement
              </div>
            </Button>
          }
          onSave={(payload) => {
            void postApproverActivityLog("created_requirements", [payload.title]);
          }}
        />
        <RequirementEditCard
            title="Reporting of Borrowed Books"
            description="All faculty members who borrowed books are expected to report the status on said books"  
            submissionDeadline="November 8, 2024, 4:38 PM"
            Recipients="CCS, CONUS, SOE"
            LastUpdated="November 8, 2024, 4:38 PM"
            CreatedBy="Jose Rizal"
            ClearanceTimeline="2501 Faculty Clearance"
            physicalSubmission={true}
            onEdit={(payload) => {
              void postApproverActivityLog("edited_requirement", [payload?.title || "Reporting of Borrowed Books"]);
            }}
            onDelete={() => {
              void postApproverActivityLog("deleted_requirements", ["Reporting of Borrowed Books"]);
            }}
        />

        <RequirementEditCard
            title="Reporting of Borrowed Books"
            description="All faculty members who borrowed books are expected to report the status on said books"
            Recipients=""
            LastUpdated=""
            CreatedBy=""
            ClearanceTimeline=""
            physicalSubmission={false}
            submissionDeadline="December 3, 2025, 9:30 AM"
            onEdit={(payload) => {
              void postApproverActivityLog("edited_requirement", [payload?.title || "Reporting of Borrowed Books"]);
            }}
            onDelete={() => {
              void postApproverActivityLog("deleted_requirements", ["Reporting of Borrowed Books"]);
            }}
        />

        {showTrueAgreement ? (
          <TrueAgreementCard
            onConfirm={() => {
              setShowTrueAgreement(false);
            }}
          />
        ) : showSuccess ? (
          <div className="flex justify-center">
            <SuccessMessageCard
              className="max-w"
              message="Agreement confirmed."
              onContinue={() => {
                setShowSuccess(false);
                setShowTrueAgreement(true);
              }}
            />
          </div>
        ) : (
          <AgreementCard onConfirm={() => setShowSuccess(true)} />
        )}
       </div>
      </main>
    </div>
  );
}

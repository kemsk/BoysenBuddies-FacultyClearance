import "../../index.css"; 
import { AssistantApproverHeader } from "../../stories/components/header";
import { RequestCard } from "../../stories/components/cards";
 
import { RequirementApprovalCard } from "../../stories/components/cards";

import { Button } from "../../stories/components/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";

import { Link, useNavigate } from "react-router-dom";



export default function AssistantApproverArchivedIndividualApproval() {
  
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <AssistantApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">

        <div className="mt-3 space-y-4">

       <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/assistant-approver-archived-clearance">View Archived Clearance</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/assistant-approver-view-clearance">2501 Faculty Clearance</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>            
            <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>Alexander H. Hamilton</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-1">
            
        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/assistant-approver-view-clearance")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>          
        </div>
       
        <div className="mt-2 gap-3">
          <RequestCard
            requestId="REQ-2025-001"
            name="Alexander H. Hamilton"
            status="pending"
            onApprove={() => console.log("Approved")}
            onReject={() => console.log("Rejected")}
            onViewDetails={() => console.log("View details")}
            />
          
          <div className="mt-5">
          <RequirementApprovalCard
            requirementName="Library Clearance"
            submissionNotes="Submit library clearance form with signature"
            onApprove={() => console.log("Approved")}
            onReject={() => console.log("Rejected")}
          />  
          </div>
        </div>
    </div>
      </main>

    </div>
  );
}

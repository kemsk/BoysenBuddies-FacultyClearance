import * as React from "react";
import "../../index.css"; 
import { ApprovalHeader } from "../../stories/components/header";
import { RequestCard } from "../../stories/components/cards";
 
import {
  type ClearanceRequestItem,
} from "../../stories/components/cards";

import { RequirementApprovalCard } from "../../stories/components/cards";

import { Button } from "../../stories/components/button";
import { useNavigate } from "react-router-dom";




export default function ApproverIndividualApproval() {
  
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");

  const [requests, setRequests] = React.useState<ClearanceRequestItem[]>([]);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/clearance-requests")
      .then((res) => res.json())
      .then((data) => setRequests(Array.isArray(data?.items) ? data.items : []))
      .catch(() => {
        // Set dummy data when API fails
        setRequests([
          {
            id: "1",
            requestId: "REQ-2025-001",
            employeeId: "2005123456789",
            name: "Alexander H. Hamilton",
            college: "College of Computer Studies",
            department: "Information Technology",
            facultyType: "Full-time Faculty (On Probation)",
            status: "pending"
          },
          {
            id: "2", 
            requestId: "REQ-2025-002",
            employeeId: "2005987654321",
            name: "Maria C. Santos",
            college: "College of Engineering",
            department: "Civil Engineering",
            facultyType: "Full-time Faculty",
            status: "approved"
          },
          {
            id: "3",
            requestId: "REQ-2025-003", 
            employeeId: "2005456789012",
            name: "Juan D. Reyes",
            college: "College of Business Administration",
            department: "Accountancy",
            facultyType: "Part-time Faculty",
            status: "rejected"
          },
          {
            id: "4",
            requestId: "REQ-2025-004",
            employeeId: "2005234567890", 
            name: "Patricia L. Garcia",
            college: "College of Education",
            department: "Elementary Education",
            facultyType: "Full-time Faculty (Tenured)",
            status: "pending"
          },
          {
            id: "5",
            requestId: "REQ-2025-005",
            employeeId: "2005789012345",
            name: "Roberto K. Tan",
            college: "College of Computer Studies", 
            department: "Computer Science",
            facultyType: "Full-time Faculty (On Probation)",
            status: "approved"
          }
        ]);
      });
  }, []);

  const filteredRequests = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const hay = [r.requestId, r.employeeId, r.name, r.college, r.department, r.facultyType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, requests]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <ApprovalHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/approver-action")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
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
      

        

      </main>

    </div>
  );
}

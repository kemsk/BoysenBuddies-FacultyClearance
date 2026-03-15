import * as React from "react";
import "../../index.css"; 
import { ApprovalHeader } from "../../stories/components/header";

import {
  ClearanceRequestsCard,
  type ClearanceRequestItem,
} from "../../stories/components/cards";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

import { SearchInputGroup } from "../../stories/components/input-group";




export default function ApproverClearance() {
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
        
        <h1 className="text-2xl text-left text-primary font-bold">Clearance Requests</h1>

        <div className="mt-4 space-y-5">
          <div className="w-full max-w-[520px]">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
            />
          </div>

          <div className="flex flex-wrap items-left gap-3 overflow-x-auto ">
            <Select defaultValue="name">
              <SelectTrigger variant="pill" className="w-max gap-2">
                <span>Sort by :</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="employeeId">Employee ID</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="facultyType">Faculty Type</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="pending">
              <SelectTrigger variant="pill" className="w-max gap-2">
                <span>Status :</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        

        <div className="mt-6">
          <ClearanceRequestsCard
            items={filteredRequests}
            getItemHref={() => "/approver-individual"}
          />
        </div>

        

      </main>

    </div>
  );
}

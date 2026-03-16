import * as React from "react";

import "../../index.css"; 
import { ApprovalHeader } from "../../stories/components/header";

import {
  ClearanceRequestsCard,
  type ClearanceRequestItem,
} from "../../stories/components/cards";

import { Button } from "../../stories/components/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { SearchInputGroup } from "../../stories/components/input-group";
import { useState } from "react";

export default function ApproverViewClearance() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const [requests, setRequests] = React.useState<ClearanceRequestItem[]>([]);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/clearance-requests")
      .then((res) => res.json())
      .then((data) => setRequests(Array.isArray(data?.items) ? data.items : []))
      .catch(() => {
        setRequests([
          {
            id: "1",
            requestId: "REQ-2025-001",
            employeeId: "2005123456789",
            name: "Alexander H. Hamilton",
            college: "College of Computer Studies",
            department: "Information Technology",
            facultyType: "Full-time Faculty (On Probation)",
            status: "pending",
          },
          {
            id: "2",
            requestId: "REQ-2025-002",
            employeeId: "2005987654321",
            name: "Maria C. Santos",
            college: "College of Engineering",
            department: "Civil Engineering",
            facultyType: "Full-time Faculty",
            status: "approved",
          },
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
      <main className="dashboard p-4 mt-2 space-y-3">

        <h1 className="text-2xl text-left text-primary font-bold">2501 Faculty Clearance</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/Approver-action">Action</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/approver-archived-clearance">View Archived Clearance</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>2501 Faculty Clearance</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/approver-archived-clearance")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>

        <div className="mt-5 space-y-5">
          <div className="w-full mt-5">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
              placeholder="Search by name, ID, or email..."
            />
          </div>
        </div>

        <div className="mt-3 space-y-4">
          <div className="w-full flex flex-col sm:flex-row gap-3 justify-start mt-5" style={{ marginLeft: '0', paddingLeft: '0' }}>
              <div className="flex flex-wrap gap-3">
                <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <label>Sort by:</label>
                  <SelectValue/> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="requestId">Request ID</SelectItem>
                  <SelectItem value="universityId">University ID</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="facultyType">Faculty Type</SelectItem>
                </SelectContent>
              </Select>
            
              <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <label>Status:</label>
                  <SelectValue/> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
              </div>
          </div>

          <div className="flex justify-between gap-3 mt-4">
            <Button variant="default" className="w-full font-bold whitespace-nowrap" > 
              <div className="flex items-center justify-center gap-2">
                <img src="/WhiteDownloadIcon.png" alt="export" className="w-6 h-6" />
                <span>Export Current View</span>
              </div>  
            </Button>
          </div>
          
          <div className="mt-3">
            <div className="mt-6">
              <ClearanceRequestsCard
                items={filteredRequests}
                getItemHref={() => "/approver-archived-individual"}
              />
            </div>
          </div>
        </div>


      </main>

    </div>
  );
}

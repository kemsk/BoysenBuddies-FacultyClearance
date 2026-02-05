import * as React from "react";
import "../../index.css"; 
import { DualRoleHeader } from "../../stories/components/header";

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

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../stories/components/button";




export default function DualRoleClearance() {
  const [query, setQuery] = React.useState("");
  const navigate = useNavigate();

  const sampleRequests: ClearanceRequestItem[] = [
    {
      id: "2005123456789",
      requestId: "2005123456789",
      employeeId: "2005123456789",
      name: "Alexander H. Hamilton",
      college: "College of Computer Studies",
      department: "Information Technology",
      facultyType: "Full-time Faculty (On Probation)",
      status: "pending",
    },
    {
      id: "2000123456789",
      requestId: "2000123456789",
      employeeId: "2000123456789",
      name: "Elizabeth S. Schuyler",
      college: "College of Nursing",
      department: "N/A",
      facultyType: "Part Time Faculty",
      status: "rejected",
    },
    {
      id: "2003123456789",
      requestId: "2003123456789",
      employeeId: "2003123456789",
      name: "Aaron Burr Sir",
      college: "College of Arts and Sciences",
      department: "Political Science",
      facultyType: "Full-time Faculty",
      status: "approved",
    },
  ];

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <DualRoleHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Clearance Requests</h1>
        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dual-role-approver-dashboard">Approver Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Requirement List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-4 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/dual-role-approver-dashboard")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>

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
          <ClearanceRequestsCard items={sampleRequests} />
        </div>

        

      </main>

    </div>
  );
}

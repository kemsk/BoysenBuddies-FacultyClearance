import "../../index.css"; 
import { HROHeader } from "../../stories/components/header";


import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

import { Button } from "../../stories/components/button";
import {
  ExportArchiveClearanceCard,
  type ExportArchiveClearanceItem,
} from "../../stories/components/cards";

export default function ExportArchiveClearance() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const pageSize = 2;

  const items: ExportArchiveClearanceItem[] = [
    {
      id: "1",
      name: "Alexander H. Hamilton",
      requestId: "2526-001",
      universityId: "2005123456789",
      college: "College of Computer Studies",
      department: "Information Technology",
      facultyType: "Full-time Faculty (On Probation)",
      missingSignatures: "None",
      status: "complete",
    },
    {
      id: "2",
      name: "Elizabeth Schuyler",
      requestId: "2526-002",
      universityId: "2005123456790",
      college: "College of Computer Studies",
      department: "Information Technology",
      facultyType: "Full-time Faculty (On Probation)",
      missingSignatures: "Library, OPVHE",
      status: "incomplete",
    },
  ];

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(pageCount, Math.max(1, page));
  const pagedItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onPrevPage = () => setPage((p) => Math.max(1, p - 1));
  const onNextPage = () => setPage((p) => Math.min(pageCount, p + 1));

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <HROHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Export & Archive Clearance</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/CISCO-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Export & Archive Clearance</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/CISCO-tools")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>
       
       <div className="mt-4 space-y-3">
           
        
        <div className="flex flex-wrap items-start gap-3 mt-4">

            <Select onValueChange={(v) => console.log(v)}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="Term" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="SystemAdmin">S.Y. 2025-2026, Intersession</SelectItem>
                    <SelectItem value="Approver"> S.Y. 2025-2026, Second Semester</SelectItem>
                    <SelectItem value="AssistantApprover">
                    S.Y. 2025-2026, First Semester</SelectItem>
                </SelectContent>
            </Select>


            <Select defaultValue="AllClearances">
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="AllClearances">All Clearances</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Incomplete">Incomplete</SelectItem>
                </SelectContent>
            </Select>

            <Select defaultValue="name">
              <SelectTrigger variant="pill" className="w-max gap-2">
                <span>Sort by:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="SystemID">System ID</SelectItem>
                <SelectItem value="UniversityID">University ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-3">
            <ExportArchiveClearanceCard
              items={pagedItems}
              onExport={(selected: ExportArchiveClearanceItem[]) => {
                console.log("Export", selected);
              }}
            />
          </div>
       </div>

         <div className="flex items-center justify-center gap-3  px-4 py-3">
          <div className="text-sm text-muted-foreground">Page</div>

          <Button type="button" variant="icon" size="icon" className="h-9 w-9" onClick={onNextPage}>
            <img src="/BlackArrowIcon.png" alt="Next" className="h-5 w-5" />
          </Button>

          <div className="flex h-9 min-w-[44px] items-center justify-center rounded-md border border-muted-foreground/30 bg-background px-3 text-sm font-semibold text-foreground">
            {safePage}
          </div>

          <Button type="button" variant="icon" size="icon" className="h-9 w-9" onClick={onPrevPage}>
            <img src="/BlackArrowIcon.png" alt="Prev" className="h-5 w-5 rotate-180" />
          </Button>

          <div className="text-sm text-muted-foreground">of {pageCount}</div>

        </div>

      </main>

    </div>
  );
}

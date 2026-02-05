import * as React from "react";

import "../../index.css";
import { Link, useNavigate } from "react-router-dom";

import { OPVHEHeader } from "../../stories/components/header";
import {
  AnalyticsDonutCard,
  DepartmentCompletionRateCard,
  type DepartmentCompletionRateSection,
} from "../../stories/components/cards";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";
import { Button } from "../../stories/components/button";
import { Card, CardContent } from "../../stories/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

export default function SystemAnalytics() {
  const navigate = useNavigate();

  const [selectedTerm, setSelectedTerm] = React.useState("Term");
  const [selectedClearance, setSelectedClearance] = React.useState("All Clearances");
  const [selectedCollege, setSelectedCollege] = React.useState("College");

  const completionSections: DepartmentCompletionRateSection[] = [
    {
      title: "Department Chair",
      items: [
        { label: "Computer Science", completed: 0, total: 6 },
        { label: "Information Systems", completed: 2, total: 6 },
        { label: "Information Technology", completed: 6, total: 6 },
        { label: "Entertainment & Multimedia Computing", completed: 1, total: 6 },
      ],
    },
    {
      title: "Offices",
      items: [
        { label: "College Dean", completed: 0, total: 6 },
        { label: "University Registrar", completed: 0, total: 6 },
        { label: "University Library", completed: 4, total: 6 },
        { label: "OPVHE", completed: 1, total: 6 },
        { label: "HRO", completed: 3, total: 6 },
      ],
    },

  ];

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <OPVHEHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">System Analytics</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/OPVHE-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>System Analytics</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/OPVHE-tools")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>

        <div className="mt-2 space-y-3">
          <div className="flex flex-wrap items-left gap-3 overflow-x-auto mt-4">

            <Select  onValueChange={setSelectedClearance}>
              <SelectTrigger className="w-max" variant="pill">
                <SelectValue placeholder="School Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S.Y. 2025-2026">S.Y. 2025-2026</SelectItem>
                <SelectItem value="S.Y. 2024-2025">S.Y. 2024-2025</SelectItem>
                <SelectItem value="S.Y. 2023-2024">S.Y. 2023-2024</SelectItem>
                <SelectItem value="S.Y. 2022-2021">S.Y. 2022-2021</SelectItem>
              </SelectContent>
            </Select>

            <Select  onValueChange={setSelectedTerm}>
              <SelectTrigger  variant="pill" className="w-max">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="First Semester">First Semester</SelectItem>
                <SelectItem value="Second Semester">Second Semester</SelectItem>
                <SelectItem value="Intersession">Intersession</SelectItem>
              </SelectContent>
            </Select>

          
            <Select value={selectedCollege} onValueChange={setSelectedCollege}>
              <SelectTrigger className="w-max" variant="pill">
                <SelectValue placeholder="College" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="College">College</SelectItem>
                <SelectItem value="College of Computer Studies">College of Computer Studies</SelectItem>
                <SelectItem value="College of Agriculture">College of Agriculture</SelectItem>  
                <SelectItem value="College of Arts and Sciences">College of Arts and Sciences</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-5 mb-2 mt-2">
                <div className="text-primary">
                  <img src="/PrimaryExportIcon.png" alt="Export" className="h-9 w-10 object-contain ml-2 mt-2 " />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-primary">Export Analytics</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Export faculty clearance analytics for chosen College in .xlsx
                  </div>
                </div>

                <Button type="button" variant="icon" size="icon">
                  <img src="/PrimaryChevronIcon.png" alt="Arrow" className="h-10 w-10 object-contain ml-2 mt-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr]">
            <AnalyticsDonutCard title="College of Computer Studies" completed={17} total={24} />

            <DepartmentCompletionRateCard sections={completionSections} />
          </div>
        </div>

      </main>

    </div>
  );
}

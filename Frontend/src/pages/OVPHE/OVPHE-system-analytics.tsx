import * as React from "react";

import "../../index.css";
import { Link, useNavigate } from "react-router-dom";

import { OVPHEHeader } from "../../stories/components/header";
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

  const [colleges, setColleges] = React.useState<{ id: string; name: string }[]>([]);
  const [donutTitle, setDonutTitle] = React.useState("College");
  const [donutCompleted, setDonutCompleted] = React.useState(0);
  const [donutTotal, setDonutTotal] = React.useState(100);
  const [completionSections, setCompletionSections] = React.useState<DepartmentCompletionRateSection[]>([]);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/ovphe/org-structure")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { colleges: { id: string; name: string }[] }) => {
        setColleges(data.colleges ?? []);
      })
      .catch(() => setColleges([]));
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (selectedClearance && selectedClearance !== "All Clearances") {
      // selectedClearance is a label like "S.Y. 2025-2026"; backend expects academic_year int
      const m = selectedClearance.match(/(\d{4})/);
      if (m) params.set("academic_year", m[1]);
    }
    if (selectedTerm && selectedTerm !== "Term") {
      // backend expects FIRST/SECOND/INTERSESSION
      const map: Record<string, string> = {
        "First Semester": "FIRST",
        "Second Semester": "SECOND",
        Intersession: "INTERSESSION",
      };
      if (map[selectedTerm]) params.set("term", map[selectedTerm]);
    }
    if (selectedCollege && selectedCollege !== "College") {
      const found = colleges.find((c) => c.name === selectedCollege);
      if (found?.id) params.set("college_id", found.id);
    }

    fetch(`/admin/xu-faculty-clearance/api/ovphe/system-analytics?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (data: {
          rows: {
            collegeName: string;
            completionRate: number;
            completedCount?: number;
            incompleteCount?: number;
            totalCount?: number;
          }[];
        }) => {
        const rows = data.rows ?? [];
        if (rows.length) {
          const first = rows[0];
          setDonutTitle(first.collegeName || "College");
          setDonutCompleted(Math.max(0, Number(first.completedCount ?? 0)));
          setDonutTotal(Math.max(0, Number(first.totalCount ?? 0)));
        } else {
          setDonutTitle("College");
          setDonutCompleted(0);
          setDonutTotal(0);
        }

        setCompletionSections([
          {
            title: "Completion Rate",
            items: rows.map((r) => ({
              label: r.collegeName || "",
              completed: Math.max(0, Number(r.completedCount ?? 0)),
              total: Math.max(0, Number(r.totalCount ?? 0)),
            })),
          },
        ]);
      })
      .catch(() => {
        setDonutTitle("College");
        setDonutCompleted(0);
        setDonutTotal(0);
        setCompletionSections([]);
      });
  }, [selectedClearance, selectedTerm, selectedCollege, colleges]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <OVPHEHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">System Analytics</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/OVPHE-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>System Analytics</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/OVPHE-tools")}> 
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
                {colleges.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
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
            <AnalyticsDonutCard title={donutTitle} completed={donutCompleted} total={donutTotal} />

            <DepartmentCompletionRateCard sections={completionSections} />
          </div>
        </div>

      </main>

    </div>
  );
}

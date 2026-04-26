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
import { Badge } from "../../stories/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";
import { ClearanceDistributionCard, StatCard, StatCardWithActions, FacultyCompositionCard, OfficeBottlenecksCard, CollegeClearanceStatusCard } from "../../stories/components/system-analytics-cards";
import { ClearanceProgressDialog, type ClearanceProgressRow } from "../../stories/components/clearance-progress-dialog";

function postOVPHEActivityLog(payload: { event_type: string; details?: string[] }) {
  fetch("/admin/xu-faculty-clearance/api/ovphe/activity-logs", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export default function SystemAnalytics() {
  const navigate = useNavigate();

  const [clearanceProgressOpen, setClearanceProgressOpen] = React.useState(false);

  const clearanceProgressRows: ClearanceProgressRow[] = React.useMemo(
    () => [
      {
        name: "Alexander H. Hamilton",
        requestId: "2526-001",
        employeeId: "2005123456789",
        college: "College of Computer Studies",
        department: "Information Technology",
        facultyType: "Full-time Faculty",
        missingApproval: "HRO",
        status: "INCOMPLETE",
      },
      {
        name: "Alexander H. Hamilton",
        requestId: "2526-001",
        employeeId: "2005123456789",
        college: "College of Computer Studies",
        department: "Information Technology",
        facultyType: "Part-time Faculty",
        missingApproval: "University Registrar, OVPHE",
        status: "INCOMPLETE",
      },
      {
        name: "Alexander H. Hamilton",
        requestId: "2526-001",
        employeeId: "2005123456789",
        college: "College of Computer Studies",
        department: "Information Technology",
        facultyType: "Part-time Faculty",
        missingApproval: "Department Chair, University Library",
        status: "INCOMPLETE",
      },
      {
        name: "Alexander H. Hamilton",
        requestId: "2526-001",
        employeeId: "2005123456789",
        college: "College of Computer Studies",
        department: "Information Technology",
        facultyType: "Full-time Faculty",
        missingApproval: "None",
        status: "INCOMPLETE",
      },
    ],
    [],
  );

  const [selectedTerm, setSelectedTerm] = React.useState("Term");
  const [selectedClearance, setSelectedClearance] = React.useState("All Clearances");
  const [selectedCollege, setSelectedCollege] = React.useState("College");
  const [timelineReady, setTimelineReady] = React.useState(false);

  const [timelineOptions, setTimelineOptions] = React.useState<
    { value: string; label: string }[]
  >([]);
  const [timelineTermsByYear, setTimelineTermsByYear] = React.useState<Record<string, string[]>>({});
  const [colleges, setColleges] = React.useState<{ id: string; name: string }[]>([]);
  const [donutTitle, setDonutTitle] = React.useState("Overall Count");
  const [donutCompleted, setDonutCompleted] = React.useState(0);
  const [donutTotal, setDonutTotal] = React.useState(100);
  const [completionSections, setCompletionSections] = React.useState<DepartmentCompletionRateSection[]>([]);

  const buildAnalyticsParams = React.useCallback(() => {
    const params = new URLSearchParams();

    if (selectedClearance && selectedClearance !== "All Clearances") {
      const m = selectedClearance.match(/(\d{4})/);
      if (m) params.set("academic_year", m[1]);
    }

    if (selectedTerm && selectedTerm !== "Term") {
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

    return params;
  }, [selectedClearance, selectedTerm, selectedCollege, colleges]);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/ovphe/analytics-timelines")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (data: {
          items?: {
            academicYearStart?: string;
            academicYearEnd?: string;
            term?: string;
            setAsActive?: boolean;
            isArchived?: boolean;
          }[];
        }) => {
          const items = data.items ?? [];
          const optionMap = new Map<string, { value: string; label: string; active: boolean; archived: boolean }>();
          const termsByYear = new Map<string, Set<string>>();

          items.forEach((item) => {
            const startYear = (item.academicYearStart ?? "").trim();
            const endYear = (item.academicYearEnd ?? "").trim();
            const term = (item.term ?? "").trim();
            if (!startYear || !endYear) {
              return;
            }

            const value = `S.Y. ${startYear}-${endYear}`;
            const existing = optionMap.get(value);
            const next = {
              value,
              label: value,
              active: Boolean(item.setAsActive) || Boolean(existing?.active),
              archived: Boolean(item.isArchived) || Boolean(existing?.archived),
            };
            optionMap.set(value, next);

            if (term) {
              if (!termsByYear.has(value)) {
                termsByYear.set(value, new Set<string>());
              }
              termsByYear.get(value)?.add(term);
            }
          });

          const options = Array.from(optionMap.values()).sort(
            (a, b) => Number(b.active) - Number(a.active) || b.value.localeCompare(a.value),
          );

          setTimelineOptions(options.map(({ value, label }) => ({ value, label })));
          setTimelineTermsByYear(
            Array.from(termsByYear.entries()).reduce<Record<string, string[]>>((acc, [year, terms]) => {
              acc[year] = Array.from(terms.values()).sort((a, b) => a.localeCompare(b));
              return acc;
            }, {}),
          );
        },
      )
      .catch(() => {
        setTimelineOptions([]);
        setTimelineTermsByYear({});
      });
  }, []);

  React.useEffect(() => {
    if (!selectedClearance || selectedClearance === "All Clearances") {
      return;
    }

    const availableTerms = timelineTermsByYear[selectedClearance] ?? [];
    if (!availableTerms.length) {
      return;
    }

    if (selectedTerm === "Term" || !availableTerms.includes(selectedTerm)) {
      setSelectedTerm(availableTerms[0]);
    }
  }, [selectedClearance, selectedTerm, timelineTermsByYear]);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/active-clearance-timeline")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { academicYear?: string; semester?: string }) => {
        const academicYear = (data.academicYear ?? "").trim();
        const semester = (data.semester ?? "").trim();

        if (academicYear) {
          const normalizedAcademicYear = academicYear.replace(/[–—]/g, "-");
          setSelectedClearance(`S.Y. ${normalizedAcademicYear}`);
        }
        if (semester) {
          setSelectedTerm(semester);
        }
      })
      .catch(() => {})
      .finally(() => setTimelineReady(true));
  }, []);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/ovphe/org-structure")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { colleges: { id: string; name: string }[] }) => {
        setColleges(data.colleges ?? []);
      })
      .catch(() => setColleges([]));
  }, []);

  React.useEffect(() => {
    if (!timelineReady) {
      return;
    }

    const params = buildAnalyticsParams();

    fetch(`/admin/xu-faculty-clearance/api/ovphe/system-analytics?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (data: {
          summary?: {
            label?: string;
            completedCount?: number;
            totalCount?: number;
          };
          sections?: DepartmentCompletionRateSection[];
          rows: {
            collegeName: string;
            completionRate: number;
            completedCount?: number;
            totalCount?: number;
          }[];
        }) => {
        const summary = data.summary;
        const rows = data.rows ?? [];
        const fallback = rows[0];

        setDonutTitle(summary?.label || fallback?.collegeName || "Overall Count");
        setDonutCompleted(
          Math.max(
            0,
            typeof summary?.completedCount === "number"
              ? summary.completedCount
              : typeof fallback?.completedCount === "number"
                ? fallback.completedCount
                : 0,
          ),
        );
        setDonutTotal(
          Math.max(
            0,
            typeof summary?.totalCount === "number"
              ? summary.totalCount
              : typeof fallback?.totalCount === "number"
                ? fallback.totalCount
                : 0,
          ),
        );

        setCompletionSections(data.sections ?? []);
      })
      .catch(() => {
        setDonutTitle("Overall Count");
        setDonutCompleted(0);
        setDonutTotal(0);
        setCompletionSections([]);
      });
  }, [buildAnalyticsParams, timelineReady]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      <ClearanceProgressDialog
        open={clearanceProgressOpen}
        onOpenChange={setClearanceProgressOpen}
        rows={clearanceProgressRows}
      />
      
      {/* HEADER */}
      <div className="header mb-3">
        <OVPHEHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 w-full lg:max-w-4xl lg:mx-auto lg:p-8">
        
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
          <Button variant="back" size="back" onClick={() => navigate("/OVPHE-tools")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>

        <div className="mt-2 space-y-3">
          <div className="flex flex-wrap items-left gap-3 overflow-x-auto mt-4">

            <Select value={selectedClearance} onValueChange={setSelectedClearance}>
              <SelectTrigger className="w-max" variant="pill">
                <SelectValue placeholder="School Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Clearances">School Year</SelectItem>
                {timelineOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger  variant="pill" className="w-max">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term">Term</SelectItem>
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

              <Button 
                type="button" 
                variant="default" 
                  onClick={() => {
                    postOVPHEActivityLog({
                      event_type: "exported_clearance_results",
                      details: [
                        `User: ${localStorage.getItem('firstName') || 'Unknown'} ${localStorage.getItem('lastName') || ''}`,
                        selectedCollege !== "College" ? `College: ${selectedCollege}` : "",
                        selectedClearance !== "All Clearances" && selectedTerm !== "Term" 
                          ? `Details: (${selectedClearance} ${selectedTerm})`
                          : selectedClearance !== "All Clearances" 
                            ? `Details: (${selectedClearance})`
                            : selectedTerm !== "Term"
                              ? `Details: (${selectedTerm})`
                              : ""
                      ].filter(Boolean),
                    });
                    const params = buildAnalyticsParams();
                    const url = `/admin/xu-faculty-clearance/api/ovphe/export-clearance-results?${params.toString()}`;
                    fetch(url, { credentials: "include" })
                      .then((response) => {
                        if (!response.ok) {
                          return Promise.reject();
                        }
                        const disposition = response.headers.get("content-disposition") || "";
                        const match = disposition.match(/filename="?([^";]+)"?/i);
                        const fallbackYear =
                          selectedClearance && selectedClearance !== "All Clearances"
                            ? selectedClearance.replace(/[^\d-]+/g, "_").replace(/^_+|_+$/g, "")
                            : "active";
                        const filename = match?.[1] || `clearance_results_${fallbackYear}.csv`;
                        return response.blob().then((blob) => ({ blob, filename }));
                      })
                      .then(({ blob, filename }) => {
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(blobUrl);
                      })
                      .catch(() => {});
                  }}
                >
                  <img src="/WhiteExportIcon.png" alt="Export analytics" className="h-5 w-5 object-contain" />
                  Export Analytics
                </Button>            
          </div>
        </div>  

          <div className="min-w-0 flex-1 my-4">
            <Badge
              variant="warning"
              className="w-full flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3 text-sm font-medium"
            >
              <div className="flex min-w-0 items-center gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <path
                    d="M12 9V13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 17H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.29 3.86L1.82 18.14C1.063 19.42 1.976 21 3.53 21H20.47C22.024 21 22.937 19.42 22.18 18.14L13.71 3.86C12.933 2.54 11.067 2.54 10.29 3.86Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="min-w-0">
                  Clearance deadline is approaching - 10 days remaining
                </div>
              </div>

              <div className="shrink-0 rounded-full border border-yellow-300 bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800">
                Deadline: May 31, 2025
              </div>
            </Badge>
          </div>
        
          <div className="flex flex-wrap gap-3">
            <StatCard 
              variant="TotalFaculty" 
              number="527"
              descriptionValues={{ fullTime: "289", partTime: "238" }}
            />
            
            <StatCard 
              variant="CompleteClearance" 
              number="89"
              descriptionValues={{ percentage: "17" }}
            />

            <StatCard 
              variant="IncompleteClearance" 
              number="83"
            />

            <StatCard 
              variant="Unprocessed" 
              number="83"
            />

            <StatCard 
              variant="OverallCompletion" 
              number="83"
              descriptionValues={{ cleared: "213", total: "254" }}
            />
            
          </div>

          <div className="flex items-start gap-5 mt-10">

            <StatCardWithActions
              leftContent={<span className="text-primary text-lg font-bold">Clearance Pipeline</span>}
              rightContent={<span className="text-gray-600 text-md italic">As of [Date], [Time]</span>}
            />
          </div>


          <div className="flex flex-wrap items-stretch gap-5 mt-2">

            <ClearanceDistributionCard
              className="self-stretch h-[220px] w-full lg:w-[calc(50%-10px)]"
              title="Distribution of 527 faculty by clearance status"
              total={527}
              items={[
                {
                  label: "Cleared Clearance",
                  value: 93,
                  barClassName: "bg-success",
                  valueClassName: "text-success",
                },
                {
                  label: "Incomplete Clearance",
                  value: 27,
                  barClassName: "bg-orange-400",
                  valueClassName: "text-orange-400",
                },
                {
                  label: "Unprocessed Clearance",
                  value: 18,
                  barClassName: "bg-blue-500",
                  valueClassName: "text-blue-500",
                },
              ]}
            />
              
            <FacultyCompositionCard
              className="self-stretch h-[220px] w-full lg:w-[calc(50%-10px)]"
              title="Faculty Composition"
              subtitle="by employment type"
              items={[
              { label: "Full-Time", value: 289, color: "#0b1b8f" },
              { label: "Part-Time", value: 238, color: "#5a73ff" },
              ]}
            />
  
          </div>

          <div className="mt-10 flex flex-col gap-2">
            <StatCardWithActions
              leftContent={<span className="text-primary text-lg font-bold">Office Clearance Bottlenecks</span>}
              rightContent={<span className="text-gray-600 text-base italic">As of [Date], [Time]</span>}
            />
            <div className="text-gray-600 text-sm">
              Office are sorted by pending count (highest first) to surface processing delays.
            </div>
          </div>
          
          <div className="gap-5 my-4">
            <OfficeBottlenecksCard
            className="w-full"
            items={[
              { office: "Office of the Vice President for Higher Education", cleared: 65, pending: 65 },
              { office: "University Registrar", cleared: 65, pending: 65 },
              { office: "University Library", cleared: 65, pending: 65 },
              { office: "Accounting Office", cleared: 65, pending: 55 },
              { office: "Human Resources", cleared: 65, pending: 23 },
            ]}
            />
          </div>

          <div className="mt-10 flex flex-col gap-2">
            <StatCardWithActions
              leftContent={<span className="text-primary text-lg font-bold">Office Clearance Bottlenecks</span>}
              rightContent={<span className="text-gray-600 text-base italic">As of [Date], [Time]</span>}
            />
            <div className="text-gray-600 text-sm">
              Office are sorted by pending count (highest first) to surface processing delays.
            </div>
          </div>      

          <div className="mt-10 flex flex-col gap-2">
            <CollegeClearanceStatusCard
              className="w-full"
              items={[
                { college: "College of Agriculture", facultyMembers: 23, completed: 23, total: 50, status: "at_risk" },
                { college: "College of Arts & Sciences", facultyMembers: 21, completed: 30, total: 38, status: "in_progress" },
                { college: "College of Computer Studies", facultyMembers: 45, completed: 23, total: 23, status: "cleared" },
              ]}
              totalRow={{ facultyMembers: 254, completed: 30, total: 38, status: "in_progress" }}
              footerLeft="5 colleges · Sorted by rate (ascending)"
              footerActionLabel="View All Faculty"
              onFooterAction={() => setClearanceProgressOpen(true)}
            />
          </div>                  
      </main>

    </div>
  );
}

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
  const [clearanceProgressRows, setClearanceProgressRows] = React.useState<ClearanceProgressRow[]>([]);
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

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

  // Enhanced analytics data fetching
  const fetchAnalyticsData = React.useCallback(() => {
    if (!timelineReady) {
      return;
    }

    const params = buildAnalyticsParams();

    setLoading(true);
    fetch(`/admin/xu-faculty-clearance/api/ovphe/system-analytics?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setAnalyticsData(data);
        setCompletionSections(data.sections ?? []);
      })
      .catch(() => {
        setAnalyticsData(null);
        setCompletionSections([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [buildAnalyticsParams, timelineReady]);

  // Fetch clearance progress data
  const fetchClearanceProgress = React.useCallback(() => {
    if (!timelineReady) {
      return;
    }

    const params = buildAnalyticsParams();
    const progressParams = new URLSearchParams(params);
    progressParams.set('pageSize', '100'); // Fetch more data for the dialog

    fetch(`/admin/xu-faculty-clearance/api/ovphe/clearance-progress?${progressParams.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const rows: ClearanceProgressRow[] = data.rows || [];
        setClearanceProgressRows(rows);
      })
      .catch(() => {
        setClearanceProgressRows([]);
      });
  }, [buildAnalyticsParams, timelineReady]);

  // Main analytics data fetching effect
  React.useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Auto-refresh effect (every 5 minutes)
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  // Fetch clearance progress when dialog opens
  React.useEffect(() => {
    if (clearanceProgressOpen) {
      fetchClearanceProgress();
    }
  }, [clearanceProgressOpen, fetchClearanceProgress]);

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

          {analyticsData?.clearanceDeadline?.showBanner && (
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
                  {analyticsData?.clearanceDeadline?.message} - {analyticsData?.clearanceDeadline?.daysRemaining} days remaining
                </div>
              </div>

              <div className="shrink-0 rounded-full border border-yellow-300 bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800">
                Deadline: {analyticsData?.clearanceDeadline?.deadlineDate}
              </div>
            </Badge>
          </div>
        )}
        
          <div className="flex flex-wrap gap-3">
            <StatCard 
              variant="TotalFaculty" 
              number={analyticsData?.summary?.totalFaculty?.toString() || "0"}
              descriptionValues={{ 
                fullTime: analyticsData?.summary?.fullTimeFaculty?.toString() || "0", 
                partTime: analyticsData?.summary?.partTimeFaculty?.toString() || "0" 
              }}
            />
            
            <StatCard 
              variant="CompleteClearance" 
              number={analyticsData?.summary?.completeClearance?.toString() || "0"}
              descriptionValues={{ 
                percentage: analyticsData?.summary?.totalFaculty 
                  ? Math.round((analyticsData.summary.completeClearance / analyticsData.summary.totalFaculty) * 100).toString()
                  : "0"
              }}
            />

            <StatCard 
              variant="IncompleteClearance" 
              number={analyticsData?.summary?.incompleteClearance?.toString() || "0"}
            />

            <StatCard 
              variant="Unprocessed" 
              number={analyticsData?.summary?.unprocessedClearance?.toString() || "0"}
            />

            <StatCard 
              variant="OverallCompletion" 
              number={analyticsData?.summary?.overallCompletion?.percentage?.toString() || "0"}
              descriptionValues={{ 
                cleared: analyticsData?.summary?.overallCompletion?.cleared?.toString() || "0", 
                total: analyticsData?.summary?.overallCompletion?.total?.toString() || "0" 
              }}
            />
            
          </div>

          <div className="flex items-start gap-5 mt-10">

            <StatCardWithActions
              leftContent={<span className="text-primary text-lg font-bold">Clearance Pipeline</span>}
              rightContent={
                <span className="text-gray-600 text-md italic">
                  As of {analyticsData?.currentDateTime ? new Date(analyticsData.currentDateTime).toLocaleDateString() : new Date().toLocaleDateString()}, 
                  {analyticsData?.currentDateTime ? new Date(analyticsData.currentDateTime).toLocaleTimeString() : new Date().toLocaleTimeString()}
                </span>
              }
            />
          </div>


          <div className="flex flex-wrap items-stretch gap-5 mt-2">

            <ClearanceDistributionCard
              className="self-stretch h-[220px] w-full lg:w-[calc(50%-10px)]"
              title={`Distribution of ${analyticsData?.summary?.totalFaculty || 0} faculty by clearance status`}
              total={analyticsData?.summary?.totalFaculty || 0}
              items={analyticsData?.clearanceDistribution || []}
            />
              
            <FacultyCompositionCard
              className="self-stretch h-[220px] w-full lg:w-[calc(50%-10px)]"
              title="Faculty Composition"
              subtitle="by employment type"
              items={analyticsData?.facultyComposition || []}
            />
  
          </div>

          <div className="mt-10 flex flex-col gap-2">
            <StatCardWithActions
              leftContent={<span className="text-primary text-lg font-bold">Office Clearance Bottlenecks</span>}
              rightContent={
                <span className="text-gray-600 text-base italic">
                  As of {analyticsData?.currentDateTime ? new Date(analyticsData.currentDateTime).toLocaleDateString() : new Date().toLocaleDateString()}, 
                  {analyticsData?.currentDateTime ? new Date(analyticsData.currentDateTime).toLocaleTimeString() : new Date().toLocaleTimeString()}
                </span>
              }
            />
            <div className="text-gray-600 text-sm">
              Office are sorted by pending count (highest first) to surface processing delays.
            </div>
          </div>
          
          <div className="gap-5 my-4">
            <OfficeBottlenecksCard
            className="w-full"
            items={analyticsData?.officeBottlenecks || []}
            />
          </div>

          <div className="mt-10 flex flex-col gap-2">
            <StatCardWithActions
              leftContent={<span className="text-primary text-lg font-bold">College Clearance Progress</span>}
              rightContent={
                <span className="text-gray-600 text-base italic">
                  As of {analyticsData?.currentDateTime ? new Date(analyticsData.currentDateTime).toLocaleDateString() : new Date().toLocaleDateString()}, 
                  {analyticsData?.currentDateTime ? new Date(analyticsData.currentDateTime).toLocaleTimeString() : new Date().toLocaleTimeString()}
                </span>
              }
            />
            <div className="text-gray-600 text-sm">
              Colleges are sorted by completion rate (ascending) to surface those needing attention.
            </div>
          </div>      

          <div className="mt-10 flex flex-col gap-2">
            <CollegeClearanceStatusCard
              className="w-full"
              items={analyticsData?.collegeClearanceStatus || []}
              totalRow={{
                facultyMembers: analyticsData?.collegeClearanceStatus?.reduce((sum, item) => sum + item.facultyMembers, 0) || 0,
                completed: analyticsData?.collegeClearanceStatus?.reduce((sum, item) => sum + item.completed, 0) || 0,
                total: analyticsData?.collegeClearanceStatus?.reduce((sum, item) => sum + item.total, 0) || 0,
                status: "in_progress"
              }}
              footerLeft={`${analyticsData?.collegeClearanceStatus?.length || 0} colleges · Sorted by rate (ascending)`}
              footerActionLabel="View All Faculty"
              onFooterAction={() => setClearanceProgressOpen(true)}
            />
          </div>                  
      </main>

    </div>
  );
}

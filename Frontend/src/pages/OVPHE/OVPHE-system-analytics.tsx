import * as React from "react";

import "../../index.css";
import { Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { OVPHEHeader } from "../../stories/components/header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";
import { Button } from "../../stories/components/button";
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

async function exportToPDF(elementId: string, filename: string) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID "${elementId}" not found.`);
      return;
    }

    // Show loading state
    const originalButton = document.querySelector('[data-export-button]') as HTMLButtonElement;
    const originalContent = originalButton?.innerHTML;
    if (originalButton) {
      originalButton.disabled = true;
      originalButton.innerHTML = '<div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> Generating PDF...';
    }

    // Force CSS rendering before capture
    element.style.display = 'block';
    element.style.visibility = 'visible';
    
    // Temporarily replace conic gradients with solid colors for PDF export
    const conicElements = element.querySelectorAll('[style*="conic-gradient"]');
    const originalStyles: Array<{ element: HTMLElement; style: string }> = [];
    
    conicElements.forEach((el) => {
      const element = el as HTMLElement;
      const originalStyle = element.style.background;
      originalStyles.push({ element, style: originalStyle });
      
      // Extract first color from gradient and use as solid background
      const colorMatch = originalStyle.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgb\([^)]+\)|rgba\([^)]+\)/);
      if (colorMatch) {
        element.style.background = colorMatch[0];
      }
    });
    
    // Trigger reflow to ensure CSS is rendered
    element.offsetHeight;
    
    // Wait a moment for charts to fully render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create canvas from the element with foreign object rendering
    const canvas = await html2canvas(element, {
      scale: 1.5, // Reduced scale to prevent cutoff
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth + 100, // Add extra width
      windowHeight: element.scrollHeight + 100, // Add extra height
      scrollX: -50, // Offset to capture more content
      scrollY: -50,
      imageTimeout: 15000, // Extended timeout for chart rendering
      foreignObjectRendering: false, // Better for CSS gradients and complex styling
      removeContainer: false // Keep container for proper chart rendering
    });

    // Create PDF with portrait orientation for mobile PWA
    const imgData = canvas.toDataURL('image/png', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Calculate dimensions with optimized margins for mobile
    const pageWidth = 210; // A4 portrait width in mm
    const pageHeight = 297; // A4 portrait height in mm
    const margin = 8; // 8mm margins for balanced layout
    const usableWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2);

    // Calculate image dimensions with better scaling
    const canvasAspectRatio = canvas.width / canvas.height;
    const pageAspectRatio = usableWidth / usableHeight;
    
    let imgWidth, imgHeight;
    if (canvasAspectRatio > pageAspectRatio) {
      // Canvas is wider, fit to width
      imgWidth = usableWidth;
      imgHeight = usableWidth / canvasAspectRatio;
    } else {
      // Canvas is taller, fit to height
      imgHeight = usableHeight;
      imgWidth = usableHeight * canvasAspectRatio;
    }

    let heightLeft = imgHeight;
    let position = margin;

    // Add first page with margin
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= usableHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;
    }

    // Save the PDF
    pdf.save(filename);

    // Restore original conic gradient styles
    originalStyles.forEach(({ element, style }) => {
      element.style.background = style;
    });

    // Restore button
    if (originalButton) {
      originalButton.disabled = false;
      originalButton.innerHTML = originalContent;
    }

    // Log the activity
    postOVPHEActivityLog({
      event_type: "exported_analytics_pdf",
      details: [`PDF exported: ${filename}`]
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Restore button on error
    const originalButton = document.querySelector('[data-export-button]') as HTMLButtonElement;
    if (originalButton) {
      originalButton.disabled = false;
      originalButton.innerHTML = '<img src="/WhiteExportIcon.png" alt="Export analytics" className="h-5 w-5 object-contain" /> Export Analytics';
    }
  }
}

export default function OVPHESystemAnalytics() {
  const navigate = useNavigate();

  const [clearanceProgressOpen, setClearanceProgressOpen] = React.useState(false);
  const [clearanceProgressRows, setClearanceProgressRows] = React.useState<ClearanceProgressRow[]>([]);
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  function normalizeTermCode(term: string) {
    const t = (term ?? "").trim();
    if (!t) return "";

    const upper = t.toUpperCase();
    if (upper === "FIRST" || upper === "SECOND" || upper === "INTERSESSION") {
      return upper;
    }

    const map: Record<string, string> = {
      "First Semester": "FIRST",
      "Second Semester": "SECOND",
      Intersession: "INTERSESSION",
    };

    return map[t] ?? "";
  }

  const [selectedTerm, setSelectedTerm] = React.useState("ALL");
  const [selectedClearance, setSelectedClearance] = React.useState("All Clearances");
  const [selectedCollege, setSelectedCollege] = React.useState("College");
  const [timelineReady, setTimelineReady] = React.useState(false);

  const [timelineOptions, setTimelineOptions] = React.useState<
    { value: string; label: string }[]
  >([]);
  const [timelineTermsByYear, setTimelineTermsByYear] = React.useState<Record<string, string[]>>({});
  const [colleges, setColleges] = React.useState<{ id: string; name: string }[]>([]);

  const availableTerms = React.useMemo(() => {
    if (!selectedClearance || selectedClearance === "All Clearances") {
      return ["FIRST", "SECOND", "INTERSESSION"];
    }
    return timelineTermsByYear[selectedClearance] ?? [];
  }, [selectedClearance, timelineTermsByYear]);
 

  const buildAnalyticsParams = React.useCallback(() => {
    const params = new URLSearchParams();

    if (selectedClearance && selectedClearance !== "All Clearances") {
      const m = selectedClearance.match(/(\d{4})/);
      if (m) params.set("academic_year", m[1]);
    }

    if (selectedTerm && selectedTerm !== "ALL") {
      params.set("term", selectedTerm);
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
              const normalized = normalizeTermCode(term);
              if (!normalized) {
                return;
              }
              if (!termsByYear.has(value)) {
                termsByYear.set(value, new Set<string>());
              }
              termsByYear.get(value)?.add(normalized);
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

    if (selectedTerm === "ALL" || !availableTerms.includes(selectedTerm)) {
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
          const termCode = normalizeTermCode(semester);
          setSelectedTerm(termCode || "ALL");
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
      })
      .catch(() => {
        setAnalyticsData(null);
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
      <main className="dashboard px-4 md:px-6 lg:px-[1in] pt-4 pb-4 w-full">
        
        <h1 className="text-2xl text-left text-primary font-bold">System Analytics</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/analytics-admin-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>System Analytics</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/analytics-admin-tools")}> 
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

            {(() => {
              const availableTerms =
                selectedClearance && selectedClearance !== "All Clearances"
                  ? (timelineTermsByYear[selectedClearance] ?? [])
                  : [];

              const showFirst = availableTerms.includes("FIRST");
              const showSecond = availableTerms.includes("SECOND");
              const showIntersession = availableTerms.includes("INTERSESSION");

              return (
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger  variant="pill" className="w-max">
                <SelectValue placeholder="Term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Term</SelectItem>
                {availableTerms.includes("FIRST") ? (
                  <SelectItem value="FIRST">First Semester</SelectItem>
                ) : null}
                {availableTerms.includes("SECOND") ? (
                  <SelectItem value="SECOND">Second Semester</SelectItem>
                ) : null}
                {availableTerms.includes("INTERSESSION") ? (
                  <SelectItem value="INTERSESSION">Intersession</SelectItem>
                ) : null}
              </SelectContent>
                </Select>
              );
            })()}

            <Select value={selectedCollege} onValueChange={setSelectedCollege}>
              <SelectTrigger variant="pill" className="w-max">
                <SelectValue placeholder="College" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="College">All Colleges</SelectItem>
                {colleges.map((college) => (
                  <SelectItem key={college.id} value={college.name}>
                    {college.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          

              <Button 
                type="button" 
                variant="default"
                data-export-button
                onClick={() => {
                  // Generate filename in the format: [Start Year]-[End Year]_[Semester/Period] - ClearanceProgress [Export Date].pdf
                  let academicYear = "";
                  let semester = "";
                  
                  // Extract academic year from selectedClearance
                  if (selectedClearance && selectedClearance !== "All Clearances") {
                    const yearMatch = selectedClearance.match(/S\.Y\. (\d{4})-(\d{4})/);
                    if (yearMatch) {
                      academicYear = `${yearMatch[1]}-${yearMatch[2]}`;
                    }
                  }
                  
                  // Map selectedTerm to semester format
                  if (selectedTerm && selectedTerm !== "ALL") {
                    const termMap: Record<string, string> = {
                      FIRST: "1stSemester",
                      SECOND: "2ndSemester",
                      INTERSESSION: "Intersession",
                    };
                    semester = termMap[selectedTerm] || selectedTerm;
                  }
                  
                  // Generate export date in MMDDYYYY format
                  const today = new Date();
                  const exportDate = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}${today.getFullYear()}`;
                  
                  // Build filename
                  let filename = "";
                  if (academicYear && semester) {
                    filename = `${academicYear}_${semester}-ClearanceProgress ${exportDate}.pdf`;
                  } else if (academicYear) {
                    filename = `${academicYear}-ClearanceProgress ${exportDate}.pdf`;
                  } else {
                    filename = `ClearanceProgress ${exportDate}.pdf`;
                  }
                  
                  // Log the activity with current filters
                  postOVPHEActivityLog({
                    event_type: "exported_analytics_pdf",
                    details: [
                      `User: ${localStorage.getItem('firstName') || 'Unknown'} ${localStorage.getItem('lastName') || ''}`,
                      selectedCollege !== "College" ? `College: ${selectedCollege}` : "",
                      selectedClearance !== "All Clearances" && selectedTerm !== "ALL" 
                        ? `Details: (${selectedClearance} ${selectedTerm})`
                        : selectedClearance !== "All Clearances" 
                          ? `Details: (${selectedClearance})`
                          : selectedTerm !== "ALL"
                            ? `Details: (${selectedTerm})`
                            : "",
                      `Format: PDF`
                    ].filter(Boolean),
                  });
                  
                  // Export to PDF
                  exportToPDF('analytics-content', filename);
                }}
              >
                <img src="/WhiteExportIcon.png" alt="Export analytics" className="h-5 w-5 object-contain" />
                Export Analytics
              </Button>            
          </div>
        </div>  

          {analyticsData?.clearanceDeadline?.showBanner ? (
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
        ) : (
          <div className="min-w-0 flex-1 my-4">
            <Badge
              variant="destructive"
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
                  This Timeline is Inactive
                </div>
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

          <div className="flex flex-wrap items-stretch gap-5 mt-10">

            <ClearanceDistributionCard
              className="self-stretch h-[220px] w-full lg:w-[calc(50%-10px)]"
              title={`Distribution of ${analyticsData?.summary?.totalFaculty || 0} faculty by clearance status`}
              total={analyticsData?.summary?.totalFaculty || 0}
              items={(analyticsData?.clearanceDistribution || []).map((item: any) => ({
                ...item,
                barClassName: 
                  item.label === "Cleared Clearance" ? "bg-success" :
                  item.label === "Incomplete Clearance" ? "bg-orange-400" :
                  item.label === "Unprocessed Clearance" ? "bg-blue-500" :
                  "bg-gray-400"
              }))}
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
                  {" "}
                  {analyticsData?.currentDateTime
                    ? new Date(analyticsData.currentDateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
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
                  As of {analyticsData?.currentDateTime ? new Date(analyticsData.currentDateTime).toLocaleDateString() : new Date().toLocaleDateString()}, {""}
                  {analyticsData?.currentDateTime
                    ? new Date(analyticsData.currentDateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              }
            />
            <div className="text-gray-600 text-sm">
              Colleges are sorted by completion rate (ascending) to surface those needing attention.
            </div>
          </div>      

          <div className="mt-10 flex flex-col gap-2">
            {(() => {
              const collegeStatus = analyticsData?.collegeClearanceStatus || [];

              const totalFacultyMembers = collegeStatus.reduce(
                (sum: number, item: any) => sum + (item?.facultyMembers || 0),
                0,
              );
              const totalCompleted = collegeStatus.reduce(
                (sum: number, item: any) => sum + (item?.completed || 0),
                0,
              );
              const totalRequired = collegeStatus.reduce(
                (sum: number, item: any) => sum + (item?.total || 0),
                0,
              );

              const overallRate = totalRequired > 0 ? (totalCompleted / totalRequired) * 100 : 0;

              let overallStatus: "cleared" | "in_progress" | "at_risk" = "in_progress";
              if (overallRate === 100) {
                overallStatus = "cleared";
              } else if (overallRate < 50) {
                overallStatus = "at_risk";
              }

              return (
                <CollegeClearanceStatusCard
                  className="w-full"
                  items={collegeStatus}
                  totalRow={{
                    facultyMembers: totalFacultyMembers,
                    completed: totalCompleted,
                    total: totalRequired,
                    status: overallStatus,
                  }}
                  footerLeft={`${collegeStatus.length || 0} colleges · Sorted by rate (ascending)`}
                  footerActionLabel="View All Faculty"
                  onFooterAction={() => setClearanceProgressOpen(true)}
                />
              );
            })()}
          </div>                  
      </main>

    </div>
  );
}

import "../../index.css"; 
import { CISOHeader } from "../../stories/components/header";
import { FacultyDataDumpCard } from "../../stories/components/faculty-dump-cards";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../stories/components/button";
import * as React from "react";
import type { SystemUser } from "../../stories/components/faculty-dump-cards";

import {
  DataDumpSuccessModal,
  ErrorModal,
  SuccessErrorModalMessages,
} from "../../stories/components/success-and-error-modals";

export default function CISOFacultyDataDump() {
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);
  const [timelines, setTimelines] = React.useState<{ id: string; label: string }[]>([]);
  const [selectedTimelineId, setSelectedTimelineId] = React.useState("");
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isFileReady, setIsFileReady] = React.useState(false);

  const [successOpen, setSuccessOpen] = React.useState(false);
  const [createdCount, setCreatedCount] = React.useState(0);
  const [updatedCount, setUpdatedCount] = React.useState(0);
  const [skippedCount, setSkippedCount] = React.useState(0);
  const [skippedRows, setSkippedRows] = React.useState<Array<{rowLabel: string; reason: string}>>([]);
  const [facultyList, setFacultyList] = React.useState<SystemUser[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter faculty list based on search query
  const filteredFacultyList = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return facultyList;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase().trim();
    return facultyList.filter(faculty => 
      faculty.email?.toLowerCase().includes(lowercaseQuery) ||
      faculty.universityId?.toLowerCase().includes(lowercaseQuery) ||
      faculty.name?.toLowerCase().includes(lowercaseQuery) ||
      `${faculty.firstname} ${faculty.lastname}`.toLowerCase().includes(lowercaseQuery)
    );
  }, [facultyList, searchQuery]);

  // Organization structure data
  const [orgColleges, setOrgColleges] = React.useState<string[]>([]);
  const [orgDepartments, setOrgDepartments] = React.useState<string[]>([]);
  const [collegeDepartmentsMap, setCollegeDepartmentsMap] = React.useState<Record<string, string[]>>({});
  const [collegeNameToCodeMap, setCollegeNameToCodeMap] = React.useState<Record<string, string>>({});
  const [departmentNameToCodeMap, setDepartmentNameToCodeMap] = React.useState<Record<string, string>>({});

  const handleEditUser = async (user: SystemUser) => {
    if (!selectedTimelineId) {
      openError('Please select a timeline first');
      return;
    }

    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/ciso/faculty-crud", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          universityId: user.universityId,
          firstName: user.firstname,
          middleName: user.middlename,
          lastName: user.lastname,
          facultyType: user.facultytype,
          college: user.college,
          department: user.department,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update faculty');
      }

      const updatedUser = await response.json();
      
      // Update the user in faculty list
      setFacultyList(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    } catch (error) {
      console.error('Error updating faculty:', error);
      openError(error instanceof Error ? error.message : 'Failed to update faculty');
    }
  };

  const handleRemoveUser = async (user: SystemUser) => {
    if (!selectedTimelineId) {
      openError('Please select a timeline first');
      return;
    }

    try {
      const response = await fetch(`/admin/xu-faculty-clearance/api/ciso/faculty-crud?id=${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete faculty');
      }

      // Remove the user from faculty list
      setFacultyList(prev => prev.filter(u => u.id !== user.id));
    } catch (error) {
      console.error('Error deleting faculty:', error);
      openError(error instanceof Error ? error.message : 'Failed to delete faculty');
    }
  };


  const clearTimelineData = () => {
    setUploadedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setIsFileReady(false);
    // Clear localStorage for current timeline
    localStorage.removeItem(`facultyData_${selectedTimelineId}`);
    localStorage.removeItem(`hasUploaded_${selectedTimelineId}`);
    localStorage.removeItem(`previewData_${selectedTimelineId}`);
  };

  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode>("");

  const openError = React.useCallback((message: React.ReactNode) => {
    setErrorMessage(message);
    setErrorOpen(true);
  }, []);

  const loadFacultyData = React.useCallback(async (timelineId: string) => {
    if (!timelineId) {
      setFacultyList([]);
      return;
    }
    
    try {
      // Fetch all faculty users (no timeline filter)
      const response = await fetch(`/admin/xu-faculty-clearance/api/ciso/faculty-crud`);
      
      if (!response.ok) {
        setFacultyList([]);
        localStorage.removeItem(`facultyData_${timelineId}`);
        localStorage.removeItem(`hasUploaded_${timelineId}`);
        localStorage.removeItem(`previewData_${timelineId}`);
        return;
      }
      
      const data = await response.json();
      const facultyListData = data.faculty || [];
      
      console.log('Faculty data loaded:', facultyListData.length, 'faculty members');
      
      // Set faculty list
      setFacultyList(facultyListData);
      
      // Save to localStorage for persistence
      localStorage.setItem(`facultyData_${timelineId}`, JSON.stringify(facultyListData));
      localStorage.setItem(`hasUploaded_${timelineId}`, 'true');
    } catch (error) {
      console.error('Error loading faculty data:', error);
      // On error, clear the data to prevent inconsistencies
      setFacultyList([]);
    }
  }, []);


  const selectedTimelineLabel = React.useMemo(() => {
    const found = timelines.find((t) => t.id === selectedTimelineId);
    return found?.label || selectedTimelineId || "";
  }, [timelines, selectedTimelineId]);

  // Load persisted faculty data from localStorage on component mount
  React.useEffect(() => {
    if (!selectedTimelineId) return;
    
    const savedData = localStorage.getItem(`facultyData_${selectedTimelineId}`);
    
    // Load saved data for immediate display
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFacultyList(parsedData);
      } catch (error) {
        console.error('Failed to load saved faculty data:', error);
        setFacultyList([]);
      }
    } else {
      setFacultyList([]);
    }
    
    // Then load from API to get the latest data
    loadFacultyData(selectedTimelineId);
  }, [selectedTimelineId, loadFacultyData]);

  // Save faculty list to localStorage whenever it changes
  React.useEffect(() => {
    if (selectedTimelineId && facultyList.length > 0) {
      localStorage.setItem(`facultyData_${selectedTimelineId}`, JSON.stringify(facultyList));
      localStorage.setItem(`hasUploaded_${selectedTimelineId}`, 'true');
    }
  }, [facultyList, selectedTimelineId]);

  // Save selected timeline to localStorage whenever it changes
  React.useEffect(() => {
    if (selectedTimelineId) {
      localStorage.setItem('lastSelectedTimeline', selectedTimelineId);
    }
  }, [selectedTimelineId]);

  // Reset faculty data when timeline changes
  React.useEffect(() => {
    if (!selectedTimelineId) return;
    
    setUploadedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setIsFileReady(false);
    
    // Load saved data for immediate display
    const savedData = localStorage.getItem(`facultyData_${selectedTimelineId}`);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFacultyList(parsedData);
      } catch (error) {
        setFacultyList([]);
      }
    } else {
      setFacultyList([]);
    }
    
    // Then load from API to get the latest data
    loadFacultyData(selectedTimelineId);
  }, [selectedTimelineId, loadFacultyData]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadTimelines() {
      try {
        const res = await fetch("/admin/xu-faculty-clearance/api/ciso/clearance-timeline");
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const raw = (data && (data.timelines || data.items)) || [];
        if (!Array.isArray(raw)) return;

        const options = raw
          .map((t: any) => {
            const id = String(t.id ?? "");
            const start = t.academicYearStart ?? t.startYear ?? t.academic_year_start;
            const end = t.academicYearEnd ?? t.endYear ?? t.academic_year_end;
            const sem = t.semester ?? t.term ?? "";
            const ay = start && end ? `${start} - ${end}` : "";
            const label = ay && sem ? `${ay} • ${sem}` : sem || ay || id;
            return { id, label };
          })
          .filter((opt: { id: string }) => !!opt.id);

        if (!cancelled) {
          setTimelines(options);
          // If no timeline is selected, prioritize the timeline with existing data
          if (!selectedTimelineId && options.length) {
            // Find the timeline with existing faculty data
            const timelineWithData = options.find(option => 
              localStorage.getItem(`facultyData_${option.id}`)
            );
            
            if (timelineWithData) {
              setSelectedTimelineId(timelineWithData.id);
            } else {
              // Fallback to last selected timeline if it exists
              const lastSelectedTimeline = localStorage.getItem('lastSelectedTimeline');
              const lastTimelineExists = lastSelectedTimeline && options.find(opt => opt.id === lastSelectedTimeline);
              
              setSelectedTimelineId((lastTimelineExists && lastTimelineExists.id) || options[0].id);
            }
          }
        }
      } catch {
        // ignore; backend will still validate on import
      }
    }

    loadTimelines();

    return () => {
      cancelled = true;
    };
  }, []);
  React.useEffect(() => {
    let cancelled = false;

    async function loadOrgStructure() {
      try {
        const res = await fetch("/admin/xu-faculty-clearance/api/ciso/org-structure");
        if (!res.ok) throw new Error("Failed to load org structure");

        const data = (await res.json()) as {
          colleges?: Array<{ id?: string; name?: string; short?: string }>;
          departments?: Array<{ id?: string; collegeId?: string; name?: string; short?: string }>;
          offices?: Array<{ id?: string; name?: string; short?: string }>;
        };

        const colleges = (data.colleges || [])
          .map((c) => (c?.name || "").trim())
          .filter(Boolean);
        const departments = (data.departments || [])
          .map((d) => (d?.name || "").trim())
          .filter(Boolean);

        // Build college-departments map: college name -> array of department names
        const collegeMap: Record<string, string[]> = {};
        
        // Build name-to-code maps
        const collegeNameToCode: Record<string, string> = {};
        const departmentNameToCode: Record<string, string> = {};
        
        // Initialize all colleges with empty arrays and build college name-to-code map
        (data.colleges || []).forEach((c) => {
          const collegeName = (c?.name || "").trim();
          const collegeCode = (c?.short || c?.id || "").trim();
          if (collegeName) {
            collegeMap[collegeName] = [];
            if (collegeCode) {
              collegeNameToCode[collegeName] = collegeCode;
            }
          }
        });
        
        // Map departments to their colleges using collegeId and build department name-to-code map
        (data.departments || []).forEach((d) => {
          const departmentName = (d?.name || "").trim();
          const departmentCode = (d?.short || d?.id || "").trim();
          const collegeId = d?.collegeId;
          
          if (departmentName && collegeId) {
            // Find college by ID
            const college = (data.colleges || []).find(c => c?.id === collegeId);
            const collegeName = college?.name?.trim();
            
            if (collegeName && collegeMap[collegeName]) {
              collegeMap[collegeName].push(departmentName);
            }
            
            if (departmentCode) {
              departmentNameToCode[departmentName] = departmentCode;
            }
          }
        });

        if (!cancelled) {
          setOrgColleges(colleges);
          setOrgDepartments(departments);
          setCollegeDepartmentsMap(collegeMap);
          setCollegeNameToCodeMap(collegeNameToCode);
          setDepartmentNameToCodeMap(departmentNameToCode);
        }
      } catch {
        if (!cancelled) {
          setOrgColleges([]);
          setOrgDepartments([]);
          setCollegeDepartmentsMap({});
          setCollegeNameToCodeMap({});
          setDepartmentNameToCodeMap({});
        }
      }
    }

    loadOrgStructure();

    return () => {
      cancelled = true;
    };
  }, []);


  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">

      <DataDumpSuccessModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        created={createdCount}
        updated={updatedCount}
        skipped={skippedCount}
        skippedRows={skippedRows}
      />

      <ErrorModal
        open={errorOpen}
        onOpenChange={setErrorOpen}
        message={errorMessage}
      />
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-4 md:px-6 lg:px-[1in] pt-4 pb-4 w-full">
        
        <h1 className="text-2xl text-left text-primary font-bold">Faculty Data Dump</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/system-admin-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Faculty Data Dump</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/system-admin-tools")}> 
              <div className="flex items-center gap-2">
                <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
              </div>
          </Button>
        </div>
      
       <div className="mt-2 space-y-3">
        <FacultyDataDumpCard
          title="Upload Faculty Data"
          selectedFile={uploadedFile}
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
          isFileReady={isFileReady}
          tableUsers={filteredFacultyList}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          tablePage={1}
          tablePageCount={1}
          onTablePageChange={() => {}}
          onAddFaculty={async (faculty) => {
            try {
              // Get current active timeline
              const timelineResponse = await fetch("/admin/xu-faculty-clearance/api/ciso/clearance-timeline");
              if (!timelineResponse.ok) {
                openError('Failed to get current timeline');
                return;
              }
              const timelineData = await timelineResponse.json();
              const activeTimeline = timelineData.items?.find((t: any) => t.isActive) || timelineData.timelines?.find((t: any) => t.isActive);
              
              if (!activeTimeline) {
                openError('No active timeline found');
                return;
              }

            try {
              // Convert college and department names to codes
              const collegeCode = collegeNameToCodeMap[faculty.college] || faculty.college;
              const departmentCode = departmentNameToCodeMap[faculty.department] || faculty.department;
              
              const response = await fetch("/admin/xu-faculty-clearance/api/ciso/faculty-crud", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: faculty.email,
                  universityId: faculty.universityId,
                  firstName: faculty.firstName,
                  middleName: faculty.middleName,
                  lastName: faculty.lastName,
                  facultyType: faculty.facultyType,
                  college: collegeCode,
                  department: departmentCode,
                  clearance_timeline_id: activeTimeline.id,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to create faculty');
              }

              const newFaculty = await response.json();
              
              // Add the new faculty to faculty list
              setFacultyList(prev => [...prev, newFaculty]);
              // Save to localStorage immediately
              setTimeout(() => {
                localStorage.setItem(`facultyData_${selectedTimelineId}`, JSON.stringify([...facultyList, newFaculty]));
              }, 0);
            } catch (error) {
              console.error('Error creating faculty:', error);
              openError(error instanceof Error ? error.message : 'Failed to create faculty');
            }
            } catch (error) {
              console.error('Timeline fetch error:', error);
              openError('Failed to get current timeline');
            }
          }}
          onEditUser={handleEditUser}
          onRemoveUser={handleRemoveUser}
          colleges={orgColleges}
          departments={orgDepartments}
          collegeDepartmentsMap={collegeDepartmentsMap}
          collegeNameToCodeMap={collegeNameToCodeMap}
          departmentNameToCodeMap={departmentNameToCodeMap}
          onClearFile={clearTimelineData}
          onRemoveFile={async () => {
            const fileName = uploadedFile?.name;
            const timelineLabel = selectedTimelineLabel;
            clearTimelineData();
            if (fileName && timelineLabel) {
              try {
                await fetch("/admin/xu-faculty-clearance/api/ciso/activity-logs", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event_type: "faculty_data_dump_removed",
                    details: [
                      `File name = ${fileName}`,
                      `Timeline = ${timelineLabel}`,
                    ],
                  }),
                });
              } catch {
                // best-effort logging only
              }
            }
          }}
          onActivate={async () => {
            if (!uploadedFile || busy) return;
            
            // Get current active timeline
            try {
              const timelineResponse = await fetch("/admin/xu-faculty-clearance/api/ciso/clearance-timeline");
              if (!timelineResponse.ok) {
                openError('Failed to get current timeline');
                return;
              }
              const timelineData = await timelineResponse.json();
              const activeTimeline = timelineData.items?.find((t: any) => t.isActive) || timelineData.timelines?.find((t: any) => t.isActive);
              
              if (!activeTimeline) {
                openError('No active timeline found');
                return;
              }
              
              setBusy(true);
              setUploadStatus("uploading");
              setUploadProgress(0);
              try {
                // Use the original uploaded CSV file
                const fileToUpload = uploadedFile;
                
                const formData = new FormData();
                formData.append("file", fileToUpload);
                formData.append("clearance_timeline_id", activeTimeline.id);

              const res = await fetch("/admin/xu-faculty-clearance/api/ciso/faculty-dump/import", {
                method: "POST",
                body: formData,
              });

              const data = await res.json().catch(() => null);
              if (!res.ok) {
                const msg = (data && (data.detail || data.message)) || SuccessErrorModalMessages.IMPORT_ERROR_FROM_API;
                openError(msg);
                setUploadStatus("error");
                try {
                  await fetch("/admin/xu-faculty-clearance/api/ciso/activity-logs", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      event_type: "faculty_data_dump_error",
                      details: [
                        `File name = ${uploadedFile.name}`,
                        `Timeline = ${selectedTimelineLabel}`,
                      ],
                    }),
                  });
                } catch {
                  // best-effort logging only
                }
                return;
              }

              try {
                await fetch("/admin/xu-faculty-clearance/api/ciso/activity-logs", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event_type: "faculty_data_dump_upload",
                    details: [
                      `File name = ${uploadedFile.name}`,
                      `Timeline = ${selectedTimelineLabel}`,
                    ],
                  }),
                });
              } catch {
                // best-effort logging only
              }

              setUploadStatus("success");
              setUploadProgress(100);
              setIsFileReady(false);
              // Reload faculty data from server
              loadFacultyData(selectedTimelineId);

              const created = data?.created_count ?? 0;
              const updated = data?.updated_count ?? 0;
              const skipped = data?.skipped_count ?? 0;
              const archiveId = data?.archive_id;
              const errors = data?.errors ?? [];

              // Format errors as skippedRows for the modal
              const formattedSkippedRows = errors.map((error: any) => ({
                rowLabel: `Row ${error.row}`,
                reason: error.message
              }));

              setCreatedCount(created);
              setUpdatedCount(updated);
              setSkippedCount(skipped);
              setSkippedRows(formattedSkippedRows);
              setSuccessOpen(true);

              // Automatically download the archived CSV if archive ID is available
              if (archiveId) {
                try {
                  const downloadRes = await fetch(`/admin/xu-faculty-clearance/api/ciso/archived-faculty/${archiveId}/download`);
                  if (downloadRes.ok) {
                    const blob = await downloadRes.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `faculty_import_results_${new Date().toISOString().slice(0, 10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }
                } catch (error) {
                  // Silently fail download - don't show error to user since import was successful
                  console.error("Failed to download archived CSV:", error);
                }
              }
            } finally {
              setBusy(false);
            }
            } catch (error) {
              console.error('Timeline fetch error:', error);
              openError('Failed to get current timeline');
            }
          }}
          onFileSelected={async (file) => {
            if (busy) return;
            try {
              // Store the file and mark as ready for upload
              setUploadedFile(file);
              setUploadStatus("idle");
              setUploadProgress(0);
              setIsFileReady(true);
            } catch (error) {
              console.error('Failed to process file:', error);
              openError('Failed to process file. Please check the file format.');
            }
          }}
          onDownloadTemplate={async () => {
            if (busy) return;
            setBusy(true);
            try {
              const res = await fetch("/admin/xu-faculty-clearance/api/ciso/faculty-dump/template");
              if (!res.ok) {
                openError(SuccessErrorModalMessages.DOWNLOAD_TEMPLATE_FAILED);
                return;
              }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "faculty_template.csv";
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch {
              openError(SuccessErrorModalMessages.DOWNLOAD_CSV_FAILED);
            } finally {
              setBusy(false);
            }
          }}
        />
       </div>

      </main>

    </div>
  );
}

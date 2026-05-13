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
  const [previewData, setPreviewData] = React.useState<SystemUser[]>([]);
  const [persistedFacultyData, setPersistedFacultyData] = React.useState<SystemUser[]>([]);
  const [hasUploadedData, setHasUploadedData] = React.useState<Record<string, boolean>>({});

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
      
      // Update the user in both preview and persisted data
      setPreviewData(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      if (getCurrentTimelineHasUploaded()) {
        const updatedData = persistedFacultyData.map(u => u.id === user.id ? updatedUser : u);
        setPersistedFacultyData(updatedData);
        // Save to localStorage
        localStorage.setItem(`facultyData_${selectedTimelineId}`, JSON.stringify(updatedData));
      }
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

      // Remove the user from both preview and persisted data
      setPreviewData(prev => prev.filter(u => u.id !== user.id));
      if (getCurrentTimelineHasUploaded()) {
        const updatedData = persistedFacultyData.filter(u => u.id !== user.id);
        setPersistedFacultyData(updatedData);
        // Save to localStorage
        localStorage.setItem(`facultyData_${selectedTimelineId}`, JSON.stringify(updatedData));
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
      openError(error instanceof Error ? error.message : 'Failed to delete faculty');
    }
  };

  const getCurrentTimelineHasUploaded = () => {
    return hasUploadedData[selectedTimelineId] || false;
  };

  const setCurrentTimelineHasUploaded = (value: boolean) => {
    setHasUploadedData(prev => ({
      ...prev,
      [selectedTimelineId]: value
    }));
  };

  const clearTimelineData = () => {
    setUploadedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setIsFileReady(false);
    setPreviewData([]);
    setPersistedFacultyData([]);
    setCurrentTimelineHasUploaded(false);
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
      setPersistedFacultyData([]);
      setPreviewData([]);
      setCurrentTimelineHasUploaded(false);
      return;
    }
    
    try {
      const response = await fetch(`/admin/xu-faculty-clearance/api/ciso/faculty-crud?clearance_timeline_id=${timelineId}`);
      
      if (!response.ok) {
        // If no faculty data exists for this timeline, clear the data
        setPersistedFacultyData([]);
        setPreviewData([]);
        setCurrentTimelineHasUploaded(false);
        // Clear localStorage for this timeline
        localStorage.removeItem(`facultyData_${timelineId}`);
        localStorage.removeItem(`hasUploaded_${timelineId}`);
        localStorage.removeItem(`previewData_${timelineId}`);
        return;
      }
      
      const data = await response.json();
      const facultyList = data.faculty || [];
      
      // Set both data states to ensure consistent display
      setPersistedFacultyData(facultyList);
      setPreviewData(facultyList);
      setCurrentTimelineHasUploaded(true);
      
      // Save to localStorage for persistence
      localStorage.setItem(`facultyData_${timelineId}`, JSON.stringify(facultyList));
      localStorage.setItem(`hasUploaded_${timelineId}`, 'true');
      localStorage.setItem(`previewData_${timelineId}`, JSON.stringify(facultyList));
    } catch (error) {
      console.error('Error loading faculty data:', error);
      // On error, clear the data to prevent inconsistencies
      setPersistedFacultyData([]);
      setPreviewData([]);
      setCurrentTimelineHasUploaded(false);
    }
  }, []);

  const selectedTimelineLabel = React.useMemo(() => {
    const found = timelines.find((t) => t.id === selectedTimelineId);
    return found?.label || selectedTimelineId || "";
  }, [timelines, selectedTimelineId]);

  // Save selected timeline to localStorage whenever it changes
  React.useEffect(() => {
    if (selectedTimelineId) {
      localStorage.setItem('lastSelectedTimeline', selectedTimelineId);
    }
  }, [selectedTimelineId]);

  // Reset faculty data when timeline changes
  React.useEffect(() => {
    setUploadedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setIsFileReady(false);
    
    // Load from API first, this will set the data and upload status
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
          // If no timeline is selected, prioritize the timeline with hasUploaded=true
          if (!selectedTimelineId && options.length) {
            // Find the timeline with hasUploaded=true (this is where the data should be)
            const timelineWithUploadedFlag = options.find(option => 
              localStorage.getItem(`hasUploaded_${option.id}`) === 'true'
            );
            
            if (timelineWithUploadedFlag) {
              setSelectedTimelineId(timelineWithUploadedFlag.id);
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

  const parseCSVFile = async (file: File): Promise<SystemUser[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            resolve([]);
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim());
          const facultyData: SystemUser[] = [];
          
          // Create a map of header to index for case-insensitive lookup
          const headerMap: { [key: string]: number } = {};
          headers.forEach((header, index) => {
            headerMap[header.toLowerCase()] = index;
          });
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= headers.length) {
              const getValue = (possibleHeaders: string[]) => {
                for (const header of possibleHeaders) {
                  const index = headerMap[header.toLowerCase()];
                  if (index !== undefined && values[index]) {
                    return values[index];
                  }
                }
                return '';
              };
              
              const faculty: SystemUser = {
                id: `preview-${i}`,
                name: `${getValue(['firstname', 'first_name'])} ${getValue(['lastname', 'last_name'])}`.trim(),
                systemId: getValue(['universityid', 'university_id', 'id']),
                userRole: 'Faculty',
                universityId: getValue(['universityid', 'university_id', 'id']),
                college: getValue(['college', 'college_code']),
                department: getValue(['department', 'department_code']),
                email: getValue(['email']),
                firstname: getValue(['firstname', 'first_name']),
                middlename: getValue(['middlename', 'middle_name']),
                lastname: getValue(['lastname', 'last_name']),
                facultytype: getValue(['facultytype', 'faculty_type']),
              };
              facultyData.push(faculty);
            }
          }
          resolve(facultyData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

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
      <main className="dashboard px-[1in] pt-4 pb-4 w-full">
        
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
          semesters={timelines}
          selectedSemesterId={selectedTimelineId}
          onSemesterChange={setSelectedTimelineId}
          selectedFile={uploadedFile}
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
          isFileReady={isFileReady}
          tableUsers={getCurrentTimelineHasUploaded() ? persistedFacultyData : previewData}
          tablePage={1}
          tablePageCount={1}
          onTablePageChange={() => {}}
          onAddFaculty={async (faculty) => {
            if (!selectedTimelineId) {
              openError('Please select a timeline first');
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
                  clearance_timeline_id: selectedTimelineId,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to create faculty');
              }

              const newFaculty = await response.json();
              
              // Add the new faculty to both preview and persisted data
              setPersistedFacultyData(prev => [...prev, newFaculty]);
              if (!getCurrentTimelineHasUploaded()) {
                setPreviewData(prev => [...prev, newFaculty]);
              }
              // Save to localStorage immediately if data has been uploaded
              if (getCurrentTimelineHasUploaded()) {
                setTimeout(() => {
                  localStorage.setItem(`facultyData_${selectedTimelineId}`, JSON.stringify([...persistedFacultyData, newFaculty]));
                }, 0);
              }
            } catch (error) {
              console.error('Error creating faculty:', error);
              openError(error instanceof Error ? error.message : 'Failed to create faculty');
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
            if (!selectedTimelineId) {
              openError(SuccessErrorModalMessages.IMPORT_SELECT_SEMESTER);
              return;
            }
            setBusy(true);
            setUploadStatus("uploading");
            setUploadProgress(0);
            try {
              // Create combined CSV data including all faculty from preview (manual + edited)
              let fileToUpload = uploadedFile;
              
              if (previewData.length > 0) {
                // Convert all faculty from preview data to CSV format
                const previewCsvRows = previewData.map(faculty => {
                  return [
                    faculty.email || '',
                    faculty.universityId || '',
                    faculty.firstname || '',
                    faculty.middlename || '',
                    faculty.lastname || '',
                    faculty.facultytype || '',
                    faculty.college || '',
                    faculty.department || ''
                  ].join(',');
                });
                
                // Create CSV with all preview data
                const headers = 'email,university_id,first_name,middle_name,last_name,faculty_type,college_code,department_code';
                const combinedCsv = [
                  headers,
                  ...previewCsvRows
                ].join('\n');
                
                // Create new file with combined data (UTF-8 encoded)
                const combinedBlob = new Blob([combinedCsv], { type: 'text/csv;charset=utf-8' });
                fileToUpload = new File([combinedBlob], uploadedFile.name, { type: 'text/csv;charset=utf-8' });
              }
              
              const formData = new FormData();
              formData.append("file", fileToUpload);
              formData.append("clearance_timeline_id", selectedTimelineId);

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
              // Move preview data to persisted data and clear preview
              setPersistedFacultyData(previewData);
              setPreviewData([]);
              setCurrentTimelineHasUploaded(true);
              // Save to localStorage
              localStorage.setItem(`facultyData_${selectedTimelineId}`, JSON.stringify(previewData));
              localStorage.setItem(`hasUploaded_${selectedTimelineId}`, 'true');

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
          }}
          onFileSelected={async (file) => {
            if (busy) return;
            if (!selectedTimelineId) {
              openError(SuccessErrorModalMessages.IMPORT_SELECT_SEMESTER);
              return;
            }
            // Store the file and parse for preview
            setUploadedFile(file);
            setUploadStatus("idle");
            setUploadProgress(0);
            setIsFileReady(true);
            
            try {
              const parsedData = await parseCSVFile(file);
              setPreviewData(parsedData);
            } catch (error) {
              console.error('Failed to parse CSV:', error);
              openError('Failed to parse CSV file. Please check the file format.');
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

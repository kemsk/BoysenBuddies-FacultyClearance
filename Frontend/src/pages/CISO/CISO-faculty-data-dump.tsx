import "../../index.css"; 
import { CISOHeader } from "../../stories/components/header";

import { FacultyDataDumpCard } from "../../stories/components/cards";

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

import {
  ErrorModal,
  SuccessErrorModalMessages,
  SuccessModal,
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
  const [successMessage, setSuccessMessage] = React.useState<React.ReactNode>("");

  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode>("");

  const openSuccess = React.useCallback((message: React.ReactNode) => {
    setSuccessMessage(message);
    setSuccessOpen(true);
  }, []);

  const openError = React.useCallback((message: React.ReactNode) => {
    setErrorMessage(message);
    setErrorOpen(true);
  }, []);

  const buildImportCompleteMessage = React.useCallback(
    (created: number, updated: number, skipped: number) => {
      return SuccessErrorModalMessages.IMPORT_COMPLETE_WITH_COUNTS
        .replace("Created: X", `Created: ${created}`)
        .replace("Updated: Y", `Updated: ${updated}`)
        .replace("Skipped: Z", `Skipped: ${skipped}`);
    },
    [],
  );

  const selectedTimelineLabel = React.useMemo(() => {
    const found = timelines.find((t) => t.id === selectedTimelineId);
    return found?.label || selectedTimelineId || "";
  }, [timelines, selectedTimelineId]);

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
          // Prefer the first active/most recent timeline if none chosen yet
          if (!selectedTimelineId && options.length) {
            setSelectedTimelineId(options[0].id);
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
  }, [selectedTimelineId]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">

      <SuccessModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        message={successMessage}
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
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Faculty Data Dump</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/CISO-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Faculty Data Dump</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/CISO-tools")}> 
              <div className="flex items-center gap-2">
                <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
              </div>
          </Button>
        </div>
      
       <div className="mt-2 space-y-3">

        <FacultyDataDumpCard
          accept=".csv,text/csv"
          semesters={timelines}
          selectedSemesterId={selectedTimelineId}
          onSemesterChange={setSelectedTimelineId}
          selectedFile={uploadedFile}
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
          isFileReady={isFileReady}
          onClearFile={() => setIsFileReady(false)}
          onRemoveFile={async () => {
            const fileName = uploadedFile?.name;
            const timelineLabel = selectedTimelineLabel;
            setUploadedFile(null);
            setUploadStatus("idle");
            setUploadProgress(0);
            setIsFileReady(false);
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
              const formData = new FormData();
              formData.append("file", uploadedFile);
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

              const created = data?.created_count ?? 0;
              const updated = data?.updated_count ?? 0;
              const skipped = data?.skipped_count ?? 0;

              openSuccess(buildImportCompleteMessage(created, updated, skipped));
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
            // Just store the file locally, don't upload yet
            setUploadedFile(file);
            setUploadStatus("idle");
            setUploadProgress(0);
            setIsFileReady(true);
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

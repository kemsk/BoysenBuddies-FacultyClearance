import * as React from "react";
import "../../index.css"; 
import { AssistantApproverHeader } from "../../stories/components/header";
import { RequestCard } from "../../stories/components/request-cards";
import { Button } from "../../stories/components/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { ErrorModal, SuccessModal } from "../../stories/components/success-and-error-modals";
import { Badge } from "../../stories/components/badge";

type ArchivedAssistantRequest = {
  id: string;
  requestId: string;
  requirementTitle?: string;
  requirementDescription?: string;  
  requirementName?: string;
  submissionNotes: string;
  submissionLink: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  approvedDate: string;
  approvedBy: string;
  remarks: string;
};


function cleanClipboardHtml(raw: string) {
  if (!raw) return "";
  return raw
    .replace(/<!--\s*StartFragment\s*-->/gi, "")
    .replace(/<!--\s*EndFragment\s*-->/gi, "")
    .replace(/<div\s+data-google-query-id=[^>]*>.*?<\/div>/gis, "")
    .trim();
}

type ArchivedAssistantItem = {
  id: string;
  employeeId: string;
  schoolId: string;
  name: string;
  fullName: string;
  schoolEmail: string;
  college: string;
  department: string;
  facultyType: string;
  status: "pending" | "approved" | "rejected";
  missingApproval: string;
  requests: ArchivedAssistantRequest[];
};

export default function AssistantApproverArchivedIndividualApproval() {
  const navigate = useNavigate();
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const timelineId = params.get("timelineId") || "";
  const archivedId = params.get("archivedId") || "";

  const [timelineName, setTimelineName] = React.useState("Archived Clearance");
  const [item, setItem] = React.useState<ArchivedAssistantItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<React.ReactNode>("");
  const [successContinue, setSuccessContinue] = React.useState<(() => void) | undefined>(undefined);
  const [error, setError] = React.useState("");
  const [remarksByRequest, setRemarksByRequest] = React.useState<Record<string, string>>({});
  const [submittingRequestId, setSubmittingRequestId] = React.useState<string>("");

  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode>("");

  const openError = React.useCallback((message: React.ReactNode) => {
    setErrorMessage(message);
    setErrorOpen(true);
  }, []);

  const loadArchivedDetail = React.useCallback(() => {
    if (!timelineId || !archivedId) {
      setLoading(false);
      setError("Missing archived clearance selection.");
      return Promise.resolve();
    }

    setLoading(true);
    return fetch(`/admin/xu-faculty-clearance/api/assistant-approver/archived-individual?timelineId=${encodeURIComponent(timelineId)}&archivedId=${encodeURIComponent(archivedId)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to load archived clearance.");
        return data as { timeline?: { name?: string }; item?: ArchivedAssistantItem };
      })
      .then((data) => {
        setTimelineName(data.timeline?.name || "Archived Clearance");
        setItem(data.item ?? null);
        setRemarksByRequest(
          Object.fromEntries(
            (data.item?.requests ?? []).map((request) => [request.requestId || request.id, request.remarks || ""]),
          )
        );
        setError("");
      })
      .catch((err: Error) => {
        setItem(null);
        setError(err.message || "Failed to load archived clearance.");
      })
      .finally(() => setLoading(false));
  }, [archivedId, timelineId]);

  React.useEffect(() => {
    void loadArchivedDetail();
  }, [loadArchivedDetail]);

  // Helper function to get CSRF token
  function getCookie(name: string): string {
    let cookieValue = "";
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleArchivedAction = React.useCallback(async (rowKey: string, requestId: string, action: "approve" | "reject") => {
    if (!requestId) {
      openError("Missing request ID.");
      return;
    }

    const remarks = String(remarksByRequest[rowKey] || "").trim();
    if (!remarks) {
      openError("Remarks is required.");
      return;
    }

    setSubmittingRequestId(rowKey);
    try {
      const response = await fetch(`/admin/xu-faculty-clearance/api/assistant-approver/archived-individual?timelineId=${encodeURIComponent(timelineId)}&archivedId=${encodeURIComponent(archivedId)}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        body: JSON.stringify({
          request_id: requestId,
          action,
          remarks,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((data && data.detail) || "Failed to update archived request.");
      }

      setSuccessMessage(`Request ${action === "approve" ? "approved" : "rejected"} successfully.`);
      setSuccessContinue(() => async () => {
        await loadArchivedDetail();
      });
      setSuccessOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update archived request.";
      openError(message);
    } finally {
      setSubmittingRequestId("");
    }
  }, [archivedId, loadArchivedDetail, remarksByRequest, timelineId]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">

      <ErrorModal open={errorOpen} onOpenChange={setErrorOpen} message={errorMessage} />
      <SuccessModal open={successOpen} onOpenChange={setSuccessOpen} message={successMessage} onContinue={successContinue} />

      <div className="header mb-3">
        <AssistantApproverHeader />
      </div>

      <main className="dashboard px-[1in] pt-4 pb-4 w-full">
        <div className="mt-3 space-y-4">
          <Breadcrumb className="mt-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/assistant-approver-archived-clearance">View Clearance Records</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/assistant-approver-view-clearance?timelineId=${encodeURIComponent(timelineId)}`}>{timelineName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{item?.fullName || item?.name || "Archived Individual"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-3 mt-2 flex items-center justify-end">
            <Button variant="back" size="back" onClick={() => navigate(`/assistant-approver-view-clearance?timelineId=${encodeURIComponent(timelineId)}`)}> 
              <div className="flex items-center gap-2">
                <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
              </div>
            </Button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-muted-foreground/20 bg-card p-6 text-black">Loading archived clearance...</div>
          ) : item ? (
            <div className="mt-2 grid grid-cols-1 gap-5 md:grid-cols-[340px_1fr] md:items-start">
              <div>
                <RequestCard
                  requestId={item.id}
                  employeeId={item.employeeId}
                  SchoolID={item.schoolId}
                  FullName={item.fullName || item.name}
                  name={item.fullName || item.name}
                  college={item.college}
                  department={item.department}
                  facultyType={item.facultyType}
                  SchoolEmail={item.schoolEmail}
                  status={item.status}
                />
              </div>

              <div className="space-y-5">
                <div className="hidden md:block">
                  <div className="overflow-hidden rounded-xl border border-muted-foreground/20 bg-card shadow">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] border-collapse text-left text-sm text-black">
                        <thead className="bg-white">
                          <tr className="border-b border-muted-foreground/20">
                            <th className="px-4 py-3 align-top text-left font-semibold w-[15%] min-w-[120px]">Requirement Title</th>
                            <th className="px-4 py-3 align-top text-left font-semibold w-[18%] min-w-[140px]">Description</th>
                            <th className="px-4 py-3 align-top text-left font-semibold w-[15%] min-w-[120px]">Submission Notes</th>
                            <th className="px-4 py-3 align-top text-center font-semibold w-[6%] min-w-[60px]">Status</th>
                            <th className="px-4 py-3 align-top text-left font-semibold w-[20%] min-w-[160px]">Review Details</th>
                            <th className="px-4 py-3 align-top text-center font-semibold w-[5%] min-w-[80px]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.requests.map((request) => {
                            const rowKey = request.requestId || request.id;
                            const requestId = request.requestId || "";
                            return (
                            <tr key={rowKey} className="border-b border-muted-foreground/20 last:border-b-0">
                              <td className="px-4 py-4 align-top font-semibold">
                                {request.requirementTitle || request.requirementName}
                              </td>
                              <td className="px-4 py-4 align-top">
                                {(() => {
                                  const html = cleanClipboardHtml(request.requirementDescription || "");
                                  if (!html) return "-";
                                  return (
                                    <div className="max-w-full break-words" dangerouslySetInnerHTML={{ __html: html }} />
                                  );
                                })()}
                              </td>
                              <td className="px-4 py-4 align-top">
                                {(() => {
                                  const html = cleanClipboardHtml(request.submissionNotes || "");
                                  if (!html) {
                                    return <div className="max-w-full break-words">No Notes Submitted</div>;
                                  }
                                  return (
                                    <div className="max-w-full break-words" dangerouslySetInnerHTML={{ __html: html }} />
                                  );
                                })()}
                                {request.submittedDate ? (
                                  <div className="text-xs text-muted-foreground">
                                    Submitted:{" "}
                                    {new Date(request.submittedDate).toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-4 py-4 align-top">
                                <Badge
                                  variant={
                                    request.status === "approved"
                                      ? "success"
                                      : request.status === "rejected"
                                        ? "destructive"
                                        : request.status === "pending"
                                          ? "warning"
                                          : "secondary"
                                  }
                                  className="font-semibold"
                                >
                                  {request.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 align-top">
                                {request.status === "pending" ? (
                                  <div>
                                    <div className="text-md font-bold text-foreground">Remarks</div>
                                    <textarea
                                      className="mt-2 w-full rounded-md border border-foreground p-3 text-sm text-black resize-none"
                                      style={{ minHeight: "88px" }}
                                      value={remarksByRequest[rowKey] ?? ""}
                                      onChange={(event) =>
                                        setRemarksByRequest((prev) => ({
                                          ...prev,
                                          [rowKey]: event.target.value,
                                        }))
                                      }
                                      onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = "auto";
                                        target.style.height = `${target.scrollHeight}px`;
                                      }}
                                      placeholder="Input your remarks here"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <div>{request.remarks || "No remarks"}</div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      Approved By: {request.approvedBy || "-"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {request.approvedDate
                                        ? new Date(request.approvedDate).toLocaleString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "-"}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="flex flex-col gap-2">
                                  {request.status === "pending" ? (
                                    <>
                                      <Button
                                        type="button"
                                        className="h-8 rounded-md bg-[hsl(var(--success))] px-3 text-xs font-semibold text-white hover:bg-[hsl(var(--success))]/90"
                                        onClick={() => void handleArchivedAction(rowKey, requestId, "approve")}
                                        disabled={!requestId || submittingRequestId === rowKey}
                                      >
                                        {submittingRequestId === rowKey ? "Processing..." : "Approve"}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        className="h-8 rounded-md px-3 text-xs font-semibold"
                                        onClick={() => void handleArchivedAction(rowKey, requestId, "reject")}
                                        disabled={!requestId || submittingRequestId === rowKey}
                                      >
                                        {submittingRequestId === rowKey ? "Processing..." : "Reject"}
                                      </Button>
                                    </>
                                  ) : (
                                    <div className="text-center text-xs text-muted-foreground">-</div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 md:hidden">
                  {item.requests.map((request) => {
                    const rowKey = request.requestId || request.id;
                    const requestId = request.requestId || "";
                    return (
                    <div key={rowKey} className="rounded-xl border border-muted-foreground/20 bg-card p-6 shadow">
                      <div className="text-xl text-center text-black font-bold mt-1">
                        {request.requirementTitle || request.requirementName || request.requestId}
                      </div>

                      <div className="mt-6">
                        <div className="text-md font-bold text-foreground">Submission Notes</div>
                        {request.status === "pending" ? (
                          <div className="mt-3">
                            <Badge variant="warning" className="font-semibold">
                              PENDING
                            </Badge>
                          </div>
                        ) : null}
                        {request.submissionNotes ? null : (
                          <div className="mt-3 text-sm text-muted-foreground">No Notes Submitted</div>
                        )}
                        <div
                          className="mt-3 rounded-md border border-foreground p-3 text-sm text-black"
                          dangerouslySetInnerHTML={{ __html: cleanClipboardHtml(request.submissionNotes || "") || "-" }}
                        />
                      </div>

                      {request.submissionLink ? (
                        <div className="mt-4">
                          <div className="text-md font-bold text-foreground">Submission Link</div>
                          <a
                            className="mt-2 block break-all text-sm text-primary underline"
                            href={request.submissionLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {request.submissionLink}
                          </a>
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-2 text-sm text-black">
                        <div>
                          <span className="font-bold">Status:</span> {request.status.toUpperCase()}
                        </div>
                        {request.submittedDate ? (
                          <div>
                            <span className="font-bold">Submitted On:</span> {request.submittedDate}
                          </div>
                        ) : null}
                        {request.approvedBy ? (
                          <div>
                            <span className="font-bold">Processed By:</span> {request.approvedBy}
                          </div>
                        ) : null}
                        {request.approvedDate ? (
                          <div>
                            <span className="font-bold">Processed On:</span> {request.approvedDate}
                          </div>
                        ) : null}
                        {request.remarks ? (
                          <div>
                            <span className="font-bold">Remarks:</span> {request.remarks}
                          </div>
                        ) : null}
                      </div>

                      {request.status === "pending" ? (
                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="text-md font-bold text-foreground">Remarks</div>
                            <textarea
                              className="mt-2 w-full rounded-md border border-foreground p-3 text-sm text-black resize-none"
                              style={{ minHeight: "88px" }}
                              value={remarksByRequest[rowKey] ?? ""}
                              onChange={(event) =>
                                setRemarksByRequest((prev) => ({
                                  ...prev,
                                  [rowKey]: event.target.value,
                                }))
                              }
                              onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height = `${target.scrollHeight}px`;
                              }}
                              placeholder="Input your remarks here"
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              type="button"
                              className="h-10 rounded-md px-5"
                              onClick={() => void handleArchivedAction(rowKey, requestId, "approve")}
                              disabled={!requestId || submittingRequestId === rowKey}
                            >
                              {submittingRequestId === rowKey ? "Processing..." : "Approve"}
                            </Button>
                            <Button
                              type="button"
                              variant="cancel"
                              className="h-10 rounded-md px-5"
                              onClick={() => void handleArchivedAction(rowKey, requestId, "reject")}
                              disabled={!requestId || submittingRequestId === rowKey}
                            >
                              {submittingRequestId === rowKey ? "Processing..." : "Reject"}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                  })}
                </div>

                {!item.requests.length ? (
                  <div className="rounded-xl border border-muted-foreground/20 bg-card p-6 text-black">
                    No archived requests found under this assistant.
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-muted-foreground/20 bg-card p-6 text-black">
              {error || "Archived clearance not found."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

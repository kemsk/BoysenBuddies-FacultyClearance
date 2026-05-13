import * as React from "react";
import "../../index.css";
import { DynamicApproverHeader } from "../../stories/components/header";
import { RequestCard } from "../../stories/components/request-cards";
import { Button } from "../../stories/components/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "../../stories/components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../stories/components/select";
import { Lock} from 'lucide-react';
import { ConfirmAlert, OverrideAlert } from "../../stories/components/alert";
import { useState } from "react";
import { ErrorModal, SuccessErrorModalMessages, SuccessModal } from "../../stories/components/success-and-error-modals";

type ArchivedApproverRequest = {
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

type ArchivedApproverItem = {
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
  requests: ArchivedApproverRequest[];
};

export default function ApproverArchivedIndividualApproval() {
  const navigate = useNavigate();
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const timelineId = params.get("timelineId") || "";
  const archivedId = params.get("archivedId") || "";

  const [timelineName, setTimelineName] = React.useState("Archived Clearance");
  const [item, setItem] = React.useState<ArchivedApproverItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState("requirementTitle");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [submittingRequestId, setSubmittingRequestId] = React.useState<string | null>(null);
  const [remarksByRequest, setRemarksByRequest] = React.useState<Record<string, string>>({});
  const [overrideRequestId, setOverrideRequestId] = React.useState<string>("");
  const [showOverrideAlert, setShowOverrideAlert] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideStatus, setOverrideStatus] = useState<'approved' | 'rejected'>('approved');
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<React.ReactNode>("");
  const [successContinue, setSuccessContinue] = React.useState<(() => void) | undefined>(undefined);
  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode>("");

  const loadArchivedDetail = React.useCallback(() => {
    if (!timelineId || !archivedId) {
      setItem(null);
      setLoading(false);
      setError("Missing archived clearance selection.");
      return Promise.resolve();
    }

    setLoading(true);
    return fetch(
      `/admin/xu-faculty-clearance/api/approver/archived-individual?timelineId=${encodeURIComponent(timelineId)}&archivedId=${encodeURIComponent(archivedId)}`,
      { credentials: "include" },
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as any).detail || "Failed to load archived clearance.");
        return data as { timeline?: { name?: string }; item?: ArchivedApproverItem };
      })
      .then((data) => {
        setTimelineName(data.timeline?.name || "Archived Clearance");
        setItem(data.item ?? null);
        setRemarksByRequest(
          Object.fromEntries(
            (data.item?.requests ?? []).map((request) => [request.requestId, request.remarks || ""]),
          ),
        );
        setError(null);
      })
      .catch((err: unknown) => {
        setItem(null);
        setError(err instanceof Error ? err.message : "Failed to load archived clearance.");
      })
      .finally(() => setLoading(false));
  }, [archivedId, timelineId]);

  React.useEffect(() => {
    void loadArchivedDetail();
  }, [loadArchivedDetail]);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => setUserProfile(data))
      .catch(() => setUserProfile(null));
  }, []);

  
  const handleArchivedAction = async (requestId: string, action: "approve" | "reject") => {
    const remarks = String(remarksByRequest[requestId] || "").trim();
    if (!remarks) {
      openError("Remarks is required.");
      return;
    }

    if (!item || !Array.isArray(item.requests) || item.requests.length === 0) {
      openError("No clearance requests found for this faculty member.");
      return;
    }

    const requestIds = item.requests
      .map((req) => req.requestId)
      .filter((id): id is string => Boolean(id));

    if (requestIds.length === 0) {
      openError("No request IDs found for this faculty member.");
      return;
    }

    setSubmittingRequestId(requestId);
    try {
      for (const id of requestIds) {
        const response = await fetch(
          `/admin/xu-faculty-clearance/api/approver/archived-individual?timelineId=${encodeURIComponent(timelineId)}&archivedId=${encodeURIComponent(archivedId)}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken") || "",
            },
            body: JSON.stringify({
              request_id: id,
              action,
              remarks,
            }),
          },
        );

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const targetReq = item.requests.find((req) => req.requestId === id);
          const targetTitle = targetReq?.requirementTitle || targetReq?.requirementName || id;
          throw new Error((data && (data as any).detail) || `Failed to ${action} "${targetTitle}".`);
        }
      }

      const facultyEmployeeId = item.employeeId || "No Employee ID";
      const requestItemName = item.fullName || item.name || "";
      const requirementTitles = item.requests
        .map((req) => req.requirementTitle || req.requirementName || req.requestId)
        .filter((v): v is string => Boolean(v));
      const requirementsSummary = requirementTitles.join(", ");

      const targetUserIdRaw = item?.id;
      const targetUserId = targetUserIdRaw ? parseInt(String(targetUserIdRaw), 10) : null;
      const sessionUserIdRaw = (userProfile as any)?.id;
      const sessionUserId = sessionUserIdRaw ? parseInt(String(sessionUserIdRaw), 10) : null;

      const eventType = action === "approve" ? "approved_clearance" : "rejected_clearance";
      const details: string[] = [
        `Faculty Member: ${requestItemName}`,
        `Employee ID: ${facultyEmployeeId}`,
        `Requirements: ${requirementsSummary || "(none)"}`,
        `Remarks: ${remarks}`,
      ];

      void (async () => {
        try {
          const isAssistantApprover = window.location.pathname.includes("/assistant-approver");
          const userRole = isAssistantApprover ? "Assistant" : "Approver";
          const userOffice = userProfile?.roles_payload?.[0]?.office || null;

          const logResponse = await fetch("/admin/xu-faculty-clearance/api/approver/activity-logs", {
            method: "POST",
            credentials: "include",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken") || "",
            },
            body: JSON.stringify({
              event_type: eventType,
              details,
              department: item?.department || null,
              college: item?.college || null,
              office: userOffice,
              university_id: facultyEmployeeId,
              request_id: requestId,
              user_role: userRole,
            }),
          });

          if (!logResponse.ok) {
            console.warn(
              "[activity-log] archived approve/reject POST failed:",
              logResponse.status,
              await logResponse.text(),
            );
          }
        } catch (e) {
          console.warn("[activity-log] archived approve/reject POST error:", e);
        }
      })();

      void (async () => {
        try {
          const notifResponse = await fetch("/admin/xu-faculty-clearance/api/faculty/notifications", {
            method: "POST",
            credentials: "include",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken") || "",
            },
            body: JSON.stringify({
              ...(targetUserId ? { user_id: targetUserId } : {}),
              ...(sessionUserId ? { approver_id: sessionUserId, created_by_id: sessionUserId } : {}),
              title: action === "approve" ? "Submission Approved" : "Submission Rejected",
              status: action === "approve" ? "approved" : "rejected",
              body:
                action === "approve"
                  ? "Your submission has been APPROVED.\n\n" +
                    `Faculty Member: ${requestItemName}\n\n` +
                    `Requirements: ${requirementsSummary || "(none)"}\n\n` +
                    "Remarks:\n" +
                    `${remarks}`
                  : "Your submission has been REJECTED.\n\n" +
                    `Faculty Member: ${requestItemName}\n\n` +
                    `Requirements: ${requirementsSummary || "(none)"}\n\n` +
                    "Remarks:\n" +
                    `${remarks}`,
              details: [
                `Faculty Member = ${requestItemName}`,
                `Employee ID = ${facultyEmployeeId}`,
                `Requirements = ${requirementsSummary || "(none)"}`,
                `Remarks = ${remarks}`,
              ],
              user_role: "Approver",
              is_read: false,
            }),
          });

          if (!notifResponse.ok) {
            console.warn(
              "[notification] archived approve/reject POST failed:",
              notifResponse.status,
              await notifResponse.text(),
            );
          }
        } catch (e) {
          console.warn("[notification] archived approve/reject POST error:", e);
        }
      })();

      await loadArchivedDetail();
      openSuccess(
        action === "approve"
          ? SuccessErrorModalMessages.REQUEST_APPROVED
          : SuccessErrorModalMessages.REQUEST_REJECTED,
      );
    } catch (err) {
      console.error(`Error ${action}ing:`, err);
      openError(
        action === "approve"
          ? SuccessErrorModalMessages.REQUEST_APPROVE_FAILED
          : SuccessErrorModalMessages.REQUEST_REJECT_FAILED,
      );
    } finally {
      setSubmittingRequestId(null);
    }
  };

  // Helper function to get CSRF token
  function getCookie(name: string): string {
    let cookieValue = "";
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const openSuccess = (message: React.ReactNode, onContinue?: () => void) => {
    setSuccessMessage(message);
    setSuccessContinue(() => onContinue);
    setSuccessOpen(true);
  };

  const openError = (message: React.ReactNode) => {
    setErrorMessage(message);
    setErrorOpen(true);
  };

  const handleOverride = async () => {
    if (!item || !overrideRequestId || !overrideReason.trim()) {
      setError("Override reason is required");
      return;
    }

    // Close dialogs immediately when saving starts
    setShowOverrideAlert(false);
    setShowConfirmAlert(false);
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/approver/override", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        body: JSON.stringify({
          request_id: overrideRequestId,
          status: overrideStatus,
          reason: overrideReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Failed to override: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Override successful:", result);

      // Create activity log entries in the background for override actions
      void (async () => {
        try {
          const facultyDepartment = item.department || null;
          const facultyCollege = item.college || null;
          const facultyEmployeeId = item.employeeId || "None";
          const requestIdValue = overrideRequestId;
          const facultyNameValue = item.name || item.fullName || "";
          const userOffice = userProfile?.roles_payload?.[0]?.office || null;

          const isAssistantApprover = window.location.pathname.includes("/assistant-approver");
          const userRole = isAssistantApprover ? "Assistant" : "Approver";

          const eventType =
            overrideStatus === "rejected"
              ? "overridden_rejected_clearance"
              : "overridden_approved_clearance";

          const details: string[] = [
            `Faculty Member: ${facultyNameValue}`,
            `Employee ID: ${facultyEmployeeId}`,
            `Override Status: ${overrideStatus}`,
            `Reason: ${overrideReason}`,
          ];

          if (isAssistantApprover && userProfile) {
            const assistantName = `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim();
            details.push(`Assistant: ${assistantName || userProfile.email || ""}`.trim());
          }

          const logResponse = await fetch("/admin/xu-faculty-clearance/api/approver/activity-logs", {
            method: "POST",
            credentials: "include",
            keepalive: true,
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken") || "",
            },
            body: JSON.stringify({
              event_type: eventType,
              details,
              department: facultyDepartment,
              college: facultyCollege,
              office: userOffice,
              university_id: facultyEmployeeId,
              request_id: requestIdValue,
              user_role: userRole,
            }),
          });

          if (!logResponse.ok) {
            console.warn(
              "[activity-log] Override activity log POST failed:",
              logResponse.status,
              await logResponse.text(),
            );
          }
        } catch (e) {
          console.warn("[activity-log] Override activity log POST error:", e);
        }
      })();

      // Reset override state
      setOverrideReason("");
      setOverrideStatus('approved');
      setOverrideRequestId("");

      // Refresh the request data
      await loadArchivedDetail();

      openSuccess(SuccessErrorModalMessages.REQUEST_APPROVED);

    } catch (err) {
      console.error("Error overriding:", err);
      setError(err instanceof Error ? err.message : "Failed to override request");
      openError(SuccessErrorModalMessages.REQUEST_APPROVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const filteredRequests = React.useMemo(() => {
    if (!item) return [];
    
    let filtered = item.requests;
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => {
        if (statusFilter === "pending") return r.status === "pending";
        if (statusFilter === "approved") return r.status === "approved";
        if (statusFilter === "rejected") return r.status === "rejected";
        return true;
      });
    }
    
    // Sort by selected field
    const sorted = [...filtered];
    switch (sortBy) {
      case "requirementTitle":
        return sorted.sort((a, b) => (a.requirementTitle || a.requirementName || "").localeCompare(b.requirementTitle || b.requirementName || ""));
      case "status":
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      case "submittedDate":
        return sorted.sort((a, b) => a.submittedDate.localeCompare(b.submittedDate));
      default:
        return sorted;
    }
  }, [item, sortBy, statusFilter]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">

      <ErrorModal open={errorOpen} onOpenChange={setErrorOpen} message={errorMessage} />

      <div className="header mb-3">
        <DynamicApproverHeader />
      </div>

      <main className="dashboard px-4 md:px-6 lg:px-[1in] pt-4 pb-4 w-full">
        <div className="mt-3 space-y-4">
          <Breadcrumb className="mt-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/approver-archived-clearance">View Clearance Records</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/approver-view-clearance?timelineId=${encodeURIComponent(timelineId)}`}>{timelineName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{item?.fullName || item?.name || "Individual Record"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-3 mt-2 flex items-center justify-end">
            <Button variant="back" size="back" onClick={() => navigate(`/approver-view-clearance?timelineId=${encodeURIComponent(timelineId)}`)}>
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
                <div className="w-full flex flex-col sm:flex-row gap-3 justify-start mt-5">
                  <div className="flex flex-wrap gap-3">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger variant="pill" className="w-max gap-2">
                        <span>Sort by :</span>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requirementTitle">Requirement Title</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="submittedDate">Submitted Date</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger variant="pill" className="w-max gap-2">
                        <span>Status :</span>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                        {filteredRequests.map((request) => (
                          <tr key={request.id} className="border-b border-muted-foreground/20 last:border-b-0">
                            <td className="px-4 py-4 align-top font-semibold">
                              {request.requirementTitle || request.requirementName}
                            </td>
                            <td className="px-4 py-4 align-top">
                              {(() => {
                                const html = cleanClipboardHtml(request.requirementDescription || "");
                                if (!html) return "-";
                                return (
                                  <div
                                    className="max-w-full break-words"
                                    dangerouslySetInnerHTML={{ __html: html }}
                                  />
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
                                  <div
                                    className="max-w-full break-words"
                                    dangerouslySetInnerHTML={{ __html: html }}
                                  />
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
                                    value={remarksByRequest[request.requestId] ?? ""}
                                    onChange={(event) =>
                                      setRemarksByRequest((prev) => ({
                                        ...prev,
                                        [request.requestId]: event.target.value,
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
                                  <div>
                                  {request.remarks || "No remarks"}
                                  </div>
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
                                : "-"} </div>
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
                                      onClick={() => void handleArchivedAction(request.requestId, "approve")}
                                      disabled={submittingRequestId === request.requestId}
                                    >
                                      {submittingRequestId === request.requestId ? "Processing..." : "Approve"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      className="h-8 rounded-md px-3 text-xs font-semibold"
                                      onClick={() => void handleArchivedAction(request.requestId, "reject")}
                                      disabled={submittingRequestId === request.requestId}
                                    >
                                      {submittingRequestId === request.requestId ? "Processing..." : "Reject"}
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="default"
                                    className="flex h-auto items-center rounded-md px-3 text-xs py-3 "
                                    onClick={() => {
                                      setOverrideRequestId(request.requestId);
                                      setShowOverrideAlert(true);
                                    }}
                                  >
                                    <Lock className="h-4 w-4" />
                                    Override Status
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 md:hidden">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="rounded-xl border border-muted-foreground/20 bg-card p-6 shadow">
                      <div className="text-xl text-center text-black font-bold mt-1">{request.requirementTitle || request.requirementName || request.requestId}</div>

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
                        <a className="mt-2 block break-all text-sm text-primary underline" href={request.submissionLink} target="_blank" rel="noreferrer">
                          {request.submissionLink}
                        </a>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-2 text-sm text-black">
                      <div><span className="font-bold">Status:</span> {request.status.toUpperCase()}</div>
                      {request.submittedDate ? <div><span className="font-bold">Submitted On:</span> {request.submittedDate}</div> : null}
                      {request.approvedBy ? <div><span className="font-bold">Processed By:</span> {request.approvedBy}</div> : null}
                      {request.approvedDate ? <div><span className="font-bold">Processed On:</span> {request.approvedDate}</div> : null}
                      {request.remarks ? <div><span className="font-bold">Remarks:</span> {request.remarks}</div> : null}
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="text-md font-bold text-foreground">Remarks</div>
                        <textarea
                          className="mt-2 w-full rounded-md border border-foreground p-3 text-sm text-black resize-none"
                          style={{ minHeight: "88px" }}
                          value={remarksByRequest[request.requestId] ?? ""}
                          onChange={(event) =>
                            setRemarksByRequest((prev) => ({
                              ...prev,
                              [request.requestId]: event.target.value,
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
                          variant="default"
                          className="flex items-center gap-2"
                          onClick={() => {
                            setOverrideRequestId(request.requestId);
                            setShowOverrideAlert(true);
                          }}
                        >
                          <Lock className="w-4 h-4" />
                          Override Status
                        </Button>
                      </div>
                    </div>
                    </div>
                  ))}
                </div>
              </div>

              {!item.requests.length ? (
                <div className="rounded-xl border border-muted-foreground/20 bg-card p-6 text-black">
                  No archived requests found under this approver.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-muted-foreground/20 bg-card p-6 text-black">
              {error || "Archived clearance not found."}
            </div>
          )}
        </div>
      </main>

      {/* Override Dialogs */}
      {showOverrideAlert && !showConfirmAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <OverrideAlert
              open={showOverrideAlert}
              status={overrideStatus}
              requestId={item?.id || ""}
              onStatusChange={setOverrideStatus}
              onDelete={() => {
                console.log("Override confirmed:", overrideStatus);
                setShowOverrideAlert(false);
              }}
              onCancel={() => setShowOverrideAlert(false)}
              onConfirm={(reason: string) => {
                setOverrideReason(reason);
                setShowConfirmAlert(true);
              }}
            />
          </div>
        </div>
      )}

      {showConfirmAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <ConfirmAlert
              open={showConfirmAlert}
              reason={overrideReason}
              onDelete={(emailInput?: string) => {
                const entered = (emailInput || "").toLowerCase().trim();
                const approverEmail = (userProfile?.user?.email || userProfile?.email || "").toLowerCase().trim();

                if (!approverEmail || entered !== approverEmail) {
                  setError("Please enter your XU email to confirm the override");
                  return;
                }

                console.log("Confirmed override with email:", entered);
                setShowConfirmAlert(false);
                handleOverride();
              }}
              onCancel={() => setShowConfirmAlert(false)}
            />
          </div>
        </div>
      )}

      {/* Success/Error Modals */}
      <SuccessModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        message={successMessage}
        onContinue={successContinue}
      />

      <ErrorModal
        open={errorOpen}
        onOpenChange={setErrorOpen}
        message={errorMessage}
      />

      {error && (
        <div className="fixed bottom-4 right-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm max-w-sm">
          {error}
        </div>
      )}

      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Saving...</span>
          </div>
        </div>
      )}
    </div>
  );
}
                      

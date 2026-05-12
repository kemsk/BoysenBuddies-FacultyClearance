import * as React from "react";
import { Check, ChevronLeft, ChevronRight, Download, Pencil, Plus, Trash2, Upload, X, ArrowBigLeft, ArrowBigRight, UserCheck, UserMinus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../components/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { ApproveConfirmDialog, RejectAlertDialog } from "./clearance-action-dialogs";
import { Divider } from "./divider";
import { DeactivateAlert, ActivateAlert, DeleteAlert } from "./alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { CommentDialog } from "./dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { InputGroupWithAddon } from "./input-group";

import {
  ErrorModal,
  SuccessModal,
  SuccessErrorModalMessages,
} from "./success-and-error-modals";

export type ClearanceRequestItem = {
    
  id: string;
  name: string;
  requestId: string;
  employeeId: string;
  college: string;
  department: string;
  facultyType: string;
  requirementTitle?: string;
  status: ClearanceRequestStatus;

};

export type ClearanceRequestStatus = "pending" | "approved" | "rejected";

export type ClearanceRequestsCardProps = {

  items: ClearanceRequestItem[];
  className?: string;
  getItemHref?: (item: ClearanceRequestItem) => string;

};

function getClearanceStatusBadgeVariant(status: ClearanceRequestStatus) {

  if (status === "approved") return "success" as const;
  if (status === "rejected") return "destructive" as const;
  return "warning" as const;
}

export function ClearanceRequestsCard({
  items,
  className,
  getItemHref,
}: ClearanceRequestsCardProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [loading, setLoading] = React.useState(false);
  const [bulkAction, setBulkAction] = React.useState<"approve" | "reject" | null>(null);

  const [successOpen, setSuccessOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<React.ReactNode>("");
  const [successContinue, setSuccessContinue] = React.useState<(() => void) | undefined>(undefined);

  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode>("");

  const openSuccess = React.useCallback((message: React.ReactNode, onContinue?: () => void) => {
    setSuccessMessage(message);
    setSuccessContinue(() => onContinue);
    setSuccessOpen(true);
  }, []);

  const openError = React.useCallback((message: React.ReactNode) => {
    setErrorMessage(message);
    setErrorOpen(true);
  }, []);

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;

    const selectedIdsSnapshot = Array.from(selectedIds);

    setLoading(true);
    setBulkAction("approve");

    try {
      const isAssistantApprover = window.location.pathname.includes('/assistant-approver');
      console.log("[DEBUG] Is assistant approver:", isAssistantApprover);
      const actionEndpoint = isAssistantApprover ? "/admin/xu-faculty-clearance/api/assistant-approver/clearance" : "/admin/xu-faculty-clearance/api/approver/action";

      const response = await fetch(actionEndpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        body: JSON.stringify({
          request_ids: selectedIdsSnapshot,
          action: "approve",
          remarks: "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `Failed to approve: ${response.statusText}`;
        if (errorData.detail) {
          throw new Error(`Failed to approve: ${errorData.detail}`);
        } else if (errorData.message) {
          throw new Error(`Failed to approve: ${errorData.message}`);
        } else {
          throw new Error(`Failed to approve: ${response.statusText}`);
        }
      }

      openSuccess(SuccessErrorModalMessages.REQUEST_APPROVED, () => window.location.reload());

      (async () => {
        try {
          const result = await response.json();
          console.log("Bulk approve successful:", result);
        } catch {
          // ignore
        }
      })();

      if (isAssistantApprover) return;

      (async () => {
        try {
          const profileResponse = await fetch("/admin/xu-faculty-clearance/api/approver/profile", {
            credentials: "include",
          });

          console.log("[DEBUG] Profile response status:", profileResponse.status);
          const userProfile = profileResponse.ok ? await profileResponse.json() : null;
          console.log("[DEBUG] User profile:", userProfile);

          const isAssistantApprover = window.location.pathname.includes('/assistant-approver');
          console.log("[DEBUG] Is assistant approver:", isAssistantApprover);

          const activityPromises = selectedIdsSnapshot.map(async (requestId) => {
            const requestItem = items.find(item => item.id === requestId);
            if (!requestItem) return null;

            console.log("[DEBUG] requestItem:", requestItem);

            const facultyDepartment = requestItem.department || null;
            const facultyCollege = requestItem.college || null;
            const facultyEmployeeId = requestItem.employeeId || "No Employee ID";
            const userOffice = userProfile?.roles_payload?.[0]?.office || null;
            const eventType = "approved_clearance";

            let details = [
              `Faculty Member: ${requestItem.name}`,
              `Employee ID: ${facultyEmployeeId}`,
              `Remarks: Bulk approval`
            ];

            if (isAssistantApprover && userProfile) {
              details.push(`Assistant: ${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.email);
            }

            console.log("[DEBUG] Extracted data:", {
              facultyDepartment,
              facultyCollege,
              facultyEmployeeId,
              userOffice,
              userProfileExists: !!userProfile,
              profileRoles: userProfile?.roles_payload,
              isAssistantApprover,
              eventType
            });

            const activityPayload = {
              event_type: eventType,
              details: details,
              department: facultyDepartment,
              college: facultyCollege,
              office: userOffice,
              university_id: facultyEmployeeId,
              request_id: requestId,
              user_role: "Approver",
            };

            console.log("[DEBUG] Activity payload:", activityPayload);
            const activityResponse = await fetch("/admin/xu-faculty-clearance/api/approver/activity-logs", {
              method: "POST",
              credentials: "include",
              keepalive: true,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(activityPayload),
            });

            console.log("[DEBUG] Activity log response status:", activityResponse.status);

            if (!activityResponse.ok) {
              const errorText = await activityResponse.text();
              console.error("[DEBUG] Activity log error response:", errorText);
            }

            return activityResponse;
          });

          await Promise.all(activityPromises);
        } catch (logError) {
          console.error("Failed to log bulk approval activity:", logError);
        }
      })();
    } catch (err) {
      console.error("Error approving:", err);
      openError(SuccessErrorModalMessages.REQUEST_APPROVE_FAILED);
    } finally {
      setLoading(false);
      setBulkAction(null);
    }
  };

  const handleBulkReject = async (reason: string) => {
    if (selectedIds.size === 0) return;

    const selectedIdsSnapshot = Array.from(selectedIds);

    setLoading(true);
    setBulkAction("reject");

    try {
      const isAssistantApprover = window.location.pathname.includes('/assistant-approver');
      console.log("[DEBUG] Is assistant approver:", isAssistantApprover);
      const actionEndpoint = isAssistantApprover ? "/admin/xu-faculty-clearance/api/assistant-approver/clearance" : "/admin/xu-faculty-clearance/api/approver/action";

      const response = await fetch(actionEndpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        body: JSON.stringify({
          request_ids: selectedIdsSnapshot,
          action: "reject",
          remarks: reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || `Failed to reject: ${response.statusText}`;
        if (errorData.detail) {
          throw new Error(`Failed to reject: ${errorData.detail}`);
        } else if (errorData.message) {
          throw new Error(`Failed to reject: ${errorData.message}`);
        } else {
          throw new Error(`Failed to reject: ${response.statusText}`);
        }
      }

      openSuccess(SuccessErrorModalMessages.REQUEST_REJECTED, () => window.location.reload());

      (async () => {
        try {
          const result = await response.json();
          console.log("Bulk reject successful:", result);
        } catch {
          // ignore
        }
      })();

      if (isAssistantApprover) {
        (async () => {
          try {
            console.log("[notification] Creating bulk Submission Rejected notifications:", {
              selectedCount: selectedIdsSnapshot.length,
              reason,
              actor: "assistant",
            });

            const notificationPromises = selectedIdsSnapshot.map(async (requestId) => {
              const requestItem = items.find((item) => item.id === requestId);
              if (!requestItem) return null;

              const requirementTitle = String(requestItem.requirementTitle || "");
              const trimmedRemarks = String(reason || "").trim();
              const userRole = "Assistant";
              const notifResponse = await fetch("/admin/xu-faculty-clearance/api/faculty/notifications", {
                method: "POST",
                credentials: "include",
                keepalive: true,
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify({
                  title: "Submission Rejected",
                  status: "rejected",
                  body: (
                    "Your submission has been REJECTED.\n\n" +
                    `Submission of ${requirementTitle}\n\n` +
                    "Remarks:\n" +
                    `${trimmedRemarks}`
                  ),
                  details: [
                    `Requirement = \"${requirementTitle}\"`,
                    `Remarks = ${trimmedRemarks}`,
                  ],
                  user_role: userRole,
                  is_read: false,
                }),
              });

              if (!notifResponse.ok) {
                console.warn(
                  "[notification] Submission Rejected POST failed:",
                  notifResponse.status,
                  await notifResponse.text(),
                );
              } else {
                console.log("[notification] Submission Rejected created successfully");
              }

              return notifResponse;
            });

            await Promise.all(notificationPromises);
          } catch (e) {
            console.warn("[notification] Bulk Submission Rejected POST error:", e);
          }
        })();
        return;
      }

      (async () => {
        try {
          console.log("[notification] Creating bulk Submission Rejected notifications:", {
            selectedCount: selectedIdsSnapshot.length,
            reason,
            actor: "approver",
          });

          const notificationPromises = selectedIdsSnapshot.map(async (requestId) => {
            const requestItem = items.find((item) => item.id === requestId);
            if (!requestItem) return null;

            const requirementTitle = String(requestItem.requirementTitle || "");
            const trimmedRemarks = String(reason || "").trim();
            const userRole = "Approver";
            const notifResponse = await fetch("/admin/xu-faculty-clearance/api/faculty/notifications", {
              method: "POST",
              credentials: "include",
              keepalive: true,
              headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
              },
              body: JSON.stringify({
                title: "Submission Rejected",
                status: "rejected",
                body: (
                  "Your submission has been REJECTED.\n\n" +
                  `Submission of ${requirementTitle}\n\n` +
                  "Remarks:\n" +
                  `${trimmedRemarks}`
                ),
                details: [
                  `Requirement = \"${requirementTitle}\"`,
                  `Remarks = ${trimmedRemarks}`,
                ],
                user_role: userRole,
                is_read: false,
              }),
            });

            if (!notifResponse.ok) {
              console.warn(
                "[notification] Submission Rejected POST failed:",
                notifResponse.status,
                await notifResponse.text(),
              );
            } else {
              console.log("[notification] Submission Rejected created successfully");
            }

            return notifResponse;
          });

          await Promise.all(notificationPromises);
        } catch (e) {
          console.warn("[notification] Bulk Submission Rejected POST error:", e);
        }

        try {
          const profileResponse = await fetch("/admin/xu-faculty-clearance/api/approver/profile", {
            credentials: "include",
          });

          const userProfile = await profileResponse.json();

          const isAssistantApprover = window.location.pathname.includes('/assistant-approver');
          console.log("[DEBUG] Is assistant approver (reject):", isAssistantApprover);

          const activityPromises = selectedIdsSnapshot.map(async (requestId) => {
            const requestItem = items.find(item => item.id === requestId);
            if (!requestItem) return null;

            console.log("[DEBUG] requestItem (reject):", requestItem);

            const facultyDepartment = requestItem.department || null;
            const facultyCollege = requestItem.college || null;
            const facultyEmployeeId = requestItem.employeeId || "No Employee ID";
            const userOffice = userProfile?.roles_payload?.[0]?.office || null;
            const eventType = "rejected_clearance";

            console.log("[DEBUG] Extracted data (reject):", {
              facultyDepartment,
              facultyCollege,
              facultyEmployeeId,
              userOffice,
              eventType
            });

            let details = [
              `Faculty Member: ${requestItem.name}`,
              `Employee ID: ${facultyEmployeeId}`,
              `Remarks: ${reason}`
            ];

            if (isAssistantApprover && userProfile) {
              details.push(`Assistant: ${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.email);
            }

            return fetch("/admin/xu-faculty-clearance/api/approver/activity-logs", {
              method: "POST",
              credentials: "include",
              keepalive: true,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event_type: eventType,
                details: details,
                department: facultyDepartment,
                college: facultyCollege,
                office: userOffice,
                university_id: facultyEmployeeId,
                request_id: requestId,
                user_role: "Approver",
              }),
            });
          });

          await Promise.all(activityPromises);
        } catch (logError) {
          console.error("Failed to log bulk rejection activity:", logError);
        }
      })();
    } catch (err) {
      console.error("Error rejecting:", err);
      openError(SuccessErrorModalMessages.REQUEST_REJECT_FAILED);
    } finally {
      setLoading(false);
      setBulkAction(null);

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

  return (
    <>
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

      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-0">
          <div className="hidden lg:block">
            <div className="flex items-center gap-3 border-b px-4 py-4">
              <Checkbox
                variant="primary"
                checked={allSelected}
                onCheckedChange={(v) => {
                  if (v) {
                    setSelectedIds(new Set(items.map((i) => i.id)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
              />

              <div className="text-sm font-bold text-primary">Select All</div>
              {selectedIds.size > 0 ? (
                <div className="ml-auto flex items-center gap-2">
                  <RejectAlertDialog
                    count={selectedIds.size}
                    trigger={
                      <Button
                        type="button"
                        variant="destructive"
                        className="h-8 rounded-md px-3 text-sm font-semibold"
                        disabled={loading}
                      >
                        <div className="flex items-center gap-2">
                          {loading && bulkAction === "reject" ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          <div>{loading && bulkAction === "reject" ? "Rejecting..." : "Reject"}</div>
                        </div>
                      </Button>

                    }
                    onReject={handleBulkReject}

                  />
                  <ApproveConfirmDialog
                    count={selectedIds.size}
                    trigger={
                      <Button
                        type="button"
                        className="h-8 rounded-md bg-[hsl(var(--success))] px-3 text-sm font-semibold text-white hover:bg-[hsl(var(--success))]/90"
                        disabled={loading}
                      >
                        <div className="flex items-center gap-2">
                          {loading && bulkAction === "approve" ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          <div>{loading && bulkAction === "approve" ? "Approving..." : "Approve"}</div>
                        </div>
                      </Button>
                    }
                    onApprove={handleBulkApprove}
                  />
                </div>
              ) : null}
            </div>
            <div>
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="w-12 px-2 py-3 text-center min-w-[48px]" />
                    <th className="px-2 py-3 text-left text-sm font-bold text-primary w-[20%] min-w-[150px]">Name</th>
                    <th className="px-2 py-3 text-left text-sm font-bold text-primary w-[15%] min-w-[120px]">Request ID</th>
                    <th className="px-2 py-3 text-left text-sm font-bold text-primary w-[12%] min-w-[100px]">Employee ID</th>
                    <th className="px-2 py-3 text-left text-sm font-bold text-primary w-[15%] min-w-[120px]">College</th>
                    <th className="px-2 py-3 text-left text-sm font-bold text-primary w-[15%] min-w-[120px]">Department</th>
                    <th className="px-2 py-3 text-left text-sm font-bold text-primary w-[12%] min-w-[100px]">Faculty Type</th>
                    <th className="px-2 py-3 text-left text-sm font-bold text-primary w-[15%] min-w-[120px]">Requirement</th>
                    <th className="px-2 py-3 pr-6 text-center text-sm font-bold text-primary w-[8%] min-w-[80px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="w-12 px-2 py-4 align-middle">
                        <div className="flex justify-center">
                          <Checkbox
                            variant="primary"
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-4 align-top text-left text-sm font-semibold text-gray-900 break-words">
                        {getItemHref ? (
                          <Link to={getItemHref(item)} className="hover:underline">
                            {item.name}
                          </Link>
                        ) : (
                          item.name
                        )}
                      </td>
                      <td className="px-2 py-4 align-top text-left text-sm text-gray-900 break-all">{item.requestId}</td>
                      <td className="px-2 py-4 align-top text-left text-sm text-gray-900 break-all">{item.employeeId}</td>
                      <td className="px-2 py-4 align-top text-left text-sm text-gray-900 break-words">{item.college}</td>
                      <td className="px-2 py-4 align-top text-left text-sm text-gray-900 break-words">{item.department}</td>
                      <td className="px-2 py-4 align-top text-left text-sm text-gray-900 break-words">{item.facultyType}</td>
                      <td className="px-2 py-4 align-top text-left text-sm text-gray-900 break-words">{item.requirementTitle || ""}</td>
                      <td className="px-2 py-4 pr-6 align-top text-center ">
                        <Badge
                          variant={getClearanceStatusBadgeVariant(item.status)}
                          className="px-3 py-1 text-xs font-bold"
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="lg:hidden">
            <div className="flex">
              <Divider orientation="vertical" className="h-auto self-stretch " />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 border-b px-4 py-4">
                  <div className="w-10 flex items-center justify-center">
                    <Checkbox
                      variant="primary"
                      checked={allSelected}
                      onCheckedChange={(v) => {
                        if (v) {
                          setSelectedIds(new Set(items.map((i) => i.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </div>
                  <div className="text-sm font-bold text-primary">Select All</div>
                  {selectedIds.size > 0 ? (
                    <div className="ml-auto flex items-center gap-2">
                      <RejectAlertDialog
                        count={selectedIds.size}
                        trigger={
                          <Button
                            type="button"
                            variant="destructive"
                            className="h-7 rounded-md px-3 text-sm font-semibold"
                            disabled={loading}
                          >
                            <div className="flex items-center gap-2">
                              {loading && bulkAction === "reject" ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              <div>{loading && bulkAction === "reject" ? "Rejecting..." : "Reject"}</div>
                            </div>
                          </Button>
                        }
                        onReject={handleBulkReject}
                      />

                      <ApproveConfirmDialog
                        count={selectedIds.size}
                        trigger={
                          <Button
                            type="button"
                            className="h-7 rounded-l bg-[hsl(var(--success))] px-2 text-sm font-semibold text-white hover:bg-[hsl(var(--success))]/90"
                            disabled={loading}
                          >
                            <div className="flex items-center gap-2">
                              {loading && bulkAction === "approve" ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              <div>{loading && bulkAction === "approve" ? "Approving..." : "Approve"}</div>
                            </div>
                          </Button>
                        }
                        onApprove={handleBulkApprove}
                      />
                    </div>
                  ) : null}
                </div>

                <Divider color="border-[hsl(var(--gray-border))]" />

                <div>
                  {items.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      <div className="flex gap-3 px-4 py-6">
                        <div className="w-10 flex justify-center pt-1">
                          <Checkbox
                            variant="primary"
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);

                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {getItemHref ? (
                                <Link
                                  to={getItemHref(item)}
                                  className="truncate text-left text-2xl font-bold text-primary"
                                >
                                  {item.name}
                                </Link>
                              ) : (
                                <div className="truncate text-left text-2xl font-bold text-primary">
                                  {item.name}
                                </div>
                              )}
                            </div>
                            <div className="shrink-0">
                              <Badge
                                variant={getClearanceStatusBadgeVariant(item.status)}
                                className="px-3 py-1 text-xs font-bold"
                              >
                                {item.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-[88px_1fr] gap-x-3 gap-y-1 text-sm">
                            <div className="font-bold text-gray-900">Request ID</div>
                            <div className="text-gray-900">{item.requestId}</div>
                            <div className="font-bold text-gray-900">Employee ID</div>
                            <div className="text-gray-900">{item.employeeId}</div>
                            <div className="font-bold text-gray-900">College</div>
                            <div className="text-gray-900">{item.college}</div>
                            <div className="font-bold text-gray-900">Department</div>
                            <div className="text-gray-900">{item.department}</div>
                            <div className="font-bold text-gray-900">Faculty Type</div>
                            <div className="text-gray-900">{item.facultyType}</div>
                          </div>
                        </div>
                      </div>
                      {idx < items.length - 1 ? (
                        <Divider color="border-[hsl(var(--gray-border))]" />
                      ) : null}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <Divider orientation="vertical" className="h-auto self-stretch" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>

  );

}

export type RequestCardProps = {
  requestId?: string;
  employeeId?: string;
  name?: string;
  college?: string;
  department?: string;
  facultyType?: string;
  SchoolID?: string;
  FullName?: string;
  SchoolEmail?: string;
  status?: "pending" | "approved" | "rejected";
  className?: string;
  onApprove?: () => void
  onReject?: () => void;
  onViewDetails?: () => void;
};

export function RequestCard({

  requestId,
  employeeId,
  SchoolID,
  FullName,
  name,
  college,
  department,
  facultyType,
  SchoolEmail,
  className,
  onApprove,
  onReject,
  onViewDetails,
}: RequestCardProps) {

  const getStatusVariant = (status: string) => {
    if (status === "approved") return "success" as const;
    if (status === "rejected") return "destructive" as const;
    return "warning" as const;

  };

  const getStatusText = (status: string) => {
    return status.toUpperCase();
  };

  return (
    <Card className={cn("overflow-hidden border-muted-foreground/20", className)}>
      <CardContent className="p-0">
        <div className="flex">
          <Divider orientation="vertical" className="h-auto self-stretch" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 px-4 py-6 bg-primary">
              <div className="min-w-0 flex-1 text-white font-bold text-center text-2xl">
                {name}
              </div>
            </div>
            <div className=" grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-sm p-6">
              <div className="font-bold text-gray-900">School ID</div>
              <div className="text-gray-900">{SchoolID}</div>
              <div className="font-bold text-gray-900">Full Name</div>
              <div className="text-gray-900">{FullName}</div>
              <div className="font-bold text-gray-900">College</div>
              <div className="text-gray-900">{college}</div>
              <div className="font-bold text-gray-900">Department</div>
              <div className="text-gray-900">{department}</div>
              <div className="font-bold text-gray-900">Faculty Type</div>
              <div className="text-gray-900">{facultyType}</div>
              <div className="font-bold text-gray-900">School Email</div>
              <div className="text-gray-900">{SchoolEmail}</div>
            </div>
          </div>
          <Divider orientation="vertical" className="h-auto self-stretch" />
        </div>
      </CardContent>
    </Card>

  );

}

export type RequirementApprovalCardProps = {
  requirementName?: string;
  submissionNotes?: string;
  className?: string;
  onApprove?: () => void;
  onReject?: () => void;
};

export function RequirementApprovalCard({
  requirementName = "Library Clearance",
  submissionNotes = "Submit library clearance form with signature",
  onApprove,
  onReject,
}: RequirementApprovalCardProps) {

  return (

    <div className="rounded-xl border bg-card text-card-foreground border-muted-foreground/20">
        <div className="space-y-4 p-6">
          <div>
            <div className="text-xl text-center text-gray-900 font-bold mt-1">{requirementName}</div>
          </div>
          <div>
            <div className="text-md font-bold text-gray-900">Submission Notes</div>
            <div
              className="text-sm text-gray-900 mt-3 p-3 border border-foreground rounded-md pb-"
              dangerouslySetInnerHTML={{ __html: applyRichTextStyles(submissionNotes) }}
            />
          </div>
          <div>
            <div className="text-md font-bold text-gray-900"></div>
            <div className="text-sm text-gray-900 mt-1"></div>
          </div>
        </div>
        <Divider className="bg-foreground "></Divider>
        <div className="p-6 ">
          <div className="flex items-center gap-3">
            <div className="text-md font-bold text-gray-900">Status</div>
            <div className="ml-auto">
              <div className="flex items-center gap-2">
                <input type="radio" name="status" value="approved" id="approved" className="h-4 w-4 text-blue-600" />
                <label htmlFor="approved" className="text-sm text-gray-900">Approved</label>
                <input type="radio" name="status" value="rejected" id="rejected" className="h-4 w-4 text-blsck bg-black" />
                <label htmlFor="rejected" className="text-sm text-gray-900">Rejected</label>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mt-2">
              <InputGroupWithAddon
                placeholder="Enter remarks or comments..."
                className="text-md"
              />
            </div>
          </div>
          <div className="flex items-center mt-6 gap-3">
            <Button

              type="button"

              variant="back"

              className="h-8 rounded-md px-4 text-sm font-bold flex-1"

            >
              <div className="flex items-center justify-center gap-2">

                Cancel

              </div>
            </Button>
            <Button
              type="button"
              variant="default"
              className="h-8 rounded-md px-4 text-sm font-bold flex-1"
            >
              <div className="flex items-center justify-center gap-2">

                Save

              </div>
            </Button>
          </div>
        </div>
      </div>

  );

}
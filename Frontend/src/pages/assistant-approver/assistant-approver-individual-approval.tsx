import * as React from "react";
import "../../index.css"; 
import { AssistantApproverHeader } from "../../stories/components/header";
import { RequestCard } from "../../stories/components/cards";

import { Button } from "../../stories/components/button";
import { useNavigate } from "react-router-dom";
import { Textarea } from "../../stories/components/textarea";

import {
  ErrorModal,
  SuccessErrorModalMessages,
  SuccessModal,
} from "../../stories/components/success-and-error-modals";

async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      throw new Error("The server returned an invalid response. Please refresh and try again.");
    }
    throw new Error("Received an invalid JSON response from the server.");
  }

  if (!res.ok) {
    const detail = typeof data === "object" && data !== null && "detail" in data ? String((data as { detail?: string }).detail || "") : "";
    throw new Error(detail || "Request failed.");
  }

  return data as T;
}

type AssistantApprovalItem = {
  id: string;
  requestId: string;
  employeeId: string;
  schoolId: string;
  name: string;
  fullName: string;
  schoolEmail: string;
  college: string;
  department: string;
  facultyType: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  requirementTitle: string;
  submissionNotes: string;
  submissionLink: string;
  remarks: string;
  approvedDate: string;
  approvedBy: string;
};




export default function AssitantApproverIndividualApproval() {
  const navigate = useNavigate();
  const requestId = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("requestId") || "";
  }, []);
  const [item, setItem] = React.useState<AssistantApprovalItem | null>(null);
  const [remarks, setRemarks] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const [successOpen, setSuccessOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<React.ReactNode>("");

  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode>("");

  const openSuccess = React.useCallback((msg: React.ReactNode) => {
    setSuccessMessage(msg);
    setSuccessOpen(true);
  }, []);

  const openError = React.useCallback((msg: React.ReactNode) => {
    setErrorMessage(msg);
    setErrorOpen(true);
  }, []);

  const isProcessed = Boolean(item && (item.status === "approved" || item.status === "rejected"));
  const remarksEmpty = !remarks.trim();

  React.useEffect(() => {
    if (!requestId) {
      setLoading(false);
      setError("Missing request ID.");
      return;
    }

    fetch(`/admin/xu-faculty-clearance/api/assistant-approver/individual-approval?requestId=${encodeURIComponent(requestId)}`, {
      credentials: "include",
    })
      .then((res) => parseApiResponse<{ item?: AssistantApprovalItem }>(res))
      .then((data: { item?: AssistantApprovalItem }) => {
        setItem(data.item ?? null);
        setRemarks(data.item?.remarks ?? "");
        setError("");
      })
      .catch((err: Error) => {
        setItem(null);
        setError(err.message || "Failed to load request.");
      })
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleAction = React.useCallback((action: "approve" | "reject") => {
    if (!item) return;

    if (isProcessed) {
      openError("This request has been processed and cannot be modified.");
      return;
    }

    if (!remarks.trim()) {
      openError("Remarks are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    fetch("/admin/xu-faculty-clearance/api/assistant-approver/individual-approval", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: item.requestId, action, remarks }),
    })
      .then((res) => parseApiResponse<{ item?: AssistantApprovalItem; ok?: boolean }>(res))
      .then((data) => {
        if (data.item) {
          setItem(data.item);
          setRemarks(data.item.remarks ?? "");
        }
        openSuccess(
          action === "approve"
            ? SuccessErrorModalMessages.REQUEST_APPROVED
            : SuccessErrorModalMessages.REQUEST_REJECTED,
        );
      })
      .catch(() => {
        openError(
          action === "approve"
            ? SuccessErrorModalMessages.REQUEST_APPROVE_FAILED
            : SuccessErrorModalMessages.REQUEST_REJECT_FAILED,
        );
      })
      .finally(() => setIsSaving(false));
  }, [item, openError, openSuccess, remarks]);

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
        <AssistantApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-[1in] pt-4 pb-4 w-full">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl text-left text-primary font-bold">Clearance Requests</h1>
          <Button variant="back" size="back" onClick={() => navigate("/assistant-approver-clearance")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-xl border border-muted-foreground/20 bg-card p-6 text-black">Loading request...</div>
          ) : item ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
              <div>
                <RequestCard
                  requestId={item.requestId}
                  employeeId={item.employeeId}
                  SchoolID={item.schoolId}
                  FullName={item.fullName || item.name}
                  name={`Request No. ${item.requestId}`}
                  college={item.college}
                  department={item.department}
                  facultyType={item.facultyType}
                  SchoolEmail={item.schoolEmail}
                  status={item.status}
                />
              </div>

              <div className="rounded-xl border border-muted-foreground/20 bg-card shadow">
                <div className="p-6">
                  <div className="text-xl text-center text-black font-bold mt-1">{item.requirementTitle || "Requirement"}</div>

                  <div className="mt-6">
                    <div className="text-md font-bold text-foreground">Submission Notes</div>
                    <div
                      className="mt-3 rounded-md border border-foreground p-3 text-sm text-black [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_a]:cursor-pointer [&_a]:break-all [&_a]:[overflow-wrap:anywhere]"
                      dangerouslySetInnerHTML={{ __html: item.submissionNotes || "No submission notes provided." }}
                    />
                  </div>

                  {item.submissionLink ? (
                    <div className="mt-4">
                      <div className="text-md font-bold text-foreground">Submission Link</div>
                      <a className="mt-2 block break-all text-sm text-primary underline" href={item.submissionLink} target="_blank" rel="noreferrer">
                        {item.submissionLink}
                      </a>
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-2 text-sm text-black">
                    <div><span className="font-bold">Submitted On:</span> {item.submittedDate || "N/A"}</div>
                    {item.approvedBy ? <div><span className="font-bold">Processed By:</span> {item.approvedBy}</div> : null}
                    {item.approvedDate ? <div><span className="font-bold">Processed On:</span> {item.approvedDate}</div> : null}
                  </div>
                </div>

                <div className="border-t" />

                <div className="p-6">
                  <div className="text-md font-bold text-foreground">Remarks</div>
                  <Textarea
                    className="mt-2 min-h-[140px] text-black"
                    placeholder="Enter remarks for the approval or rejection"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    disabled={isSaving || isProcessed}
                  />

                  {isProcessed ? (
                    <div className="mt-2 text-sm text-black">
                      Remarks cannot be modified for processed requests.
                    </div>
                  ) : null}

                  {error ? <div className="mt-3 text-sm font-medium text-red-600">{error}</div> : null}
                  {message ? <div className="mt-3 text-sm font-medium text-green-700">{message}</div> : null}

                  <div className="mt-6 flex items-center gap-3">
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-10 rounded-md px-4 text-sm font-bold flex-1"
                      disabled={isSaving || isProcessed || remarksEmpty}
                      onClick={() => handleAction("reject")}
                    >
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      className="h-10 rounded-md px-4 text-sm font-bold flex-1"
                      disabled={isSaving || isProcessed || remarksEmpty}
                      onClick={() => handleAction("approve")}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-muted-foreground/20 bg-card p-6 text-black">
              {error || "Request not found."}
            </div>
          )}
        </div>
      </main>

    </div>
  );
}

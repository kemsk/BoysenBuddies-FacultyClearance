import * as React from "react";
import "../../index.css"; 
import { ApprovalHeader } from "../../stories/components/header";
import { RequestCard } from "../../stories/components/cards";
import { Button } from "../../stories/components/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Textarea } from "../../stories/components/textarea";

interface IndividualRequestData {
  item: {
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
    status: string;
    submittedDate: string;
    requirementName: string;
    submissionNotes: string;
    submissionLink: string;
    remarks: string;
    approvedDate: string;
    approvedBy: string;
  };
}

export default function ApproverIndividualApproval() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("request_id");

  const [request, setRequest] = React.useState<IndividualRequestData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"approved" | "rejected" | "pending">("pending");
  const [remarks, setRemarks] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<any>(null);

  React.useEffect(() => {
    if (!requestId) {
      setError("No request ID provided");
      setLoading(false);
      return;
    }

    // Fetch user profile first
    fetch("/admin/xu-faculty-clearance/api/approver/profile", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((profileData) => {
        setUserProfile(profileData);
        
        // Then fetch the request
        return fetch(`/admin/xu-faculty-clearance/api/approver/individual-approval?request_id=${requestId}`);
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load request: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("[DEBUG] Raw API response:", data);
        console.log("[DEBUG] College value:", data.item.college);
        console.log("[DEBUG] Department value:", data.item.department);
        console.log("[DEBUG] Employee ID value:", data.item.employeeId);
        setRequest(data);
        setStatus(data.item.status.toLowerCase() as "approved" | "rejected" | "pending");
        setRemarks(data.item.remarks || "");
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load request");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [requestId]);

  const isProcessed = request && (request.item.status === "approved" || request.item.status === "rejected");
  const isDisabled = Boolean(isProcessed);

  const handleSave = async () => {
    if (!request || status === "pending") {
      setError("Please select Approved or Rejected");
      return;
    }

    const { item } = request;

    // Prevent saving if request is already processed
    if (isProcessed) {
      setError("This request has already been processed and cannot be modified");
      return;
    }

    // Validate remarks for rejected status
    if (status === "rejected" && !remarks.trim()) {
      setError("Remarks are required when rejecting a clearance request");
      return;
    }

    setSaving(true);
    setError(null);

    // Store the data we need for activity logging BEFORE any API calls
    // Use the same item data that RequestCard uses (which is working)
    // No fallbacks - use only real data to see what's actually available
    console.log("[DEBUG] Raw item data for employee ID:", {
      employeeId: item.employeeId,
      schoolId: item.schoolId,
      fullName: item.fullName,
      name: item.name
    });
    
    const facultyData = {
      fullName: item.fullName || item.name,
      employeeId: item.employeeId,
      requestId: item.requestId,
      department: item.department,
      college: item.college
    };
    
    console.log("[DEBUG] Individual approval - Final faculty data:", facultyData);

    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/approver/individual-approval", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          request_id: request.item.requestId,
          action: status === "approved" ? "approve" : "reject",
          remarks: remarks,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Save successful:", result);

      if (status === "rejected") {
        try {
          const requirementTitle = request.item.requirementName || "";
          const trimmedRemarks = String(remarks || "").trim();

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
                `Requirement = "${requirementTitle}"`,
                `Remarks = ${trimmedRemarks}`,
              ],
              user_role: "Approver",
              is_read: false,
            }),
          });

          if (!notifResponse.ok) {
            console.warn("[notification] Submission Rejected POST failed:", notifResponse.status, await notifResponse.text());
          } else {
            console.log("[notification] Submission Rejected created successfully");
          }
        } catch (e) {
          console.warn("[notification] Submission Rejected POST error:", e);
        }
      }
      
      // Activity log is now created by the backend with complete data
      
      // Navigate back to clearance list
      navigate("/approver-clearance");
    } catch (err) {
      console.error("Error saving:", err);
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/approver-clearance");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-foreground text-primary-foreground">
        <div className="header mb-3">
          <ApprovalHeader />
        </div>
        <main className="dashboard p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-primary-foreground text-primary-foreground">
        <div className="header mb-3">
          <ApprovalHeader />
        </div>
        <main className="dashboard p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error: {error || "Request not found"}</div>
          </div>
        </main>
      </div>
    );
  }

  const { item } = request;

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <ApprovalHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 w-full lg:max-w-6xl lg:mx-auto lg:p-8 ">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl text-left text-primary font-bold">Clearance Requests</h1>
          <Button variant="back" size="back" onClick={handleCancel}>
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          <div>
            <RequestCard
              requestId={item.requestId}
              employeeId={item.employeeId}
              SchoolID={item.schoolId}
              FullName={item.name}
              name={`Request No. ${item.requestId}`}
              college={item.college}
              department={item.department}
              facultyType={item.facultyType}
              SchoolEmail={item.schoolEmail}
              status={status}
              onApprove={() => console.log("Approved")}
              onReject={() => console.log("Rejected")}
              onViewDetails={() => console.log("View details")}
            />
          </div>

          <div className="rounded-xl border border-muted-foreground/20 bg-card shadow">
            <div className="p-6">
              <div className="text-xl text-center text-black font-bold mt-1">
                {item.requirementName}
              </div>

              <div className="mt-6">
                <div className="text-md font-bold text-foreground">Submission Notes</div>
                <div
                  className="mt-3 rounded-md border border-foreground p-3 text-sm text-black"
                  dangerouslySetInnerHTML={{ __html: item.submissionNotes || "No notes provided" }}
                />
              </div>

              {item.submissionLink ? (
                <div className="mt-4">
                  <div className="text-md font-bold text-foreground">Submission Link</div>
                  <a
                    href={item.submissionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-sm text-primary underline"
                  >
                    {item.submissionLink}
                  </a>
                </div>
              ) : null}
            </div>

            <div className="border-t" />

            <div className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-md font-bold text-foreground">Status</div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="approved"
                    checked={status === "approved"}
                    onChange={(e) => setStatus(e.target.value as "approved")}
                    disabled={isDisabled}
                    className="mr-2"
                  />
                  <span className="text-black">Approved</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="rejected"
                    checked={status === "rejected"}
                    onChange={(e) => setStatus(e.target.value as "rejected")}
                    disabled={isDisabled}
                    className="mr-2"
                  />
                  <span className="text-black">Rejected</span>
                </label>
              </div>

              {isProcessed ? (
                <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  This request has been processed and cannot be modified.
                </div>
              ) : null}

              <div className="mt-6">
                <div className="text-md font-bold text-foreground">
                  Remarks
                  {status === "rejected" ? <span className="text-red-500 ml-1">*</span> : null}
                </div>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-2 min-h-[140px] text-black border-foreground placeholder:text-gray-400"
                  disabled={isDisabled}
                />
                {status === "rejected" && !remarks.trim() ? (
                  <div className="mt-2 text-sm text-red-600">
                    Remarks are required when rejecting a clearance request
                  </div>
                ) : null}
                {isProcessed ? (
                  <div className="mt-2 text-sm text-black">
                    Remarks cannot be modified for processed requests.
                  </div>
                ) : null}
              </div>

              {error ? (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 flex items-center gap-3">
                <Button
                  variant="back"
                  className="h-10 rounded-md px-4 text-sm font-bold flex-1"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || isDisabled}
                  className="h-10 rounded-md px-4 text-sm font-bold flex-1"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

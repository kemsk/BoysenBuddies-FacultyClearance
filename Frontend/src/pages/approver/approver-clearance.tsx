import * as React from "react";
import "../../index.css";
import { DynamicApproverHeader } from "../../stories/components/header";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ClearanceRequestsCard, type ClearanceRequestItem } from "../../stories/components/request-cards";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../stories/components/select";
import { SearchInputGroup } from "../../stories/components/input-group";
import { Input } from "../../stories/components/input";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "../../stories/components/alert-dialog";

import {
  ErrorModal,
  SuccessModal,
  SuccessErrorModalMessages,
} from "../../stories/components/success-and-error-modals";

type ConfirmSystemUserDialogProps = {

  open?: boolean;

  onOpenChange?: (open: boolean) => void;

  action: "approve" | "reject";

  userName: string;

  requestId: string;

  adminEmail: string;

  onConfirm?: (requestId: string) => void;

  onError?: (message: string) => void;

};



function ConfirmSystemUserDialog({
  open,
  onOpenChange,
  action,
  userName,
  requestId,
  adminEmail,
  onConfirm,
  onError,
}: ConfirmSystemUserDialogProps) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [confirmEmail, setConfirmEmail] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setConfirmEmail("");
    }
  }, [open]);

  return (
    <AlertDialog
      open={Boolean(open)}
      onOpenChange={(next) => {
        onOpenChange?.(next);
      }}
    >
      {step === 1 ? (
        <AlertDialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
          <div className="rounded-xl bg-background">
            <AlertDialogHeader className="px-6 pb-4 pt-7 gap-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center">
                <img src="/RedAlertIcon.png" />
              </div>
              <AlertDialogTitle className="mt-3 mb-2 text-center text-lg font-bold text-foreground">
                You are about to <span className={action === "approve" ? "text-green-500" : "text-red-500"}>
                  {action.toUpperCase()}
                </span> the clearance request for
                <br />
                <span>&ldquo;{userName}&rdquo;</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="">
                <span className="text-sm text-black font-semibold">Do you wish to continue?</span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
              <div className="grid w-full grid-cols-1 gap-1">
                <AlertDialogAction
                  className={`h-11 w-full rounded-md ${
                    action === "approve" 
                      ? "bg-green-500 text-white hover:bg-green-500/90" 
                      : "bg-red-500 text-white hover:bg-red-500/90"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}
                >
                  {action === "approve" ? "Approve Request" : "Reject Request"}
                </AlertDialogAction>
                <AlertDialogCancel className="h-11 w-full rounded-md" onClick={() => onOpenChange?.(false)}>
                  Cancel
                </AlertDialogCancel>
              </div>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      ) : (
        <AlertDialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
          <div className="rounded-xl bg-background">
            <AlertDialogHeader className="px-6 pb-4 pt-6">
              <AlertDialogTitle className="text-center text-base font-bold text-foreground">
                Input your XU Email to confirm
              </AlertDialogTitle>
              <div className="mt-4">
                <Input
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  size="sm"
                  placeholder="example@xu.edu.ph"
                  className="focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                />
              </div>
            </AlertDialogHeader>

            <AlertDialogFooter className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
              <div className="grid w-full grid-cols-1 gap-3">
                <AlertDialogAction
                  className="h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!confirmEmail.trim()) {
                      onError?.("Please enter your XU Email to confirm.");
                      return;
                    }
                    if (confirmEmail.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
                      onConfirm?.(requestId);
                      onOpenChange?.(false);
                    } else {
                      onError?.(SuccessErrorModalMessages.EMAIL_DOES_NOT_MATCH_APPROVER);
                    }
                  }}
                >
                  Confirm
                </AlertDialogAction>
                <AlertDialogCancel className="h-11 w-full rounded-md" onClick={() => onOpenChange?.(false)}>
                  Cancel
                </AlertDialogCancel>
              </div>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );

}



export default function ApproverClearance() {
  const [query, setQuery] = React.useState("");
  const [requests, setRequests] = React.useState<ClearanceRequestItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 20;
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<"approve" | "reject">("approve");
  const [selectedRequest, setSelectedRequest] = React.useState<ClearanceRequestItem | null>(null);
  const [approverEmail, setApproverEmail] = React.useState("");
  const [sortBy, setSortBy] = React.useState("name");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [successOpen, setSuccessOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<React.ReactNode>("");

  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode>("");

  const openError = React.useCallback((message: React.ReactNode) => {
    setErrorMessage(message);
    setErrorOpen(true);
  }, []);

  const openSuccess = React.useCallback((message: React.ReactNode) => {
    setSuccessMessage(message);
    setSuccessOpen(true);
  }, []);

  async function readErrorDetail(r: Response) {
    try {
      const data = (await r.json()) as { detail?: string; message?: string };
      if (data?.detail) return data.detail;
      if (data?.message) return data.message;
    } catch {
      // ignore
    }

    try {
      const t = (await r.text()) || "";
      if (t.trim()) return t;
    } catch {
      // ignore
    }

    return `Request failed (HTTP ${r.status})`;
  }

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/approver/clearance", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load requests: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("[DEBUG] API response from clearance:", data);
        setRequests(Array.isArray(data?.items) ? data.items : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading requests:", err);
        setLoading(false);
        setRequests([]);
      });
  }, []);

  // Refresh data when window regains focus (after approve/reject actions)
  React.useEffect(() => {
    const handleFocus = () => {
      fetch("/admin/xu-faculty-clearance/api/approver/clearance", {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to load requests: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          setRequests(Array.isArray(data?.items) ? data.items : []);
        })
        .catch(() => {
          // Silent error handling for refresh
        });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Fetch approver email
  React.useEffect(() => {
    fetch("/api/me", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch user info: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setApproverEmail(data.email || "");
      })
      .catch((err) => {
        console.error("Error fetching user info:", err);
      });
  }, []);

  const handleApprove = (request: ClearanceRequestItem) => {
    setSelectedRequest(request);
    setConfirmAction("approve");
    setConfirmDialogOpen(true);
  };

  const handleReject = (request: ClearanceRequestItem) => {
    setSelectedRequest(request);
    setConfirmAction("reject");
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async (requestId: string) => {
    if (!selectedRequest) return;

    const endpoint = confirmAction === "approve" 
      ? `/admin/xu-faculty-clearance/api/approver/approve/${requestId}`
      : `/admin/xu-faculty-clearance/api/approver/reject/${requestId}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        openError(detail || SuccessErrorModalMessages.ERROR_MESSAGE_FROM_API);
        return;
      }

      // Refresh the requests list
      const refreshResponse = await fetch("/admin/xu-faculty-clearance/api/approver/clearance", {
        credentials: "include",
      });
      
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setRequests(Array.isArray(data?.items) ? data.items : []);
      }

      openSuccess(
        confirmAction === "approve"
          ? SuccessErrorModalMessages.REQUEST_APPROVED
          : SuccessErrorModalMessages.REQUEST_REJECTED
      );
    } catch (error) {
      console.error(`Error ${confirmAction}ing request:`, error);

      openError(
        confirmAction === "approve"
          ? SuccessErrorModalMessages.REQUEST_APPROVE_FAILED
          : SuccessErrorModalMessages.REQUEST_REJECT_FAILED
      );
    }
  };

  const filteredRequests = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = requests;
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => {
        if (statusFilter === "pending") return r.status === "pending";
        if (statusFilter === "approved") return r.status === "approved";
        if (statusFilter === "rejected") return r.status === "rejected";
        return true;
      });
    }
    
    // Filter by search query
    if (q) {
      filtered = filtered.filter((r) => {
        const hay = [r.requestId, r.employeeId, r.name, r.college, r.department, r.facultyType]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    
    // Sort by selected field
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "date":
          // Since submittedDate doesn't exist in the type, sort by requestId as a fallback
          return (b.requestId || "").localeCompare(a.requestId || "");
        case "employeeId":
          return (a.employeeId || "").localeCompare(b.employeeId || "");
        case "college":
          return (a.college || "").localeCompare(b.college || "");
        case "department":
          return (a.department || "").localeCompare(b.department || "");
        case "facultyType":
          return (a.facultyType || "").localeCompare(b.facultyType || "");
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [query, requests, sortBy, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const safePage = Math.max(1, Math.min(page, totalPages || 1));
  const paginatedRequests = React.useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, safePage, itemsPerPage]);

  // Reset page when query changes
  React.useEffect(() => {
    setPage(1);
  }, [query]);



  if (loading) {
    return (
      <div className="min-h-screen bg-primary-foreground text-primary-foreground">
        <div className="header mb-3">
          <DynamicApproverHeader />
        </div>
        <main className="dashboard p-[2%]">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </main>
      </div>
    );
  }



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
        <DynamicApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-[1in] pt-4 pb-4 w-full">
        <h1 className="text-2xl text-left text-primary font-bold">Clearance Requests</h1>

       <div className="mt-5 space-y-5">
          <div className="max-w-[520px]">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
            />
          </div>

          <div className="flex flex-wrap items-left gap-3 overflow-x-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger variant="pill" className="w-max gap-2">
                <span>Sort by :</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="employeeId">Employee ID</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="facultyType">Faculty Type</SelectItem>
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
            <Select onValueChange={(v) => console.log(v)}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="College" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="CISO">System Admin</SelectItem>
                    <SelectItem value="OVPHE">Analytics Admin</SelectItem>
                </SelectContent>
            </Select>
            <Select onValueChange={(v) => console.log(v)}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Approver">System Admin</SelectItem>
                    <SelectItem value="Approver">Analytics Admin</SelectItem>
                </SelectContent>
            </Select>                 
          </div>
        </div>

        <div className="mt-6">
          <ClearanceRequestsCard
            items={paginatedRequests}
            getItemHref={(item) => `/approver-individual-approval?request_id=${item.requestId}`}
          />
        </div>

        <div className="mt-8 h-px w-full bg-[hsl(var(--gray-border))]" />

        <div className="px-6 pb-4">
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Page</span>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              value={safePage}
              onChange={(e) => setPage(Number(e.target.value))}
            >
              {Array.from({ length: totalPages }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span>of {totalPages}</span>
          </div>
        </div>
      </main>
    </div>
  );

}


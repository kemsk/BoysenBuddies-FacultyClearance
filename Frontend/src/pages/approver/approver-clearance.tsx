import * as React from "react";
import "../../index.css";
import { ApprovalHeader } from "../../stories/components/header";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ClearanceRequestsCard, type ClearanceRequestItem } from "../../stories/components/cards";
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

type ConfirmSystemUserDialogProps = {

  open?: boolean;

  onOpenChange?: (open: boolean) => void;

  action: "approve" | "reject";

  userName: string;

  requestId: string;

  adminEmail: string;

  onConfirm?: (requestId: string) => void;

};



function ConfirmSystemUserDialog({
  open,
  onOpenChange,
  action,
  userName,
  requestId,
  adminEmail,
  onConfirm,
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
                <img src="/RedAlertIcon.png"></img>
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
                />
              </div>
            </AlertDialogHeader>

            <AlertDialogFooter className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
              <div className="grid w-full grid-cols-1 gap-3">
                <AlertDialogAction
                  className="h-11 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirmEmail.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
                      onConfirm?.(requestId);
                      onOpenChange?.(false);
                    } else {
                      alert("Email does not match the logged-in approver's email. Please try again.");
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
        throw new Error(`Failed to ${confirmAction} request: ${response.statusText}`);
      }

      // Refresh the requests list
      const refreshResponse = await fetch("/admin/xu-faculty-clearance/api/approver/clearance", {
        credentials: "include",
      });
      
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setRequests(Array.isArray(data?.items) ? data.items : []);
      }

      alert(`Request ${confirmAction}d successfully!`);
    } catch (error) {
      console.error(`Error ${confirmAction}ing request:`, error);
      alert(`Failed to ${confirmAction} request. Please try again.`);
    }
  };

  const filteredRequests = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const hay = [r.requestId, r.employeeId, r.name, r.college, r.department, r.facultyType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, requests]);

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
          <ApprovalHeader />
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
      {/* HEADER */}
      <div className="header mb-3">
        <ApprovalHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-[2%] w-full lg:w-[90%] lg:mx-auto lg:p-[3%]">
        <h1 className="text-2xl text-left text-primary font-bold">Clearance Requests</h1>

        <div className="mt-4 space-y-5">
          <div className="w-full">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
            />
          </div>

          <div className="flex flex-wrap items-left gap-3 overflow-x-auto">
            <Select defaultValue="name">
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

            <Select defaultValue="pending">
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

        <div className="mt-6">
          <ClearanceRequestsCard
            items={paginatedRequests}
            getItemHref={(item) => `/approver-individual-approval?request_id=${item.requestId}`}
            onApprove={handleApprove}
            onReject={handleReject}
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


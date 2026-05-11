import * as React from "react";
import "../../index.css"; 
import { AssistantApproverHeader } from "../../stories/components/header";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  ClearanceRequestsCard,
  type ClearanceRequestItem,
} from "../../stories/components/request-cards";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

import { SearchInputGroup } from "../../stories/components/input-group";




export default function AssistantApproverClearance() {
  const [query, setQuery] = React.useState("");
  const [requests, setRequests] = React.useState<ClearanceRequestItem[]>([]);
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 20;

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/assistant-approver/clearance", {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const items = Array.isArray(data?.items) ? (data.items as ClearanceRequestItem[]) : [];
        setRequests(items);
      })
      .catch(() => setRequests([]));
  }, []);

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

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <AssistantApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-[1in] pt-4 pb-4 w-full">
        
        <h1 className="text-2xl text-left text-primary font-bold">Clearance Requests</h1>

        <div className="mt-4 space-y-5">
          <div className="w-full max-w-[520px]">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
            />
          </div>

          <div className="flex flex-wrap items-left gap-3 overflow-x-auto ">
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
            getItemHref={(item) => `/assistant-approver-individual-clearance?requestId=${encodeURIComponent(item.requestId)}`}
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

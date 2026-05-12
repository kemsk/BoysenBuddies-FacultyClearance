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
  const [sortBy, setSortBy] = React.useState("name");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [facultyTypeFilter, setFacultyTypeFilter] = React.useState("all");

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
    
    // Filter by faculty type
    if (facultyTypeFilter !== "all") {
      filtered = filtered.filter((r) => {
        if (facultyTypeFilter === "Part-time") return r.facultyType === "Part-time";
        if (facultyTypeFilter === "Full-time") return r.facultyType === "Full-time";
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
        case "requestId":
          return (a.requestId || "").localeCompare(b.requestId || "");
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
  }, [query, requests, sortBy, statusFilter, facultyTypeFilter]);

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

       <div className="mt-5 space-y-5">
          <div className="w-full mt-5">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
              placeholder="Search by name, ID, or email..."
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
                <SelectItem value="employeeId">Employee ID</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="department">Department</SelectItem>
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
                    <SelectItem value="all">All College</SelectItem>
                    <SelectItem value="CISO">System Admin</SelectItem>
                    <SelectItem value="OVPHE">Analytics Admin</SelectItem>
                </SelectContent>
            </Select>
            <Select onValueChange={(v) => console.log(v)}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Department</SelectItem>
                    <SelectItem value="Approver">System Admin</SelectItem>
                    <SelectItem value="Approver">Analytics Admin</SelectItem>
                </SelectContent>
            </Select>               

            <Select value={facultyTypeFilter} onValueChange={setFacultyTypeFilter}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="Approver type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Faculty</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Full-time">Full-time</SelectItem>
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

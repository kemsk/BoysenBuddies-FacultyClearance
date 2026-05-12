import * as React from "react";

import "../../index.css"; 
import { AssistantApproverHeader } from "../../stories/components/header";

import {
  ClearanceRequestsCard,
  type ClearanceRequestItem,
} from "../../stories/components/request-cards";

import {
  type AnnouncementItem,
} from "../../stories/components/cards";

import { Button } from "../../stories/components/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";


import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { SearchInputGroup } from "../../stories/components/input-group";
import { useState } from "react";


export default function AssistantApproverViewClearance() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [requests, setRequests] = React.useState<ClearanceRequestItem[]>([]);
  const [sortBy, setSortBy] = React.useState("name");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [facultyTypeFilter, setFacultyTypeFilter] = React.useState("all");
  const rawTimelineId = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("timelineId") || "";
  }, []);

  const [timelineData, setTimelineData] = React.useState<any>(null);

  const formattedTimelineId = React.useMemo(() => {
    // Use timeline name directly like CISO archived clearance page
    if (timelineData && timelineData.name) {
      return timelineData.name;
    }
    
    // Return empty if no timeline data available
    return "";
  }, [rawTimelineId, timelineData]);
  

  type AnnouncementApiItem = AnnouncementItem & { id: number; email?: string };

  const [, setItems] = React.useState<AnnouncementApiItem[]>([]);

  const refresh = React.useCallback(() => {
    return fetch("/admin/xu-faculty-clearance/api/ovphe/announcements", {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { items: AnnouncementApiItem[] }) => {
        const initial = (data.items ?? []).map((item) => ({
          ...item,
          enabled: item.enabled ?? true,
        }));
        setItems(initial);
      });
  }, []);

React.useEffect(() => {
  refresh()
    .catch(() => {
      setItems([]); // Show empty state when API fails
    });
}, [refresh]);

  React.useEffect(() => {
    if (!rawTimelineId) {
      setRequests([]);
      setTimelineData(null);
      return;
    }

    // Fetch timeline details from archived clearance API (like CISO page)
    fetch("/admin/xu-faculty-clearance/api/assistant-approver/archived-clearance", {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items: any[] }) => {
        // Find the timeline with matching ID
        const timeline = data.items?.find((item: any) => item.id === rawTimelineId);
        setTimelineData(timeline || null);
      })
      .catch(() => {
        setTimelineData(null);
      });

    const params = new URLSearchParams({ timelineId: rawTimelineId });

    fetch(`/admin/xu-faculty-clearance/api/assistant-approver/view-clearance?${params.toString()}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items?: Array<Omit<ClearanceRequestItem, "status" | "requestId"> & { status?: string }> }) => {
        const next: ClearanceRequestItem[] = Array.isArray(data?.items)
          ? data.items.map((item) => ({
              ...item,
              requestId: item.employeeId || item.id,
              status: item.status === "COMPLETED" ? "approved" as const : "pending" as const,
            }))
          : [];
        setRequests(next);
      })
      .catch(() => {
        setRequests([]);
      });
  }, [rawTimelineId]);

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
          case "employeeId":
            return (a.employeeId || "").localeCompare(b.employeeId || "");
          case "college":
            return (a.college || "").localeCompare(b.college || "");
          case "department":
            return (a.department || "").localeCompare(b.department || "");
          default:
            return 0;
        }
      });
      
      return filtered;
    }, [query, requests, sortBy, statusFilter, facultyTypeFilter]);
  
  const handleExport = React.useCallback(() => {
    if (!rawTimelineId || filteredRequests.length === 0) return;

    const headers = ["Employee ID", "Name", "College", "Department", "Faculty Type", "Status"];
    const rows = filteredRequests.map((item) => [
      item.employeeId,
      item.name,
      item.college,
      item.department,
      item.facultyType,
      item.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assistant-approver-archived-clearance-${rawTimelineId}-export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredRequests, rawTimelineId]);
  

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <AssistantApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-[1in] pt-4 pb-4 w-full">

        <h1 className="text-2xl text-left text-primary font-bold">{formattedTimelineId}</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/assistant-approver-archived-clearance">View Clearance Records</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>{formattedTimelineId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/assistant-approver-archived-clearance")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>

        <div className="mt-5 space-y-5">
          <div className="w-full mt-5">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
              placeholder="Search by name, ID, or email..."
            />
          </div>
        </div>

        <div className="mt-3 space-y-4">
          <div className="w-full flex flex-col sm:flex-row gap-3 justify-start mt-5" style={{ marginLeft: '0', paddingLeft: '0' }}>
              <div className="flex flex-wrap gap-3">
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

          <div className="flex justify-between gap-3 mt-4">
            <Button variant="default" className="w-full font-bold whitespace-nowrap" onClick={handleExport} disabled={filteredRequests.length === 0}> 
              <div className="flex items-center justify-center gap-2">
                <img src="/WhiteDownloadIcon.png" alt="export" className="w-6 h-6" />
                <span>Export Current View</span>
              </div>  
            </Button>
          </div>
          
          <div className="mt-3">
            <div className="mt-6">
              <ClearanceRequestsCard
                items={filteredRequests}
                getItemHref={(item) => `/assistant-approver-archived-individual?timelineId=${encodeURIComponent(rawTimelineId)}&archivedId=${encodeURIComponent(item.id)}`}
              />
            </div>
          </div>
        </div>


      </main>

    </div>
  );
}

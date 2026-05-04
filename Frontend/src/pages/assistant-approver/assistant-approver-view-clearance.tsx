import * as React from "react";

import "../../index.css"; 
import { AssistantApproverHeader } from "../../stories/components/header";

import {
  type AnnouncementItem,
  ClearanceRequestsCard,
  type ClearanceRequestItem,
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
      if (!q) return requests;
      return requests.filter((r) => {
        const hay = [r.requestId, r.employeeId, r.name, r.college, r.department, r.facultyType]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }, [query, requests]);
  
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
                <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <label>Sort by:</label>
                  <SelectValue/> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="requestId">Request ID</SelectItem>
                  <SelectItem value="universityId">University ID</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="facultyType">Faculty Type</SelectItem>
                </SelectContent>
              </Select>
            
              <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <label>Status:</label>
                  <SelectValue/> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <label>College:</label>
                  <SelectValue/> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022-2023">2022-2023</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <label>Department:</label>
                  <SelectValue/> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022-2023">2022-2023</SelectItem>
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

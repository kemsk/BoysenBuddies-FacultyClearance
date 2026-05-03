import * as React from "react";

import "../../index.css"; 
import { OVPHEHeader } from "../../stories/components/header";

import {
  type AnnouncementItem,
  NoLinkClearanceRequestsCard,
  type NoLinkClearanceRequestItem,
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

function postOVPHEActivityLog(payload: { event_type: string; details?: string[] }) {
  fetch("/admin/xu-faculty-clearance/api/ovphe/activity-logs", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function GuidelinesToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={
        checked
          ? "relative h-6 w-12 rounded-full bg-success"
          : "relative h-6 w-12 rounded-full bg-muted-foreground/30"
      }
      onClick={() => onChange(!checked)}
    >
      <span
        className={
          checked
            ? "absolute left-[26px] top-1 h-4 w-4 rounded-full bg-white"
            : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white"
        }
      />
    </button>
  );
}

export default function OVPHEViewClearance() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [sortBy, setSortBy] = useState("name");
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

  const dummyClearanceRequests: NoLinkClearanceRequestItem[] = [
    {
      id: "ovphe-1",
      name: "Juan Dela Cruz",
      requestId: "REQ-2501-0001",
      employeeId: "EMP-0001",
      college: "College of Engineering",
      department: "Computer Engineering",
      facultyType: "Full-Time",
      status: "pending",
    },
    {
      id: "ovphe-2",
      name: "Maria Santos",
      requestId: "REQ-2501-0002",
      employeeId: "EMP-0002",
      college: "College of Arts and Sciences",
      department: "Mathematics",
      facultyType: "Part-Time",
      status: "approved",
    },
  ];

  type AnnouncementApiItem = AnnouncementItem & { id: number; email?: string };

  const [items, setItems] = React.useState<AnnouncementApiItem[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [confirm, setConfirm] = React.useState<
    | { open: true; type: "enable" | "disable" | "delete"; index: number }
    | { open: false }
  >({ open: false });

  React.useEffect(() => {
    if (!rawTimelineId) {
      setTimelineData(null);
      return;
    }

    // Fetch timeline details from archived clearance API (like CISO page)
    fetch("/admin/xu-faculty-clearance/api/ovphe/archived-clearance", {
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
  }, [rawTimelineId]);



  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <OVPHEHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3 w-full ">

        <h1 className="text-2xl text-left text-primary font-bold">{formattedTimelineId}</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/OVPHE-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/OVPHE-archived-clearance">View Archived Clearance</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>{formattedTimelineId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex flex-wrap items-center gap-3">
          <Button variant="back" size="back" onClick={() => navigate("/OVPHE-archived-clearance")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>

          <Button variant="default" className="ml-auto font-bold whitespace-nowrap"> 
            <div className="flex items-center justify-center gap-2">
              <img src="/WhiteDownloadIcon.png" alt="export" className="w-6 h-6" />
              <span>Export Current View</span>
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
            <div className="w-full mt-5">
              <div className="flex flex-wrap items-center gap-3">
                <Select>
                <SelectTrigger variant="pill" className="w-full gap-2 sm:w-[180px]">
                  <label>Sort by:</label>
                  <SelectValue placeholder="Select" />
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
                <SelectTrigger variant="pill" className="w-full gap-2 sm:w-[160px]">
                  <label>Status:</label>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger variant="pill" className="w-full gap-2 sm:w-[180px]">
                  <label>College:</label>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022-2023">2022-2023</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger variant="pill" className="w-full gap-2 sm:w-[180px]">
                  <label>Department:</label>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022-2023">2022-2023</SelectItem>
                </SelectContent>
              </Select>
              </div>
          </div>
          
          <div className="mt-3">
            <NoLinkClearanceRequestsCard items={dummyClearanceRequests} />
          </div>
        </div>


      </main>

    </div>
  );
}

import * as React from "react";

import "../../index.css"; 
import { AssistantApproverHeader } from "../../stories/components/header";

import {
  type AnnouncementItem,
  SectionListCard,
  ArchivedClearanceCard,
  ViewArchivedClearanceCard,
} from "../../stories/components/cards";

import { Button } from "../../stories/components/button";
import { Divider } from "../../stories/components/divider";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

import {
  loadAnnouncementsItems,
} from "../../stories/components/edit-announcements-dialog";
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


export default function AssistantApproverViewClearance() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  type AnnouncementApiItem = AnnouncementItem & { id: number; email?: string };

  const [items, setItems] = React.useState<AnnouncementApiItem[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [confirm, setConfirm] = React.useState<
    | { open: true; type: "enable" | "disable" | "delete"; index: number }
    | { open: false }
  >({ open: false });

  const refresh = React.useCallback(() => {
    return fetch("/admin/xu-faculty-clearance/api/ovphe/announcements")
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
        const initial = loadAnnouncementsItems().map((item) => ({
          ...item,
          enabled: item.enabled ?? true,
        }));
        setItems(initial as AnnouncementApiItem[]);
      });
  }, [refresh]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <AssistantApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3">

        <h1 className="text-2xl text-left text-primary font-bold">2501 Faculty Clearance</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/Approver-action">Action</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/approver-archived-clearance">View Archived Clearance</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>2501 Faculty Clearance</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/approver-archived-clearance")}> 
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

          
          <div className="mt-3">
            <ViewArchivedClearanceCard 
              onViewDetails={() => console.log("View details clicked")}
            />
          </div>
        </div>


      </main>

    </div>
  );
}

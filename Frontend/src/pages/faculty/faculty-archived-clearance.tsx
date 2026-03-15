import * as React from "react";

import "../../index.css"; 
import { FacultyHeader } from "../../stories/components/header";

import {
  type AnnouncementItem,
  ArchivedClearanceCard,
  ViewArchivedClearanceWithStatusCard,
} from "../../stories/components/cards";

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

import { Link, useNavigate } from "react-router-dom";
import { SearchInputGroup } from "../../stories/components/input-group";
import { useState } from "react";



export default function FacultyArchiveClearance() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

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
        <FacultyHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3">

        <h1 className="text-2xl text-left text-primary font-bold">View Archived Clearance</h1>


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
              <div className="flex gap-3">
              <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <SelectValue placeholder="School Year" /> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2022-2023">2022-2023</SelectItem>
                  <SelectItem value="2021-2022">2021-2022</SelectItem>
                  <SelectItem value="2020-2021">2020-2021</SelectItem>
                </SelectContent>
              </Select>
            
              <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <SelectValue placeholder="Term" /> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              </div>
          </div>
          
          <div className="mt-3">
            <ViewArchivedClearanceWithStatusCard  
             onIconClick={() => navigate("/faculty-view-clearance")}
             iconClassName="ml-6"
            />
          </div>
        </div>


      </main>

    </div>
  );
}

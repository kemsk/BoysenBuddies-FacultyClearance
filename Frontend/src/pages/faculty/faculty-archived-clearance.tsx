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



type ArchivedTimelineItem = {
  id: string;
  name: string;
  academicYear: string;
  semester: string;
  clearancePeriodStart: string;
  clearancePeriodEnd: string;
  lastUpdated: string;
  archivedDate: string;
};

export default function FacultyArchiveClearance() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  type AnnouncementApiItem = AnnouncementItem & { id: number; email?: string };

  const [items, setItems] = React.useState<AnnouncementApiItem[]>([]);
  const [timelines, setTimelines] = React.useState<ArchivedTimelineItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [confirm, setConfirm] = React.useState<
    | { open: true; type: "enable" | "disable" | "delete"; index: number }
    | { open: false }
  >({ open: false });

  const loadTimelines = React.useCallback(() => {
    setLoading(true);
    return fetch("/admin/xu-faculty-clearance/api/faculty/archived-clearance")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { items: ArchivedTimelineItem[] }) => {
        setTimelines(data.items ?? []);
      })
      .catch(() => {
        setTimelines([]);
      })
      .finally(() => setLoading(false));
  }, []);

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
    loadTimelines();
  }, [loadTimelines]);

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
          <div className="space-y-3">
            {timelines.map((timeline) => (
              <div
                key={timeline.id}
                className="border rounded-lg p-4 bg-white cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/faculty-view-clearance?timelineId=${timeline.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{timeline.name}</h3>
                    <p className="text-sm text-gray-600">Academic Year: {timeline.academicYear}</p>
                    <p className="text-sm text-gray-600">Semester: {timeline.semester}</p>
                    <p className="text-sm text-gray-600">Clearance Period: {timeline.clearancePeriodStart} - {timeline.clearancePeriodEnd}</p>
                    <p className="text-sm text-gray-600">Last Updated: {timeline.lastUpdated}</p>
                    <p className="text-sm text-gray-600">Archived: {timeline.archivedDate}</p>
                  </div>
                  <div className="ml-4">
                    <span className="text-2xl">→</span>
                  </div>
                </div>
              </div>
            ))}
            {timelines.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No archived timelines found.
              </div>
            )}
            {loading && (
              <div className="text-center py-8 text-gray-500">
                Loading...
              </div>
            )}
          </div>
        </div>

      </main>

    </div>
  );
}

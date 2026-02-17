import * as React from "react";

import "../../index.css"; 
import { OVPHEHeader } from "../../stories/components/header";

import {
  ClearanceTimelineCard,
  type ClearanceTimelineItem,
} from "../../stories/components/cards";

import {
  CreateClearanceTimelineDialog,
  EditClearanceTimelineDialog,
  type ClearanceTimelineDialogValues,
} from "../../stories/components/edit-clearance-timeline-dialogs";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../stories/components/button";

type StoredClearanceTimelineItem = {
  id: string;
  startYear: string;
  endYear: string;
  semester: string;
  semesterStartDate: string;
  semesterEndDate: string;
  clearanceStartDate: string;
  clearanceEndDate: string;
  setAsActive: boolean;
  createdAt: string;
};

const CLEARANCE_TIMELINES_STORAGE_KEY = "ovphe_clearance_timelines";

function loadTimelineItems(): StoredClearanceTimelineItem[] {
  try {
    const raw = localStorage.getItem(CLEARANCE_TIMELINES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredClearanceTimelineItem[]) : [];
  } catch {
    return [];
  }
}

function saveTimelineItems(items: StoredClearanceTimelineItem[]) {
  try {
    localStorage.setItem(CLEARANCE_TIMELINES_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore persistence errors (e.g. private mode / storage full)
  }
}

type OVPHEClearanceTimelinesResponse = { items: StoredClearanceTimelineItem[] };

function formatSchoolYear(startYear: string, endYear: string) {
  if (startYear && endYear) return `S.Y. ${startYear}–${endYear}`;
  return `S.Y. ${startYear || endYear}`;
}

function formatInclusiveDates(start: string, end: string) {
  if (!start && !end) return "";
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function toCardItem(item: StoredClearanceTimelineItem): ClearanceTimelineItem {
  return {
    id: item.id,
    schoolYear: formatSchoolYear(item.startYear, item.endYear),
    term: item.semester,
    status: item.setAsActive ? "active" : "inactive",
    inclusiveDates: formatInclusiveDates(item.clearanceStartDate, item.clearanceEndDate),
    createdAt: item.createdAt,
  };
}

function createNowTimestamp() {
  const now = new Date();
  return now.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OVPHEClearanceTimeline() {
  const navigate = useNavigate();

  const [items, setItems] = React.useState<StoredClearanceTimelineItem[]>(() => loadTimelineItems());

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);

  const refreshTimelines = React.useCallback(() => {
    return fetch("/admin/xu-faculty-clearance/api/ovphe/clearance-timelines")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: OVPHEClearanceTimelinesResponse) => {
        const nextItems = Array.isArray(data.items) ? data.items : [];
        setItems(nextItems);
        saveTimelineItems(nextItems);
      })
      .catch(() => {
        setItems([]);
      });
  }, []);

  React.useEffect(() => {
    refreshTimelines();
  }, [refreshTimelines]);

  const activeItems = React.useMemo(
    () => items.filter((i) => i.setAsActive).map(toCardItem),
    [items]
  );
  const inactiveItems = React.useMemo(
    () => items.filter((i) => !i.setAsActive).map(toCardItem),
    [items]
  );

  const editingItem = React.useMemo(
    () => (editingItemId ? items.find((i) => i.id === editingItemId) : undefined),
    [editingItemId, items]
  );

  const editInitialValues = React.useMemo((): Partial<ClearanceTimelineDialogValues> | undefined => {
    if (!editingItem) return undefined;
    return {
      startYear: editingItem.startYear,
      endYear: editingItem.endYear,
      semester: editingItem.semester,
      semesterStartDate: editingItem.semesterStartDate,
      semesterEndDate: editingItem.semesterEndDate,
      clearanceStartDate: editingItem.clearanceStartDate,
      clearanceEndDate: editingItem.clearanceEndDate,
      setAsActive: editingItem.setAsActive,
    };
  }, [editingItem]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <OVPHEHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Clearance Timeline</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/OVPHE-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Clearance Timeline</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/OVPHE-tools")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>
       
       <div className="mt-2 space-y-3">
        <ClearanceTimelineCard
          title="Active Clearance Timeline"
          headerActionImgAlt="Add"
          headerActionImgSrc="/WhitePlusIcon.png"
          headerActionOnClick={() => setCreateOpen(true)}
          items={activeItems}
          onEditItem={(item) => {
            if (item.id) setEditingItemId(item.id);
            setEditOpen(true);
          }}
        />
        <ClearanceTimelineCard
          title="Inactive Clearance Timeline"
          items={inactiveItems}
          onEditItem={(item) => {
            if (item.id) setEditingItemId(item.id);
            setEditOpen(true);
          }}
        />
       </div>

       <CreateClearanceTimelineDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(payload) => {
          fetch("/admin/xu-faculty-clearance/api/ovphe/clearance-timelines", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then(() => refreshTimelines())
            .catch(() => {
              const createdAt = createNowTimestamp();
              const id = `ct-${Date.now()}`;

              const nextItem: StoredClearanceTimelineItem = {
                id,
                startYear: payload.startYear,
                endYear: payload.endYear,
                semester: payload.semester,
                semesterStartDate: payload.semesterStartDate,
                semesterEndDate: payload.semesterEndDate,
                clearanceStartDate: payload.clearanceStartDate,
                clearanceEndDate: payload.clearanceEndDate,
                setAsActive: payload.setAsActive,
                createdAt,
              };

              setItems((prev) => {
                const normalized = payload.setAsActive
                  ? prev.map((p) => ({ ...p, setAsActive: false }))
                  : prev;
                const next = [nextItem, ...normalized];
                saveTimelineItems(next);
                return next;
              });
            });
        }}
       />

       <EditClearanceTimelineDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingItemId(null);
        }}
        initialValues={editInitialValues}
        onSave={(payload) => {
          if (!editingItemId) return;
          fetch("/admin/xu-faculty-clearance/api/ovphe/clearance-timelines", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: editingItemId, ...payload }),
          })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then(() => refreshTimelines())
            .catch(() => {
              setItems((prev) => {
                const normalized = payload.setAsActive
                  ? prev.map((p) => ({ ...p, setAsActive: false }))
                  : prev;

                const next = normalized.map((p) => {
                  if (p.id !== editingItemId) return p;
                  return {
                    ...p,
                    startYear: payload.startYear,
                    endYear: payload.endYear,
                    semester: payload.semester,
                    semesterStartDate: payload.semesterStartDate,
                    semesterEndDate: payload.semesterEndDate,
                    clearanceStartDate: payload.clearanceStartDate,
                    clearanceEndDate: payload.clearanceEndDate,
                    setAsActive: payload.setAsActive,
                  };
                });

                saveTimelineItems(next);
                return next;
              });
            });
        }}
       />

      </main>

    </div>
  );
}

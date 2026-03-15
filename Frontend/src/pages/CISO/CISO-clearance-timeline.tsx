import * as React from "react";

import "../../index.css"; 
import { CISOHeader } from "../../stories/components/header";

import {
  SectionListCard,
  type ClearanceTimelineItem,
  GuidelinesToggle,
} from "../../stories/components/cards";
import { DeactivateAlert } from "../../stories/components/alert";

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
import { Divider } from "../../stories/components/divider";

function postOVPHEActivityLog(payload: { event_type: string; details?: string[] }) {
  fetch("/admin/xu-faculty-clearance/api/ovphe/activity-logs", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

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
    Name: item.semester,
    Timeline: formatInclusiveDates(item.clearanceStartDate, item.clearanceEndDate),
    Date: item.createdAt,
    Time: "",
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

export default function CISOClearanceTimeline() {
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
    () => [
      {
        id: "active-1",
        Date: "November 1, 2025",
        Time: "04:02 PM",
      },
    ],
    []
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
        <CISOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Set Clearance Timeline</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/CISO-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Set Clearance Timeline</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
           <Button variant="back" size="back" onClick={() => navigate("/CISO-tools")}> 
              <div className="flex items-center gap-2">
                <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
              </div>
          </Button>
        </div>
       
        <div className="mt-2 space-y-3 bg-white rounded-lg">
          <div className="bg-primary h-12 text-center p-3 font-bold rounded-t-lg">
            Current Clearance Timeline
          </div>

        <div className="p-3 ">
          <div className="px-4 py- bg-white">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-black">First Semester</div>
              </div>
              <div className="flex items-center gap-2">
                <GuidelinesToggle
                  onChange={(next) => {
                  console.log(`${semester.title} toggle changed:`, next);
                  }}
                      />
              </div>
            </div>
            <div className="space-y-0 p-3 mt-4 bg-foregroundLight rounded-md border border-gray-200">
              
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <div className="mt-1 text-md font-bold text-black">Name:</div>
                <div className="mt-1 text-sm font-semibold text-black">name</div>
                
                <div className="mt-1 text-md font-bold text-black">School Year:</div>
                <div className="mt-1 text-sm font-semibold text-black">year</div>
                
                <div className="mt-1 text-md font-bold text-black">Timeline:</div>
                <div className="mt-1 text-sm font-semibold text-black">time</div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-foreground italic">Last Update: November 1, 2025 04:02 PM</div>
              </div>
            </div>
            
            <div className="flex justify-between gap-3 mt-4">
              <Button variant="default" className="w-full font-bold" onClick={() => setCreateOpen(true)}>ADD</Button>
              </div>
            </div>
        </div>  

        <Divider className="bg-foreground" />

         <div className="p-3">
          <div className="px-4 py- bg-white">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-black">Second Semester</div>
              </div>
              <div className="flex items-center gap-2">
                <GuidelinesToggle
                  onChange={(next) => {
                  console.log(`First Semester toggle changed:`, next);
                  }}
                      />
              </div>
            </div>
            <div className="space-y-0 p-3 mt-4 bg-foregroundLight rounded-md border border-gray-200">
              
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <div className="mt-1 text-md font-bold text-black">Name:</div>
                <div className="mt-1 text-sm font-semibold text-black">unset</div>
                
                <div className="mt-1 text-md font-bold text-black">School Year:</div>
                <div className="mt-1 text-sm font-semibold text-black">unset</div>
                
                <div className="mt-1 text-md font-bold text-black">Timeline:</div>
                <div className="mt-1 text-sm font-semibold text-black">unset</div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-foreground italic">Last Update: November 1, 2025 04:02 PM</div>
              </div>
            </div>
            
            <div className="flex justify-between gap-3 mt-4">
                <Button variant="default" className="flex-1 font-bold">ARCHIVE</Button>
                <Button variant="back" className="flex-1 font-bold" onClick={() => setEditOpen(true)}>EDIT</Button>
            </div>
            </div>
        </div>  

        <Divider className="bg-foregroundLight h-1.5" />

         <div className="p-3">
          <div className="px-4 py- bg-white">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold text-black">Third Semester</div>
              </div>
              <div className="flex items-center gap-2">
                <GuidelinesToggle
                  onChange={(next) => {
                  console.log(`Third Semester toggle changed:`, next);
                  }}
                      />
              </div>
            </div>
            <div className="space-y-0 p-3 mt-4 bg-foregroundLight rounded-md border border-gray-200">
              
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <div className="mt-1 text-md font-bold text-black">Name:</div>
                <div className="mt-1 text-sm font-semibold text-black">name</div>
                
                <div className="mt-1 text-md font-bold text-black">School Year:</div>
                <div className="mt-1 text-sm font-semibold text-black">year</div>
                
                <div className="mt-1 text-md font-bold text-black">Timeline:</div>
                <div className="mt-1 text-sm font-semibold text-black">time</div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-foreground italic">Last Update: November 1, 2025 04:02 PM</div>
              </div>
            </div>
            
            <div className="flex justify-between gap-3 mt-4">
                <Button variant="default" className="flex-1 font-bold">ARCHIVE</Button>
                <Button variant="back" className="flex-1 font-bold" onClick={() => setEditOpen(true)}>EDIT</Button>
              </div>
            </div>
        </div>  
        </div>



       <CreateClearanceTimelineDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(payload) => {
          console.log("Create payload:", payload);
          // TODO: Add actual data handling logic here
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
          console.log("Edit payload:", payload);
          // TODO: Add actual data handling logic here
        }}
       />

      </main>

    </div>
  );
}

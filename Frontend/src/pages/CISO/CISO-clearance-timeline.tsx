import * as React from "react";

import "../../index.css"; 
import { CISOHeader } from "../../stories/components/header";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../stories/components/dialog";

type StoredClearanceTimelineItem = {
  id: string;
  academicYearStart: string;
  academicYearEnd: string;
  term: string;
  clearanceStartDate: string;
  clearanceEndDate: string;
  setAsActive: boolean;
  createdAt: string;
};

const CLEARANCE_TIMELINES_STORAGE_KEY = "ciso_clearance_timelines";
const TIMELINE_API_PATH = "/admin/xu-faculty-clearance/api/ciso/clearance-timeline";
const TERM_ORDER = ["First Semester", "Second Semester", "Intersession"] as const;

function loadTimelineItems(): StoredClearanceTimelineItem[] {
  try {
    const raw = localStorage.getItem(CLEARANCE_TIMELINES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredClearanceTimelineItem[]) : [];
  } catch (error) {
    console.error("Error loading timeline items:", error);
    return [];
  }
}

function saveTimelineItems(items: StoredClearanceTimelineItem[]) {
  try {
    localStorage.setItem(CLEARANCE_TIMELINES_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving timeline items:", error);
    return;
  }
}

type OVPHEClearanceTimelinesResponse = { items: StoredClearanceTimelineItem[] };

type TimelineMutationPayload = ClearanceTimelineDialogValues & {
  id?: string;
};

type TimelineDeletePayload = {
  id: string;
  action: "archive";
};

type ResultModalState = {
  open: boolean;
  title: string;
  description: string;
  tone: "success" | "error";
};

type ToggleConfirmState = {
  open: boolean;
  item: StoredClearanceTimelineItem | null;
  next: boolean;
};

function formatSchoolYear(startYear: string, endYear: string) {
  if (startYear && endYear) return `S.Y. ${startYear}–${endYear}`;
  return `S.Y. ${startYear || endYear}`;
}

function formatInclusiveDates(start: string, end: string) {
  if (!start && !end) return "";
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function termCardLabel(item: StoredClearanceTimelineItem | undefined) {
  if (!item) return "Unset";
  return `${item.term} ${item.academicYearStart}-${item.academicYearEnd}`;
}

function TimelineResultDialog(props: {
  state: ResultModalState;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, onOpenChange } = props;

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background px-6 py-6 text-center">
          <div className="flex justify-center">
            <img
              src={state.tone === "success" ? "/PrimaryAlertIcon.png" : "/RedAlertIcon.png"}
              alt={state.tone === "success" ? "success" : "error"}
              className="h-16 w-16 object-contain"
            />
          </div>
          <DialogTitle className="mt-4 text-center text-xl font-bold text-foreground">
            {state.title}
          </DialogTitle>
          <DialogDescription className="mt-3 text-center text-sm text-foreground">
            {state.description}
          </DialogDescription>
          <div className="mt-6">
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimelineToggleConfirmDialog(props: {
  state: ToggleConfirmState;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { state, isSubmitting, onCancel, onConfirm } = props;
  const actionLabel = state.next ? "Activate" : "Deactivate";
  const itemLabel = state.item ? `${state.item.term} ${state.item.academicYearStart}-${state.item.academicYearEnd}` : "this timeline";

  return (
    <Dialog open={state.open} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background px-6 py-6 text-center">
          <div className="flex justify-center">
            <img
              src={state.next ? "/PrimaryAlertIcon.png" : "/RedAlertIcon.png"}
              alt={actionLabel}
              className="h-16 w-16 object-contain"
            />
          </div>
          <DialogTitle className="mt-4 text-center text-xl font-bold text-foreground">
            Confirm {actionLabel}
          </DialogTitle>
          <DialogDescription className="mt-3 text-center text-sm text-foreground">
            Are you sure you want to {actionLabel.toLowerCase()} `{itemLabel}`?
          </DialogDescription>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="cancel" className="w-full" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={state.next ? "default" : "destructive"}
              className="w-full"
              onClick={onConfirm}
              disabled={isSubmitting || !state.item}
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimelineActiveToggle(props: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  const { checked, disabled = false, onChange } = props;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? "Set timeline inactive" : "Set timeline active"}
      disabled={disabled}
      className={checked
        ? "relative h-6 w-12 rounded-full bg-success transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        : "relative h-6 w-12 rounded-full bg-muted-foreground/30 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      }
      onClick={() => onChange(!checked)}
    >
      <span
        className={checked
          ? "absolute left-[26px] top-1 h-4 w-4 rounded-full bg-white"
          : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white"
        }
      />
    </button>
  );
}

type TimelineTerm = (typeof TERM_ORDER)[number];

function TimelineCard(props: {
  term: TimelineTerm;
  item?: StoredClearanceTimelineItem;
  isSubmitting: boolean;
  onAdd: (term: TimelineTerm) => void;
  onEdit: (item: StoredClearanceTimelineItem) => void;
  onArchive: (item: StoredClearanceTimelineItem) => void;
  onToggleActive: (item: StoredClearanceTimelineItem, next: boolean) => void;
}) {
  const { term, item, isSubmitting, onAdd, onEdit, onArchive, onToggleActive } = props;

  return (
    <div className="p-3">
      <div className="px-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold text-black">{term}</div>
          </div>
        </div>
        <div className="space-y-0 p-3 mt-4 bg-foregroundLight rounded-md border border-gray-200">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div className="mt-1 text-md font-bold text-black">Name:</div>
            <div className="mt-1 text-sm font-semibold text-black">{termCardLabel(item)}</div>

            <div className="mt-1 text-md font-bold text-black">Status:</div>
            <div className="mt-1 text-sm font-semibold text-black">{item ? (item.setAsActive ? "Active" : "Inactive") : "Unset"}</div>

            <div className="mt-1 text-md font-bold text-black">School Year:</div>
            <div className="mt-1 text-sm font-semibold text-black">{item ? formatSchoolYear(item.academicYearStart, item.academicYearEnd) : "Unset"}</div>

            <div className="mt-1 text-md font-bold text-black">Timeline:</div>
            <div className="mt-1 text-sm font-semibold text-black">{item ? formatInclusiveDates(item.clearanceStartDate, item.clearanceEndDate) : "Unset"}</div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-foreground italic">Last Update: {item?.createdAt || ""}</div>
            {item ? <TimelineActiveToggle checked={item.setAsActive} disabled={isSubmitting} onChange={(next) => onToggleActive(item, next)} /> : null}
          </div>
        </div>

        {item ? (
          <div className="flex justify-between gap-3 mt-4">
            <Button
              variant="default"
              className="flex-1 font-bold"
              disabled={isSubmitting}
              onClick={() => onArchive(item)}
            >
              ARCHIVE
            </Button>
            <Button
              variant="back"
              className="flex-1 font-bold"
              disabled={isSubmitting}
              onClick={() => onEdit(item)}
            >
              EDIT
            </Button>
          </div>
        ) : (
          <div className="flex justify-between gap-3 mt-4">
            <Button
              variant="default"
              className="w-full font-bold"
              disabled={isSubmitting}
              onClick={() => onAdd(term)}
            >
              ADD
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CISOClearanceTimeline() {
  const navigate = useNavigate();

  const [items, setItems] = React.useState<StoredClearanceTimelineItem[]>(() => loadTimelineItems());
  const [timelineError, setTimelineError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultModal, setResultModal] = React.useState<ResultModalState>({
    open: false,
    title: "",
    description: "",
    tone: "success",
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createTerm, setCreateTerm] = React.useState<TimelineTerm | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [toggleConfirm, setToggleConfirm] = React.useState<ToggleConfirmState>({
    open: false,
    item: null,
    next: false,
  });

  const refreshTimelines = React.useCallback(() => {
    return fetch(TIMELINE_API_PATH, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: OVPHEClearanceTimelinesResponse) => {
        const nextItems = Array.isArray(data.items) ? data.items : [];
        setItems(nextItems);
        saveTimelineItems(nextItems);
        setTimelineError("");
      })
      .catch(() => {
        setItems([]);
        setTimelineError("Failed to load clearance timelines.");
      });
  }, []);

  const submitTimeline = React.useCallback(
    async (method: "POST" | "PUT", payload: TimelineMutationPayload) => {
      setIsSubmitting(true);
      setTimelineError("");

      try {
        const response = await fetch(TIMELINE_API_PATH, {
          method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error((data && data.detail) || "Timeline request failed.");
        }

        await refreshTimelines();
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Timeline request failed.";
        setTimelineError(message);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshTimelines]
  );

  const deleteTimeline = React.useCallback(
    async (payload: TimelineDeletePayload) => {
      setIsSubmitting(true);
      setTimelineError("");

      try {
        const response = await fetch(TIMELINE_API_PATH, {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error((data && data.detail) || "Timeline request failed.");
        }

        await refreshTimelines();
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Timeline request failed.";
        setTimelineError(message);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [refreshTimelines]
  );

  React.useEffect(() => {
    refreshTimelines();
  }, [refreshTimelines]);

  const timelinesByTerm = React.useMemo(() => {
    return TERM_ORDER.map((term) => items.find((item) => item.term === term));
  }, [items]);

  const editingItem = React.useMemo(
    () => (editingItemId ? items.find((i) => i.id === editingItemId) : undefined),
    [editingItemId, items]
  );

  const editInitialValues = React.useMemo((): Partial<ClearanceTimelineDialogValues> | undefined => {
    if (!editingItem) return undefined;
    return {
      academicYearStart: editingItem.academicYearStart,
      academicYearEnd: editingItem.academicYearEnd,
      term: editingItem.term,
      clearanceStartDate: editingItem.clearanceStartDate,
      clearanceEndDate: editingItem.clearanceEndDate,
      setAsActive: editingItem.setAsActive,
    };  
  }, [editingItem]);

  const createInitialValues = React.useMemo((): Partial<ClearanceTimelineDialogValues> | undefined => {
    if (!createTerm) return undefined;
    return {
      term: createTerm,
    };
  }, [createTerm]);

  const openCreateResult = React.useCallback((tone: "success" | "error", title: string, description: string) => {
    setResultModal({ open: true, tone, title, description });
  }, []);

  const handleArchive = React.useCallback(
    (selected: StoredClearanceTimelineItem) => {
      void deleteTimeline({ id: selected.id, action: "archive" })
        .then(() => {
          openCreateResult("success", "Timeline Archived", `${selected.term} was archived successfully.`);
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Timeline archive failed.";
          openCreateResult("error", "Archive Failed", message);
        });
    },
    [deleteTimeline, openCreateResult]
  );

  const handleToggleActive = React.useCallback(
    (selected: StoredClearanceTimelineItem, next: boolean) => {
      setToggleConfirm({ open: true, item: selected, next });
    },
    []
  );

  const confirmToggleActive = React.useCallback(() => {
    if (!toggleConfirm.item) return;

    const selected = toggleConfirm.item;
    const next = toggleConfirm.next;

    void submitTimeline("PUT", {
      id: selected.id,
      academicYearStart: selected.academicYearStart,
      academicYearEnd: selected.academicYearEnd,
      term: selected.term,
      clearanceStartDate: selected.clearanceStartDate,
      clearanceEndDate: selected.clearanceEndDate,
      setAsActive: next,
    })
      .then(() => {
        setToggleConfirm({ open: false, item: null, next: false });
        openCreateResult(
          "success",
          next ? "Timeline Activated" : "Timeline Deactivated",
          `${selected.term} was marked as ${next ? "active" : "inactive"} successfully.`
        );
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Timeline status update failed.";
        setToggleConfirm({ open: false, item: null, next: false });
        openCreateResult("error", next ? "Activation Failed" : "Deactivation Failed", message);
      });
  }, [openCreateResult, submitTimeline, toggleConfirm.item, toggleConfirm.next]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      <div className="header mb-3">
        <CISOHeader />
      </div>

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

        {timelineError ? (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {timelineError}
          </div>
        ) : null}

        <div className="mt-2 space-y-3 bg-white rounded-lg">
          <div className="bg-primary h-12 text-center p-3 font-bold rounded-t-lg">
            Current Clearance Timeline
          </div>

          {timelinesByTerm.map((item, index) => (
            <React.Fragment key={TERM_ORDER[index]}>
              {index > 0 ? <Divider className={index === 1 ? "bg-foreground" : "bg-foregroundLight h-1.5"} /> : null}
              <TimelineCard
                term={TERM_ORDER[index]}
                item={item}
                isSubmitting={isSubmitting}
                onAdd={(term) => {
                  setCreateTerm(term);
                  setCreateOpen(true);
                }}
                onEdit={(selected) => {
                  setEditingItemId(selected.id);
                  setEditOpen(true);
                }}
                onArchive={handleArchive}
                onToggleActive={handleToggleActive}
              />
            </React.Fragment>
          ))}
        </div>

        <CreateClearanceTimelineDialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setCreateTerm(null);
          }}
          initialValues={createInitialValues}
          hideTermField
          onCreate={(payload) => {
            void submitTimeline("POST", payload)
              .then(() => {
                setCreateOpen(false);
                setCreateTerm(null);
                openCreateResult(
                  "success",
                  "Timeline Created",
                  `${payload.term} for ${payload.academicYearStart}-${payload.academicYearEnd} was created successfully.`
                );
              })
              .catch((error) => {
                const message = error instanceof Error ? error.message : "Timeline creation failed.";
                openCreateResult("error", "Creation Failed", message);
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
            if (!editingItemId) {
              setTimelineError("No timeline selected for editing.");
              return;
            }

            void submitTimeline("PUT", { ...payload, id: editingItemId })
              .then(() => {
                setEditOpen(false);
                setEditingItemId(null);
                openCreateResult(
                  "success",
                  "Timeline Updated",
                  `${payload.term} for ${payload.academicYearStart}-${payload.academicYearEnd} was updated successfully.`
                );
              })
              .catch((error) => {
                const message = error instanceof Error ? error.message : "Timeline update failed.";
                openCreateResult("error", "Update Failed", message);
              });
          }}
        />

        <TimelineResultDialog
          state={resultModal}
          onOpenChange={(open) => setResultModal((prev) => ({ ...prev, open }))}
        />

        <TimelineToggleConfirmDialog
          state={toggleConfirm}
          isSubmitting={isSubmitting}
          onCancel={() => setToggleConfirm({ open: false, item: null, next: false })}
          onConfirm={confirmToggleActive}
        />

      </main>

    </div>
  );
}

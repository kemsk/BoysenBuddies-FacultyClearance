import * as React from "react";

import "../../index.css"; 
import { CISOHeader } from "../../stories/components/header";

import {
  SectionListCard,
} from "../../stories/components/cards";

import { Divider } from "../../stories/components/divider";

import { Button } from "../../stories/components/button";

import { Pencil, Trash2, Upload } from "lucide-react";

import {
  AddApproverDialog,
  EditApproverDialog,
  EditApproverFlowDialog,
} from "../../stories/components/approver-flow-dialogs";

import { Dialog, DialogContent } from "../../stories/components/dialog";
import { Input } from "../../stories/components/input";

import { Badge } from "../../stories/components/badge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../stories/components/alert-dialog";
import { ErrorModal, SuccessModal } from "../../stories/components/success-and-error-modals";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";

type CollegeItem = {
  id: string;
  name: string;
  short: string;
};

type DepartmentItem = {
  id: string;
  collegeId: string;
  name: string;
  short: string;
};

type OfficeItem = {
  id: string;
  name: string;
  short: string;
  displayOrder?: number;
};

type ApproverFlowItem = {
  id: string;
  category: string;
  collegeIds: string[];
  order?: number;
};

type ClearanceTimeline = {
  id: string;
  name: string;
  academicYearStart: string;
  academicYearEnd: string;
  term: string;
  clearanceStartDate: string;
  clearanceEndDate: string;
  setAsActive: boolean;
  createdAt: string;
};

type DraftDepartment = { name: string; short: string };

const FALLBACK_APPROVER_CATEGORIES = [
  "Department Chair",
  "College Dean",
  "University Registrar",
  "University Library",
  "Office of the Vice President for Higher Education",
  "Human Resources Office",
];

async function apiJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const r = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(text || `Request failed: ${r.status}`);
  }
  return (await r.json()) as T;
}

function postCISOActivityLog(_payload: { event_type: string; details?: string[] }) {
  // Temporarily disabled on this page: no activity log POST from College & Office Configuration.
  return;
}

function AddCollegeDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: { college?: { name: string; short: string }; file?: File | null }) => void;
}) {
  const { open, onOpenChange, onCreate } = props;
  const [name, setName] = React.useState("");
  const [short, setShort] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const hasManualCollege = Boolean(name.trim() && short.trim());

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setShort("");
    setSelectedFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [open]);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    setSelectedFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="pb-4 pt-6">
            <div className="px-6 text-center text-base font-bold text-foreground">Add College</div>

            <div className="mt-6 space-y-4">
              {selectedFile ? (
                <div className="mx-6 rounded-lg bg-muted p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center">
                        <img src="BlackFileIcon.png" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-foreground">{selectedFile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(0)} MB
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">Uploaded!</div>
                      </div>
                    </div>
                    <img src="BlackCheckIcon.png" />
                  </div>
                </div>
              ) : (
                <div className="mx-6 mt-4 rounded-md border-2 border-dashed border-muted-foreground/40 bg-muted/30">
                  <button
                    type="button"
                    className="mx-auto flex w-full flex-col items-center justify-center gap-3 p-8"
                    onClick={() => inputRef.current?.click()}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-md text-muted-foreground">
                      <Upload className="h-10 w-10" />
                    </div>
                    <div className="text-md text-muted-foreground">
                      {" "}
                      <span className="font-bold">Click to upload </span> or drag and drop
                    </div>
                    <div className="text-xs text-muted-foreground">CSV or Excel files (Max size 50 MB)</div>
                  </button>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {!selectedFile ? (
                <>
                  <div className="border-t border-[hsl(var(--gray-border))] px-6 mt-4"> </div>

                  <div className="px-6">
                  <div className="">
                    <div className="text-xs font-semibold text-foreground">College Name</div>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-10" />
                  </div>

                  <div className="mt-2"> 
                    <div className="text-xs font-semibold text-foreground">College Code</div>
                    <Input value={short} onChange={(e) => setShort(e.target.value)} className="mt-2 h-10" />
                  </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="cancel"
                className="h-11 w-full "
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="h-11 w-full rounded-md"
                onClick={() => {
                  if (selectedFile) {
                    onCreate({ file: selectedFile });
                    onOpenChange(false);
                    return;
                  }

                  onCreate({ college: { name, short } });
                  onOpenChange(false);
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddDepartmentDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colleges: CollegeItem[];
  collegeId: string;
  onCollegeIdChange: (collegeId: string) => void;
  onCreate: (payload: { collegeId: string; departments?: DraftDepartment[]; file?: File | null }) => void;
}) {
  const { open, onOpenChange, colleges, collegeId, onCollegeIdChange, onCreate } = props;
  const [departments, setDepartments] = React.useState<DraftDepartment[]>([{ name: "", short: "" }]);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setDepartments([{ name: "", short: "" }]);
    setSelectedFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [open]);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    setSelectedFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="pb-4 pt-6">
            <div className="px-6 text-center text-base font-bold text-foreground">Add Department</div>

            <div className="mt-6 space-y-4">
              {selectedFile ? (
                <div className="mx-6 rounded-lg bg-muted p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center">
                        <img src="BlackFileIcon.png" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-foreground">{selectedFile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(0)} MB
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">Uploaded!</div>
                      </div>
                    </div>
                    <img src="BlackCheckIcon.png" />
                  </div>
                </div>
              ) : (
                <div className="mx-6 mt-4 rounded-md border-2 border-dashed border-muted-foreground/40 bg-muted/30">
                  <button
                    type="button"
                    className="mx-auto flex w-full flex-col items-center justify-center gap-3 p-8"
                    onClick={() => inputRef.current?.click()}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-md text-muted-foreground">
                      <Upload className="h-10 w-10" />
                    </div>
                    <div className="text-md text-muted-foreground">
                      {" "}
                      <span className="font-bold">Click to upload </span> or drag and drop
                    </div>
                    <div className="text-xs text-muted-foreground">CSV or Excel files (Max size 50 MB)</div>
                  </button>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {!selectedFile ? (
                <>
                  <div className="border-t border-[hsl(var(--gray-border))] px-6 mt-4"> </div>

                  <div className="px-6">
                    <div>
                      <div className="text-xs font-semibold text-foreground">College</div>
                      <div className="mt-2">
                        <Select value={collegeId} onValueChange={onCollegeIdChange}>
                          <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Choose from dropdown" />
                          </SelectTrigger>
                          <SelectContent>
                            {colleges.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Divider className="my-4 border-[hsl(var(--gray-border))]" />

                    <div>
                      <div className="text-xs font-semibold text-foreground">College Departments/Level Coordinator</div>

                      <div className="mt-2 space-y-2">
                        {departments.map((d, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr,120px] gap-2">
                            <Input
                              value={d.name}
                              onChange={(e) => {
                                const next = [...departments];
                                next[idx] = { ...next[idx], name: e.target.value };
                                setDepartments(next);
                              }}
                              placeholder="Department Name"
                              className="h-10"
                            />
                            <Input
                              value={d.short}
                              onChange={(e) => {
                                const next = [...departments];
                                next[idx] = { ...next[idx], short: e.target.value };
                                setDepartments(next);
                              }}
                              placeholder="Code"
                              className="h-10"
                            />
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        className="mt-3 h-10 w-full rounded-md bg-primary text-primary-foreground"
                        onClick={() => {
                          setDepartments((prev) => [...prev, { name: "", short: "" }]);
                        }}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-semibold">Add New Department</span>
                          <span className="text-lg font-bold">+</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="cancel"
                className="h-11 w-full"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="h-11 w-full rounded-md"
                onClick={() => {
                  if (selectedFile) {
                    onCreate({ collegeId, file: selectedFile });
                    onOpenChange(false);
                    return;
                  }

                  const deptDrafts = (departments || []).filter((d) => d.name.trim() || d.short.trim());
                  onCreate({ collegeId, departments: deptDrafts });
                  onOpenChange(false);
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditCollegeDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: { name: string; short: string };
  onSave: (payload: { name: string; short: string }) => void;
}) {
  const { open, onOpenChange, initialValues, onSave } = props;
  const [name, setName] = React.useState("");
  const [short, setShort] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName(initialValues?.name ?? "");
    setShort(initialValues?.short ?? "");
  }, [open, initialValues?.name, initialValues?.short]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="text-center text-base font-bold text-foreground">Edit College</div>
            <div className="mt-6 space-y-4">
              <div>
                <div className="text-xs font-semibold text-foreground">College Name</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-10" />
              </div>

              <div>
                <div className="text-xs font-semibold text-foreground">Code</div>
                <Input value={short} onChange={(e) => setShort(e.target.value)} className="mt-2 h-10" />
              </div>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="cancel"
                className="h-11 w-full "
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="h-11 w-full rounded-md"
                onClick={() => {
                  onSave({ name, short });
                  onOpenChange(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditDepartmentDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: { name: string; short: string };
  onSave: (payload: { name: string; short: string }) => void;
}) {
  const { open, onOpenChange, initialValues, onSave } = props;
  const [name, setName] = React.useState("");
  const [short, setShort] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName(initialValues?.name ?? "");
    setShort(initialValues?.short ?? "");
  }, [open, initialValues?.name, initialValues?.short]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="text-center text-base font-bold text-foreground">Edit Department</div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-xs font-semibold text-foreground">Department Name</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-10" />
              </div>

              <div>
                <div className="text-xs font-semibold text-foreground">Code</div>
                <Input value={short} onChange={(e) => setShort(e.target.value)} className="mt-2 h-10" />
              </div>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="cancel"
                className="h-11 w-full"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="h-11 w-full rounded-md"
                onClick={() => {
                  onSave({ name, short });
                  onOpenChange(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditOfficeDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: { name: string; short: string };
  onSave: (payload: { name: string; short: string }) => void;
}) {
  const { open, onOpenChange, initialValues, onSave } = props;
  const [name, setName] = React.useState("");
  const [short, setShort] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName(initialValues?.name ?? "");
    setShort(initialValues?.short ?? "");
  }, [open, initialValues?.name, initialValues?.short]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="text-center text-base font-bold text-foreground">Edit Office</div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-xs font-semibold text-foreground">Office Name</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-10" />
              </div>

              <div>
                <div className="text-xs font-semibold text-foreground">Code</div>
                <Input value={short} onChange={(e) => setShort(e.target.value)} className="mt-2 h-10" />
              </div>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="cancel"
                className="h-11 w-full "
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="h-11 w-full rounded-md"
                onClick={() => {
                  onSave({ name, short });
                  onOpenChange(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddOfficeDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: { name: string; short: string }) => void;
}) {
  const { open, onOpenChange, onCreate } = props;
  const [name, setName] = React.useState("");
  const [short, setShort] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName("");
    setShort("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="text-center text-base font-bold text-foreground">Add Office</div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-xs font-semibold text-foreground">Office Name</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-10" />
              </div>

              <div>
                <div className="text-xs font-semibold text-foreground">Code</div>
                <Input value={short} onChange={(e) => setShort(e.target.value)} className="mt-2 h-10" />
              </div>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="cancel"
                className="h-11 w-full"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="h-11 w-full rounded-md"
                onClick={() => {
                  onCreate({ name, short });
                  onOpenChange(false);
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CISOCollegeOfficeConfiguration() {
  const navigate = useNavigate();

  const [colleges, setColleges] = React.useState<CollegeItem[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentItem[]>([]);
  const [offices, setOffices] = React.useState<OfficeItem[]>([]);
  const [approverFlow, setApproverFlow] = React.useState<ApproverFlowItem[]>([]);
  const [timelines, setTimelines] = React.useState<ClearanceTimeline[]>([]);
  const [selectedTimelineId, setSelectedTimelineId] = React.useState<string>(() => {
    // Load saved timeline from localStorage on initial load
    return localStorage.getItem('ciso-selected-timeline') || "";
  });
  const [isConfigurationLocked, setIsConfigurationLocked] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const [selectedCollegeId, setSelectedCollegeId] = React.useState<string>("");

  const [addCollegeOpen, setAddCollegeOpen] = React.useState(false);
  const [addDepartmentOpen, setAddDepartmentOpen] = React.useState(false);
  const [addOfficeOpen, setAddOfficeOpen] = React.useState(false);
  const [addApproverOpen, setAddApproverOpen] = React.useState(false);

  const [editCollegeOpen, setEditCollegeOpen] = React.useState(false);
  const [editDepartmentOpen, setEditDepartmentOpen] = React.useState(false);
  const [editOfficeOpen, setEditOfficeOpen] = React.useState(false);
  const [editApproverOpen, setEditApproverOpen] = React.useState(false);

  const [editApproverFlowOpen, setEditApproverFlowOpen] = React.useState(false);

  const [editingCollegeId, setEditingCollegeId] = React.useState<string | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = React.useState<string | null>(null);
  const [editingOfficeId, setEditingOfficeId] = React.useState<string | null>(null);
  const [editingApproverId, setEditingApproverId] = React.useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = React.useState<{
    open: boolean;
    type?: "college" | "department" | "office" | "approver";
    id?: string;
    label?: string;
  }>({ open: false });

  const [queuedActivityLogs, setQueuedActivityLogs] = React.useState<QueuedActivityLog[]>([]);

  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode>("");
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<React.ReactNode>("");
  const [successContinue, setSuccessContinue] = React.useState<(() => void) | null>(null);

  const queueCISOActivityLog = React.useCallback(
    (payload: { event_type: string; details?: string[] }) => {
      setQueuedActivityLogs((prev) => [...prev, { role: "CISO", payload }]);
    },
    []
  );

  const flushQueuedActivityLogs = React.useCallback(async () => {
    if (!queuedActivityLogs.length) return;

    const logsToFlush = queuedActivityLogs;
    setQueuedActivityLogs([]);

    await Promise.all(
      logsToFlush.map(async (log) => {
        if (log.role === "CISO") {
          postCISOActivityLog(log.payload);
          return;
        }
        postCISOActivityLog(log.payload);
      })
    );
  }, [queuedActivityLogs]);

  React.useEffect(() => {
    // Fetch timelines first
    fetch("/admin/xu-faculty-clearance/api/ciso/clearance-timeline", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { items: ClearanceTimeline[] }) => {
        const timelineItems = data.items ?? [];
        const sortedTimelines = [...timelineItems].sort((a, b) => a.name.localeCompare(b.name));
        setTimelines(sortedTimelines);

        const savedTimelineId = localStorage.getItem('ciso-selected-timeline') || "";
        const savedTimeline = sortedTimelines.find((timeline) => timeline.id === savedTimelineId);
        const activeTimeline = sortedTimelines.find((timeline) => timeline.setAsActive);
        const fallbackTimeline = activeTimeline ?? sortedTimelines[0];

        if (savedTimeline) {
          setSelectedTimelineId(savedTimeline.id);
        } else if (fallbackTimeline) {
          setSelectedTimelineId(fallbackTimeline.id);
          localStorage.setItem('ciso-selected-timeline', fallbackTimeline.id);
        }
      })
      .catch(() => {
        setTimelines([]);
      });

    // Fetch org structure
    fetch("/admin/xu-faculty-clearance/api/ciso/org-structure", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { colleges: CollegeItem[]; departments: DepartmentItem[]; offices: OfficeItem[] }) => {
        const initialColleges = data.colleges ?? [];
        const initialDepartments = data.departments ?? [];
        const initialOffices = data.offices ?? [];

        setColleges(initialColleges);
        setDepartments(initialDepartments);
        setOffices(initialOffices);
        setSelectedCollegeId(initialColleges[0]?.id ?? "");
      })
      .catch(() => {
        setColleges([]);
        setDepartments([]);
        setOffices([]);
        setSelectedCollegeId("");
      });
  }, []);

  // Refresh functions
  const fetchColleges = React.useCallback(async () => {
    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/ciso/org-structure", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setColleges(data.colleges ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch colleges:", error);
    }
  }, []);

  const fetchDepartments = React.useCallback(async () => {
    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/ciso/org-structure", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  }, []);

  const fetchOffices = React.useCallback(async () => {
    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/ciso/org-structure", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOffices(data.offices ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch offices:", error);
    }
  }, []);

  // Refetch approver flow data
  const refetchApproverFlow = React.useCallback(async () => {
    const approverFlowUrl = selectedTimelineId 
      ? `/admin/xu-faculty-clearance/api/ciso/approver-flow?timeline_id=${selectedTimelineId}`
      : "/admin/xu-faculty-clearance/api/ciso/approver-flow";
    
    try {
      const response = await fetch(approverFlowUrl, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        const steps = (data.steps ?? []).slice().sort((a: ApproverFlowItem, b: ApproverFlowItem) => (a.order ?? 0) - (b.order ?? 0));
        setApproverFlow(steps);
      } else {
        setApproverFlow([]);
      }
    } catch {
      setApproverFlow([]);
    }
  }, [selectedTimelineId]);

  // Fetch approver flow when timeline changes
  React.useEffect(() => {
    refetchApproverFlow();
  }, [selectedTimelineId, refetchApproverFlow]);

  // Check if selected timeline is active
  React.useEffect(() => {
    const selectedTimeline = timelines.find((t) => t.id === selectedTimelineId);
    setIsConfigurationLocked(selectedTimeline?.setAsActive ?? false);
  }, [selectedTimelineId, timelines]);

  const approverCategories = React.useMemo(() => {
    const raw = approverFlow.map((s) => (s.category ?? "").trim()).filter(Boolean);
    const unique = Array.from(new Set(raw));
    // Always include fallback categories to ensure all options are available
    const allCategories = [...FALLBACK_APPROVER_CATEGORIES];
    // Add any custom categories from the current approver flow
    unique.forEach(category => {
      if (!allCategories.includes(category)) {
        allCategories.push(category);
      }
    });
    return allCategories;
  }, [approverFlow]);

  const filteredDepartments = React.useMemo(
    () => departments.filter((d) => d.collegeId === selectedCollegeId),
    [departments, selectedCollegeId]
  );

  const selectedCollegeName = React.useMemo(
    () => colleges.find((c) => c.id === selectedCollegeId)?.name ?? "",
    [colleges, selectedCollegeId]
  );

  const editingCollege = React.useMemo(
    () => (editingCollegeId ? colleges.find((c) => c.id === editingCollegeId) : undefined),
    [colleges, editingCollegeId]
  );

  const editingDepartment = React.useMemo(
    () => (editingDepartmentId ? departments.find((d) => d.id === editingDepartmentId) : undefined),
    [departments, editingDepartmentId]
  );

  const editingOffice = React.useMemo(
    () => (editingOfficeId ? offices.find((o) => o.id === editingOfficeId) : undefined),
    [offices, editingOfficeId]
  );

  const handleSaveConfiguration = React.useCallback(async () => {
    if (!selectedTimelineId) return;
    
    setIsSaving(true);
    try {
      // Save configuration for the selected timeline
      const response = await fetch(`/admin/xu-faculty-clearance/api/ciso/college-office-configuration?timeline_id=${selectedTimelineId}`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timelineId: selectedTimelineId,
          colleges,
          departments,
          offices,
          approverFlow,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save configuration error:', errorText);
        throw new Error(`Failed to save configuration: ${errorText}`);
      }
      
      // Show success modal
      setSuccessMessage('Configuration saved successfully!');
      setSuccessContinue(() => () => {
        setSuccessOpen(false);
        setSuccessMessage('');
      });
      setSuccessOpen(true);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setErrorMessage('Failed to save configuration. Please try again.');
      setErrorOpen(true);
    } finally {
      setIsSaving(false);
    }
  }, [selectedTimelineId, colleges, departments, offices, approverFlow]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-4 md:px-6 lg:px-[1in] pt-4 pb-4 w-full">
        
        <h1 className="text-2xl text-left text-primary font-bold">College & Office Configuration</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/system-admin-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>College & Office Configuration</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/system-admin-tools")}> 
              <div className="flex items-center gap-2">
                <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
              </div>
          </Button>
        </div>

        {/* MOBILE LAYOUT */}
        <div className="mt-4 space-y-5 lg:hidden">
          <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-black font-bold">Choose Semester</div>
            <div className="mt-3">
              <Select value={selectedTimelineId} onValueChange={(value) => {
                setSelectedTimelineId(value);
                localStorage.setItem('ciso-selected-timeline', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select clearance timeline" />
                </SelectTrigger>
                <SelectContent>
                  {timelines.map((timeline) => (
                    <SelectItem key={timeline.id} value={timeline.id}>
                      {timeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTimelineId && (
              <div className="mt-2">
                {(() => {
                  const timeline = timelines.find(t => t.id === selectedTimelineId);
                  if (!timeline) return null;
                  return (
                    <div className="text-sm text-gray-600">
                      <div>Academic Year: {timeline.academicYearStart}-{timeline.academicYearEnd}</div>
                      <div>Clearance Period: {timeline.clearanceStartDate} to {timeline.clearanceEndDate}</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="border-2 border-orange-400 bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <h3 className="font-bold text-orange-800">Important Notes:</h3>
                </div>
                <ul className="space-y-2 text-sm text-orange-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">·</span>
                    <span>Ensure all Colleges, Departments, and Offices required for the Faculty Clearance Process are properly configured on this page.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">·</span>
                    <span>Once a Clearance Timeline is set to "Active" status, no further configuration changes can be made.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="w-full space-y-5">

            <SectionListCard
              title="Colleges"
              headerActionImgAlt="Add"
              headerActionImgSrc="/WhitePlusIcon.png"
              headerActionOnClick={() => setAddCollegeOpen(true)}
            >
              <div className="p-4">
                <div className="space-y-2">
                  {colleges.map((c, idx) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-md bg-muted px-4 py-3"
                    >
                      <div className="min-w-0 text-sm font-semibold text-foreground">
                        {idx + 1}. {c.name} ({c.short})
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-muted-foreground/20 p-0 text-foreground hover:bg-muted-foreground/20"
                          onClick={() => {
                            setEditingCollegeId(c.id);
                            setEditCollegeOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center rounded-md p-0"
                          onClick={() => {
                            setConfirmDelete({
                              open: true,
                              type: "college",
                              id: c.id,
                              label: c.name,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionListCard>

            <SectionListCard
              title="College Departments/Level Coordinator"
              headerActionImgAlt="Add"
              headerActionImgSrc="/WhitePlusIcon.png"
              headerActionOnClick={() => setAddDepartmentOpen(true)}
            >
              <div className="p-4">
                <div className="text-xs font-semibold text-muted-foreground">Filter by College</div>
                <div className="mt-2">
                  <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Choose from dropdown" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Divider className="my-4 border-[hsl(var(--gray-border))]" />

                <div className="space-y-2">
                  {filteredDepartments.map((d, idx) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-md bg-muted px-4 py-3"
                    >
                      <div className="min-w-0 text-sm font-semibold text-foreground">
                        {idx + 1}. {d.name} ({d.short})
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-muted-foreground/20 p-0 text-foreground hover:bg-muted-foreground/20"
                          onClick={() => {
                            setEditingDepartmentId(d.id);
                            setEditDepartmentOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center rounded-md p-0"
                          onClick={() => {
                            setConfirmDelete({
                              open: true,
                              type: "department",
                              id: d.id,
                              label: d.name,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionListCard>

            <SectionListCard
              title="Offices"
              headerActionImgAlt="Add"
              headerActionImgSrc="/WhitePlusIcon.png"
              headerActionOnClick={() => setAddOfficeOpen(true)}
            >
              <div className="p-4">
                <div className="space-y-2">
                  {offices.map((o, idx) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-md bg-muted px-4 py-3"
                    >
                      <div className="min-w-0 text-sm font-semibold text-foreground">
                        {idx + 1}. {o.name} ({o.short})
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-muted-foreground/20 p-0 text-foreground hover:bg-muted-foreground/20"
                          onClick={() => {
                            setEditingOfficeId(o.id);
                            setEditOfficeOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="flex h-8 w-8 items-center justify-center rounded-md p-0"
                          onClick={() => {
                            setConfirmDelete({
                              open: true,
                              type: "office",
                              id: o.id,
                              label: o.name,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionListCard>

            <SectionListCard
              title="Approver Flow"
              headerActions={
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    className="text-primary-foreground"
                    onClick={() => setEditApproverFlowOpen(true)}
                  >
                    <img src="/WhiteDirectionIcon.png" alt="List Ordered" className="h-5 w-5 object-contain" />
                  </Button>

                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    className="text-primary-foreground"
                    onClick={() => setAddApproverOpen(true)}
                  >
                    <img src="/WhitePlusIcon.png" alt="Add" className="h-6 w-6 object-contain" />
                  </Button>
                </div>
              }
            >
              <div className="p-4">
                <div className="space-y-2">
                  {approverFlow.map((a, idx) => {
                    const isAll = a.collegeIds.length === 0 || a.collegeIds.length === colleges.length;
                    const badges = isAll
                      ? ["ALL"]
                      : a.collegeIds
                          .map((id) => colleges.find((c) => c.id === id)?.short)
                          .filter((v): v is string => !!v);

                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-md bg-muted px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">
                            {idx + 1}. {a.category}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {badges.map((b) => (
                              <Badge key={b} className="h-5 rounded-full px-2 text-[10px]">
                                {b}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-muted-foreground/20 p-0 text-foreground hover:bg-muted-foreground/20"
                            onClick={() => {
                              setEditingApproverId(a.id);
                              setEditApproverOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="flex h-8 w-8 items-center justify-center rounded-md p-0"
                            onClick={() => {
                              setConfirmDelete({
                                open: true,
                                type: "approver",
                                id: a.id,
                                label: a.category,
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionListCard>
          </div>

          <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="border-2 border-orange-400 bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <h3 className="font-bold text-orange-800">Important Notes:</h3>
                </div>
                <ul className="space-y-2 text-sm text-orange-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">·</span>
                    <span>Ensure all Colleges, Departments, and Offices required for the Faculty Clearance Process are properly configured on this page.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">·</span>
                    <span>Once a Clearance Timeline is set to "Active" status, no further configuration changes can be made.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-5 lg:items-start mt-4">
          <div className="lg:col-span-1 space-y-5">
            <SectionListCard
              title="Approver Flow"
              headerActions={
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    className="text-primary-foreground"
                    onClick={() => setEditApproverFlowOpen(true)}
                  >
                    <img src="/WhiteDirectionIcon.png" alt="List Ordered" className="h-5 w-5 object-contain" />
                  </Button>

                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    className="text-primary-foreground"
                    onClick={() => setAddApproverOpen(true)}
                  >
                    <img src="/WhitePlusIcon.png" alt="Add" className="h-6 w-6 object-contain" />
                  </Button>
                </div>
              }
            >
              <div className="p-4">
                <div className="space-y-2">
                  {approverFlow.map((a, idx) => {
                    const isAll = a.collegeIds.length === 0 || a.collegeIds.length === colleges.length;
                    const badges = isAll
                      ? ["ALL"]
                      : a.collegeIds
                          .map((id) => colleges.find((c) => c.id === id)?.short)
                          .filter((v): v is string => !!v);

                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-md bg-muted px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground">
                            {idx + 1}. {a.category}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {badges.map((b) => (
                              <Badge key={b} className="h-5 rounded-full px-2 text-[10px]">
                                {b}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-md bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/20"
                            onClick={() => {
                              setEditingApproverId(a.id);
                              setEditApproverOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={() => {
                              setConfirmDelete({
                                open: true,
                                type: "approver",
                                id: a.id,
                                label: a.category,
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionListCard>

            <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-black font-bold">Choose Semester</div>
              <div className="mt-3">
                <Select value={selectedTimelineId} onValueChange={(value) => {
                  setSelectedTimelineId(value);
                  localStorage.setItem('ciso-selected-timeline', value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clearance timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {timelines.map((timeline) => (
                      <SelectItem key={timeline.id} value={timeline.id}>
                        {timeline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTimelineId && (
                <div className="mt-2">
                  {(() => {
                    const timeline = timelines.find(t => t.id === selectedTimelineId);
                    if (!timeline) return null;
                    return (
                      <div className="text-sm text-gray-600">
                        <div>Academic Year: {timeline.academicYearStart}-{timeline.academicYearEnd}</div>
                        <div>Clearance Period: {timeline.clearanceStartDate} to {timeline.clearanceEndDate}</div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="border-2 border-orange-400 bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <h3 className="font-bold text-orange-800">Important Notes:</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-orange-700">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">·</span>
                      <span>Ensure all Colleges, Departments, and Offices required for the Faculty Clearance Process are properly configured on this page.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">·</span>
                      <span>Once a Clearance Timeline is set to "Active" status, no further configuration changes can be made.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <SectionListCard
              title="Colleges"
              headerActionImgAlt="Add"
              headerActionImgSrc="/WhitePlusIcon.png"
              headerActionOnClick={() => setAddCollegeOpen(true)}
            >
              <div className="p-4">
                <div className="space-y-2">
                  {colleges.map((c, idx) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-md bg-muted px-4 py-3"
                    >
                      <div className="min-w-0 text-sm font-semibold text-foreground">
                        {idx + 1}. {c.name} ({c.short})
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-md bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/20"
                          onClick={() => {
                            setEditingCollegeId(c.id);
                            setEditCollegeOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-md"
                          onClick={() => {
                            setConfirmDelete({
                              open: true,
                              type: "college",
                              id: c.id,
                              label: c.name,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionListCard>
          </div>

          <div className="lg:col-span-1">
            <SectionListCard
              title="College Departments/Level Coordinator"
              headerActionImgAlt="Add"
              headerActionImgSrc="/WhitePlusIcon.png"
              headerActionOnClick={() => setAddDepartmentOpen(true)}
            >
              <div className="p-4">
                <div className="text-xs font-semibold text-muted-foreground">Filter by College</div>
                <div className="mt-2">
                  <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Choose from dropdown" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Divider className="my-4 border-[hsl(var(--gray-border))]" />

                <div className="space-y-2">
                  {filteredDepartments.map((d, idx) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-md bg-muted px-4 py-3"
                    >
                      <div className="min-w-0 text-sm font-semibold text-foreground">
                        {idx + 1}. {d.name} ({d.short})
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-md bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/20"
                          onClick={() => {
                            setEditingDepartmentId(d.id);
                            setEditDepartmentOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-md"
                          onClick={() => {
                            setConfirmDelete({
                              open: true,
                              type: "department",
                              id: d.id,
                              label: d.name,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionListCard>
          </div>

          <div className="lg:col-span-1">
            <SectionListCard
              title="Offices"
              headerActionImgAlt="Add"
              headerActionImgSrc="/WhitePlusIcon.png"
              headerActionOnClick={() => setAddOfficeOpen(true)}
            >
              <div className="p-4">
                <div className="space-y-2">
                  {offices.map((o, idx) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-md bg-muted px-4 py-3"
                    >
                      <div className="min-w-0 text-sm font-semibold text-foreground">
                        {idx + 1}. {o.name} ({o.short})
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-md bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/20"
                          onClick={() => {
                            setEditingOfficeId(o.id);
                            setEditOfficeOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-md"
                          onClick={() => {
                            setConfirmDelete({
                              open: true,
                              type: "office",
                              id: o.id,
                              label: o.name,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionListCard>
          </div>
        </div>

        <AddCollegeDialog
          open={addCollegeOpen}
          onOpenChange={setAddCollegeOpen}
          onCreate={({ college, file }) => {
            (async () => {
              if (file) {
                // Handle CSV upload
                const formData = new FormData();
                formData.append('csv_file', file);
                
                try {
                  const response = await fetch(
                    "/admin/xu-faculty-clearance/api/ciso/colleges/csv-upload",
                    {
                      method: "POST",
                      credentials: "include",
                      body: formData,
                    }
                  );
                  
                  if (response.ok) {
                    const result = await response.json();
                    // Refresh colleges list after successful upload
                    const orgResponse = await fetch(
                      "/admin/xu-faculty-clearance/api/ciso/org-structure",
                      { credentials: "include" }
                    );
                    if (orgResponse.ok) {
                      const orgData = await orgResponse.json();
                      setColleges(orgData.colleges ?? []);
                    }
                    
                    // Log the activity
                    postCISOActivityLog({
                      event_type: "imported_colleges_csv",
                      details: [
                        `Created: ${result.created}`,
                        `Updated: ${result.updated}`,
                        `Skipped: ${result.skipped}`,
                      ],
                    });
                  }
                } catch (error) {
                  console.error("Error uploading college CSV:", error);
                }
                return;
              }

              if (!college) {
                return;
              }

              const created = await apiJson<CollegeItem>(
                "/admin/xu-faculty-clearance/api/ciso/colleges",
                {
                  method: "POST",
                  body: JSON.stringify({ name: college.name, short: college.short }),
                }
              );

              try {
                await fetch("/admin/xu-faculty-clearance/api/ciso/activity-logs", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event_type: "created_college",
                    details: created?.name ? [`College: ${created.name}`] : [],
                    user_role: "CISO",
                  }),
                });
              } catch {
                // ignore
              }

              postCISOActivityLog({
                event_type: "created_college",
                details: created?.name ? [`College: ${created.name}`] : [],
              });

              setColleges((prev) => [...prev, created]);
              setSelectedCollegeId(created.id);
              
              // Show success modal
              setSuccessMessage(`College "${created.name}" created successfully!`);
              setSuccessContinue(() => () => {
                setSuccessOpen(false);
                setSuccessMessage('');
              });
              setSuccessOpen(true);
            })().catch(() => {
              // ignore; can be handled by UI later
            });
          }}
        />

        <AddApproverDialog
          open={addApproverOpen}
          onOpenChange={setAddApproverOpen}
          colleges={colleges}
          categories={approverCategories}
          onCreate={async (payload) => {
            // Enhanced duplicate prevention for approver flow - strict category check
            const isDuplicate = approverFlow.some(existing => {
              return existing.category === payload.category;
            });
            
            if (isDuplicate) {
              setErrorMessage(
                <div>
                  <p>Duplicate approver category detected!</p>
                  <p className="mt-2">Category: <strong>"{payload.category}"</strong></p>
                  <p className="mt-2">An approver with category "{payload.category}" already exists. Each category can only be used once.</p>
                </div>
              );
              setErrorOpen(true);
              return;
            }
            
            try {
              const apiUrl = selectedTimelineId 
                ? `/admin/xu-faculty-clearance/api/ciso/approver-flow/steps?timeline_id=${selectedTimelineId}`
                : "/admin/xu-faculty-clearance/api/ciso/approver-flow/steps";
              
              const response = await fetch(apiUrl, {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  category: payload.category,
                  collegeIds: payload.collegeIds,
                  order: approverFlow.length + 1,
                }),
              });

              if (!response.ok) {
                const errorText = await response.text();
                setErrorMessage(`Failed to create approver flow step. Status: ${response.status}. Error: ${errorText}`);
                setErrorOpen(true);
                return;
              }

              const created = await response.json();

              const addedCollegeNames = payload.collegeIds
                .map((id) => colleges.find((c) => c.id === id)?.name)
                .filter(Boolean);

              postCISOActivityLog({
                event_type: "added_approver",
                details: [
                  `Approver Category: ${payload.category}`,
                  `Colleges: ${addedCollegeNames.join(", ")}`,
                ],
              });

              // Refetch approver flow data to update UI
              await refetchApproverFlow();

              setSuccessMessage('Approver flow step created successfully!');
              setSuccessContinue(() => () => {
                setSuccessOpen(false);
                setSuccessMessage('');
              });
              setSuccessOpen(true);
            } catch (error) {
              console.error('Error creating approver flow step:', error);
              setErrorMessage('Failed to create approver flow step. Please try again.');
              setErrorOpen(true);
            }
          }}
        />

        <AddDepartmentDialog
          open={addDepartmentOpen}
          onOpenChange={setAddDepartmentOpen}
          colleges={colleges}
          collegeId={selectedCollegeId}
          onCollegeIdChange={setSelectedCollegeId}
          onCreate={({ collegeId, departments: deptDrafts, file }) => {
            if (file) {
              // Handle CSV upload
              const formData = new FormData();
              formData.append('csv_file', file);
              
              try {
                fetch(
                  "/admin/xu-faculty-clearance/api/ciso/departments/csv-upload",
                  {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                  }
                ).then(async (response) => {
                  if (response.ok) {
                    const result = await response.json();
                    // Refresh departments list after successful upload
                    const orgResponse = await fetch(
                      "/admin/xu-faculty-clearance/api/ciso/org-structure",
                      { credentials: "include" }
                    );
                    if (orgResponse.ok) {
                      const orgData = await orgResponse.json();
                      setDepartments(orgData.departments ?? []);
                    }
                    
                    // Log the activity
                    postCISOActivityLog({
                      event_type: "imported_departments_csv",
                      details: [
                        `Created: ${result.created}`,
                        `Updated: ${result.updated}`,
                        `Skipped: ${result.skipped}`,
                      ],
                    });
                  }
                }).catch((error) => {
                  console.error("Error uploading department CSV:", error);
                });
              } catch (error) {
                console.error("Error uploading department CSV:", error);
              }
              return;
            }

            if (!collegeId) return;

            const selectedCollegeNameForLog = colleges.find((c) => c.id === collegeId)?.name ?? "";
            const drafts = (deptDrafts || []).filter((d) => d.name.trim() || d.short.trim());
            if (!drafts.length) return;

            (async () => {
              const createdDepts = await Promise.all(
                drafts.map((d) =>
                  apiJson<DepartmentItem>("/admin/xu-faculty-clearance/api/ciso/departments", {
                    method: "POST",
                    body: JSON.stringify({
                      collegeId,
                      name: d.name,
                      short: d.short,
                    }),
                  })
                )
              );

              for (const created of createdDepts) {
                try {
                  await fetch("/admin/xu-faculty-clearance/api/ciso/activity-logs", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      event_type: "created_department",
                      details: [
                        created?.name ? `Department: ${created.name}` : "",
                        selectedCollegeNameForLog ? `College: ${selectedCollegeNameForLog}` : "",
                      ].filter(Boolean),
                      user_role: "CISO",
                    }),
                  });
                } catch {
                  // ignore
                }

                postCISOActivityLog({
                  event_type: "created_department",
                  details: [
                    created?.name ? `Department: ${created.name}` : "",
                    selectedCollegeNameForLog ? `College: ${selectedCollegeNameForLog}` : "",
                  ].filter(Boolean),
                });
              }

              setDepartments((prev) => [...prev, ...createdDepts]);
              
              // Show success modal
              const deptNames = createdDepts.map(d => d.name).join(", ");
              setSuccessMessage(`${createdDepts.length} department(s) created successfully: ${deptNames}`);
              setSuccessContinue(() => () => {
                setSuccessOpen(false);
                setSuccessMessage('');
              });
              setSuccessOpen(true);
            })().catch(() => {
              // ignore; can be handled by UI later
            });
          }}
        />

        <AddOfficeDialog
          open={addOfficeOpen}
          onOpenChange={setAddOfficeOpen}
          onCreate={(payload) => {
            (async () => {
              const created = await apiJson<OfficeItem>(
                "/admin/xu-faculty-clearance/api/ciso/offices",
                {
                  method: "POST",
                  body: JSON.stringify({ name: payload.name, short: payload.short }),
                }
              );

              try {
                await fetch("/admin/xu-faculty-clearance/api/ciso/activity-logs", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event_type: "created_office",
                    details: created?.name ? [`Office: ${created.name}`] : [],
                    user_role: "CISO",
                  }),
                });
              } catch {
                // ignore
              }

              postCISOActivityLog({
                event_type: "created_office",
                details: created?.name ? [`Office: ${created.name}`] : [],
              });
              setOffices((prev) => [...prev, created]);
              
              // Show success modal
              setSuccessMessage(`Office "${created.name}" created successfully!`);
              setSuccessContinue(() => () => {
                setSuccessOpen(false);
                setSuccessMessage('');
              });
              setSuccessOpen(true);
            })().catch(() => {
              // ignore; can be handled by UI later
            });
          }}
        />

        <AlertDialog
          open={confirmDelete.open}
          onOpenChange={(open: boolean) => {
            if (!open) setConfirmDelete({ open: false });
          }}
        >
          <AlertDialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl bg-background p-0">
            <div className="rounded-xl bg-background">
              <AlertDialogHeader className="px-6 pb-4 pt-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center ">
                <img src="/RedAlertIcon.png" />
              </div>

                <AlertDialogTitle className="mt-4 text-center text-base font-semibold text-foreground">
                  You are about to <span className="text-destructive">DELETE</span>
                </AlertDialogTitle>
                <div className="mt-1 text-center font-semibold text-foreground">
                  “{confirmDelete.open ? confirmDelete.label : ""}”
                </div>

                <div className="mt-4 text-center text-sm font-semibold text-foreground">Do you wish to continue?</div>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-2 flex flex-col gap-2 px-6 pb-6 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  className="h-11 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (!confirmDelete.open) return;

                    if (confirmDelete.type === "college") {
                      (async () => {
                        postCISOActivityLog({
                          event_type: "deleted_college",
                          details: confirmDelete.label ? [`College: ${confirmDelete.label}`] : [],
                        });
                        await apiJson(
                          `/admin/xu-faculty-clearance/api/ciso/colleges/${confirmDelete.id}`,
                          { method: "DELETE" }
                        );
                        queueCISOActivityLog({
                          event_type: "deleted_college",
                          details: confirmDelete.label ? [`College: ${confirmDelete.label}`] : [],
                        });
                        
                        // Remove approver flow steps that reference the deleted college
                        const stepsToDelete = approverFlow.filter((step) => 
                          confirmDelete.id && step.collegeIds.includes(confirmDelete.id)
                        );
                        
                        // Delete each approver flow step via API
                        for (const step of stepsToDelete) {
                          try {
                            await apiJson(
                              `/admin/xu-faculty-clearance/api/ciso/approver-flow/steps/${step.id}`,
                              { method: "DELETE" }
                            );
                          } catch (error) {
                            // ignore individual step deletion errors
                          }
                        }
                        
                        // Show success modal
                        setSuccessMessage(`College "${confirmDelete.label}" deleted successfully!`);
                        setSuccessContinue(() => () => {
                          setSuccessOpen(false);
                          setSuccessMessage('');
                        });
                        setSuccessOpen(true);
                      })();
                    }

                    if (confirmDelete.type === "department") {
                      (async () => {
                        const dept = departments.find((d) => d.id === confirmDelete.id);
                        const collegeName = colleges.find((c) => c.id === dept?.collegeId)?.name ?? "";
                        const details = [
                          confirmDelete.label ? `Department: ${confirmDelete.label}` : "",
                          collegeName ? `College: ${collegeName}` : "",
                        ].filter(Boolean);

                        try {
                          await fetch("/admin/xu-faculty-clearance/api/ciso/activity-logs", {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              event_type: "deleted_department",
                              details,
                              user_role: "CISO",
                            }),
                          });
                        } catch {
                          // ignore
                        }

                        await apiJson(
                          `/admin/xu-faculty-clearance/api/ciso/departments/${confirmDelete.id}`,
                          { method: "DELETE" }
                        );
                        
                        // Show success modal
                        setSuccessMessage(`Department "${confirmDelete.label}" deleted successfully!`);
                        setSuccessContinue(() => () => {
                          setSuccessOpen(false);
                          setSuccessMessage('');
                        });
                        setSuccessOpen(true);
                      })();
                    }

                    if (confirmDelete.type === "office") {
                      (async () => {
                        try {
                          // Make direct API call to delete the office
                          await apiJson(
                            `/admin/xu-faculty-clearance/api/ciso/offices/${confirmDelete.id}`,
                            { method: "DELETE" }
                          );
                          
                          // Log activity
                          try {
                            await fetch("/admin/xu-faculty-clearance/api/ciso/activity-logs", {
                              method: "POST",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                event_type: "deleted_office",
                                details: confirmDelete.label ? [`Office: ${confirmDelete.label}`] : [],
                                user_role: "CISO",
                              }),
                            });
                          } catch {
                            // ignore
                          }

                          postCISOActivityLog({
                            event_type: "deleted_office",
                            details: confirmDelete.label ? [`Office: ${confirmDelete.label}`] : [],
                          });
                          
                          // Show success modal
                          setSuccessMessage(`Office "${confirmDelete.label}" deleted successfully!`);
                          setSuccessContinue(() => () => {
                            setSuccessOpen(false);
                            setSuccessMessage('');
                          });
                          setSuccessOpen(true);
                        } catch (error) {
                          // ignore office deletion errors
                        }
                      })();
                    }

                    if (confirmDelete.type === "approver") {
                      (async () => {
                        try {
                          // Make direct API call to delete the approver flow step
                          await apiJson(
                            `/admin/xu-faculty-clearance/api/ciso/approver-flow/steps/${confirmDelete.id}`,
                            { method: "DELETE" }
                          );
                          
                          // Refetch approver flow data to update UI
                          await refetchApproverFlow();
                          
                          // Log activity
                          const step = approverFlow.find((a) => a.id === confirmDelete.id);
                          const isAll = !step || step.collegeIds.length === 0 || step.collegeIds.length === colleges.length;
                          const collegeTitles = isAll
                            ? ["ALL"]
                            : (step.collegeIds
                                .map((id) => colleges.find((c) => c.id === id)?.name)
                                .filter(Boolean) as string[]);
                          const details = [
                            step?.category ? `Department/Office Name = ("${step.category}")` : "",
                            `College : ${collegeTitles.length ? collegeTitles.join(", ") : ""}`,
                          ].filter((d) => {
                            const t = String(d ?? "").trim();
                            return !!t && t !== "College :";
                          });

                          try {
                            await fetch("/admin/xu-faculty-clearance/api/ciso/activity-logs", {
                              method: "POST",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                event_type: "removed_from_approver_flow",
                                details,
                                user_role: "CISO",
                              }),
                            });
                          } catch {
                            // ignore
                          }
                          
                          // Show success modal
                          setSuccessMessage(`Approver "${step?.category}" deleted successfully!`);
                          setSuccessContinue(() => () => {
                            setSuccessOpen(false);
                            setSuccessMessage('');
                          });
                          setSuccessOpen(true);
                        } catch (error) {
                          // ignore approver step deletion errors
                        }
                      })();
                    }

                    setConfirmDelete({ open: false });
                  }}
                >
                  Delete
                </AlertDialogAction>

                <AlertDialogCancel
                  className="h-11 w-full"
                  onClick={() => setConfirmDelete({ open: false })}
                >
                  Cancel
                </AlertDialogCancel>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      <EditCollegeDialog
          open={editCollegeOpen}
          onOpenChange={setEditCollegeOpen}
          initialValues={editingCollegeId ? colleges.find(c => c.id === editingCollegeId) : undefined}
          onSave={async (payload) => {
            if (!editingCollegeId) return;
            
            try {
              await apiJson(
                `/admin/xu-faculty-clearance/api/ciso/colleges/${editingCollegeId}`,
                {
                  method: "PATCH",
                  body: JSON.stringify(payload),
                }
              );
              
              // Show success modal
              setSuccessMessage(`College "${payload.name}" updated successfully!`);
              setSuccessContinue(() => () => {
                setSuccessOpen(false);
                setSuccessMessage('');
              });
              setSuccessOpen(true);
              
              // Refresh data
              try {
                await fetchColleges();
              } catch (refreshError) {
                console.error("Failed to refresh colleges:", refreshError);
              }
            } catch (error) {
              console.error("Failed to update college:", error);
              setErrorMessage("Failed to update college. Please try again.");
              setErrorOpen(true);
            }
          }}
        />

        <EditDepartmentDialog
          open={editDepartmentOpen}
          onOpenChange={setEditDepartmentOpen}
          initialValues={editingDepartmentId ? {
              name: departments.find(d => d.id === editingDepartmentId)?.name ?? "",
              short: departments.find(d => d.id === editingDepartmentId)?.short ?? ""
            } : undefined}
          onSave={async (payload) => {
            if (!editingDepartmentId) return;
            
            try {
              await apiJson(
                `/admin/xu-faculty-clearance/api/ciso/departments/${editingDepartmentId}`,
                {
                  method: "PATCH",
                  body: JSON.stringify(payload),
                }
              );
              
              // Show success modal
              setSuccessMessage(`Department "${payload.name}" updated successfully!`);
              setSuccessContinue(() => () => {
                setSuccessOpen(false);
                setSuccessMessage('');
              });
              setSuccessOpen(true);
              
              // Refresh data
              try {
                await fetchDepartments();
              } catch (refreshError) {
                console.error("Failed to refresh departments:", refreshError);
              }
            } catch (error) {
              console.error("Failed to update department:", error);
              setErrorMessage("Failed to update department. Please try again.");
              setErrorOpen(true);
            }
          }}
        />

        <EditOfficeDialog
          open={editOfficeOpen}
          onOpenChange={setEditOfficeOpen}
          initialValues={editingOfficeId ? {
              name: offices.find(o => o.id === editingOfficeId)?.name ?? "",
              short: offices.find(o => o.id === editingOfficeId)?.short ?? ""
            } : undefined}
          onSave={async (payload) => {
            if (!editingOfficeId) return;
            
            try {
              await apiJson(
                `/admin/xu-faculty-clearance/api/ciso/offices/${editingOfficeId}`,
                {
                  method: "PATCH",
                  body: JSON.stringify(payload),
                }
              );
              
              // Show success modal
              setSuccessMessage(`Office "${payload.name}" updated successfully!`);
              setSuccessContinue(() => () => {
                setSuccessOpen(false);
                setSuccessMessage('');
              });
              setSuccessOpen(true);
              
              // Refresh data
              try {
                await fetchOffices();
              } catch (refreshError) {
                console.error("Failed to refresh offices:", refreshError);
              }
            } catch (error) {
              console.error("Failed to update office:", error);
              setErrorMessage("Failed to update office. Please try again.");
              setErrorOpen(true);
            }
          }}
        />

        <EditApproverDialog
          open={editApproverOpen}
          onOpenChange={setEditApproverOpen}
          initialValues={editingApproverId ? {
              category: approverFlow.find(a => a.id === editingApproverId)?.category ?? "",
              collegeIds: approverFlow.find(a => a.id === editingApproverId)?.collegeIds ?? []
            } : undefined}
          colleges={colleges.map(c => ({ id: c.id, name: c.name, short: c.short }))}
          categories={approverCategories}
          onSave={async (payload) => {
            if (!editingApproverId) return;
            
            try {
              await apiJson(
                `/admin/xu-faculty-clearance/api/ciso/approver-flow/steps/${editingApproverId}`,
                {
                  method: "PATCH",
                  body: JSON.stringify(payload),
                }
              );
              
              // Show success modal
              setSuccessMessage('Approver step updated successfully!');
              setSuccessContinue(() => () => {
                setSuccessOpen(false);
                setSuccessMessage('');
              });
              setSuccessOpen(true);
              
              // Refresh approver flow data
              refetchApproverFlow();
            } catch (error) {
              console.error("Failed to update approver step:", error);
              setErrorMessage("Failed to update approver step. Please try again.");
              setErrorOpen(true);
            }
          }}
        />

        <EditApproverFlowDialog
          open={editApproverFlowOpen}
          onOpenChange={setEditApproverFlowOpen}
          items={approverFlow}
          onSave={async (updatedSteps) => {
            try {
              // Update each step via API
              await Promise.all(
                updatedSteps.map((step) =>
                  apiJson(
                    `/admin/xu-faculty-clearance/api/ciso/approver-flow/steps/${step.id}`,
                    {
                      method: "PATCH",
                      body: JSON.stringify({
                        category: step.category,
                        collegeIds: step.collegeIds,
                        order: step.order,
                      }),
                    }
                  )
                )
              );
              
              // Show success modal
              setSuccessMessage('Approver flow updated successfully!');
              setSuccessContinue(() => () => {
                setSuccessOpen(false);
                setSuccessMessage('');
              });
              setSuccessOpen(true);
              
              // Refresh approver flow data
              refetchApproverFlow();
            } catch (error) {
              console.error("Failed to update approver flow:", error);
              setErrorMessage("Failed to update approver flow. Please try again.");
              setErrorOpen(true);
            }
          }}
        />

      <ErrorModal open={errorOpen} onOpenChange={setErrorOpen} message={errorMessage} />
      <SuccessModal open={successOpen} onOpenChange={setSuccessOpen} message={successMessage} onContinue={successContinue || undefined} />

    </div>
  );
}
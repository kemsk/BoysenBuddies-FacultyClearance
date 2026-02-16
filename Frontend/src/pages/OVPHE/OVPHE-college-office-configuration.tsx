import * as React from "react";

import "../../index.css"; 
import { OVPHEHeader } from "../../stories/components/header";

import {
  SectionListCard,
} from "../../stories/components/cards";

import { Divider } from "../../stories/components/divider";

import { Button } from "../../stories/components/button";

import { Pencil, Trash2 } from "lucide-react";

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
};

type ApproverFlowItem = {
  id: string;
  category: string;
  collegeIds: string[];
};

type DraftDepartment = { name: string; short: string };

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function AddCollegeDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: { college: { name: string; short: string }; departments: DraftDepartment[] }) => void;
}) {
  const { open, onOpenChange, onCreate } = props;
  const [step, setStep] = React.useState<1 | 2>(1);
  const [name, setName] = React.useState("");
  const [short, setShort] = React.useState("");
  const [departments, setDepartments] = React.useState<DraftDepartment[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setStep(1);
    setName("");
    setShort("");
    setDepartments([]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="text-center text-base font-bold text-foreground">
              {step === 1 ? "Add College" : "Add Department"}
            </div>

            {step === 1 ? (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-foreground">College Name</div>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-10" />
                </div>

                <div>
                  <div className="text-xs font-semibold text-foreground">Abbreviation</div>
                  <Input value={short} onChange={(e) => setShort(e.target.value)} className="mt-2 h-10" />
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-foreground">College Name</div>
                  <div className="mt-1 text-sm text-foreground">{name || "-"}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-foreground">College Departments</div>

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
                          placeholder="Abbreviation"
                          className="h-10"
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    className="mt-3 h-10 w-full rounded-md bg-primary text-primary-foreground"
                    onClick={() => setDepartments((prev) => [...prev, { name: "", short: "" }])}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-semibold">Add New Department</span>
                      <span className="text-lg font-bold">+</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}
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

              {step === 1 ? (
                <Button
                  type="button"
                  className="h-11 w-full rounded-md"
                  onClick={() => setStep(2)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-11 w-full rounded-md"
                  onClick={() => {
                    onCreate({ college: { name, short }, departments });
                    onOpenChange(false);
                  }}
                >
                  Create
                </Button>
              )}
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
                <div className="text-xs font-semibold text-foreground">Abbreviation</div>
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
                <div className="text-xs font-semibold text-foreground">Abbreviation</div>
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
                <div className="text-xs font-semibold text-foreground">Abbreviation</div>
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

function AddDepartmentDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collegeName: string;
  onCreate: (payload: DraftDepartment) => void;
}) {
  const { open, onOpenChange, collegeName, onCreate } = props;
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
            <div className="text-center text-base font-bold text-foreground">Add Department</div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-xs font-semibold text-foreground">College Name</div>
                <div className="mt-1 text-sm text-foreground">{collegeName || "-"}</div>
              </div>

              <div className="grid grid-cols-[1fr,120px] gap-2">
                <div>
                  <div className="text-xs font-semibold text-foreground">Department Name</div>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-10"
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Abbreviation</div>
                  <Input
                    value={short}
                    onChange={(e) => setShort(e.target.value)}
                    className="mt-2 h-10"
                  />
                </div>
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
                <div className="text-xs font-semibold text-foreground">Abbreviation</div>
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

export default function OVPHECollegeOfficeConfiguration() {
  const navigate = useNavigate();

  const [colleges, setColleges] = React.useState<CollegeItem[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentItem[]>([]);
  const [offices, setOffices] = React.useState<OfficeItem[]>([]);
  const [approverFlow, setApproverFlow] = React.useState<ApproverFlowItem[]>([]);

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

  const [confirmDelete, setConfirmDelete] = React.useState<
    | { open: true; type: "college" | "department" | "office" | "approver"; id: string; label: string }
    | { open: false }
  >({ open: false });

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/ovphe/org-structure")
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

    fetch("/admin/xu-faculty-clearance/api/ovphe/approver-flow")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { steps: ApproverFlowItem[] }) => {
        setApproverFlow(data.steps ?? []);
      })
      .catch(() => {
        setApproverFlow([]);
      });
  }, []);

  const approverCategories = React.useMemo(() => {
    const raw = approverFlow.map((s) => (s.category ?? "").trim()).filter(Boolean);
    return Array.from(new Set(raw));
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

  const editingApprover = React.useMemo(
    () => (editingApproverId ? approverFlow.find((a) => a.id === editingApproverId) : undefined),
    [approverFlow, editingApproverId]
  );

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <OVPHEHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">College & Office Configuration</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/OVPHE-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>College & Office Configuration</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/OVPHE-tools")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>

        <div className="mt-4 space-y-5">
          <div className="w-full max-w-[520px] space-y-5">
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

            <SectionListCard
              title="College Departments"
              headerActionImgAlt="Add"
              headerActionImgSrc="/WhitePlusIcon.png"
              headerActionOnClick={() => setAddDepartmentOpen(true)}
            >
              <div className="p-4">
                <div className="text-xs font-semibold text-muted-foreground">Filter by College</div>
                <div className="mt-2">
                  <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                    <SelectTrigger className="h-10 w-full max-w-[420px]">
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
                              <Badge key={b} variant="default" className="h-5 rounded-full px-2 text-[10px]">
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
          </div>
        </div>

        <AddCollegeDialog
          open={addCollegeOpen}
          onOpenChange={setAddCollegeOpen}
          onCreate={({ college, departments: newDepartments }) => {
            const collegeId = makeId("college");
            const nextCollege: CollegeItem = {
              id: collegeId,
              name: college.name,
              short: college.short,
            };

            setColleges((prev) => {
              return [...prev, nextCollege];
            });

            setSelectedCollegeId(collegeId);

            if (newDepartments.length) {
              setDepartments((prev) => {
                const additions: DepartmentItem[] = newDepartments
                  .filter((d) => d.name.trim() || d.short.trim())
                  .map((d) => ({
                    id: makeId("dept"),
                    collegeId,
                    name: d.name,
                    short: d.short,
                  }));
                return [...prev, ...additions];
              });
            }
          }}
        />

        <AddApproverDialog
          open={addApproverOpen}
          onOpenChange={setAddApproverOpen}
          colleges={colleges}
          categories={approverCategories}
          onCreate={(payload) => {
            const nextItem: ApproverFlowItem = {
              id: makeId("approver"),
              category: payload.category,
              collegeIds: payload.collegeIds,
            };

            setApproverFlow((prev) => {
              return [...prev, nextItem];
            });
          }}
        />

        <AddDepartmentDialog
          open={addDepartmentOpen}
          onOpenChange={setAddDepartmentOpen}
          collegeName={selectedCollegeName}
          onCreate={(payload) => {
            if (!selectedCollegeId) return;
            const nextItem: DepartmentItem = {
              id: makeId("dept"),
              collegeId: selectedCollegeId,
              name: payload.name,
              short: payload.short,
            };

            setDepartments((prev) => {
              return [...prev, nextItem];
            });
          }}
        />

        <AddOfficeDialog
          open={addOfficeOpen}
          onOpenChange={setAddOfficeOpen}
          onCreate={(payload) => {
            const nextItem: OfficeItem = {
              id: makeId("office"),
              name: payload.name,
              short: payload.short,
            };

            setOffices((prev) => {
              return [...prev, nextItem];
            });
          }}
        />

        <EditCollegeDialog
          open={editCollegeOpen}
          onOpenChange={(open) => {
            setEditCollegeOpen(open);
            if (!open) setEditingCollegeId(null);
          }}
          initialValues={
            editingCollege
              ? { name: editingCollege.name, short: editingCollege.short }
              : undefined
          }
          onSave={(payload) => {
            if (!editingCollegeId) return;
            setColleges((prev) => {
              const next = prev.map((c) =>
                c.id === editingCollegeId ? { ...c, name: payload.name, short: payload.short } : c
              );
              return next;
            });
          }}
        />

        <EditDepartmentDialog
          open={editDepartmentOpen}
          onOpenChange={(open) => {
            setEditDepartmentOpen(open);
            if (!open) setEditingDepartmentId(null);
          }}
          initialValues={
            editingDepartment
              ? { name: editingDepartment.name, short: editingDepartment.short }
              : undefined
          }
          onSave={(payload) => {
            if (!editingDepartmentId) return;
            setDepartments((prev) => {
              const next = prev.map((d) =>
                d.id === editingDepartmentId ? { ...d, name: payload.name, short: payload.short } : d
              );
              return next;
            });
          }}
        />

        <EditOfficeDialog
          open={editOfficeOpen}
          onOpenChange={(open) => {
            setEditOfficeOpen(open);
            if (!open) setEditingOfficeId(null);
          }}
          initialValues={
            editingOffice ? { name: editingOffice.name, short: editingOffice.short } : undefined
          }
          onSave={(payload) => {
            if (!editingOfficeId) return;
            setOffices((prev) => {
              const next = prev.map((o) =>
                o.id === editingOfficeId ? { ...o, name: payload.name, short: payload.short } : o
              );
              return next;
            });
          }}
        />

        <EditApproverDialog
          open={editApproverOpen}
          onOpenChange={(open) => {
            setEditApproverOpen(open);
            if (!open) setEditingApproverId(null);
          }}
          colleges={colleges}
          categories={approverCategories}
          initialValues={
            editingApprover
              ? {
                  category: editingApprover.category,
                  collegeIds: editingApprover.collegeIds,
                }
              : undefined
          }
          onSave={(payload) => {
            if (!editingApproverId) return;
            setApproverFlow((prev) => {
              const next = prev.map((a) =>
                a.id === editingApproverId
                  ? { ...a, category: payload.category, collegeIds: payload.collegeIds }
                  : a
              );
              return next;
            });
          }}
        />

        <EditApproverFlowDialog
          open={editApproverFlowOpen}
          onOpenChange={setEditApproverFlowOpen}
          items={approverFlow}
          onSave={(next) => {
            setApproverFlow(next);
          }}
        />

        <AlertDialog
          open={confirmDelete.open}
          onOpenChange={(open) => {
            if (!open) setConfirmDelete({ open: false });
          }}
        >
          <AlertDialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl bg-background p-0">
            <div className="rounded-xl bg-background">
              <AlertDialogHeader className="px-6 pb-4 pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-destructive text-destructive">
                  <span className="text-2xl font-bold">!</span>
                </div>

                <AlertDialogTitle className="mt-4 text-base font-semibold text-foreground">
                  You are about to <span className="text-destructive">DELETE</span>
                </AlertDialogTitle>
                <div className="mt-1 text-base font-semibold text-foreground">
                  “{confirmDelete.open ? confirmDelete.label : ""}”
                </div>

                <div className="mt-4 text-sm font-semibold text-foreground">Do you wish to continue?</div>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-2 flex flex-col gap-2 px-6 pb-6 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  className="h-11 w-full rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (!confirmDelete.open) return;

                    if (confirmDelete.type === "college") {
                      setColleges((prev) => {
                        const next = prev.filter((c) => c.id !== confirmDelete.id);
                        return next;
                      });
                      setDepartments((prev) => {
                        const next = prev.filter((d) => d.collegeId !== confirmDelete.id);
                        return next;
                      });
                      setSelectedCollegeId((prev) => (prev === confirmDelete.id ? "" : prev));
                    }

                    if (confirmDelete.type === "department") {
                      setDepartments((prev) => {
                        const next = prev.filter((d) => d.id !== confirmDelete.id);
                        return next;
                      });
                    }

                    if (confirmDelete.type === "office") {
                      setOffices((prev) => {
                        const next = prev.filter((o) => o.id !== confirmDelete.id);
                        return next;
                      });
                    }

                    if (confirmDelete.type === "approver") {
                      setApproverFlow((prev) => {
                        const next = prev.filter((a) => a.id !== confirmDelete.id);
                        return next;
                      });
                    }

                    setConfirmDelete({ open: false });
                  }}
                >
                  Delete
                </AlertDialogAction>

                <AlertDialogCancel
                  className="h-11 w-full "
                  onClick={() => setConfirmDelete({ open: false })}
                >
                  Cancel
                </AlertDialogCancel>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>

      </main>

    </div>
  );
}

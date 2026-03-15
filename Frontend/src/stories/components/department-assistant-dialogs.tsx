import * as React from "react";

import { Button } from "./button";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Checkbox } from "./checkbox";

export type DepartmentAssistantPayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  universityId: string;
  college: string;
  department: string;
  email: string;
  isActive: boolean;
};

export type AddDepartmentAssistantDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onCreate?: (payload: DepartmentAssistantPayload) => void;
  colleges?: string[];
  departments?: string[];
  collegeDepartmentsMap?: Record<string, string[]>;
};

export function AddDepartmentAssistantDialog({
  open,
  onOpenChange,
  trigger,
  onCreate,
  colleges = [],
  departments = [],
  collegeDepartmentsMap = {},
}: AddDepartmentAssistantDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === "boolean";
  const effectiveOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const [firstName, setFirstName] = React.useState("");
  const [middleName, setMiddleName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [universityId, setUniversityId] = React.useState("");
  const [college, setCollege] = React.useState<string>("");
  const [department, setDepartment] = React.useState<string>("");
  const [email, setEmail] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (!effectiveOpen) return;
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setUniversityId("");
    setCollege("");
    setDepartment("");
    setEmail("");
    setIsActive(true);
  }, [effectiveOpen]);

  React.useEffect(() => {
    // Reset department when college changes
    setDepartment("");
  }, [college]);

  const filteredDepartments = React.useMemo(() => {
    // Only show departments for the selected college
    if (!college) return [];
    return collegeDepartmentsMap[college] || [];
  }, [college, collegeDepartmentsMap]);

  return (
    <Dialog open={effectiveOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="left-6 right-6 w-auto max-w-[420px] translate-x-0 rounded-xl p-0 sm:left-[50%] sm:right-auto sm:w-full sm:max-w-lg sm:translate-x-[-50%]">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="text-center text-base font-bold text-foreground">Add Assistant</div>

            <div className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">First Name</div>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} size="sm" />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Middle Name (Optional)</div>
                <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} size="sm" />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Last Name</div>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} size="sm" />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">University ID</div>
                <Input
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value.replace(/\D/g, ""))}
                  size="sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Email (@XU.EDU.PH)</div>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} size="sm" />
                <div className="text-muted-foreground text-sm">Only @xu.edu.ph email address are allowed</div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">College</div>
                <Select value={college} onValueChange={setCollege}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Choose from dropdown" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Department</div>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Choose from dropdown" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="cancel"
                className="h-11 w-full"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 w-full rounded-md"
                onClick={() => {
                  onCreate?.({
                    firstName,
                    middleName: middleName.trim() ? middleName : undefined,
                    lastName,
                    universityId,
                    college,
                    department,
                    email,
                    isActive,
                  });
                  setOpen(false);
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

export type EditDepartmentAssistantDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  initialValues?: Partial<DepartmentAssistantPayload>;
  onSave?: (payload: DepartmentAssistantPayload) => void;
  colleges?: string[];
  departments?: string[];
  collegeDepartmentsMap?: Record<string, string[]>;
};

export function EditDepartmentAssistantDialog({
  open,
  onOpenChange,
  trigger,
  initialValues,
  onSave,
  colleges = [],
  departments = [],
  collegeDepartmentsMap = {},
}: EditDepartmentAssistantDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === "boolean";
  const effectiveOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const [firstName, setFirstName] = React.useState("");
  const [middleName, setMiddleName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [universityId, setUniversityId] = React.useState("");
  const [college, setCollege] = React.useState<string>("");
  const [department, setDepartment] = React.useState<string>("");
  const [email, setEmail] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    if (!effectiveOpen) return;
    setFirstName(initialValues?.firstName ?? "");
    setMiddleName(initialValues?.middleName ?? "");
    setLastName(initialValues?.lastName ?? "");
    setUniversityId(initialValues?.universityId ?? "");
    setCollege(initialValues?.college ?? "");
    setDepartment(initialValues?.department ?? "");
    setEmail(initialValues?.email ?? "");
    setIsActive(initialValues?.isActive ?? true);
  }, [effectiveOpen, initialValues]);

  React.useEffect(() => {
    // Reset department when college changes
    setDepartment("");
  }, [college]);

  const filteredDepartments = React.useMemo(() => {
    // Only show departments for the selected college
    if (!college) return [];
    const base = collegeDepartmentsMap[college] || [];
    if (initialValues?.department && !base.includes(initialValues.department)) {
      return [...base, initialValues.department];
    }
    return base;
  }, [college, collegeDepartmentsMap, initialValues?.department]);

  return (
    <Dialog open={effectiveOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="text-center text-base font-bold text-foreground">Edit Assistant</div>

            <div className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">First Name</div>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} size="sm" />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Middle Name (Optional)</div>
                <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} size="sm" />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Last Name</div>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} size="sm" />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">University ID</div>
                <Input
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value.replace(/\D/g, ""))}
                  size="sm"
                  placeholder="Numbers only"
                />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Email (@XU.EDU.PH)</div>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} size="sm" placeholder="username@xu.edu.ph" />
                <div className="text-[10px] text-muted-foreground">Only @xu.edu.ph email address is allowed</div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">College</div>
                <Select value={college} onValueChange={setCollege}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Choose from dropdown" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Department</div>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Choose from dropdown" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox variant="primary" checked={isActive} onCheckedChange={(v: boolean) => setIsActive(v)} />
                <span>Set as Active</span>
              </label>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="cancel"
                className="h-11 w-full"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 w-full rounded-md"
                onClick={() => {
                  onSave?.({
                    firstName,
                    middleName: middleName.trim() ? middleName : undefined,
                    lastName,
                    universityId,
                    college,
                    department,
                    email,
                    isActive,
                  });
                  setOpen(false);
                }}
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

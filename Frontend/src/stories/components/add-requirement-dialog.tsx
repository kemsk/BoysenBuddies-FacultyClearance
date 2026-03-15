import * as React from "react";
import { Check, Search, X } from "lucide-react";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";
import { SearchInputGroup } from "./input-group";
import { Textarea } from "./textarea";

import {DatePicker, TimePicker} from "./picker"

export type FacultyOption = {
  id: string;
  name: string;
  subtitle?: string;
};

export type AddRequirementPayload = {
  title: string;
  description: string;
  facultyIds: string[];
  date?: string;
  time?: string;
  physicalSubmission: boolean;
};

export type AddRequirementDialogProps = {
  trigger: React.ReactNode;
  facultyOptions?: FacultyOption[];
  initialValues?: Partial<AddRequirementPayload>;
  dialogTitle?: string;
  saveLabel?: string;
  onSave?: (payload: AddRequirementPayload) => void;
};

export function AddRequirementDialog({
  trigger,
  facultyOptions = [
    { id: "20150016375", name: "Faculty 1", subtitle: "20150016375" },
    { id: "20190016375", name: "Faculty 2", subtitle: "20190016375" },
  ],
  initialValues,
  dialogTitle = "Add Requirement",
  saveLabel = "Save",
  onSave,
}: AddRequirementDialogProps) {
  const [open, setOpen] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [facultyOpen, setFacultyOpen] = React.useState(false);
  const [facultyQuery, setFacultyQuery] = React.useState("");
  const [facultyIds, setFacultyIds] = React.useState<string[]>([]);

  const [enableDate, setEnableDate] = React.useState(false);
  const [enableTime, setEnableTime] = React.useState(false);
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");

  const [physicalSubmission, setPhysicalSubmission] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setFacultyOpen(false);
    setTitle(initialValues?.title ?? "");
    setDescription(initialValues?.description ?? "");
    setFacultyQuery("");
    setFacultyIds(initialValues?.facultyIds ?? []);
    setEnableDate(Boolean(initialValues?.date));
    setEnableTime(Boolean(initialValues?.time));
    setDate(initialValues?.date ?? "");
    setTime(initialValues?.time ?? "");
    setPhysicalSubmission(Boolean(initialValues?.physicalSubmission));
  }, [open, initialValues?.date, initialValues?.description, initialValues?.physicalSubmission, initialValues?.time, initialValues?.title, initialValues?.facultyIds]);

  const filteredFaculty = facultyOptions.filter((f) => {
    const q = facultyQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q) ||
      (f.subtitle ? f.subtitle.toLowerCase().includes(q) : false)
    );
  });

  const allFilteredSelected =
    filteredFaculty.length > 0 &&
    filteredFaculty.every((f) => facultyIds.includes(f.id));

  const toggleSelectAllFiltered = (checked: boolean) => {
    if (!checked) {
      const filteredIds = new Set(filteredFaculty.map((f) => f.id));
      setFacultyIds((prev) => prev.filter((id) => !filteredIds.has(id)));
      return;
    }

    setFacultyIds((prev) => {
      const next = new Set(prev);
      for (const f of filteredFaculty) next.add(f.id);
      return Array.from(next);
    });
  };

  const toggleFaculty = (id: string) => {
    setFacultyIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const allSelected = facultyOptions.length > 0 && facultyIds.length === facultyOptions.length;
  const selectedPrimaryId = facultyIds[0];
  const selectedOthersCount = Math.max(0, facultyIds.length - 1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="text-center text-base font-bold text-foreground">{dialogTitle}</div>

            <div className="mt-4 space-y-3">
              <div className="flex w-full items-center gap-2 border-b border-[hsl(var(--gray-border))] pb-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {allSelected ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                      <span className="truncate">All</span>
                      <button
                        type="button"
                        className="text-muted-foreground"
                        onClick={() => setFacultyIds([])}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : null}

                  {!allSelected && selectedPrimaryId ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                      <span className="max-w-[140px] truncate">{selectedPrimaryId}</span>
                      <button
                        type="button"
                        className="text-muted-foreground"
                        onClick={() =>
                          setFacultyIds((prev) => prev.filter((id) => id !== selectedPrimaryId))
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : null}

                  {!allSelected && selectedOthersCount ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                      <span className="truncate">{selectedOthersCount} others...</span>
                      <button
                        type="button"
                        className="text-muted-foreground"
                        onClick={() =>
                          setFacultyIds(() => (selectedPrimaryId ? [selectedPrimaryId] : []))
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : null}

                  <Input
                    value={facultyQuery}
                    onChange={(e) => {
                      setFacultyQuery(e.target.value);
                      setFacultyOpen(true);
                    }}
                    placeholder={facultyIds.length ? "" : "Search Faculty by name or id"}
                    className="h-6 min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground hover:bg-transparent focus-visible:ring-0"
                  onClick={() => setFacultyOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1.5">
                
                <Input value={title} onChange={(e) => setTitle(e.target.value)} size="sm" placeholder="Title"/>
              </div>

              <div className="space-y-1.5">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[88px]" placeholder="Description"
                />
              </div>

              <div className="flex gap-3 flex-wrap  pb-1">
                <DatePicker buttonClassName="h-10 w-max min-w-0 justify-between font-normal" />
                <TimePicker buttonClassName="h-10 w-max min-w-0 justify-between font-normal" />
              </div>

              <label className="mt-0 flex items-center gap-2 text-xs font-semibold text-foreground">
                <Checkbox
                  variant="primary"
                  checked={physicalSubmission}
                  onCheckedChange={(v) => setPhysicalSubmission(Boolean(v))}
                />
                Will Require Physical Submission
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
                    title,
                    description,
                    facultyIds,
                    date: enableDate ? date : undefined,
                    time: enableTime ? time : undefined,
                    physicalSubmission,
                  });
                  setOpen(false);
                }}
              >
                {saveLabel}
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={facultyOpen} onOpenChange={setFacultyOpen}>
          <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden rounded-xl p-0">
            <div className="rounded-xl bg-background">
              <div className="px-6 pb-4 pt-6">
                <div className="text-center text-base font-bold text-foreground">Search Faculty</div>

                <div className="mt-4">
                  <SearchInputGroup
                    value={facultyQuery}
                    onChange={(e) => setFacultyQuery(e.target.value)}
                    containerClassName="h-10"
                    placeholder="Search Faculty"
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className={
                      allFilteredSelected
                        ? "w-full rounded-md bg-muted-foreground/20 px-4 py-3 text-left"
                        : "w-full rounded-md px-4 py-3 text-left"
                    }
                    onClick={() => toggleSelectAllFiltered(!allFilteredSelected)}
                  >
                    <div className="text-sm font-bold text-foreground">Select All</div>
                    <div className="mt-1 text-xs text-muted-foreground">Select All Faculty Members</div>
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {filteredFaculty.map((f) => {
                    const selected = facultyIds.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={
                          selected
                            ? "w-full rounded-md bg-muted-foreground/20 px-4 py-3 text-left"
                            : "w-full rounded-md px-4 py-3 text-left"
                        }
                        onClick={() => toggleFaculty(f.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-foreground">{f.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{f.subtitle ?? f.id}</div>
                          </div>
                          {selected ? (
                            <Check className="mt-1 h-5 w-5 shrink-0 text-foreground" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
                <Button
                  type="button"
                  className="h-11 w-full rounded-md"
                  onClick={() => setFacultyOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

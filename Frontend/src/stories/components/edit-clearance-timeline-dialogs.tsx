import * as React from "react";

import { ArrowLeft, Calendar, X } from "lucide-react";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import { DatePicker } from "./picker";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export type ClearanceTimelineDialogValues = {
  startYear: string;
  endYear: string;
  semester: string;
  semesterStartDate: string;
  semesterEndDate: string;
  clearanceStartDate: string;
  clearanceEndDate: string;
  setAsActive: boolean;
};

export type EditClearanceTimelineDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  initialValues?: Partial<ClearanceTimelineDialogValues>;
  onSave?: (payload: ClearanceTimelineDialogValues) => void;
};

export type CreateClearanceTimelineDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  initialValues?: Partial<ClearanceTimelineDialogValues>;
  onCreate?: (payload: ClearanceTimelineDialogValues) => void;
};

function YearField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  clearable?: boolean;
  minYear?: number;
}) {
  const { label, value, onChange, clearable, minYear } = props;
  const [open, setOpen] = React.useState(false);

  const nowYear = new Date().getFullYear();
  const baseYear = (() => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    if (typeof minYear === "number" && Number.isFinite(minYear)) return minYear;
    return nowYear;
  })();

  const start = Math.floor(baseYear / 12) * 12;
  const years = Array.from({ length: 24 }, (_, i) => start + i);
  return (
    <div>
      <div className="text-xs font-semibold text-foreground">{label}</div>
      <div className="relative mt-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="action"
              className="h-10 w-full justify-between pl-9 pr-9 font-normal"
            >
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <span>{value ? value : "Year"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto max-w-[calc(100vw-3rem)] overflow-hidden p-3 border border-primary"
            align="center"
            collisionPadding={24}
          >
            <div className="grid grid-cols-4 gap-2">
              {years.map((y) => {
                const disabled = typeof minYear === "number" ? y < minYear : false;
                const selected = String(y) === value;
                return (
                  <Button
                    key={y}
                    type="button"
                    variant={selected ? "default" : "cancel"}
                    className="h-9"
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      onChange(String(y));
                      setOpen(false);
                    }}
                  >
                    {y}
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {clearable && value ? (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DateField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  fromYear?: number;
  toYear?: number;
}) {
  const { label, value, onChange, fromYear, toYear } = props;
  return (
    <div>
      <div className="text-xs font-semibold text-foreground">{label}</div>
      <div className="mt-2">
        <DatePicker
          value={value}
          onChange={onChange}
          fromYear={fromYear}
          toYear={toYear}
          buttonClassName="h-10 w-full min-w-0 justify-between font-normal"
        />
      </div>
    </div>
  );
}

function TimelineDialogShell(props: {
  mode: "edit" | "create";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  initialValues?: Partial<ClearanceTimelineDialogValues>;
  onSubmit?: (payload: ClearanceTimelineDialogValues) => void;
}) {
  const { mode, open, onOpenChange, trigger, initialValues, onSubmit } = props;

  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === "boolean";
  const effectiveOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const [step, setStep] = React.useState<1 | 2>(1);

  const [startYear, setStartYear] = React.useState("");
  const [endYear, setEndYear] = React.useState("");
  const [semester, setSemester] = React.useState("");
  const [semesterStartDate, setSemesterStartDate] = React.useState("");
  const [semesterEndDate, setSemesterEndDate] = React.useState("");
  const [clearanceStartDate, setClearanceStartDate] = React.useState("");
  const [clearanceEndDate, setClearanceEndDate] = React.useState("");
  const [setAsActive, setSetAsActive] = React.useState(false);

  const numericStartYear = React.useMemo(() => {
    const n = Number(startYear);
    if (!Number.isFinite(n)) return undefined;
    if (String(Math.trunc(n)).length !== 4) return undefined;
    return Math.trunc(n);
  }, [startYear]);

  const minEndYear = React.useMemo(() => {
    if (typeof numericStartYear !== "number") return undefined;
    return numericStartYear + 1;
  }, [numericStartYear]);

  const numericEndYear = React.useMemo(() => {
    const n = Number(endYear);
    if (!Number.isFinite(n)) return undefined;
    if (String(Math.trunc(n)).length !== 4) return undefined;
    return Math.trunc(n);
  }, [endYear]);

  React.useEffect(() => {
    if (!effectiveOpen) return;
    setStep(1);
    setStartYear(initialValues?.startYear ?? "");
    setEndYear(initialValues?.endYear ?? "");
    setSemester(initialValues?.semester ?? "");
    setSemesterStartDate(initialValues?.semesterStartDate ?? "");
    setSemesterEndDate(initialValues?.semesterEndDate ?? "");
    setClearanceStartDate(initialValues?.clearanceStartDate ?? "");
    setClearanceEndDate(initialValues?.clearanceEndDate ?? "");
    setSetAsActive(initialValues?.setAsActive ?? false);
  }, [
    effectiveOpen,
    initialValues?.clearanceEndDate,
    initialValues?.clearanceStartDate,
    initialValues?.endYear,
    initialValues?.semester,
    initialValues?.semesterEndDate,
    initialValues?.semesterStartDate,
    initialValues?.setAsActive,
    initialValues?.startYear,
  ]);

  const title = mode === "edit" ? "Edit Timeline" : "Create Timeline";
  const submitLabel = mode === "edit" ? "Save" : "Create";
  const schoolYearLabel = startYear && endYear ? `${startYear}-${endYear}` : "";

  return (
    <Dialog open={effectiveOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="relative flex items-center justify-center">
              {step === 2 ? (
                <Button
                  type="button"
                  variant="icon"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              ) : null}

              <div className="text-center text-base font-bold text-foreground">{title}</div>
            </div>

            {step === 1 ? (
              <div className="mt-6 space-y-5">
                <YearField
                  label="Start Year"
                  value={startYear}
                  onChange={(next) => {
                    setStartYear(next);
                    const n = Number(next);
                    if (Number.isFinite(n) && String(Math.trunc(n)).length === 4) {
                      setEndYear(String(Math.trunc(n) + 1));
                      return;
                    }
                    setEndYear("");
                  }}
                  clearable
                />

                <YearField
                  label="End Year"
                  value={endYear}
                  minYear={minEndYear}
                  onChange={(next) => {
                    if (typeof minEndYear === "number") {
                      const n = Number(next);
                      if (Number.isFinite(n) && n < minEndYear) return;
                    }
                    setEndYear(next);
                  }}
                />
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-foreground">School Year</div>
                  <div className="mt-1 text-sm text-foreground">{schoolYearLabel}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-foreground">Semester</div>
                  <div className="mt-2">
                    <Select value={semester} onValueChange={setSemester}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Choose from dropdown" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Semester">First Semester</SelectItem>
                        <SelectItem value="Second Semester">Second Semester</SelectItem>
                        <SelectItem value="Intersession">Intersession</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DateField
                  label="Semester Start Date"
                  value={semesterStartDate}
                  onChange={setSemesterStartDate}
                  fromYear={numericStartYear}
                  toYear={numericEndYear}
                />

                <DateField
                  label="Semester End Date"
                  value={semesterEndDate}
                  onChange={setSemesterEndDate}
                  fromYear={numericStartYear}
                  toYear={numericEndYear}
                />

                <DateField
                  label="Clearance Period Start Date"
                  value={clearanceStartDate}
                  onChange={setClearanceStartDate}
                  fromYear={numericStartYear}
                  toYear={numericEndYear}
                />

                <DateField
                  label="Clearance Period End Date"
                  value={clearanceEndDate}
                  onChange={setClearanceEndDate}
                  fromYear={numericStartYear}
                  toYear={numericEndYear}
                />

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      variant="primary"
                      checked={setAsActive}
                      onCheckedChange={(next) => setSetAsActive(next === true)}
                    />
                    <span>Set as active clearance period</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            {step === 1 ? (
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
                  onClick={() => setStep(2)}
                >
                  Next
                </Button>
              </div>
            ) : (
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
                    onSubmit?.({
                      startYear,
                      endYear,
                      semester,
                      semesterStartDate,
                      semesterEndDate,
                      clearanceStartDate,
                      clearanceEndDate,
                      setAsActive,
                    });
                    setOpen(false);
                  }}
                >
                  {submitLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditClearanceTimelineDialog(props: EditClearanceTimelineDialogProps) {
  const { open, onOpenChange, trigger, initialValues, onSave } = props;
  return (
    <TimelineDialogShell
      mode="edit"
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      initialValues={initialValues}
      onSubmit={onSave}
    />
  );
}

export function CreateClearanceTimelineDialog(props: CreateClearanceTimelineDialogProps) {
  const { open, onOpenChange, trigger, initialValues, onCreate } = props;
  return (
    <TimelineDialogShell
      mode="create"
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      initialValues={initialValues}
      onSubmit={onCreate}
    />
  );
}

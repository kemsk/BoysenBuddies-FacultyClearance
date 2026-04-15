import * as React from "react";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";

import type { SystemGuidlinesItem } from "./cards";
import { InputGroupWithAddon } from "./input-group";

const SYSTEM_GUIDELINES_STORAGE_KEY = "system_guidelines_items_v1";

export function saveSystemGuidelinesItems(items: SystemGuidlinesItem[]) {
  localStorage.setItem(SYSTEM_GUIDELINES_STORAGE_KEY, JSON.stringify(items));
}

export type EditSystemGuidelinesPayload = {
  title: string;
  description: string;
};

export type EditSystemGuidelinesDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  initialValues?: Partial<EditSystemGuidelinesPayload>;
  onSave?: (payload: EditSystemGuidelinesPayload) => void;
};

export function EditSystemGuidelinesDialog({
  open,
  onOpenChange,
  trigger,
  initialValues,
  onSave,
}: EditSystemGuidelinesDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === "boolean";
  const effectiveOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    if (!effectiveOpen) return;
    setTitle(initialValues?.title ?? "");
    setDescription(initialValues?.description ?? "");
  }, [effectiveOpen, initialValues?.description, initialValues?.title]);

  return (
    <Dialog open={effectiveOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent className="w-[420px] max-w-[calc(100vw-3rem)] rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="text-center text-base font-bold text-foreground">
              {initialValues ? "Edit System Guidelines" : "Create System Guidelines"}
            </div>

            <div className="mt-4 space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size="sm"
                placeholder="Title"
              />

              <InputGroupWithAddon
                placeholder="Description"
                value={description}
                onValueChange={(value) => setDescription(value)}
            />
            
            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))] px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="cancel"
                className="h-11 w-full "
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="h-11 w-full rounded-md"
                onClick={() => {
                  onSave?.({ title, description });
                  setOpen(false);
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

import * as React from "react";
import { cn } from "../../components/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { Divider } from "./divider";
import { DeleteAlert } from "./alert";
import { Checkbox } from "./checkbox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Pencil, Trash2 } from "lucide-react";

export type RequirementEditCardProps = {
  title?: string;
  description?: string;
  physicalSubmission?: boolean;
  Recipients?: string;
  FacultyType?: string;
  className?: string;
  LastUpdated?: string;
  CreatedBy?: string;
  ClearanceTimeline?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function applyRichTextStyles(html: string): string {

  const input = String(html ?? "");

  // Basic sanitization (defense-in-depth). We still rely on trusted admins,
  // but we should not allow obvious XSS vectors.

  const sanitized = input

    // Strip script blocks

    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")

    // Strip javascript: URLs

    .replace(/(href\s*=\s*["'])\s*javascript:[^"']*\1/gi, "$1#$1")

    // Strip inline event handlers like onclick=...

    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  return sanitized

    .replace(/<ul>/g, '<ul style="list-style-type:disc;padding-left:1.5rem;margin:0.25rem 0;">')

    .replace(/<ol>/g, '<ol style="list-style-type:decimal;padding-left:1.5rem;margin:0.25rem 0;">')

    .replace(/<li>/g, '<li style="display:list-item;margin:0.1rem 0;">')

    .replace(

      /<a /g,
      '<a style="color:#2563eb;text-decoration:underline;overflow-wrap:anywhere;word-break:break-word;" '

    )

    .replace(

      /<a>/g,
      '<a style="color:#2563eb;text-decoration:underline;overflow-wrap:anywhere;word-break:break-word;">'

    );

}

export function RequirementEditCard({

  title,
  description,
  physicalSubmission = false,
  Recipients,
  FacultyType,
  LastUpdated,
  CreatedBy,
  ClearanceTimeline,
  onEdit,
  onDelete,
}: RequirementEditCardProps) {

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (

    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="pt-6 pb-4 pl-4 pr-4">
        <div

          className={cn(

            "text-xl font-bold text-primary text-center",

            physicalSubmission ? "mt-1" : "mt-0"

          )}

        >
          {title}
        </div>
        <div className="flex items-center justify-left gap-2 mt-3">
          {physicalSubmission ? (
            <Badge variant="warning" className="mb-2">

              PHYSICAL SUBMISSION

            </Badge>

          ) : null}
        </div>
      </div>
      <Divider className="bg-foreground w-full" />
      <div className="pt-6 pb-4 pl-6 pr-6">
        <div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-md font-bold text-gray-900">Recipients</div>
            <div className="text-sm text-gray-900 text-left break-words">{Recipients}</div>
          </div>

          {FacultyType && FacultyType.trim().length > 0 && FacultyType.trim().toLowerCase() !== "all" ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="text-md font-bold text-gray-900">Faculty Type</div>
              <div className="text-sm text-gray-900 text-left break-words">{FacultyType}</div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="text-md font-bold text-gray-900 pt-1">Description</div>
            <div
              className="text-sm text-gray-900 text-left break-words"
              dangerouslySetInnerHTML={{ __html: applyRichTextStyles(description || "") }}
            >
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="text-md font-bold text-gray-900">Last Updated</div>
            <div className="text-sm text-gray-900 text-left break-words">{LastUpdated}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="text-md font-bold text-gray-900">Created By</div>
            <div className="text-sm text-gray-900 text-left break-words">{CreatedBy}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 pb-3">
            <div className="text-md font-bold text-gray-900">Clearance Timeline</div>
            <div className="text-sm text-gray-900 text-left break-words">{ClearanceTimeline}</div>
          </div>
        </div>
      </div>
      <Divider className="bg-foreground w-full" />
      <div className="mt-4 pt-2 pb-5 flex items-center justify-center gap-3">
        <Button

          variant="default"

          className="h-max w-max rounded-xl px-7 text-base font-semibold p-3"

          onClick={() => onEdit?.()}

        >
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />

            Edit

          </div>
        </Button>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button

              type="button"

              variant="destructive"

              className="h-max w-max rounded-xl px-7 text-base font-semibold p-3"

            >
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />

                Delete

              </div>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <DeleteAlert

              itemName={title}

              onDelete={() => {

                onDelete?.();

                setDeleteOpen(false);

              }}

              onCancel={() => setDeleteOpen(false)}

            />
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>

  );

}

export type RequirementListCardProps = {

  title: string;
  Recipients: string;
  FacultyType?: string;
  description: string;
  physicalSubmission?: boolean;
  submissionDeadline?: string;
  className?: string;
  LastUpdated?: string;
  CreatedBy?: string;
  onEdit?: () => void;
  ClearanceTimeline?: string;
  onDelete?: () => void;
};

export function RequirementListCard({

  title,
  description,
  physicalSubmission = false,
  Recipients,
  FacultyType,
  LastUpdated,
  CreatedBy,
  ClearanceTimeline,
  onEdit,
  onDelete,
}: RequirementListCardProps) {

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (

    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="pt-6 pb-4 pl-4 pr-4">
        <div

          className={cn(

            "text-xl font-bold text-primary text-center",

            physicalSubmission ? "mt-1" : "mt-0"

          )}

        >
          {title}
        </div>
        <div className="flex items-center justify-left gap-2 mt-3">
          {physicalSubmission ? (
            <Badge variant="warning" className="mb-2">

              PHYSICAL SUBMISSION

            </Badge>

          ) : null}
        </div>
      </div>
      <Divider className="bg-foreground w-full" />
      <div className="pt-6 pb-4 pl-6 pr-6">
        <div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-md font-bold text-gray-900">Recipients</div>
            <div className="text-sm text-gray-900 text-left break-words">{Recipients}</div>
          </div>

          {FacultyType && FacultyType.trim().length > 0 && FacultyType.trim().toLowerCase() !== "all" ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="text-md font-bold text-gray-900">Faculty Type</div>
              <div className="text-sm text-gray-900 text-left break-words">{FacultyType}</div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="text-md font-bold text-gray-900 pt-1">Description</div>
            <div
              className="text-sm text-gray-900 text-left break-words"
              dangerouslySetInnerHTML={{ __html: applyRichTextStyles(description || "") }}
            >
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="text-md font-bold text-gray-900">Last Updated</div>
            <div className="text-sm text-gray-900 text-left break-words">{LastUpdated}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="text-md font-bold text-gray-900">Created By</div>
            <div className="text-sm text-gray-900 text-left break-words">{CreatedBy}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 pb-3">
            <div className="text-md font-bold text-gray-900">Clearance Timeline</div>
            <div className="text-sm text-gray-900 text-left break-words">{ClearanceTimeline}</div>
          </div>
        </div>
      </div>
    </div>

  );

}


export type AgreementCardProps = {
  requestId?: string;
  employeeId?: string;
  name?: string;
  college?: string;
  department?: string;
  facultyType?: string;
  SchoolID?:string;
  FullName?:string;
  SchoolEmail?:string;
  status?: "pending" | "approved" | "rejected";
  className?: string;
  disabled?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
  onConfirm?: () => void;

};

export function AgreementCard({

  className,
  disabled = false,
  onConfirm,
}: AgreementCardProps) {

  const [agreeChecked, setAgreeChecked] = React.useState(false);

  const [understandChecked, setUnderstandChecked] = React.useState(false);

  const [understandConsequencesChecked, setUnderstandConsequencesChecked] = React.useState(false);

  const allChecked = agreeChecked && understandChecked && understandConsequencesChecked;

  return (

    <div className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}>
      <div className="pt-9 pb-4 pl-4 pr-4" >
        <div>
        <div className="flex items-center gap-4 border-2 border-muted-foreground p-4 rounded bg-foregroundLight">
          <Checkbox
            variant="gray"
            checked={agreeChecked}
            disabled={disabled}
            onCheckedChange={(v) => setAgreeChecked(v === true)}

          />
           <label className="text-sm text-gray-700">
              <span className="font-bold">I agree</span> that I have created all the necessary clearance requirements that I need for my Department/Office

            </label>
        </div>
        </div>
        <div className="pt-4">
        <div className="flex items-center gap-4 border-2 border-muted-foreground p-4 rounded bg-foregroundLight">

          <Checkbox
            variant="gray"
            checked={understandChecked}
            disabled={disabled}
            onCheckedChange={(v) => setUnderstandChecked(v === true)}
          />

          <label className="text-sm text-gray-700">
            <span className="font-bold">I understand</span> that once a Clearance Timeline is in an “Active” state, I cannot make any changes to my requirements.
          </label>
        </div>
        </div>
        <div className="pt-4">
        <div className="flex items-center gap-4 border-2 border-muted-foreground p-4 rounded bg-foregroundLight">

          <Checkbox
            variant="gray"
            checked={understandConsequencesChecked}
            disabled={disabled}
            onCheckedChange={(v) => setUnderstandConsequencesChecked(v === true)}
          />
          <label className="text-sm text-gray-700">
            <span className="font-bold">I understand</span> that if I was not able to create the requirements for my departments on time, the system will reject the faculty member by default.

          </label>
        </div>
        </div>
        <div className="pt-6">

          <Button
            type="button"
            variant="default"
            className="w-full justify-center  text-center font-bold"
            disabled={disabled || !allChecked}
            onClick={onConfirm}
          >
            I Agree and Understand
          </Button>
        </div>
      </div>
    </div>

  );

}

export type TrueAgreementCardProps = {
  requestId?: string;
  employeeId?: string;
  name?: string;
  college?: string;
  department?: string;
  facultyType?: string;
  SchoolID?:string;
  FullName?:string;
  SchoolEmail?:string;
  status?: "pending" | "approved" | "rejected";
  className?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
  onConfirm?: () => void;
};

export function TrueAgreementCard({

  className,
  onConfirm,
}: TrueAgreementCardProps) {

  const allChecked = true;

  return (

    <div className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}>
      <div className="pt-9 pb-4 pl-4 pr-4" >
        <div>
        <div className="flex items-center gap-4 border-2 border-muted-foreground p-4 rounded bg-foregroundLight">
          <Checkbox
            variant="gray"
            checked={true}
            disabled
          />
           <label className="text-sm text-gray-700">
              <span className="font-bold">I agree</span> that I have created all the necessary clearance requirements that I need for my Department/Office

            </label>
        </div>
        </div>
        <div className="pt-4">
        <div className="flex items-center gap-4 border-2 border-muted-foreground p-4 rounded bg-foregroundLight">
          <Checkbox
            variant="gray"
            checked={true}
            disabled
          />
          <label className="text-sm text-gray-700">
            <span className="font-bold">I understand</span> that once a Clearance Timeline is in an “Active” state, I cannot make any changes to my requirements.

          </label>
        </div>
        </div>
        <div className="pt-4">
        <div className="flex items-center gap-4 border-2 border-muted-foreground p-4 rounded bg-foregroundLight">
          <Checkbox

            variant="gray"

            checked={true}

            disabled

          />
          <label className="text-sm text-gray-700">
            <span className="font-bold">I understand</span> that if I was not able to create the requirements for my departments on time, the system will reject the faculty member by default.

          </label>
        </div>
        </div>
      </div>
    </div>

  );

}
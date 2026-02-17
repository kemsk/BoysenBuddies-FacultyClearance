import * as React from "react";
import { Check, ChevronLeft, ChevronRight, Download, Eye, Pencil, Plus, Trash2, Upload, X, ArrowBigLeft, ArrowBigRight, UserCheck, UserMinus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/components/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { ApproveConfirmDialog, RejectAlertDialog } from "./clearance-action-dialogs";
import { AddRequirementDialog, type AddRequirementPayload } from "./add-requirement-dialog";
import { FacultyMemberDetailsDialog } from "./faculty-member-details-dialog";
import { Divider } from "./divider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";

type DashboardBadgeVariant = "default" | "success" | "warning" | "muted";

function getBadgeVariant(variant: DashboardBadgeVariant | undefined) {
  if (variant === "warning") return "warning" as const;
  if (variant === "muted") return "secondary" as const;
  return "default" as const;
}

export type WelcomeCardProps = {
  name: string;
  className?: string;
};

export function WelcomeCard({ name, className }: WelcomeCardProps) {
  return (
    <Card className={cn("overflow-hidden border-0 shadow-none", className)}>
      <CardHeader className="bg-primary text-primary-foreground text-center py-2.5">
        <CardDescription className="text-base leading-none text-primary-foreground/80">
          Welcome
        </CardDescription>
        <CardTitle className="text-xl font-bold leading-tight">{name}!</CardTitle>
      </CardHeader>
    </Card>
  );
}

export type ActionNavCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  to?: string;
  onClick?: () => void;
  className?: string;
};

export function ActionNavCard({
  icon,
  title,
  description,
  to,
  onClick,
  className,
}: ActionNavCardProps) {
  const content = (
    <Card className={cn("rounded-xl border bg-white shadow-sm", className)}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="text-primary ">{icon}</div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-primary">{title}</div>
          <div className="mt-1 text-xs text-primary">{description}</div>
        </div>

        <ChevronRight className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="block w-full text-left" onClick={onClick}>
      {content}
    </button>
  );
}

export type RequirementListItem = {
  title: string;
  description: string;
  physicalSubmission?: boolean;
  submissionDeadline?: string;
};

export type StudentAssistantItem = {
  id: string;
  name: string;
  college: string;
  department: string;
  email: string;
};

export type StudentAssistantsCardProps = {
  items: StudentAssistantItem[];
  className?: string;
  onAddUser?: () => void;
  onCreateUser?: (payload: {
    firstName: string;
    middleName?: string;
    lastName: string;
    schoolId: string;
    college: string;
    department: string;
    email: string;
  }) => void;
  onEditUser?: (item: StudentAssistantItem) => void;
  onRemove?: (id: string) => void;
};

export function StudentAssistantsCard({
  items,
  className,
  onAddUser,
  onEditUser,
  onRemove,
}: StudentAssistantsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="flex">
          <Divider orientation="vertical" className="h-auto self-stretch" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center border-b px-4 py-4">
              <Button type="button" className="h-8 rounded-md px-3 text-sm font-bold" onClick={onAddUser}>
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>

            <Divider color="border-[hsl(var(--gray-border))]" />

            <div>
              {items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <div className="flex items-start gap-4 px-4 py-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base font-bold text-foreground">
                          {item.name}
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="action"
                            className="h-7 rounded-md px-3 text-xs font-bold"
                            onClick={() => onEditUser?.(item)}
                          >
                            EDIT
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            className="h-7 rounded-md px-3 text-xs font-bold"
                            onClick={() => onRemove?.(item.id)}
                          >
                            REMOVE
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[95px_1fr] gap-x-5 gap-y-1 text-sm">
                        <div className="font-bold text-foreground">System ID</div>
                        <div className="text-foreground">{item.id}</div>

                        <div className="font-bold text-foreground">University ID</div>
                        <div className="text-foreground">{item.id}</div>

                        <div className="font-bold text-foreground">College</div>
                        <div className="text-foreground">{item.college}</div>

                        <div className="font-bold text-foreground">Department</div>
                        <div className="text-foreground">{item.department}</div>

                        <div className="font-bold text-foreground">Email</div>
                        <div className="text-foreground">{item.email}</div>
                      </div>
                    </div>

                  </div>

                  {idx < items.length - 1 ? (
                    <Divider color="border-[hsl(var(--gray-border))]" />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </div>
          <Divider orientation="vertical" className="h-auto self-stretch" />
        </div>
      </CardContent>
    </Card>
  );
}

export type RequirementEditCardProps = {
  title: string;
  description: string;
  physicalSubmission?: boolean;
  submissionDeadline?: string;
  className?: string;
  onEdit?: (payload?: AddRequirementPayload) => void;
  onDelete?: () => void;
};

export function RequirementEditCard({
  title,
  description,
  physicalSubmission = false,
  submissionDeadline,
  className,
  onEdit,
  onDelete,
}: RequirementEditCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">

        <div className={cn("text-xl font-bold text-primary text-center", physicalSubmission ? "mt-3" : "mt-0")}>
          {title}
        </div>
        
        <div className="mt-2 flex items-center justify-center gap-2">
        {physicalSubmission ? (
          <Badge variant="warning" className="mb-2">
            PHYSICAL SUBMISSION
          </Badge>
        ) : null}
        </div>
        
        <div className="mt-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">{description}</div>

        {submissionDeadline ? (
          <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-md border border-[hsl(var(--gray-border))] ">
            <div className="bg-gray-300 px-3 py-2 text-xs font-medium text-foreground">
              Submission Deadline
            </div>
            <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
              {submissionDeadline}
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-center gap-3">
          <AddRequirementDialog
            trigger={
              <Button variant="default" size="sm">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
            dialogTitle="Edit Requirement"
            saveLabel="Save"
            initialValues={{
              title,
              description,
              facultyIds: [],
              physicalSubmission,
            }}
            onSave={(payload) => {
              onEdit?.(payload);
            }}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader className="items-center text-center">
                <AlertDialogTitle className="text-2xl font-bold text-foreground">
                  {title}
                </AlertDialogTitle>

                {physicalSubmission ? (
                  <div className="mt-2 inline-flex rounded-md bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
                    PHYSICAL SUBMISSION
                  </div>
                ) : null}

                <AlertDialogDescription className="mt-4 text-sm text-muted-foreground">
                  {description}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-6 flex flex-row justify-center gap-4 sm:flex-row sm:justify-center sm:space-x-0">
                <AlertDialogCancel asChild>
                    CANCEL
                </AlertDialogCancel>

                <AlertDialogAction asChild onClick={onDelete}>
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-12 rounded-xl px-7 text-base font-semibold"
                  >
                    <Trash2 className="h-5 w-5" />
                    Delete
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export type ClearanceRequestStatus = "pending" | "approved" | "rejected";

export type ClearanceRequestItem = {
  id: string;
  requestId?: string;
  employeeId?: string;
  name: string;
  college: string;
  department: string;
  facultyType: string;
  status: ClearanceRequestStatus;
};

export type ClearanceRequestsCardProps = {
  items: ClearanceRequestItem[];
  className?: string;
};

function getClearanceStatusBadgeVariant(status: ClearanceRequestStatus) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "destructive" as const;
  return "warning" as const;
}

export function ClearanceRequestsCard({ items, className }: ClearanceRequestsCardProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="flex">
          <Divider orientation="vertical" className="h-auto self-stretch " />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 border-b px-4 py-4">
              <Checkbox
                variant="primary"
                checked={selectedIds.size === items.length}
                onCheckedChange={(v) => {
                  if (v) {
                    setSelectedIds(new Set(items.map((i) => i.id)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
              />
              <div className="text-sm font-bold text-primary">Select All</div>

              {selectedIds.size > 0 ? (
                <div className="ml-auto flex items-center gap-2">
                  <RejectAlertDialog
                    count={selectedIds.size}
                    trigger={
                      <Button
                        type="button"
                        variant="destructive"
                        className="h-7 rounded-l px-2 text-sm font-semibold"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    }
                    onReject={() => {
                      // intentionally left blank; user can wire API/state later
                    }}
                  />

                  <ApproveConfirmDialog
                    count={selectedIds.size}
                    trigger={
                      <Button
                        type="button"
                        className="h-7 rounded-l bg-[hsl(var(--success))] px-2 text-sm font-semibold text-white hover:bg-[hsl(var(--success))]/90"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                    }
                    onApprove={() => {
                      // intentionally left blank; user can wire API/state later
                    }}
                  />
                </div>
              ) : null}
            </div>

            <Divider color="border-[hsl(var(--gray-border))]" />

            <div>
              {items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <div className="flex gap-3 px-4 py-6">
                    <div className="pt-1">
                      <Checkbox
                        variant="primary"
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          });
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <FacultyMemberDetailsDialog
                            details={{
                              requestId: item.requestId,
                              employeeId: item.employeeId ?? item.id,
                              firstName: item.name.split(" ")[0],
                              middleName: item.name.split(" ").length > 2 ? item.name.split(" ").slice(1, -1).join(" ") : undefined,
                              lastName: item.name.split(" ").length > 1 ? item.name.split(" ")[item.name.split(" ").length - 1] : "",
                              college: item.college,
                              department: item.department,
                              facultyType: item.facultyType,
                              status: item.status,
                            }}
                            trigger={
                              <button
                                type="button"
                                className="truncate text-left text-base font-bold text-primary"
                              >
                                {item.name}
                              </button>
                            }
                            onSave={() => {
                              // intentionally left blank; user can wire API/state later
                            }}
                          />
                        </div>

                        <div className="shrink-0">
                          <Badge
                            variant={getClearanceStatusBadgeVariant(item.status)}
                            className="px-3 py-1 text-xs font-bold"
                          >
                            {item.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-[88px_1fr] gap-x-3 gap-y-1 text-sm">
                        <div className="font-bold text-black">Request ID</div>
                        <div className="text-black">{item.requestId}</div>
                        <div className="font-bold text-black">Employee ID</div>
                        <div className="text-black">{item.employeeId}</div>

                        <div className="font-bold text-black">College</div>
                        <div className="text-black">{item.college}</div>

                        <div className="font-bold text-black">Department</div>
                        <div className="text-black">{item.department}</div>

                        <div className="font-bold text-black">Faculty Type</div>
                        <div className="text-black">{item.facultyType}</div>
                      </div>
                    </div>
                  </div>

                  {idx < items.length - 1 ? (
                    <Divider color="border-[hsl(var(--gray-border))]" />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </div>
          <Divider orientation="vertical" className="h-auto self-stretch" />
        </div>
      </CardContent>
    </Card>
  );
}

export type ExportArchiveClearanceStatus = "complete" | "incomplete";

export type ExportArchiveClearanceItem = {
  id: string;
  name: string;
  requestId: string;
  universityId: string;
  college: string;
  department: string;
  facultyType: string;
  missingSignatures: string;
  status: ExportArchiveClearanceStatus;
};

export type ExportArchiveClearanceCardProps = {
  items: ExportArchiveClearanceItem[];
  className?: string;
  exportLabel?: string;
  onExport?: (items: ExportArchiveClearanceItem[]) => void;
};

function getExportArchiveClearanceBadgeVariant(status: ExportArchiveClearanceStatus) {
  if (status === "complete") return "success" as const;
  return "destructive" as const;
}

export function ExportArchiveClearanceCard({
  items,
  className,
  exportLabel = "Export Results",
  onExport,
}: ExportArchiveClearanceCardProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());

  const selectedItems = React.useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds]
  );

  return (
    <Card className={cn("overflow-hidden border-muted-foreground/20 shadow-sm", className)}>
      <CardContent className="p-0">
        <div className="flex">
          <Divider orientation="vertical" className="h-auto self-stretch " />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 border-b px-4 py-4">
              <Checkbox
                variant="primary"
                checked={items.length > 0 && selectedIds.size === items.length}
                onCheckedChange={(v) => {
                  if (v) setSelectedIds(new Set(items.map((i) => i.id)));
                  else setSelectedIds(new Set());
                }}
              />
              <div className="text-sm font-bold text-primary">Select All</div>

              <Button
                type="button"
                variant="default"
                className="ml-auto h-10 rounded-md px-4 text-sm font-bold"
                onClick={() => onExport?.(selectedItems)}
                disabled={selectedItems.length === 0}
              >
                <Plus className="h-5 w-5" />
                {exportLabel}
              </Button>
            </div>

            <Divider color="border-[hsl(var(--gray-border))]" />

            <div>
              {items.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <div className="flex gap-3 px-4 py-6">
                    <div className="pt-1">
                      <Checkbox
                        variant="primary"
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          });
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-left text-base font-bold text-primary">{item.name}</div>
                        </div>

                        <div className="shrink-0">
                          <Badge
                            variant={getExportArchiveClearanceBadgeVariant(item.status)}
                            className="px-3 py-1 text-xs font-bold"
                          >
                            {item.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-sm">
                        <div className="font-bold text-black">Request ID</div>
                        <div className="text-black">{item.requestId}</div>

                        <div className="font-bold text-black">University ID</div>
                        <div className="text-black">{item.universityId}</div>

                        <div className="font-bold text-black">College</div>
                        <div className="text-black">{item.college}</div>

                        <div className="font-bold text-black">Department</div>
                        <div className="text-black">{item.department}</div>

                        <div className="font-bold text-black">Faculty Type</div>
                        <div className="text-black">{item.facultyType}</div>

                        <div className="font-bold text-black">Missing Signatures</div>
                        <div className="text-black">{item.missingSignatures}</div>
                      </div>
                    </div>
                  </div>

                  {idx < items.length - 1 ? (
                    <Divider color="border-[hsl(var(--gray-border))]" />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </div>
          <Divider orientation="vertical" className="h-auto self-stretch" />
        </div>
      </CardContent>
    </Card>
  );
}

export type RequirementsListCardProps = {
  items: RequirementListItem[];
  className?: string;
  onClose?: () => void;
  headerActionHref?: string;
  headerActionImgSrc?: string;
  headerActionImgAlt?: string;
  onViewItem?: (item: RequirementListItem) => void;
  onAddRequirement?: () => void;
  addDisabled?: boolean;
};

export function RequirementsListCard({
  items,
  className,
  onClose,
  headerActionHref,
  headerActionImgSrc,
  headerActionImgAlt = "Open",
  onViewItem,
  onAddRequirement,
  addDisabled = true,
}: RequirementsListCardProps) {
  const [collapsedTitles, setCollapsedTitles] = React.useState<Set<string>>(() => new Set());

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="relative bg-primary py-3">
        <CardTitle className="text-center text-base font-bold text-primary-foreground">
          Requirements List
        </CardTitle>
        {headerActionHref && headerActionImgSrc ? (
          <Button
            asChild
            variant="icon"
            size="icon"
            className="absolute right-3 top-[40%] -translate-y-1/2 text-primary-foreground"
          >
            <Link to={headerActionHref}>
              <img
                src={headerActionImgSrc}
                alt={headerActionImgAlt}
                className="h-6 w-6 object-contain"
              />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="icon"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-4">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.title}
                className="flex items-start justify-between gap-3 rounded-md bg-muted p-4"
              >
                <div>
                  <div className="text-sm font-bold text-foreground mt-2">{item.title}</div>
                  {collapsedTitles.has(item.title) ? null : (
                    <>
                      {item.physicalSubmission ? (
                        <div className="mt-2 ml-0">
                          <Badge variant="warning">PHYSICAL SUBMISSION</Badge>
                        </div>
                      ) : null}
                      <div className="mt-3 text-sm text-muted-foreground">{item.description}</div>
                    </>
                  )}
                  
                </div>
                <button
                  type="button"
                  className="mt-0.5 text-primary"
                  onClick={() => {
                    onViewItem?.(item);
                    setCollapsedTitles((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.title)) next.delete(item.title);
                      else next.add(item.title);
                      return next;
                    });
                  }}
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-[hsl(var(--gray-border))]" />

        <div className="flex items-center justify-center p-4">
          <AddRequirementDialog
            trigger={
              <Button variant="default" >
                <img src="/WhitePlusIcon.png" alt="Add Requirement" />Add Requirement
              </Button>
            }
            onSave={() => {
              if (addDisabled) return;
              onAddRequirement?.();
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export type AnnouncementItem = {
  title: string;
  description: string;
  timestamp: string;
  imageSrc?: string;
  imageAlt?: string;
  pinned?: boolean;
  enabled?: boolean;
  headerActionHref?: string;
  headerActionImgSrc?: string;
  headerActionImgAlt?: string;
};

export type AnnouncementsCardProps = {
  items: AnnouncementItem[];
  className?: string;
  headerActionHref?: string;
  headerActionImgSrc?: string;
  headerActionImgAlt?: string;
  showHeaderChevron?: boolean;
};

export function AnnouncementsCard({
  items,
  className,
  headerActionHref,
  headerActionImgSrc,
  headerActionImgAlt,
  showHeaderChevron = true,
}: AnnouncementsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-[hsl(var(--yellow))] py-3 shadow-sm">
        <CardTitle className="relative flex items-center justify-center text-base font-bold text-foreground">
          <div className="text-center font-bold">Announcements</div>

          {headerActionImgSrc && headerActionImgAlt ? (
            headerActionHref ? (
              <Button
                asChild
                variant="icon"
                size="icon"
                className="absolute right-[-8px] top-1/2 -translate-y-1/2"
              >
                <Link to={headerActionHref}>
                  <img
                    src={headerActionImgSrc}
                    alt={headerActionImgAlt}
                    className="h-6 w-6 object-contain"
                  />
                </Link>
              </Button>
            ) : (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <img
                  src={headerActionImgSrc}
                  alt={headerActionImgAlt}
                  className="h-6 w-6 object-contain"
                />
              </div>
            )
          ) : showHeaderChevron ? (
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </div>
          ) : null}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.title} className="rounded-md bg-foregroundLight p-4">
              <div className="flex items-start gap-3">
                {item.pinned ? (
                  <img src="/BlackBookmarkIcon.png" alt="Pin" className="mt-0.5 h-4 w-4 text-foreground" />
                ) : null}
                <div className="min-w-0">
                  {item.imageSrc ? (
                    <img
                      src={item.imageSrc}
                      alt={item.imageAlt ?? "Announcement"}
                      className="mb-3 h-32 w-full rounded-md object-cover"
                    />
                  ) : null}
                  {item.pinned ? (
                    <div className="text-xs font-bold text-muted-foreground">PINNED</div>
                  ) : null}
                  <div className="text-sm font-bold text-foreground mt-2">{item.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.description}</div>
                  <div className="mt-3 text-xs text-muted-foreground">{item.timestamp}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export type NotificationItemStatus = "approved" | "rejected" | "submitted";

export type NotificationItem = {
  title: string;
  status?: NotificationItemStatus;
  description?: string;
  details: string[];
  timestamp: string;
  is_read?: boolean;
};

export type NotificationsCardProps = {
  items: NotificationItem[];
  className?: string;

  pageSize?: number;
  showMarkAsReadButton?: boolean;
  readAll?: boolean;
  onReadAllChange?: (readAll: boolean) => void;
};

function statusText(status: NotificationItemStatus) {
  if (status === "approved") return "APPROVED";
  if (status === "rejected") return "REJECTED";
  return "SUBMITTED";
}

export function NotificationsCard({
  items,
  className,
  pageSize = 10,
  showMarkAsReadButton = true,
  readAll: readAllProp,
  onReadAllChange,
}: NotificationsCardProps) {
  const [page, setPage] = React.useState(1);
  const [readAllUncontrolled, setReadAllUncontrolled] = React.useState(false);

  const readAll = readAllProp ?? readAllUncontrolled;
  const setReadAll = (next: boolean) => {
    if (readAllProp === undefined) setReadAllUncontrolled(next);
    onReadAllChange?.(next);
  };

  React.useEffect(() => {
    setPage(1);
    setReadAll(false);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  React.useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {showMarkAsReadButton ? (
          <div className="flex items-center justify-end px-6 pt-4">
            <Button
              className="h-8 px-3 text-xs"
              variant="default"
              type="button"
              onClick={() => setReadAll(true)}
            >
              Mark as Read
            </Button>
          </div>
        ) : null}

        {pagedItems.map((item, index) => (
          <div key={`${item.title}-${start + index}`}>
            <div className="px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-bold text-black">{item.title}</div>
                  <div className="mt-1 text-sm text-black">
                    Your submission has been <span className="font-bold">{statusText(item.status)}.</span>
                  </div>
                </div>

                {!readAll ? <div className="mt-1 h-4 w-4 shrink-0 rounded-full bg-red-500" /> : null}
              </div>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-black">
                {item.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <div className="mt-3 text-xs italic text-muted-foreground">{item.timestamp}</div>
            </div>

            {index < pagedItems.length - 1 ? <div className="h-px w-full bg-[hsl(var(--gray-border))]" /> : null}
          </div>
        ))}

        <div className="px-6 pb-4">
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Page</span>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              value={safePage}
              onChange={(e) => setPage(Number(e.target.value))}
            >
              {Array.from({ length: totalPages }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span>of {totalPages}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type ActivityLogVariant =
  | "approved_clearance"
  | "rejected_clearance"
  | "create_request"
  | "edited_requirements"
  | "created_requirements"
  | "deleted_requirements"
  | "added_assistant_approver"
  | "updated_assistant_approver"
  | "removed_assistant_approver"
  | "user_logout"
  | "user_login"
  | "exported_clearance_results"
  | "created_guideline"
  | "edited_guideline"
  | "set_guideline_status_active"
  | "set_guideline_status_inactive"
  | "archived_guideline"
  | "created_announcement"
  | "set_announcement_status_active"
  | "set_announcement_status_inactive"
  | "edited_announcement"
  | "created_timeline"
  | "set_timeline_status_active"
  | "set_timeline_status_inactive"
  | "created_college"
  | "edited_college"
  | "deleted_college"
  | "created_department"
  | "edited_department"
  | "deleted_department"
  | "added_to_approver_flow"
  | "edited_approver_flow"
  | "removed_from_approver_flow"
  | "created_approver"
  | "edited_approver"
  | "removed_approver"
  | "uploaded_faculty_data_dump"
  | "removed_faculty_data_dump";

export type ActivityLogItem = {
  id: string;
  dateLabel: string;
  timeLabel: string;
  variant: ActivityLogVariant;
  title?: string;
  description?: string;
  actorFirstName?: string;
  actorLastName?: string;
  actorRole?: string;
  facultyFirstName?: string;
  facultyLastName?: string;
  facultyCollege?: string;
  facultyDepartment?: string;
  universityId?: string;
  requestId?: string;
  details: string[];
  schoolYear?: string;
  semester?: string;
  guidelineTitle?: string;
  announcementTitle?: string;
  requirementTitle?: string;
  collegeName?: string;
  departmentName?: string;
  approverDepartment?: string;
  approverFlowField?: string;
  approverFirstName?: string;
  approverLastName?: string;
  assistantApproverFirstName?: string;
  assistantApproverLastName?: string;
};

export type ActivityLogsCardProps = {
  items: ActivityLogItem[];
  className?: string;
};

function getActivityIcon(variant: ActivityLogVariant) {
  if (variant === "approved_clearance") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-success p-0.2">
        <Check strokeWidth={4} className="h-3 w-3 text-white transform translate-y-[0.5px]" />
      </div>
    );
  }

  if (variant === "rejected_clearance" || variant === "set_guideline_status_inactive" || variant === "set_announcement_status_inactive" || variant === "set_timeline_status_inactive") { 
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--destructive))] p-0.5">
        <X strokeWidth={4} className="h-3 w-3 text-white transform " />
      </div>
    );
  }

  if (variant === "create_request" || variant === "created_requirements" || variant === "created_guideline" || variant === "created_announcement" || variant === "created_timeline" || variant === "created_college" || variant === "created_department" || variant === "added_to_approver_flow") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-primary p-0.5">
        <Plus strokeWidth={4} className="h-3 w-3  text-white transform" />
      </div>
    );
  }

  if (variant === "edited_requirements" || variant === "edited_approver_flow" || variant === "edited_guideline" || variant === "edited_announcement" || variant === "edited_college" || variant === "edited_department") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-primary p-0.5">
        <Pencil strokeWidth={4} className="h-3 w-3 text-white" />
      </div>
    );
  }



  if (variant === "updated_assistant_approver" || variant === "edited_approver") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-primary p-0.5">
        <UserCheck strokeWidth={4} className="h-3 w-3 text-white" />
      </div>
    );
  }

  if (variant === "removed_assistant_approver" || variant === "removed_approver") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--destructive))] p-0.5">
        <UserMinus strokeWidth={4} className="h-3 w-3 text-white" />
      </div>
    );
  }

  if (variant === "created_approver" || variant === "added_assistant_approver") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[#1f2b88] p-0.5">
        <UserPlus strokeWidth={2.5} className="h-4 w-4 text-white" />
      </div>
    );
  }

  if (variant === "user_logout") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-primary p-0.5">
          <ArrowBigLeft strokeWidth={4} className="h-3 w-3 text-white" />
      </div>
    );
  }

  if (variant === "user_login") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-primary p-0.5">
          <ArrowBigRight strokeWidth={4} className="h-3 w-3 text-white" />
      </div>
    );
  }

  if (variant === "exported_clearance_results") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-primary p-0.5">
        <Download strokeWidth={4} className="h-3 w-3 text-white" />
      </div>
    );
  }


  if (variant === "archived_guideline") {
    return (
      <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-destructive">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          aria-hidden="true"
        >
          <path
            d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
            stroke="white"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }


  if (variant === "set_timeline_status_active" || variant === "set_guideline_status_active" || variant === "set_announcement_status_active") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-success p-0.2">
        <Check strokeWidth={4} className="h-3 w-3 text-white transform translate-y-[0.5px]" />
      </div>
    );
  }


  if (variant === "deleted_college" || variant === "deleted_department" || variant === "removed_from_approver_flow" || variant === "removed_faculty_data_dump" || variant === "deleted_requirements") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--destructive))] p-0.5">
        <Trash2 strokeWidth={3} className="h-3 w-3 text-white" />
      </div>
    );
  }

  if (variant === "uploaded_faculty_data_dump") {
    return (
      <div className="flex flex-shrink-0 h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-[#1f2b88] p-0.5">
        <Download strokeWidth={4} className="h-3 w-3 text-white" />
      </div>
    );
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full">
      <img src="/PrimaryCirclePlusIcon.png" className="h-full w-full object-cover" />
    </div>
  );
}

function formatActivityLogText(item: ActivityLogItem) {
  const actorName = [item.actorFirstName, item.actorLastName].filter(Boolean).join(" ").trim();
  const facultyName = [item.facultyFirstName, item.facultyLastName].filter(Boolean).join(" ").trim();
  const facultyCollegeDepartment = [item.facultyCollege, item.facultyDepartment]
    .filter(Boolean)
    .join(" - ")
    .trim();

  const assistantApproverName = [item.assistantApproverFirstName, item.assistantApproverLastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const userName = actorName || facultyName;
  const requirementTitle = item.requirementTitle?.trim();
  const requirementTail = requirementTitle ? `: ${requirementTitle}` : "";
  const deptOffice = item.approverDepartment?.trim();
  const deptTail = deptOffice ? ` for ${deptOffice}.` : ".";
  const guidelineTitle = item.guidelineTitle?.trim();
  const guidelineTail = guidelineTitle ? `: ${guidelineTitle}.` : ".";
  const announcementTitle = item.announcementTitle?.trim();
  const schoolYear = item.schoolYear?.trim();
  const semester = item.semester?.trim();
  const collegeName = item.collegeName?.trim();
  const departmentName = item.departmentName?.trim();
  const approverFlowField = item.approverFlowField?.trim();

  if (item.variant === "exported_clearance_results") {
    const title = "Exported Clearance Results";
    const firstName = item.actorFirstName?.trim() || userName;
    const schoolYearTail = schoolYear ? ` for ${schoolYear}` : "";
    const semesterTail = semester ? ` for ${semester}.` : ".";
    const description = `User ${firstName} exported clearance results${schoolYearTail}${semesterTail}`;
    return { title, description };
  }

  if (item.variant === "created_guideline") {
    const title = "Created Guideline";
    const description = `User ${userName} created guideline${guidelineTail}`;
    return { title, description };
  }

  if (item.variant === "edited_guideline") {
    const title = "Edited Guideline";
    const description = `User ${userName} edited guideline${guidelineTail}`;
    return { title, description };
  }

  if (item.variant === "set_guideline_status_active") {
    const title = "Set Guideline Status to \"Active\"";
    const description = `User ${userName} set guideline, ${guidelineTitle || ""} status to Active.`;
    return { title, description };
  }

  if (item.variant === "set_guideline_status_inactive") {
    const title = "Set Guideline Status to \"Inactive\"";
    const description = `User ${userName} set guideline, ${guidelineTitle || ""} status to Inactive.`;
    return { title, description };
  }

  if (item.variant === "archived_guideline") {
    const title = "Archived Guideline";
    const description = `User ${userName} archived guideline${guidelineTail}`;
    return { title, description };
  }

  if (item.variant === "created_announcement") {
    const title = "Created Announcement";
    const description = `User ${userName} created announcement${announcementTitle ? `: ${announcementTitle}.` : "."}`;
    return { title, description };
  }

  if (item.variant === "edited_announcement") {
    const title = "Edited Announcement";
    const description = `User ${userName} edited announcement${announcementTitle ? `: ${announcementTitle}.` : "."}`;
    return { title, description };
  }

  

  if (item.variant === "set_announcement_status_active") {
    const title = "Set Announcement Status to \"Active\"";
    const description = `User ${userName} set announcement, ${announcementTitle || ""} status to Active.`;
    return { title, description };
  }

  if (item.variant === "set_announcement_status_inactive") {
    const title = "Set Announcement Status to \"Inactive\"";
    const description = `User ${userName} set announcement, ${announcementTitle || ""} status to Inactive.`;
    return { title, description };
  }

  if (item.variant === "created_timeline") {
    const title = "Created Timeline";
    const timelineLabel = [schoolYear, semester].filter(Boolean).join(" ").trim();
    const labelTail = timelineLabel ? `: ${timelineLabel}.` : ".";
    const description = `User ${userName} created timeline${labelTail}`;
    return { title, description };
  }

  if (item.variant === "set_timeline_status_active") {
    const title = "Set Timeline Status to \"Active\"";
    const timelineLabel = [schoolYear, semester].filter(Boolean).join(" ").trim();
    const labelTail = timelineLabel ? ` ${timelineLabel}` : "";
    const description = `User ${userName} set timeline,${labelTail} status to Active.`;
    return { title, description };
  }

  if (item.variant === "set_timeline_status_inactive") {
    const title = "Set Timeline Status to \"Inactive\"";
    const timelineLabel = [schoolYear, semester].filter(Boolean).join(" ").trim();
    const labelTail = timelineLabel ? ` ${timelineLabel}` : "";
    const description = `User ${userName} set timeline,${labelTail} status to Inactive, clearance timeline is archived.`;
    return { title, description };
  }

  if (item.variant === "created_college") {
    const title = "Created College";
    const collegeTail = collegeName ? `: ${collegeName}.` : ".";
    const description = `User ${userName} created college${collegeTail}`;
    return { title, description };
  }

  if (item.variant === "edited_college") {
    const title = "Edited College";
    const collegeTail = collegeName ? `: ${collegeName}.` : ".";
    const description = `User ${userName} edited college${collegeTail}`;
    return { title, description };
  }

  if (item.variant === "deleted_college") {
    const title = "Deleted College";
    const collegeTail = collegeName ? `: ${collegeName}.` : ".";
    const description = `User ${userName} deleted college${collegeTail}`;
    return { title, description };
  }

  if (item.variant === "created_department") {
    const title = "Created Department";
    const deptTail = departmentName ? `: ${departmentName}` : "";
    const collegeTail = collegeName ? ` for ${collegeName}.` : ".";
    const description = `User ${userName} created department${deptTail}${collegeTail}`;
    return { title, description };
  }

  if (item.variant === "edited_department") {
    const title = "Edited Department";
    const deptTail = departmentName ? `: ${departmentName}` : "";
    const collegeTail = collegeName ? ` for ${collegeName}.` : ".";
    const description = `User ${userName} edited department${deptTail}${collegeTail}`;
    return { title, description };
  }

  if (item.variant === "deleted_department") {
    const title = "Deleted Department";
    const deptTail = departmentName ? `: ${departmentName}` : "";
    const collegeTail = collegeName ? ` for ${collegeName}.` : ".";
    const description = `User ${userName} deleted department${deptTail}${collegeTail}`;
    return { title, description };
  }

  if (item.variant === "user_logout") {
    const title = "User Logout";
    const firstName = item.actorFirstName?.trim() || userName;
    const roleTail = item.actorRole?.trim() ? ` as ${item.actorRole.trim()}` : "";
    const inTail = deptOffice ? ` in ${deptOffice}.` : ".";
    const description = `User ${firstName} logged out${roleTail}${inTail}`;
    return { title, description };
  }

  if (item.variant === "user_login") {
    const title = "User Login";
    const firstName = item.actorFirstName?.trim() || userName;
    const roleTail = item.actorRole?.trim() ? ` as ${item.actorRole.trim()}` : "";
    const inTail = deptOffice ? ` in ${deptOffice}.` : ".";
    const description = `User ${firstName} logged in${roleTail}${inTail}`;
    return { title, description };
  }

  if (item.variant === "updated_assistant_approver" ) {
    const title = "Updated Assistant Approver";
    const assistantTail = assistantApproverName ? ` ${assistantApproverName}` : "";
    const description = `User ${userName} updated assistant approver${assistantTail}${deptTail}`;
    return { title, description };
  }

  if (item.variant === "removed_assistant_approver") {
    const title = "Removed Assistant Approver";
    const assistantTail = assistantApproverName ? ` ${assistantApproverName}` : "";
    const description = `User ${userName} removed assistant approver${assistantTail}${deptTail}`;
    return { title, description };
  }

  if (item.variant === "added_assistant_approver") {
    const title = "Added Assistant Approver";
    const assistantTail = assistantApproverName ? ` ${assistantApproverName}` : "";
    const description = `User ${userName} created assistant approver${assistantTail}${deptTail}`;
    return { title, description };
  }

  if (item.variant === "deleted_requirements") {
    const title = "Deleted Requirements";
    const description = `User ${userName} deleted requirement${requirementTail}${deptTail}`;
    return { title, description };
  }

  if (item.variant === "created_requirements") {
    const title = "Created Requirements";
    const description = `User ${userName} created requirement${requirementTail}${deptTail}`;
    return { title, description };
  }

  if (item.variant === "edited_requirements") {
    const title = "Edited Requirements";
    const description = `User ${userName} edited requirement${requirementTail}${deptTail}`;
    return { title, description };
  }

  if (item.variant === "create_request") {
    const title = "Create Request";
    const description = `Faculty Member ${facultyName || actorName} from ${facultyCollegeDepartment}, requested for clearance.`;
    return { title, description };
  }

  if (item.variant === "approved_clearance") {
    const title = "Approved Clearance";
    const description = `User ${actorName} of Department/Office ${item.approverDepartment || ""}, approved clearance for faculty member ${facultyName}.`;
    return { title, description };
  }

  const title = "Rejected Clearance";
  const description = `User ${actorName} of Department/Office ${item.approverDepartment || ""}, rejected clearance for faculty member ${facultyName}.`;
  return { title, description };
}

export function ActivityLogsCard({ items, className }: ActivityLogsCardProps): React.ReactElement {
  const parseDateParts = (dateLabel: string) => {
    const today = new Date();
    const shortMonths = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    if (dateLabel === "Today") {
      return {
        year: String(today.getFullYear()),
        monthIndex: today.getMonth(),
        monthShort: shortMonths[today.getMonth()],
        day: String(today.getDate()).padStart(2, "0"),
        key: `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`,
      };
    }

    const mmddyyyy = /^\d{2}\/\d{2}\/\d{4}$/.test(dateLabel);
    if (mmddyyyy) {
      const [mm, dd, yyyy] = dateLabel.split("/");
      const monthIndex = Math.max(0, Math.min(11, Number(mm) - 1));
      const dayNum = Number(dd);
      return {
        year: yyyy,
        monthIndex,
        monthShort: shortMonths[monthIndex],
        day: String(dayNum).padStart(2, "0"),
        key: `${yyyy}-${monthIndex}-${dayNum}`,
      };
    }

    return {
      year: "",
      monthIndex: 0,
      monthShort: "",
      day: "",
      key: dateLabel,
    };
  };

  const yearGroups = React.useMemo(() => {
    // Build a map of year -> dateKey -> dateGroup so each year appears once
    const yearMap = new Map<
      string,
      Map<
        string,
        {
          key: string;
          year: string;
          monthShort: string;
          day: string;
          items: ActivityLogItem[];
          sortKey: number;
        }
      >
    >();

    const getTimestamp = (it: ActivityLogItem) => {
      // Try mm/dd/yyyy + time parsing similar to the page parser
      try {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(it.dateLabel)) {
          const [mm, dd, yyyy] = it.dateLabel.split("/");
          let month = Math.max(0, Math.min(11, Number(mm) - 1));
          let day = Number(dd) || 1;
          let year = Number(yyyy) || 0;

          let hour = 0;
          let minute = 0;
          if (it.timeLabel) {
            const m = it.timeLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
            if (m) {
              hour = Number(m[1]);
              minute = Number(m[2]);
              const ampm = (m[3] || "").toUpperCase();
              if (ampm === "PM" && hour < 12) hour += 12;
              if (ampm === "AM" && hour === 12) hour = 0;
            }
          }

          return new Date(year, month, day, hour, minute).getTime();
        }

        if (it.dateLabel === "Today") {
          const d = new Date();
          let hour = 0;
          let minute = 0;
          if (it.timeLabel) {
            const m = it.timeLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
            if (m) {
              hour = Number(m[1]);
              minute = Number(m[2]);
              const ampm = (m[3] || "").toUpperCase();
              if (ampm === "PM" && hour < 12) hour += 12;
              if (ampm === "AM" && hour === 12) hour = 0;
            }
          }
          return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute).getTime();
        }

        // fallback: try Date.parse on the label
        const parsed = Date.parse(it.dateLabel);
        if (!isNaN(parsed)) return parsed;
      } catch (e) {}
      return 0;
    };

    for (const item of items) {
      const ts = getTimestamp(item);
      const dateObj = ts ? new Date(ts) : null;
      const year = dateObj ? String(dateObj.getFullYear()) : parseDateParts(item.dateLabel).year || "";
      const monthShort = dateObj ? ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][dateObj.getMonth()] : parseDateParts(item.dateLabel).monthShort;
      const day = dateObj ? String(dateObj.getDate()).padStart(2, "0") : parseDateParts(item.dateLabel).day;
      const monthIndex = dateObj ? dateObj.getMonth() : parseDateParts(item.dateLabel).monthIndex || 0;

      const dateKey = dateObj ? `${year}-${monthIndex}-${dateObj.getDate()}` : parseDateParts(item.dateLabel).key;

      const sortKey = ts || 0;

      let datesMap = yearMap.get(year);
      if (!datesMap) {
        datesMap = new Map();
        yearMap.set(year, datesMap);
      }

      let d = datesMap.get(dateKey);
      if (!d) {
        d = {
          key: dateKey,
          year,
          monthShort,
          day,
          items: [item],
          sortKey,
        };
        datesMap.set(dateKey, d);
      } else {
        d.items.push(item);
        // keep the largest sortKey (most recent) for the date group
        if (sortKey > d.sortKey) d.sortKey = sortKey;
      }
    }

    // Convert map to array, sorting years and dates (most recent first)
    const yearEntries = Array.from(yearMap.entries()).sort((a, b) => {
      const an = Number(a[0]) || 0;
      const bn = Number(b[0]) || 0;
      return bn - an;
    });

    const out = yearEntries.map(([year, datesMap]) => {
      const dates = Array.from(datesMap.values())
        .sort((a, b) => b.sortKey - a.sortKey)
        .map(({ sortKey, ...rest }) => rest);
      return { year, dates };
    });

    return out;
  }, [items]);

  return (
    <div className={cn("space-y-6", className)}>
      {yearGroups.map((yearGroup) => (
        <div key={yearGroup.year || "no-year"} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <div className="text-xl font-bold tracking-wide text-black">
                YEAR {yearGroup.year}
              </div>
            </div>
            <div className="h-[2px] flex-1 bg-[hsl(var(--gray-border))]" />
          </div>

          <div className="space-y-6">
            {yearGroup.dates.map((dateGroup) => (
              <div key={dateGroup.key} className="grid grid-cols-[60px_1fr] gap-0">
                <div className="-ml-4 flex flex-col items-center">
                  <div className="w-full text-center text-lg font-bold text-primary">
                    {dateGroup.monthShort}
                  </div>

                  <div className="mt-1 flex flex-1 flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {dateGroup.day}
                    </div>
                    <div className="w-1 flex-1 rounded-full bg-primary" />
                  </div>
                </div>

                <div className="ml-1 space-y-5">
                  {dateGroup.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg bg-background p-5 shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                    >
                      {(() => {
                        const autoText = formatActivityLogText(item);
                        const title = item.title ?? autoText.title;
                        const description = item.description ?? autoText.description;
                        return (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                {getActivityIcon(item.variant)}
                                <div className="text-xl font-bold text-primary">{title}</div>
                              </div>

                              <div className="whitespace-nowrap text-sm italic text-muted-foreground">
                                {item.timeLabel}
                              </div>
                            </div>

                            <div className="mt-2 text-md text-foreground text-justify">
                              {description}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export type ApprovedCardProps = {
  headerTitle?: string;
  title?: string;
  description?: string;
  note?: string;
  className?: string;
};

export function ApprovedCard({
  headerTitle = "Clearance Approved",
  title = "Congratulations!",
  description =
    "Your clearance has been fully approved. Kindly wait as the HRO is processing your payroll.",
  note =
    "Note: If you teach in the Basic Education Unit, please settle all obligations at that level to avoid delays.",
  className,
}: ApprovedCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-primary text-primary-foreground text-center py-5">
        <CardTitle className="text-base font-bold">{headerTitle}</CardTitle>
      </CardHeader>

      <CardContent className="px-6 py-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-success text-success">
          <Check className="h-8 w-8" />
        </div>

        <div className="mt-4 text-lg font-bold text-foreground">{title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{description}</div>

        <div className="mt-6 text-xs font-semibold text-foreground">{note}</div>
      </CardContent>
    </Card>
  );
}

export type AcademicDetailsRow = {
  label: string;
  value: string;
};

export type AcademicDetailsCardProps = {
  topLeft?: AcademicDetailsRow;
  topRight?: AcademicDetailsRow;
  rows: AcademicDetailsRow[];
  className?: string;
};

export type WelcomeAcademicCardProps = {
  name: string;
  topLeft: AcademicDetailsRow;
  topRight: AcademicDetailsRow;
  rows?: AcademicDetailsRow[];
  afterRows?: React.ReactNode;
  className?: string;
};

export type ApproverWelcomeMetricsProps = {
  pendingClearance: number;
  totalClearanceRequests: number;
  className?: string;
};

export function ApproverWelcomeMetrics({
  pendingClearance,
  totalClearanceRequests,
  className,
}: ApproverWelcomeMetricsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3",
        className
      )}
    >
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-between p-4">
          <div className="text-4xl font-bold leading-none text-primary">{pendingClearance}</div>
          <div className="text-right text-sm font-bold leading-tight text-primary">
            Pending
            <br />
            Clearance
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-between p-4">
          <div className="text-4xl font-bold leading-none text-primary">{totalClearanceRequests}</div>
          <div className="text-right text-sm font-bold leading-tight text-primary">
            Clearance
            <br />
            Requests
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function WelcomeAcademicCard({
  name,
  topLeft,
  topRight,
  rows = [],
  afterRows,
  className,
}: WelcomeAcademicCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-primary text-primary-foreground text-center py-2.5">
        <CardDescription className="text-base leading-none text-primary-foreground/80">
          Welcome
        </CardDescription>
        <CardTitle className="text-xl font-bold leading-tight">{name}!</CardTitle>
      </CardHeader>

      <CardContent className="pt-4 pb-1">
        <div
          className={cn(
            "-mx-6 flex items-center justify-center gap-1.5 px-6 pb-3",
            rows.length
              ? "border-b border-[hsl(var(--gray-border))] shadow-[0_2px_2px_-2px_rgba(0,0,0,0.25)]"
              : ""
          )}
        >
          <div className="flex items-baseline gap-3">
            <div className="text-sm font-bold text-primary">{topLeft.label}</div>
            <div className="text-sm font-medium text-primary">{topLeft.value}</div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-sm font-bold text-primary">{topRight.label}</div>
            <div className="text-sm font-medium text-primary">{topRight.value}</div>
          </div>
        </div>

        {rows.length ? (
          <div className="-mx-6 px-6 py-3">
            <div className="grid grid-cols-[auto,1fr] items-baseline gap-x-6 gap-y-2">
              {rows.map((row) => (
                <React.Fragment key={row.label}>
                  <div className="text-sm font-bold text-primary">{row.label}</div>
                  <div className="text-sm font-medium text-primary whitespace-normal break-words">{row.value}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : null}

        {afterRows ? <div className="mt-4">{afterRows}</div> : null}
      </CardContent>
    </Card>
  );
}

export function AcademicDetailsCard({ topLeft, topRight, rows, className }: AcademicDetailsCardProps) {
  return (
    <Card className={cn("border-0 shadow-none", className)}>
      <CardContent className="pt-6">
        {topLeft && topRight ? (
          <div
            className={cn(
              "-mx-6 flex items-center justify-center gap-3 px-6 pb-3",
              rows.length
                ? "border-b border-[hsl(var(--gray-border))] shadow-[0_2px_2px_-2px_rgba(0,0,0,0.25)]"
                : ""
            )}
          >
            <div className="flex items-baseline gap-3">
              <div className="text-sm font-bold text-primary">{topLeft.label}</div>
              <div className="text-sm font-medium text-primary">{topLeft.value}</div>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-sm font-bold text-primary">{topRight.label}</div>
              <div className="text-sm font-medium text-primary">{topRight.value}</div>
            </div>
          </div>
        ) : null}

        <div className={cn("grid grid-cols-2 gap-x-4 gap-y-2", topLeft && topRight ? "mt-4" : "")}
        >
          {rows.map((row) => (
            <React.Fragment key={row.label}>
              <div className="text-sm font-bold text-primary">{row.label}</div>
              <div className="text-sm font-medium text-primary">{row.value}</div>
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export type ClearanceStatusCardProps = {
  statusLabel: string;
  statusVariant?: DashboardBadgeVariant;
  className?: string;
};

export function ClearanceStatusCard({
  statusLabel,
  statusVariant = "warning",
  className,
}: ClearanceStatusCardProps) {
  return (
    <Card className={cn("bg-foregroundLight", className)}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-foreground">Clearance Status</div>
          <Badge variant={getBadgeVariant(statusVariant)}>{statusLabel}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export type ClearanceProgressCardProps = {
  label?: string;
  value: number;
  current?: number;
  total?: number;
  className?: string;
};

export function ClearanceProgressCard({
  label = "Clearance Progress Bar",
  value,
  current,
  total,
  className,
}: ClearanceProgressCardProps) {
  const computed =
    typeof current === "number" && typeof total === "number" && total > 0
      ? (current / total) * 100
      : value;
  const clamped = Math.max(0, Math.min(100, computed));
  return (
    <Card className={className}>
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <div className="text-base font-bold text-foreground">{label}</div>
          {typeof current === "number" && typeof total === "number" ? (
            <div className="text-sm font-semibold text-muted-foreground">
              {current}/{total}
            </div>
          ) : null}
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-success"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export type ClearanceStepCardProps = {
  index: number;
  title: string;
  statusLabel?: string;
  statusVariant?: DashboardBadgeVariant;
  rightIcon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export type ClearanceRequirementItem = {
  title: string;
  description: string;
  completed?: boolean;
};

export type ExpandableClearanceStepCardProps = {
  index: number;
  title: string;
  statusLabel?: string;
  statusVariant?: DashboardBadgeVariant;
  expanded: boolean;
  onToggle: () => void;
  collapsedType?: "status" | "dropdownOnly" | "locked";
  submittedTo?: string;
  submittedOn?: string;
  requirements?: ClearanceRequirementItem[];
  className?: string;
};

export function ExpandableClearanceStepCard({
  index,
  title,
  statusLabel,
  statusVariant = "warning",
  expanded,
  onToggle,
  collapsedType = "status",
  submittedTo,
  submittedOn,
  requirements = [],
  className,
}: ExpandableClearanceStepCardProps) {
  const isLocked = collapsedType === "locked";
  const effectiveExpanded = expanded && !isLocked;
  const showBadge = collapsedType === "status" && !!statusLabel;
  const showArrow = collapsedType !== "locked";

  return (
    <Card className={cn("overflow-hidden border-muted-foreground/20 shadow-sm", className)}>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between px-6 py-4 text-left",
          effectiveExpanded ? "bg-primary" : "bg-transparent",
          isLocked ? "cursor-not-allowed" : ""
        )}
        onClick={isLocked ? undefined : onToggle}
        disabled={isLocked}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
              effectiveExpanded
                ? "bg-primary-foreground text-primary"
                : "bg-primary text-primary-foreground"
            )}
          >
            {index}
          </div>
          <div
            className={cn(
              "text-sm font-bold",
              effectiveExpanded ? "text-primary-foreground" : "text-primary"
            )}
          >
            {title}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showBadge ? (
            <Badge variant={getBadgeVariant(statusVariant)}>{statusLabel}</Badge>
          ) : null}

          {showArrow ? (
            <img
              src="/PrimaryArrowIcon.png"
              alt={effectiveExpanded ? "Collapse" : "Expand"}
              className={cn(
                "h-7 w-7 object-contain transition-transform",
                effectiveExpanded ? "rotate-180 brightness-0 invert" : "rotate-0"
              )}
            />
          ) : (
            <img
              src="/PrimaryLockIcon.png"
              alt="Locked"
              className="h-5 w-5 object-contain"
            />
          )}
        </div>
      </button>

      {effectiveExpanded ? (
        <CardContent className="px-6 py-5">
          <div className="space-y-5">
            <div>
              <div className="text-sm font-bold text-foreground">Status</div>
              {submittedTo ? (
                <div className="mt-2 text-sm text-foreground">Submitted to: {submittedTo}</div>
              ) : null}
              {submittedOn ? (
                <div className="mt-1 text-sm text-foreground">Submitted on: {submittedOn}</div>
              ) : null}
            </div>

            <div>
              <div className="text-sm font-bold text-foreground">Requirements Checklist</div>
              
              <div className="mt-3 space-y-3">
                {requirements.map((req) => (
                  <div
                    key={req.title}
                    className="flex gap-4 rounded-md bg-foregroundLight px-4 py-4"
                  >
                    <div className="mt-1">
                      <Checkbox variant="success" defaultChecked={req.completed ?? false} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{req.title}</div>
                      <div className="mt-1 text-sm text-foreground whitespace-pre-line">{req.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function ClearanceStepCard({
  index,
  title,
  statusLabel,
  statusVariant = "muted",
  rightIcon,
  className,
  onClick,
}: ClearanceStepCardProps) {
  const effectiveRightIcon =
    rightIcon ?? (
      <img
        src="/PrimaryArrowIcon.png"
        alt="Open"
        className="h-7 w-7 object-contain"
      />
    );

  return (
    <Card
      className={cn(
        "border-muted-foreground/20 shadow-sm",
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {index}
          </div>
          <div className="text-sm font-bold text-primary">{title}</div>
        </div>

        <div className="flex items-center gap-3">
          {statusLabel ? (
            <Badge variant={getBadgeVariant(statusVariant)}>{statusLabel}</Badge>
          ) : null}
          {effectiveRightIcon}
        </div>
      </CardContent>
    </Card>
  );
}

export type SystemGuidlinesItem = {
  title: string;
  description: (string | { text: string; subitems?: string[] })[] | string;
  email: string;
  timestamp: string;
  enabled?: boolean;
};

export type SystemGuidlinesCardProps = {
  items: SystemGuidlinesItem[];
  className?: string;
  onClose?: () => void;
  headerActionHref?: string;
  headerActionImgSrc?: string;
  headerActionImgAlt?: string;
  headerActionOnClick?: () => void;
  onViewItem?: (item: SystemGuidlinesItem) => void;
  onAddRequirement?: () => void;
  addDisabled?: boolean;
  cardName?: string;
};

export interface SectionListCardProps {
  title: string;
  className?: string;
  onClose?: () => void;
  headerActionHref?: string;
  headerActionImgSrc?: string;
  headerActionImgAlt?: string;
  headerActionOnClick?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionListCard(props: SectionListCardProps) {
  const {
    title,
    className,
    onClose,
    headerActionHref,
    headerActionImgSrc,
    headerActionImgAlt = "Open",
    headerActionOnClick,
    headerActions,
    children,
  } = props;

  const headerAction = headerActionHref && headerActionImgSrc ? (
    <Button
      asChild
      variant="icon"
      size="icon"
      className="absolute right-3 top-[40%] -translate-y-1/2 text-primary-foreground"
    >
      <Link to={headerActionHref}>
        <img
          src={headerActionImgSrc}
          alt={headerActionImgAlt}
          className="h-6 w-6 object-contain"
        />
      </Link>
    </Button>
  ) : headerActionOnClick && headerActionImgSrc ? (
    <Button
      type="button"
      variant="icon"
      size="icon"
      className="absolute right-3 top-[40%] -translate-y-1/2 text-primary-foreground"
      onClick={headerActionOnClick}
    >
      <img
        src={headerActionImgSrc}
        alt={headerActionImgAlt}
        className="h-6 w-6 object-contain"
      />
    </Button>
  ) : onClose ? (
    <Button
      type="button"
      variant="icon"
      size="icon"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground"
      onClick={onClose}
    >
      <X className="h-5 w-5" />
    </Button>
  ) : null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="relative bg-primary py-3">
        <CardTitle className="text-center text-base font-bold text-primary-foreground">
          {title}
        </CardTitle>
        {headerActions ? (
          <div className="absolute right-3 top-[40%] -translate-y-1/2">{headerActions}</div>
        ) : (
          headerAction
        )}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export type FacultyDataDumpCardProps = {
  title?: string;
  className?: string;
  onFileSelected?: (file: File) => void;
  onDownloadTemplate?: () => void;
  maxSizeLabel?: string;
  accept?: string;
};

export function FacultyDataDumpCard({
  title = "Upload Faculty Data",
  className,
  onFileSelected,
  onDownloadTemplate,
  maxSizeLabel = "Max size 50 MB",
  accept = ".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}: FacultyDataDumpCardProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    onFileSelected?.(file);
  }

  return (
    <Card className={cn("overflow-hidden border-muted-foreground/20", className)}>
      <CardContent className="p-6">
        <div className="text-center text-base font-bold text-foreground">{title}</div>

        <div
          className="mt-4 rounded-md border-2 border-dashed border-muted-foreground/40 bg-muted/30 p-8"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <button
            type="button"
            className="mx-auto flex w-full flex-col items-center justify-center gap-3"
            onClick={() => inputRef.current?.click()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-md text-muted-foreground">
              <Upload className="h-10 w-10" />
            </div>
            <div className="text-md text-muted-foreground">
              {" "}
              <span className="font-bold">Click to upload </span> or drag and drop
            </div>
            <div className="text-xs text-muted-foreground">CSV or Excel files ({maxSizeLabel})</div>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <div className="mt-5 rounded-md bg-primary/10 p-4">
          <div className="text-lg font-bold text-primary">Need a template?</div>
          <div className="mt-1 mt-2 text-sm  text-muted-foreground">
            Download our CSV template to ensure your student data is formatted correctly
          </div>

          <div className="mt-4">
            <Button
              type="button"
              className="h-10 rounded-md bg-primary px-4 
              font-bold text-primary-foreground hover:bg-primary/90"
              onClick={onDownloadTemplate}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <img src="/WhiteDownloadIcon.png" alt="Download" className="h-6 w-6 object-contain" />
                Download Template
              </div>
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-md bg-yellow-100 p-4">
          <div className="text-md font-bold text-yellow-900">Important Information</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm  text-yellow-900">
            <li>All imported users will be automatically assigned the faculty member role</li>
            <li>Faculty Members will automatically be assigned to the active school year and semester</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export type SystemUser = {
  id: string;
  name: string;
  systemId: string;
  userRole: string;
  universityId: string;
  college: string;
  department: string;
  email: string;
};

export type SystemUsersCardProps = {
  className?: string;
  users: SystemUser[];
  onAddApprover?: () => void;
  onAddAdmin?: () => void;
  onEditUser?: (user: SystemUser) => void;
  onRemoveUser?: (user: SystemUser) => void;
  pageLabel?: string;
  pageCountLabel?: string;
  onPrevPage?: () => void;
  onNextPage?: () => void;
};

export function SystemUsersCard({
  className,
  users,
  onAddApprover,
  onAddAdmin,
  onEditUser,
  onRemoveUser,
}: SystemUsersCardProps) {
  return (
    <Card className={cn("overflow-hidden border-muted-foreground/20 shadow-sm", className)}>
      <CardContent className="p-0">
        <div className="flex">
          <Divider orientation="vertical" className="h-auto self-stretch" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-center gap-2 bg-background px-4 py-3">
              <Button type="button" variant="default" className="h-10" onClick={onAddApprover}>
                <img src="/WhitePlusIcon.png" alt="Add Approver" className="h-5 w-5 object-contain" />
                <span className="ml-0">Add Approver</span>
              </Button>
              <Button type="button" variant="default" className="h-10" onClick={onAddAdmin}>
                <img src="/WhitePlusIcon.png" alt="Add Admin" className="h-5 w-5 object-contain" />
                <span>Add Admin</span>
              </Button>
            </div>

            <Divider color="border-[hsl(var(--gray-border))]" />

            <div>
              {users.map((user, idx) => (
                <React.Fragment key={user.id}>
                  <div className="flex items-start gap-4 px-4 py-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-xl font-bold text-foreground">{user.name}</span>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="action"
                            className="h-7 rounded-md px-3 text-xs font-bold"
                            onClick={() => onEditUser?.(user)}
                          >
                            EDIT
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            className="h-7 rounded-md px-3 text-xs font-bold"
                            onClick={() => onRemoveUser?.(user)}
                          >
                            REMOVE
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-md">
                        <div className="font-semibold text-md text-foreground">System ID</div>
                        <div className="text-muted-foreground">{user.systemId}</div>

                        <div className="font-semibold text-md text-foreground">User Role</div>
                        <div className="text-muted-foreground">{user.userRole}</div>

                        <div className="font-semibold text-md text-foreground">University ID</div>
                        <div className="text-muted-foreground">{user.universityId}</div>

                        <div className="font-semibold text-foreground">College</div>
                        <div className="text-muted-foreground">{user.college}</div>

                        <div className="font-semibold text-foreground">Department</div>
                        <div className="text-muted-foreground">{user.department}</div>

                        <div className="font-semibold text-foreground">Email</div>
                        <div className="break-all text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </div>

                  {idx < users.length - 1 ? (
                    <Divider color="border-[hsl(var(--gray-border))]" />
                  ) : null}
                </React.Fragment>
              ))}
            </div>
          </div>
          <Divider orientation="vertical" className="h-auto self-stretch" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemGuidlinesCard({
  items,
  className,
  onClose,
  headerActionHref,
  headerActionImgSrc,
  headerActionImgAlt = "Open",
  headerActionOnClick,
  cardName,
  onViewItem,
  onAddRequirement,
  addDisabled,
}: SystemGuidlinesCardProps) {
  return (
    <SectionListCard
      title={cardName ?? "System Guidelines"}
      className={className}
      onClose={onClose}
      headerActionHref={headerActionHref}
      headerActionImgSrc={headerActionImgSrc}
      headerActionImgAlt={headerActionImgAlt}
      headerActionOnClick={headerActionOnClick}
    >
      <div className="p-4">
        <div className="space-y-3">
          {items.map((item) => (
            <React.Fragment key={item.title}>
              <div className=" items-start gap-3 rounded-md bg-muted p-4">
                <div>
                  <div className="mt-2 text-lg font-bold text-black">{item.title}</div>

                  <div className="mt-3 text-md text-black">
                    {Array.isArray(item.description) ? (
                      <ol className="mb-2 ml-4 list-decimal space-y-1">
                        {item.description.map((desc, i) => (
                          <li key={i}>
                            {typeof desc === "string" ? desc : desc.text}

                            {typeof desc !== "string" && desc.subitems ? (
                              <ol className="ml-6 mt-1 list-lower-alpha space-y-1">
                                {desc.subitems.map((sub, j) => (
                                  <li key={j}>{sub}</li>
                                ))}
                              </ol>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="whitespace-pre-line">{item.description}</p>
                    )}

                    <Link to={item.email} className="text-primary font-bold underline">
                      {item.email}
                    </Link>
                  </div>
                </div>

                <div className="flex items-start justify-between mt-3 text-sm text-muted-foreground">
                  Created: {item.timestamp}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </SectionListCard>
  );
}

export type ClearanceTimelineStatus = "active" | "inactive";

export type ClearanceTimelineItem = {
  id?: string;
  schoolYear: string;
  term: string;
  status: ClearanceTimelineStatus;
  inclusiveDates: string;
  createdAt: string;
};

export type ClearanceTimelineCardProps = {
  title: string;
  items: ClearanceTimelineItem[];
  className?: string;
  headerActionHref?: string;
  headerActionImgSrc?: string;
  headerActionImgAlt?: string;
  headerActionOnClick?: () => void;
  onEditItem?: (item: ClearanceTimelineItem) => void;
};

export function ClearanceTimelineCard({
  title,
  items,
  className,
  headerActionHref,
  headerActionImgSrc,
  headerActionImgAlt = "Open",
  headerActionOnClick,
  onEditItem,
}: ClearanceTimelineCardProps) {

  return (
    <SectionListCard
      title={title}
      className={className}
      headerActionHref={headerActionHref}
      headerActionImgSrc={headerActionImgSrc}
      headerActionImgAlt={headerActionImgAlt}
      headerActionOnClick={headerActionOnClick}
    >
      <div className="space-y-3 p-4">
        {items.map((item, idx) => (
          <div
            key={`${item.schoolYear}-${item.term}-${idx}`}
            className="overflow-hidden rounded-md bg-muted"
          >
            <div className="flex items-center justify-between bg-muted px-4 py-3">
              <div className="min-w-0 gap-1">
                <div className="text-lg font-bold text-black">{item.schoolYear}</div>
                <div className="text-lg font-bold text-black">{item.term}</div>
              </div>

              <Badge variant={item.status === "active" ? "success" : "destructive"}>
                {item.status.toUpperCase()}
              </Badge>
            </div>

            <div className="bg-muted px-4 py-4">
              <div className="text-md font-bold text-black">Inclusive Dates</div>
              <div className="mt-1 text-md text-black">{item.inclusiveDates}</div>

              <div className="mt-3 text-sm text-muted-foreground">
                Created: {item.createdAt}
              </div>
            </div>

            {item.status === "active" ? (
              <div className="bg-muted px-4 py-4">
                <div className="flex items-center justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 w-40 rounded-md px-4 text-xs font-bold"
                    onClick={() => onEditItem?.(item)}
                  >
                    EDIT
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </SectionListCard>
  );
}

export type AnalyticsDonutCardProps = {
  title: string;
  completed: number;
  total: number;
  className?: string;
};

export function AnalyticsDonutCard({ title, completed, total, className }: AnalyticsDonutCardProps) {
  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.max(0, Math.min(completed, safeTotal));
  const pct = safeTotal > 0 ? (safeCompleted / safeTotal) * 100 : 0;
  const clamped = Math.max(0, Math.min(100, pct));

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-primary py-3">
        <CardTitle className="text-center text-base font-bold text-primary-foreground">{title}</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="mx-auto w-full max-w-[320px] rounded-md border border-[hsl(var(--gray-border))] bg-background p-4">
          <div className="mx-auto flex items-center justify-center">
            <div
              className="relative h-48 w-48 rounded-full"
              style={{
                background: `conic-gradient(hsl(var(--success)) ${clamped}%, hsl(var(--muted)) ${clamped}% 100%)`,
              }}
            >
              <div className="absolute inset-7 rounded-full bg-background" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-8 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-6 rounded-sm bg-[hsl(var(--muted))]" />
              <div>Incomplete</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2.5 w-6 rounded-sm bg-success" />
              <div>Completed</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type DepartmentCompletionRateItem = {
  label: string;
  completed: number;
  total: number;
};

export type DepartmentCompletionRateSection = {
  title: string;
  items: DepartmentCompletionRateItem[];
};

export type DepartmentCompletionRateCardProps = {
  title?: string;
  sections: DepartmentCompletionRateSection[];
  className?: string;
};

export function DepartmentCompletionRateCard({
  title = "Department Completion Rate",
  sections,
  className,
}: DepartmentCompletionRateCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-primary py-3">
        <CardTitle className="text-center text-base font-bold text-primary-foreground">{title}</CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="text-sm font-bold text-foreground">{section.title}</div>

              <div className="mt-3 space-y-3">
                {section.items.map((item) => {
                  const safeTotal = Math.max(0, item.total);
                  const safeCompleted = Math.max(0, Math.min(item.completed, safeTotal));
                  const pct = safeTotal > 0 ? (safeCompleted / safeTotal) * 100 : 0;
                  const clamped = Math.max(0, Math.min(100, pct));

                  return (
                    <div key={item.label} className="rounded-md bg-muted px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-foreground">{item.label} </div>
                        <div className="text-xs font-semibold text-muted-foreground">
                          {safeCompleted}/{safeTotal}
                        </div>
                      </div>

                      <div className="mt-3 h-1.5 w-full rounded-full bg-background">
                        <div className="h-1.5 rounded-full bg-success" style={{ width: `${clamped}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
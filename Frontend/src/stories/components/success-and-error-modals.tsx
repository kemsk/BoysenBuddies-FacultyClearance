
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";

import { cn } from "../../components/lib/utils";
import { Button } from "./button";

type BaseStatusModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  message: React.ReactNode;
  continueLabel?: string;
  onContinue?: () => void;
  disableContinue?: boolean;
};

type StatusModalVariant = "success" | "error";

function StatusModal({
  open,
  onOpenChange,
  title,
  message,
  continueLabel = "Continue",
  onContinue,
  disableContinue,
  variant,
}: BaseStatusModalProps & {
  variant: StatusModalVariant;
}) {
  const defaultTitle = variant === "success" ? "Success" : "Error";
  const finalTitle = title ?? defaultTitle;
  const iconBg = variant === "success" ? "bg-success" : "bg-red-500";
  const Icon = variant === "success" ? Check : X;

  const handleContinue = () => {
    onContinue?.();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-xl bg-white shadow-xl",
            "focus:outline-none",
          )}
        >
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className={cn("mt-2 flex h-24 w-24 items-center justify-center rounded-full", iconBg)}>
                <Icon className="h-12 w-12 text-white" strokeWidth={3} />
              </div>

              <div className="mt-6 text-3xl font-bold text-black">{finalTitle}</div>
              <div className="mt-3 text-lg text-gray-700">{message}</div>
            </div>

            <div className="mt-10">
              <Button
                type="button"
                className="h-12 w-full rounded-lg bg-gray-300 text-gray-600 hover:bg-gray-300"
                disabled={disableContinue}
                onClick={handleContinue}
              >
                {continueLabel}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function SuccessModal(props: BaseStatusModalProps) {
  return <StatusModal {...props} variant="success" />;
}

export function ErrorModal(props: BaseStatusModalProps) {
  return <StatusModal {...props} variant="error" />;
}

export const SuccessErrorModalMessages = {
  EMAIL_MUST_BE_XU: "Email must be an XU email (@xu.edu.ph or @my.xu.edu.ph)",
  EMAIL_MUST_BE_XU_FACULTY: "Email must be an XU email (@xu.edu.ph)",
  EMAIL_MUST_BE_XU_STUDENT: "Email must be a student XU email (@my.xu.edu.ph)",
  ERROR_DETAIL_FROM_API: "Error detail from API response",
  ERROR_MATCH_EMAIL: "Email does not match the logged-in admin's email. Please try again.",
  ERROR_MESSAGE_FROM_API: "Error message from API",

  APPROVER_CREATED: "Approver created successfully!",
  APPROVER_UPDATED: "Approver updated successfully!",
  SYSTEM_ADMIN_CREATED: "System Admin created successfully!",
  SYSTEM_ADMIN_UPDATED: "System Admin updated successfully!",
  USER_REMOVED: "User removed successfully!",

  ASSISTANT_CREATED: "Assistant created successfully!",
  ASSISTANT_UPDATED: "Assistant updated successfully!",
  ASSISTANT_REMOVED: "Assistant removed successfully!",
  ADMIN_CREATED: "Admin created successfully!",

  EMAIL_DOES_NOT_MATCH_APPROVER:
    "Email does not match the logged-in approver's email. Please try again.",
  EMAIL_DOES_NOT_MATCH_ADMIN:
    "Email does not match the logged-in admin's email. Please try again.",
  MUST_ACCEPT_TERMS: "You must accept the terms and agreements to continue.",

  REQUEST_APPROVED: "Request approved successfully!",
  REQUEST_APPROVE_FAILED: "Failed to approve request. Please try again.",
  REQUEST_REJECTED: "Request rejected successfully!",
  REQUEST_REJECT_FAILED: "Failed to reject request. Please try again.",

  REQUIREMENT_SUBMITTED_SUCCESSFULLY: "Requirement submitted successfully!",
  REQUIREMENT_SUBMIT_FAILED: "Failed to submit requirement. Please try again.",

  IMPORT_SELECT_SEMESTER:
    "Please select a semester based on an existing clearance timeline before importing the faculty CSV.",
  IMPORT_ERROR_FROM_API: "Import error message from API",
  IMPORT_COMPLETE_WITH_COUNTS: "Import complete. Created: X, Updated: Y, Skipped: Z\n\nPlease check the CSV file again for the faculty that have been skipped.",
  DOWNLOAD_TEMPLATE_FAILED: "Failed to download template",
  DOWNLOAD_CSV_FAILED: "Failed to download CSV file",
} as const;

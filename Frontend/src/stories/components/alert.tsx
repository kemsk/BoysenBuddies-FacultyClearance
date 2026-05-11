import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
 
import { cn } from "../../components/lib/utils"
 
import { Button } from "./button"
import { InputGroupTextarea, LineInputGroup, type InputGroup, type InputGroupInput } from "./input-group"
import { useState } from "react"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "text-destructive [&>svg]:text-destructive",
        deactivate:
          "text-red-600 [&>svg]:text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
 
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & 
  VariantProps<typeof alertVariants> & 
  { 
    title?: string; 
    description?: string; 
    onCancel?: () => void;
    onConfirm?: () => void;
    showButtons?: boolean;
  }
>(({ className, variant, title, description, onCancel, onConfirm, showButtons = true, children, ...props }, ref) => {
  // Editable title and description - change these values here!
  const alertTitle = title || "Confirm Status Change";
  const alertDescription = description || "Are you sure you want to deactivate this timeline?";
 
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <AlertTitle>{alertTitle}</AlertTitle>
      <AlertDescription>{alertDescription}</AlertDescription>
      {showButtons && title && description && (
        <div className="flex gap-3 justify-end mt-4">
          <button
            onClick={onCancel || (() => console.log("Cancel clicked"))}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm || (() => console.log("Confirm clicked"))}
            className={`px-4 py-2 rounded ${
              variant === "destructive"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Confirm
          </button>
        </div>
      )}
      {!title && !description && children}
    </div>
  )
})
Alert.displayName = "Alert"
 
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"
 
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"
 
export { Alert, AlertTitle, AlertDescription }
 
export const DeactivateAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onDelete?: () => void;
    onCancel?: () => void;
  }
>(({ className, onDelete, onCancel, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant: "deactivate" }), className)}
    {...props}
  >
    <div className=" items-center gap-4 mb-3">
      <div className="p-4 flex items-center justify-center">
      <img src="/RedAlertIcon.png" width="50" height="50" />
      </div>
      <div className="mb-4 text-xl text-center text-black font-bold">
        You are about to <span className="text-destructive"> DEACTIVATE</span>  "General Safety Guidelines"
      </div>
    </div>
    <div className="mb-4 text-lg text-center text-black font-bold">
      Do you wish to continue?
    </div>
 
    <div className="flex flex-col gap-3 justify-end">
      <Button variant="destructive" onClick={onDelete || (() => console.log("Deactivate confirmed"))} className="w-full font-bold">
        DEACTIVATE
      </Button>
      <Button variant="cancel" onClick={onCancel || (() => console.log("Cancel Deactivate"))} className="w-full">
        CANCEL
      </Button>
    </div>
  </div>
))
 
export const ActivateAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onDelete?: () => void;
    onCancel?: () => void;
  }
>(({ className, onDelete, onCancel, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant: "deactivate" }), className)}
    {...props}
  >
    <div className=" items-center gap-4 mb-3">
      <div className="p-4 flex items-center justify-center">
      <img src="/PrimaryAlertIcon.png" width="50" height="50" />
      </div>
      <div className="mb-4 text-xl text-center text-black font-bold">
        You are about to <span className="text-primary"> ACTIVATE</span>  "General Safety Guidelines"
      </div>
    </div>
    <div className="mb-4 text-lg text-center text-black font-bold">
      Do you wish to continue?
    </div>
 
    <div className="flex flex-col gap-3 justify-end">
      <Button variant="default" onClick={onDelete || (() => console.log("Activate confirmed"))} className="w-full font-bold">
        ACTIVATE
      </Button>
      <Button variant="cancel" onClick={onCancel || (() => console.log("Cancel Activate"))} className="w-full">
        CANCEL
      </Button>
    </div>
  </div>
))
 
export const ArchiveAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onDelete?: () => void;
    onCancel?: () => void;
  }
>(({ className, onDelete, onCancel, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant: "deactivate" }), className)}
    {...props}
  >
    <div className=" items-center gap-4 mb-3">
      <div className="p-4 flex items-center justify-center">
      <img src="/PrimaryAlertIcon.png" width="50" height="50" />
      </div>
      <div className="mb-4 text-xl text-center text-black font-bold">
        You are about to <span className="text-primary"> ARCHIVE</span>  "General Safety Guidelines"
      </div>
    </div>
    <div className="mb-4 text-lg text-center text-black font-bold">
      Do you wish to continue?
    </div>
 
    <div className="flex flex-col gap-3 justify-end">
      <Button variant="default" onClick={() => console.log("Activate confirmed")} className="w-full font-bold">
        ARCHIVE
      </Button>
      <Button variant="cancel" onClick={() => console.log("Cancel Activate")} className="w-full">
        CANCEL
      </Button>
    </div>
  </div>
))
 
export const DeleteAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    itemName?: string;
    onDelete?: () => void;
    onCancel?: () => void;
  }
>(({ className, itemName = "General Safety Guidelines", onDelete, onCancel, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant: "deactivate" }), className)}
    {...props}
  >
    <div className=" items-center gap-4 mb-3">
      <div className="p-4 flex items-center justify-center">
      <img src="/RedAlertIcon.png" width="50" height="50" />
      </div>
      <div className="mb-4 text-xl text-center text-black font-bold">
        You are about to <span className="text-destructive"> DELETE</span>  "{itemName}"
      </div>
    </div>
    <div className="mb-4 text-lg text-center text-black font-bold">
      Do you wish to continue?
    </div>
 
    <div className="flex flex-col gap-3 justify-end">
      <Button variant="destructive" onClick={onDelete} className="w-full font-bold">
        DELETE
      </Button>
      <Button variant="cancel" onClick={onCancel} className="w-full">
        CANCEL
      </Button>
    </div>
  </div>
))

export const OverrideAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onDelete?: () => void;
    onCancel?: () => void;
    status?: 'approved' | 'rejected';
    onStatusChange?: (status: 'approved' | 'rejected') => void;
    open?: boolean;
    requestId?: string;
    onConfirm?: (reason: string) => void;
  }
>(({ className, onDelete, onCancel, status, onStatusChange, onConfirm, requestId, ...props }, ref) => {
  // Add state here
  const [overrideReason, setOverrideReason] = React.useState('');
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant: "default" }), className)}
      {...props}
    >
    <div className=" items-center gap-4 mb-3">
      <div className="p-4 flex items-center justify-center">
        <img src="/RedAlertIcon.png" width="50" height="50" />
      </div>
      <div className="mb-4 text-xl text-center text-black font-bold">
        You are about to OVERRIDE clearance request {requestId || "[Request ID]"}.
      </div>

      <div className="mb-4 text-md text-center text-black">
        Please provide a reason for overriding
      </div>

      <InputGroupTextarea 
        placeholder="Enter reason for override..."
        value={overrideReason}
        onChange={(e) => setOverrideReason(e.target.value)}
        className="border border-gray-300 rounded-md p-2 !text-black placeholder:text-gray-400"
      />
      
      <div className="mt-6 mb-4 text-xs text-black text-justify">
        Note: Overriding will change the status for both approver and faculty member. If the faculty member has already cleared all requirements, their clearance status will be reverted to incomplete.
      </div>
      
      {/* Status selection */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <label className="flex items-center">
          <span className="text-md font-bold text-foreground mr-4">Status:</span>
          <input
            type="radio"
            name="override_status"
            value="approved"
            checked={status === 'approved'}
            onChange={(e) => onStatusChange?.(e.target.value as 'approved')}
            className="mr-2"
          />
          <span className="text-black">Approved</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="override_status"
            value="rejected"
            checked={status === 'rejected'}
            onChange={(e) => onStatusChange?.(e.target.value as 'rejected')}
            className="mr-2"
          />
          <span className="text-black">Rejected</span>
        </label>
      </div>
      
      <div className="flex flex-row gap-3 justify-end mt-6">
        <Button variant="cancel" onClick={onCancel} className="flex-1">
          CANCEL
        </Button>
        <Button variant="default" onClick={() => {
          onConfirm?.(overrideReason);
          }} className="flex-1 font-bold">
          UPDATE
        </Button>
      </div>
    </div>
  </div>
);
});

export const ConfirmAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onDelete?: (email?: string) => void;
    onCancel?: () => void;
    status?: 'approved' | 'rejected';
    onStatusChange?: (status: 'approved' | 'rejected') => void;
    open?: boolean;
    reason?: string;  
  }
>(({ className, onDelete, onCancel, status, onStatusChange, reason, ...props }, ref) => {
  // Add state here
  const [overrideReason, setOverrideReason] = React.useState('');
 
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant: "default" }), className)}
      {...props}
    >
    <div className=" items-center gap-4 mb-3">
      <div className="mb-4 text-xl text-center text-black font-bold">
        Input your XU Email to confirm
      </div>


      <LineInputGroup 
        placeholder="example@xu.edu.ph"
        value={overrideReason}
        onChange={(e) => setOverrideReason(e.target.value)}
        className="!text-black placeholder:text-gray-400"
        containerClassName="border border-gray-300 rounded-md"
      />
      
      <div className="flex flex-row gap-3 justify-end mt-6">
        <Button variant="cancel" onClick={onCancel} className="flex-1">
          CANCEL
        </Button>
        <Button variant="default" onClick={() => {
          onDelete?.(overrideReason);
        }} className="flex-1 font-bold">
          CONFIRM
        </Button>
      </div>
    </div>
  </div>
);
});


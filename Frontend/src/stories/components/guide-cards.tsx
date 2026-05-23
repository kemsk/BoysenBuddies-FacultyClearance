import { useEffect } from "react";
import { X, Info } from "lucide-react";
import { useState } from "react";


export interface GuideCardProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function LoginGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            Welcome to XU Faculty ClearTrack. This system is accessible to registered Xavier University personnel only.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Important Notes
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Only your XU institutional email address can be used to log in</li>
              <li>If you cannot access the system, contact your system administrator</li>
              <li>Do not share your account with others</li>
            </ul>
          </div>

          <p>
            To get started, click the Sign in with Google button and select your XU email account.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function RoleLoginGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            You have successfully logged in. This page shows the roles assigned to your account. Please select which role you would like to use.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Important Notes
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Only the roles assigned to your account will appear on this page</li>
              <li>Click the role you want to use to proceed to your dashboard</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is your dashboard. Here you can see your name, school year, and semester.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li><b>System Guidelines</b> contains important instructions and information about how to use this system. Click the arrow in the dark blue System Guidelines bar to read them.</li>
              <li><b>Announcements</b> contains updates and notices posted by the administrator. Click the arrow in the yellow Announcements bar to read them.</li>
            </ul>
          </div>

          <p>
            To go to other pages, click the three lines (☰) at the top right corner of the screen.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function FacultyDashboardGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

const pages = [
  [
    <>
      The <b>progress bar</b> at the top shows how many offices you have completed out of the total number of offices required
    </>,
    
    <>
      Each <b>card</b> represents an office you need to submit your clearance requirements to
    </>,

    <>
      A <b>locked card</b> means that office has not yet created a requirement. You cannot submit anything yet — please wait
    </>,

    <>
     An <b>unlocked card</b> has a status badge showing either <b>Approved</b> or <b>Pending</b>
    </>,

    <>
      <b>Approved</b> means you have been cleared by that office
    </>,

    <>
      <b>Pending</b> means you have not yet submitted your requirements to that office
    </>,    
  ],
  [
    <>
      To submit your requirements, click on an <b>unlocked</b> card to open it
    </>,
    
    <>
      Inside the card you will see a <b>list of requirements</b> with checkboxes
    </>,

    <>
      Click the checkbox next to a requirement to select it — a text box will appear for you to enter your remarks
    </>,

    <>
      You must <b>enter your remarks</b> in the text box as it is required before submitting
    </>,

    <>
      Once you click <b>Submit</b>, your requirements cannot be edited or resubmitted — please review carefully before submitting
    </>,

    <>
      After submitting, you must <b>wait for the approver</b> to review your requirements
    </>,    
  ],  
  [
    <>
      If the approver approves your submission, the card badge will change to <b>Approved</b>
    </>,
    
    <>
      If the approver <b>rejects</b> your submission, you can see the rejection in your clearance status
    </>,

    <>
      If you are <b>rejected</b>, the card will become unlocked again so you can resubmit your requirements
    </>,

    <>
      Make sure all offices show <b>Approved</b> to complete your clearance
    </>,
    <><b>System Guidelines</b> contains important instructions and information about how to use this system.</>,
    <>To go to other pages, click the three lines (☰) at the top right corner of the screen.</>,
  ],   
];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is your dashboard. Here you can see your name, school year, semester, college, department and clearance status.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApproverDashboardGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is your dashboard. Here you can see your name, school year, and semester.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li><b>Pending Clearances</b> shows the number of clearance requests that have not yet been reviewed, approved, or rejected.</li>
              <li><b>Clearance Requests</b> shows the total number of clearance requests submitted in the system.</li>
              <li>The <b>Requirements</b> card displays all the requirements you have created for the clearance process.</li>
              <li>To add a new requirement, click the <b>+ button</b> on the Requirements card.</li> 
              <li><b>Announcements</b> contains updates and notices posted by the administrator.</li>                             
            </ul>
          </div>

          <p>
            To go to other pages, click the three lines (☰) at the top right corner of the screen.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssistantDashboardGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is your dashboard. Here you can see your name, school year, and semester.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li><b>Pending Clearances</b> shows the number of clearance requests that have not yet been reviewed, approved, or rejected.</li>
              <li><b>Clearance Requests</b> shows the total number of clearance requests submitted in the system.</li>
              <li>The <b>Requirements</b> card displays all the requirements you have created for the clearance process.</li>
              <li>To view requirements, click the <b>left arrow button</b> on the Requirements card.</li> 
              <li><b>Announcements</b> contains updates and notices posted by the administrator.</li>                             
            </ul>
          </div>

          <p>
            To go to other pages, click the three lines (☰) at the top right corner of the screen.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function GuidelinesGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the System Guidelines page. Here you can read, create, edit, and delete guidelines for the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>To add a new guideline, click the <b> "+" button</b> on the dark blue bar at the top</li>
              <li>A <b>green toggle</b> means the guideline is active and has an Edit button</li>
              <li>A <b>grey toggle</b> means the guideline is inactive and has a Delete button instead</li>              
              <li>To edit a guideline, click the <b>Edit button</b> below the guideline</li>
              <li>To delete a guideline, click the <b>Delete button</b> below the guideline</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Dashboard text link</b></li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AnnouncementGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the Annoucement page. Here you can read, create, edit, and delete annoucements for the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>To add a new annoucement, click the <b> "+"" button</b> on the dark blue bar at the top</li>
              <li>A <b>green toggle</b> means the annoucement is active and has an Edit button</li>
              <li>A <b>grey toggle</b> means the annoucement is inactive and has a Delete button instead</li>              
              <li>To edit an annoucement, click the <b>Edit button</b> below the annoucement</li>
              <li>To delete a guideline, click the <b>Delete button</b> below the annoucement</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Dashboard text link</b></li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function TimelineGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the Set Clearance Timeline page. Here you can view and manage the clearance timeline for each semester.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>This page shows three semesters — <b>First Semester</b>, <b>Second Semester</b>, and <b>Intersession</b></li>
              <li>A <b>green toggle</b>  means the timeline is currently active. Only one timeline can be active at a time</li>
              <li>A <b>grey toggle</b> means the timeline is inactive</li>              
              <li>The <b>Edit button</b> is locked on the active timeline. You cannot edit it while it is active</li>
              <li>To save and store a completed timeline, click the <b>File Timeline</b> button</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Tools text link</b></li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfigurationGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the College & Office Configuration page. Here you can manage the list of colleges, departments, offices, and their approver flow.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Read the <b>Important Notes</b> box on the left before making any changes</li>
              <li>Use the <b>Choose a Semester</b> dropdown to select which clearance timeline you are configuring</li>
              <li>To add a new college, department, or office, click the <b>"+" button</b> on their respective dark blue bar</li>              
              <li>To edit an entry, click the <b>pencil icon</b> next to the item</li>
              <li>To delete an entry, click the <b>red trash icon</b> next to the item</li>
              <li>Use the <b>Filter by College</b> dropdown in the College Departments panel to view departments by college</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Tools text link</b></li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ManageUserGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the Manage System Users page. Here you can view, add, edit, and remove admin and approver accounts in the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">     
              <li>To add a new admin, click the <b>+ Add Admin</b> button at the top right of the Administrative Roles section</li>
              <li>To add a new approver, click the <b>+ Add Approver</b> button at the top right of the Approver Roles section</li>
              <li>To edit a user, click the <b>Edit</b> button next to their name</li>              
              <li>To remove a user, click the <b>red Remove</b> button next to their name</li>
              <li>When removing a user, you will be asked to enter your <b>XU email address</b> to confirm the action</li>
              <li>You cannot remove your own account</li>
              <li>Use the <b>Search bar</b> to find a user by name, ID, or email</li>
              <li>Use the <b>Sort by</b> and <b>filter dropdowns</b> to organize the list</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Tools text link</b></li>       
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ImportHistoryGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the View Faculty Import History page. Here you can view all faculty import records uploaded to the system. Each import entry from the data dump is stored here and can be downloaded when needed.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>All posted faculty imports from the data dump are displayed as cards in this page</li>
              <li>Each card contains details about the imported file and upload information</li>
              <li>Click the <b>Download button</b> on a card to download the import file</li>              
              <li>Use the <b>Search bar</b> to quickly find a specific import record</li>
              <li>Use the <b>Sort by</b> and <b>filter dropdowns</b> to organize the import list</li>
              <li>Recently uploaded imports appear first by default</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Tools text link</b></li>           
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function SystemAnalyticsGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      Use the <b>School Year</b>, <b>Term</b>, and <b>All Colleges</b> dropdowns at the top to filter the analytics you want to view
    </>,
    
    <>
      To download the analytics, click the <b>Export Analytics</b> button
    </>,

    <>
      A yellow banner means the clearance deadline is approaching and the timeline is currently active
    </>,

    <>
      A red banner means the clearance timeline is no longer active
    </>,

    <>
      The summary cards at the top show the total number of <b>Complete</b>, <b>Incomplete</b>, and <b>Unprocessed</b> clearances
    </>,
  ],
    [
    <>
      Recently uploaded imports appear first by default
    </>,
    
    <>
      The <b>Distribution</b> chart shows the breakdown of faculty clearance status
    </>,

    <>
      The <b>Faculty Composition</b> chart shows the ratio of full-time and part-time faculty
    </>,

    <>
      The <b>Office Clearance Bottlenecks</b> section shows which offices have the most pending clearances
    </>,

    <>
      The <b>College Clearance Progress</b> section shows the completion rate per college
    </>,
  ],
    [
    <>
      To view all faculty under a college, click the <b>View All Faculty →</b> button
    </>,
    
    <>
      To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Tools text link</b>
    </>,
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the System Analytics page. Here you can view the clearance completion status of all faculty members for each school year and semester.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function SystemActivityLogsGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the Check Activity Logs page. Here you can view a complete record of all actions performed by every user in the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Logs are organized by year and date, with the most recent activities appearing first</li>
              <li>Each log entry shows the action performed, the name of the user who did it, and the time it happened</li>
              <li>Use the Search by title bar to find a specific activity log</li>              
              <li>As a system admin, you can see the actions of all users in the system, not just your own</li>
              <li>This page is view only. No changes can be made here</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Tools text link</b></li>           
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationsGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the Notifications page. Here you can view all notifications sent to you based on your assigned role.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>A <b>red dot</b> on a notification means it has not been read yet</li>
              <li>Click on a notification to <b>mark it as read</b> and the red dot will disappear</li>
              <li>To mark all notifications as read at once, click the <b>Mark as Read button</b> at the top right</li>              
              <li>Use the <b>All Roles dropdown</b> to filter notifications by a specific role</li>
              <li>The <b>Mark as Read button</b> also works with the filter — it will only mark the currently visible notifications as read</li>              
              <li>The <b>three lines (☰)</b> at the top right of the screen shows a number indicating how many unread notifications you have</li>
              <li>The <b>notification bell</b> in the navigation bar also shows the count of your unread notifications</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Tools text link</b></li>                         
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsActivityLogsGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the Check Activity Logs page. Here you can view a complete record of all actions performed by every user in the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Logs are organized by year and date, with the most recent activities appearing first</li>
              <li>Each log entry shows the action performed, the name of the user who did it, and the time it happened</li>
              <li>Use the Search by title bar to find a specific activity log</li>              
              <li>As a analytics admin, you can see the actions of analytic admin users in the system, not just your own</li>
              <li>This page is view only. No changes can be made here</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Tools text link</b></li>           
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApproverActivityLogsGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is the Check Activity Logs page. Here you can view a complete record of all actions performed by every user in the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Logs are organized by year and date, with the most recent activities appearing first</li>
              <li>Each log entry shows the action performed, the name of the user who did it, and the time it happened</li>
              <li>Use the Search by title bar to find a specific activity log</li>              
              <li>As an approver, you can see your actions and the assistants under you </li>
              <li>This page is view only. No changes can be made here</li>
              <li>To go back to the dashboard, click the <b>Back button</b> at the top right or the <b>Tools text link</b></li>           
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function RequestGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      Use the <b>Search bar</b> to find clearance requests by faculty name, employee ID, or email address. 
    </>,
    
    <>
      Use the filter dropdowns to easily sort and organize clearance requests
    </>,

    <>
      A yellow banner means the clearance deadline is approaching and the timeline is currently active
    </>,

    <>
      The table displays all clearance requests, including the faculty name, request ID, employee ID, college, department, requirement, and current status
    </>,
  ],
    [
    <>
      Each clearance request has a color-coded status to make it easier to understand: green means the request has been <b>approved,</b> yellow means it is still <b>pending review,</b> and red means the request has been <b>rejected</b>
    </>,

    <>
      To review multiple requests at once, click the checkbox beside each request. The <b>Approve</b> and <b>Reject</b> action buttons will then appear. 
    </>,

    <>
      To reject selected requests, click the red <b>Reject</b> button with the <b>X</b> icon. 
    </>,

    <>
      To approve selected requests, click the green <b>Approve</b> button with the <b>checkmark</b> icon. 
    </>,

    <>
      Use the <b>Select All checkbox</b> to perform bulk approval or rejection for multiple clearance requests. 
    </>,   
  ],
    [
    <>
      To view the complete details of an individual clearance request, click the faculty member’s name in the table.
    </>,
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            The Clearance Request page allows offices to view, review, approve, or reject faculty clearance requests submitted through the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApproverRequestGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      This page displays important faculty information, including the Request Number, School ID, Full Name, College, Department, Faculty Type, and School Email.
    </>,
    
    <>
      Approvers can also view the submission notes provided by the faculty member, along with the requirement associated with the clearance request.
    </>,

    <>
      To approve a clearance request, select the <b>Approve radio button</b>, enter your remarks, then click the <b>Save button</b>.
    </>,

    <>
      To reject a clearance request, select the <b>Reject radio button</b>, enter your remarks, then click the <b>Save button</b>.
    </>,
  ],
    [
    <>
      Approvers may also override previously approved or rejected clearance requests by clicking the <b>Override button</b>.
    </>,
    
    <>
      Each clearance request has a color-coded status to make it easier to understand: green means the request has been <b>approved,</b> yellow means it is still <b>pending review,</b> and red means the request has been <b>rejected</b>
    </>,

    <>
      After clicking <b>Override</b>, select either the <b>Approve</b> or <b>Reject</b> option, enter your updated remarks, then click the <b>Update button</b>. 
    </>,

    <>
      The <b>Override</b> button is disabled when the current clearance request status is still <b>Pending</b>, since only <b>approved</b> or <b>rejected</b> requests can be overridden.
    </>,

    <>
      To go back to the clearance request list, click the <b>Back button</b>
    </>,
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            The Individual Clearance Request page allows offices to view and manage a specific faculty clearance request submitted through the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssistantApproverRequestGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      This page displays important faculty information, including the Request Number, School ID, Full Name, College, Department, Faculty Type, and School Email.
    </>,
    
    <>
      Assistant approvers can also view the submission notes provided by the faculty member, along with the requirement associated with the clearance request.
    </>,

    <>
      To approve a clearance request, select the <b>Approve radio button</b>, enter your remarks, then click the <b>Save button</b>.
    </>,

    <>
      To reject a clearance request, select the <b>Reject radio button</b>, enter your remarks, then click the <b>Save button</b>.
    </>,
  ],
  [
    <>
      To go back to the clearance request list, click the <b>Back button</b>
    </>,
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            The Individual Clearance Request page allows offices to view and manage a specific faculty clearance request submitted through the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssistantListGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      Users in this list are classified as either <b>Assistants</b> or <b>Approvers</b>
    </>,
    
    <>
      <b>Assistants</b> are student assistants who use student XU email accounts
    </>,

    <>
      <b>Approvers</b> are faculty assistants who use faculty XU email accounts 
    </>,

    <>
      Use the <b>Search bar</b> to find assistants or approvers by name, ID number, or email address
    </>,
  ],
    [
    <>
      To create a new assistant account, click the <b>+ Add Assistant button</b>
    </>,
    
    <>
      To create a new approver account, click the <b>+ Add Approver button</b>
    </>,

    <>
      The list displays each user’s active status, college, department, office, and email address
    </>,

    <>
      To update account information, click the <b>Edit button</b> beside the selected user
    </>,

    <>
      To remove an assistant or approver account, click the <b>Delete button</b>
    </>,
  ],
      [
    <>
      When deleting an account, the system will open a confirmation dialog where the approver must enter their XU Email address to confirm the deletion action
    </>,
    
    <>
      To go back to the action page, click the <b>Back button</b> or click <b>Action text link</b>
    </>,
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            The Approver Assistants page allows offices to manage both assistants and approvers assigned within the system. 
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApproverRequirementGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      Each requirement contains important information such as the Requirement Name, Recipients, Description, Last Updated date, Created By, and assigned Clearance Timeline
    </>,
    
    <>
      Requirements can only be created when there is an active clearance timeline and when the office is included in the approver flow record
    </>,

    <>
      To create a new requirement, click the blue <b>+ Add Requirement button</b> 
    </>,

    <>
      To modify an existing requirement, click the <b>Edit button</b> with the pen icon
    </>,
  ],
    [
    <>
      To remove a requirement, click the <b>Delete button</b> with the trash icon
    </>,
    
    <>
      Before saving changes, users must select all three confirmation checkboxes and click the <b>I Agree and Understand button</b> to continue
    </>,
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            The Requirement List page displays all clearance requirements created within the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ArchivedGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            The View Clearance Records page displays all filed clearance records organized according to their assigned clearance timeline.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Important Notes
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Each clearance record contains important information such as the Academic Year, Semester, Clearance Period, Last Updated date, and Archived status</li>
              <li>Each clearance record contains important information such as the Academic Year, Semester, Clearance Period, Last Updated date, and Archived status.</li>
              <li>Use the <b>Search bar</b> to quickly find clearance records by faculty name, employee ID, or email address.</li>
              <li>Use the School Year, Term, and Semester filters to easily organize and locate specific clearance records.</li>
              <li>To view a clearance record in more detailed information, click the corresponding clearance card.</li>
              <li>To return to the previous page, click the <b>Back button</b>located at the top right corner of the page.</li>              
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function FacultyIndividualArchiveGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

const pages = [
  [
    <>
      The <b>progress bar</b> at the top shows how many offices you have completed out of the total number of offices required
    </>,
    
    <>
      Each <b>card</b> represents an office you need to submit your clearance requirements to with a badge showing either <b>Approved</b>, <b>Rejected</b> or <b>Pending</b>
    </>,

    <>
      <b>Approved</b> means you have been cleared by that office
    </>,

    <>
      <b>Pending</b> means you have not yet submitted your requirements to that office
    </>,    

    <>
      To submit your requirements, click on an card to open it. Inside the card you will see a <b>list of requirements</b> with checkboxes
    </>,
  ],
  [
    <>
      Click the checkbox next to a requirement to select it — a text box will appear for you to enter your remarks
    </>,

    <>
      You must <b>enter your remarks</b> in the text box as it is required before submitting
    </>,

    <>
      Once you click <b>Submit</b>, your requirements cannot be edited or resubmitted — please review carefully before submitting
    </>,

    <>
      After submitting, you must <b>wait for the approver</b> to review your requirements
    </>,    
  ],  
  [
    <>
      If the approver approves your submission, the card badge will change to <b>Approved</b>
    </>,
    
    <>
      If the approver <b>rejects</b> your submission, you can see the rejection in your clearance status
    </>,

    <>
      If you are <b>rejected</b>, the card will become unlocked again so you can resubmit your requirements
    </>,

    <>
      Make sure all offices show <b>Approved</b> to complete your clearance
    </>,
  
  ],   
];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            The Archived Clearance Records page for the selected clearance timeline. Here you can view your name, school year, semester, college, department, and overall clearance status, as well as the clearance status of each office and the requirements associated with your clearance record.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssistantRequirementGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            The Requirement List page displays all clearance requirements created within the system.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Important Notes
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Each requirement contains important information such as the Requirement Name, Recipients, Description, Last Updated date, Created By, and assigned Clearance Timeline</li>           
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssistantArchivedRequestGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      Use the <b>Search bar</b> to find clearance requests by faculty name, employee ID, or email address. 
    </>,
    
    <>
      Use the filter dropdowns to easily sort and organize clearance requests
    </>,

    <>
      A yellow banner means the clearance deadline is approaching and the timeline is currently active
    </>,

    <>
      The table displays all clearance requests, including the faculty name, request ID, employee ID, college, department, requirement, and current status
    </>,
  ],
    [
    <>
      Each clearance request has a color-coded status to make it easier to understand: green means the request has been <b>approved,</b> yellow means it is still <b>pending review,</b> and red means the request has been <b>rejected</b>
    </>,

    <>
      To view the complete details of an individual clearance request, click the faculty member’s name in the table.
    </>,
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is your Archived Clearance Request page allows offices to view, and review faculty clearance requests submitted for the selected clearance timeline.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApproverArchivedRequestGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      Use the <b>Search bar</b> to find clearance requests by faculty name, employee ID, or email address. 
    </>,
    
    <>
      Use the filter dropdowns to easily sort and organize clearance requests
    </>,

    <>
      To download a copy of the currently selected filed clearance timeline, <b>click the Export Current View button</b>
    </>,

    <>
      The table displays all clearance requests, including the faculty name, request ID, employee ID, college, department, requirement, and current status
    </>,
  ],
    [
    <>
      Each clearance request has a color-coded status to make it easier to understand: green means the request has been <b>approved,</b> yellow means it is still <b>pending review,</b> and red means the request has been <b>rejected</b>
    </>,

    <>
      To view the complete details of an individual clearance request, click the faculty member’s name in the table.
    </>,
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This is your Archived Clearance Request page allows offices to view, and review faculty clearance requests submitted for the selected clearance timeline.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApproverArchivedFacultyRequestGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      The <b>card on the left</b> shows the faculty member's personal information — School ID, Full Name, College, Department, and School Email
    </>,
    
    <>
      Each row in the table shows a <b>requirement</b> with its title, description, submission notes, and current status
    </>,

    <>
      A <b>Pending</b> status means the faculty member has submitted but is waiting for your response
    </>,

    <>
      To approve a requirement, enter your remarks in the text box and click the green <b>Approve button</b> 
    </>,
  ],
    [
    <>
      Your <b>remarks are required</b> before you can approve or reject
    </>,

    <>
      If a requirement is already <b>Approved</b> or <b>Rejected</b>, you can still <b>override</b> your decision
    </>,

    <>
      To override, click either the <b>Approve</b> or <b>Reject</b> button — you will be asked to enter your <b>XU email address</b> to confirm
    </>,

    <>
      Use the <b>Sort by</b> and <b>Status</b> dropdowns to filter the requirements
    </>,    
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This page shows the clearance requirements submitted by a faculty member for the selected clearance timeline. Here you can review, approve, or reject each requirement.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssistantArchivedFacultyRequestGuideCard({
  open,
  onClose,
  title = "Quick Guide",
}: GuideCardProps) {

  const [page, setPage] = useState<number>(1);

 const pages = [
  [
    <>
      The <b>card on the left</b> shows the faculty member's personal information — School ID, Full Name, College, Department, and School Email
    </>,
    
    <>
      Each row in the table shows a <b>requirement</b> with its title, description, submission notes, and current status
    </>,

    <>
      A <b>Pending</b> status means the faculty member has submitted but is waiting for your response
    </>,

    <>
      To approve a requirement, enter your remarks in the text box and click the green <b>Approve button</b> 
    </>,
  ],
    [
    <>
      Your <b>remarks are required</b> before you can approve or reject
    </>,

    <>
      Use the <b>Sort by</b> and <b>Status</b> dropdowns to filter the requirements
    </>,    
  ],
  ];

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      
      {/* Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--gray-border))] px-6 py-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />

            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 text-sm text-gray-700">
          <p>
            This page shows the clearance requirements submitted by a faculty member for the selected clearance timeline. Here you can review, approve, or reject each requirement.
          </p>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>Important Notes</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800 min-h-[160px]">
              {pages[page - 1].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setPage((prev: number) => Math.max(prev - 1, 1))
                }
                disabled={page === 1}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-blue-900">
                Page {page} of {pages.length}
              </span>

              <button
                onClick={() =>
                  setPage((prev: number) =>
                    Math.min(prev + 1, pages.length)
                  )
                }
                disabled={page === pages.length}
                className="rounded-md border border-primary text-primary px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[hsl(var(--gray-border))] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
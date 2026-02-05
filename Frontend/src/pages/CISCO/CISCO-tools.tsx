import "../../index.css";
import { CISCOHeader } from "../../stories/components/header";
import { ActionNavCard } from "../../stories/components/cards";
import { Eye, Users } from "lucide-react";

export default function CISCOTools() {
  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      {/* HEADER */}
      <div className="header mb-3">
        <CISCOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">

        <div className="mt-0 grid gap-4">

          <ActionNavCard
            icon={
                <img
                  src="/PrimaryUploadIcon.png"
                  alt="activity logs icon"
                  className="h-9 w-9"
                />
            }
            title="Faculty Data Dump"
            description="Check current system user dump"
            to="/faculty-data-dump"
          />


          <ActionNavCard
            icon={
                <img
                  src="/PrimaryPersonIcon.png"
                  alt="activity logs icon"
                  className="h-9 w-9"
                />
            }
            title="Manage System Users"
            description="View and set the system approvers"
            to="/manage-system-user"
          />

          <ActionNavCard
            icon={<Eye className="h-9 w-9" />}
            title="Check Activity Logs"
            description="Check the previous actions"
            to="/activity-logs"
          />
        </div>
      </main>
    </div>
  );
}

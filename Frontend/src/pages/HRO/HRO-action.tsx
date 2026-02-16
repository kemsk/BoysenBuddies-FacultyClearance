import "../../index.css";
import { HROHeader } from "../../stories/components/header";
import { ActionNavCard } from "../../stories/components/cards";
import { Eye, Users } from "lucide-react";

export default function HROAction() {
  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      {/* HEADER */}
      <div className="header mb-3">
        <HROHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">

        <div className="mt-0 grid gap-4">
          <ActionNavCard
            icon={<Users className="h-9 w-9" />}
            title="View Student Assistants"
            description="Check the list of Student Assistants\nin your department"
            to="/HRO-assistant-list"
          />

          <ActionNavCard
            icon={
            <img
              src="/PrimaryArchiveIcon.png"
              alt="activity logs icon"
              className="h-9 w-9"
            />
          }
            title="Export & Archive Clearance"
            description="Export and archive clearance"
            to="/HRO-export-archive-clearance"
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

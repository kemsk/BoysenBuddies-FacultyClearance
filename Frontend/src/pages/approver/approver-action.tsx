import "../../index.css";
import { DynamicApproverHeader } from "../../stories/components/header";
import { ActionNavCard } from "../../stories/components/cards";
import { Eye, Users } from "lucide-react";

export default function Action() {
  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      {/* HEADER */}
      <div className="header mb-3">
        <DynamicApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-4 md:px-6 lg:px-[1in] pt-4 pb-4 w-full">

        <div className="mt-0 grid gap-4">
          <ActionNavCard
            icon={<Users className="h-7 w-7" />}
            title="View Student Assistants"
            description="Check the list of Student Assistants in your department"
            to="/approver-assistant-list"
          />

          <ActionNavCard
            icon={
                <img
                  src="/PrimaryArchiveIcon.png"
                  alt="activity logs icon"
                  className="h-9 w-9"
                />
            }
            title="View Clearance Records"
            description="Check clearance requests from the previous terms"
            to="/approver-archived-clearance"
          />

          <ActionNavCard
            icon={<Eye className="h-7 w-7" />}
            title="Check Activity Logs"
            description="Check the previous actions"
            to="/approver-activity-logs"
          />
        </div>
      </main>
    </div>
  );
}

import "../../index.css";
import { OVPHEHeader } from "../../stories/components/header";
import { ActionNavCard } from "../../stories/components/cards";
import { Eye, Users } from "lucide-react";

export default function OVPHETools() {
  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      {/* HEADER */}
      <div className="header mb-3">
        <OVPHEHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">

        <div className="mt-0 grid gap-4">
          <ActionNavCard
            icon={
                <img
                  src="/PrimaryCalendarIcon.png"
                  alt="activity logs icon"
                  className="h-9 w-9"
                />
            }
            title="Clearance Timeline"
            description="View and set the clearance timeline"
            to="/OVPHE-clearance-timeline"
          />

          <ActionNavCard
            icon={
                <img
                  src="/PrimarySliderIcon.png"
                  alt="activity logs icon"
                  className="h-9 w-9"
                />
            }
            title="College & Office Configuration"
            description="View and set the clearance timeline"
            to="/OVPHE-college-office-configuration"
          />


          <ActionNavCard
            icon={
                <img
                  src="/PrimaryBarChartIcon.png"
                  alt="activity logs icon"
                  className="h-9 w-9"
                />
            }
            title="System Analytics"
            description="Check the completion rate per college"
            to="/OVPHE-system-analytics"
          />

          <ActionNavCard
            icon={<Eye className="h-9 w-9" />}
            title="Check Activity Logs"
            description="Check the previous actions"
            to="/OVPHE-activity-logs"
          />
        </div>
      </main>
    </div>
  );
}

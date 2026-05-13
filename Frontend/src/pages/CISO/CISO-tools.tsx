import "../../index.css";
import { CISOHeader } from "../../stories/components/header";
import { ActionNavCard } from "../../stories/components/cards";
import { Eye, ShieldCheck  } from "lucide-react";

export default function CISOTools() {
  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      {/* HEADER */}
      <div className="header mb-3">
        <CISOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-4 md:px-6 lg:px-[1in] pt-4 pb-4 w-full">

        <div className="mt-0 grid gap-4">

          <ActionNavCard
            icon={
                <img
                  src="/PrimaryCalendarIcon.png"
                  alt="activity logs icon"
                  className="h-9 w-9"
                />
            }
            title="Set Clearance Timeline"
            description="Set system’s Clearance Timeline"
            to="/system-admin-clearance-timeline"
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
            description="Configure Colleges & Offices"
            to="/System-admin-college-office-configuration"
          />

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
            to="/System-admin-faculty-data-dump"
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
            to="/System-admin-manage-system-user"
          />

          <ActionNavCard
            icon={
                <img
                  src="/PrimaryFolderIcon.png"
                  alt="activity logs icon"
                  className="h-9 w-9"
                />
            }
            title="View Faculty Import History"
            description="Access previously uploaded .csv files"
            to="/system-admin-archived-faculty"
          />

          <ActionNavCard
            icon={<ShieldCheck  className="h-9 w-9" />}
            title="Access Control"
            description="Review system users access control & permissions"
            to="/system-admin-access-control"
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
            to="/system-admin-system-analytics"
          />          

          <ActionNavCard
            icon={<Eye className="h-9 w-9" />}
            title="Check Activity Logs"
            description="Check the previous actions"
            to="/aystem-admin-activity-logs"
          />
        </div>
      </main>
    </div>
  );
}

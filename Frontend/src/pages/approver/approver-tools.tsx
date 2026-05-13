import "../../index.css";
import { DynamicApproverHeader } from "../../stories/components/header";
import { ActionNavCard } from "../../stories/components/cards";
export default function ApproverTools() {

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
            icon={
                <img
                  src="/PrimaryBarChartIcon.png"
                  alt="system analytics icon"
                  className="h-9 w-9"
                />
            }
            title="System Analytics"
            description="Check the completion rate per college"
            to="/system-analytics"
          />
        </div>
      </main>
    </div>
  );
}

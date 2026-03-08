import "../../index.css";
import { DualRoleHeader } from "../../stories/components/header";
import { ActionNavCard } from "../../stories/components/cards";
import { Eye, Users } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "../../stories/components/button";

export default function DualRoleAction() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      {/* HEADER */}
      <div className="header mb-3">
        <DualRoleHeader />
      </div>


      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">

                <h1 className="text-2xl text-left text-primary font-bold">Actions</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dual-role-approver-dashboard">Approver Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Requirement List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-4 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/dual-role-approver-dashboard")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>

        <div className="mt-0 grid gap-4">
          <ActionNavCard
            icon={<Users className="h-7 w-7" />}
            title="View Student Assistants"
            description="Check the list of Student Assistants in your department"
            to="/dual-role-student-assistant-list"
          />

          <ActionNavCard
            icon={<Eye className="h-7 w-7" />}
            title="Check Activity Logs"
            description="Check the previous actions"
            to="/dual-role-activity-logs"
          />
        </div>
      </main>
    </div>
  );
}

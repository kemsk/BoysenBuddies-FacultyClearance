import * as React from "react";

import "../../index.css";
import { FacultyHeader } from "../../stories/components/header";

import {
  ApprovedCard,
  ClearanceProgressCard,
  ClearanceStatusCard,
  ExpandableClearanceStepCard,
  WelcomeAcademicCard,
} from "../../stories/components/cards";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Button } from "../../stories/components/button";
import { Link, useNavigate } from "react-router-dom";

export default function FacultyViewClearance() {
  const navigate = useNavigate();
  const [expandedStepIndex, setExpandedStepIndex] = React.useState<number | null>(1);
  const timelineId = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("timelineId") || "";
  }, []);

  const [detail, setDetail] = React.useState<null | {
    timeline?: {
      id: string;
      name: string;
      academicYear: string;
      semester: string;
      archivedDate: string | null;
    };
    clearance: {
      status: string;
      approvedCount: number;
      totalCount: number;
      missingApproval?: string;
    };
    faculty?: {
      college: string;
      department: string;
      facultyType: string;
    };
    requests: Array<{
      id: number | string;
      title: string;
      description: string;
      status: string;
      approvedBy?: string | null;
      approvedDate?: string | null;
      submittedDate?: string | null;
      remarks?: string | null;
      isApproverStep?: boolean;
      parentId?: string;
    }>;
  }>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (timelineId) {
      params.set("timelineId", timelineId);
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    setLoading(true);
    fetch(`/admin/xu-faculty-clearance/api/faculty/view-clearance${suffix}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setDetail(data))
      .catch(() => {
        setDetail(null);
      })
      .finally(() => setLoading(false));
  }, [timelineId]);

  const clearanceCurrent = detail?.clearance.approvedCount ?? 0;
  const clearanceTotal = detail?.clearance.totalCount ?? 0;
  const clearancePercent =
    clearanceTotal > 0 ? Math.round((clearanceCurrent / clearanceTotal) * 100) : 0;
  const isClearanceApproved = clearancePercent >= 100;

  const stepsToRender = React.useMemo(() => {
    const requests = detail?.requests ?? [];
    
    // Separate approver steps and requirements
    const approverSteps = requests.filter(req => req.isApproverStep);
    const requirements = requests.filter(req => !req.isApproverStep);
    
    // Build the hierarchical structure
    return approverSteps.map((step, index) => {
      const normalizedStatus = (step.status || "").toUpperCase();
      const isApproved = normalizedStatus === "APPROVED";
      const isPending = normalizedStatus === "PENDING";
      
      // Find child requirements for this approver step
      const childRequirements = requirements.filter(req => req.parentId === step.id);
      
      return {
        index: index + 1,
        title: step.title,
        statusLabel: normalizedStatus || "PENDING",
        statusVariant: isApproved ? "success" as const : isPending ? "warning" as const : "muted" as const,
        collapsedType: "status" as const,
        submittedTo: step.approvedBy || "",
        submittedOn: step.approvedDate || step.submittedDate || "",
        requirements: childRequirements.map(child => {
          const childStatus = (child.status || "").toUpperCase();
          const childIsApproved = childStatus === "APPROVED";
          return {
            title: child.title,
            description: child.description || child.remarks || "",
            completed: childIsApproved,
          };
        }),
      };
    }).concat(
      // Add standalone requirements (those without a parent approver step)
      requirements.filter(req => !req.parentId).map((req, index) => {
        const normalizedStatus = (req.status || "").toUpperCase();
        const isApproved = normalizedStatus === "APPROVED";
        const isPending = normalizedStatus === "PENDING";
        return {
          index: approverSteps.length + index + 1,
          title: req.title,
          statusLabel: normalizedStatus || "PENDING",
          statusVariant: isApproved ? "success" as const : isPending ? "warning" as const : "muted" as const,
          collapsedType: "status" as const,
          submittedTo: req.approvedBy || "",
          submittedOn: req.approvedDate || req.submittedDate || "",
          requirements: [
            {
              title: req.title,
              description: req.description || req.remarks || "",
              completed: isApproved,
            },
          ],
        };
      })
    );
  }, [detail]);

  const [meProfile, setMeProfile] = React.useState<{
    email: string;
    university_id: string;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    role_value: number | null;
  } | null>(null);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => setMeProfile(data))
      .catch(() => setMeProfile(null));
  }, []);

  const displayName = React.useMemo(() => {
    if (!meProfile) return "";
    const parts = [meProfile.first_name, meProfile.middle_name, meProfile.last_name]
      .map((p) => (p ?? "").trim())
      .filter(Boolean);
    return parts.length ? parts.join(" ") : meProfile.email;
  }, [meProfile]);

  const collegeLabel = detail?.faculty?.college || "";
  const departmentLabel = detail?.faculty?.department || "";
  const facultyTypeLabel = detail?.faculty?.facultyType || "";
  const statusLabel = detail?.clearance.status ?? "";
  const timeline = detail?.timeline ?? null;

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <FacultyHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3 w-full lg:max-w-4xl lg:mx-auto lg:p-8">

        <h1 className="text-2xl text-left text-primary font-bold">{timeline?.name || "Faculty Clearance"}</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/faculty-archive-clearance">View Clearance Records</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>{timeline?.name || "Faculty Clearance"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/faculty-archive-clearance")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>

        <WelcomeAcademicCard
          name={displayName}
          topLeft={{ label: "Academic Year", value: timeline?.academicYear || "" }}
          topRight={{ label: "Semester", value: timeline?.semester || "" }}
          rows={[
            { label: "College", value: collegeLabel },
            { label: "Department", value: departmentLabel },
            { label: "Faculty Type", value: facultyTypeLabel },
          ]}
          afterRows={
            <ClearanceStatusCard
              statusLabel={statusLabel}
              statusVariant={statusLabel === "COMPLETED" ? "success" : "warning"}
              className="mb-6"
            />
          }
        />
        
        <div className="mt-5">
          <ClearanceProgressCard
            value={clearancePercent}
            current={clearanceCurrent}
            total={clearanceTotal}
          />
        </div>

        {loading ? (
          <div className="mt-5 text-sm text-gray-500">Loading...</div>
        ) : stepsToRender.length ? (
          <div className="mt-5 space-y-3">
            {stepsToRender.map((step) => (
              <ExpandableClearanceStepCard
                key={step.index}
                index={step.index}
                title={step.title}
                statusLabel={step.statusLabel}
                statusVariant={step.statusVariant}
                collapsedType={step.collapsedType}
                submittedTo={step.submittedTo}
                submittedOn={step.submittedOn}
                requirements={step.requirements}
                expanded={expandedStepIndex === step.index}
                onToggle={() =>
                  setExpandedStepIndex((prev) => (prev === step.index ? null : step.index))
                }
                timelineId={timelineId}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 text-sm text-gray-500">No archived clearance records found.</div>
        )}
        


        {isClearanceApproved ? (
          <div className="mt-5">
            <ApprovedCard />
          </div>
        ) : null}

      </main>

    </div>
  );
}

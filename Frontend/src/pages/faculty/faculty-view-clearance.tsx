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

  const [profile, setProfile] = React.useState<null | {
    faculty: {
      email: string;
      universityId: string;
      firstName: string;
      middleName: string;
      lastName: string;
      college: string;
      department: string;
      facultyType: string;
    };
    timeline: { academicYear: number | null; term: string | null };
    clearance: { status: string; approvedCount: number; totalCount: number };
    steps?: Array<{
      index: number;
      title: string;
      statusLabel?: string;
      statusVariant?: any;
      collapsedType?: "status" | "dropdownOnly" | "locked";
      submittedTo?: string;
      submittedOn?: string;
      requirements?: Array<{ title: string; description: string; completed?: boolean }>;
    }>;
  }>(null);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/faculty/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setProfile(data))
      .catch(() => {
        setProfile(null);
      });
  }, []);

  const clearanceCurrent = profile?.clearance.approvedCount ?? 1;
  const clearanceTotal = profile?.clearance.totalCount ?? 6;
  const clearancePercent =
    clearanceTotal > 0 ? Math.round((clearanceCurrent / clearanceTotal) * 100) : 0;
  const isClearanceApproved = clearancePercent >= 100;

  const dummySteps = React.useMemo(
    () => [
      {
        index: 1,
        title: "Library",
        statusLabel: "PENDING",
        statusVariant: "warning" as const,
        collapsedType: "status" as const,
        submittedTo: "Library Office",
        submittedOn: "December 1, 2025",
        requirements: [
          {
            title: "Borrowed Books Report",
            description: "Report the status of borrowed books",
            completed: true,
          },
          {
            title: "Return All Books",
            description: "Return all borrowed books to the library",
            completed: false,
          },
        ],
      },
      {
        index: 2,
        title: "Department Chair",
        statusLabel: "LOCKED",
        statusVariant: "muted" as const,
        collapsedType: "locked" as const,
        submittedTo: "Department Office",
        submittedOn: "",
        requirements: [
          {
            title: "Clearance Form",
            description: "Submit clearance form for department approval",
            completed: false,
          },
        ],
      },
    ],
    []
  );

  const stepsToRender = profile?.steps?.length ? profile.steps : dummySteps;

  const [meProfile, setMeProfile] = React.useState<{
    email: string;
    university_id: string;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    role_value: number | null;
  } | null>(null);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/me")
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

  const collegeLabel = profile?.faculty.college ?? "";
  const departmentLabel = profile?.faculty.department ?? "";
  const facultyTypeLabel = profile?.faculty.facultyType ?? "";
  const statusLabel = profile?.clearance.status ?? "";

  const [timeline, setTimeline] = React.useState<{ academicYear: string; semester: string } | null>(null);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/active-clearance-timeline")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setTimeline(data))
      .catch(() => setTimeline(null));
  }, []);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <FacultyHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3">

        <h1 className="text-2xl text-left text-primary font-bold">2501 Faculty Clearance</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/faculty-archive-clearance">View Archived Clearance</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>2501 Faculty Clearance</BreadcrumbPage>
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
              statusVariant="warning"
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

        {stepsToRender.length ? (
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
              />
            ))}
          </div>
        ) : null}
        


        {isClearanceApproved ? (
          <div className="mt-5">
            <ApprovedCard />
          </div>
        ) : null}

      </main>

    </div>
  );
}

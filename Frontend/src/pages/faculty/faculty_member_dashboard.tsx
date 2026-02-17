import React from "react";
import "../../index.css"; 
import { FacultyHeader } from "../../stories/components/header";

import {
  WelcomeAcademicCard,
  ClearanceStatusCard,
  ClearanceProgressCard,
  ExpandableClearanceStepCard,
  ApprovedCard,
} from "../../stories/components/cards";

export default function Facultydashboard() {
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

  const clearanceCurrent = profile?.clearance.approvedCount ?? 0;
  const clearanceTotal = profile?.clearance.totalCount ?? 0;
  const clearancePercent =
    clearanceTotal > 0
      ? Math.round((clearanceCurrent / clearanceTotal) * 100)
      : 0;
  const isClearanceApproved = clearancePercent >= 100;

  const fullName = profile
    ? [
        profile.faculty.firstName,
        profile.faculty.middleName,
        profile.faculty.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() || profile.faculty.email
    : "";

  const academicYearLabel = profile?.timeline.academicYear
    ? `${profile.timeline.academicYear}–${profile.timeline.academicYear + 1}`
    : "";

  const termLabel = profile?.timeline.term ?? "";

  const collegeLabel = profile?.faculty.college ?? "";
  const departmentLabel = profile?.faculty.department ?? "";
  const facultyTypeLabel = profile?.faculty.facultyType ?? "";
  const statusLabel = profile?.clearance.status ?? "";

  const [openStep, setOpenStep] = React.useState<number | null>(null);
  const toggleStep = (index: number) => {
    setOpenStep((prev) => (prev === index ? null : index));
  };

  const steps = profile?.steps ?? [];

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <FacultyHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        <WelcomeAcademicCard
          name={fullName}
          topLeft={{ label: "Academic Year", value: academicYearLabel }}
          topRight={{ label: "Semester", value: termLabel }}
          rows={[
            { label: "College", value: collegeLabel },
            { label: "Department", value: departmentLabel },
            { label: "Faculty Type", value: facultyTypeLabel },
          ]}
          afterRows={
          <ClearanceStatusCard statusLabel={statusLabel}
          statusVariant="warning" className="mb-6
"/>}
        />
        
        <div className="mt-5">
          <ClearanceProgressCard
            value={clearancePercent}
            current={clearanceCurrent}
            total={clearanceTotal}
          />
        </div>

        {isClearanceApproved ? (
          <div className="mt-5">
            <ApprovedCard />
          </div>
        ) : (
          <>
            {steps.map((s, idx) => (
              <div key={`${s.index}-${s.title}-${idx}`} className={idx === 0 ? "mt-5" : "mt-2"}>
                <ExpandableClearanceStepCard
                  index={Number(s.index) || idx + 1}
                  title={s.title}
                  statusLabel={s.statusLabel}
                  statusVariant={s.statusVariant}
                  collapsedType={s.collapsedType}
                  expanded={openStep === (Number(s.index) || idx + 1)}
                  onToggle={() => toggleStep(Number(s.index) || idx + 1)}
                  submittedTo={s.submittedTo}
                  submittedOn={s.submittedOn}
                  requirements={Array.isArray(s.requirements) ? s.requirements : []}
                />
              </div>
            ))}
          </>
        )}

      </main>

    </div>
  );
}



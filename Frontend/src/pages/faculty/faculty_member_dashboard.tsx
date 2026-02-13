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
  }>(null);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/faculty/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setProfile(data))
      .catch(() => {
        // fallback to hardcoded UI values
      });
  }, []);

  const clearanceCurrent = profile?.clearance.approvedCount ?? 1;
  const clearanceTotal = profile?.clearance.totalCount ?? 6;
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
    : "John Doe";

  const academicYearLabel = profile?.timeline.academicYear
    ? `${profile.timeline.academicYear}–${profile.timeline.academicYear + 1}`
    : "2025–2026";

  const termLabel = profile?.timeline.term ?? "1";

  const collegeLabel = profile?.faculty.college || "College of Computer Studies";
  const departmentLabel = profile?.faculty.department || "Information Technology";
  const facultyTypeLabel = profile?.faculty.facultyType || "";
  const statusLabel = profile?.clearance.status ?? "Pending";

  const [openStep, setOpenStep] = React.useState<number | null>(null);
  const toggleStep = (index: number) => {
    setOpenStep((prev) => (prev === index ? null : index));
  };

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
            <div className="mt-5">
              <ExpandableClearanceStepCard
                index={1}
                title="Department Chair"
                statusLabel="PENDING"
                statusVariant="warning"
                expanded={openStep === 1}
                onToggle={() => toggleStep(1)}
                submittedTo="Maria Jimenez"
                submittedOn="11/22/2025, 3:02:21 PM"
                requirements={[
                  {
                    title: "Grades Roster",
                    description: "Submit screenshot via this link:\ngoogleforms.com",
                  },
                  {
                    title: "Laboratory Manual",
                    description:
                      "Physical submission to the Department Office\nOffice Lorem Ipsum Dolore es Amut",
                  },
                ]}
              />
            </div>

            <div className="mt-2">
              <ExpandableClearanceStepCard
                index={2}
                title="College Dean"
                statusLabel="PENDING"
                statusVariant="warning"
                expanded={openStep === 2}
                onToggle={() => toggleStep(2)}
                requirements={[]}
              />
            </div>

            <div className="mt-2">
              <ExpandableClearanceStepCard
                index={3}
                title="University Registrar"
                statusLabel="PENDING"
                statusVariant="warning"
                expanded={openStep === 3}
                onToggle={() => toggleStep(3)}
                requirements={[]}
              />
            </div>

            <div className="mt-2">
              <ExpandableClearanceStepCard
                index={4}
                title="University Library"
                statusLabel="PENDING"
                statusVariant="warning"
                expanded={openStep === 4}
                onToggle={() => toggleStep(4)}
                requirements={[]}
              />
            </div>

            <div className="mt-2">
              <ExpandableClearanceStepCard
                index={5}
                title="OVPHE"
                statusLabel="PENDING"
                statusVariant="warning"
                collapsedType= "dropdownOnly"
                expanded={openStep === 5}
                onToggle={() => toggleStep(5)}
                requirements={[]}
              />
            </div>

            <div className="mt-2">
              <ExpandableClearanceStepCard
                index={6}
                title="Human Resources Office"
                statusLabel="PENDING"
                statusVariant="warning"
                collapsedType=  "locked"
                expanded={openStep === 6}
                onToggle={() => toggleStep(6)}
                requirements={[]}
              />
            </div>
          </>
        )}

      </main>

    </div>
  );
}



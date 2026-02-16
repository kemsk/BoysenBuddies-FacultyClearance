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
  const clearanceCurrent = 1;
  const clearanceTotal = 6;
  const clearancePercent =
    clearanceTotal > 0
      ? Math.round((clearanceCurrent / clearanceTotal) * 100)
      : 0;
  const isClearanceApproved = clearancePercent >= 100;

  const [openStep, setOpenStep] = React.useState<number | null>(null);
  const [profile, setProfile] = React.useState<{
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
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, []);

  const displayName = React.useMemo(() => {
    if (!profile) return "";
    const parts = [profile.first_name, profile.middle_name, profile.last_name]
      .map((p) => (p ?? "").trim())
      .filter(Boolean);
    return parts.length ? parts.join(" ") : profile.email;
  }, [profile]);
  const toggleStep = (index: number) => {
    setOpenStep((prev) => (prev === index ? null : index));
  };

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
      <main className="dashboard p-4">
        <WelcomeAcademicCard
          name={displayName}
          topLeft={{ label: "Academic Year", value: timeline?.academicYear || "" }}
          topRight={{ label: "Semester", value: timeline?.semester || "" }}
          rows={[
            { label: "College", value: "College of Computer Studies" },
            { label: "Department", value: "Information Technology" },
            { label: "Faculty Type", value: "Full-time Faculty (On Probation)" },
          ]}
          afterRows={
          <ClearanceStatusCard statusLabel="Pending" 
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



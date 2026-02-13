import * as React from "react";

import "../../index.css"; 
import { OVPHEHeader } from "../../stories/components/header";

import {
  AnnouncementsCard,
  type AnnouncementItem,
  WelcomeAcademicCard,
  SystemGuidlinesCard,
  type SystemGuidlinesItem,
} from "../../stories/components/cards";

type OVPHEGuidelinesResponse = { items: SystemGuidlinesItem[] };
type OVPHEAnnouncementsResponse = { items: AnnouncementItem[] };

export default function OVPHEDashboard() {
  const [profile, setProfile] = React.useState<{
    email: string;
    university_id: string;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    role: string;
  } | null>(null);

  const [items, setItems] = React.useState<SystemGuidlinesItem[]>([]);
  const [announcementItems, setAnnouncementItems] = React.useState<AnnouncementItem[]>([]);

  const dashboardGuidelines = React.useMemo(() => {
    return items.filter((g) => g.enabled ?? true);
  }, [items]);

  const dashboardAnnouncements = React.useMemo(() => {
    return announcementItems
      .filter((a) => a.enabled ?? true)
      .slice()
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [announcementItems]);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/ovphe/system-guidelines")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: OVPHEGuidelinesResponse) => setItems(data.items ?? []))
      .catch(() => setItems([]));

    fetch("/admin/xu-faculty-clearance/api/ovphe/announcements")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: OVPHEAnnouncementsResponse) => setAnnouncementItems(data.items ?? []))
      .catch(() => setAnnouncementItems([]));

    fetch("/admin/xu-faculty-clearance/api/ovphe-profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
      })
      .catch(() => {
        setProfile(null);
      });
  }, []);

  const displayName = React.useMemo(() => {
    if (!profile) return "";
    const parts = [profile.first_name, profile.middle_name, profile.last_name]
      .map((p) => (p ?? "").trim())
      .filter(Boolean);
    return parts.length ? parts.join(" ") : profile.email;
  }, [profile]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <OVPHEHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3">
        <WelcomeAcademicCard
          name={displayName || "John Doe"}
          topLeft={{ label: "Academic Year", value: "2025–2026" }}
          topRight={{ label: "Semester", value: "1" }}
          rows={[{ label: "System Admin Role", value: profile?.role ?? "" }]}
        />
        

          <SystemGuidlinesCard
            items={dashboardGuidelines}
            headerActionHref="/OVPHE-system-guideline"
            headerActionImgSrc="/_WhiteArrowIcon.png"
            headerActionImgAlt="Open Requirements"
            cardName="System Guidelines"
          />
  


          <AnnouncementsCard 
          items={dashboardAnnouncements} 
          headerActionHref="/OVPHE-announcements"
          headerActionImgSrc="/BlackChevronIcon.png"
          headerActionImgAlt="Open Announcements"
          
          />



      </main>

    </div>
  );
}

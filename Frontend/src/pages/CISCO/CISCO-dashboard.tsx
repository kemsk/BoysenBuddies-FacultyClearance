import * as React from "react";

import "../../index.css"; 
import { CISCOHeader } from "../../stories/components/header";

import {
  AnnouncementsCard,
  type AnnouncementItem,
  WelcomeAcademicCard,
  SystemGuidlinesCard,
  type SystemGuidlinesItem,
} from "../../stories/components/cards";

import { loadSystemGuidelinesItems } from "../../stories/components/edit-system-guidelines-dialog";
import { loadAnnouncementsItems } from "../../stories/components/edit-announcements-dialog";

export default function CISCODashboard() {
  const approverOffice = "OPVHE";

  const [items, setItems] = React.useState<SystemGuidlinesItem[]>([]);
  const [announcementItems, setAnnouncementItems] = React.useState<AnnouncementItem[]>([]);

  const dashboardAnnouncements = React.useMemo(() => {
    return announcementItems
      .filter((a) => a.enabled ?? true)
      .slice()
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [announcementItems]);

  React.useEffect(() => {
    setItems(loadSystemGuidelinesItems());
    setAnnouncementItems(loadAnnouncementsItems());
  }, []);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISCOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3">
        <WelcomeAcademicCard
          name="John Doe"
          topLeft={{ label: "Academic Year", value: "2025–2026" }}
          topRight={{ label: "Semester", value: "1" }}
          rows={[{ label: "System Admin Role", value: approverOffice }]}
        />
        

          <SystemGuidlinesCard
            items={items}
            headerActionHref="/system-guideline"
            headerActionImgSrc="/_WhiteArrowIcon.png"
            headerActionImgAlt="Open Requirements"
            cardName="System Guidelines"
          />
  


          <AnnouncementsCard 
          items={dashboardAnnouncements} 
          headerActionHref="/announcement"
          headerActionImgSrc="/BlackChevronIcon.png"
          headerActionImgAlt="Open Announcements"
          
          />



      </main>

    </div>
  );
}

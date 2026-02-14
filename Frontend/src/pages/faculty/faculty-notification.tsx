import React from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Button } from "../../stories/components/button";
import { FacultyHeader } from "../../stories/components/header";

import {
  NotificationsCard,
  type NotificationItem,
} from "../../stories/components/cards";


export default function Notification() {
  const [readAll, setReadAll] = React.useState(false);

  const fallbackItems: NotificationItem[] = [
    {
      title: "Department Chair",
      status: "approved",
      details: ["Submission of Syllabus", "Submission of Grades"],
      timestamp: "December 3, 2025, 9:30 AM",
    },
    {
      title: "University Registrar",
      status: "rejected",
      details: ["Submission of Grades", "Remarks: incomplete submission"],
      timestamp: "December 1, 2025, 9:30 AM",
    },
  ];

  const [items, setItems] = React.useState<NotificationItem[]>(fallbackItems);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/faculty/notifications")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (data: {
          items: Array<{
            title: string;
            description?: string;
            status?: string;
            details: string[];
            timestamp: string;
            is_read?: boolean;
          }>;
        }) => {
        const mapped = Array.isArray(data.items)
          ? data.items.map((n) => ({
              title: n.title,
              status: n.status as any,
              description: n.description ?? "",
              details: Array.isArray(n.details) ? n.details : [],
              timestamp: n.timestamp,
              is_read: !!n.is_read,
            }))
          : [];
        if (mapped.length) setItems(mapped);
      })
      .catch(() => {
        // keep fallback
      });
  }, []);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <FacultyHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Notifications</h1>
        </div>

        <div className="flex items-center justify-end">
          <Button
            className="h-8 px-3 text-xs"
            type="button"
            onClick={() => setReadAll(true)}
          >
            Mark as Read
          </Button>
        </div>
        <div className="mt-4">
          <NotificationsCard
            items={items}
            showMarkAsReadButton={false}
            readAll={readAll}
            onReadAllChange={setReadAll}
          />
        </div>
      </main>
    </div>
  );
}

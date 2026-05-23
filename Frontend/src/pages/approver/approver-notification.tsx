import React, { useState } from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Button } from "../../stories/components/button";
import { DynamicApproverHeader } from "../../stories/components/header";

import {
  NotificationsCard,
  type NotificationItem,
} from "../../stories/components/cards";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";
import { NotificationsGuideCard } from "../../stories/components/guide-cards";

export default function ApproverNotification() {
  const [readAll, setReadAll] = React.useState(false);
  type NotificationItemWithRole = NotificationItem & { user_role?: string; user_id?: number | null };
  const [openCard, setOpenCard] = useState(false); 
  const [items, setItems] = React.useState<NotificationItemWithRole[]>([]);
  const [selectedRole, setSelectedRole] = React.useState<string>("all");

  const [sessionRoleOptions, setSessionRoleOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    const loadSessionRoles = async () => {
      try {
        const r = await fetch("/admin/xu-faculty-clearance/api/me", { credentials: "include" });
        if (!r.ok) {
          setSessionRoleOptions([]);
          return;
        }
        const data = (await r.json()) as {
          roles?: number[];
          roles_payload?: { role_name?: string }[];
        };

        const roleKeys = new Set<string>();
        const roleNames = (data.roles_payload ?? [])
          .map((x) => String(x.role_name || "").trim())
          .filter(Boolean);

        roleNames.forEach((name) => {
          const lower = name.toLowerCase();
          if (lower === "approver") roleKeys.add("Approver");
          if (lower === "faculty") roleKeys.add("Faculty");
          if (lower === "ciso") roleKeys.add("CISO");
          if (lower === "ovphe") roleKeys.add("OVPHE");
          if (lower === "student assistant" || lower === "assistant" || lower === "assistant_approver") roleKeys.add("Assistant");
        });

        (data.roles ?? []).forEach((v) => {
          if (v === 1) roleKeys.add("CISO");
          if (v === 2) roleKeys.add("OVPHE");
          if (v === 3) roleKeys.add("Approver");
          if (v === 4) roleKeys.add("Assistant");
          if (v === 5) roleKeys.add("Faculty");
        });

        setSessionRoleOptions(Array.from(roleKeys.values()));
      } catch {
        setSessionRoleOptions([]);
      }
    };

    void loadSessionRoles();
  }, []);

  React.useEffect(() => {
    if (selectedRole !== "all" && sessionRoleOptions.length && !sessionRoleOptions.includes(selectedRole)) {
      setSelectedRole("all");
    }
  }, [selectedRole, sessionRoleOptions]);
  const markAllAsRead = React.useCallback(async () => {
    try {
      const r = await fetch("/admin/xu-faculty-clearance/api/approver/notifications", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const text = await r.text();
      if (!r.ok) {
        console.error("Approver notifications mark-as-read failed", r.status, text);
        return;
      }

      setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
      setReadAll(true);
    } catch (e) {
      console.error("Approver notifications mark-as-read threw", e);
    }
  }, [selectedRole]);

  const markOneAsRead = React.useCallback(async (item: NotificationItemWithRole) => {
    const id = (item as any)?.id;
    if (!id) return;

    try {
      const r = await fetch("/admin/xu-faculty-clearance/api/approver/notifications", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [id], role: selectedRole }),
      });

      const text = await r.text();
      if (!r.ok) {
        console.error("Approver notifications mark-one-as-read failed", r.status, text);
        return;
      }

      setItems((prev) => prev.map((it) => ((it as any).id === id ? { ...it, is_read: true } : it)));
    } catch (e) {
      console.error("Approver notifications mark-one-as-read threw", e);
    }
  }, []);

  React.useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/admin/xu-faculty-clearance/api/approver/notifications", {
          credentials: "include",
        });

        const text = await r.text();
        if (!r.ok) {
          console.error("Approver notifications fetch failed", r.status, text);
          setItems([]);
          return;
        }

        try {
          const data = JSON.parse(text) as { items?: NotificationItemWithRole[] };
          const rawItems = data.items ?? [];
          // Defensive: ensure each item has a details array
          const safeItems = rawItems.map((it) => ({
            ...it,
            details: Array.isArray(it.details) ? it.details : [],
          }));
          setItems(safeItems);
        } catch (e) {
          console.error("Approver notifications response was not JSON", r.status, text);
          setItems([]);
        }
      } catch (e) {
        console.error("Approver notifications fetch threw", e);
        setItems([]);
      }
    };

    void load();
  }, []);

  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (selectedRole === "all") return items;
    const roleGroups: Record<string, string[]> = {
      Approver: ["Approver", "APPROVER"],
      Faculty: ["Faculty", "FACULTY"],
      CISO: ["CISO"],
      Assistant: ["Assistant"],
      OVPHE: ["OVPHE"],
      System: ["System"],
    };
    const selected = String(selectedRole || "").trim();
    const normalizedSelectedKey =
      Object.keys(roleGroups).find((k) => k.toLowerCase() === selected.toLowerCase()) ?? selected;
    const allowed = new Set(roleGroups[normalizedSelectedKey] ?? [selected]);
    return items.filter((it) => allowed.has(String((it as any).user_role || "").trim()));
  }, [items, selectedRole]);


  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <DynamicApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-4 md:px-6 lg:px-[1in] pt-4 pb-4 w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Notifications</h1>
        </div>

        <div className="mt-3 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger variant="pill" className="w-full sm:w-[170px] gap-2 rounded-full border-0 bg-[#7c83d6] text-white shadow-none hover:bg-[#6f76cb]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {sessionRoleOptions.includes("Approver") ? (
                  <SelectItem value="Approver">Approver</SelectItem>
                ) : null}
                {sessionRoleOptions.includes("Faculty") ? (
                  <SelectItem value="Faculty">Faculty</SelectItem>
                ) : null}
                {sessionRoleOptions.includes("CISO") ? (
                  <SelectItem value="CISO">System Admin</SelectItem>
                ) : null}
                {sessionRoleOptions.includes("Assistant") ? (
                  <SelectItem value="Assistant">Assistant</SelectItem>
                ) : null}
                {sessionRoleOptions.includes("OVPHE") ? (
                  <SelectItem value="OVPHE">Analytics Admin</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            className="h-8 px-3 text-xs"
            variant="default"
            type="button"
            onClick={markAllAsRead}
          >
            Mark as Read
          </Button>
        </div>

        <div className="mt-4">
          <NotificationsCard
            items={filteredItems}
            showMarkAsReadButton={false}
            readAll={readAll}
            onReadAllChange={setReadAll}
            onItemClick={(it) => void markOneAsRead(it as NotificationItemWithRole)}
          />
        </div>
          <div className="fixed bottom-4 left-4 z-[9999]">
            <Button
              variant="default"
              size="sm"
              onClick={() => setOpenCard(true)}
            >
              Need help?
            </Button>
          
          </div>
            <NotificationsGuideCard
              open={openCard}
              onClose={() => setOpenCard(false)}
            />             
      </main>
    </div>
  );
}

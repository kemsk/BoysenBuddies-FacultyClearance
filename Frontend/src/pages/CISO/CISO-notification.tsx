import React from "react";
import "../../index.css"; // ensure index.css is accessible from src
import { Button } from "../../stories/components/button";
import { CISOHeader } from "../../stories/components/header";

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


export default function CISONotification() {
  const [readAll, setReadAll] = React.useState(false);

  type NotificationItemWithRole = NotificationItem & { user_role?: string };

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
      const r = await fetch("/admin/xu-faculty-clearance/api/ciso/notifications", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const text = await r.text();
      if (!r.ok) {
        console.error("CISO notifications mark-as-read failed", r.status, text);
        return;
      }

      setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
      setReadAll(true);
    } catch (e) {
      console.error("CISO notifications mark-as-read threw", e);
    }
  }, [selectedRole]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/admin/xu-faculty-clearance/api/ciso/notifications", {
          credentials: "include",
        });

        const text = await r.text();
        if (!r.ok) {
          console.error("CISO notifications fetch failed", r.status, text);
          setItems([]);
          return;
        }

        try {
          const data = JSON.parse(text) as { items?: NotificationItem[] };
          const nextItems = (data.items ?? []) as NotificationItemWithRole[];
          setItems(nextItems);
          try {
            const roles = Array.from(new Set(nextItems.map((it) => String((it as any).user_role || "")).filter(Boolean)));
            console.log("[CISO notifications] roles from API:", roles);
          } catch {
          }
        } catch (e) {
          console.error("CISO notifications response was not JSON", r.status, text);
          setItems([]);
        }
      } catch (e) {
        console.error("CISO notifications fetch threw", e);
        setItems([]);
      }
    };

    void load();
  }, []);

  const filteredItems = React.useMemo(() => {
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

  React.useEffect(() => {
    try {
      const roles = Array.from(new Set(items.map((it) => String((it as any).user_role || "").trim()).filter(Boolean)));
      console.log("[CISO notifications] selectedRole=", selectedRole);
      console.log("[CISO notifications] items roles=", roles);
      console.log("[CISO notifications] filtered count=", filteredItems.length, "of", items.length);
    } catch {
    }
  }, [items, selectedRole, filteredItems.length]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-[1in] pt-4 pb-4 w-full">
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
            onClick={() => void markAllAsRead()}
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
          />
        </div>
      </main>
    </div>
  );
}

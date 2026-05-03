import * as React from "react";

import "../../index.css"; 
import { CISOHeader } from "../../stories/components/header";
import { AccessControlCard } from "../../stories/components/access-control-card";
import { CrudExplainer } from "../../stories/components/crud-explainer";

import {
  type AnnouncementItem,
} from "../../stories/components/cards";


import { Button } from "../../stories/components/button";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { RoleDefinitionCard } from "../../stories/components/role-definition-card";

// Helper to POST notifications for multiple roles
function postCISONotification(payload: {
  title: string;
  body: string;
  details: string[];
  status?: string | null;
  is_read?: number | boolean;
  user_roles?: string[];
  user_ids?: number[];
  created_by_id?: number | null;
  approver_id?: number | null;
  clearance_period_start_date?: string | null;
  clearance_period_end_date?: string | null;
}) {
  fetch("/admin/xu-faculty-clearance/api/ciso/notifications", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (r) => {
      if (r.ok) return;
      const text = await r.text().catch(() => "");
      console.error("CISO notification POST failed", r.status, text);
    })
    .catch((e) => {
      console.error("CISO notification POST threw", e);
    });
}

function GuidelinesToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={
        checked
          ? "relative h-6 w-12 rounded-full bg-success"
          : "relative h-6 w-12 rounded-full bg-muted-foreground/30"
      }
      onClick={() => onChange(!checked)}
    >
      <span
        className={
          checked
            ? "absolute left-[26px] top-1 h-4 w-4 rounded-full bg-white"
            : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white"
        }
      />
    </button>
  );
}

export default function CISOAccessControl() {
  const navigate = useNavigate();

  type AnnouncementApiItem = AnnouncementItem & { id: number; email?: string };

  const [items, setItems] = React.useState<AnnouncementApiItem[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [confirm, setConfirm] = React.useState<
    | { open: true; type: "enable" | "disable" | "delete"; index: number }
    | { open: false }
  >({ open: false });

  const refresh = React.useCallback(() => {
    return fetch("/admin/xu-faculty-clearance/api/ciso/announcements")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { items: AnnouncementApiItem[] }) => {
        const initial = (data.items ?? []).map((item) => ({
          ...item,
          enabled: item.enabled ?? true,
        }));
        setItems(initial);
      });
  }, []);

  React.useEffect(() => {
    refresh()
      .catch(() => {
         setItems([]); // Show empty state when API fails
    })
  }, [refresh]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3">

        <h1 className="text-2xl text-left text-primary font-bold">Access Control</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/CISO-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Access Control</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

         <div className="mb-3 mt-2 flex items-center justify-end">
           <Button variant="back" size="back" onClick={() => navigate("/CISO-tools")}> 
             <div className="flex items-center gap-2">
               <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
             </div>
           </Button>
         </div>       

         <div className="mx-auto w-full pb-10">
          <div className="mt-6">
            <div className="hidden items-center gap-6 lg:flex">
              <div className="text-primary text-md font-bold lg:flex-[0_0_35%]">Role Definition</div>
              <div className="text-primary text-md font-bold">Role Manager</div>
            </div>

            <div className="mt-3 flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-col gap-4 lg:flex-[0_0_35%]">
              <div className="text-primary text-md font-bold lg:hidden">Role Definition</div>
              <RoleDefinitionCard
                title="System Admin"
                items={[
                  <>
                    The <span className="font-semibold text-foreground">System Admin</span> has full control over the entire system. They manage system configurations, users, content, and oversee all data and activities.
                  </>,
                ]}
              />
              <RoleDefinitionCard
                title="Analytics Admin"
                items={[
                  <>
                    The <span className="font-semibold text-foreground">Analytics Admin</span> focuses on monitoring system performance and reviewing data, without modifying core configurations.
                  </>,
                ]}
              />
              <RoleDefinitionCard
                title="Approver"
                items={[
                  <>
                    The <span className="font-semibold text-foreground">Approver</span> responsible for evaluating and processing faculty clearance requests within their assigned office or department.
                  </>,
                ]}
              />
              <RoleDefinitionCard
                title="Approver Assistant"
                items={[
                  <>
                    The <span className="font-semibold text-foreground">Approver Assistant</span> supports the approver in handling clearance requests but has limited control.
                  </>,
                ]}
              />
              <RoleDefinitionCard
                title="Faculty Member"
                items={[
                  <>
                    The <span className="font-semibold text-foreground">Faculty Member</span> the end user who submits and tracks their clearance requests.
                  </>,
                ]}
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="text-primary text-md font-bold lg:hidden">Role Manager</div>
              <AccessControlCard
                categories={[
                {
                  id: "System Admin",
                  label: "System Admin",
                  rows: [
                    {
                      entity: "Announcement",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Guidelines",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "System Analytics",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Clearance Timeline",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "College Department Office Configuration",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "System Users",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Faculty Data Dump",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Faculty Import History",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },              
                    {
                      entity: "Clearance Requests Records",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Activity Logs",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Notifications",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },                                                                 
                  ],
                },
                {
                  id: "Analytics Admin",
                  label: "Analytics Admin",
                  rows: [
                    {
                      entity: "Announcement",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Guidelines",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "System Analytics",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Clearance Requests Records",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Activity Logs",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Notifications",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },                                                                 
                  ],
                },  
                {
                  id: "Approver",
                  label: "Approver",
                  rows: [
                    {
                      entity: "Requirements List",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Announcements",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Clearance Requests",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Clearance Requests Records",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Approver Assistant",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },                 
                    {
                      entity: "Activity Logs",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Notifications",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },                                                                 
                  ],
                },  
                {
                  id: "Approver Assistant",
                  label: "Approver Assistant",
                  rows: [
                    {
                      entity: "Requirements List",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Announcements",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Clearance Requests",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Clearance Requests Records",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },        
                    {
                      entity: "Notifications",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },                                                                 
                  ],
                },    
                {
                  id: "Faculty Member",
                  label: "Faculty Member",
                  rows: [
                    {
                      entity: "Clearance Requests",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Clearance Requests Records",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },
                    {
                      entity: "Notifications",
                      values: { Create: "organization", Read: "organization", Delete: "none" },
                    },                                                                 
                  ],
                },                                                      
              ]}
              />
              <CrudExplainer />
            </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}

import "../../index.css"; 
import { CISCOHeader } from "../../stories/components/header";


import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { SearchInputGroup } from "../../stories/components/input-group";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

import { Button } from "../../stories/components/button";
import {
  SystemUsersCard,
  type SystemUser,
} from "../../stories/components/cards";
import {
  ManageSystemAdminDialog,
  ManageSystemApproverDialog,
  RemoveSystemUserDialog,
  type ManageSystemAdminPayload,
  type ManageSystemApproverPayload,
} from "../../stories/components/manage-system-user-dialogs";

export default function CISCOManageSystemUser() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const pageSize = 2;

  const STORAGE_KEY = "cisco_system_users_v1";

  const defaultUsers: SystemUser[] = [
    {
      id: "1",
      name: "Angela Santos",
      systemId: "SA2526-1-001",
      userRole: "Assistant Approver",
      universityId: "20190016375",
      college: "College of Arts and Sciences",
      department: "College Admin",
      email: "angela.santos@xu.edu.ph",
    },
    {
      id: "2",
      name: "Example 2",
      systemId: "SA2526-1-001",
      userRole: "Approver",
      universityId: "20190016375",
      college: "College of Arts and Sciences",
      department: "College Dean",
      email: "example2@xu.edu.ph",
    },
  ];

  const [users, setUsers] = React.useState<SystemUser[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultUsers;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as SystemUser[]) : defaultUsers;
    } catch {
      return defaultUsers;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  const [addApproverOpen, setAddApproverOpen] = React.useState(false);
  const [addAdminOpen, setAddAdminOpen] = React.useState(false);
  const [editApproverOpen, setEditApproverOpen] = React.useState(false);
  const [editAdminOpen, setEditAdminOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [activeUserId, setActiveUserId] = React.useState<string | null>(null);

  const activeUser = React.useMemo(
    () => users.find((u) => u.id === activeUserId) ?? null,
    [activeUserId, users]
  );

  function isSystemAdmin(user: SystemUser) {
    return user.userRole.toLowerCase().includes("admin");
  }

  function splitName(name: string) {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: "", middleName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], middleName: "", lastName: "" };
    if (parts.length === 2) return { firstName: parts[0], middleName: "", lastName: parts[1] };
    return {
      firstName: parts[0],
      middleName: parts.slice(1, -1).join(" "),
      lastName: parts[parts.length - 1],
    };
  }

  function createSystemUserId() {
    return `SYS-${Date.now()}`;
  }

  const pageCount = Math.max(1, Math.ceil(users.length / pageSize));
  const safePage = Math.min(pageCount, Math.max(1, page));
  const pagedUsers = users.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onPrevPage = () => setPage((p) => Math.max(1, p - 1));
  const onNextPage = () => setPage((p) => Math.min(pageCount, p + 1));

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISCOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Manage System Users</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/CISCO-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Manage System Users</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/CISCO-tools")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>
       
       <div className="mt-4 space-y-3">
            <div className="w-full max-w-[520px]">
            <SearchInputGroup
              containerClassName="h-10"
              placeholder="Search by name, ID, or email..."
            />
          </div>
        
        <div className="flex flex-wrap items-start gap-3 mt-4">

            <Select onValueChange={(v) => console.log(v)}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="User Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="SystemAdmin">System Admin</SelectItem>
                    <SelectItem value="Approver">Approver</SelectItem>
                    <SelectItem value="AssistantApprover">Assistant Approver</SelectItem>
                </SelectContent>
            </Select>


            <Select onValueChange={(v) => console.log(v)}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="Approver Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="SystemAdmin">System Admin</SelectItem>
                    <SelectItem value="Approver">Approver</SelectItem>
                    <SelectItem value="AssistantApprover">Assistant Approver</SelectItem>
                </SelectContent>
            </Select>

            <Select defaultValue="name">
              <SelectTrigger variant="pill" className="w-max gap-2">
                <span>Sort by:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="college">College</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="SystemID">System ID</SelectItem>
                <SelectItem value="UniversityID">University ID</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-3">
            <SystemUsersCard
              users={pagedUsers}
              onAddApprover={() => setAddApproverOpen(true)}
              onAddAdmin={() => setAddAdminOpen(true)}
              onEditUser={(user) => {
                setActiveUserId(user.id);
                if (isSystemAdmin(user)) {
                  setEditAdminOpen(true);
                } else {
                  setEditApproverOpen(true);
                }
              }}
              onRemoveUser={(user) => {
                setActiveUserId(user.id);
                setRemoveOpen(true);
              }}
            />
          </div>
       </div>

        <ManageSystemApproverDialog
          open={addApproverOpen}
          onOpenChange={setAddApproverOpen}
          title="Add System Approver"
          submitLabel="Create"
          onSubmit={(payload: ManageSystemApproverPayload) => {
            const name = [payload.firstName, payload.middleName, payload.lastName]
              .filter(Boolean)
              .join(" ")
              .trim();

            setUsers((prev) => [
              {
                id: `${Date.now()}`,
                name: name || "New Approver",
                systemId: createSystemUserId(),
                userRole: "Approver",
                universityId: payload.universityId,
                college: payload.approverType === "College" ? payload.college ?? "" : "N/A",
                department:
                  payload.approverType === "College"
                    ? payload.department ?? ""
                    : payload.office ?? "",
                email: payload.email,
              },
              ...prev,
            ]);
            setPage(1);
          }}
        />

        <ManageSystemApproverDialog
          open={editApproverOpen}
          onOpenChange={(o) => {
            setEditApproverOpen(o);
            if (!o) setActiveUserId(null);
          }}
          title="Edit Approver"
          submitLabel="Create"
          initialValues={
            activeUser
              ? {
                  ...splitName(activeUser.name),
                  universityId: activeUser.universityId,
                  email: activeUser.email,
                  approverType: activeUser.college === "N/A" ? "Office" : "College",
                  college: activeUser.college === "N/A" ? "" : activeUser.college,
                  department: activeUser.college === "N/A" ? "" : activeUser.department,
                  office: activeUser.college === "N/A" ? activeUser.department : "",
                  isActive: true,
                }
              : undefined
          }
          onSubmit={(payload: ManageSystemApproverPayload) => {
            if (!activeUser) return;
            const name = [payload.firstName, payload.middleName, payload.lastName]
              .filter(Boolean)
              .join(" ")
              .trim();

            setUsers((prev) =>
              prev.map((u) =>
                u.id !== activeUser.id
                  ? u
                  : {
                      ...u,
                      name: name || u.name,
                      userRole: "Approver",
                      universityId: payload.universityId,
                      email: payload.email,
                      college: payload.approverType === "College" ? payload.college ?? "" : "N/A",
                      department:
                        payload.approverType === "College"
                          ? payload.department ?? ""
                          : payload.office ?? "",
                    }
              )
            );
          }}
        />

        <ManageSystemAdminDialog
          open={addAdminOpen}
          onOpenChange={setAddAdminOpen}
          title="Add System Admin"
          submitLabel="Create"
          onSubmit={(payload: ManageSystemAdminPayload) => {
            const name = [payload.firstName, payload.middleName, payload.lastName]
              .filter(Boolean)
              .join(" ")
              .trim();

            setUsers((prev) => [
              {
                id: `${Date.now()}`,
                name: name || "New Admin",
                systemId: createSystemUserId(),
                userRole: "System Admin",
                universityId: payload.universityId,
                college: payload.systemAdminOffice,
                department: "System Admin Office",
                email: payload.email,
              },
              ...prev,
            ]);
            setPage(1);
          }}
        />

        <ManageSystemAdminDialog
          open={editAdminOpen}
          onOpenChange={(o) => {
            setEditAdminOpen(o);
            if (!o) setActiveUserId(null);
          }}
          title="Edit System Admin"
          submitLabel="Create"
          initialValues={
            activeUser
              ? {
                  ...splitName(activeUser.name),
                  universityId: activeUser.universityId,
                  email: activeUser.email,
                  systemAdminOffice: activeUser.college === "CISCO" ? "CISCO" : "OPVHE",
                  isActive: true,
                }
              : undefined
          }
          onSubmit={(payload: ManageSystemAdminPayload) => {
            if (!activeUser) return;
            const name = [payload.firstName, payload.middleName, payload.lastName]
              .filter(Boolean)
              .join(" ")
              .trim();

            setUsers((prev) =>
              prev.map((u) =>
                u.id !== activeUser.id
                  ? u
                  : {
                      ...u,
                      name: name || u.name,
                      userRole: "System Admin",
                      universityId: payload.universityId,
                      email: payload.email,
                      college: payload.systemAdminOffice,
                    }
              )
            );
          }}
        />

        <RemoveSystemUserDialog
          open={removeOpen}
          onOpenChange={(o) => {
            setRemoveOpen(o);
            if (!o) setActiveUserId(null);
          }}
          userName={activeUser?.name ?? ""}
          userEmail={activeUser?.email ?? ""}
          onRemove={() => {
            if (!activeUser) return;
            setUsers((prev) => prev.filter((u) => u.id !== activeUser.id));
          }}
        />

         <div className="flex items-center justify-center gap-3  px-4 py-3">
          <div className="text-sm text-muted-foreground">Page</div>

          <Button type="button" variant="icon" size="icon" className="h-9 w-9" onClick={onNextPage}>
            <img src="/BlackArrowIcon.png" alt="Next" className="h-5 w-5" />
          </Button>

          <div className="flex h-9 min-w-[44px] items-center justify-center rounded-md border border-muted-foreground/30 bg-background px-3 text-sm font-semibold text-foreground">
            {safePage}
          </div>

          <Button type="button" variant="icon" size="icon" className="h-9 w-9" onClick={onPrevPage}>
            <img src="/BlackArrowIcon.png" alt="Prev" className="h-5 w-5 rotate-180" />
          </Button>

          <div className="text-sm text-muted-foreground">of {pageCount}</div>

        </div>

      </main>

    </div>
  );
}

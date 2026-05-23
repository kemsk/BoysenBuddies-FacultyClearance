import "../../index.css"; 
import { CISOHeader } from "../../stories/components/header";
import { ManageUserGuideCard } from "../../stories/components/guide-cards";

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
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

import { Button } from "../../stories/components/button";
import { type SystemUser } from "../../stories/components/system-users-cards";
import {
  ManageSystemAdminDialog,
  ManageSystemApproverDialog,
  RemoveSystemUserDialog,
  type ManageSystemAdminPayload,
  type ManageSystemApproverPayload,
} from "../../stories/components/manage-system-user-dialogs";

import {
  ErrorModal,
  SuccessModal,
  SuccessErrorModalMessages,
} from "../../stories/components/success-and-error-modals";
import { AdminSystemUsersCard, ApproverSystemUsersCard } from "../../stories/components/system-users-cards";
import { useState } from "react";

 export default function CISOManageSystemUser() {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [openCard, setOpenCard] = useState(false); 
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<React.ReactNode>("");

  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode>("");

  const [users, setUsers] = React.useState<SystemUser[]>([]);
  const [filteredUsers, setFilteredUsers] = React.useState<SystemUser[]>([]);
  const [orgColleges, setOrgColleges] = React.useState<string[]>([]);
  const [orgDepartments, setOrgDepartments] = React.useState<string[]>([]);
  const [orgOffices, setOrgOffices] = React.useState<string[]>([]);
  const [collegeDepartmentsMap, setCollegeDepartmentsMap] = React.useState<Record<string, string[]>>({});
  const [adminEmail, setAdminEmail] = React.useState<string>("");

  const apiBase = "/admin/xu-faculty-clearance/api/ciso/system-users";
  const orgStructureApi = "/admin/xu-faculty-clearance/api/ciso/org-structure";

  function isXuEmail(email: string) {
    const e = (email || "").trim().toLowerCase();
    return e.endsWith("@xu.edu.ph") || e.endsWith("@my.xu.edu.ph");
  }

  const openError = React.useCallback((message: React.ReactNode) => {
    setErrorMessage(message);
    setErrorOpen(true);
  }, []);

  const openSuccess = React.useCallback((message: React.ReactNode) => {
    setSuccessMessage(message);
    setSuccessOpen(true);
  }, []);

  async function readErrorDetail(r: Response) {
    try {
      const data = (await r.json()) as { detail?: string };
      if (data?.detail) return data.detail;
    } catch {
      // ignore
    }

    try {
      const t = (await r.text()) || "";
      if (t.trim()) return t;
    } catch {
      // ignore
    }

    return `Request failed (HTTP ${r.status})`;
  }

  const fetchUsers = React.useCallback(async () => {
    try {
      const r = await fetch(apiBase, { method: "GET", credentials: "include" });
      if (!r.ok) throw new Error("Failed to load users");
      const data = (await r.json()) as { items?: SystemUser[] };
      setUsers(Array.isArray(data.items) ? data.items : []);
    } catch {
      setUsers([]);
    }
  }, [apiBase]);

  // Filter out Assistant Approvers from the displayed users
  React.useEffect(() => {
    const filtered = users.filter(user => {
      const userRole = user.userRole.toLowerCase();
      return userRole !== "assistant approver";
    });
    setFilteredUsers(filtered);
  }, [users]);

  const fetchOrgStructure = React.useCallback(async () => {
    try {
      const r = await fetch(orgStructureApi, { method: "GET", credentials: "include" });
      if (!r.ok) throw new Error("Failed to load org structure");

      const data = (await r.json()) as {
        colleges?: Array<{ id?: string; name?: string; short?: string }>;
        departments?: Array<{ id?: string; collegeId?: string; name?: string; short?: string }>;
        offices?: Array<{ id?: string; name?: string; short?: string }>;
      };

      const colleges = (data.colleges || [])
        .map((c) => (c?.name || "").trim())
        .filter(Boolean);
      const departments = (data.departments || [])
        .map((d) => (d?.name || "").trim())
        .filter(Boolean);
      const offices = (data.offices || [])
        .map((o) => (o?.name || "").trim())
        .filter(Boolean);

      // Build college-departments map: college name -> array of department names
      const collegeMap: Record<string, string[]> = {};
      
      // Initialize all colleges with empty arrays
      (data.colleges || []).forEach((c) => {
        const collegeName = (c?.name || "").trim();
        if (collegeName) {
          collegeMap[collegeName] = [];
        }
      });
      
      // Map departments to their colleges using collegeId
      (data.departments || []).forEach((d) => {
        const departmentName = (d?.name || "").trim();
        const collegeId = d?.collegeId;
        
        if (departmentName && collegeId) {
          // Find college by ID
          const college = (data.colleges || []).find(c => c?.id === collegeId);
          const collegeName = college?.name?.trim();
          
          if (collegeName && collegeMap[collegeName]) {
            collegeMap[collegeName].push(departmentName);
          }
        }
      });

      setOrgColleges(colleges);
      setOrgDepartments(departments);
      setOrgOffices(offices);
      setCollegeDepartmentsMap(collegeMap);
    } catch {
      setOrgColleges([]);
      setOrgDepartments([]);
      setOrgOffices([]);
      setCollegeDepartmentsMap({});
    }
  }, [orgStructureApi]);

  const fetchAdminEmail = React.useCallback(async () => {
    try {
      const r = await fetch("/admin/xu-faculty-clearance/api/ciso-profile", { method: "GET", credentials: "include" });
      if (!r.ok) throw new Error("Failed to load admin profile");
      const data = (await r.json()) as { email?: string };
      if (data.email) {
        setAdminEmail(data.email);
      }
    } catch {
      setAdminEmail("");
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
    fetchOrgStructure();
    fetchAdminEmail();
  }, [fetchUsers, fetchOrgStructure, fetchAdminEmail]);

  React.useEffect(() => {
    fetch("/admin/xu-faculty-clearance/api/ciso/system-users")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { items: SystemUser[] }) => {
        setUsers(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        setUsers([]);
      });
  }, []);

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

  function isSystemLevelRole(user: SystemUser) {
    const role = user.userRole.toLowerCase();
    return role.includes("admin") || role === "ciso" || role === "ovphe";
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

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(pageCount, Math.max(1, page));
  const pagedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onPrevPage = () => setPage((p) => Math.max(1, p - 1));
  const onNextPage = () => setPage((p) => Math.min(pageCount, p + 1));

  const onAddApprover = React.useCallback(() => {
    setAddApproverOpen(true);
  }, []);

  // Filter users for Admin and Approver roles
  // Note: Backend already handles role deduplication, so we can filter by displayed role
  const adminUsers = React.useMemo(() => {
    return filteredUsers.filter(user => {
      const role = user.userRole.toLowerCase();
      return role === "ciso" || role === "analytics admin";
    });
  }, [filteredUsers]);

  const approverUsers = React.useMemo(() => {
    return filteredUsers.filter(user => {
      const role = user.userRole.toLowerCase();
      return role === "approver" || role === "assistant approver";
    });
  }, [filteredUsers]);

  // Pagination for admin users
  const adminPageCount = Math.max(1, Math.ceil(adminUsers.length / pageSize));
  const adminSafePage = Math.min(adminPageCount, Math.max(1, page));
  const adminPagedUsers = adminUsers.slice((adminSafePage - 1) * pageSize, adminSafePage * pageSize);

  // Pagination for approver users
  const approverPageCount = Math.max(1, Math.ceil(approverUsers.length / pageSize));
  const approverSafePage = Math.min(approverPageCount, Math.max(1, page));
  const approverPagedUsers = approverUsers.slice((approverSafePage - 1) * pageSize, approverSafePage * pageSize);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">

      <SuccessModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        message={successMessage}
      />

      <ErrorModal
        open={errorOpen}
        onOpenChange={setErrorOpen}
        message={errorMessage}
      />
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-4 md:px-6 lg:px-[1in] pt-4 pb-4 w-full">
        
        <h1 className="text-2xl text-left text-primary font-bold">Manage System Users</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/system-admin-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Manage System Users</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/system-admin-tools")}> 
            <div className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />Back
            </div>
          </Button>
        </div>
       
       <div className="mt-4 space-y-3">

          <div className="rounded-lg borde bg-white p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              <b>What does this mean?</b>
            </h3>

            <ul className="list-disc pl-5 space-y-1 text-blue-800">     
              <li>The <b>System Admin</b> has full access to the system’s management features, including managing users, viewing activity logs, handling imports, and configuring system settings.</li> 
              <li>The <b>Analytics Admin</b> is responsible for managing analytics-related features such as reports, dashboards, and data monitoring tools.</li> 
              <li><b>Approvers</b> are office representatives who review and approve submitted requests, records, or transactions within their assigned office.</li>   
            </ul>
          </div>

        <div className="pt-4">
          <div className="text-primary text-md font-semibold"> Administrative Roles</div>
        </div>

          <div className="mt-3">
            <AdminSystemUsersCard
              users={adminPagedUsers}
              onAddAdmin={() => setAddAdminOpen(true)}
              currentUserEmail={adminEmail}
              page={adminSafePage}
              pageCount={adminPageCount}
              onPageChange={(p) => setPage(p)}
              onEditUser={(user) => {
                if (user.email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
                  window.alert("You cannot edit your own account from Manage System Users.");
                  return;
                }
                setActiveUserId(user.id);
                if (isSystemLevelRole(user)) {
                  setEditAdminOpen(true);
                } else {
                  setEditApproverOpen(true);
                }
              }}
              onRemoveUser={(user) => {
                if (user.email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
                  window.alert("You cannot remove your own account from Manage System Users.");
                  return;
                }
                setActiveUserId(user.id);
                setRemoveOpen(true);
              }}
            />
          </div>
        <div className="pt-4">
          <div className="text-primary text-md font-semibold"> Approver Roles</div>
        </div>

          <div className="mt-3">
            <ApproverSystemUsersCard 
              users={approverPagedUsers}
              onAddApprover={onAddApprover}
              onAddAdmin={() => setAddAdminOpen(true)}
              currentUserEmail={adminEmail}
              page={approverSafePage}
              pageCount={approverPageCount}
              onPageChange={(p) => setPage(p)}
              onEditUser={(user) => {
                if (user.email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
                  window.alert("You cannot edit your own account from Manage System Users.");
                  return;
                }
                setActiveUserId(user.id);
                if (isSystemLevelRole(user)) {
                  setEditAdminOpen(true);
                } else {
                  setEditApproverOpen(true);
                }
              }}
              onRemoveUser={(user) => {
                if (user.email.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
                  window.alert("You cannot remove your own account from Manage System Users.");
                  return;
                }
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
          colleges={orgColleges}
          departments={orgDepartments}
          offices={orgOffices}
          collegeDepartmentsMap={collegeDepartmentsMap}
          onSubmit={(payload: ManageSystemApproverPayload) => {
            (async () => {
              if (!isXuEmail(payload.email)) {
                openError(SuccessErrorModalMessages.EMAIL_MUST_BE_XU);
                return;
              }
              const r = await fetch(apiBase, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  firstName: payload.firstName,
                  middleName: payload.middleName,
                  lastName: payload.lastName,
                  universityId: payload.universityId,
                  email: payload.email,
                  isActive: payload.isActive,
                  approverType: payload.approverType,
                  college: payload.college,
                  department: payload.department,
                  office: payload.office,
                }),
              });

              if (!r.ok) {
                const detail = await readErrorDetail(r);
                openError(detail || SuccessErrorModalMessages.ERROR_DETAIL_FROM_API);
                return;
              }

              setAddApproverOpen(false);
              setPage(1);
              await fetchUsers();
              openSuccess(SuccessErrorModalMessages.APPROVER_CREATED);
            })();
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
          colleges={orgColleges}
          departments={orgDepartments}
          offices={orgOffices}
          collegeDepartmentsMap={collegeDepartmentsMap}
          initialValues={
            activeUser
              ? {
                  ...splitName(activeUser.name),
                  universityId: activeUser.universityId,
                  email: activeUser.email,
                  approverType: activeUser.college === "None" ? "Office" : "College",
                  college: activeUser.college === "None" ? "" : activeUser.college,
                  department: activeUser.college === "None" ? "" : activeUser.department,
                  office: activeUser.college === "None" ? activeUser.department : "",
                  isActive: Boolean(activeUser.isActive),
                }
              : undefined
          }
          onSubmit={(payload: ManageSystemApproverPayload) => {
            if (!activeUser) return;
            (async () => {
              if (!isXuEmail(payload.email)) {
                openError(SuccessErrorModalMessages.EMAIL_MUST_BE_XU);
                return;
              }
              const r = await fetch(`${apiBase}/${activeUser.id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  firstName: payload.firstName,
                  middleName: payload.middleName,
                  lastName: payload.lastName,
                  universityId: payload.universityId,
                  email: payload.email,
                  isActive: payload.isActive,
                  approverType: payload.approverType,
                  college: payload.college,
                  department: payload.department,
                  office: payload.office,
                }),
              });

              if (!r.ok) {
                const detail = await readErrorDetail(r);
                openError(detail || SuccessErrorModalMessages.ERROR_DETAIL_FROM_API);
                return;
              }

              setEditApproverOpen(false);
              setActiveUserId(null);
              await fetchUsers();
              openSuccess(SuccessErrorModalMessages.APPROVER_UPDATED);
            })();
          }}
        />

        <ManageSystemAdminDialog
          open={addAdminOpen}
          onOpenChange={setAddAdminOpen}
          title="Add System Admin"
          submitLabel="Create"
          onSubmit={(payload: ManageSystemAdminPayload) => {
            (async () => {
              if (!isXuEmail(payload.email)) {
                openError(SuccessErrorModalMessages.EMAIL_MUST_BE_XU);
                return;
              }
              const r = await fetch(apiBase, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  firstName: payload.firstName,
                  middleName: payload.middleName,
                  lastName: payload.lastName,
                  universityId: payload.universityId,
                  email: payload.email,
                  isActive: payload.isActive,
                  systemAdminOffice: payload.systemAdminOffice,
                }),
              });

              if (!r.ok) {
                const detail = await readErrorDetail(r);
                openError(detail || SuccessErrorModalMessages.ERROR_DETAIL_FROM_API);
                return;
              }

              setAddAdminOpen(false);
              setPage(1);
              await fetchUsers();
              openSuccess(SuccessErrorModalMessages.SYSTEM_ADMIN_CREATED);
            })();
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
                  systemAdminOffice: activeUser.college === "CISO" ? "CISO" : "OVPHE",
                  isActive: Boolean(activeUser.isActive),
                }
              : undefined
          }
          onSubmit={(payload: ManageSystemAdminPayload) => {
            if (!activeUser) return;
            (async () => {
              if (!isXuEmail(payload.email)) {
                openError(SuccessErrorModalMessages.EMAIL_MUST_BE_XU);
                return;
              }
              const r = await fetch(`${apiBase}/${activeUser.id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  firstName: payload.firstName,
                  middleName: payload.middleName,
                  lastName: payload.lastName,
                  universityId: payload.universityId,
                  email: payload.email,
                  isActive: payload.isActive,
                  systemAdminOffice: payload.systemAdminOffice,
                }),
              });

              if (!r.ok) {
                const detail = await readErrorDetail(r);
                openError(detail || SuccessErrorModalMessages.ERROR_DETAIL_FROM_API);
                return;
              }

              setEditAdminOpen(false);
              setActiveUserId(null);
              await fetchUsers();
              openSuccess(SuccessErrorModalMessages.SYSTEM_ADMIN_UPDATED);
            })();
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
          adminEmail={adminEmail}
          mismatchMessage={SuccessErrorModalMessages.ERROR_MATCH_EMAIL}
          onError={(msg) => openError(msg || SuccessErrorModalMessages.ERROR_MATCH_EMAIL)}
          onRemove={() => {
            if (!activeUser) return;
            (async () => {
              const r = await fetch(`${apiBase}/${activeUser.id}`, {
                method: "DELETE",
                credentials: "include",
              });

              if (!r.ok) {
                const detail = await readErrorDetail(r);
                openError(detail || SuccessErrorModalMessages.ERROR_DETAIL_FROM_API);
                return;
              }

              setRemoveOpen(false);
              setActiveUserId(null);
              await fetchUsers();
              openSuccess(SuccessErrorModalMessages.USER_REMOVED);
            })();
          }}
        />
          <div className="fixed bottom-4 left-4 z-[9999]">
            <Button
              variant="default"
              size="sm"
              onClick={() => setOpenCard(true)}
            >
              Need help?
            </Button>
          
          </div>
            <ManageUserGuideCard
              open={openCard}
              onClose={() => setOpenCard(false)}
            />

          <div className="fixed bottom-4 left-4 z-[9999]">
            <Button
              variant="default"
              size="sm"
              onClick={() => setOpenCard(true)}
            >
              Need help?
            </Button>
          
          </div>
            <ManageUserGuideCard
              open={openCard}
              onClose={() => setOpenCard(false)}
            />            
      </main>

    </div>
  );
}

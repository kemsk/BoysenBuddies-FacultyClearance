import "../../index.css";
import { ApprovalHeader } from "../../stories/components/header";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";

import {
  StudentAssistantsCard,
  type StudentAssistantItem,
} from "../../stories/components/cards";
import {
  AddDepartmentAssistantDialog,
  EditDepartmentAssistantDialog,
  type DepartmentAssistantPayload,
} from "../../stories/components/department-assistant-dialogs";
import { RemoveSystemUserDialog } from "../../stories/components/manage-system-user-dialogs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";

import { SearchInputGroup } from "../../stories/components/input-group";

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../stories/components/button";

export default function ApproverAssistantList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<StudentAssistantItem[]>([]);
  const [orgColleges, setOrgColleges] = useState<string[]>([]);
  const [orgDepartments, setOrgDepartments] = useState<string[]>([]);
  const [collegeDepartmentsMap, setCollegeDepartmentsMap] = useState<Record<string, string[]>>({});
  const [approverEmail, setApproverEmail] = useState<string>("");

  const apiBase = "/admin/xu-faculty-clearance/api/approver/assistant-approvers";
  const orgStructureApi = "/admin/xu-faculty-clearance/api/ovphe/org-structure";

  function isXuEmail(email: string) {
    const e = (email || "").trim().toLowerCase();
    return e.endsWith("@xu.edu.ph") || e.endsWith("@my.xu.edu.ph");
  }

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

  const fetchUsers = useCallback(async () => {
    try {
      const r = await fetch(apiBase, { method: "GET", credentials: "include" });
      if (!r.ok) throw new Error("Failed to load users");
      const data = (await r.json()) as { items?: StudentAssistantItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    }
  }, [apiBase]);

  const fetchOrgStructure = useCallback(async () => {
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
      setCollegeDepartmentsMap(collegeMap);
    } catch {
      setOrgColleges([]);
      setOrgDepartments([]);
      setCollegeDepartmentsMap({});
    }
  }, [orgStructureApi]);

  const fetchApproverEmail = useCallback(async () => {
    try {
      const r = await fetch("/admin/xu-faculty-clearance/api/me", { method: "GET", credentials: "include" });
      if (!r.ok) throw new Error("Failed to load profile");
      const data = (await r.json()) as { email?: string };
      if (data.email) {
        setApproverEmail(data.email);
      }
    } catch {
      setApproverEmail("");
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchOrgStructure();
    fetchApproverEmail();
  }, [fetchUsers, fetchOrgStructure, fetchApproverEmail]);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);

  const activeAssistant = items.find((i) => i.id === activeAssistantId) ?? null;

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

 return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <ApprovalHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold"> Approver Assistants</h1>

        
        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/approver-action">Action</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage> Approver Assistants</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/Approver-Action")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>
       
       <div className="mt-5 space-y-5">
          <div className="w-full max-w-[520px]">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
              placeholder="Search by name, ID, or email..."
            />
          </div>
        </div>

        <div className="flex flex-wrap items-left gap-3 overflow-x-auto mt-4">

            <Select defaultValue="name">
              <SelectTrigger variant="pill" className="w-max gap-2">
                <span>Sort by :</span>
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

        <div className="mt-7">
          <StudentAssistantsCard
            items={items}
            onAddUser={() => setAddOpen(true)}
            onEditUser={(item) => {
              setActiveAssistantId(item.id);
              setEditOpen(true);
            }}
            onRemove={(id) => {
              setActiveAssistantId(id);
              setRemoveOpen(true);
            }}
          />
        </div>

        <AddDepartmentAssistantDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          colleges={orgColleges}
          departments={orgDepartments}
          collegeDepartmentsMap={collegeDepartmentsMap}
          onCreate={(payload: DepartmentAssistantPayload) => {
            (async () => {
              if (!isXuEmail(payload.email)) {
                window.alert("Email must be an XU email (@xu.edu.ph or @my.xu.edu.ph)");
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
                  college: payload.college,
                  department: payload.department,
                }),
              });

              if (!r.ok) {
                window.alert(await readErrorDetail(r));
                return;
              }

              setAddOpen(false);
              await fetchUsers();
              window.alert("Assistant created successfully!");
            })();
          }}
        />

        <EditDepartmentAssistantDialog
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) setActiveAssistantId(null);
          }}
          colleges={orgColleges}
          departments={orgDepartments}
          collegeDepartmentsMap={collegeDepartmentsMap}
          initialValues={
            activeAssistant
              ? {
                  ...splitName(activeAssistant.name),
                  universityId: activeAssistant.id,
                  college: activeAssistant.college,
                  department: activeAssistant.department,
                  email: activeAssistant.email,
                  isActive: activeAssistant.isActive,
                }
              : undefined
          }
          onSave={(payload: DepartmentAssistantPayload) => {
            if (!activeAssistant) return;
            (async () => {
              if (!isXuEmail(payload.email)) {
                window.alert("Email must be an XU email (@xu.edu.ph or @my.xu.edu.ph)");
                return;
              }
              const r = await fetch(`${apiBase}/${activeAssistant.id}`, {
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
                  college: payload.college,
                  department: payload.department,
                }),
              });

              if (!r.ok) {
                window.alert(await readErrorDetail(r));
                return;
              }

              setEditOpen(false);
              setActiveAssistantId(null);
              await fetchUsers();
              window.alert("Assistant updated successfully!");
            })();
          }}
        />

        <RemoveSystemUserDialog
          open={removeOpen}
          onOpenChange={(o) => {
            setRemoveOpen(o);
            if (!o) setActiveAssistantId(null);
          }}
          userName={activeAssistant?.name ?? ""}
          userEmail={activeAssistant?.email ?? ""}
          adminEmail={approverEmail}
          onRemove={() => {
            if (!activeAssistant) return;
            (async () => {
              const r = await fetch(`${apiBase}/${activeAssistant.id}`, {
                method: "DELETE",
                credentials: "include",
              });

              if (!r.ok) {
                window.alert(await readErrorDetail(r));
                return;
              }

              setRemoveOpen(false);
              setActiveAssistantId(null);
              await fetchUsers();
              window.alert("Assistant removed successfully!");
            })();
          }}
        />

        
      </main>
    </div>
  );
}

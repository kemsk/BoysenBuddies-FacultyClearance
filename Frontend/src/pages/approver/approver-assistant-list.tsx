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
  type DepartmentAssistantPayload,
  EditDepartmentAssistantDialog,
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
  const [mode, setMode] = useState<"assistants" | "admins">("assistants");
  const [orgColleges, setOrgColleges] = useState<string[]>([]);
  const [orgDepartments, setOrgDepartments] = useState<string[]>([]);
  const [orgOffices, setOrgOffices] = useState<string[]>([]);
  const [collegeDepartmentsMap, setCollegeDepartmentsMap] = useState<Record<string, string[]>>({});
  const [approverRoles, setApproverRoles] = useState<Array<{ role_name: string; college?: string; department?: string; office?: string }>>([]);
  const [approverEmail, setApproverEmail] = useState<string>("");

  const apiBase = "/admin/xu-faculty-clearance/api/approver/assistant-approvers";
  const orgStructureApi = "/admin/xu-faculty-clearance/api/ciso/org-structure";

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

  const fetchApproverEmail = useCallback(async () => {
    try {
      const r = await fetch("/admin/xu-faculty-clearance/api/me", { method: "GET", credentials: "include" });
      if (!r.ok) throw new Error("Failed to load profile");
      const data = (await r.json()) as { email?: string; roles?: Array<{ role_name: string; college: string; department: string; office: string }> };
      if (data.email) {
        setApproverEmail(data.email);
      }
      if (Array.isArray(data.roles)) {
        console.log('DEBUG roles from /api/me:', data.roles);
        setApproverRoles(data.roles);
      }

      // Fetch approver profile to get college/department assignments
      const approverR = await fetch("/admin/xu-faculty-clearance/api/approver-profile", { method: "GET", credentials: "include" });
      if (approverR.ok) {
        const approverData = await approverR.json() as { approver_profile?: { approver_type: string; college: string; department: string } };
        console.log('DEBUG approver profile:', approverData);
        
        // Merge approver profile college/department into the Approver role
        if (approverData.approver_profile) {
          setApproverRoles(prev => prev.map(role => {
            if (role.role_name === "Approver") {
              return {
                ...role,
                college: approverData.approver_profile!.college || role.college,
                department: approverData.approver_profile!.department || role.department,
              };
            }
            return role;
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setApproverEmail("");
      setApproverRoles([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchOrgStructure();
    fetchApproverEmail();
  }, [fetchUsers, fetchOrgStructure, fetchApproverEmail]);

  const [addOpen, setAddOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);

  const activeAssistant = items.find((i) => i.id === activeAssistantId) ?? null;

  // Helper to get unique colleges/departments/offices from approverRoles
  const myColleges = React.useMemo(() => {
    const set = new Set<string>();
    approverRoles.forEach(r => r.college && set.add(r.college));
    return Array.from(set);
  }, [approverRoles]);

  const myDepartments = React.useMemo(() => {
    const set = new Set<string>();
    approverRoles.forEach(r => r.department && set.add(r.department));
    return Array.from(set);
  }, [approverRoles]);

  const myOffices = React.useMemo(() => {
    const set = new Set<string>();
    approverRoles.forEach(r => r.office && set.add(r.office));
    return Array.from(set);
  }, [approverRoles]);

  // DEBUG: Log approver roles to understand structure
  React.useEffect(() => {
    console.log('DEBUG approverRoles:', approverRoles);
    console.log('DEBUG myColleges:', myColleges);
    console.log('DEBUG myDepartments:', myDepartments);
    console.log('DEBUG myOffices:', myOffices);
  }, [approverRoles, myColleges, myDepartments, myOffices]);

  // Determine approver level
  const approverLevel = React.useMemo(() => {
    // Check if any role has a department with "Dean" in the name
    if (approverRoles.some(r => r.department?.toLowerCase().includes("dean"))) {
      return "dean";
    }
    if (myOffices.length > 0) {
      return "office";
    }
    // Default to chair if we have departments but not dean/office
    return "chair";
  }, [approverRoles, myOffices]);

  // Filter org structure based on approver level
  const visibleColleges = React.useMemo(() => {
  // If no approver roles at all, show all colleges for testing
  return approverRoles.length > 0 ? orgColleges.filter(c => myColleges.includes(c)) : orgColleges;
}, [orgColleges, myColleges, approverRoles.length]);

  const visibleDepartments = React.useMemo(() => {
  if (approverRoles.length === 0) {
    // No approver roles at all: fallback to all for testing
    return orgDepartments;
  }
  if (myDepartments.length > 0) {
    if (approverLevel === "dean") {
      // Dean: show all departments in their colleges
      return orgDepartments.filter(d => {
        const college = Object.entries(collegeDepartmentsMap).find(([, depts]) => depts.includes(d))?.[0];
        return college && myColleges.includes(college);
      });
    } else {
      // Chair/Office: show only their departments
      return orgDepartments.filter(d => myDepartments.includes(d));
    }
  }
  // Has approver roles but no departments (e.g., office-only approver): show none
  return [];
}, [orgDepartments, myDepartments, approverLevel, collegeDepartmentsMap, myColleges, approverRoles.length]);

  const visibleOffices = React.useMemo(() => {
  if (approverRoles.length === 0) {
    // No approver roles at all: fallback to all for testing
    return orgOffices;
  }
  if (myOffices.length > 0) {
    if (approverLevel === "dean") {
      // Dean: show all offices in their colleges (if offices are linked to colleges)
      // For now, show all offices since we don't have college-office mapping
      return orgOffices;
    } else {
      // Office/Chair: show only their offices
      return orgOffices.filter(o => myOffices.includes(o));
    }
  }
  // Has approver roles but no offices (e.g., department-only approver): show none
  return [];
}, [orgOffices, myOffices, approverLevel, approverRoles.length]);

  const visibleCollegeDepartmentsMap = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    visibleColleges.forEach(college => {
      if (approverLevel === "dean") {
        // Dean: show all departments for their colleges
        map[college] = (collegeDepartmentsMap[college] || []).filter(d => {
          return orgDepartments.includes(d); // ensure department exists
        });
      } else if (myDepartments.length > 0) {
        // Chair/Office: show only their departments
        map[college] = (collegeDepartmentsMap[college] || []).filter(d => myDepartments.includes(d));
      } else {
        // fallback: show all
        map[college] = collegeDepartmentsMap[college] || [];
      }
    });
    return map;
  }, [visibleColleges, collegeDepartmentsMap, myDepartments, approverLevel, orgDepartments]);

  // Prepare filtered options for admin mode based on approver level
  const adminDepartments = React.useMemo(() => {
    let filtered = visibleDepartments;
    // For College Dean, exclude the Dean department itself
    if (approverLevel === "dean") {
      filtered = filtered.filter(dept => !dept.toLowerCase().includes("dean"));
    }
    return filtered;
  }, [visibleDepartments, approverLevel]);

  const adminOffices = React.useMemo(() => {
    return visibleOffices;
  }, [visibleOffices]);

  // Derived list based on current mode and search query
  const filteredItems = items
    .filter((item) => {
      const assistantType = item.assistantType || "student_assistant";
      if (mode === "assistants") {
        return assistantType === "student_assistant";
      }
      // Admins mode: anything that is not a plain student assistant
      return assistantType !== "student_assistant";
    })
    .filter((item) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const haystack = [
        item.name,
        item.email,
        item.college,
        item.department,
        item.id,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

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
          <Button variant="back" size="back" onClick={() => navigate("/approver-action")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
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
            items={filteredItems}
            mode={mode}
            onModeChange={(m) => setMode(m)}
            onAddUser={() => {
              if (mode === "assistants") {
                setAddOpen(true);
              } else {
                setAddAdminOpen(true);
              }
            }}
            onEditUser={(item: StudentAssistantItem) => {
              setActiveAssistantId(item.id);
              setEditOpen(true);
            }}
            onRemove={(id: string) => {
              setActiveAssistantId(id);
              setRemoveOpen(true);
            }}
          />
        </div>

        <AddDepartmentAssistantDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          mode="assistant"
          colleges={visibleColleges}
          departments={visibleDepartments}
          collegeDepartmentsMap={visibleCollegeDepartmentsMap}
          emailHelpText="Only @my.xu.edu.ph email addresses are allowed"
          onCreate={(payload: DepartmentAssistantPayload) => {
            (async () => {
              // Assistants must use student email domain
              if (!payload.email.endsWith("@my.xu.edu.ph")) {
                window.alert("Email must be a student XU email (@my.xu.edu.ph)");
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
                  assistantType: "student_assistant",
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

        <AddDepartmentAssistantDialog
          open={addAdminOpen}
          onOpenChange={setAddAdminOpen}
          mode="admin"
          colleges={visibleColleges}
          departments={visibleDepartments}
          offices={visibleOffices}
          collegeDepartmentsMap={visibleCollegeDepartmentsMap}
          adminDepartments={adminDepartments}
          adminOffices={adminOffices}
          emailHelpText="Only @xu.edu.ph email addresses are allowed"
          onCreate={(payload: DepartmentAssistantPayload) => {
            (async () => {
              // Admins must use @xu.edu.ph domain
              if (!payload.email.endsWith("@xu.edu.ph")) {
                window.alert("Email must be an XU email (@xu.edu.ph)");
                return;
              }
              // Derive assistantType based on selected department/office
              const selected = payload.department;
              const isOffice = adminOffices.includes(selected || "");
              let assistantType: "college_admin" | "dept_chair" | "office_admin" | "admin_secondment" | "admin_representative" = "college_admin";
              if (isOffice) {
                assistantType = "office_admin";
              } else {
                assistantType = "dept_chair";
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
                  department: isOffice ? undefined : selected,
                  assistantType,
                }),
              });

              if (!r.ok) {
                window.alert(await readErrorDetail(r));
                return;
              }

              setAddAdminOpen(false);
              await fetchUsers();
              window.alert("Admin created successfully!");
            })();
          }}
        />

        <EditDepartmentAssistantDialog
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) setActiveAssistantId(null);
          }}
          colleges={visibleColleges}
          departments={visibleDepartments}
          collegeDepartmentsMap={visibleCollegeDepartmentsMap}
          initialValues={
            activeAssistant
              ? {
                  ...splitName(activeAssistant.name),
                  universityId: activeAssistant.universityId ?? "",
                  college: activeAssistant.college,
                  department: activeAssistant.department,
                  email: activeAssistant.email,
                  isActive: activeAssistant.isActive,
                }
              : undefined
          }
          emailHelpText={
            activeAssistant?.assistantType === "student_assistant"
              ? "Only @my.xu.edu.ph email addresses are allowed"
              : "Only @xu.edu.ph email addresses are allowed"
          }
          emailDisabled={true}
          onSave={(payload: DepartmentAssistantPayload) => {
            if (!activeAssistant) return;
            (async () => {
              // Email is immutable after creation; always send the stored email
              const r = await fetch(`${apiBase}/${activeAssistant.id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  firstName: payload.firstName,
                  middleName: payload.middleName,
                  lastName: payload.lastName,
                  universityId: payload.universityId,
                  email: activeAssistant.email,
                  isActive: payload.isActive,
                  college: payload.college,
                  department: payload.department,
                  assistantType: activeAssistant.assistantType,
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

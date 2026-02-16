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

import { useState } from "react";

import { Link } from "react-router-dom";

export default function HROAssistantList() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<StudentAssistantItem[]>([
    {
      id: "35858832",
      name: "Angela Santos",
      college: "College of Arts & Sciences",
      department: "Psychology",
      email: "angela.santos@my.xu.edu.ph",
    },
    {
      id: "586446",
      name: "Mark Biera",
      college: "College of Computer Studies",
      department: "Computer Science",
      email: "mark.biera@my.xu.edu.ph",
    },
    {
      id: "23395",
      name: "Joshua Alonzo",
      college: "College of Nursing",
      department: "N/A",
      email: "joshua.alonzo@my.xu.edu.ph",
    },
  ]);

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
                <Link to="/action">Action</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage> Approver Assistants</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
       
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
          onCreate={(payload: DepartmentAssistantPayload) => {
            const name = [payload.firstName, payload.middleName, payload.lastName]
              .filter(Boolean)
              .join(" ")
              .trim();

            setItems((prev) => [
              {
                id: payload.universityId || `${Date.now()}`,
                name: name || "New Assistant",
                college: payload.college,
                department: payload.department,
                email: payload.email,
              },
              ...prev,
            ]);
          }}
        />

        <EditDepartmentAssistantDialog
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) setActiveAssistantId(null);
          }}
          initialValues={
            activeAssistant
              ? {
                  ...splitName(activeAssistant.name),
                  universityId: activeAssistant.id,
                  college: activeAssistant.college,
                  department: activeAssistant.department,
                  email: activeAssistant.email,
                }
              : undefined
          }
          onSave={(payload: DepartmentAssistantPayload) => {
            if (!activeAssistant) return;
            const name = [payload.firstName, payload.middleName, payload.lastName]
              .filter(Boolean)
              .join(" ")
              .trim();

            setItems((prev) =>
              prev.map((p) =>
                p.id !== activeAssistant.id
                  ? p
                  : {
                      ...p,
                      name: name || p.name,
                      college: payload.college,
                      department: payload.department,
                      email: payload.email,
                    }
              )
            );
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
          onRemove={() => {
            if (!activeAssistant) return;
            setItems((prev) => prev.filter((p) => p.id !== activeAssistant.id));
          }}
        />

        
      </main>
    </div>
  );
}

import * as React from "react";

import { Search, Upload } from "lucide-react";

import { cn } from "../../components/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { Dialog, DialogContent } from "./dialog";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export type ClearanceProgressRow = {
  name: React.ReactNode;
  requestId: React.ReactNode;
  employeeId: React.ReactNode;
  college: React.ReactNode;
  department: React.ReactNode;
  facultyType: React.ReactNode;
  missingApproval: React.ReactNode;
  status: "INCOMPLETE" | "CLEARED" | "IN PROGRESS";
};

export type ClearanceProgressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ClearanceProgressRow[];
};

type OrgStructure = {
  colleges: { id: string; name: string; short: string }[];
  departments: { id: string; collegeId: string; name: string; short: string }[];
};

export function ClearanceProgressDialog({ open, onOpenChange, rows }: ClearanceProgressDialogProps) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("college");
  const [statusFilter, setStatusFilter] = React.useState<"complete" | "incomplete">("incomplete");
  const [facultyTypeFilter, setFacultyTypeFilter] = React.useState<"" | "all" | "part_time" | "full_time">("");
  const [collegeFilter, setCollegeFilter] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("");
  const [orgStructure, setOrgStructure] = React.useState<OrgStructure | null>(null);
  const [loadingOrgStructure, setLoadingOrgStructure] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setSort("college");
    setStatusFilter("incomplete");
    setFacultyTypeFilter("");
    setCollegeFilter("");
    setDepartmentFilter("");
    
    // Fetch org structure data for dropdowns
    setLoadingOrgStructure(true);
    fetch("/admin/xu-faculty-clearance/api/ovphe/org-structure")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: OrgStructure) => {
        setOrgStructure(data);
      })
      .catch(() => {
        setOrgStructure(null);
      })
      .finally(() => {
        setLoadingOrgStructure(false);
      });
  }, [open]);

  // Reset department filter when college changes
  React.useEffect(() => {
    setDepartmentFilter("");
  }, [collegeFilter]);

  // Filter departments based on selected college
  const availableDepartments = React.useMemo(() => {
    if (!orgStructure) return [];
    
    if (!collegeFilter || collegeFilter === "" || collegeFilter === "all") {
      return orgStructure.departments;
    }
    
    return orgStructure.departments.filter(dept => dept.collegeId === collegeFilter);
  }, [orgStructure, collegeFilter]);

  const filteredRows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rows;

    const statusFiltered = base.filter((r) => {
      if (statusFilter === "complete") return r.status === "CLEARED";
      return r.status === "INCOMPLETE";
    });

    const facultyTypeFiltered = statusFiltered.filter((r) => {
      if (!facultyTypeFilter || facultyTypeFilter === "all") return true;
      const t = String(r.facultyType ?? "").trim().toLowerCase();
      if (facultyTypeFilter === "part_time") return t.includes("part") || t.includes("part-time") || t.includes("part time");
      if (facultyTypeFilter === "full_time") return t.includes("full") || t.includes("full-time") || t.includes("full time");
      return true;
    });

    const collegeFiltered = facultyTypeFiltered.filter((r) => {
      if (!collegeFilter || collegeFilter === "" || collegeFilter === "all") return true;
      const collegeName = String(r.college ?? "").trim().toLowerCase();
      
      // Find college by ID to get name for comparison
      if (orgStructure) {
        const college = orgStructure.colleges.find(c => c.id === collegeFilter);
        if (college) {
          return collegeName === college.name.toLowerCase();
        }
      }
      
      // Fallback to direct string comparison
      return collegeName === collegeFilter.toLowerCase();
    });

    const departmentFiltered = collegeFiltered.filter((r) => {
      if (!departmentFilter || departmentFilter === "" || departmentFilter === "all") return true;
      const departmentName = String(r.department ?? "").trim().toLowerCase();
      
      // Find department by ID to get name for comparison
      if (orgStructure) {
        const department = orgStructure.departments.find(d => d.id === departmentFilter);
        if (department) {
          return departmentName === department.name.toLowerCase();
        }
      }
      
      // Fallback to direct string comparison
      return departmentName === departmentFilter.toLowerCase();
    });

    if (!q) return departmentFiltered;

    return departmentFiltered.filter((r) => {
      const asText = [r.name, r.requestId, r.employeeId, r.college, r.department]
        .map((x) => (typeof x === "string" ? x : ""))
        .join(" ")
        .toLowerCase();
      return asText.includes(q);
    });
  }, [facultyTypeFilter, query, rows, statusFilter, collegeFilter, departmentFilter, orgStructure]);

  const sortedRows = React.useMemo(() => {
    const clone = [...filteredRows];

    const toStr = (v: React.ReactNode) => (typeof v === "string" ? v : "");

    const keyMap: Record<string, (r: ClearanceProgressRow) => React.ReactNode> = {
      name: (r) => r.name,
      request_id: (r) => r.requestId,
      employee_id: (r) => r.employeeId,
      college: (r) => r.college,
      department: (r) => r.department,
      faculty_type: (r) => r.facultyType,
    };

    const getter = keyMap[sort] ?? keyMap.college;
    clone.sort((a, b) => toStr(getter(a)).localeCompare(toStr(getter(b))));

    return clone;
  }, [filteredRows, sort]);

  const sortLabel: Record<string, string> = {
    name: "Name",
    request_id: "Request ID",
    employee_id: "Employee ID",
    college: "College",
    department: "Department",
    faculty_type: "Faculty Type",
  };

  const statusLabel: Record<typeof statusFilter, string> = {
    complete: "Complete",
    incomplete: "Incomplete",
  };

  const exportToExcel = () => {
    const header = [
      "Name",
      "Request ID",
      "Employee ID",
      "College",
      "Department",
      "Faculty Type",
      "Missing Approval",
      "Status",
    ];

    const lines = [
      header,
      ...sortedRows.map((r) => [
        String(r.name ?? ""),
        String(r.requestId ?? ""),
        String(r.employeeId ?? ""),
        String(r.college ?? ""),
        String(r.department ?? ""),
        String(r.facultyType ?? ""),
        String(r.missingApproval ?? ""),
        r.status,
      ]),
    ];

    const csv = lines
      .map((line) =>
        line
          .map((cell) => {
            const s = String(cell ?? "");
            const escaped = s.replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clearance-progress.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: ClearanceProgressRow["status"]) => {
    if (status === "CLEARED") return <Badge variant="success">CLEARED</Badge>;
    if (status === "IN PROGRESS") return <Badge variant="secondary">IN PROGRESS</Badge>;
    return <Badge variant="warning">INCOMPLETE</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-fit max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-hidden rounded-xl p-0">
        <div className="rounded-xl bg-background">
          <div className="px-6 pb-4 pt-6">
            <div className="pr-10 text-center text-lg font-bold text-foreground sm:text-left">Clearance Progress</div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="relative w-full sm:min-w-[260px] sm:flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  size="sm"
                  placeholder="Search by Name or ID"
                  className="pr-10"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Search className="h-4 w-4" />
                </div>
              </div>

              <div className="flex w-full flex-col gap-3">
                <div className="flex flex-wrap gap-2 sm:justify-start">
                  <div className="w-full sm:w-auto sm:min-w-[190px]">
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger
                        variant="primaryoutline"
                        className="w-full h-auto sm:h-8 sm:py-0 py-2 whitespace-normal sm:whitespace-nowrap"
                      >
                        <div className="min-w-0 text-left leading-tight whitespace-normal sm:whitespace-nowrap">
                          Sort by: {sortLabel[sort] ?? "College"}
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="request_id">Request ID</SelectItem>
                        <SelectItem value="employee_id">Employee ID</SelectItem>
                        <SelectItem value="college">College</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-auto sm:min-w-[190px]">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                      <SelectTrigger
                        variant="primaryoutline"
                        className="w-full h-auto sm:h-8 sm:py-0 py-2 whitespace-normal sm:whitespace-nowrap"
                      >
                        <div className="min-w-0 text-left leading-tight whitespace-normal sm:whitespace-nowrap">
                          Status: {statusLabel[statusFilter]}
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-auto sm:min-w-[190px]">
                    <Select
                      value={facultyTypeFilter}
                      onValueChange={(v) => setFacultyTypeFilter(v as typeof facultyTypeFilter)}
                    >
                      <SelectTrigger
                        variant="primaryoutline"
                        className="w-full h-auto sm:h-8 sm:py-0 py-2 whitespace-normal sm:whitespace-nowrap"
                      >
                        <SelectValue placeholder="Faculty Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Faculty</SelectItem>
                        <SelectItem value="part_time">Part-time </SelectItem>
                        <SelectItem value="full_time">Full-time </SelectItem>                        
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-auto sm:min-w-[190px]">
                    <Select
                      value={collegeFilter}
                      onValueChange={setCollegeFilter}
                      disabled={loadingOrgStructure}
                    >
                      <SelectTrigger
                        variant="primaryoutline"
                        className="w-full h-auto sm:h-8 sm:py-0 py-2 whitespace-normal sm:whitespace-nowrap"
                      >
                        <SelectValue placeholder={loadingOrgStructure ? "Loading..." : "College"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Colleges</SelectItem>
                        {orgStructure?.colleges.map((college) => (
                          <SelectItem key={college.id} value={college.id}>
                            {college.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-auto sm:min-w-[190px]">
                    <Select
                      value={departmentFilter}
                      onValueChange={setDepartmentFilter}
                      disabled={loadingOrgStructure}
                    >
                      <SelectTrigger
                        variant="primaryoutline"
                        className="w-full h-auto sm:h-8 sm:py-0 py-2 whitespace-normal sm:whitespace-nowrap"
                      >
                        <SelectValue placeholder={loadingOrgStructure ? "Loading..." : "Department"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {availableDepartments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    className="h-8 w-full sm:w-auto whitespace-nowrap rounded-md px-4 text-sm"
                    onClick={exportToExcel}
                  >
                    <Upload className="h-4 w-4" />
                    Export to Excel
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--gray-border))]" />

          <div className="max-h-[calc(100vh-12rem)] overflow-auto">
            <div className="sm:hidden">
              <div className="divide-y divide-black/10">
                {sortedRows.map((r, idx) => (
                  <div key={idx} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 text-sm font-bold text-gray-900">{r.name}</div>
                      <div className="shrink-0">{statusBadge(r.status)}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-xs text-gray-700">
                      <div className="font-semibold">Employee ID</div>
                      <div className="min-w-0 break-words">{r.employeeId}</div>

                      <div className="font-semibold">College</div>
                      <div className="min-w-0 break-words">{r.college}</div>

                      <div className="font-semibold">Department</div>
                      <div className="min-w-0 break-words">{r.department}</div>

                      <div className="font-semibold">Faculty Type</div>
                      <div className="min-w-0 break-words">{r.facultyType}</div>

                      <div className="font-semibold">Missing Approval</div>
                      <div className="min-w-0 break-words">{r.missingApproval}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden sm:block xl:hidden">
              <div className="divide-y divide-black/10">
                {sortedRows.map((r, idx) => (
                  <div key={idx} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 text-sm font-bold text-gray-900">{r.name}</div>
                      <div className="shrink-0">{statusBadge(r.status)}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-[120px_1fr_120px_1fr] gap-x-4 gap-y-1 text-xs text-gray-700">
                      <div className="font-semibold">Request ID</div>
                      <div className="min-w-0 break-words">{r.requestId}</div>

                      <div className="font-semibold">Employee ID</div>
                      <div className="min-w-0 break-words">{r.employeeId}</div>

                      <div className="font-semibold">College</div>
                      <div className="min-w-0 break-words">{r.college}</div>

                      <div className="font-semibold">Department</div>
                      <div className="min-w-0 break-words">{r.department}</div>

                      <div className="font-semibold">Faculty Type</div>
                      <div className="min-w-0 break-words">{r.facultyType}</div>

                      <div className="font-semibold">Missing Approval</div>
                      <div className="min-w-0 break-words">{r.missingApproval}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden xl:block">
              <div className={cn("w-max max-w-full divide-y divide-black/10")}>
                <div className="grid grid-cols-[180px_110px_120px_170px_170px_130px_150px_120px] bg-slate-50 px-6 py-3 text-xs font-bold text-primary">
                  <div>Name</div>
                  <div>Request ID</div>
                  <div>Employee ID</div>
                  <div>College</div>
                  <div>Department</div>
                  <div>Faculty Type</div>
                  <div>Missing Approval</div>
                  <div className="text-center">Status</div>
                </div>

                {sortedRows.map((r, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[180px_110px_120px_170px_170px_130px_150px_120px] items-center px-6 py-4 text-xs text-gray-700"
                  >
                    <div className="min-w-0 break-words font-medium text-gray-900">{r.name}</div>
                    <div className="text-gray-700">{r.requestId}</div>
                    <div className="text-gray-700">{r.employeeId}</div>
                    <div className="min-w-0 break-words">{r.college}</div>
                    <div className="min-w-0 break-words">{r.department}</div>
                    <div className="min-w-0 break-words">{r.facultyType}</div>
                    <div className="min-w-0 break-words">{r.missingApproval}</div>
                    <div className="flex justify-center">{statusBadge(r.status)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

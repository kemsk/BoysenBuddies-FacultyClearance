import * as React from "react";

import "../../index.css"; 
import { DynamicApproverHeader } from "../../stories/components/header";

import {
  ClearanceRequestsCard,
  type ClearanceRequestItem,
} from "../../stories/components/cards";

import { Button } from "../../stories/components/button";
import { Badge } from "../../stories/components/badge";
import { Checkbox } from "../../stories/components/checkbox";
import { ApproveConfirmDialog, RejectAlertDialog } from "../../stories/components/clearance-action-dialogs";
import { Check } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../stories/components/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { SearchInputGroup } from "../../stories/components/input-group";
import { useState } from "react";

export default function ApproverViewClearance() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const timelineId = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("timelineId") || "";
  }, []);

  const [requests, setRequests] = React.useState<ClearanceRequestItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [bulkLoading, setBulkLoading] = React.useState(false);

  React.useEffect(() => {
    if (!timelineId) {
      setRequests([]);
      return;
    }

    const params = new URLSearchParams({ timelineId });

    fetch(`/admin/xu-faculty-clearance/api/approver/view-clearance?${params.toString()}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items?: Array<Omit<ClearanceRequestItem, "status" | "requestId"> & { status?: string }> }) => {
        const next: ClearanceRequestItem[] = Array.isArray(data?.items)
          ? data.items.map((item) => ({
              ...item,
              requestId: item.employeeId || item.id,
              status: item.status === "COMPLETED" ? "approved" as const : "pending" as const,
            }))
          : [];
        setRequests(next);
      })
      .catch(() => {
        setRequests([]);
      });
  }, [timelineId]);

  const filteredRequests = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const hay = [r.requestId, r.employeeId, r.name, r.college, r.department, r.facultyType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, requests]);

  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [filteredRequests]);

  function getCookie(name: string): string {
    let cookieValue = "";
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  function getClearanceStatusBadgeVariant(status: ClearanceRequestItem["status"]) {
    if (status === "approved") return "success" as const;
    if (status === "rejected") return "destructive" as const;
    return "warning" as const;
  }

  const handleBulkApprove = React.useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/approver/action", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        body: JSON.stringify({
          request_ids: Array.from(selectedIds),
          action: "approve",
          remarks: "",
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((data && (data.detail || data.message)) || `Failed to approve: ${response.statusText}`);
      }

      window.location.reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to approve requests");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds]);

  const handleBulkReject = React.useCallback(async (reason: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/approver/action", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken") || "",
        },
        body: JSON.stringify({
          request_ids: Array.from(selectedIds),
          action: "reject",
          remarks: reason,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((data && (data.detail || data.message)) || `Failed to reject: ${response.statusText}`);
      }

      window.location.reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to reject requests");
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds]);

  const handleExport = React.useCallback(() => {
    if (!timelineId || filteredRequests.length === 0) return;

    const headers = ["Employee ID", "Name", "College", "Department", "Faculty Type", "Status"];
    const rows = filteredRequests.map((item) => [
      item.employeeId,
      item.name,
      item.college,
      item.department,
      item.facultyType,
      item.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `approver-archived-clearance-${timelineId}-export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredRequests, timelineId]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <DynamicApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4 mt-2 space-y-3 w-full">

        <h1 className="text-2xl text-left text-primary font-bold">2501 Faculty Clearance</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/approver-action">Action</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/approver-archived-clearance">View Clearance Records</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
                <BreadcrumbItem>
                <BreadcrumbPage>2501 Faculty Clearance</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/approver-archived-clearance")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>

        <div className="mt-5 space-y-5">
          <div className="w-full mt-5">
            <SearchInputGroup
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerClassName="h-10"
              placeholder="Search by name, ID, or email..."
            />
          </div>
        </div>

        <div className="mt-3 space-y-4">
          <div className="w-full flex flex-col sm:flex-row gap-3 justify-start mt-5" style={{ marginLeft: '0', paddingLeft: '0' }}>
              <div className="flex flex-wrap gap-3">
                <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <label>Sort by:</label>
                  <SelectValue/> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="requestId">Request ID</SelectItem>
                  <SelectItem value="universityId">University ID</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="facultyType">Faculty Type</SelectItem>
                </SelectContent>
              </Select>
            
              <Select>
                <SelectTrigger variant="pill" className="w-max gap-2">
                  <label>Status:</label>
                  <SelectValue/> 
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
              </div>
          </div>

          <div className="flex justify-between gap-3 mt-4">
            <Button variant="default" className="w-full font-bold whitespace-nowrap" onClick={handleExport} disabled={filteredRequests.length === 0}> 
              <div className="flex items-center justify-center gap-2">
                <img src="/WhiteDownloadIcon.png" alt="export" className="w-6 h-6" />
                <span>Export Current View</span>
              </div>  
            </Button>
          </div>
          
          <div className="mt-3">
            <div className="mt-6">
              <div className="hidden lg:block">
                <div className="overflow-hidden rounded-xl border border-muted-foreground/20 bg-card shadow">
                  <div className="overflow-x-auto">
                    <div className="flex items-center gap-3 border-b border-muted-foreground/20 px-4 py-4 text-black">
                      <Checkbox
                        variant="primary"
                        checked={filteredRequests.length > 0 && selectedIds.size === filteredRequests.length}
                        onCheckedChange={(v) => {
                          if (v) {
                            setSelectedIds(new Set(filteredRequests.map((i) => i.id)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                      <div className="text-sm font-bold text-primary">Select All</div>
                      {selectedIds.size > 0 ? (
                        <div className="ml-auto flex items-center gap-2">
                          <RejectAlertDialog
                            count={selectedIds.size}
                            trigger={
                              <Button
                                type="button"
                                variant="destructive"
                                className="h-8 rounded-md px-4 text-sm font-semibold"
                                disabled={bulkLoading}
                              >
                                Reject
                              </Button>
                            }
                            onReject={handleBulkReject}
                          />
                          <ApproveConfirmDialog
                            count={selectedIds.size}
                            trigger={
                              <Button
                                type="button"
                                className="h-8 rounded-md bg-[hsl(var(--success))] px-4 text-sm font-semibold text-white hover:bg-[hsl(var(--success))]/90"
                                disabled={bulkLoading}
                              >
                                <div className="flex items-center gap-2">
                                  <Check className="h-4 w-4" /> Approve
                                </div>
                              </Button>
                            }
                            onApprove={handleBulkApprove}
                          />
                        </div>
                      ) : null}
                    </div>

                    <table className="w-full border-collapse text-left text-sm text-black">
                      <thead className="bg-white">
                        <tr className="border-b border-muted-foreground/20">
                          <th className="w-12 px-4 py-3 font-semibold" />
                          <th className="px-4 py-3 font-semibold">Name</th>
                          <th className="px-4 py-3 font-semibold">Request ID</th>
                          <th className="px-4 py-3 font-semibold">Employee ID</th>
                          <th className="px-4 py-3 font-semibold">College</th>
                          <th className="px-4 py-3 font-semibold">Department</th>
                          <th className="px-4 py-3 font-semibold">Requirement</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map((item) => (
                          <tr key={item.id} className="border-b border-muted-foreground/20 last:border-b-0">
                            <td className="px-4 py-4 align-top">
                              <Checkbox
                                variant="primary"
                                checked={selectedIds.has(item.id)}
                                onCheckedChange={() => {
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(item.id)) next.delete(item.id);
                                    else next.add(item.id);
                                    return next;
                                  });
                                }}
                              />
                            </td>
                            <td className="px-4 py-4 align-top font-semibold text-primary">
                              <Link
                                to={`/approver-archived-individual?timelineId=${encodeURIComponent(timelineId)}&archivedId=${encodeURIComponent(item.id)}`}
                                className="block max-w-[220px] truncate"
                                title={item.name}
                              >
                                {item.name}
                              </Link>
                            </td>
                            <td className="px-4 py-4 align-top">{item.requestId}</td>
                            <td className="px-4 py-4 align-top">{item.employeeId}</td>
                            <td className="px-4 py-4 align-top">
                              <div className="max-w-[220px] whitespace-pre-wrap">{item.college}</div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="max-w-[220px] whitespace-pre-wrap">{item.department}</div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="max-w-[220px] whitespace-pre-wrap">{item.requirementTitle || "-"}</div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <Badge
                                variant={getClearanceStatusBadgeVariant(item.status)}
                                className="px-3 py-1 text-xs font-bold"
                              >
                                {item.status.toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="lg:hidden">
                <ClearanceRequestsCard
                  items={filteredRequests}
                  getItemHref={(item) => `/approver-archived-individual?timelineId=${encodeURIComponent(timelineId)}&archivedId=${encodeURIComponent(item.id)}`}
                />
              </div>
            </div>
          </div>
        </div>


      </main>

    </div>
  );
}

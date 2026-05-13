import "../../index.css"; 
import { DynamicApproverHeader } from "../../stories/components/header";
import * as React from "react";

import {
  RequirementEditCard,
  AgreementCard,
  TrueAgreementCard,
} from "../../stories/components/requirements-list-card";

import { AddRequirementDialog } from "../../stories/components/add-requirement-dialog";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../stories/components/button";
import { SuccessMessageCard } from "../../stories/components/status-message-card";
import { ErrorModal } from "../../stories/components/success-and-error-modals";

type Requirement = {
  id: number;
  title: string;
  description: string;
  physicalSubmission: boolean;
  recipients: string;
  lastUpdated: string;
  createdBy: string;
  clearanceTimeline: string;
  recipientScope: string;
  targetColleges: number[];
  targetDepartments: number[];
  targetOffices: number[];
  targetFaculty: number[];
  facultyType?: string;
  faculty_type?: string;
};

export default function RequirementList() {
  console.log("=== RequirementList component loaded ===");
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showTrueAgreement, setShowTrueAgreement] = React.useState(false);
  const [requirements, setRequirements] = React.useState<Requirement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeAcademicYear, setActiveAcademicYear] = React.useState<string>("");
  const [activeSemester, setActiveSemester] = React.useState<string>("");
  const [editingRequirement, setEditingRequirement] = React.useState<Requirement | null>(null);
  const [pendingChanges, setPendingChanges] = React.useState<any[]>([]);
  const [approverName, setApproverName] = React.useState<string>("");
  const [currentUserId, setCurrentUserId] = React.useState<number | null>(null);
  const [isPartOfApproverFlow, setIsPartOfApproverFlow] = React.useState<boolean>(false);
  const [errorModalOpen, setErrorModalOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const hasActiveTimeline = Boolean(activeAcademicYear && activeSemester);

  // Debug state values
  React.useEffect(() => {
    console.log("State debug:", {
      activeAcademicYear,
      activeSemester,
      hasActiveTimeline,
      isPartOfApproverFlow
    });
  }, [activeAcademicYear, activeSemester, hasActiveTimeline, isPartOfApproverFlow]);

  // Fetch current approver name and user ID
  React.useEffect(() => {
    const fetchApprover = async () => {
      try {
        console.log("Fetching user profile...");
        const r = await fetch("/admin/xu-faculty-clearance/api/me", { credentials: "include" });
        console.log("API response status:", r.status);
        
        if (r.ok) {
          const data = await r.json();
          console.log("Full user data:", data);
          
          const email = data.email;
          const idValue = typeof data.id === "string" ? parseInt(data.id, 10) : data.id;
          if (Number.isFinite(idValue)) setCurrentUserId(idValue);

          const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
          setApproverName(name || email || "Approver");

          // Check if user is part of approver flow
          console.log("User roles payload:", data.roles_payload);
          const approverRole = data.roles_payload?.find(
            (role: any) => role.role_name === "Approver" || role.role_name === "ASSISTANT_APPROVER" || role.role_name === "Student Assistant"
          );
          console.log("Found approver role:", approverRole);
          
          if (approverRole) {
            // Check if user has approver profile (means they're configured in approver flow)
            try {
              const profileResponse = await fetch("/admin/xu-faculty-clearance/api/approver/profile", { credentials: "include" });
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log("Approver profile:", profileData);
                
                // If user has an approver profile, they're part of the approver flow
                const hasProfile = profileData !== null && profileData !== undefined;
                console.log("Has approver profile (in approver flow):", hasProfile);
                setIsPartOfApproverFlow(hasProfile);
              } else {
                console.log("Failed to fetch approver profile");
                setIsPartOfApproverFlow(false);
              }
            } catch (error) {
              console.log("Error checking approver profile:", error);
              setErrorMessage("Failed to check approver profile. Please try again.");
              setErrorModalOpen(true);
              setIsPartOfApproverFlow(false);
            }
          } else {
            console.log("User is not an approver");
            setIsPartOfApproverFlow(false);
          }
        } else {
          console.log("API call failed with status:", r.status);
        }
      } catch (error) {
        console.log("Error fetching user profile:", error);
        setErrorMessage("Failed to fetch user profile. Please try again.");
        setErrorModalOpen(true);
        setApproverName("Approver");
        setIsPartOfApproverFlow(false);
      }
    };
    fetchApprover();
  }, []);

  // Fetch requirements from API
  const fetchRequirements = React.useCallback(async () => {
    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/approver/requirement-list");
      if (response.ok) {
        const data = await response.json();
        setRequirements(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch requirements:", error);
      setErrorMessage("Failed to fetch requirements. Please try again.");
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRequirements();
    // Don't load pending changes on refresh - only keep them in local storage
    // This ensures page shows saved state, not pending state
  }, [fetchRequirements]);

  React.useEffect(() => {
    const fetchActiveTimeline = async () => {
      try {
        const r = await fetch("/admin/xu-faculty-clearance/api/active-clearance-timeline", {
          credentials: "include",
        });
        if (!r.ok) return;
        const data = (await r.json()) as { academicYear?: string; semester?: string };
        setActiveAcademicYear((data.academicYear || "").trim());
        setActiveSemester((data.semester || "").trim());
      } catch {
        setActiveAcademicYear("");
        setActiveSemester("");
      }
    };

    fetchActiveTimeline();
  }, []);

  // Update local storage when pending changes change
  React.useEffect(() => {
    if (pendingChanges.length > 0) {
      localStorage.setItem('pendingRequirementChanges', JSON.stringify(pendingChanges));
    } else {
      localStorage.removeItem('pendingRequirementChanges');
    }
  }, [pendingChanges]);

  // Auto-open edit dialog when editingRequirement is set
  React.useEffect(() => {
    if (editingRequirement) {
      // Find and click the hidden trigger button
      const triggerButton = document.querySelector('[data-edit-trigger="true"]') as HTMLButtonElement;
      if (triggerButton) {
        setTimeout(() => triggerButton.click(), 0);
      }
    }
  }, [editingRequirement]);

  const handleAddRequirement = async (payload: any) => {
    // Create temporary requirement for immediate display
    const tempId = Date.now(); // Use number directly for consistency
    const tempRequirement: Requirement = {
      id: tempId,
      title: payload.title,
      description: payload.description,
      physicalSubmission: payload.physicalSubmission,
      recipients: payload.recipientScope === "individual" ? "Individual Faculty" : `${payload.targetColleges?.length || 0} colleges, ${payload.targetDepartments?.length || 0} departments`,
      lastUpdated: new Date().toISOString(),
      createdBy: "Current User",
      clearanceTimeline: "Pending",
      recipientScope: payload.recipientScope || "individual",
      targetColleges: payload.targetColleges || [],
      targetDepartments: payload.targetDepartments || [],
      targetOffices: payload.targetOffices || [],
      targetFaculty: payload.targetFaculty || [],
      facultyType: payload.facultyType,
    };

    // Store in local storage as pending change
    const pendingChange = {
      type: 'create',
      id: tempId,
      data: tempRequirement,
      timestamp: new Date().toISOString()
    };
    setPendingChanges(prev => [...prev, pendingChange]);
  };

  const handleEditRequirement = async (payload: any) => {
    if (!editingRequirement) return;

    // Store in local storage as pending change
    const pendingChange = {
      type: 'update',
      id: editingRequirement.id,
      data: {
        title: payload.title,
        description: payload.description,
        physicalSubmission: payload.physicalSubmission,
        recipientScope: payload.recipientScope || editingRequirement.recipientScope,
        targetColleges: payload.targetColleges || editingRequirement.targetColleges,
        targetDepartments: payload.targetDepartments || editingRequirement.targetDepartments,
        targetOffices: payload.targetOffices || editingRequirement.targetOffices,
        targetFaculty: payload.facultyIds || editingRequirement.targetFaculty,
        facultyType: payload.facultyType || editingRequirement.facultyType,
      },
      timestamp: new Date().toISOString()
    };
    setPendingChanges(prev => [...prev, pendingChange]);
  };

  const handleDeleteRequirement = async (requirement: Requirement) => {
    // Store in local storage as pending change
    const pendingChange = {
      type: 'delete',
      id: requirement.id,
      data: requirement,
      timestamp: new Date().toISOString()
    };
    setPendingChanges(prev => [...prev, pendingChange]);
  };

  // Function to commit all pending changes
  const commitPendingChanges = async (): Promise<boolean> => {
    if (pendingChanges.length === 0) return true;

    try {
      const createdTitles = pendingChanges
        .filter((c) => c.type === "create")
        .map((c) => (c?.data?.title ? String(c.data.title) : ""))
        .filter((t) => t.trim() !== "");

      const updatedTitles = pendingChanges
        .filter((c) => c.type === "update")
        .map((c) => {
          const direct = c?.data?.title ? String(c.data.title) : "";
          if (direct.trim()) return direct;
          const fallback = requirements.find((r) => r.id === c?.id)?.title;
          return fallback ? String(fallback) : "";
        })
        .filter((t) => t.trim() !== "");

      const deletedTitles = pendingChanges
        .filter((c) => c.type === "delete")
        .map((c) => (c?.data?.title ? String(c.data.title) : ""))
        .filter((t) => t.trim() !== "");

      const details = [
        "Edited Multiple Requirements",
        createdTitles.length ? `Created: ${createdTitles.join(", ")}` : "",
        updatedTitles.length ? `Updated: ${updatedTitles.join(", ")}` : "",
        deletedTitles.length ? `Deleted: ${deletedTitles.join(", ")}` : "",
      ].filter(Boolean);

      try {
        await fetch("/admin/xu-faculty-clearance/api/approver/activity-logs", {
          method: "POST",
          credentials: "include",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "edited_requirement",
            user_role: "Approver",
            details,
          }),
        });
      } catch {
      }

      // Process each pending change
      for (const change of pendingChanges) {
        if (change.type === 'create') {
          const response = await fetch("/admin/xu-faculty-clearance/api/approver/requirement-list", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify(change.data),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to create requirement: ${response.status} ${response.statusText}`);
          }

          // POST Requirement Edited notification for the created requirement
          try {
            const deptTitle = change.data.targetDepartments?.length ? change.data.targetDepartments.join(", ") : "";
            const collegeTitle = change.data.targetColleges?.length ? change.data.targetColleges.join(", ") : "";
            const officeTitle = change.data.targetOffices?.length ? change.data.targetOffices.join(", ") : "";
            const scopeLabel = officeTitle || deptTitle || "";
            const requirementTitle = change.data.title || "Requirement";

            // Helper to create a notification for a specific user
            const createNotifForUser = async (
              userId: number | null,
              userRole: "Approver" | "Assistant",
            ) => {
              const notifResponse = await fetch("/admin/xu-faculty-clearance/api/faculty/notifications", {
                method: "POST",
                credentials: "include",
                keepalive: true,
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify({
                  ...(userId ? { user: userId } : {}),
                  title: "Requirement Edited",
                  status: null,
                  body: `${approverName} edited the requirement "${requirementTitle}" for ${scopeLabel}.`,
                  details: [
                    `Approver Name = ${approverName}`,
                    `Requirement Title = ${requirementTitle}`,
                    `Department = ${deptTitle}`,
                    `College = ${collegeTitle}`,
                    `Office = ${officeTitle}`,
                  ],
                  user_role: userRole,
                  is_read: false,
                }),
              });
              if (!notifResponse.ok) {
                console.warn(`[notification] Requirement Edited POST failed for user ${userId}:`, notifResponse.status, await notifResponse.text());
              } else {
                console.log(`[notification] Requirement Edited created successfully for user ${userId}`);
              }
            };

            // 1. Notification for session user (approver)
            await createNotifForUser(currentUserId, "Approver");

            // 2. If we have a current user ID, fetch assistants under this supervisor and notify them
            if (currentUserId) {
              try {
                const assistantsRes = await fetch(`/admin/xu-faculty-clearance/api/approver/assistant-approvers`, {
                  credentials: "include",
                });
                if (assistantsRes.ok) {
                  const assistantsData = await assistantsRes.json();
                  const items = Array.isArray(assistantsData.items) ? assistantsData.items : [];
                  for (const assistant of items) {
                    const assistantIdRaw = assistant?.id;
                    const assistantId = typeof assistantIdRaw === "string" ? parseInt(assistantIdRaw, 10) : assistantIdRaw;
                    if (Number.isFinite(assistantId)) {
                      await createNotifForUser(assistantId, "Assistant");
                    }
                  }
                }
              } catch (e) {
                console.warn("[notification] Failed to fetch assistants for supervisor:", e);
              }
            }
          } catch (e) {
            console.warn("[notification] Requirement Edited POST error:", e);
          }
        } else if (change.type === 'update') {
          const response = await fetch(`/admin/xu-faculty-clearance/api/approver/requirement-list/${change.id}`, {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify(change.data),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update requirement: ${response.status} ${response.statusText}`);
          }
        } else if (change.type === 'delete') {
          const response = await fetch(`/admin/xu-faculty-clearance/api/approver/requirement-list/${change.id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete requirement: ${response.status} ${response.statusText}`);
          }
        }
      }

      // Clear pending changes
      setPendingChanges([]);
      
      // Refresh requirements
      fetchRequirements();
      
      return true; // Success
    } catch (error) {
      console.error("Failed to commit pending changes:", error);
      setErrorMessage("Failed to save changes. Please try again.");
      setErrorModalOpen(true);
      
      return false; // Failure
    }
  };

  // Helper function to get CSRF token
  function getCookie(name: string): string {
    let cookieValue = "";
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <DynamicApproverHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-[1in] pt-4 pb-4 w-full">
        
        <h1 className="text-2xl text-left text-primary font-bold">Requirement List</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/approver-dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Requirement List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pendingChanges.length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                {pendingChanges.length} pending change{pendingChanges.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Button variant="back" size="back" onClick={() => navigate("/approver-action")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>
       
       <div className="mt-2 space-y-3">
        <AddRequirementDialog
          trigger={
            <Button variant="default" className="w-full h-12" disabled={!isPartOfApproverFlow || !hasActiveTimeline}>
              <div className="flex w-full items-center justify-center gap-2">
              <img src="WhitePlusIcon.png" alt="Add Requirement" />Add Requirement
              </div>
            </Button>
          }
          onSave={handleAddRequirement}
        />

        {loading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading requirements...</div>
          </div>
        ) : requirements.length === 0 && pendingChanges.filter(change => change.type === 'create').length === 0 ? (
          <div className="text-center py-8">
            {!hasActiveTimeline ? (
              <div className="text-muted-foreground">
                There is no Clearance Timeline activated
              </div>
            ) : !isPartOfApproverFlow ? (
              <div className="text-muted-foreground">
                Your department/office is not a part of the
                <br />
                [School Year] [Semester] Approver Flow
                <br />
                <br />
                Contact ciso@xu.edu.ph to configure your department/office.
              </div>
            ) : (
              <div className="text-muted-foreground">No requirements found. Create your first requirement above.</div>
            )}
          </div>
        ) : (
          (() => {
            // Combine existing requirements with pending creates
            const displayRequirements = [...requirements];
            
            // Add pending creates
            const pendingCreates = pendingChanges
              .filter(change => change.type === 'create')
              .map(change => change.data as Requirement);
            
            const allRequirements = [...displayRequirements, ...pendingCreates];
            
            return allRequirements.map((requirement) => {
              const pendingChange = pendingChanges.find(change => 
                (change.type === 'update' && change.id === requirement.id) ||
                (change.type === 'delete' && change.id === requirement.id) ||
                (change.type === 'create' && change.id === requirement.id)
              );
              
              const isPendingDelete = pendingChange?.type === 'delete';
              const isPendingUpdate = pendingChange?.type === 'update';
              const isPendingCreate = pendingChange?.type === 'create';
              
              // Show items marked for deletion with special styling
              if (isPendingDelete) {
                return (
                  <div key={requirement.id} className="opacity-40">
                    <RequirementEditCard
                      title={requirement.title}
                      description={requirement.description}
                      submissionDeadline=""
                      Recipients={requirement.recipients}
                      FacultyType={String((requirement as Requirement).facultyType ?? (requirement as Requirement).faculty_type ?? "")}
                      LastUpdated={requirement.lastUpdated}
                      CreatedBy={requirement.createdBy}
                      ClearanceTimeline={requirement.clearanceTimeline}
                      physicalSubmission={requirement.physicalSubmission}
                      onEdit={() => {}} // Disable edit for pending deletions
                      onDelete={() => {}} // Disable delete for pending deletions
                    />
                    <div className="mt-2 text-center">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                        Pending Delete
                      </span>
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={requirement.id} className={(isPendingUpdate || isPendingCreate) ? 'opacity-60' : ''}>
                  <RequirementEditCard
                    title={isPendingUpdate ? pendingChange.data.title : requirement.title}
                    description={isPendingUpdate ? pendingChange.data.description : requirement.description}
                    submissionDeadline=""
                    Recipients={isPendingUpdate ? pendingChange.data.recipients : requirement.recipients}
                    FacultyType={String(
                      (isPendingUpdate ? pendingChange.data.facultyType : (requirement as Requirement).facultyType) ??
                      (isPendingUpdate ? pendingChange.data.faculty_type : (requirement as Requirement).faculty_type) ??
                      ""
                    )}
                    LastUpdated={isPendingUpdate ? pendingChange.data.lastUpdated : requirement.lastUpdated}
                    CreatedBy={isPendingUpdate ? pendingChange.data.createdBy : requirement.createdBy}
                    ClearanceTimeline={isPendingUpdate ? pendingChange.data.clearanceTimeline : requirement.clearanceTimeline}
                    physicalSubmission={isPendingUpdate ? pendingChange.data.physicalSubmission : requirement.physicalSubmission}
                    onEdit={() => setEditingRequirement(requirement)}
                    onDelete={() => handleDeleteRequirement(requirement)}
                  />
                  {(isPendingUpdate || isPendingCreate) && (
                    <div className="mt-2 text-center">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                        Pending {isPendingCreate ? 'Create' : 'Update'}
                      </span>
                    </div>
                  )}
                </div>
              );
            });
          })()
        )}

        {showTrueAgreement ? (
          <TrueAgreementCard
            onConfirm={() => {
              setShowTrueAgreement(false);
            }}
          />
        ) : showSuccess ? (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <SuccessMessageCard
              className="max-w"
              message="Agreement confirmed and changes saved."
              onContinue={() => {
                setShowSuccess(false);
                setShowTrueAgreement(true);
                window.location.reload();
              }}
            />
          </div>
        ) : (
          <>
            {pendingChanges.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">{pendingChanges.length} pending change{pendingChanges.length > 1 ? 's' : ''}:</span> Check all terms below to save your changes.
                </p>
              </div>
            )}
            <AgreementCard 
              disabled={!isPartOfApproverFlow || !hasActiveTimeline}
              onConfirm={async () => {
                let success = true;
                if (pendingChanges.length > 0) {
                  success = await commitPendingChanges();
                }
                if (success) {
                  setShowSuccess(true);
                }
              }} 
            />
          </>
        )}
       </div>
      </main>

      {/* Edit Requirement Dialog */}
      {editingRequirement && (
        <AddRequirementDialog
          key={editingRequirement.id}
          trigger={
            <button 
              data-edit-trigger="true"
              style={{ display: 'none' }}
            />
          }
          dialogTitle="Edit Requirement"
          saveLabel="Update"
          initialValues={{
            title: editingRequirement.title,
            description: editingRequirement.description,
            facultyIds: editingRequirement.targetFaculty.map(String),
            physicalSubmission: editingRequirement.physicalSubmission,
            recipientScope: editingRequirement.recipientScope,
            targetColleges: editingRequirement.targetColleges,
            targetDepartments: editingRequirement.targetDepartments,
            targetOffices: editingRequirement.targetOffices,
          }}
          onSave={(payload) => {
            handleEditRequirement(payload);
            setEditingRequirement(null);
          }}
          onCancel={() => {
            setEditingRequirement(null);
          }}
        />
      )}
      
      {/* Error Modal */}
      <ErrorModal
        open={errorModalOpen}
        onOpenChange={setErrorModalOpen}
        message={errorMessage}
        continueLabel="OK"
        onContinue={() => {
          // Clear pending changes to revert to original state
          setPendingChanges([]);
          // Refresh requirements to show current server state
          fetchRequirements();
        }}
      />
    </div>
  );
}

import "../../index.css"; 
import { ApprovalHeader } from "../../stories/components/header";
import * as React from "react";

import {
  RequirementEditCard,
  AgreementCard,
  TrueAgreementCard,
} from "../../stories/components/cards";

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
};

export default function RequirementList() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showTrueAgreement, setShowTrueAgreement] = React.useState(false);
  const [requirements, setRequirements] = React.useState<Requirement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingRequirement, setEditingRequirement] = React.useState<Requirement | null>(null);

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
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const handleAddRequirement = async (payload: any) => {
    try {
      const response = await fetch("/admin/xu-faculty-clearance/api/approver/requirement-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          physicalSubmission: payload.physicalSubmission,
          recipientScope: payload.recipientScope || "individual",
          targetColleges: payload.targetColleges || [],
          targetDepartments: payload.targetDepartments || [],
          targetOffices: payload.targetOffices || [],
          targetFaculty: payload.facultyIds || [],
        }),
      });

      if (response.ok) {
        fetchRequirements();
        setShowSuccess(true);
      } else {
        const error = await response.json();
        alert(`Failed to create requirement: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create requirement:", error);
      alert("Failed to create requirement. Please try again.");
    }
  };

  const handleEditRequirement = async (payload: any) => {
    if (!editingRequirement) return;

    try {
      const response = await fetch(`/admin/xu-faculty-clearance/api/approver/requirement-list/${editingRequirement.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          physicalSubmission: payload.physicalSubmission,
          recipientScope: payload.recipientScope || editingRequirement.recipientScope,
          targetColleges: payload.targetColleges || editingRequirement.targetColleges,
          targetDepartments: payload.targetDepartments || editingRequirement.targetDepartments,
          targetOffices: payload.targetOffices || editingRequirement.targetOffices,
          targetFaculty: payload.facultyIds || editingRequirement.targetFaculty,
        }),
      });

      if (response.ok) {
        fetchRequirements();
        setEditingRequirement(null);
        setShowSuccess(true);
      } else {
        const error = await response.json();
        alert(`Failed to update requirement: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to update requirement:", error);
      alert("Failed to update requirement. Please try again.");
    }
  };

  const handleDeleteRequirement = async (requirement: Requirement) => {
    if (!window.confirm(`Are you sure you want to delete "${requirement.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/admin/xu-faculty-clearance/api/approver/requirement-list/${requirement.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchRequirements();
        alert("Requirement deleted successfully");
      } else {
        const error = await response.json();
        alert(`Failed to delete requirement: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to delete requirement:", error);
      alert("Failed to delete requirement. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <ApprovalHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
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

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" size="back" onClick={() => navigate("/approver-action")}> 
            <div className="flex items-center gap-2">
              <img src="BlackArrowIcon.png" alt="back" className="h-4 w-4" />Back
            </div>
          </Button>
        </div>
       
       <div className="mt-2 space-y-3">
        <AddRequirementDialog
          trigger={
            <Button variant="default" className="w-full h-12">
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
        ) : requirements.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">No requirements found. Create your first requirement above.</div>
          </div>
        ) : (
          requirements.map((requirement) => (
            <RequirementEditCard
              key={requirement.id}
              title={requirement.title}
              description={requirement.description}
              submissionDeadline=""
              Recipients={requirement.recipients}
              LastUpdated={requirement.lastUpdated}
              CreatedBy={requirement.createdBy}
              ClearanceTimeline={requirement.clearanceTimeline}
              physicalSubmission={requirement.physicalSubmission}
              onEdit={() => setEditingRequirement(requirement)}
              onDelete={() => handleDeleteRequirement(requirement)}
            />
          ))
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
              message="Agreement confirmed."
              onContinue={() => {
                setShowSuccess(false);
                setShowTrueAgreement(true);
              }}
            />
          </div>
        ) : (
          <AgreementCard onConfirm={() => setShowSuccess(true)} />
        )}
       </div>
      </main>

      {/* Edit Requirement Dialog */}
      {editingRequirement && (
        <AddRequirementDialog
          trigger={<div />}
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
          onSave={handleEditRequirement}
        />
      )}
    </div>
  );
}

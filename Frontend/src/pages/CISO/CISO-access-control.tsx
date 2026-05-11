import * as React from "react";

import "../../index.css"; 
import { CISOHeader } from "../../stories/components/header";
import { AccessControlCard } from "../../stories/components/access-control-card";
import { CrudExplainer } from "../../stories/components/crud-explainer";
import { Button } from "../../stories/components/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../stories/components/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import { RoleDefinitionCard } from "../../stories/components/role-definition-card";

// Types for permissions
type PermissionValue = {
  Create: boolean;
  Read: boolean;
  Update: boolean;
  Delete: boolean;
};

type RolePermissions = {
  [roleName: string]: {
    [entity: string]: PermissionValue;
  };
};


export default function CISOAccessControl() {
  const navigate = useNavigate();

  // State for permissions data
  const [permissions, setPermissions] = React.useState<RolePermissions>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Define entities for each role (matching the backend configuration)
  const entitiesConfig = {
    "System Admin": [
      "Announcement", "Guidelines", "System Analytics", "Clearance Timeline",
      "College Department Office Configuration", "System Users", "Faculty Data Dump",
      "Faculty Import History", "Clearance Requests Records", "Activity Logs", "Notifications"
    ],
    "Analytics Admin": [
      "Announcement", "Guidelines", "System Analytics", "Clearance Requests Records",
      "Activity Logs", "Notifications"
    ],
    "Approver": [
      "Requirements List", "Announcements", "Clearance Requests", "Clearance Requests Records",
      "Approver Assistant", "Activity Logs", "Notifications"
    ],
    "Approver Assistant": [
      "Requirements List", "Announcements", "Clearance Requests", "Clearance Requests Records",
      "Notifications"
    ],
    "Faculty Member": [
      "Clearance Requests", "Clearance Requests Records", "Notifications"
    ]
  };

  // Load permissions from API
  const loadPermissions = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/admin/xu-faculty-clearance/api/ciso/access-control/permissions", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to load permissions");
      }
      
      const data = await response.json();
      
      // Initialize permissions with default values if they don't exist
      const initializedPermissions: RolePermissions = {};
      
      Object.keys(entitiesConfig).forEach(roleName => {
        initializedPermissions[roleName] = {};
        entitiesConfig[roleName as keyof typeof entitiesConfig].forEach(entity => {
          // Use existing permissions or default based on screenshots
          const existingPerms = data.permissions?.[roleName]?.[entity];
          if (existingPerms) {
            initializedPermissions[roleName][entity] = existingPerms;
          } else {
            // Default permissions based on the screenshots
            initializedPermissions[roleName][entity] = {
              Create: true,
              Read: true,
              Update: false,  // Most roles don't have update permissions
              Delete: true
            };
          }
        });
      });
      
      setPermissions(initializedPermissions);
    } catch (err) {
      console.error("Error loading permissions:", err);
      setError(err instanceof Error ? err.message : "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  // Save permissions to API
  const savePermissions = React.useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch("/admin/xu-faculty-clearance/api/ciso/access-control/permissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ permissions })
      });
      
      if (!response.ok) {
        throw new Error("Failed to save permissions");
      }
      
      setHasChanges(false);
      // Show success message (you could add a toast notification here)
      console.log("Permissions saved successfully");
    } catch (err) {
      console.error("Error saving permissions:", err);
      setError(err instanceof Error ? err.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  }, [permissions]);

  // Handle permission changes
  const handlePermissionChange = React.useCallback((args: {
    categoryId: string;
    entity: string;
    privilege: "Create" | "Read" | "Update" | "Delete";
    value: boolean;
  }) => {
    setPermissions(prev => ({
      ...prev,
      [args.categoryId]: {
        ...prev[args.categoryId],
        [args.entity]: {
          ...prev[args.categoryId]?.[args.entity],
          [args.privilege]: args.value
        }
      }
    }));
    setHasChanges(true);
  }, []);

  // Load permissions on component mount
  React.useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard px-[1in] pt-4 pb-4 w-full">

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
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <div className="font-semibold">Error</div>
              <div className="text-sm">{error}</div>
            </div>
          )}
          
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
              
              {/* Save button */}
              <div className="flex justify-end gap-2">
                <Button 
                  onClick={savePermissions}
                  disabled={!hasChanges || saving || loading}
                  variant={hasChanges ? "default" : "outline"}
                >
                  {saving ? "Saving..." : hasChanges ? "Save Changes" : "No Changes"}
                </Button>
              </div>

              <AccessControlCard
                roleTitle="Role Permissions"
                categories={Object.keys(entitiesConfig).map(roleName => ({
                  id: roleName,
                  label: roleName,
                  rows: entitiesConfig[roleName as keyof typeof entitiesConfig].map(entity => ({
                    entity,
                    values: permissions[roleName]?.[entity] || {
                      Create: false,
                      Read: false,
                      Update: false,
                      Delete: false
                    }
                  }))
                }))}
                onPermissionChange={handlePermissionChange}
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

import "../../index.css"; 
import { CISOHeader } from "../../stories/components/header";

import {
  FacultyDataDumpCard,
} from "../../stories/components/cards";

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
import * as React from "react";

export default function CISOFacultyDataDump() {
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Faculty Data Dump</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/CISO-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Faculty Data Dump</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/CISO-tools")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>
       
       <div className="mt-2 space-y-3">
        <FacultyDataDumpCard
         accept=".csv,text/csv"
          onFileSelected={async (file) => {
            if (busy) return;
            setBusy(true);
            try {
              const formData = new FormData();
              formData.append("file", file);

              const res = await fetch("/admin/xu-faculty-clearance/api/ciso/faculty-dump/import", {
                method: "POST",
                body: formData,
              });

              const data = await res.json().catch(() => null);
              if (!res.ok) {
                const msg = (data && (data.detail || JSON.stringify(data))) || "Import failed";
                alert(msg);
                return;
              }

              const created = data?.created_count ?? 0;
              const updated = data?.updated_count ?? 0;
              const skipped = data?.skipped_count ?? 0;
              const errors = Array.isArray(data?.errors) ? data.errors : [];

              const errorText = errors.length
                ? "\n\nErrors:\n" + errors.map((e: any) => `Row ${e.row}: ${e.message}`).join("\n")
                : "";

              alert(`Import complete. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}${errorText}`);
            } finally {
              setBusy(false);
            }
          }}
          onDownloadTemplate={async () => {
            if (busy) return;
            setBusy(true);
            try {
              const res = await fetch("/admin/xu-faculty-clearance/api/ciso/faculty-dump/template");
              if (!res.ok) {
                alert("Failed to download template");
                return;
              }
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "faculty_template.csv";
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } finally {
              setBusy(false);
            }
          }}
        />
       </div>

      </main>

    </div>
  );
}

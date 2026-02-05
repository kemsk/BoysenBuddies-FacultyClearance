import "../../index.css"; 
import { CISCOHeader } from "../../stories/components/header";

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

export default function CISCOFacultyDataDump() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-foreground text-primary-foreground">
      
      {/* HEADER */}
      <div className="header mb-3">
        <CISCOHeader />
      </div>

      {/* DASHBOARD CONTENT */}
      <main className="dashboard p-4">
        
        <h1 className="text-2xl text-left text-primary font-bold">Faculty Data Dump</h1>

        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/CISCO-tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Faculty Data Dump</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 mt-2 flex items-center justify-end">
          <Button variant="back" onClick={() => navigate("/CISCO-tools")}> 
            <img src="BlackArrowIcon.png" alt="back" />Back
          </Button>
        </div>
       
       <div className="mt-2 space-y-3">
        <FacultyDataDumpCard
          onFileSelected={() => {
            // intentionally left blank; user can wire upload flow later
          }}
          onDownloadTemplate={() => {
            // intentionally left blank; user can wire download later
          }}
        />
       </div>

      </main>

    </div>
  );
}

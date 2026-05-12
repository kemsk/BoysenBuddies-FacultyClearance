import * as React from "react";
import { Check,Upload, X, Edit, Trash2 } from "lucide-react";

import { cn } from "../../components/lib/utils";
import { Button } from "./button";
import { Divider } from "./divider";
import {
  Card,
  CardContent,
} from "./card";

import { SearchInputGroup } from "./input-group";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";


export interface FacultyDataDumpCardProps {
  title?: string;
  className?: string;
  onFileSelected?: (file: File) => void;
  selectedFile?: File | null;
  uploadStatus?: "idle" | "uploading" | "success" | "error";
  uploadProgress?: number;
  uploadStatusText?: string;
  onCancelUpload?: () => void;
  onRemoveFile?: () => void;
  onActivate?: () => void;
  activateDisabled?: boolean;
  onDownloadTemplate?: () => void;
  maxSizeLabel?: string;
  accept?: string;
  semesters?: { id: string; label: string }[];
  selectedSemesterId?: string;
  onSemesterChange?: (id: string) => void;
  isFileReady?: boolean;
  onClearFile?: () => void;
  tableUsers?: SystemUser[];
  tablePage?: number;
  tablePageCount?: number;
  onTablePageChange?: (page: number) => void;
  onAddFaculty?: (faculty: {
    email: string;
    firstName: string;
    middleName: string;
    lastName: string;
    facultyType: string;
    college: string;
    department: string;
    universityId: string;
  }) => void;
  onEditUser?: (user: SystemUser) => void;
  onRemoveUser?: (user: SystemUser) => void;
  colleges?: string[];
  departments?: string[];
  collegeDepartmentsMap?: Record<string, string[]>;
  collegeNameToCodeMap?: Record<string, string>;
  departmentNameToCodeMap?: Record<string, string>;
}

export function FacultyDataDumpCard({

  title = "Upload Faculty Data",

  className,
  onFileSelected,
  selectedFile,
  uploadStatus = "idle",

  uploadProgress = 0,
  uploadStatusText,
  onCancelUpload,
  onRemoveFile,
  onActivate,
  activateDisabled = false,
  onDownloadTemplate,
  maxSizeLabel = "Max size 50 MB",

  accept = ".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  semesters,
  selectedSemesterId,
  onSemesterChange,
  isFileReady = false,
  onClearFile,
  tableUsers,
  tablePage,
  tablePageCount,
  onTablePageChange,
  onAddFaculty,
  onEditUser,
  onRemoveUser,
  colleges = [],
  departments = [],
  collegeDepartmentsMap = {},
  collegeNameToCodeMap = {},
  departmentNameToCodeMap = {},
}: FacultyDataDumpCardProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [internalSemesterId, setInternalSemesterId] = React.useState("");
  const [internalFile, setInternalFile] = React.useState<File | null>(null);
  const currentSemesterId = selectedSemesterId ?? internalSemesterId;
  const currentFile = selectedFile ?? internalFile;

  function handleFiles(files: FileList | null) {

    const file = files?.[0];
    if (!file) return;
    setInternalFile(file);
    onFileSelected?.(file);

  }

  const prettyBytes = (bytes: number) => {

    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const val = bytes / Math.pow(1024, idx);
    return `${val.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;

  };

  const statusLabel = (() => {

    if (uploadStatusText?.trim()) return uploadStatusText.trim();
    if (uploadStatus === "uploading") return "Uploading...";
    if (uploadStatus === "success") return "Upload complete.";
    if (uploadStatus === "error") return "Upload failed.";
    return "";

  })();

  return (
    <Card className={cn("overflow-hidden border-muted-foreground/20", className)}>
      <CardContent className="p-6">
        <div className="text-center text-base font-bold text-gray-900">{title}</div>
        <div className="mt-4">
          <Select

            value={currentSemesterId}
            onValueChange={(val) => {
              setInternalSemesterId(val);
              onSemesterChange?.(val);
            }}

          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {(semesters ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>

              ))}
            </SelectContent>
          </Select>
        </div>
        <div

          className={cn(
            "mt-4 rounded-md border-2 border-dashed border-muted-foreground/40 bg-muted/30",
            currentFile ? "p-4" : "p-8"
          )}

          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}

        >
          {currentFile ? (

            <div className="w-full">
              <div className="flex items-center gap-3 rounded-md border border-muted-foreground/20 bg-background p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{currentFile.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {prettyBytes(currentFile.size)}{statusLabel ? ` • ${statusLabel}` : ""}
                  </div>
                  {uploadStatus === "uploading" ? (

                    <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
                      <div

                        className="h-full bg-primary"

                        style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}

                      />
                    </div>

                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {uploadStatus === "uploading" ? (
                    <Button type="button" variant="icon" size="icon" onClick={onCancelUpload}>
                      <X className="h-4 w-4" />
                    </Button>

                  ) : uploadStatus === "success" ? (

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success">
                      <Check className="h-4 w-4 text-white" strokeWidth={4} />
                    </div>

                  ) : (
                    <Button type="button" variant="icon" size="icon" onClick={() => {

                      setInternalFile(null);

                      onRemoveFile?.();

                      onClearFile?.();

                      if (inputRef.current) {

                        inputRef.current.value = '';

                      }

                    }}>
                      <X className="h-4 w-4" />
                    </Button>

                  )}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {uploadStatus === "uploading" ? (
                  <Button type="button" variant="secondary" disabled className="col-span-2 h-10 w-full rounded-md">

                    Cancel

                  </Button>

                ) : (uploadStatus === "success" || isFileReady) ? (

                  <>
                    <Button

                      type="button"

                      className="h-10 w-full rounded-md bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"

                      onClick={() => {

                        setInternalFile(null);

                        onRemoveFile?.();

                        onClearFile?.();

                        if (inputRef.current) {

                          inputRef.current.value = '';

                        }

                      }}

                    >

                      Remove File

                    </Button>
                    {uploadStatus === "success" ? (
                      <Button

                        type="button"

                        variant="secondary"

                        className="h-10 w-full rounded-md"

                        onClick={() => {

                          setInternalFile(null);

                          onRemoveFile?.();

                          onClearFile?.();

                          if (inputRef.current) {

                            inputRef.current.value = '';

                          }

                          inputRef.current?.click();

                        }}

                      >

                        Choose another file

                      </Button>

                    ) : (
                      <Button

                        type="button"

                        className="h-10 w-full rounded-md bg-primary font-bold text-primary-foreground hover:bg-primary/90"

                        onClick={onActivate}

                        disabled={activateDisabled || !onActivate}

                      >

                        Upload

                      </Button>

                    )}
                  </>

                ) : (
                  <Button

                    type="button"

                    variant="secondary"

                    className="col-span-2 h-10 w-full rounded-md"

                    onClick={() => inputRef.current?.click()}

                  >

                    Choose another file

                  </Button>

                )}
              </div>
            </div>

          ) : (
            <button
              type="button"
              className="mx-auto flex w-full flex-col items-center justify-center gap-3"
              onClick={() => inputRef.current?.click()}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md text-muted-foreground">
                <Upload className="h-10 w-10" />
              </div>
              <div className="text-md text-muted-foreground">
                {" "}
                <span className="font-bold">Click to upload </span> or drag and drop
              </div>
              <div className="text-xs text-muted-foreground">CSV or Excel files ({maxSizeLabel})</div>
            </button>
          )}
          <input

            ref={inputRef}

            type="file"

            accept={accept}

            className="hidden"

            onChange={(e) => handleFiles(e.target.files)}

          />
        </div>
        {(currentFile && (uploadStatus === "success" || isFileReady)) || (tableUsers && tableUsers.length > 0) ? (
          <FacultyTableCard
            className="mt-5"
            users={tableUsers ?? []}
            page={tablePage}
            pageCount={tablePageCount}
            onPageChange={onTablePageChange}
            onAddFaculty={onAddFaculty}
            onEditUser={onEditUser}
            onRemoveUser={onRemoveUser}
            colleges={colleges}
            departments={departments}
            collegeDepartmentsMap={collegeDepartmentsMap}
            collegeNameToCodeMap={collegeNameToCodeMap}
            departmentNameToCodeMap={departmentNameToCodeMap}
          />
        ) : null}
        <div className="mt-5 rounded-md bg-primary/10 p-4">
          <div className="text-lg font-bold text-primary">Need a template?</div>
          <div className="mt-1 mt-2 text-sm  text-muted-foreground">

            Download our CSV template to ensure your student data is formatted correctly

          </div>
          <div className="mt-4">
            <Button

              type="button"

              className="h-10 rounded-md bg-primary px-4

              font-bold text-primary-foreground hover:bg-primary/90"

              onClick={onDownloadTemplate}

            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <img src="/WhiteDownloadIcon.png" alt="Download" className="h-6 w-6 object-contain" />

                Download Template

              </div>
            </Button>
          </div>
        </div>
        <div className="mt-4 rounded-md bg-yellow-100 p-4">
          <div className="text-md font-bold text-yellow-900">Important Information</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm  text-yellow-900">
            <li>All imported users will be automatically assigned the faculty member role</li>
            <li>Faculty Members will automatically be assigned to the active school year and semester</li>
          </ul>
        </div>
      </CardContent>
    </Card>

  );

}

export type SystemUser = {
  id: string;
  name: string;
  systemId: string;
  userRole: string;
  isActive?: boolean;
  universityId: string;
  college: string;
  department: string;
  email: string;
  firstname?: string;
  middlename?: string;
  lastname?: string;
  facultytype?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
  FacultyType?: string;
};

export type FacultyTableCardProps = {

  className?: string;
  users: SystemUser[];
  onAddApprover?: () => void;
  onAddAdmin?: () => void;
  onEditUser?: (user: SystemUser) => void;
  onRemoveUser?: (user: SystemUser) => void;
  currentUserEmail?: string;
  pageLabel?: string;
  pageCountLabel?: string;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onAddFaculty?: (faculty: {
    email: string;
    firstName: string;
    middleName: string;
    lastName: string;
    facultyType: string;
    college: string;
    department: string;
    universityId: string;
  }) => void;
  colleges?: string[];
  departments?: string[];
  collegeDepartmentsMap?: Record<string, string[]>;
  collegeNameToCodeMap?: Record<string, string>;
  departmentNameToCodeMap?: Record<string, string>;

};

export function FacultyTableCard({

  className,
  users,
  onAddAdmin,
  onEditUser,
  onRemoveUser,
  currentUserEmail,
  page,
  pageCount,
  onPageChange,
  onAddFaculty,
  colleges = [],
  departments = [],
  collegeDepartmentsMap = {},
  collegeNameToCodeMap = {},
  departmentNameToCodeMap = {},
}: FacultyTableCardProps) {

  const [addFacultyOpen, setAddFacultyOpen] = React.useState(false);
  const [editFacultyOpen, setEditFacultyOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<SystemUser | null>(null);

  return (
    <Card className={cn("overflow-hidden border-muted-foreground/20 shadow-sm", className)}>
      <CardContent className="p-0">
        <AddFacultyDialog 
          open={addFacultyOpen} 
          onOpenChange={setAddFacultyOpen} 
          onAddFaculty={onAddFaculty}
          colleges={colleges}
          collegeDepartmentsMap={collegeDepartmentsMap}
        />
        <EditFacultyDialog 
          open={editFacultyOpen} 
          onOpenChange={setEditFacultyOpen} 
          onEditFaculty={(user, updatedFaculty) => {
            // Convert college and department names to codes
            const collegeCode = updatedFaculty.college;
            const departmentCode = updatedFaculty.department;
            
            // Create updated user object
            const updatedUser: SystemUser = {
              ...user,
              email: updatedFaculty.email,
              universityId: updatedFaculty.universityId,
              firstname: updatedFaculty.firstName,
              middlename: updatedFaculty.middleName,
              lastname: updatedFaculty.lastName,
              facultytype: updatedFaculty.facultyType,
              college: collegeCode,
              department: departmentCode,
              name: `${updatedFaculty.firstName} ${updatedFaculty.lastName}`.trim(),
            };
            
            // Call the original onEditUser if provided
            onEditUser?.(updatedUser);
          }}
          user={editingUser}
          colleges={colleges}
          collegeDepartmentsMap={collegeDepartmentsMap}
          collegeNameToCodeMap={collegeNameToCodeMap}
          departmentNameToCodeMap={departmentNameToCodeMap}
        />
        <div className="flex">
          <Divider orientation="vertical" className="h-auto self-stretch" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-start gap-2 bg-background px-4 py-3 flex-wrap">
            <div className="w-full md:flex-1 md:min-w-[320px]">
              <SearchInputGroup
                containerClassName="h-10"
                placeholder="Search by name, ID, or email..."
              />
            </div>

            <Select defaultValue="name">
              <SelectTrigger variant="pill" className="w-max gap-2">
                <span>Sort by:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">XU Email</SelectItem>
                <SelectItem value="UniversityID">University ID</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => console.log(v)}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="College" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="SystemAdmin">All</SelectItem>
                    <SelectItem value="Approver">System Admin</SelectItem>
                    <SelectItem value="Approver">Analytics Admin</SelectItem>
                </SelectContent>
            </Select>

            <Select onValueChange={(v) => console.log(v)}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="Faculty Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Faculty Type</SelectItem>
                    <SelectItem value="Approver">Part-time Faculty</SelectItem>
                    <SelectItem value="Approver">Full-time Faculty</SelectItem>
                </SelectContent>
            </Select>
            
            <div className="w-full md:w-auto md:ml-auto flex justify-end">
              <Button
                type="button"
                variant="default"
                className="h-10"
                onClick={() => setAddFacultyOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <img src="/WhitePlusIcon.png" alt="Add Faculty" className="h-5 w-5 object-contain" />
                  <span className="ml-0">Add Faculty</span>
                </div>
              </Button>
            </div>            
            </div>
            <Divider color="border-[hsl(var(--gray-border))]" />
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Email</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">University ID</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">First Name</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Middle Name</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Last Name</th>
                      <th className="px-3 py-2 text-left text-sm uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Faculty Type</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">College</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Department</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => {
                      const firstName = user.firstname ?? user.FirstName ?? "";
                      const middleName = user.middlename ?? user.MiddleName ?? "";
                      const lastName = user.lastname ?? user.LastName ?? "";
                      const facultyType = user.facultytype ?? user.FacultyType ?? "";
                      return (
                        <tr
                          key={user.id}
                          className={cn("border-t border-[hsl(var(--gray-border))]", idx === 0 ? "border-t-0" : "")}
                        >
                          <td className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{user.email}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.universityId}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{firstName}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{middleName}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{lastName}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{facultyType}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.college}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.department}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditFacultyOpen(true);
                                }}
                                disabled={user.email === currentUserEmail}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => onRemoveUser?.(user)}
                                disabled={user.email === currentUserEmail}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {typeof page === "number" && typeof pageCount === "number" ? (
                    <tfoot>
                      <tr>
                        <td colSpan={9} className="border-t border-[hsl(var(--gray-border))]">
                          <div className="flex items-center justify-center gap-3 px-4 py-3">
                            <div className="text-sm text-muted-foreground">Page</div>

                            <select
                              className="h-9 rounded-md border border-muted-foreground/30 bg-background px-3 text-sm font-semibold text-foreground"
                              value={page}
                              onChange={(e) => onPageChange?.(Number(e.target.value))}
                            >
                              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>

                            <div className="text-sm text-muted-foreground">of {pageCount}</div>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>

            </div>

            <div className="md:hidden">
              {users.map((user, idx) => (
                <React.Fragment key={user.id}>
                  <div className="flex items-start gap-4 px-4 py-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-xl font-bold text-gray-900">{user.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setEditingUser(user);
                              setEditFacultyOpen(true);
                            }}
                            disabled={user.email === currentUserEmail}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onRemoveUser?.(user)}
                            disabled={user.email === currentUserEmail}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-md">
                        <div className="font-semibold text-gray-900">Email</div>
                        <div className="break-all text-muted-foreground">{user.email}</div>
                        <div className="font-semibold text-md text-gray-900">University ID</div>
                        <div className="text-muted-foreground">{user.universityId}</div>   
                        <div className="font-semibold text-md text-gray-900">First Name</div>
                        <div className="text-muted-foreground">{user.firstname ?? user.FirstName}</div>  
                        <div className="font-semibold text-md text-gray-900">Middle Name</div>
                        <div className="text-muted-foreground">{user.middlename ?? user.MiddleName}</div>    
                        <div className="font-semibold text-md text-gray-900">Last Name</div>
                        <div className="text-muted-foreground">{user.lastname ?? user.LastName}</div>                                                                 
                        <div className="font-semibold text-md text-gray-900">Faculty Type</div>
                        <div className="text-muted-foreground">{user.facultytype ?? user.FacultyType}</div>
                        <div className="font-semibold text-gray-900">College</div>
                        <div className="text-muted-foreground">{user.college}</div>
                        <div className="font-semibold text-gray-900">Department</div>
                        <div className="text-muted-foreground">{user.department}</div>                             
                      </div>
                    </div>
                  </div>
                  {idx < users.length - 1 ? <Divider color="border-[hsl(var(--gray-border))]" /> : null}
                </React.Fragment>
              ))}
            </div>
          </div>
          <Divider orientation="vertical" className="h-auto self-stretch" />
        </div>
      </CardContent>
    </Card>
  );

}

export type AddFacultyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFaculty?: (faculty: {
    email: string;
    firstName: string;
    middleName: string;
    lastName: string;
    facultyType: string;
    college: string;
    department: string;
    universityId: string;
  }) => void;
  colleges?: string[];
  collegeDepartmentsMap?: Record<string, string[]>;
};

export function AddFacultyDialog({ open, onOpenChange, onAddFaculty, colleges = [], collegeDepartmentsMap = {} }: AddFacultyDialogProps) {
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [middleName, setMiddleName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [facultyType, setFacultyType] = React.useState("");
  const [college, setCollege] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [universityId, setUniversityId] = React.useState("");

  // Filter departments based on selected college and exclude "Dean" departments
  const availableDepartments = React.useMemo(() => {
    if (!college) return [];
    const departments = collegeDepartmentsMap[college] || [];
    return departments.filter(dept => !dept.toLowerCase().includes('dean'));
  }, [college, collegeDepartmentsMap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName || !facultyType || !college || !universityId) return;
    
    onAddFaculty?.({
      email,
      firstName,
      middleName,
      lastName,
      facultyType,
      college,
      department, // Department is optional - can be empty string
      universityId,
    });
    // Reset form
    setEmail("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setFacultyType("");
    setCollege("");
    setDepartment("");
    setUniversityId("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setEmail("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setFacultyType("");
    setCollege("");
    setDepartment("");
    setUniversityId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-fit min-w-[320px] max-w-screen-lg">
        <div className="text-center font-bold pb-5">
          Add Faculty Member
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: First Name | Middle Name | Last Name */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-8"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-8"
                required
              />
            </div>
          </div>

          {/* Row 2: University ID | Email (@XU.EDU.PH) | Faculty Type */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="universityId">University ID</Label>
              <Input
                id="universityId"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className="h-8"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email (@XU.EDU.PH)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-sm"
                placeholder="username@xu.edu.ph"
                required
              />
              <p className="text-[9px] text-muted-foreground">Only @xu.edu.ph email addresses are allowed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="facultyType">Faculty Type</Label>
              <Select value={facultyType} onValueChange={setFacultyType}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select faculty type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Part-time">Part-time Faculty</SelectItem>
                  <SelectItem value="Full-time">Full-time Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: College | Department (max width) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Select value={college} onValueChange={(value) => {
                setCollege(value);
                setDepartment(""); // Reset department when college changes
              }}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((college) => (
                    <SelectItem key={college} value={college}>
                      {college}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment} disabled={!college}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={college ? "Select department" : "Select college first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-5">
            <DialogFooter>
              <Button type="button" variant="cancel" onClick={handleCancel} className="w-full">
                Cancel
              </Button>
              <Button variant="default" className="w-full">Create</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type EditFacultyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditFaculty?: (user: SystemUser, updatedFaculty: {
    email: string;
    firstName: string;
    middleName: string;
    lastName: string;
    facultyType: string;
    college: string;
    department: string;
    universityId: string;
  }) => void;
  user: SystemUser | null;
  colleges?: string[];
  collegeDepartmentsMap?: Record<string, string[]>;
  collegeNameToCodeMap?: Record<string, string>;
  departmentNameToCodeMap?: Record<string, string>;
};

export function EditFacultyDialog({ open, onOpenChange, onEditFaculty, user, colleges = [], collegeDepartmentsMap = {}, collegeNameToCodeMap = {}, departmentNameToCodeMap = {} }: EditFacultyDialogProps) {
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [middleName, setMiddleName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [facultyType, setFacultyType] = React.useState("");
  const [college, setCollege] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [universityId, setUniversityId] = React.useState("");

  // Create code-to-name maps
  const collegeCodeToNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(collegeNameToCodeMap).forEach(([name, code]) => {
      map[code] = name;
    });
    return map;
  }, [collegeNameToCodeMap]);

  const departmentCodeToNameMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(departmentNameToCodeMap).forEach(([name, code]) => {
      map[code] = name;
    });
    return map;
  }, [departmentNameToCodeMap]);

  // Initialize form when user changes
  React.useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setFirstName(user.firstname || user.FirstName || "");
      setMiddleName(user.middlename || user.MiddleName || "");
      setLastName(user.lastname || user.LastName || "");
      setFacultyType(user.facultytype || user.FacultyType || "");
      // Convert codes back to names for the dropdowns
      const collegeName = collegeCodeToNameMap[user.college] || user.college;
      const departmentName = departmentCodeToNameMap[user.department] || user.department;
      setCollege(collegeName);
      setDepartment(departmentName);
      setUniversityId(user.universityId || "");
    }
  }, [user, collegeCodeToNameMap, departmentCodeToNameMap]);

  // Filter departments based on selected college and exclude "Dean" departments
  const availableDepartments = React.useMemo(() => {
    if (!college) return [];
    const departments = collegeDepartmentsMap[college] || [];
    return departments.filter(dept => !dept.toLowerCase().includes('dean'));
  }, [college, collegeDepartmentsMap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email || !firstName || !lastName || !facultyType || !college || !universityId) return;
    
    // Convert college and department names back to codes
    const collegeCode = collegeNameToCodeMap[college] || college;
    const departmentCode = department ? (departmentNameToCodeMap[department] || department) : '';
    
    onEditFaculty?.(user, {
      email,
      firstName,
      middleName,
      lastName,
      facultyType,
      college: collegeCode,
      department: departmentCode, // Department is optional - can be empty string
      universityId,
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-fit min-w-[320px] max-w-screen-lg">
        <div className="text-center font-bold pb-5">
          Edit Faculty Member
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: First Name | Middle Name | Last Name */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-8"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-8"
                required
              />
            </div>
          </div>

          {/* Row 2: University ID | Email (@XU.EDU.PH) | Faculty Type */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="universityId">University ID</Label>
              <Input
                id="universityId"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                className="h-8"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email (@XU.EDU.PH)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-sm"
                placeholder="username@xu.edu.ph"
                required
              />
              <p className="text-[9px] text-muted-foreground">Only @xu.edu.ph email addresses are allowed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="facultyType">Faculty Type</Label>
              <Select value={facultyType} onValueChange={setFacultyType}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select faculty type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Part-time">Part-time Faculty</SelectItem>
                  <SelectItem value="Full-time">Full-time Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: College | Department (max width) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Select value={college} onValueChange={(value) => {
                setCollege(value);
                setDepartment(""); // Reset department when college changes
              }}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((college) => (
                    <SelectItem key={college} value={college}>
                      {college}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment} disabled={!college}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={college ? "Select department" : "Select college first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-5">
            <DialogFooter>
              <Button type="button" variant="cancel" onClick={handleCancel} className="w-full">
                Cancel
              </Button>
              <Button variant="default" className="w-full">Update</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
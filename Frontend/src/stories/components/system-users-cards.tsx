import * as React from "react";
import { cn } from "../../components/lib/utils";

import { Button } from "./button";

import { Divider } from "./divider";

import {
  Card,
  CardContent,
} from "./card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

import {
  ErrorModal,
  SuccessModal,
  SuccessErrorModalMessages,
} from "./success-and-error-modals";
import { SearchInputGroup } from "./input-group";

export type SystemUser = {
  id: string;
  name: string;
  systemId: string;
  userRole: string;
  isActive?: boolean;
  universityId: string;
  college: string;
  department: string;
  office: string;
  email: string;
};

export type SystemUsersCardProps = {

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

};

export function AdminSystemUsersCard({

  className,
  users,
  onAddApprover,
  onAddAdmin,
  onEditUser,
  onRemoveUser,
  currentUserEmail,
  page,
  pageCount,
  onPageChange,
}: SystemUsersCardProps) {
  const [sortBy, setSortBy] = React.useState("name");
  const [roleFilter, setRoleFilter] = React.useState("SystemAdmin");

  const sortedUsers = React.useMemo(() => {
    const filtered = users.filter(user => {
      // Debug: log user roles to see what we're working with
      console.log('User role:', user.userRole, 'Filter:', roleFilter);
      
      if (roleFilter === "SystemAdmin") return true;
      if (roleFilter === "OVPHE") return user.userRole === "OVPHE";
      if (roleFilter === "CISO") return user.userRole === "CISO";
      // For any other role filter, only show matching roles
      return user.userRole === roleFilter;
    });
    
    const sorted = [...filtered];
    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "email":
        return sorted.sort((a, b) => a.email.localeCompare(b.email));
      case "UniversityID":
        return sorted.sort((a, b) => a.universityId.localeCompare(b.universityId));
      case "Office":
        return sorted.sort((a, b) => {
          const officeA = a.college === "None" ? a.department : a.college;
          const officeB = b.college === "None" ? b.department : b.college;
          return officeA.localeCompare(officeB);
        });
      default:
        return sorted;
    }
  }, [users, sortBy, roleFilter]);

  return (
    <Card className={cn("overflow-hidden border-muted-foreground/20 shadow-sm", className)}>
      <CardContent className="p-0">
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

            <Select value={sortBy} onValueChange={setSortBy}>
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

            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="User Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="SystemAdmin">All</SelectItem>
                    <SelectItem value="CISO">System Admin</SelectItem>
                    <SelectItem value="OVPHE">Analytics Admin</SelectItem>
                </SelectContent>
            </Select>
            <div className="w-full md:w-auto md:ml-auto flex justify-end">
              <Button type="button" variant="default" className="h-10" onClick={onAddAdmin}>
                <div className="flex items-center gap-2">
                  <img src="/WhitePlusIcon.png" alt="Add Admin" className="h-5 w-5 object-contain" />
                  <span className="ml-0">Add Admin</span>
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
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Name</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">University ID</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">XU Email</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">User Role</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user, idx) => {
                      const office = user.college === "None" ? user.department : user.college;
                      return (
                        <tr
                          key={user.id}
                          className={cn("border-t border-[hsl(var(--gray-border))]", idx === 0 ? "border-t-0" : "")}
                        >
                          <td className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{user.name}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.universityId}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.email}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.userRole}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="action"
                                className="h-7 rounded-md px-3 text-xs font-bold"
                                onClick={() => onEditUser?.(user)}
                                disabled={user.email === currentUserEmail}
                              >
                                EDIT
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="h-7 rounded-md px-3 text-xs font-bold"
                                onClick={() => onRemoveUser?.(user)}
                                disabled={user.email === currentUserEmail}
                              >
                                REMOVE
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
                        <td colSpan={7} className="border-t border-[hsl(var(--gray-border))]">
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
              {sortedUsers.map((user, idx) => (
                <React.Fragment key={user.id}>
                  <div className="flex items-start gap-4 px-4 py-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-xl font-bold text-gray-900">{user.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="action"
                            className="h-7 rounded-md px-3 text-xs font-bold"
                            onClick={() => onEditUser?.(user)}
                            disabled={user.email === currentUserEmail}
                          >
                            EDIT
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="h-7 rounded-md px-3 text-xs font-bold"
                            onClick={() => onRemoveUser?.(user)}
                            disabled={user.email === currentUserEmail}
                          >
                            REMOVE
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-md">
                        <div className="font-semibold text-md text-gray-900">System ID</div>
                        <div className="text-muted-foreground">{user.systemId}</div>
                        <div className="font-semibold text-md text-gray-900">User Role</div>
                        <div className="text-muted-foreground">{user.userRole}</div>
                        <div className="font-semibold text-md text-gray-900">University ID</div>
                        <div className="text-muted-foreground">{user.universityId}</div>
                        <div className="font-semibold text-gray-900">College</div>
                        <div className="text-muted-foreground">{user.college}</div>
                        <div className="font-semibold text-gray-900">Department</div>
                        <div className="text-muted-foreground">{user.department}</div>
                        <div className="font-semibold text-gray-900">Office</div>
                        <div className="text-muted-foreground">{user.office}</div>
                        <div className="font-semibold text-gray-900">Email</div>
                        <div className="break-all text-muted-foreground">{user.email}</div>
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


export function ApproverSystemUsersCard({

  className,
  users,
  onAddApprover,
  onAddAdmin,
  onEditUser,
  onRemoveUser,
  currentUserEmail,
  page,
  pageCount,
  onPageChange,
}: SystemUsersCardProps) {
  const [sortBy, setSortBy] = React.useState("name");
  const [roleFilter, setRoleFilter] = React.useState("SystemAdmin");

  const sortedUsers = React.useMemo(() => {
    const filtered = users.filter(user => {
      // Debug: log user roles to see what we're working with
      console.log('User role:', user.userRole, 'Filter:', roleFilter);
      
      if (roleFilter === "SystemAdmin") return true;
      if (roleFilter === "OVPHE") return user.userRole === "OVPHE";
      if (roleFilter === "CISO") return user.userRole === "CISO";
      // For any other role filter, only show matching roles
      return user.userRole === roleFilter;
    });
    
    const sorted = [...filtered];
    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "email":
        return sorted.sort((a, b) => a.email.localeCompare(b.email));
      case "UniversityID":
        return sorted.sort((a, b) => a.universityId.localeCompare(b.universityId));
      case "Office":
        return sorted.sort((a, b) => {
          const officeA = a.college === "None" ? a.department : a.college;
          const officeB = b.college === "None" ? b.department : b.college;
          return officeA.localeCompare(officeB);
        });
      default:
        return sorted;
    }
  }, [users, sortBy, roleFilter]);

  return (
    <Card className={cn("overflow-hidden border-muted-foreground/20 shadow-sm", className)}>
      <CardContent className="p-0">
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

            <Select value={sortBy} onValueChange={setSortBy}>
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
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="CISO">System Admin</SelectItem>
                    <SelectItem value="OVPHE">Analytics Admin</SelectItem>
                </SelectContent>
            </Select>
            <Select onValueChange={(v) => console.log(v)}>
                <SelectTrigger variant="pill" className="w-max">
                    <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Approver">System Admin</SelectItem>
                    <SelectItem value="Approver">Analytics Admin</SelectItem>
                </SelectContent>
            </Select>            
            <div className="w-full md:w-auto md:ml-auto flex justify-end">
              <Button type="button" variant="default" className="h-10" onClick={onAddApprover}>
                <div className="flex items-center gap-2">
                  <img src="/WhitePlusIcon.png" alt="Add Approver" className="h-5 w-5 object-contain" />
                  <span className="ml-0">Add Approver</span>
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
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Name</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">University ID</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">XU Email</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">College</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Department</th>                      
                      <th className="px-3 py-2 text-left text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Office</th>
                      <th className="px-3 py-2 text-center text-sm font-semibold uppercase text-muted-foreground border-b border-[hsl(var(--gray-border))]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user, idx) => {
                      return (
                        <tr
                          key={user.id}
                          className={cn("border-t border-[hsl(var(--gray-border))]", idx === 0 ? "border-t-0" : "")}
                        >
                          <td className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{user.name}</td>
                          <td className="px-4 py-3  text-left text-sm text-muted-foreground">{user.universityId}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.email}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.college}</td>
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.department}</td>            
                          <td className="px-4 py-3 text-left text-sm text-muted-foreground">{user.office}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="action"
                                className="h-7 rounded-md px-3 text-xs font-bold"
                                onClick={() => onEditUser?.(user)}
                                disabled={user.email === currentUserEmail}
                              >
                                EDIT
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="h-7 rounded-md px-3 text-xs font-bold"
                                onClick={() => onRemoveUser?.(user)}
                                disabled={user.email === currentUserEmail}
                              >
                                REMOVE
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
                        <td colSpan={7} className="border-t border-[hsl(var(--gray-border))]">
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
              {sortedUsers.map((user, idx) => (
                <React.Fragment key={user.id}>
                  <div className="flex items-start gap-4 px-4 py-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="text-xl font-bold text-gray-900">{user.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="action"
                            className="h-7 rounded-md px-3 text-xs font-bold"
                            onClick={() => onEditUser?.(user)}
                            disabled={user.email === currentUserEmail}
                          >
                            EDIT
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="h-7 rounded-md px-3 text-xs font-bold"
                            onClick={() => onRemoveUser?.(user)}
                            disabled={user.email === currentUserEmail}
                          >
                            REMOVE
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-md">
                        <div className="font-semibold text-md text-gray-900">System ID</div>
                        <div className="text-muted-foreground">{user.systemId}</div>
                        <div className="font-semibold text-md text-gray-900">User Role</div>
                        <div className="text-muted-foreground">{user.userRole}</div>
                        <div className="font-semibold text-md text-gray-900">University ID</div>
                        <div className="text-muted-foreground">{user.universityId}</div>
                        <div className="font-semibold text-gray-900">College</div>
                        <div className="text-muted-foreground">{user.college}</div>
                        <div className="font-semibold text-gray-900">Department</div>
                        <div className="text-muted-foreground">{user.department}</div>
                        <div className="font-semibold text-gray-900">Office</div>
                        <div className="text-muted-foreground">{user.office}</div>
                        <div className="font-semibold text-gray-900">Email</div>
                        <div className="break-all text-muted-foreground">{user.email}</div>
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

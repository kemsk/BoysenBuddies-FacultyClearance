import * as React from "react"
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "./sheet"
import { Input } from './input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

import { Divider } from "./divider";

type HeaderVariantProps = {
  sheetTitle?: string;
  sheetDescription?: string;
  children?: React.ReactNode;
};

function HeaderVariant({ sheetTitle, sheetDescription, children }: HeaderVariantProps) {
  return (
    <header className="w-full border-b bg-background">
      <div className="flex w-full items-center justify-between px-4 py-4 md:py-6">
        
        {/* Left section */}
        <div className="flex items-center gap-2">
          {/* Mobile logo + label (use flexible container so text doesn't get clipped) */}

            <img
              src="/Pen Swish Dark Blue_FacultyClearTrack.png"
              alt="Faculty ClearTrack"
              className="h-9 w-auto object-contain"
            />

            <span className="text-primary font-bold leading-[1.1] text-[clamp(1rem,3.5vw,1.4rem)]">
              XU Faculty <br /> ClearTrack
            </span>

        </div>


        {/* Right section */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger >
              <img
              src="/PrimaryMenuIcon.png"
              alt="Menu Icon"
              className="h-7 w-7 object-contain"
            />
            </SheetTrigger>
          <SheetContent>
            {sheetTitle || sheetDescription ? (
              <SheetHeader>
                {sheetTitle ? <SheetTitle>{sheetTitle}</SheetTitle> : null}
                {sheetDescription ? (
                  <SheetDescription>{sheetDescription}</SheetDescription>
                ) : null}
              </SheetHeader>
            ) : null}
            {children}
          </SheetContent>
        </Sheet>
        

        </div>
      </div>
    </header>
  )
}

export function Header() {
  return (
    <HeaderVariant
      sheetTitle="Are you absolutely sure?"
      sheetDescription={
        "This action cannot be undone. This will permanently delete your account and remove your data from our servers."
      }
    />
  );
}

export function FacultyHeader() {
  const navigate = useNavigate();

  return (
    <HeaderVariant>
      <div className="mt-4 flex h-full flex-col">
        <div className="flex flex-col gap-4">

          <div className="flex items-center gap-4">
            <img
              src="/Pen Swish Dark Blue_FacultyClearTrack.png"
              alt="Faculty ClearTrack"
              className="h-10 w-auto object-contain"
            />

            <span className="text-primary font-bold leading-[1.1] text-[clamp(1rem,3.5vw,1.4rem)]">
              XU Faculty <br /> ClearTrack
            </span>
          </div>

        <Divider className="-mx-6 mt-2 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

          <nav className="flex flex-col gap-4 mt-2">
            <div>
              <SheetClose asChild>
                <Link
                  to="/faculty-dashboard"
                  className="flex items-center gap-3  font-semibold text-primary text-xl"
                >
                  <img
                    src="/PrimaryHomeIcon.png"
                    alt="Dashboard"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Dashboard</span>
                </Link>
              </SheetClose>
            </div>

            <div className="mt-2">
            <SheetClose asChild>
              <Link
                to="/faculty-notification"
                className="flex items-center gap-3 text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryNotificationsIcon.png"
                  alt="Notifications"
                  className="h-5 w-5 object-contain"
                />
                <span>Notifications</span>
              </Link>
            </SheetClose>
            </div>
          </nav>
        </div>

        <Divider className="-mx-6 mt-6 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryLogoutIcon.png"
                  alt="Logout"
                  className="h-5 w-5 object-contain"
                />
                <span>Logout</span>
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-xs">
              <AlertDialogHeader className="items-center text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
                  <span className="text-2xl font-bold">!</span>
                </div>
                <AlertDialogTitle className="mt-2 text-base font-semibold">
                  You are logging out
                </AlertDialogTitle>
                <div className="text-sm font-semibold text-muted-foreground">
                  XU Faculty ClearTrack
                </div>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-2 flex flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  className="w-full"
                  onClick={() => navigate("/login")}
                >                 
                  Logout
                </AlertDialogAction>
                <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </HeaderVariant>
  );
}

export function AdminHeader() {
  return (
    <HeaderVariant
      sheetTitle="System Admin Menu"
      sheetDescription="Administrator navigation"
    />
  );
}

export function ApprovalHeader() {
  const navigate = useNavigate();

  return (
    <HeaderVariant>
      <div className="mt-4 flex h-full flex-col">
        <div className="flex flex-col gap-4">

          <div className="flex items-center gap-4">
            <img
              src="/Pen Swish Dark Blue_FacultyClearTrack.png"
              alt="Faculty ClearTrack"
              className="h-10 w-auto object-contain"
            />

            <span className="text-primary font-bold leading-[1.1] text-[clamp(1rem,3.5vw,1.4rem)]">
              XU Faculty <br /> ClearTrack
            </span>
          </div>

        <Divider className="-mx-6 mt-2 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

          <nav className="flex flex-col gap-4 mt-2">
            <div>
              <SheetClose asChild>
                <Link
                  to="/approver-dashboard"
                  className="flex items-center gap-3  font-semibold text-primary text-xl"
                >
                  <img
                    src="/PrimaryHomeIcon.png"
                    alt="Dashboard"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Dashboard</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>
                
                <div className="flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link
                      to="/approver-requirement-list"
                      className="text-xl font-regular text-primary"
                    >
                      Requirement List
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/approver-dashboard"
                      className="text-xl font-regular text-primary"
                    >
                      Announcements
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </div>

            <div className="mt-2">
            <SheetClose asChild>
              <Link
                to="/approver-clearance"
                className="flex items-center gap-3 text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryPenIcon.png"
                  alt="Clearance"
                  className="h-5 w-5 object-contain"
                />
                <span>Clearance</span>
              </Link>
            </SheetClose>
            </div>

           <div className="mt-2">
              <SheetClose asChild>
                <Link
                  to="/approver-action"
                  className="flex items-center gap-3 text-xl font-semibold text-primary"
                >
                  <img
                    src="/PrimaryClockIcon.png"
                    alt="Actions"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Actions</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>
                <div className=" flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link
                      to="/approver-assistant-list"
                      className="text-xl font-regular text-primary"
                    >
                      View Approver Assistants
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/approver-activity-logs"
                      className="text-xl font-regular text-primary"
                    >
                      Check Activity Logs
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </div>

            <div className="mt-2">
            <SheetClose asChild>
              <Link
                to="/approver-notification"
                className="flex items-center gap-3 text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryNotificationsIcon.png"
                  alt="Notifications"
                  className="h-5 w-5 object-contain"
                />
                <span>Notifications</span>
              </Link>
            </SheetClose>
            </div>
          </nav>
        </div>

        <Divider className="-mx-6 mt-6 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryLogoutIcon.png"
                  alt="Logout"
                  className="h-5 w-5 object-contain"
                />
                <span>Logout</span>
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-xs">
              <AlertDialogHeader className="items-center text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
                  <span className="text-2xl font-bold">!</span>
                </div>
                <AlertDialogTitle className="mt-2 text-base font-semibold">
                  You are logging out
                </AlertDialogTitle>
                <div className="text-sm font-semibold text-muted-foreground">
                  XU Faculty ClearTrack
                </div>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-2 flex flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Logout
                </AlertDialogAction>
                <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
          </HeaderVariant>
  );
}

export function DualRoleHeader() {
  const navigate = useNavigate();

  return (
    <HeaderVariant>
      <div className="mt-4 flex h-full flex-col">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/Pen Swish Dark Blue_FacultyClearTrack.png"
              alt="Faculty ClearTrack"
              className="h-10 w-auto object-contain"
            />

            <span className="text-primary font-bold leading-[1.1] text-[clamp(1rem,3.5vw,1.4rem)]">
              XU Faculty <br /> ClearTrack
            </span>
          </div>

          <Divider className="-mx-6 mt-2 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

          <nav className="flex flex-col gap-4 mt-2">
            <div>
              <SheetClose asChild>
                <Link
                  to="/dual-role-approver-dashboard"
                  className="flex items-start gap-3 font-semibold text-primary text-xl"
                >
                  <img
                    src="/PrimaryHomeIcon.png"
                    alt="Approver Dashboard"
                    className="mt-0.5 h-5 w-5 object-contain"
                  />
                  <span className="leading-tight">Approver Dashboard</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>

                <div className="flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link to="/dual-role-announcement" className="text-xl font-regular text-primary">
                      Announcements
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link to="/dual-role-requirement-list" className="text-xl font-regular text-primary">
                      Requirements List
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link to="/dual-role-clearance" className="text-xl font-regular text-primary">
                      Clearance Requests
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link to="/dual-role-action" className="text-xl font-regular text-primary">
                      Actions
                    </Link>
                  </SheetClose>

                  <div className="mt-2 flex gap-4 ">
                    <div className="flex w-5 justify-center">
                      <div className="w-px bg-[hsl(var(--gray-border))]" />
                    </div>

                    <div className="flex flex-col space-y-3">
                      <SheetClose asChild>
                        <Link
                          to="/dual-role-approver-assistant-list"
                          className="text-xl font-regular text-primary"
                        >
                          View Approver Assistants
                        </Link>
                      </SheetClose>

                      <SheetClose asChild>
                        <Link to="/dual-role-activity-logs" className="text-xl font-regular text-primary">
                          Check Activity Logs
                        </Link>
                      </SheetClose>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SheetClose asChild>
                <Link
                  to="/dual-role-faculty-member-dashboard"
                  className="flex items-start gap-3 font-semibold text-primary text-xl"
                >
                  <img
                    src="/PrimaryHomeIcon.png"
                    alt="Faculty Member Dashboard"
                    className="mt-0.5 h-5 w-5 object-contain"
                  />
                  <span className="leading-tight">Faculty Member Dashboard</span>
                </Link>
              </SheetClose>
            </div>

            <div className="mt-2">
              <SheetClose asChild>
                <Link
                  to="/dual-role-notification"
                  className="flex items-start gap-3 text-xl font-semibold text-primary"
                >
                  <img
                    src="/PrimaryNotificationsIcon.png"
                    alt="Notifications"
                    className="mt-0.5 h-5 w-5 object-contain"
                  />
                  <span className="leading-tight">Notifications</span>
                </Link>
              </SheetClose>
            </div>
          </nav>
        </div>

        <Divider className="-mx-6 mt-6 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryLogoutIcon.png"
                  alt="Logout"
                  className="h-5 w-5 object-contain"
                />
                <span>Logout</span>
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-xs">
              <AlertDialogHeader className="items-center text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
                  <span className="text-2xl font-bold">!</span>
                </div>
                <AlertDialogTitle className="mt-2 text-base font-semibold">
                  You are logging out
                </AlertDialogTitle>
                <div className="text-sm font-semibold text-muted-foreground">
                  XU Faculty ClearTrack
                </div>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-2 flex flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction className="w-full" onClick={() => navigate("/login")}>
                  Logout
                </AlertDialogAction>
                <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </HeaderVariant>
  );
}

export function HROHeader() {
  const navigate = useNavigate();

  return (
    <HeaderVariant>
      <div className="mt-4 flex h-full flex-col">
        <div className="flex flex-col gap-4">

          <div className="flex items-center gap-4">
            <img
              src="/Pen Swish Dark Blue_FacultyClearTrack.png"
              alt="Faculty ClearTrack"
              className="h-10 w-auto object-contain"
            />

            <span className="text-primary font-bold leading-[1.1] text-[clamp(1rem,3.5vw,1.4rem)]">
              XU Faculty <br /> ClearTrack
            </span>
          </div>

        <Divider className="-mx-6 mt-2 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

          <nav className="flex flex-col gap-4 mt-2">
            <div>
              <SheetClose asChild>
                <Link
                  to="/HRO-dashboard"
                  className="flex items-center gap-3  font-semibold text-primary text-xl"
                >
                  <img
                    src="/PrimaryHomeIcon.png"
                    alt="Dashboard"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Dashboard</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>
                
                <div className="flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link
                      to="/HRO-dashboard"
                      className="text-xl font-regular text-primary"
                    >
                      Approver View
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/HRO-dashboard"
                      className="text-xl font-regular text-primary"
                    >
                      Announcements
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </div>

            <div className="mt-2">
            <SheetClose asChild>
              <Link
                to="/HRO-clearance"
                className="flex items-center gap-3 text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryPenIcon.png"
                  alt="Clearance"
                  className="h-5 w-5 object-contain"
                />
                <span>Clearance</span>
              </Link>
            </SheetClose>
            </div>

           <div className="mt-2">
              <SheetClose asChild>
                <Link
                  to="/HRO-action"
                  className="flex items-center gap-3 text-xl font-semibold text-primary"
                >
                  <img
                    src="/PrimaryClockIcon.png"
                    alt="Actions"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Actions</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>
                <div className=" flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link
                      to="/HRO-assistant-list"
                      className="text-xl font-regular text-primary"
                    >
                      View Approver Assistants
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/HRO-export-archive-clearance"
                      className="text-xl font-regular text-primary"
                    >
                      Export & Archive Clearance
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/HRO-activity-logs"
                      className="text-xl font-regular text-primary"
                    >
                      Check Activity Logs
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </div>

            <div className="mt-2">
            <SheetClose asChild>
              <Link
                to="/HRO-notification"
                className="flex items-center gap-3 text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryNotificationsIcon.png"
                  alt="Notifications"
                  className="h-5 w-5 object-contain"
                />
                <span>Notifications</span>
              </Link>
            </SheetClose>
            </div>
          </nav>
        </div>

        <Divider className="-mx-6 mt-6 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryLogoutIcon.png"
                  alt="Logout"
                  className="h-5 w-5 object-contain"
                />
                <span>Logout</span>
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-xs">
              <AlertDialogHeader className="items-center text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
                  <span className="text-2xl font-bold">!</span>
                </div>
                <AlertDialogTitle className="mt-2 text-base font-semibold">
                  You are logging out
                </AlertDialogTitle>
                <div className="text-sm font-semibold text-muted-foreground">
                  XU Faculty ClearTrack
                </div>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-2 flex flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Logout
                </AlertDialogAction>
                <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </HeaderVariant>
  );
}

export function CISCOHeader() {
  const navigate = useNavigate();

  return (
    <HeaderVariant>
      <div className="mt-4 flex h-full flex-col">
        <div className="flex flex-col gap-4">

          <div className="flex items-center gap-4">
            <img
              src="/Pen Swish Dark Blue_FacultyClearTrack.png"
              alt="Faculty ClearTrack"
              className="h-10 w-auto object-contain"
            />

            <span className="text-primary font-bold leading-[1.1] text-[clamp(1rem,3.5vw,1.4rem)]">
              XU Faculty <br /> ClearTrack
            </span>
          </div>

        <Divider className="-mx-6 mt-2 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

          <nav className="flex flex-col gap-4 mt-2">
            <div>
              <SheetClose asChild>
                <Link
                  to="/CISCO-dashboard"
                  className="flex items-center gap-3  font-semibold text-primary text-xl"
                >
                  <img
                    src="/PrimaryHomeIcon.png"
                    alt="Dashboard"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Dashboard</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>
                
                <div className="flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link
                      to="/CISCO-system-guideline"
                      className="text-xl font-regular text-primary"
                    >
                      System Guidlines
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/CISCO-announcement"
                      className="text-xl font-regular text-primary"
                    >
                      Announcements
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </div>


           <div className="mt-2">
              <SheetClose asChild>
                <Link
                  to="/CISCO-tools"
                  className="flex items-center gap-3 text-xl font-semibold text-primary"
                >
                  <img
                    src="/PrimaryToolIcon.png"
                    alt="Actions"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Tools</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>
                <div className=" flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link
                      to="/CISCO-faculty-data-dump"
                      className="text-xl font-regular text-primary"
                    >
                      Faculty Data Dump
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      to="/CISCO-manage-system-user"
                      className="text-xl font-regular text-primary"
                    >
                      Manage System Users
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      to="/CISCO-activity-logs"
                      className="text-xl font-regular text-primary"
                    >
                      Check Activity Logs
                    </Link>
                  </SheetClose>

                </div>
              </div>
            </div>

            <div className="mt-2">
            <SheetClose asChild>
              <Link
                to="/CISCO-notification"
                className="flex items-center gap-3 text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryNotificationsIcon.png"
                  alt="Notifications"
                  className="h-5 w-5 object-contain"
                />
                <span>Notifications</span>
              </Link>
            </SheetClose>
            </div>
          </nav>
        </div>

        <Divider className="-mx-6 mt-6 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryLogoutIcon.png"
                  alt="Logout"
                  className="h-5 w-5 object-contain"
                />
                <span>Logout</span>
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-xs">
              <AlertDialogHeader className="items-center text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
                  <span className="text-2xl font-bold">!</span>
                </div>
                <AlertDialogTitle className="mt-2 text-base font-semibold">
                  You are logging out
                </AlertDialogTitle>
                <div className="text-sm font-semibold text-muted-foreground">
                  XU Faculty ClearTrack
                </div>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-2 flex flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Logout
                </AlertDialogAction>
                <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </HeaderVariant>
  );
}

export function OPVHEHeader() {
  const navigate = useNavigate();

  return (
    <HeaderVariant>
      <div className="mt-4 flex h-full flex-col">
        <div className="flex flex-col gap-4">

          <div className="flex items-center gap-4">
            <img
              src="/Pen Swish Dark Blue_FacultyClearTrack.png"
              alt="Faculty ClearTrack"
              className="h-10 w-auto object-contain"
            />

            <span className="text-primary font-bold leading-[1.1] text-[clamp(1rem,3.5vw,1.4rem)]">
              XU Faculty <br /> ClearTrack
            </span>
          </div>

        <Divider className="-mx-6 mt-2 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

          <nav className="flex flex-col gap-4 mt-2">
            <div>
              <SheetClose asChild>
                <Link
                  to="/OPVHE-dashboard"
                  className="flex items-center gap-3  font-semibold text-primary text-xl"
                >
                  <img
                    src="/PrimaryHomeIcon.png"
                    alt="Dashboard"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Dashboard</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>
                
                <div className="flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link
                      to="/OPVHE-system-guideline"
                      className="text-xl font-regular text-primary"
                    >
                      System Guidlines
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/OPVHE-announcements"
                      className="text-xl font-regular text-primary"
                    >
                      Announcements
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </div>


           <div className="mt-2">
              <SheetClose asChild>
                <Link
                  to="/OPVHE-tools"
                  className="flex items-center gap-3 text-xl font-semibold text-primary"
                >
                  <img
                    src="/PrimaryToolIcon.png"
                    alt="Actions"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Tools</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>
                <div className=" flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link
                      to="/OPVHE-clearance-timeline"
                      className="text-xl font-regular text-primary"
                    >
                      Clearance Timeline
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      to="/OPVHE-college-office-configuration"
                      className="text-xl font-regular text-primary"
                    >
                      College & Office Configuration
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      to="/OPVHE-system-analytics"
                      className="text-xl font-regular text-primary"
                    >
                      System Analytics
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      to="/OPVHE-activity-logs"
                      className="text-xl font-regular text-primary"
                    >
                      Check Activity Logs
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </div>

            <div className="mt-2">
            <SheetClose asChild>
              <Link
                to="/OPVHE-notification"
                className="flex items-center gap-3 text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryNotificationsIcon.png"
                  alt="Notifications"
                  className="h-5 w-5 object-contain"
                />
                <span>Notifications</span>
              </Link>
            </SheetClose>
            </div>
          </nav>
        </div>

        <Divider className="-mx-6 mt-6 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryLogoutIcon.png"
                  alt="Logout"
                  className="h-5 w-5 object-contain"
                />
                <span>Logout</span>
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-xs">
              <AlertDialogHeader className="items-center text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
                  <span className="text-2xl font-bold">!</span>
                </div>
                <AlertDialogTitle className="mt-2 text-base font-semibold">
                  You are logging out
                </AlertDialogTitle>
                <div className="text-sm font-semibold text-muted-foreground">
                  XU Faculty ClearTrack
                </div>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-2 flex flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Logout
                </AlertDialogAction>
                <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </HeaderVariant>
  );
}

export function AssistantApproverHeader() {
  const navigate = useNavigate();

  return (
    <HeaderVariant>
      <div className="mt-4 flex h-full flex-col">
        <div className="flex flex-col gap-4">

          <div className="flex items-center gap-4">
            <img
              src="/Pen Swish Dark Blue_FacultyClearTrack.png"
              alt="Faculty ClearTrack"
              className="h-10 w-auto object-contain"
            />

            <span className="text-primary font-bold leading-[1.1] text-[clamp(1rem,3.5vw,1.4rem)]">
              XU Faculty <br /> ClearTrack
            </span>
          </div>

        <Divider className="-mx-6 mt-2 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

          <nav className="flex flex-col gap-4 mt-2">
            <div>
              <SheetClose asChild>
                <Link
                  to="/assistant-approver-dashboard"
                  className="flex items-center gap-3  font-semibold text-primary text-xl"
                >
                  <img
                    src="/PrimaryHomeIcon.png"
                    alt="Dashboard"
                    className="h-5 w-5 object-contain"
                  />
                  <span>Dashboard</span>
                </Link>
              </SheetClose>

              <div className="mt-5 flex gap-3">
                <div className="flex w-5 justify-center">
                  <div className="w-px bg-[hsl(var(--gray-border))]" />
                </div>
                
                <div className="flex flex-col space-y-3">
                  <SheetClose asChild>
                    <Link
                      to="/assistant-approver-requirement-list"
                      className="text-xl font-regular text-primary"
                    >
                      Requirement List
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/assistant-approver-dashboard"
                      className="text-xl font-regular text-primary"
                    >
                      Announcements
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </div>

            <div className="mt-2">
            <SheetClose asChild>
              <Link
                to="/assistant-approver-clearance"
                className="flex items-center gap-3 text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryPenIcon.png"
                  alt="Clearance"
                  className="h-5 w-5 object-contain"
                />
                <span>Clearance</span>
              </Link>
            </SheetClose>
            </div>
            

            <div className="mt-2">
            <SheetClose asChild>
              <Link
                to="/assistant-approver-notification"
                className="flex items-center gap-3 text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryNotificationsIcon.png"
                  alt="Notifications"
                  className="h-5 w-5 object-contain"
                />
                <span>Notifications</span>
              </Link>
            </SheetClose>
            </div>
          </nav>
        </div>

        <Divider className="-mx-6 mt-6 w-[calc(100%+3rem)] border-[hsl(var(--gray-border))]" />

        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left text-xl font-semibold text-primary"
              >
                <img
                  src="/PrimaryLogoutIcon.png"
                  alt="Logout"
                  className="h-5 w-5 object-contain"
                />
                <span>Logout</span>
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-xs">
              <AlertDialogHeader className="items-center text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
                  <span className="text-2xl font-bold">!</span>
                </div>
                <AlertDialogTitle className="mt-2 text-base font-semibold">
                  You are logging out
                </AlertDialogTitle>
                <div className="text-sm font-semibold text-muted-foreground">
                  XU Faculty ClearTrack
                </div>
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-2 flex flex-col gap-2 sm:flex-col sm:space-x-0">
                <AlertDialogAction
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  Logout
                </AlertDialogAction>
                <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </HeaderVariant>
  );
}
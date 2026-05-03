import * as React from "react";

import { cn } from "../../components/lib/utils";

export type CrudExplainerProps = {
  className?: string;
};

export function CrudExplainer({ className }: CrudExplainerProps) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-primary",
        className,
      )}
    >
      <div className="text-base font-bold">What is Create, Read, Update, and Delete?</div>
      <div className="mt-2 text-sm">
        Create, Read, Update, Delete (CRUD) are the four basic operations you can perform on data in a
        system. They define what users are allowed to do.
      </div>

      <div className="mt-4 text-sm font-semibold">Here’s a simple explanation:</div>
      <ul className="mt-2 list-disc space-y-3 pl-5 text-sm">
        <li>
          <div className="font-semibold">Create (C) – Add new data</div>
          <div className="mt-0.5 text-sm">Example: A faculty member submits a new clearance request.</div>
        </li>

        <li>
          <div className="font-semibold">Read (R) – View or retrieve data</div>
          <div className="mt-0.5 text-sm">Example: An approver views a list of clearance requests.</div>
        </li>

        <li>
          <div className="font-semibold">Update (U) – Modify existing data</div>
          <div className="mt-0.5 text-sm">Example: An approver changes the status of a clearance request.</div>
        </li>

        <li>
          <div className="font-semibold">Delete (D) – Remove data</div>
          <div className="mt-0.5 text-sm">Example: A system admin deletes a user account.</div>
        </li>
      </ul>
    </div>
  );
}


import * as React from "react";

import { cn } from "../../components/lib/utils";
import { Checkbox } from "./checkbox";
import {
  Card,
  CardContent,
  CardTitle,
} from "./card";
import { Divider } from "./divider";

export type AccessControlPrivilege =
  | "Create"
  | "Read"
  | "Update"
  | "Delete";

export type AccessControlPermissionValue = boolean;

export type AccessControlEntityRow = {
  entity: string;
  values: Partial<Record<AccessControlPrivilege, AccessControlPermissionValue>>;
};

export type AccessControlCategory = {
  id: string;
  label: string;
  rows: AccessControlEntityRow[];
};

export type AccessControlCardProps = {
  roleTitle: string;
  categories: AccessControlCategory[];
  privileges?: AccessControlPrivilege[];
  onPermissionChange?: (args: {
    categoryId: string;
    entity: string;
    privilege: AccessControlPrivilege;
    value: boolean;
  }) => void;
  className?: string;
};

type PermissionState = Record<string, Record<string, Partial<Record<AccessControlPrivilege, boolean>>>>;

export function AccessControlCard({
  roleTitle,
  categories,
  privileges = [
    "Create",
    "Read",
    "Update",
    "Delete",
  ],
  onPermissionChange,
  className,
}: AccessControlCardProps) {
  const [activeCategoryId, setActiveCategoryId] = React.useState(categories[0]?.id ?? "");

  const [permissionState, setPermissionState] = React.useState<PermissionState>(() => {
    const next: PermissionState = {};
    for (const cat of categories) {
      next[cat.id] = {};
      for (const row of cat.rows) {
        next[cat.id][row.entity] = { ...row.values };
      }
    }
    return next;
  });

  React.useEffect(() => {
    const next: PermissionState = {};
    for (const cat of categories) {
      next[cat.id] = {};
      for (const row of cat.rows) {
        next[cat.id][row.entity] = { ...row.values };
      }
    }
    setPermissionState(next);
  }, [categories]);

  React.useEffect(() => {
    if (!activeCategoryId && categories[0]?.id) {
      setActiveCategoryId(categories[0].id);
    }
  }, [activeCategoryId, categories]);

  const activeCategory = React.useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId) ?? categories[0];
  }, [activeCategoryId, categories]);

  const handleToggle = React.useCallback(
    (categoryId: string, entity: string, privilege: AccessControlPrivilege, value: boolean) => {
      setPermissionState((prev) => {
        const prevCat = prev[categoryId] ?? {};
        const prevRow = prevCat[entity] ?? {};
        return {
          ...prev,
          [categoryId]: {
            ...prevCat,
            [entity]: {
              ...prevRow,
              [privilege]: value,
            },
          },
        };
      });
      onPermissionChange?.({ categoryId, entity, privilege, value });
    },
    [onPermissionChange],
  );

  return (
    <div className={cn("w-full", className)}>
      <CardTitle className="text-base font-semibold text-foreground">{roleTitle}</CardTitle>

      <div className="mt-3 flex flex-wrap items-end gap-0 border-b border-[hsl(var(--gray-border))]">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryId(cat.id)}
              className={cn(
                "-mb-px whitespace-nowrap rounded-t-md border px-3 py-1.5 text-xs font-semibold",
                "-ml-px first:ml-0",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isActive
                  ? "bg-primary text-primary-foreground border-primary border-b-primary"
                  : "bg-muted/40 text-muted-foreground border-[hsl(var(--gray-border))] hover:bg-muted/60",
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <Card className="mt-0 border bg-background rounded-t-none">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[640px]">
              <div
                className="grid bg-muted/30"
                style={{ gridTemplateColumns: `220px repeat(${privileges.length}, minmax(70px, 1fr))` }}
              >
                <div className="px-3 py-2 text-sm font-semibold uppercase text-muted-foreground">Entity</div>
                {privileges.map((p) => (
                  <div
                    key={p}
                    className="px-2 py-2 text-center text-sm font-semibold uppercase text-muted-foreground"
                  >
                    {p}
                  </div>
                ))}
              </div>

              <Divider className="border-[hsl(var(--gray-border))]" />

              <div className="divide-y divide-[hsl(var(--gray-border))]">
                {(activeCategory?.rows ?? []).map((row) => (
                  <div
                    key={row.entity}
                    className="grid bg-background"
                    style={{ gridTemplateColumns: `220px repeat(${privileges.length}, minmax(70px, 1fr))` }}
                  >
                    <div className="px-3 py-2 text-sm font-medium text-foreground">{row.entity}</div>
                    {privileges.map((p) => {
                      const checked =
                        !!permissionState?.[activeCategory?.id ?? ""]?.[row.entity]?.[p];
                      return (
                        <div key={p} className="flex items-center justify-center px-2 py-2">
                          <Checkbox
                            variant="primary"
                            checked={checked}
                            onCheckedChange={(v) => {
                              if (!activeCategory?.id) return;
                              handleToggle(activeCategory.id, row.entity, p, v === true);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Divider className="border-[hsl(var(--gray-border))]" />

          <div className="px-4 py-3">
            <div className="text-xs font-semibold text-muted-foreground">Key</div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Checkbox variant="primary" checked={false} disabled />
                <span>Not allowed</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Checkbox variant="primary" checked disabled />
                <span>Allowed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


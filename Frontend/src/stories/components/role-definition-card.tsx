import * as React from "react";

import { cn } from "../../components/lib/utils";
import { Card, CardContent } from "./card";

export type RoleDefinitionCardProps = {
  title: string;
  items: React.ReactNode[];
  className?: string;
};

export function RoleDefinitionCard({ title, items, className }: RoleDefinitionCardProps) {
  return (
    <Card className={cn("w-full rounded-md border bg-background shadow-none", className)}>
      <CardContent className="p-4">
        <div className="text-sm font-semibold text-foreground">{title}</div>

        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
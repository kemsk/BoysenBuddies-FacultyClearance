import * as React from "react";
import { cn } from "../../components/lib/utils";
type BaseCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};
function BaseCard({ className, children, ...props }: BaseCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[340px] flex-1 bg-white rounded-xl shadow-md border border-black/10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
export { BaseCard };

type StatCardVariant = "TotalFaculty" | "CompleteClearance" | "IncompleteClearance" | "Unprocessed" | "OverallCompletion";

type StatCardProps = BaseCardProps & {
  variant?: StatCardVariant;

  title?: React.ReactNode;

  number?: React.ReactNode;

  description?: React.ReactNode;

  descriptionValues?: Record<string, React.ReactNode>;

};



type VariantConfig = {

  title: string;

  numberColor: string;

  description: string;

  numberSuffix?: string;

};



const variantDefaults: Record<StatCardVariant, VariantConfig> = {

  TotalFaculty: {

    title: "Total Faculty Members",

    numberColor: "text-primary",

    description: "{fullTime} Full-Time · {partTime} Part-Time",

  },

  CompleteClearance: {

    title: "Complete Clearance",

    numberColor: "text-success",

    description: "{percentage}% of total faculty",

  },

  IncompleteClearance: {

    title: "Incomplete Clearance",

    numberColor: "text-orange-400",

    description: "Missing Requirements",

  },

  Unprocessed: {

    title: "Unprocessed Clearance",

    numberColor: "text-blue-500",

    description: "Awaiting Office Action",

  },

  OverallCompletion: {

    title: "Overall Completion",

    numberColor: "text-black",

    description: "{cleared} of {total} faculty cleared",

    numberSuffix: "%",

  },

};



export function StatCard({ className, children, variant, title, number, description, descriptionValues, ...props }: StatCardProps) {

  const config = variant ? variantDefaults[variant] : undefined;

  const finalTitle = title ?? config?.title;

  const finalNumberColor = config?.numberColor ? config.numberColor : "text-primary";

  const finalNumberSuffix = config?.numberSuffix || "";

  let finalDescription = description ?? config?.description;



  // Replace placeholders in description with provided values

  if (typeof finalDescription === "string" && descriptionValues) {

    finalDescription = finalDescription.replace(/\{(\w+)\}/g, (match, key) => {

      return String(descriptionValues[key] ?? match);

    });

  }



  return (

    <BaseCard className={className} {...props}>

      <div className="w-full px-6 py-5 flex flex-col justify-start gap-2">

        {finalTitle != null && <span className="text-md font-bold text-gray-800">{finalTitle}</span>}

        {number != null && (

          <span className={`text-3xl font-bold ${finalNumberColor}`}>

            {number}{finalNumberSuffix}

          </span>

        )}

        {finalDescription != null && <span className="text-xs text-gray-600">{finalDescription}</span>}

        {variant === "OverallCompletion" && number != null && number !== "" && (
          <div className="mt-3 w-full">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${Math.max(0, Math.min(100, Number(number)))}%` }}
              />
            </div>
          </div>
        )}

        {children}

      </div>

    </BaseCard>

  );

}



type OfficeBottleneckItem = {

  office: React.ReactNode;

  cleared: number;

  pending: number;

};



type CollegeClearanceStatus = "at_risk" | "in_progress" | "cleared";

type CollegeClearanceStatusItem = {
  college: React.ReactNode;
  facultyMembers: number;
  completed: number;
  total: number;
  status: CollegeClearanceStatus;
};

export function CollegeClearanceStatusCard({
  className,
  items,
  totalRow,
  footerLeft,
  footerActionLabel,
  onFooterAction,
}: {
  items: CollegeClearanceStatusItem[];
  totalRow?: Omit<CollegeClearanceStatusItem, "college" | "status"> & {
    college?: React.ReactNode;
    status?: CollegeClearanceStatus;
  };
  footerLeft?: React.ReactNode;
  footerActionLabel?: React.ReactNode;
  onFooterAction?: () => void;
} & BaseCardProps) {
  const statusConfig: Record<CollegeClearanceStatus, { label: string; className: string }> = {
    at_risk: { label: "AT RISK", className: "bg-orange-500 text-white" },
    in_progress: { label: "IN PROGRESS", className: "bg-blue-500 text-white" },
    cleared: { label: "CLEARED", className: "bg-success text-white" },
  };

  const renderRow = (
    row: CollegeClearanceStatusItem,
    opts?: { isTotal?: boolean },
  ) => {
    const safeTotal = Number.isFinite(row.total) && row.total > 0 ? row.total : 0;
    const safeCompleted = Number.isFinite(row.completed) ? row.completed : 0;
    const pct = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0;
    const status = statusConfig[row.status];
    const rateClass =
      row.status === "cleared"
        ? "text-success"
        : row.status === "in_progress"
          ? "text-blue-500"
          : "text-orange-500";
    return (
      <div
        className={cn(
          "grid grid-cols-[1fr_152px_190px_110px_140px] items-center px-5 py-4 text-sm",
          opts?.isTotal ? "bg-slate-50 font-semibold" : "bg-white",
        )}
      >
        <div className={cn("min-w-0", opts?.isTotal ? "text-gray-900" : "text-gray-800")}>{row.college}</div>
        <div className="text-center text-gray-700">{row.facultyMembers}</div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn(
                "h-full rounded-full",
                row.status === "cleared" ? "bg-success" : row.status === "in_progress" ? "bg-blue-500" : "bg-orange-500",
              )}
              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            />
          </div>
          <div className="text-xs font-medium text-gray-500">
            {safeCompleted}/{safeTotal}
          </div>
        </div>
        <div className={cn("text-center font-semibold", rateClass)}>{pct}%</div>
        <div className="flex justify-center">
          <span
            className={cn(
              "inline-flex w-[120px] whitespace-nowrap items-center justify-center rounded-md px-3 py-1 text-xs font-bold",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
      </div>
    );
  };

  const finalTotalRow: CollegeClearanceStatusItem | undefined =
    totalRow != null
      ? {
          college: totalRow.college ?? "Total/Overall",
          facultyMembers: totalRow.facultyMembers,
          completed: totalRow.completed,
          total: totalRow.total,
          status: totalRow.status ?? "in_progress",
        }
      : undefined;

  return (
    <BaseCard className={cn("max-w-full", className)}>
      <div className="w-full overflow-x-auto touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <div className="min-w-[760px] overflow-hidden rounded-xl">
          <div className="grid grid-cols-[1fr_152px_190px_110px_140px] bg-slate-50 px-5 py-4 text-sm font-bold text-primary">
            <div>College or School</div>
            <div className="text-center">Faculty Members</div>
            <div>Completed Clearance</div>
            <div className="text-center">Completion Rate</div>
            <div className="text-center">Status</div>
          </div>
          <div className="divide-y divide-black/10">
            {items.map((row, idx) => (
              <React.Fragment key={idx}>{renderRow(row)}</React.Fragment>
            ))}
            {finalTotalRow != null ? renderRow(finalTotalRow, { isTotal: true }) : null}
          </div>
          <div className="flex items-center justify-between gap-4 bg-slate-50 px-5 py-4">
            <div className="text-sm text-gray-500">{footerLeft}</div>
            {footerActionLabel != null ? (
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary"
                onClick={onFooterAction}
              >
                {footerActionLabel}
                <span className="ml-2">→</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </BaseCard>
  );
}



export function OfficeBottlenecksCard({

  className,

  items,

  clearedLabel = "Cleared",

  pendingLabel = "Pending",

}: {

  items: OfficeBottleneckItem[];

  clearedLabel?: React.ReactNode;

  pendingLabel?: React.ReactNode;

} & BaseCardProps) {

  const maxValue = Math.max(

    1,

    ...items.flatMap((i) => [

      Number.isFinite(i.cleared) ? i.cleared : 0,

      Number.isFinite(i.pending) ? i.pending : 0,

    ]),

  );



  const rows = items.map((i) => {

    const total = (Number.isFinite(i.cleared) ? i.cleared : 0) + (Number.isFinite(i.pending) ? i.pending : 0);

    const pendingRate = total > 0 ? (i.pending / total) * 100 : 0;

    return { ...i, total, pendingRate };

  });



  const yTicks = [100, 75, 50, 25, 0] as const;



  return (

    <BaseCard className={cn("max-w-full", className)}>

      <div className="w-full px-6 py-5">

        <div className="w-full pt-8 pb-8">

          <div className="w-full">

            <div className="flex w-full gap-4">

              <div className="relative h-32 w-9 shrink-0">

                {yTicks.map((tick) => {

                  const topPct = 100 - tick;

                  const transform = "translateY(-50%)";



                  return (

                    <div

                      key={tick}

                      className="absolute right-0 text-[10px] font-medium text-gray-400"

                      style={{ top: `${topPct}%`, transform }}

                    >

                      {tick}

                    </div>

                  );
                })}
              </div>

              <div className="relative h-32 min-w-0 flex-1">
                <div className="pointer-events-none absolute inset-0">
                  {yTicks.map((tick) => {
                    const topPct = 100 - tick;
                    return (
                      <div
                        key={tick}
                        className="absolute left-0 right-0 border-t border-dashed border-black/10"
                        style={{ top: `${topPct}%` }}
                      />
                    );
                  })}
                </div>

                <div className="relative flex h-full w-full items-end justify-between gap-4">
                  {rows.map((row, idx) => {
                    const clearedH = (row.cleared / maxValue) * 100;
                    const pendingH = (row.pending / maxValue) * 100;
                    return (
                      <div key={idx} className="flex min-w-0 flex-1 h-full items-end justify-center">
                        <div className="flex h-full items-end gap-2">
                          <div
                            className="w-6 rounded-sm bg-success"
                            style={{ height: `${clearedH}%` }}
                          />
                          <div
                            className="w-6 rounded-sm bg-orange-400"
                            style={{ height: `${pendingH}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-2 flex w-full gap-4">
              <div className="w-9 shrink-0" />
              <div className="flex min-w-0 flex-1 justify-between gap-4">
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="min-w-0 flex-1 text-center text-[10px] leading-tight text-gray-500 whitespace-normal break-words"
                  >
                    {row.office}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span>{clearedLabel}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span>{pendingLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 w-full overflow-x-auto touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <div className="min-w-[640px] overflow-hidden rounded-lg border border-black/10">
            <div className="grid grid-cols-[1fr_110px_110px_180px] bg-slate-50 px-4 py-3 text-sm font-bold text-primary">
              <div>Office</div>
              <div className="text-center">Cleared</div>
              <div className="text-center">Pending</div>
              <div className="text-center">Pending Rate</div>
            </div>

            <div className="divide-y divide-black/10">
              {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_110px_110px_180px] items-center px-4 py-4 text-sm">

                  <div className="min-w-0 truncate text-gray-800">{row.office}</div>
                  <div className="text-center font-semibold text-success">{row.cleared}</div>
                  <div className="text-center font-semibold text-orange-500">{row.pending}</div>

                  <div className="flex items-center justify-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-orange-400"
                        style={{ width: `${Math.max(0, Math.min(100, row.pendingRate))}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-xs font-semibold text-orange-600">
                      {Math.round(row.pendingRate)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}

type FacultyCompositionItem = {
  label: React.ReactNode;
  value: number;
  color: string;
  dotClassName?: string;
  valueClassName?: string;
};


export function FacultyCompositionCard({
  className,
  title,
  subtitle,
  items,

}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  items: FacultyCompositionItem[];

} & BaseCardProps) {
  const total = items.reduce((acc, item) => acc + (Number.isFinite(item.value) ? item.value : 0), 0);
  const safeTotal = total > 0 ? total : 1;

  const stops = items
    .reduce<{ pct: number; color: string }[]>((acc, item) => {
      const pct = Math.max(0, (item.value / safeTotal) * 100);
      acc.push({ pct, color: item.color });
      return acc;
    }, [])
    .map((x) => x);
  let cumulative = 0;

  const gradient = stops
    .map((s) => {
      const start = cumulative;
      cumulative += s.pct;
      const end = cumulative;
      return `${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    })
    .join(", ");

  const donutStyle: React.CSSProperties = {
    background: `conic-gradient(${gradient})`,
  };

  return (
    <BaseCard className={cn("max-w-full", className)}>
      <div className="w-full h-full px-6 py-5 flex items-center">
        <div className="flex w-full items-center gap-6">
          <div className="shrink-0">
            <div className="relative h-28 w-28">
              <div
                className="absolute inset-0 rounded-full"
                style={donutStyle}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-white" />
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-primary">{title}</div>
            {subtitle != null ? (
              <div className="mt-1 text-sm text-gray-600">{subtitle}</div>
            ) : null}

            <div className="mt-4 space-y-2">
              {items.map((item, idx) => {
                const pct = Math.round((item.value / safeTotal) * 100);

                return (
                  <div key={idx} className="flex items-center justify-between gap-6">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn("h-3 w-3 rounded-full", item.dotClassName)}
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 truncate text-sm text-gray-700">{item.label}</div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className={cn("text-sm font-semibold text-gray-700", item.valueClassName)}>
                        {item.value}
                      </span>
                      <span className="text-sm text-gray-500">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}



export function StatCardWithActions({ 
  className, 
  leftContent, 
  rightContent,
  ...props 
}: {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {

  return (
    <div className={cn("w-full flex items-center justify-between", className)} {...props}>
      <div className="min-w-0 flex-1">
        {leftContent}
      </div>

      <div className="shrink-0 ml-4">
        {rightContent}
      </div>
    </div>
  );
}

type ClearanceDistributionItem = {
  label: React.ReactNode;
  value: number;
  percentage?: number;
  barClassName: string;
  dotClassName?: string;
  valueClassName?: string;
};

export function ClearanceDistributionCard({
  className,
  title,
  total,
  items,
  showRemainder = true,
}: {

  title: React.ReactNode;
  total: number;
  items: ClearanceDistributionItem[];
  showRemainder?: boolean;

} & BaseCardProps) {
  const safeTotal = total > 0 ? total : 0;
  const computedItems = items.map((item) => {
    const pctFromProp = typeof item.percentage === "number" ? item.percentage : undefined;
    const pctFromValue = safeTotal ? (item.value / safeTotal) * 100 : 0;
    const pct = Math.max(0, Math.min(100, pctFromProp ?? pctFromValue));
    return { ...item, _pct: pct };
  });

  const usedPct = computedItems.reduce((acc, item) => acc + item._pct, 0);
  const remainderPct = showRemainder ? Math.max(0, Math.min(100, 100 - usedPct)) : 0;

  return (
    <BaseCard className={cn("max-w-full", className)}>
      <div className="w-full h-full px-6 py-5 flex flex-col justify-center">
        <div className="text-sm font-medium text-gray-700">{title}</div>
        <div className="mt-4 w-full overflow-hidden rounded-md bg-gray-200">
          <div className="flex h-8 w-full">
            {computedItems.map((item, idx) => (
              <div
                key={idx}
                className={cn("h-full", item.barClassName)}
                style={{ width: `${item._pct}%` }}
              />
            ))}
            {remainderPct > 0 ? (
              <div className="h-full bg-gray-200" style={{ width: `${remainderPct}%` }} />
            ) : null}
          </div>
        </div>


        <div className="mt-5 space-y-2">
          {computedItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    item.dotClassName ?? item.barClassName,
                  )}
                />
                <div className="min-w-0 truncate text-sm text-gray-700">{item.label}</div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className={cn("text-sm font-semibold", item.valueClassName ?? "text-gray-700")}
                >
                  {item.value}
                </span>
                <span className="text-sm text-gray-500">({Math.round(item._pct)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseCard>
  );
}


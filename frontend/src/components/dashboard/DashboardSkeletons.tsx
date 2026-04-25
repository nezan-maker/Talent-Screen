import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function SurfaceCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <Card className={className}>{children}</Card>;
}

function PageHeaderSkeleton({
  withBack = true,
  actionWidth = "w-32",
  secondaryActionWidth,
}: {
  withBack?: boolean;
  actionWidth?: string;
  secondaryActionWidth?: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex items-center gap-4">
        {withBack ? <Skeleton className="h-10 w-10 rounded-input" /> : null}
        <div>
          <Skeleton className="h-8 w-44 max-w-[70vw]" />
          <Skeleton className="mt-2 h-4 w-72 max-w-[78vw]" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {secondaryActionWidth ? (
          <Skeleton className={`h-11 rounded-full ${secondaryActionWidth}`} />
        ) : null}
        <Skeleton className={`h-11 rounded-full ${actionWidth}`} />
      </div>
    </div>
  );
}

function FilterPillsSkeleton({
  count = 4,
  widths = ["w-20", "w-24", "w-24", "w-24"],
}: {
  count?: number;
  widths?: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-9 rounded-full ${widths[index % widths.length]}`}
        />
      ))}
    </div>
  );
}

function MetricCardsSkeleton({
  count = 3,
  className = "grid gap-4 md:grid-cols-3",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <SurfaceCard key={index} className="rounded-[22px] border-border/60">
          <CardBody className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-11 w-11 rounded-2xl" />
            </div>
            <Skeleton className="h-3 w-36" />
          </CardBody>
        </SurfaceCard>
      ))}
    </div>
  );
}

function DirectoryCardSkeleton() {
  return (
    <SurfaceCard className="rounded-card border-border">
      <CardBody className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-7 w-7 rounded-full ring-2 ring-white" />
              ))}
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </CardBody>
    </SurfaceCard>
  );
}

function TableSkeleton({
  rows = 5,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <SurfaceCard className="overflow-hidden rounded-card">
      <div className="border-b border-border bg-bg/50 px-6 py-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-16" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid items-center gap-4 px-6 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, colIndex) => (
              <Skeleton
                key={colIndex}
                className={
                  colIndex === 0
                    ? "h-10 w-40 rounded-full"
                    : colIndex === columns - 1
                      ? "ml-auto h-10 w-20 rounded-full"
                      : "h-4 w-full max-w-[120px]"
                }
              />
            ))}
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

export function DashboardHeaderAccountSkeleton() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-bg/80 py-1.5 pl-2 pr-4 shadow-sm">
      <Skeleton className="h-11 w-11 rounded-full" />
      <div className="hidden min-w-0 sm:block">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>

        <div className="flex items-center gap-8 rounded-[28px] border border-border/70 bg-card/85 px-6 py-4 shadow-soft">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      <FilterPillsSkeleton count={5} widths={["w-14", "w-20", "w-28", "w-20", "w-24"]} />

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <DirectoryCardSkeleton key={index} />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>

        <TableSkeleton rows={5} columns={6} />
      </div>
    </div>
  );
}

export function JobsListSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton actionWidth="w-32" />

      <SurfaceCard>
        <div className="border-b border-border/50 p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-11 w-full rounded-full md:max-w-md" />
            <FilterPillsSkeleton count={5} widths={["w-14", "w-16", "w-24", "w-16", "w-20"]} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <DirectoryCardSkeleton key={index} />
            ))}
          </div>
        </CardBody>
      </SurfaceCard>
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton actionWidth="w-40" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SurfaceCard className="lg:col-span-2">
          <div className="border-b border-border/50 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <CardBody className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>

            <MetricCardsSkeleton count={2} className="grid gap-4 md:grid-cols-2" />

            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-[92%]" />
                <Skeleton className="mt-2 h-4 w-[78%]" />
              </div>
            ))}
          </CardBody>
        </SurfaceCard>

        <SurfaceCard>
          <div className="border-b border-border/50 p-6">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <CardBody className="space-y-4">
            <div className="rounded-card border border-border bg-accent/8 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-5 w-20" />
            </div>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-[82%]" />
              </div>
            ))}
          </CardBody>
        </SurfaceCard>
      </div>
    </div>
  );
}

export function CandidatesListSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton actionWidth="w-28" />

      <SurfaceCard>
        <div className="border-b border-border/50 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-11 w-full rounded-full md:max-w-md" />
            <FilterPillsSkeleton count={3} widths={["w-14", "w-24", "w-28"]} />
          </div>

          <TableSkeleton rows={6} columns={6} />
        </CardBody>
      </SurfaceCard>
    </div>
  );
}

export function CandidateDetailSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton actionWidth="w-28" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <SurfaceCard>
          <div className="border-b border-border/50 p-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <CardBody className="space-y-6">
            <div className="flex flex-col gap-5 sm:flex-row">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-7 w-44" />
                  <Skeleton className="h-7 w-24 rounded-full" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-10 w-24 rounded-full" />
                  <Skeleton className="h-10 w-28 rounded-full" />
                </div>
              </div>
            </div>

            <MetricCardsSkeleton count={3} />

            <div>
              <Skeleton className="h-4 w-14" />
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </div>

            <div>
              <Skeleton className="h-4 w-24" />
              <div className="mt-3 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-card" />
                ))}
              </div>
            </div>
          </CardBody>
        </SurfaceCard>

        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <SurfaceCard key={index}>
              <div className="border-b border-border/50 p-6">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="mt-2 h-4 w-64" />
              </div>
              <CardBody className="space-y-4">
                {Array.from({ length: index === 0 ? 3 : 4 }).map((__, rowIndex) => (
                  <Skeleton key={rowIndex} className="h-20 w-full rounded-card" />
                ))}
              </CardBody>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JobBuilderSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton withBack={false} />

      <SurfaceCard className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
              {index !== 3 ? <Skeleton className="h-px w-10" /> : null}
            </div>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SurfaceCard>
          <div className="border-b border-border/50 p-6">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <CardBody className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-32" />
                <Skeleton
                  className={`mt-2 w-full rounded-input ${
                    index > 2 ? "h-28" : "h-10"
                  }`}
                />
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </CardBody>
        </SurfaceCard>

        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <SurfaceCard key={index}>
              <div className="border-b border-border/50 p-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-56" />
              </div>
              <CardBody className="space-y-3">
                {Array.from({ length: index === 0 ? 6 : 3 }).map((__, rowIndex) => (
                  <Skeleton key={rowIndex} className="h-16 w-full rounded-card" />
                ))}
              </CardBody>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton actionWidth="w-24" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <SurfaceCard key={index}>
            <div className="border-b border-border/50 p-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-2 h-4 w-56" />
            </div>
            <CardBody className="space-y-4">
              <Skeleton className="h-24 w-full rounded-card" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </CardBody>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-10">
      <PageHeaderSkeleton actionWidth="w-24" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <SurfaceCard key={index}>
            <div className="border-b border-border/50 p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-input" />
                <div>
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="mt-2 h-4 w-56" />
                </div>
              </div>
            </div>
            <CardBody className="space-y-5">
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <div key={rowIndex}>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-2 h-10 w-full rounded-input" />
                </div>
              ))}
            </CardBody>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard>
        <div className="border-b border-border/50 p-6">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <CardBody className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-10 w-full rounded-input" />
            </div>
          ))}
        </CardBody>
      </SurfaceCard>

      <SurfaceCard>
        <div className="border-b border-border/50 p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <CardBody className="space-y-4">
          <Skeleton className="h-4 w-72" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-10 w-28 rounded-input" />
            <Skeleton className="h-10 w-32 rounded-input" />
          </div>
        </CardBody>
      </SurfaceCard>
    </div>
  );
}

export function AskTalvoSkeleton() {
  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-[32px] border border-border/50 bg-gradient-to-br from-orange-50/90 via-yellow-50/70 to-white shadow-lg">
      <div className="relative z-10 flex flex-1 flex-col gap-6 overflow-hidden px-4 py-4 lg:flex-row lg:px-8 lg:py-8">
        <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-[24px] border border-border/50 bg-white/75 shadow-soft lg:w-[300px]">
          <div className="p-6 pb-3">
            <div className="mb-8 flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-11 w-full rounded-full" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 rounded-2xl px-3 py-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-full" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-border/50 p-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-[20px]" />
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="absolute right-0 top-0 z-20 flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 pt-20 md:p-8">
            <Skeleton className="h-12 w-96 max-w-full" />
            <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 px-2 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="min-h-[180px] w-full rounded-[24px]" />
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-44 rounded-full" />
              ))}
            </div>
          </div>

          <div className="mt-auto w-full bg-transparent pt-4">
            <div className="mx-auto flex w-full max-w-4xl items-center">
              <Skeleton className="h-[60px] w-full rounded-[20px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreeningIntakeSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton actionWidth="w-32" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
        <div className="space-y-6">
          <MetricCardsSkeleton />

          <FilterPillsSkeleton count={3} widths={["w-28", "w-24", "w-28"]} />

          <SurfaceCard className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Skeleton className="h-10 w-full rounded-input md:max-w-md" />
              <Skeleton className="h-10 w-40 rounded-input" />
            </div>
          </SurfaceCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SurfaceCard key={index} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="mt-2 h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-24 rounded-full" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <SurfaceCard key={index}>
              <div className="border-b border-border/50 p-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-2 h-4 w-60" />
              </div>
              <CardBody className="space-y-4">
                {Array.from({ length: index === 0 ? 3 : 3 }).map((__, rowIndex) => (
                  <Skeleton key={rowIndex} className="h-20 w-full rounded-card" />
                ))}
              </CardBody>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScreeningProgressSkeleton() {
  return (
    <div className="min-h-[70vh] rounded-[32px] bg-gradient-to-br from-primary to-accent p-8 text-white shadow-soft">
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <Skeleton className="h-20 w-20 rounded-full bg-white/15" />
        <Skeleton className="mt-6 h-10 w-80 max-w-full bg-white/15" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full bg-white/15" />

        <div className="mt-10 w-full rounded-card border border-white/15 bg-white/5 p-6">
          <Skeleton className="h-4 w-20 bg-white/15" />
          <Skeleton className="mt-3 h-3 w-full rounded-full bg-white/15" />

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-[74px] w-full rounded-card bg-white/15" />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Skeleton className="h-4 w-40 bg-white/15" />
            <Skeleton className="h-4 w-10 bg-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreeningResultsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-44 rounded-[28px]" />
      <div className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-[22px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Skeleton className="h-[470px] rounded-[24px]" />
        <Skeleton className="h-[470px] rounded-[24px]" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="h-[420px] rounded-[24px]" />
        <Skeleton className="h-[420px] rounded-[24px]" />
      </div>
    </div>
  );
}

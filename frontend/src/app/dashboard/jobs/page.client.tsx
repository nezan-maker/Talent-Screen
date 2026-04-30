"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { JobsListSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { getJobs } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn, formatShortDate } from "@/lib/utils";

const PAGE_SIZE = 5;

function statusBadgeVariant(status: string) {
  if (status === "Screening") return "warning";
  if (status === "Complete") return "success";
  if (status === "Active") return "info";
  return "default";
}

export default function JobsListPage() {
  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | "Active" | "Screening" | "Draft" | "Complete">("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = jobs ?? [];
    return list.filter((job) => {
      const matchesStatus = status === "All" ? true : job.status === status;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q
        ? true
        : [job.title, job.department, job.location].filter(Boolean).some((part) => String(part).toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [jobs, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedJobs = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, status]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (isLoading) {
    return <JobsListSkeleton />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <PageHeader
        title="Jobs"
        subtitle="Review active roles, drafts, and screening status across the workspace."
        backHref={ROUTES.dashboard}
        right={
          <Link href={ROUTES.newJob}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create job
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader title="Role directory" subtitle="Search and filter your current roles." />
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:ring-2 focus:ring-accent/30"
                placeholder="Search by title, department, or location..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["All", "Active", "Screening", "Draft", "Complete"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                    status === s ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-bg hover:text-text-primary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-card border border-border bg-bg p-6 text-sm">
              <div className="font-semibold text-text-primary">Could not load jobs.</div>
              <div className="mt-1 text-text-muted">Try again to refresh the list.</div>
              <div className="mt-4">
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-card border border-border bg-bg p-8 text-center">
              <Briefcase className="mx-auto mb-3 h-9 w-9 text-text-muted" />
              <div className="text-sm font-semibold text-text-primary">No roles match this filter</div>
              <div className="mt-1 text-sm text-text-muted">Adjust your search or create a new job to get started.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="group rounded-card border border-border bg-surface p-5 shadow-soft transition-all hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-accent">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <Badge variant={statusBadgeVariant(job.status)} dot>
                      {job.status}
                    </Badge>
                  </div>

                  <div className="mt-4 text-base font-bold text-text-primary group-hover:text-accent transition-colors">
                    {job.title}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-text-muted">
                    {job.department} • {job.location || "Remote"}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <div className="text-text-muted">
                      Updated {job.updatedAtISO ? formatShortDate(job.updatedAtISO) : "recently"}
                    </div>
                    <div className="inline-flex items-center gap-1 font-semibold text-accent">
                      Open <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!error && filtered.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-text-muted">
                Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="min-w-[110px] text-center text-sm font-semibold text-text-primary">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Minus,
  MoreHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { ApplicationSourcesChart } from "@/components/dashboard/ApplicationSourcesChart";
import { CandidateInflowChart } from "@/components/dashboard/CandidateInflowChart";
import { ScreeningTargetsCard } from "@/components/dashboard/ScreeningTargetsCard";
import { StatSparkline } from "@/components/dashboard/StatSparkline";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDashboardOverview } from "@/hooks/useDashboard";
import { ROUTES } from "@/lib/constants";
import { cn, formatNumber, formatShortDate } from "@/lib/utils";
import type { Job, Trend } from "@/types";

export const dynamic = "force-dynamic";

function sparkFromSeed(seed: number) {
  return Array.from({ length: 8 }, (_, i) => ({ i, v: seed + i * 2 + ((i + seed) % 3) * 3 }));
}

function TrendLine({ trend }: { trend: Trend }) {
  const Icon =
    trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;
  const color =
    trend.direction === "up"
      ? "text-success"
      : trend.direction === "down"
        ? "text-danger"
        : "text-text-muted";

  return (
    <div className="mt-1 flex items-center gap-1 text-xs text-text-muted">
      <Icon className={cn("h-3 w-3 shrink-0", color)} />
      <span className="font-semibold text-text-primary">{trend.value}</span>
      <span>{trend.label}</span>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  meta,
  loading,
  spark,
}: {
  title: string;
  value: string;
  icon: typeof Briefcase;
  trend: Trend;
  meta?: string;
  loading: boolean;
  spark: Array<{ i: number; v: number }>;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
      <div className="rounded-card border border-border bg-card p-5 shadow-card dark:bg-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-text-muted">{title}</div>
            <div className="mt-1 text-3xl font-bold tracking-tight text-text-primary">
              {loading ? <Skeleton className="h-9 w-28" /> : value}
            </div>
            {loading ? <Skeleton className="mt-3 h-3 w-40" /> : <TrendLine trend={trend} />}
            {meta ? <div className="mt-1 text-xs text-text-muted">{meta}</div> : null}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent ring-4 ring-accent/5">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {loading ? <Skeleton className="mt-4 h-12 w-full rounded-input" /> : <StatSparkline data={spark} />}
      </div>
    </motion.div>
  );
}

function statusBadgeVariant(status: string) {
  if (status === "Screening") return "warning";
  if (status === "Complete") return "success";
  if (status === "Active") return "info";
  return "default";
}

function PriorityRow({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-card border border-border bg-bg p-4 transition-colors hover:border-accent/30 hover:bg-card"
    >
      <div>
        <div className="text-sm font-semibold text-text-primary">{title}</div>
        <div className="mt-1 text-sm text-text-muted">{description}</div>
      </div>
      <div className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function buildPriorityItems(jobs: Job[]) {
  const jobsWithoutApplicants = jobs.filter((job) => job.applicantsCount === 0);
  const awaitingShortlist = jobs.filter(
    (job) => job.applicantsCount > 0 && job.shortlistedCount === 0,
  );
  const draftJobs = jobs.filter((job) => job.status === "Draft");

  const items = [];

  if (jobsWithoutApplicants.length > 0) {
    items.push({
      title: `${jobsWithoutApplicants.length} role${jobsWithoutApplicants.length > 1 ? "s" : ""} need applicants`,
      description: `Start sourcing candidates for ${jobsWithoutApplicants[0]?.title ?? "your open roles"} before the pipeline goes cold.`,
      href: jobsWithoutApplicants[0] ? `/dashboard/jobs/${jobsWithoutApplicants[0].id}` : ROUTES.newJob,
      cta: "Open role",
    });
  }

  if (awaitingShortlist.length > 0) {
    items.push({
      title: `${awaitingShortlist.length} role${awaitingShortlist.length > 1 ? "s" : ""} await shortlist review`,
      description: `Applicants are in, but no one has been shortlisted yet for ${awaitingShortlist[0]?.title ?? "these roles"}.`,
      href: awaitingShortlist[0] ? `/dashboard/jobs/${awaitingShortlist[0].id}` : ROUTES.dashboard,
      cta: "Review pipeline",
    });
  }

  if (draftJobs.length > 0) {
    items.push({
      title: `${draftJobs.length} draft role${draftJobs.length > 1 ? "s" : ""} still need launch details`,
      description: `Finish the screening setup so recruiters can start collecting signal instead of waiting.`,
      href: draftJobs[0] ? `/dashboard/jobs/${draftJobs[0].id}` : ROUTES.newJob,
      cta: "Finish setup",
    });
  }

  if (items.length === 0) {
    items.push({
      title: "Your workflow is clear right now",
      description: "No urgent hiring bottlenecks detected. This is a good moment to launch the next role.",
      href: ROUTES.newJob,
      cta: "Create job",
    });
  }

  return items.slice(0, 3);
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardOverview();

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-danger">Failed to load dashboard</h2>
          <p className="mb-4 text-text-muted">Please try again later.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <PageHeader
          title="Dashboard"
          subtitle="Welcome back — here’s what needs attention in your hiring workflow."
        />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-card border border-border bg-card p-5 shadow-card dark:bg-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Skeleton className="mb-1 h-4 w-20" />
                  <Skeleton className="mb-3 h-9 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-11 w-11 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-12 w-full rounded-input" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!data) {
    return null;
  }

  const { stats, jobs, applicants } = data;
  const priorityItems = buildPriorityItems(jobs);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here’s what needs attention in your hiring workflow."
      />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Jobs"
          value={formatNumber(stats.activeJobs.value)}
          icon={Briefcase}
          trend={stats.activeJobs.trend}
          spark={sparkFromSeed(4)}
          loading={isLoading}
        />
        <StatCard
          title="Total Applicants"
          value={formatNumber(stats.totalApplicants.value)}
          icon={Users}
          trend={stats.totalApplicants.trend}
          spark={sparkFromSeed(18)}
          loading={isLoading}
        />
        <StatCard
          title="Shortlisted"
          value={formatNumber(stats.shortlisted.value)}
          icon={Sparkles}
          trend={stats.shortlisted.trend}
          meta={`Conversion: ${stats.shortlisted.conversionRatePct}%`}
          spark={sparkFromSeed(6)}
          loading={isLoading}
        />
        <StatCard
          title="In Screening"
          value={formatNumber(stats.inScreening.value)}
          icon={Sparkles}
          trend={stats.inScreening.trend}
          meta={`Avg time: ${stats.inScreening.avgTimePerCandidateMins}m / candidate`}
          spark={sparkFromSeed(10)}
          loading={isLoading}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <Card>
          <CardHeader
            title="Action Center"
            subtitle="The highest-leverage next moves across open roles and incoming applicants."
          />
          <CardBody className="space-y-4">
            {priorityItems.map((item) => (
              <PriorityRow key={item.title} {...item} />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pipeline Pulse" subtitle="A quick read before you dive deeper." />
          <CardBody className="space-y-4">
            <div className="rounded-card border border-border bg-bg p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <AlertCircle className="h-3.5 w-3.5" />
                Candidate Flow
              </div>
              <div className="mt-2 text-sm text-text-muted">
                {applicants.length === 0
                  ? "No applicants yet. Your next win is getting profiles into the funnel."
                  : `${applicants.length} applicants are currently in play across ${jobs.length} roles.`}
              </div>
            </div>
            <div className="rounded-card border border-border bg-bg p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Hiring Rhythm</div>
              <div className="mt-2 text-sm text-text-muted">
                {jobs.some((job) => job.status === "Draft")
                  ? "You still have draft roles waiting for setup. Finishing them will unblock sourcing."
                  : "Your active roles are live. Focus on review speed and shortlist confidence."}
              </div>
            </div>
            <Link href={ROUTES.newJob} className="block">
              <div className="rounded-card border border-accent/25 bg-accent p-5 text-white shadow-card">
                <div className="text-sm font-semibold opacity-90">Quick Action</div>
                <div className="mt-1 text-xl font-bold">Create New Job</div>
                <div className="mt-2 text-sm opacity-90">
                  Launch the next role without leaving your current workflow.
                </div>
              </div>
            </Link>
          </CardBody>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <CandidateInflowChart />
        </div>
        <div className="flex flex-col gap-6">
          <ApplicationSourcesChart />
          <ScreeningTargetsCard />
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader title="Recent Jobs" subtitle="Latest pipeline activity across your roles." />
          <CardBody className="px-0 pb-0">
            {jobs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold">No jobs yet</div>
                <div className="mt-1 text-sm text-text-muted">
                  Create your first job to start screening candidates.
                </div>
                <div className="mt-4">
                  <Link href={ROUTES.newJob}>
                    <Button>Create New Job</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-t border-border text-sm">
                  <thead className="bg-bg dark:bg-slate-700">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                      <th className="px-5 py-3">Job Title</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Applicants</th>
                      <th className="px-5 py-3">Shortlisted</th>
                      <th className="px-5 py-3">Last Updated</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-t border-border transition-colors hover:bg-bg dark:hover:bg-slate-700/50"
                      >
                        <td className="px-5 py-4 font-semibold text-text-primary">{job.title}</td>
                        <td className="px-5 py-4 text-text-muted">{job.department}</td>
                        <td className="px-5 py-4">
                          <Badge variant={statusBadgeVariant(job.status)}>{job.status}</Badge>
                        </td>
                        <td className="px-5 py-4">{formatNumber(job.applicantsCount)}</td>
                        <td className="px-5 py-4">{formatNumber(job.shortlistedCount)}</td>
                        <td className="px-5 py-4 text-text-muted">{formatShortDate(job.updatedAtISO)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              className="font-semibold text-accent hover:text-accent-hover"
                              href={`/dashboard/jobs/${job.id}`}
                            >
                              View →
                            </Link>
                            <button
                              className="rounded-input p-2 text-text-muted hover:bg-bg hover:text-text-primary dark:hover:bg-slate-700"
                              aria-label="More"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  MapPin,
  Clock,
  MoreHorizontal,
  ChevronRight,
  Filter,
  ArrowUpRight
} from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { DashboardOverviewSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDashboardOverview } from "@/hooks/useDashboard";
import {
  getApiErrorMessage,
  getWorkspaceScreeningIndex,
  reviewCandidateDecisions,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn, formatNumber, formatShortDate } from "@/lib/utils";
import type { Candidate } from "@/types";
import { Modal } from "@/components/ui/Modal";

export const dynamic = "force-dynamic";

function statusBadgeVariant(status: string) {
  if (status === "Screening") return "warning";
  if (status === "Complete") return "success";
  if (status === "Active") return "info";
  return "default";
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useDashboardOverview();
  const [activeTab, setActiveTab] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStage, setFilterStage] = useState<"all" | "inReview" | "shortlisted">("all");
  const [actionCandidateId, setActionCandidateId] = useState<string | null>(null);
  const jobs = data?.jobs ?? [];
  const applicants = data?.applicants ?? [];
  const { data: screeningIndex = {} } = useQuery({
    queryKey: ["dashboardScreeningIndex", jobs.map((job) => job.id).sort().join(",")],
    queryFn: () => getWorkspaceScreeningIndex(jobs.map((job) => job.id)),
    enabled: jobs.length > 0,
    staleTime: 15 * 1000,
    retry: 1,
  });

  async function handleToggleShortlist(candidate: Candidate) {
    try {
      await reviewCandidateDecisions([
        {
          applicant_id: candidate.id,
          applicant_name: candidate.name,
          job_title: candidate.appliedJobTitle,
          shortlisted: !candidate.shortlisted,
        },
      ]);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboardOverview"] }),
        queryClient.invalidateQueries({ queryKey: ["candidates"] }),
        queryClient.invalidateQueries({ queryKey: ["candidate", candidate.id] }),
      ]);

      toast.success(
        candidate.shortlisted
          ? "Candidate removed from shortlist."
          : "Candidate shortlisted."
      );
    } catch (toggleError) {
      toast.error(
        getApiErrorMessage(toggleError, "Unable to update the candidate stage right now.")
      );
    }
  }

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

  if (isLoading || !data) {
    return <DashboardOverviewSkeleton />;
  }

  const { stats } = data;

  const tabs = ["All", "Active", "Screening", "Draft", "Complete"];
  
  const filteredJobs = jobs.filter(job => {
    if (activeTab === "All") return true;
    return job.status === activeTab;
  });

  const filteredApplicants = applicants.filter((candidate) => {
    if (filterStage === "all") return true;
    if (filterStage === "shortlisted") return Boolean(candidate.shortlisted);
    return !candidate.shortlisted;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      {/* Header section with KPIs */}
      <div className="mb-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-text-primary">Welcome back,</h1>
          <p className="mt-1 text-text-muted text-sm">Great talent awaits. Let's find your next hire.</p>
        </div>
        
        <div className="flex items-center gap-8 rounded-[28px] border border-border/70 bg-card/85 px-6 py-4 shadow-soft backdrop-blur-sm">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-text-primary">{formatNumber(stats.totalApplicants.value)}</span>
            <span className="text-xs font-semibold text-text-muted">Total Applied</span>
          </div>
          <div className="h-10 w-px bg-border"></div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-accent">{formatNumber(stats.inScreening.value)}</span>
            <span className="text-xs font-semibold text-text-muted">Invited</span>
          </div>
          <div className="h-10 w-px bg-border"></div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-success">{formatNumber(stats.shortlisted.value)}</span>
            <span className="text-xs font-semibold text-text-muted">Hired</span>
          </div>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "whitespace-nowrap rounded-full border px-5 py-2.5 text-[13px] font-semibold transition-colors",
              activeTab === tab
                ? "border-accent/30 bg-accent text-white shadow-soft"
                : "border-transparent bg-transparent text-text-muted hover:border-border hover:bg-bg hover:text-text-primary"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Roles Grid */}
      <div className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Active Roles</h2>
          <Link href={ROUTES.jobs} className="flex items-center gap-1 text-base font-semibold text-accent hover:text-accent-hover">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {filteredJobs.length === 0 ? (
           <div className="p-8 text-center rounded-card bg-surface border border-border">
             <Briefcase className="h-8 w-8 text-text-muted mx-auto mb-3" />
             <p className="text-base font-semibold text-text-primary">No {activeTab.toLowerCase()} roles</p>
             <p className="mt-1 text-sm text-text-muted">Change the filter or create a job to get started</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job) => (
              <div key={job.id} className="relative rounded-card border border-border bg-surface p-6 shadow-soft transition-all hover:shadow-lg flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-xl bg-orange-50 text-accent flex items-center justify-center shrink-0">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <Badge className="px-4 py-1.5 text-sm font-semibold tracking-normal" variant={statusBadgeVariant(job.status)} dot>
                      {job.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-[1.45rem] font-bold leading-tight text-text-primary transition-colors group-hover:text-accent">
                    <Link href={`/dashboard/jobs/${job.id}`} className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {job.title}
                    </Link>
                  </h3>
                  <div className="mt-2 text-base font-semibold text-text-muted">
                    {job.salaryMin && job.salaryMax 
                      ? `$${(job.salaryMin/1000).toFixed(0)}k - $${(job.salaryMax/1000).toFixed(0)}k` 
                      : "Salary Negotiable"}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-bg px-3 py-1.5 text-sm font-semibold text-text-muted">
                      <Clock className="h-3.5 w-3.5" /> {job.employmentType}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-bg px-3 py-1.5 text-sm font-semibold text-text-muted">
                      <Users className="h-3.5 w-3.5" /> {job.experienceLevel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-bg px-3 py-1.5 text-sm font-semibold text-text-muted">
                      <MapPin className="h-3.5 w-3.5" /> {job.location || 'Remote'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(3, job.applicantsCount))].map((_, i) => (
                        <div key={i} className="h-7 w-7 rounded-full bg-border border-2 border-surface flex items-center justify-center text-[10px] font-bold text-text-muted">
                          {String.fromCharCode(65 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-base font-semibold text-text-primary">
                      {job.applicantsCount} Applicants
                    </span>
                  </div>
                  <div className="text-text-muted hover:text-text-primary">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate List / Pipeline Table */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Recent Pipeline</h2>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-full border-border px-4 text-sm font-semibold shadow-sm"
            onClick={() => setFilterOpen(true)}
            type="button"
          >
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        <Card>
          <CardBody className="p-0 sm:p-0">
            {filteredApplicants.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-text-muted" />
                <p className="text-base font-semibold text-text-primary">No candidates found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-base">
                  <thead className="bg-bg/50 border-b border-border">
                    <tr className="text-left text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                      <th className="px-6 py-4 rounded-tl-card">Candidate</th>
                      <th className="px-6 py-4">Applied Role</th>
                      <th className="px-6 py-4">Match Score</th>
                      <th className="px-6 py-4">Stage</th>
                      <th className="px-6 py-4">Applied Date</th>
                      <th className="px-6 py-4 text-right rounded-tr-card">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredApplicants.slice(0, 5).map((candidate) => {
                      const scoreData = screeningIndex[candidate.id];
                      const score = scoreData ? scoreData.overall.score : 0;
                      return (
                      <tr
                        key={candidate.id}
                        className="transition-colors hover:bg-bg/40 group cursor-pointer"
                        onClick={() => router.push(`/dashboard/candidates/${candidate.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-orange-50 flex items-center justify-center text-accent font-bold">
                              {candidate.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-text-primary">{candidate.name}</div>
                              <div className="text-sm text-text-muted">{candidate.currentTitle} • {candidate.yearsExperience}y exp</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-text-primary">{candidate.appliedJobTitle || "General"}</td>
                        <td className="px-6 py-4">
                          {score > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                                  <div className="h-full bg-success" style={{ width: `${score}%` }}></div>
                              </div>
                              <span className="text-sm font-bold text-success">{score}%</span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-text-muted">Not scored</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="px-4 py-1.5 text-sm font-semibold tracking-normal" variant={candidate.shortlisted ? "success" : "info"} dot>
                            {candidate.shortlisted ? "Shortlisted" : "In Review"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-text-muted">{formatShortDate(candidate.createdAtISO || new Date().toISOString())}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end">
                            <Link href={`/dashboard/candidates/${candidate.id}`} className="mr-2 flex items-center gap-1 text-sm font-semibold text-accent opacity-0 transition-opacity hover:text-accent-hover group-hover:opacity-100">
                              View <ArrowUpRight className="h-3 w-3" />
                            </Link>
                            <button
                              className="rounded-full border border-transparent p-2.5 text-text-muted transition-colors hover:border-border hover:bg-bg hover:text-text-primary"
                              aria-label="More"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionCandidateId((current) =>
                                  current === candidate.id ? null : candidate.id,
                                );
                              }}
                              type="button"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {actionCandidateId === candidate.id ? (
                              <div
                                className="relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="absolute right-0 top-10 z-20 w-56 rounded-card border border-border bg-surface shadow-modal overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-bg"
                                    onClick={() => {
                                      setActionCandidateId(null);
                                      router.push(`/dashboard/candidates/${candidate.id}`);
                                    }}
                                  >
                                    Open profile
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-bg"
                                    onClick={async () => {
                                      setActionCandidateId(null);
                                      await handleToggleShortlist(candidate);
                                    }}
                                  >
                                    {candidate.shortlisted ? "Remove from shortlist" : "Shortlist candidate"}
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-bg"
                                    onClick={() => {
                                      setActionCandidateId(null);
                                      if (candidate.email) {
                                        window.location.href = `mailto:${candidate.email}`;
                                        return;
                                      }

                                      toast.error("No email is saved for this candidate yet.");
                                    }}
                                  >
                                    Message candidate
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={filterOpen}
        title="Filter pipeline"
        onClose={() => setFilterOpen(false)}
      >
        <div className="space-y-4">
          <div className="text-sm text-text-muted">
            Filter the live candidate pipeline returned by your backend workspace.
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-text-primary">Stage</div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "inReview", label: "In review" },
                  { id: "shortlisted", label: "Shortlisted" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                    filterStage === item.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface text-text-muted hover:bg-bg hover:text-text-primary",
                  )}
                  onClick={() => setFilterStage(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setFilterStage("all");
                toast.success("Filters cleared.");
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={() => {
                setFilterOpen(false);
                toast.success("Filters applied.");
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

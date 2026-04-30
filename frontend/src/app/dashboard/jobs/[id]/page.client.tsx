"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { JobDetailSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { getJob } from "@/lib/api";

function statusBadgeVariant(status: string) {
  if (status === "Screening") return "warning";
  if (status === "Complete") return "success";
  if (status === "Active") return "info";
  return "default";
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => getJob(id),
    enabled: Boolean(id),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (error || !job) {
    return (
      <Card className="p-8">
        <div className="text-lg font-semibold">Job not found</div>
        <div className="mt-1 text-sm text-text-muted">
          We could not load this job right now.
        </div>
        <div className="mt-4">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title={job.title}
        subtitle={`${job.department} / ${job.location}`}
        backHref="/dashboard"
        right={
          <Link href={`/dashboard/screening/${job.id}`}>
            <Button>
              <Sparkles className="h-4 w-4" />
              Ingest Applicants
            </Button>
          </Link>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Job Overview" subtitle="A quick snapshot of the role details and hiring setup." />
          <CardBody>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{job.employmentType}</Badge>
              <Badge variant="default">{job.experienceLevel}</Badge>
              <Badge variant={statusBadgeVariant(job.status)}>{job.status}</Badge>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-card border border-border bg-bg p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Applicants</div>
                <div className="mt-1 text-2xl font-bold">{job.applicantsCount}</div>
              </div>
              <div className="rounded-card border border-border bg-bg p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Shortlisted</div>
                <div className="mt-1 text-2xl font-bold">{job.shortlistedCount}</div>
              </div>
              <div className="rounded-card border border-border bg-bg p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Workers Required</div>
                <div className="mt-1 text-2xl font-bold">{job.workersRequired}</div>
              </div>
              <div className="rounded-card border border-border bg-bg p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Minimum Marks</div>
                <div className="mt-1 text-2xl font-bold">{job.minimumMarks}%</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">Description</div>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{job.description || "-"}</p>
            </div>
            <div className="mt-5">
              <div className="text-sm font-semibold">Responsibilities</div>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{job.responsibilities || "-"}</p>
            </div>
            <div className="mt-5">
              <div className="text-sm font-semibold">Qualifications</div>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{job.qualifications || "-"}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="AI Screening Criteria" subtitle="The screening signals currently guiding recruiter review." />
          <CardBody>
            <div className="rounded-card border border-border bg-accent/8 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">Shortlist Size</div>
              <div className="mt-1 text-sm font-semibold">Top {job.aiCriteria.shortlistSize}</div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold">Must-Have</div>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{job.aiCriteria.mustHaveSkills || "-"}</p>
            </div>
            <div className="mt-4">
              <div className="text-sm font-semibold">Nice-to-Have</div>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{job.aiCriteria.niceToHaveSkills || "-"}</p>
            </div>
            <div className="mt-4">
              <div className="text-sm font-semibold">Deal Breakers</div>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{job.aiCriteria.dealBreakers || "-"}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}

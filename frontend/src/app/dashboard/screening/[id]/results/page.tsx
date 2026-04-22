"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, ChevronDown, Mail, Search, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { SkillTag } from "@/components/ui/SkillTag";
import { Skeleton } from "@/components/ui/Skeleton";
import { isMockMode } from "@/lib/api";
import { SCORE_THRESHOLDS } from "@/lib/constants";
import { initials } from "@/lib/utils";
import { mockCandidateScores, mockCandidates, mockJobs } from "@/lib/mockData";
import type { Candidate, CandidateScore } from "@/types";

type FilterTab = "all" | "qualified" | "maybe";

function bucket(score: number): FilterTab | "notQualified" {
  if (score >= SCORE_THRESHOLDS.qualifiedMin) return "qualified";
  if (score >= SCORE_THRESHOLDS.maybeMin) return "maybe";
  return "notQualified";
}

function hoursAgoLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.max(1, Math.round(diff / (1000 * 60 * 60)));
  return `${h} hours ago`;
}

function CandidateCard({ c, s }: { c: Candidate; s: CandidateScore }) {
  const isTop = s.score >= 90;
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent font-bold">
                {initials(c.name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={isTop ? "text-base font-bold text-accent" : "text-base font-bold"}>
                    {c.name}
                  </div>
                  {isTop ? <Badge variant="success">⭐ Top Candidate</Badge> : null}
                </div>
                <div className="mt-1 text-sm text-text-muted">
                  {c.currentTitle} • {c.location} • {c.yearsExperience} yrs
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {c.skills.technical.slice(0, 6).map((sk) => (
                <SkillTag key={sk}>{sk}</SkillTag>
              ))}
            </div>
          </div>

          <div className="shrink-0">
            <ScoreCircle score={s.score} />
          </div>
        </div>

        <div className="mt-4 rounded-card border border-accent/15 bg-accent/8 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Sparkles className="h-4 w-4 text-accent" />
            AI Reasoning
          </div>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">{s.reasoning}</p>
          <div className="mt-3">
            <Link className="text-sm font-semibold text-accent hover:text-accent-hover" href={`/dashboard/candidates/${c.id}`}>
              View detailed analysis →
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-muted">
          <div>
            <span className="inline-block h-2 w-2 rounded-full bg-success align-middle" />{" "}
            <span className="font-semibold text-text-primary">{s.skillsMatchPct}%</span> Skills Match
          </div>
          <div>
            <span className="font-semibold text-text-primary">{s.experiencePct}%</span> Experience
          </div>
          <div className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Screened {hoursAgoLabel(s.screenedAtISO)}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? "job_001";
  const mockMode = isMockMode();
  const job = mockJobs.find((j) => j.id === jobId) ?? mockJobs[0];

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [sort, setSort] = useState<"scoreDesc" | "scoreAsc">("scoreDesc");
  const loading = false;

  const rows = useMemo(() => {
    const joined = mockCandidateScores
      .filter((s) => s.jobId === job.id)
      .map((s) => ({ s, c: mockCandidates.find((x) => x.id === s.candidateId) }))
      .filter((x): x is { s: CandidateScore; c: Candidate } => Boolean(x.c));

    const query = q.trim().toLowerCase();
    const filtered = joined.filter(({ c, s }) => {
      if (tab !== "all" && bucket(s.score) !== tab) return false;
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        c.currentTitle.toLowerCase().includes(query) ||
        c.skills.technical.some((sk) => sk.toLowerCase().includes(query))
      );
    });

    filtered.sort((a, b) => (sort === "scoreDesc" ? b.s.score - a.s.score : a.s.score - b.s.score));
    return filtered;
  }, [job.id, q, tab, sort]);

  const summary = useMemo(() => {
    const all = mockCandidateScores.filter((s) => s.jobId === job.id);
    const qualified = all.filter((s) => s.score >= SCORE_THRESHOLDS.qualifiedMin).length;
    const maybe = all.filter((s) => s.score >= SCORE_THRESHOLDS.maybeMin && s.score < SCORE_THRESHOLDS.qualifiedMin).length;
    const notQualified = all.filter((s) => s.score < SCORE_THRESHOLDS.maybeMin).length;
    return { total: all.length, qualified, maybe, notQualified };
  }, [job.id]);

  if (!mockMode) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <PageHeader
          title="Screening Results"
          subtitle="This view will light up once the backend exposes scored screening results."
          backHref={`/dashboard/screening/${jobId}`}
        />

        <div className="mt-8">
          <Card className="p-8">
            <div className="text-lg font-semibold text-text-primary">Results endpoint not connected yet</div>
            <div className="mt-2 text-sm leading-relaxed text-text-muted">
              Candidate intake and profile pages now use real backend data. AI ranking, strengths, and shortlist
              results will be wired here once the backend exposes a scored screening-results route.
            </div>
            <div className="mt-5">
              <Link href={`/dashboard/screening/${jobId}`}>
                <Button>Back to Intake</Button>
              </Link>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Shortlist Results"
        subtitle={`${job.title} • ${job.department}`}
        backHref={`/dashboard/screening/${job.id}`}
        right={
          <>
            <Button
              variant="outline"
              onClick={() => toast.success("Export started (mock).")}
              type="button"
            >
              Export
            </Button>
            <Button
              onClick={() => toast.success("Email sent (mock).")}
              type="button"
            >
              <Mail className="h-4 w-4" />
              Email Shortlist
            </Button>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Screened", value: summary.total, variant: "default" as const },
          { label: "Highly Qualified", value: summary.qualified, variant: "success" as const, meta: "Score 80+" },
          { label: "Maybe", value: summary.maybe, variant: "warning" as const, meta: "Score 60–79" },
          { label: "Not Qualified", value: summary.notQualified, variant: "danger" as const, meta: "Score <60" },
        ].map((x) => (
          <Card key={x.label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-text-muted">{x.label}</div>
                <div className="mt-2 text-3xl font-bold">
                  {loading ? <Skeleton className="h-9 w-20" /> : <span className={x.variant !== "default" ? `text-${x.variant}` : ""}>{x.value}</span>}
                </div>
                {x.meta ? <div className="mt-1 text-xs text-text-muted">{x.meta}</div> : null}
              </div>
              <Badge variant={x.variant}>{x.variant === "default" ? "All" : x.label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 rounded-card border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 w-full rounded-input border border-border bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent/30"
              placeholder="Search candidates…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: "all", label: `All (${summary.total})` },
              { id: "qualified", label: `Qualified (${summary.qualified})` },
              { id: "maybe", label: `Maybe (${summary.maybe})` },
            ] as Array<{ id: FilterTab; label: string }>).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  "rounded-badge border px-3 py-2 text-sm font-semibold",
                  tab === t.id ? "border-accent bg-accent/10 text-accent" : "border-border bg-white text-text-muted",
                ].join(" ")}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            className="inline-flex h-10 items-center gap-2 rounded-input border border-border bg-white px-3 text-sm font-semibold text-text-muted hover:bg-bg"
            onClick={() => setSort((s) => (s === "scoreDesc" ? "scoreAsc" : "scoreDesc"))}
            type="button"
          >
            Sort by Score
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-sm font-semibold">No candidates match your filters</div>
            <div className="mt-1 text-sm text-text-muted">Try clearing search or switching tabs.</div>
          </Card>
        ) : (
          rows.map(({ c, s }) => <CandidateCard key={c.id} c={c} s={s} />)
        )}
      </div>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { CandidatesListSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { getCandidates } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn, formatShortDate, initials } from "@/lib/utils";

export default function CandidatesListPage() {
  const { data: candidates, isLoading, error, refetch } = useQuery({
    queryKey: ["candidates"],
    queryFn: getCandidates,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<"All" | "Shortlisted" | "In Review">("All");

  const filtered = useMemo(() => {
    const list = candidates ?? [];
    return list.filter((candidate) => {
      const matchesStage =
        stage === "All"
          ? true
          : stage === "Shortlisted"
            ? Boolean(candidate.shortlisted)
            : !candidate.shortlisted;

      const q = query.trim().toLowerCase();
      const haystack = [
        candidate.name,
        candidate.currentTitle,
        candidate.location,
        candidate.appliedJobTitle,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !q ? true : haystack.includes(q);
      return matchesStage && matchesQuery;
    });
  }, [candidates, query, stage]);

  if (isLoading) {
    return <CandidatesListSkeleton />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-8">
      <PageHeader
        title="Candidates"
        subtitle="Browse candidate profiles and open screening results tied to each record."
        backHref={ROUTES.dashboard}
      />

      <Card>
        <CardHeader title="Pipeline directory" subtitle="Search, filter, and open candidate profiles." />
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:ring-2 focus:ring-accent/30"
                placeholder="Search by name, role, or location..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["All", "In Review", "Shortlisted"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                    stage === s ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-bg hover:text-text-primary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-card border border-border bg-bg p-6 text-sm">
              <div className="font-semibold text-text-primary">Could not load candidates.</div>
              <div className="mt-1 text-text-muted">Try again to refresh the list.</div>
              <div className="mt-4">
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-card border border-border bg-bg p-8 text-center">
              <Users className="mx-auto mb-3 h-9 w-9 text-text-muted" />
              <div className="text-sm font-semibold text-text-primary">No candidates match this view</div>
              <div className="mt-1 text-sm text-text-muted">Adjust your search or change the stage filter.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-bg/50 border-b border-border">
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <th className="px-6 py-4 rounded-tl-card">Candidate</th>
                    <th className="px-6 py-4">Applied role</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4">Updated</th>
                    <th className="px-6 py-4 text-right rounded-tr-card">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((candidate) => (
                    <tr key={candidate.id} className="transition-colors hover:bg-bg/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 font-bold text-accent">
                            {initials(candidate.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-text-primary truncate">{candidate.name}</div>
                            <div className="text-xs text-text-muted truncate">
                              {candidate.currentTitle} • {candidate.yearsExperience}y exp
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-text-primary">
                        {candidate.appliedJobTitle || candidate.currentTitle || "General"}
                      </td>
                      <td className="px-6 py-4 text-text-muted">{candidate.location || "—"}</td>
                      <td className="px-6 py-4">
                        <Badge variant={candidate.shortlisted ? "success" : "info"} dot>
                          {candidate.shortlisted ? "Shortlisted" : "In Review"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-text-muted">
                        {candidate.updatedAtISO ? formatShortDate(candidate.updatedAtISO) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/candidates/${candidate.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-bg"
                        >
                          Open profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}


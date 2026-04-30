import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Maximize2,
  Search,
  Briefcase,
  MoreHorizontal,
  PieChart,
  Plus,
  Mic,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useDashboardOverview } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export function Sidebar({ pathname: _pathname }: { pathname: string }) {
  const router = useRouter();
  const { data } = useDashboardOverview();
  const jobs = data?.jobs ?? [];
  const stats = data?.stats;
  const avgTimeToHire = Number(
    (stats?.inScreening.avgTimePerCandidateMins ?? 0).toFixed(1)
  );
  const gaugeProgress = Math.min(100, Math.round(avgTimeToHire * 10));
  const maxApplicants = Math.max(1, ...jobs.map((job) => job.applicantsCount));
  const hiringInsightItems = jobs
    .slice()
    .sort((left, right) => right.applicantsCount - left.applicantsCount)
    .slice(0, 3)
    .map((job, index) => ({
      label: job.title,
      value: Math.round((job.applicantsCount / maxApplicants) * 100),
      colorClass:
        index === 0
          ? "bg-accent"
          : index === 1
            ? "bg-[#FF9B6A]"
            : "bg-[#FFD8C3]",
    }));

  function openRuvo() {
    router.push("/dashboard/ask-ruvo");
  }

  return (
    <aside className="hidden h-screen w-[340px] shrink-0 flex-col overflow-y-auto bg-bg p-4 md:flex">
      <Link href={ROUTES.home} className="mb-6 flex items-center px-2 hover:opacity-90 transition-opacity">
        <BrandLogo size="md" tone="light" />
      </Link>

      <div className="flex-1 space-y-4">
        <motion.div
          layoutId="ask-ruvo-container"
          role="button"
          tabIndex={0}
          onClick={openRuvo}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openRuvo();
            }
          }}
          className="relative overflow-hidden rounded-[24px] bg-gradient-to-b from-orange-50/80 via-yellow-50/40 to-orange-50/20 dark:from-orange-500/20 dark:via-yellow-500/10 dark:to-orange-500/5 p-5 shadow-soft border border-orange-100/50 dark:border-orange-500/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          aria-label="Open Talvo AI"
        >
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <motion.div layoutId="ask-ruvo-icon" className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </motion.div>
              <motion.span layoutId="ask-ruvo-title" className="font-semibold text-text-primary text-sm">Talvo AI</motion.span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openRuvo();
              }}
              className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Expand Talvo AI"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <motion.div layoutId="ask-ruvo-heading" className="mt-8 relative z-10">
            <h2 className="text-[26px] leading-tight font-medium text-text-primary tracking-tight">
              Ready To Find Top Candidates Or Revisit Your Pipeline?
            </h2>
          </motion.div>

          <div className="mt-6 flex flex-wrap gap-2 relative z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openRuvo();
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-text-muted hover:bg-white dark:hover:bg-white/20 transition-colors border border-white dark:border-white/10"
            >
              <Search className="h-3 w-3" /> Find Matches
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openRuvo();
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-text-muted hover:bg-white dark:hover:bg-white/20 transition-colors border border-white dark:border-white/10"
            >
              <Briefcase className="h-3 w-3" /> My Pipeline
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openRuvo();
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-text-muted hover:bg-white dark:hover:bg-white/20 transition-colors border border-white dark:border-white/10"
            >
              <PieChart className="h-3 w-3" /> Insights
            </button>
          </div>

          <motion.div layoutId="ask-ruvo-input" className="mt-6 flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 p-1.5 shadow-sm relative z-10">
            <div className="flex flex-1 items-center gap-2 pl-3">
              <Plus className="h-4 w-4 text-text-muted" />
              <input
                type="text"
                onClick={(e) => {
                  e.stopPropagation();
                  openRuvo();
                }}
                placeholder="Ask me anything..."
                className="w-full bg-transparent text-[13px] text-text-primary caret-text-primary opacity-100 outline-none placeholder:text-text-muted cursor-pointer"
                readOnly
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openRuvo();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/20 text-accent transition-colors hover:bg-orange-100 dark:hover:bg-orange-500/30 shrink-0"
              aria-label="Open Talvo AI voice"
            >
              <Mic className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>

        <div className="overflow-hidden rounded-[24px] border border-border bg-surface p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Hiring Insights</h3>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-text-primary transition-colors hover:bg-border"
              aria-label="Open hiring insights options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-[22px] bg-gradient-to-br from-orange-50 via-yellow-50/70 to-white px-3 pt-5 dark:from-orange-500/10 dark:via-yellow-500/5 dark:to-transparent">
            <div
              className="pointer-events-none absolute inset-x-6 bottom-0 h-28 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.22),transparent_68%)]"
              aria-hidden="true"
            />

            <div className="relative">
              <svg viewBox="0 0 264 150" className="h-auto w-full">
                <defs>
                  <linearGradient id="sidebarGauge" x1="100%" x2="0%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#F97316" />
                    <stop offset="100%" stopColor="#FF9B6A" />
                  </linearGradient>
                </defs>

                <path
                  d="M 240 126 A 108 108 0 0 0 24 126"
                  fill="none"
                  stroke="rgba(17,24,39,0.12)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  pathLength={100}
                />
                <path
                  d="M 240 126 A 108 108 0 0 0 24 126"
                  fill="none"
                  stroke="url(#sidebarGauge)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${gaugeProgress} 100`}
                  pathLength={100}
                />
              </svg>

              <div className="absolute inset-x-0 bottom-5 flex flex-col items-center">
                <div className="text-5xl font-medium tracking-tight text-text-primary">
                  {avgTimeToHire}
                </div>
                <div className="text-sm font-medium text-text-muted">Avg. Time to Hire</div>
              </div>
            </div>

            <div className="relative z-10 -mt-1 space-y-3 pb-4">
              {hiringInsightItems.length > 0 ? (
                hiringInsightItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className={cn("h-2.5 w-6 shrink-0 rounded-full", item.colorClass)} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-text-muted">{item.value}%</span>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-border bg-bg/60 px-4 py-6 text-sm text-text-muted">
                  Create jobs and add candidates to unlock live hiring insights.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

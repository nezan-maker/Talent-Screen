"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Shield,
  Sparkles,
  Users,
  Moon,
  Sun,
  Briefcase,
  LineChart,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={ROUTES.home} className="transition-transform hover:scale-[1.01]">
            <BrandLogo size="sm" />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-input p-2 text-text-muted hover:bg-bg hover:text-text-primary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link
              href="/about"
              className="hidden rounded-input px-3 py-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors sm:inline-block"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hidden rounded-input px-3 py-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors sm:inline-block"
            >
              Contact
            </Link>
            <Link
              href={ROUTES.login}
              className="hidden rounded-input px-3 py-2 text-sm font-semibold text-text-muted hover:bg-bg hover:text-text-primary sm:inline-block transition-colors"
            >
              Sign in
            </Link>
            <Link href={ROUTES.register}>
              <Button size="md">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          {/* Background grid pattern */}
          <div 
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(249, 115, 22, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(249, 115, 22, 0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
            aria-hidden
          />
          
          {/* Animated gradient background */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(249,115,22,0.15),transparent)]"
            aria-hidden
          />
          
          {/* Decorative animated background elements */}
          <div className="pointer-events-none absolute -right-40 top-0 h-80 w-80 rounded-full bg-accent/5 blur-3xl animate-float-slow" />
          <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-accent/5 blur-3xl animate-float-slow" />
          
          {/* Animated floating particles */}
          <div className="pointer-events-none absolute top-20 left-10 w-2 h-2 bg-accent/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="pointer-events-none absolute top-40 right-20 w-3 h-3 bg-accent/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="pointer-events-none absolute bottom-20 left-1/3 w-2 h-2 bg-accent/25 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="pointer-events-none absolute top-1/2 right-1/4 w-2.5 h-2.5 bg-accent/15 rounded-full animate-glow" />
          
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-badge border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                Talvo AI recruiter
              </p>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl sm:leading-tight">
                Screen candidates with clarity, speed, and explainable AI
              </h1>
              <p className="mt-5 text-lg text-text-muted sm:text-xl">
                Talvo helps HR teams ingest applicants, run consistent scoring against your
                criteria, and shortlist with reasoning your hiring managers can trust.
              </p>
              <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link href={ROUTES.register} className="sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto shadow-md rounded-full px-8">
                    Start free <ArrowRight className="ml-2 inline h-4 w-4" />
                  </Button>
                </Link>
                <Link
                  href={ROUTES.login}
                  className="flex h-12 w-full items-center justify-center rounded-full border border-border bg-white px-8 text-base font-semibold text-text-primary transition-all hover:bg-bg hover:shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700 sm:w-auto"
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-6 text-sm text-text-muted">
                No backend required for the demo - explore the full UI after sign-in.
              </p>
            </div>

            {/* Visual showcase with SVG images */}
            <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Sparkles, label: "AI Screening", desc: "Rank candidates instantly" },
                { icon: Briefcase, label: "Job Posting", desc: "Launch roles in seconds" },
                { icon: LineChart, label: "Analytics", desc: "Real-time hiring pipeline" },
                { icon: Users, label: "Candidates", desc: "Manage your talent pool" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-border bg-surface p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 group"
                >
                  <div className="relative h-32 w-full mb-5 flex items-center justify-center rounded-[16px] bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-orange-500/5 group-hover:from-orange-100 group-hover:to-orange-200/50 dark:group-hover:from-orange-500/20 dark:group-hover:to-orange-500/10 transition-colors">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-transparent dark:border-orange-500/20">
                      <item.icon className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                  <h3 className="text-center text-lg font-bold text-text-primary">{item.label}</h3>
                  <p className="text-center text-xs font-semibold text-text-muted mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
              {[
                { n: "12+", label: "Active jobs (demo)" },
                { n: "240+", label: "Applicants screened" },
                { n: "15%", label: "Avg. shortlist conversion" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-card border border-border bg-card px-5 py-4 text-center shadow-card"
                >
                  <div className="text-2xl font-bold text-text-primary">{s.n}</div>
                  <div className="mt-1 text-sm text-text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border py-16 sm:py-20 bg-gradient-to-b from-accent/5 to-bg">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-text-primary sm:text-3xl">
              Everything recruiters need in one flow
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-text-muted">
              From job creation to shortlist - designed for teams who care about fairness, auditability,
              and a world-class candidate experience.
            </p>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Brain,
                  title: "AI criteria you control",
                  body: "Must-haves, deal-breakers, and shortlist size - tuned to your role.",
                },
                {
                  icon: Users,
                  title: "Unified ingestion",
                  body: "Umurava profiles or external uploads - one pipeline for screening.",
                },
                {
                  icon: BarChart3,
                  title: "Scores + explanations",
                  body: "Transparent reasoning and breakdowns hiring managers actually use.",
                },
                {
                  icon: Shield,
                  title: "Built for trust",
                  body: "Structured reviews, consistent rubrics, and clear next steps.",
                },
              ].map((f) => (
                <li
                  key={f.title}
                  className="rounded-card border border-border bg-card p-6 shadow-card transition-all hover:shadow-lg hover:border-accent/30 group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-input bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-text-primary group-hover:text-accent transition-colors">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16 sm:py-20 relative overflow-hidden">
          {/* Background gradient elements */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-card border border-border bg-slate-900 dark:bg-slate-800 text-white shadow-modal">
              <div className="grid gap-8 p-8 sm:grid-cols-2 sm:items-center sm:p-12">
                <div>
                  <h2 className="text-2xl font-bold sm:text-3xl">Ready to see it in action?</h2>
                  <p className="mt-3 text-white/80">
                    Create an account (demo), then open the dashboard, launch a job, and walk through
                    screening end-to-end with real-time analytics.
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-white/90">
                    {["Dashboard & analytics", "Multi-step job builder", "Shortlist with AI reasoning"].map(
                      (t) => (
                        <li key={t} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                          {t}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <Link href={ROUTES.register} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto font-semibold">
                      Create account
                    </Button>
                  </Link>
                  <Link href={ROUTES.dashboard} className="w-full text-center text-sm font-semibold text-white/90 underline-offset-4 hover:underline sm:w-auto">
                    Skip to app demo {"->"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-text-muted sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} Talvo - All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-text-primary transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-text-primary transition-colors">
              Contact
            </Link>
            <Link href={ROUTES.login} className="hover:text-text-primary transition-colors">
              Sign in
            </Link>
            <Link href={ROUTES.register} className="hover:text-text-primary transition-colors">
              Register
            </Link>
            <Link href={ROUTES.dashboard} className="hover:text-text-primary transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

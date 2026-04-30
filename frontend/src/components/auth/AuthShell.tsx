import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ROUTES } from "@/lib/constants";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showTopBrand = true,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showTopBrand?: boolean;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_20%_10%,rgba(16,185,129,0.18),transparent),radial-gradient(ellipse_60%_45%_at_85%_100%,rgba(15,23,42,0.08),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto grid min-h-screen max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_minmax(380px,440px)] lg:items-center">
        <div className="hidden lg:flex lg:flex-col lg:justify-center">
          <Link
            href={ROUTES.home}
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-input px-2 py-2 text-text-muted transition-colors hover:bg-white/50 hover:text-accent"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>

          <div className="inline-flex w-fit rounded-full border border-border bg-card/80 px-4 py-2 shadow-card">
            <BrandLogo size="sm" subtitle="Talvo workspace" />
          </div>

          <h1 className="mt-8 max-w-xl text-5xl font-extrabold tracking-tight text-text-primary">
            Structured hiring, cleaner decisions, and a calmer recruiter workflow.
          </h1>
          <p className="mt-5 max-w-lg text-base text-text-muted">
            Sign in to manage live roles, review incoming applicants, and keep every shortlist grounded in visible criteria.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "Secure access for your team" },
              { icon: Sparkles, label: "AI guidance with clear reasoning" },
              { icon: CheckCircle2, label: "Shortlists you can defend" },
            ].map((item) => (
              <div key={item.label} className="rounded-card border border-border bg-card/80 p-4 shadow-card">
                <item.icon className="h-5 w-5 text-accent" />
                <div className="mt-3 text-sm font-semibold text-text-primary">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-col justify-center">
          <Link
            href={ROUTES.home}
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-input p-2 text-text-muted transition-colors hover:bg-bg hover:text-accent lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to home</span>
          </Link>

          <div className="mb-8 text-center">
            {showTopBrand ? (
              <Link
                href={ROUTES.home}
                className="inline-flex items-center justify-center gap-2 rounded-input border border-border bg-card px-3 py-2 text-sm font-semibold text-text-primary shadow-card transition-colors hover:border-accent/30 hover:bg-bg"
              >
                <BrandLogo size="sm" />
              </Link>
            ) : null}
            <h1 className={`${showTopBrand ? "mt-6" : "mt-0"} text-3xl font-bold tracking-tight text-text-primary`}>{title}</h1>
            <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
          </div>

          <div className="rounded-card border border-border bg-card/95 p-6 shadow-card backdrop-blur sm:p-8">
            {children}
          </div>

          {footer ? <div className="mt-6 text-center text-sm text-text-muted">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  completeOnboarding,
  getApiErrorMessage,
  type AuthUser,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import toast from "@/lib/toast";

const hiringFocusOptions = [
  "Technical hiring",
  "High-volume recruiting",
  "Leadership hiring",
  "Mixed role pipeline",
] as const;

const teamSetupOptions = [
  "Solo recruiter",
  "Small hiring team",
  "Cross-functional panel",
  "Agency and internal blend",
] as const;

const workflowGoalOptions = [
  "Faster shortlist turnaround",
  "Clearer decision consistency",
  "More collaborative reviews",
  "Better candidate communication",
] as const;

function ChoiceGroup({
  label,
  value,
  onChange,
  options,
  animDelay = 0,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  animDelay?: number;
}) {
  return (
    <div
      className="space-y-2 anim-field"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-xl border px-3 py-3 text-left text-xs transition-all duration-200 ${
                selected
                  ? "border-orange-500 bg-orange-500/10 text-white shadow-[0_0_0_1px_rgba(249,115,22,0.35),0_4px_16px_rgba(249,115,22,0.12)]"
                  : "border-white/8 bg-white/4 text-slate-400 hover:border-orange-500/30 hover:text-slate-200"
              }`}
            >
              <span className="block font-semibold leading-snug">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getDefaultRoute(user?: AuthUser) {
  return user?.onboardingCompleted ? ROUTES.dashboard : ROUTES.welcome;
}

export default function WelcomePageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading, error } = useCurrentUser();
  const [companyName, setCompanyName] = useState("");
  const [hiringFocus, setHiringFocus] = useState<string>(hiringFocusOptions[0]);
  const [teamSetup, setTeamSetup] = useState<string>(teamSetupOptions[0]);
  const [workflowGoal, setWorkflowGoal] = useState<string>(
    workflowGoalOptions[0],
  );
  const [busy, setBusy] = useState(false);

  // stage: 'loading' → 'greeting' → 'form'
  const [stage, setStage] = useState<"loading" | "greeting" | "form">(
    "loading",
  );
  // greetSub drives the staggered reveal inside the greeting screen
  const [greetSub, setGreetSub] = useState<"name" | "desc" | "btn">("name");

  const isAuthError =
    axios.isAxiosError(error) &&
    [401, 403].includes(error.response?.status ?? 0);

  const firstName = useMemo(() => {
    return currentUser?.name?.split(" ")[0] || "there";
  }, [currentUser]);

  useEffect(() => {
    if (isAuthError) router.replace(ROUTES.login);
  }, [isAuthError, router]);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.onboardingCompleted) {
      router.replace(ROUTES.dashboard);
      return;
    }
    setCompanyName((prev) => prev || currentUser.companyName || "");
    setHiringFocus(
      currentUser.onboardingPreferences?.hiringFocus || hiringFocusOptions[0],
    );
    setTeamSetup(
      currentUser.onboardingPreferences?.teamSetup || teamSetupOptions[0],
    );
    setWorkflowGoal(
      currentUser.onboardingPreferences?.workflowGoal || workflowGoalOptions[0],
    );

    // Staggered greeting sequence
    const t1 = setTimeout(() => {
      setStage("greeting");
      setGreetSub("name");
    }, 100);
    const t2 = setTimeout(() => setGreetSub("desc"), 900);
    const t3 = setTimeout(() => setGreetSub("btn"), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [currentUser, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (companyName.trim().length < 2) {
      toast.error("Add your company name to finish setting up your workspace.");
      return;
    }
    setBusy(true);
    try {
      const response = await completeOnboarding({
        company_name: companyName.trim(),
        hiring_focus: hiringFocus,
        team_setup: teamSetup,
        workflow_goal: workflowGoal,
      });
      queryClient.setQueryData(["currentUser"], response.user);
      toast.success("Your workspace is ready.");
      router.push(getDefaultRoute(response.user));
    } catch (submitError) {
      toast.error(
        getApiErrorMessage(
          submitError,
          "We could not finish setting up your workspace right now.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading || isAuthError || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0e14]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
          <p className="text-xs tracking-widest uppercase text-slate-600">
            Preparing workspace
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(48px) scaleY(0.93); }
          to   { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        @keyframes pulseSoft {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }

        .anim-rise  { animation: riseIn  0.95s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .anim-float { animation: floatUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .anim-fade  { animation: fadeIn  0.65s ease both; }
        .anim-card  { animation: cardIn  0.75s cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: top center; }
        .anim-field { animation: floatUp 0.6s  cubic-bezier(0.22, 1, 0.36, 1) both; opacity: 0; animation-fill-mode: both; }

        .name-gradient {
          background: linear-gradient(110deg, #fb923c 0%, #fdba74 38%, #f97316 62%, #ea580c 100%);
          background-size: 600px 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3.5s linear infinite;
        }

        .btn-continue {
          position: relative;
          overflow: hidden;
        }
        .btn-continue::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .btn-continue:hover::after {
          transform: translateX(100%);
        }

        .glow-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
          pointer-events: none;
          will-change: transform;
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden bg-[#0b0e14] flex items-center justify-center px-4 py-8">
        {/* Ambient glow */}
        <div className="glow-orb w-[600px] h-[600px] bg-orange-600/6 -top-40 -left-40" />
        <div className="glow-orb w-[500px] h-[500px] bg-orange-500/4 -bottom-32 -right-32" />

        {/* ── GREETING ─────────────────────────────────────────────────────── */}
        {stage === "greeting" && (
          <div className="relative flex flex-col items-center text-center w-full max-w-4xl">
            {/* Badge */}
            <div className="anim-float mb-10 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-orange-400">
              <Sparkles className="h-3 w-3" />
              Talvo workspace
            </div>

            {/* The big greeting */}
            <h1
              className="anim-rise"
              style={{
                fontSize: "clamp(3.8rem, 11vw, 8.5rem)",
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              Hi, <span className="name-gradient">{firstName}</span>
              <span className="text-white">.</span>
            </h1>

            {/* Description — floats up 800ms after name */}
            {(greetSub === "desc" || greetSub === "btn") && (
              <p className="anim-float mt-7 max-w-lg text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                Let's shape your hiring workspace — it only takes a moment and
                makes everything smarter from day one.
              </p>
            )}

            {/* Continue button — appears last */}
            {greetSub === "btn" && (
              <button
                onClick={() => setStage("form")}
                className="anim-fade btn-continue mt-10 inline-flex items-center gap-3 rounded-2xl bg-orange-500 px-9 py-4 text-sm font-semibold text-white shadow-[0_16px_48px_rgba(249,115,22,0.38)] transition-all duration-300 hover:bg-orange-400 hover:gap-4 hover:shadow-[0_20px_56px_rgba(249,115,22,0.52)] active:scale-[0.97]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* ── FORM ─────────────────────────────────────────────────────────── */}
        {stage === "form" && (
          <div className="anim-card w-full max-w-5xl">
            <div className="rounded-[28px] border border-white/8 bg-[#13171f] px-8 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.75)] sm:px-10 sm:py-9">
              {/* Header */}
              <div
                className="anim-field mb-7 flex items-start justify-between gap-4"
                style={{ animationDelay: "0ms" }}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
                    One last thing
                  </p>
                  <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    How do you hire,{" "}
                    <span className="text-orange-400">{firstName}</span>?
                  </h2>
                </div>
                <div className="hidden sm:flex shrink-0 items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-slate-500">
                  <Sparkles className="h-3 w-3 text-orange-500/60" />
                  Workspace setup
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Company name — full width */}
                <div className="anim-field" style={{ animationDelay: "80ms" }}>
                  <label
                    htmlFor="company-name"
                    className="text-xs font-semibold uppercase tracking-widest text-slate-500"
                  >
                    Company name
                  </label>
                  <input
                    id="company-name"
                    name="company-name"
                    type="text"
                    autoComplete="organization"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/8"
                    placeholder="Acme Talent"
                  />
                </div>

                {/* Preference rows — each row spans full width, options spread 4-across */}
                <ChoiceGroup
                  label="Hiring focus"
                  value={hiringFocus}
                  onChange={setHiringFocus}
                  options={hiringFocusOptions}
                  animDelay={160}
                />
                <ChoiceGroup
                  label="Team setup"
                  value={teamSetup}
                  onChange={setTeamSetup}
                  options={teamSetupOptions}
                  animDelay={250}
                />
                <ChoiceGroup
                  label="Top priority"
                  value={workflowGoal}
                  onChange={setWorkflowGoal}
                  options={workflowGoalOptions}
                  animDelay={340}
                />

                {/* Submit */}
                <div
                  className="anim-field pt-1"
                  style={{ animationDelay: "430ms" }}
                >
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-continue flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(249,115,22,0.32)] transition-all hover:bg-orange-400 hover:shadow-[0_12px_36px_rgba(249,115,22,0.46)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Setting up your workspace…
                      </>
                    ) : (
                      <>
                        Enter your dashboard
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

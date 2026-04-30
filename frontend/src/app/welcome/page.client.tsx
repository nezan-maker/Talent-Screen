"use client";

import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  completeOnboarding,
  getApiErrorMessage,
  type AuthUser,
} from "@/lib/api";
import { BrainLoader } from "@/components/ui/BrainLoader";
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
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
            className={`rounded-xl border px-3 py-3 text-left text-xs transition-all duration-300 ease-out ${
                selected
                  ? "border-orange-500 bg-orange-500/10 text-white"
                  : "border-white/12 bg-white/4 text-slate-400 hover:-translate-y-0.5 hover:border-orange-500/40 hover:text-slate-200"
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
  const prefersReducedMotion = useReducedMotion();
  const { data: currentUser, isLoading, error } = useCurrentUser();
  const [companyName, setCompanyName] = useState("");
  const [hiringFocus, setHiringFocus] = useState<string>(hiringFocusOptions[0]);
  const [teamSetup, setTeamSetup] = useState<string>(teamSetupOptions[0]);
  const [workflowGoal, setWorkflowGoal] = useState<string>(
    workflowGoalOptions[0],
  );
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"loading" | "greeting" | "form">(
    "loading",
  );

  const isAuthError =
    axios.isAxiosError(error) &&
    [401, 403].includes(error.response?.status ?? 0);

  const firstName = useMemo(() => {
    return currentUser?.name?.split(" ")[0] || "there";
  }, [currentUser]);
  const requiresCompanyName = currentUser?.authProvider === "google";
  const resolvedCompanyName = requiresCompanyName
    ? companyName.trim()
    : (currentUser?.companyName || companyName).trim();

  useEffect(() => {
    if (isAuthError) router.replace(ROUTES.login);
  }, [isAuthError, router]);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.onboardingCompleted) {
      router.replace(ROUTES.dashboard);
      return;
    }

    setCompanyName((prev) => {
      if (prev) {
        return prev;
      }

      if (currentUser.authProvider === "google") {
        return "";
      }

      return currentUser.companyName || "";
    });
    setHiringFocus(
      currentUser.onboardingPreferences?.hiringFocus || hiringFocusOptions[0],
    );
    setTeamSetup(
      currentUser.onboardingPreferences?.teamSetup || teamSetupOptions[0],
    );
    setWorkflowGoal(
      currentUser.onboardingPreferences?.workflowGoal || workflowGoalOptions[0],
    );

    const timer = setTimeout(() => {
      setStage("greeting");
    }, prefersReducedMotion ? 0 : 280);

    return () => {
      clearTimeout(timer);
    };
  }, [currentUser, prefersReducedMotion, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (requiresCompanyName && resolvedCompanyName.length < 2) {
      toast.error("Add your company name to finish setting up your workspace.");
      return;
    }

    setBusy(true);
    try {
      const response = await completeOnboarding({
        company_name: resolvedCompanyName,
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

  if (isLoading || isAuthError || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0e14]">
        <div className="flex flex-col items-center gap-4">
          <BrainLoader className="h-8 w-8" label="Preparing workspace" />
          <p className="text-xs tracking-widest uppercase text-slate-600">
            Preparing workspace
          </p>
        </div>
      </div>
    );
  }

  const screenTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  const itemTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

  const screenVariants = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 18, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -10, scale: 0.99 },
  };

  const greetingContainerVariants = {
    animate: {
      transition: prefersReducedMotion
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.12, delayChildren: 0.05 },
    },
  };

  const formContainerVariants = {
    animate: {
      transition: prefersReducedMotion
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.08, delayChildren: 0.08 },
    },
  };

  const itemVariants = {
    initial: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 18,
      filter: prefersReducedMotion ? "none" : "blur(6px)",
    },
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: itemTransition,
    },
  };

  const headingVariants = {
    initial: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 30,
      scale: prefersReducedMotion ? 1 : 0.975,
      filter: prefersReducedMotion ? "none" : "blur(10px)",
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: prefersReducedMotion
        ? { duration: 0.01 }
        : { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }

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

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0e14] px-4 py-8">
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { x: [-10, 12, -10], y: [-8, 10, -8] }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 16, repeat: Infinity, ease: "easeInOut" }
          }
          className="glow-orb -left-40 -top-40 h-[600px] w-[600px] bg-orange-600/6"
        />
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { x: [10, -14, 10], y: [8, -12, 8] }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 18, repeat: Infinity, ease: "easeInOut" }
          }
          className="glow-orb -bottom-32 -right-32 h-[500px] w-[500px] bg-orange-500/4"
        />

        <AnimatePresence mode="wait">
          {stage === "greeting" ? (
            <motion.div
              key="greeting"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={screenTransition}
              className="relative flex w-full max-w-4xl flex-col items-center text-center"
            >
              <motion.div
                variants={greetingContainerVariants}
                initial="initial"
                animate="animate"
                className="flex w-full flex-col items-center"
              >
                <motion.div
                  variants={itemVariants}
                  className="mb-10 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-orange-400"
                >
                  <Sparkles className="h-3 w-3" />
                  Talvo workspace
                </motion.div>

                <motion.h1
                  variants={headingVariants}
                  style={{
                    fontSize: "clamp(3.4rem, 10vw, 7.5rem)",
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Hi, <span className="name-gradient">{firstName}</span>
                  <span className="text-white">.</span>
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="mt-7 max-w-lg text-base leading-7 text-slate-400 sm:text-lg sm:leading-8"
                >
                  Let's shape your hiring workspace — it only takes a moment and
                  makes everything smarter from day one.
                </motion.p>

                <motion.button
                  variants={itemVariants}
                  onClick={() => setStage("form")}
                  className="btn-continue mt-10 inline-flex items-center gap-3 rounded-2xl bg-orange-500 px-9 py-4 text-sm font-semibold text-white shadow-[0_16px_48px_rgba(249,115,22,0.38)] transition-all duration-300 hover:bg-orange-400 hover:gap-4 hover:shadow-[0_20px_56px_rgba(249,115,22,0.52)] active:scale-[0.97]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          ) : null}

          {stage === "form" ? (
            <motion.div
              key="form"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={screenTransition}
              className="w-full max-w-5xl"
            >
              <motion.div
                variants={formContainerVariants}
                initial="initial"
                animate="animate"
                className="rounded-[28px] border border-white/8 bg-[#13171f] px-8 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.75)] sm:px-10 sm:py-9"
              >
                <motion.div
                  variants={itemVariants}
                  className="mb-7 flex items-start justify-between gap-4"
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
                  <div className="hidden shrink-0 items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-slate-500 sm:flex">
                    <Sparkles className="h-3 w-3 text-orange-500/60" />
                    Workspace setup
                  </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {requiresCompanyName ? (
                    <motion.div variants={itemVariants}>
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
                    </motion.div>
                  ) : null}

                  <motion.div variants={itemVariants}>
                    <ChoiceGroup
                      label="Hiring focus"
                      value={hiringFocus}
                      onChange={setHiringFocus}
                      options={hiringFocusOptions}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <ChoiceGroup
                      label="Team setup"
                      value={teamSetup}
                      onChange={setTeamSetup}
                      options={teamSetupOptions}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <ChoiceGroup
                      label="Top priority"
                      value={workflowGoal}
                      onChange={setWorkflowGoal}
                      options={workflowGoalOptions}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-1">
                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-continue flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-semibold text-white transition-all hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? (
                        <>
                          <BrainLoader className="h-4 w-4 text-white" label="Setting up workspace" />
                          Setting up your workspace…
                        </>
                      ) : (
                        <>
                          Enter your dashboard
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}

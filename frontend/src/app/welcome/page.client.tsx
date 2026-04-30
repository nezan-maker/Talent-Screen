'use client';

import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Building2, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { completeOnboarding, getApiErrorMessage, type AuthUser } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import toast from '@/lib/toast';

const hiringFocusOptions = [
  'Technical hiring',
  'High-volume recruiting',
  'Leadership hiring',
  'Mixed role pipeline',
] as const;

const teamSetupOptions = [
  'Solo recruiter',
  'Small hiring team',
  'Cross-functional panel',
  'Agency and internal blend',
] as const;

const workflowGoalOptions = [
  'Faster shortlist turnaround',
  'Clearer decision consistency',
  'More collaborative reviews',
  'Better candidate communication',
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
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-3xl border px-4 py-4 text-left text-sm transition-all ${
                selected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-[0_12px_30px_rgba(16,185,129,0.16)]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40'
              }`}
            >
              <span className="block font-semibold">{option}</span>
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
  const [companyName, setCompanyName] = useState('');
  const [hiringFocus, setHiringFocus] = useState<string>(hiringFocusOptions[0]);
  const [teamSetup, setTeamSetup] = useState<string>(teamSetupOptions[0]);
  const [workflowGoal, setWorkflowGoal] = useState<string>(workflowGoalOptions[0]);
  const [busy, setBusy] = useState(false);

  const isAuthError =
    axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);

  useEffect(() => {
    if (isAuthError) {
      router.replace(ROUTES.login);
    }
  }, [isAuthError, router]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentUser.onboardingCompleted) {
      router.replace(ROUTES.dashboard);
      return;
    }

    setCompanyName((prev) => prev || currentUser.companyName || '');
    setHiringFocus(
      currentUser.onboardingPreferences?.hiringFocus || hiringFocusOptions[0]
    );
    setTeamSetup(
      currentUser.onboardingPreferences?.teamSetup || teamSetupOptions[0]
    );
    setWorkflowGoal(
      currentUser.onboardingPreferences?.workflowGoal || workflowGoalOptions[0]
    );
  }, [currentUser, router]);

  const progressLabel = useMemo(() => {
    if (!currentUser) {
      return 'Loading your workspace setup';
    }

    return `Welcome, ${currentUser.name.split(' ')[0] || 'there'}`;
  }, [currentUser]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (companyName.trim().length < 2) {
      toast.error('Add your company name to finish setting up your workspace.');
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

      queryClient.setQueryData(['currentUser'], response.user);
      toast.success('Your workspace is ready.');
      router.push(getDefaultRoute(response.user));
    } catch (submitError) {
      toast.error(
        getApiErrorMessage(
          submitError,
          'We could not finish setting up your workspace right now.'
        )
      );
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || isAuthError || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f6fff9_0%,#eef8ff_52%,#ffffff_100%)] px-4">
        <div className="inline-flex items-center gap-3 rounded-full border border-emerald-100 bg-white/90 px-5 py-3 text-sm font-medium text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          Preparing your welcome experience...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f6fff9_0%,#eef8ff_52%,#ffffff_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_30%)]"
      />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[32px] border border-white/70 bg-slate-950 px-7 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:px-9 sm:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Workspace setup
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              {progressLabel}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              Before you jump in, shape the workspace so shortlist recommendations,
              collaboration, and outreach feel tailored to your hiring rhythm.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: Building2,
                  title: 'Brand the workspace',
                  text: 'Set the company name recruiters and candidates should recognize.',
                },
                {
                  icon: Target,
                  title: 'Tune your hiring focus',
                  text: 'Give the system a quick sense of the kind of roles you prioritize most.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Keep the experience consistent',
                  text: 'Preferences help future recommendations and workflow defaults feel more intentional.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur"
                >
                  <item.icon className="h-5 w-5 text-emerald-300" />
                  <h2 className="mt-3 text-sm font-semibold text-white">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200/70 bg-white/92 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Final step
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Tell us a little about how you hire
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                This keeps the workspace polished from the first job post through
                the final shortlist.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-7">
              <div>
                <label
                  htmlFor="company-name"
                  className="text-sm font-semibold text-slate-900"
                >
                  Company name
                </label>
                <input
                  id="company-name"
                  name="company-name"
                  type="text"
                  autoComplete="organization"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Acme Talent"
                />
              </div>

              <ChoiceGroup
                label="What kind of hiring do you want this workspace to support first?"
                value={hiringFocus}
                onChange={setHiringFocus}
                options={hiringFocusOptions}
              />

              <ChoiceGroup
                label="How is your recruiting team set up today?"
                value={teamSetup}
                onChange={setTeamSetup}
                options={teamSetupOptions}
              />

              <ChoiceGroup
                label="What outcome matters most right now?"
                value={workflowGoal}
                onChange={setWorkflowGoal}
                options={workflowGoalOptions}
              />

              <Button
                type="submit"
                className="h-12 w-full gap-2 rounded-2xl text-sm font-semibold"
                disabled={busy}
              >
                {busy ? 'Saving your workspace...' : 'Enter your dashboard'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { createJob, getApiErrorMessage } from "@/lib/api";
import type { Job } from "@/types";

type Step = 1 | 2 | 3 | 4;

function buildJobCriteria(form: Job) {
  const criteria = [
    form.aiCriteria.mustHaveSkills.trim() || form.qualifications.trim()
      ? {
          criteria_string: form.aiCriteria.mustHaveSkills.trim() || "Core requirements",
          description: form.qualifications.trim() || form.description.trim(),
          priority: "high",
        }
      : null,
    form.aiCriteria.niceToHaveSkills.trim() || form.responsibilities.trim()
      ? {
          criteria_string: form.aiCriteria.niceToHaveSkills.trim() || "Nice to have",
          description: form.responsibilities.trim() || form.description.trim(),
          priority: "medium",
        }
      : null,
    form.aiCriteria.screeningQuestions.trim()
      ? {
          criteria_string: "Screening questions",
          description: form.aiCriteria.screeningQuestions.trim(),
          priority: "medium",
        }
      : null,
    form.aiCriteria.dealBreakers.trim()
      ? {
          criteria_string: "Deal breakers",
          description: form.aiCriteria.dealBreakers.trim(),
          priority: "high",
        }
      : null,
  ].filter(
    (
      criterion,
    ): criterion is {
      criteria_string: string;
      description: string;
      priority: string;
    } => Boolean(criterion),
  );

  return criteria.length > 0
    ? criteria
    : [
        {
          criteria_string: "Core requirements",
          description: form.description.trim() || form.qualifications.trim(),
          priority: "high",
        },
      ];
}

function Stepper({ step }: { step: Step }) {
  const steps: Array<{ n: Step; label: string }> = [
    { n: 1, label: "Basic Info" },
    { n: 2, label: "Job Brief" },
    { n: 3, label: "AI Criteria" },
    { n: 4, label: "Review" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((item) => {
        const active = item.n === step;
        const done = item.n < step;

        return (
          <div key={item.n} className="flex items-center gap-3">
            <div
              className={[
                "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold",
                done
                  ? "border-accent bg-accent text-white"
                  : active
                    ? "border-accent text-accent"
                    : "border-border text-text-muted",
              ].join(" ")}
            >
              {item.n}
            </div>
            <div className={active ? "text-sm font-semibold text-text-primary" : "text-sm text-text-muted"}>
              {item.label}
            </div>
            {item.n !== 4 ? <div className="h-px w-10 bg-border" /> : null}
          </div>
        );
      })}
    </div>
  );
}

const stepGuidance: Record<Step, { title: string; body: string; example: string }> = {
  1: {
    title: "Make the role easy to recognize",
    body: "Use the exact title, team, and location recruiters and hiring managers will use in real conversations.",
    example: "Example: Senior Product Designer / Product / Nairobi (Hybrid)",
  },
  2: {
    title: "Write for recruiter judgment",
    body: "Describe what success looks like, what this person owns, and what evidence strong applicants should bring.",
    example:
      "Example: Own the recruiter workflow from intake to shortlist while improving speed, clarity, and confidence.",
  },
  3: {
    title: "Teach the model your hiring standard",
    body: "Separate non-negotiables from nice-to-haves so screening stays consistent and easier to explain later.",
    example:
      "Example: Must-have: React, TypeScript, design systems. Nice-to-have: accessibility audits and analytics instrumentation.",
  },
  4: {
    title: "Launch what you can defend",
    body: "This brief becomes the working context for sourcing and review, so read it like a hiring manager before launch.",
    example: "After launch: recruiters can intake candidates immediately and the dashboard will pick up the new role.",
  },
};

function SummaryPanel({
  step,
  summary,
}: {
  step: Step;
  summary: Array<{ k: string; v: string }>;
}) {
  return (
    <div className="space-y-6">
      <Card className="xl:sticky xl:top-24">
        <CardHeader title="Live Brief" subtitle="A recruiter-facing snapshot of the role as you build it." />
        <CardBody className="space-y-3">
          {summary.map((row) => (
            <div key={row.k} className="rounded-card border border-border bg-bg p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{row.k}</div>
              <div className="mt-1 text-sm font-medium text-text-primary">{row.v}</div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={stepGuidance[step].title} subtitle="A small prompt to keep the brief intentional." />
        <CardBody>
          <p className="text-sm leading-relaxed text-text-muted">{stepGuidance[step].body}</p>
          <div className="mt-4 rounded-card border border-accent/20 bg-accent/8 p-3 text-sm text-text-primary">
            {stepGuidance[step].example}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-medium text-danger">{message}</p>;
}

function InputClass(hasError?: boolean) {
  return [
    "mt-2 w-full rounded-input border bg-white px-3 text-sm outline-none transition-all focus:ring-2",
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-accent/40 focus:ring-accent/20",
  ].join(" ");
}

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Job>(() => ({
    id: "job_new",
    title: "",
    department: "",
    location: "",
    employmentType: "Full-time",
    experienceLevel: "Mid",
    salaryMin: undefined,
    salaryMax: undefined,
    description: "",
    responsibilities: "",
    qualifications: "",
    aiCriteria: {
      mustHaveSkills: "",
      niceToHaveSkills: "",
      screeningQuestions: "",
      dealBreakers: "",
      shortlistSize: 10,
    },
    status: "Draft",
    applicantsCount: 0,
    shortlistedCount: 0,
    updatedAtISO: new Date().toISOString(),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const summary = useMemo(
    () => [
      { k: "Job Title", v: form.title || "Not set yet" },
      { k: "Department", v: form.department || "Not set yet" },
      { k: "Location", v: form.location || "Not set yet" },
      { k: "Employment", v: `${form.employmentType} / ${form.experienceLevel}` },
      {
        k: "Salary Range",
        v:
          form.salaryMin || form.salaryMax
            ? `${form.salaryMin ?? "Open"} - ${form.salaryMax ?? "Open"}`
            : "Not specified",
      },
      {
        k: "Description",
        v: form.description
          ? `${form.description.slice(0, 120)}${form.description.length > 120 ? "..." : ""}`
          : "Add a short role narrative",
      },
      { k: "Must-Have Skills", v: form.aiCriteria.mustHaveSkills || "Still to define" },
      { k: "Nice-to-Have", v: form.aiCriteria.niceToHaveSkills || "Still to define" },
      { k: "Shortlist Size", v: `Top ${form.aiCriteria.shortlistSize}` },
    ],
    [form],
  );

  const launchChecks = useMemo(
    () => [
      { label: "Role basics captured", done: Boolean(form.title && form.department && form.location) },
      { label: "Job brief written", done: Boolean(form.description && form.responsibilities && form.qualifications) },
      { label: "Must-have screening criteria defined", done: Boolean(form.aiCriteria.mustHaveSkills.trim()) },
      { label: "Shortlist size selected", done: Boolean(form.aiCriteria.shortlistSize) },
    ],
    [form],
  );

  function validateStep1() {
    const nextErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      nextErrors.title = "Job title is required";
    } else if (form.title.trim().length < 3) {
      nextErrors.title = "Job title must be at least 3 characters";
    }

    if (!form.department.trim()) {
      nextErrors.department = "Department is required";
    } else if (form.department.trim().length < 2) {
      nextErrors.department = "Department must be at least 2 characters";
    }

    if (!form.location.trim()) {
      nextErrors.location = "Location is required";
    } else if (form.location.trim().length < 2) {
      nextErrors.location = "Location must be at least 2 characters";
    }

    if (form.salaryMin !== undefined && form.salaryMin < 0) {
      nextErrors.salaryMin = "Salary must be a positive number";
    }

    if (form.salaryMax !== undefined && form.salaryMax < 0) {
      nextErrors.salaryMax = "Salary must be a positive number";
    }

    if (
      form.salaryMin !== undefined &&
      form.salaryMax !== undefined &&
      form.salaryMin > form.salaryMax
    ) {
      nextErrors.salaryRange = "Minimum salary cannot exceed maximum salary";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateStep2() {
    const nextErrors: Record<string, string> = {};

    if (!form.description.trim()) {
      nextErrors.description = "Description is required";
    } else if (form.description.trim().length < 20) {
      nextErrors.description = "Description must be at least 20 characters";
    }

    if (!form.responsibilities.trim()) {
      nextErrors.responsibilities = "Responsibilities are required";
    } else if (form.responsibilities.trim().length < 20) {
      nextErrors.responsibilities = "Responsibilities must be at least 20 characters";
    }

    if (!form.qualifications.trim()) {
      nextErrors.qualifications = "Qualifications are required";
    } else if (form.qualifications.trim().length < 20) {
      nextErrors.qualifications = "Qualifications must be at least 20 characters";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateStep3() {
    const nextErrors: Record<string, string> = {};

    if (!form.aiCriteria.mustHaveSkills.trim()) {
      nextErrors.mustHaveSkills = "Must-have skills are required for screening";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function next() {
    if (step === 1 && !validateStep1()) {
      toast.error("Please fix the highlighted basics before proceeding.");
      return;
    }

    if (step === 2 && !validateStep2()) {
      toast.error("Please complete the role brief before proceeding.");
      return;
    }

    if (step === 3 && !validateStep3()) {
      toast.error("Please define the must-have criteria before proceeding.");
      return;
    }

    setErrors({});
    setStep((current) => (current < 4 ? ((current + 1) as Step) : current));
  }

  function back() {
    setErrors({});
    setStep((current) => (current > 1 ? ((current - 1) as Step) : current));
  }

  async function handleCreateJob() {
    setSubmitting(true);

    try {
      const response = await createJob({
        reqBody: {
          job_title: form.title.trim(),
          job_department: form.department.trim(),
          job_location: form.location.trim(),
          job_employment_type: form.employmentType,
          job_salary_min: form.salaryMin,
          job_salary_max: form.salaryMax,
          job_experience_required: form.experienceLevel,
          job_description: form.description.trim(),
          job_responsibilities: form.responsibilities.trim(),
          job_qualifications: form.qualifications.trim(),
          job_shortlist_size: form.aiCriteria.shortlistSize,
          job_ai_criteria: buildJobCriteria(form),
          workers_required: 1,
          job_state: "Active",
        },
      });

      const createdJobId = response.job?.id;
      toast.success("Job created and launched successfully.");

      if (createdJobId) {
        router.push(`/dashboard/jobs/${createdJobId}`);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create this job right now."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <PageHeader
        title="Create New Job"
        subtitle="Shape the role clearly now so sourcing and screening stay faster and easier to defend later."
      />

      <div className="mt-8">
        <Card className="p-5">
          <Stepper step={step} />
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {step === 1 ? (
            <Card>
              <CardHeader title="Step 1 - Basic Information" subtitle="Define the role, team, and hiring logistics." />
              <CardBody>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-text-primary">Job Title</label>
                    <input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      className={`${InputClass(Boolean(errors.title))} h-10`}
                      placeholder="Senior Full Stack Engineer"
                    />
                    <div className="mt-1 text-xs text-text-muted">
                      Use the hiring title candidates and recruiters will recognize instantly.
                    </div>
                    <FieldError message={errors.title} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-text-primary">Department</label>
                      <input
                        value={form.department}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, department: event.target.value }))
                        }
                        className={`${InputClass(Boolean(errors.department))} h-10`}
                        placeholder="Engineering"
                      />
                      <FieldError message={errors.department} />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-primary">Location</label>
                      <input
                        value={form.location}
                        onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                        className={`${InputClass(Boolean(errors.location))} h-10`}
                        placeholder="Kigali (Hybrid)"
                      />
                      <FieldError message={errors.location} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-text-primary">Employment Type</label>
                      <select
                        value={form.employmentType}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, employmentType: event.target.value }))
                        }
                        className={`${InputClass()} h-10`}
                      >
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-primary">Experience Level</label>
                      <select
                        value={form.experienceLevel}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, experienceLevel: event.target.value }))
                        }
                        className={`${InputClass()} h-10`}
                      >
                        <option>Junior</option>
                        <option>Mid</option>
                        <option>Senior</option>
                        <option>Lead</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-text-primary">Salary Min (optional)</label>
                      <input
                        value={form.salaryMin ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            salaryMin: event.target.value ? Number(event.target.value) : undefined,
                          }))
                        }
                        type="number"
                        className={`${InputClass(Boolean(errors.salaryMin || errors.salaryRange))} h-10`}
                        placeholder="45000"
                      />
                      <FieldError message={errors.salaryMin || errors.salaryRange} />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-text-primary">Salary Max (optional)</label>
                      <input
                        value={form.salaryMax ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            salaryMax: event.target.value ? Number(event.target.value) : undefined,
                          }))
                        }
                        type="number"
                        className={`${InputClass(Boolean(errors.salaryMax || errors.salaryRange))} h-10`}
                        placeholder="70000"
                      />
                      <FieldError message={errors.salaryMax || errors.salaryRange} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="outline" disabled>
                    Back
                  </Button>
                  <Button onClick={next}>Next</Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card>
              <CardHeader
                title="Step 2 - Job Brief"
                subtitle="Write the role narrative recruiters and candidates will rely on."
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-card border border-border bg-bg p-4 text-sm text-text-muted">
                    A strong brief explains the mission, ownership, and evidence of fit. This helps both recruiters
                    and later AI screening stay grounded in the same expectations.
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-text-primary">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className={`${InputClass(Boolean(errors.description))} min-h-[120px] py-2`}
                      placeholder="Describe the mission, business impact, and why this role matters now."
                    />
                    <div className="mt-1 text-xs text-text-muted">{form.description.length} characters</div>
                    <FieldError message={errors.description} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-text-primary">Responsibilities</label>
                    <textarea
                      value={form.responsibilities}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, responsibilities: event.target.value }))
                      }
                      className={`${InputClass(Boolean(errors.responsibilities))} min-h-[110px] py-2`}
                      placeholder="What will this person own day to day, and what outcomes matter most?"
                    />
                    <FieldError message={errors.responsibilities} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-text-primary">Qualifications</label>
                    <textarea
                      value={form.qualifications}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, qualifications: event.target.value }))
                      }
                      className={`${InputClass(Boolean(errors.qualifications))} min-h-[110px] py-2`}
                      placeholder="Capture the experience, mindset, and capability signals that matter most."
                    />
                    <FieldError message={errors.qualifications} />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="outline" onClick={back}>
                    Back
                  </Button>
                  <Button onClick={next}>Next</Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {step === 3 ? (
            <Card className="overflow-hidden">
              <div className="bg-accent/8 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <div className="text-base font-semibold text-text-primary">AI Screening Criteria</div>
                </div>
                <div className="mt-1 text-sm text-text-muted">
                  Define what strong evidence looks like before the first candidate enters the funnel.
                </div>
              </div>
              <CardBody>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-text-primary">Must-Have Skills</label>
                    <textarea
                      value={form.aiCriteria.mustHaveSkills}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          aiCriteria: { ...current.aiCriteria, mustHaveSkills: event.target.value },
                        }))
                      }
                      className={`${InputClass(Boolean(errors.mustHaveSkills))} min-h-[90px] py-2`}
                      placeholder="TypeScript, React, Node.js, SQL, stakeholder communication..."
                    />
                    <div className="mt-1 text-xs text-text-muted">
                      These are the signals the shortlist should optimize for first.
                    </div>
                    <FieldError message={errors.mustHaveSkills} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-text-primary">Nice-to-Have Skills</label>
                    <textarea
                      value={form.aiCriteria.niceToHaveSkills}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          aiCriteria: { ...current.aiCriteria, niceToHaveSkills: event.target.value },
                        }))
                      }
                      className={`${InputClass()} min-h-[90px] py-2`}
                      placeholder="Next.js, AWS, analytics instrumentation, mentoring..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-text-primary">Screening Questions</label>
                    <textarea
                      value={form.aiCriteria.screeningQuestions}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          aiCriteria: { ...current.aiCriteria, screeningQuestions: event.target.value },
                        }))
                      }
                      className={`${InputClass()} min-h-[90px] py-2`}
                      placeholder="Add 2-4 questions that reveal practical depth and ownership."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-text-primary">Deal Breakers</label>
                    <textarea
                      value={form.aiCriteria.dealBreakers}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          aiCriteria: { ...current.aiCriteria, dealBreakers: event.target.value },
                        }))
                      }
                      className={`${InputClass()} min-h-[90px] py-2`}
                      placeholder="Hard constraints, unavailable locations, missing must-haves..."
                    />
                    <div className="mt-1 text-xs text-warning">
                      Keep deal breakers explicit to reduce false positives later.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-bg p-4">
                    <div>
                      <div className="text-sm font-semibold text-text-primary">Shortlist Size</div>
                      <div className="text-xs text-text-muted">
                        How many top candidates the recruiting team wants surfaced first.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[10, 20].map((size) => (
                        <button
                          key={size}
                          className={[
                            "rounded-badge border px-3 py-1 text-sm font-semibold",
                            form.aiCriteria.shortlistSize === size
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border bg-white text-text-muted",
                          ].join(" ")}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              aiCriteria: { ...current.aiCriteria, shortlistSize: size as 10 | 20 },
                            }))
                          }
                          type="button"
                        >
                          Top {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="outline" onClick={back}>
                    Back
                  </Button>
                  <Button onClick={next}>Next</Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {step === 4 ? (
            <Card>
              <CardHeader
                title="Step 4 - Review and Launch"
                subtitle="Double-check the brief before the role goes live in the workspace."
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-3">
                  {summary.map((row) => (
                    <div
                      key={row.k}
                      className="flex flex-col justify-between gap-1 rounded-card border border-border bg-bg p-4 md:flex-row md:items-center"
                    >
                      <div className="text-sm font-semibold text-text-primary">{row.k}</div>
                      <div className="text-sm text-text-muted md:max-w-[70%] md:text-right">{row.v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-card border border-border bg-bg p-4">
                  <div className="text-sm font-semibold text-text-primary">Launch Checklist</div>
                  <div className="mt-3 grid gap-2">
                    {launchChecks.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-text-primary">{item.label}</span>
                        <span className={item.done ? "font-semibold text-success" : "font-semibold text-warning"}>
                          {item.done ? "Ready" : "Missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast("Draft saving is not available in the current backend yet.", { icon: "i" });
                    }}
                  >
                    Save as Draft
                  </Button>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={back}>
                      Back
                    </Button>
                    <Button onClick={handleCreateJob} disabled={submitting}>
                      {submitting ? "Launching..." : "Create and Launch Job"}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-card border border-accent/20 bg-accent/8 p-4">
                  <div className="text-sm font-semibold text-text-primary">What happens next</div>
                  <div className="mt-2 text-sm leading-relaxed text-text-muted">
                    This role will be saved to the backend as an active job. Recruiters can then intake candidates,
                    review the pipeline, and track the opening from the dashboard immediately.
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <SummaryPanel step={step} summary={summary} />
      </div>
    </motion.div>
  );
}

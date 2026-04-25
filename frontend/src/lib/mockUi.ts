import type { Candidate } from "@/types";
import { mockCandidates, mockJobs } from "@/lib/mockData";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAtISO: string;
  href?: string;
  read: boolean;
};

const NOTIFICATIONS_KEY = "talvo:notifications:v1";
const CANDIDATE_OVERRIDES_KEY = "talvo:candidate-overrides:v1";

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getMockNotifications(): NotificationItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = safeParse<NotificationItem[]>(
    window.localStorage.getItem(NOTIFICATIONS_KEY),
  );
  if (stored && Array.isArray(stored)) {
    return stored;
  }

  const now = Date.now();
  const seed: NotificationItem[] = [
    {
      id: "notif_001",
      title: "Screening ready for review",
      body: "AI scoring completed for “Senior Full Stack Engineer”. Open results to shortlist top candidates.",
      createdAtISO: new Date(now - 45 * 60 * 1000).toISOString(),
      href: `/dashboard/screening/${mockJobs[0]?.id ?? "job_001"}/results`,
      read: false,
    },
    {
      id: "notif_002",
      title: "New candidates added",
      body: "3 candidate profiles were ingested into your pipeline from the mock dataset.",
      createdAtISO: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      href: "/dashboard/candidates",
      read: false,
    },
    {
      id: "notif_003",
      title: "Draft role needs details",
      body: "“HR Operations Specialist” is still a draft. Add AI criteria and launch when ready.",
      createdAtISO: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      href: `/dashboard/jobs/${mockJobs[2]?.id ?? "job_003"}`,
      read: true,
    },
  ];

  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(seed));
  return seed;
}

export function setMockNotifications(next: NotificationItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
}

export function markNotificationRead(id: string) {
  const list = getMockNotifications();
  const next = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  setMockNotifications(next);
  return next;
}

export function markAllNotificationsRead() {
  const list = getMockNotifications();
  const next = list.map((n) => ({ ...n, read: true }));
  setMockNotifications(next);
  return next;
}

type CandidateOverrides = Record<string, { shortlisted?: boolean }>;

export function getCandidateOverrides(): CandidateOverrides {
  if (typeof window === "undefined") return {};
  const stored = safeParse<CandidateOverrides>(
    window.localStorage.getItem(CANDIDATE_OVERRIDES_KEY),
  );
  return stored && typeof stored === "object" ? stored : {};
}

export function setCandidateOverrides(next: CandidateOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CANDIDATE_OVERRIDES_KEY, JSON.stringify(next));
}

export function resolveCandidate(candidate: Candidate): Candidate {
  const overrides = getCandidateOverrides();
  const override = overrides[candidate.id];
  return override ? { ...candidate, ...override } : candidate;
}

export function toggleShortlist(candidateId: string) {
  const overrides = getCandidateOverrides();
  const current = overrides[candidateId]?.shortlisted;
  const next = { ...overrides, [candidateId]: { ...overrides[candidateId], shortlisted: !current } };
  setCandidateOverrides(next);
  return next[candidateId]?.shortlisted ?? false;
}

export function exportMockWorkspaceData() {
  if (typeof window === "undefined") return;

  const payload = {
    exportedAtISO: new Date().toISOString(),
    jobs: mockJobs,
    candidates: mockCandidates,
    notifications: getMockNotifications(),
    candidateOverrides: getCandidateOverrides(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `talvo-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


export type WorkspaceInvite = {
  email: string;
  invitedAtISO: string;
};

export type WorkspaceSettings = {
  workspaceName: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  timeZone: string;
  retentionDays: 30 | 60 | 90 | 180 | 365;
  teamInvites: WorkspaceInvite[];
  localApiKey: string;
};

const WORKSPACE_SETTINGS_KEY = "talvo:workspace-settings:v1";
const LAST_LOGIN_AT_KEY = "talvo:last-login-at:v1";

type PartialSettings = Partial<WorkspaceSettings> & {
  teamInvites?: Array<Partial<WorkspaceInvite>>;
};

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getDefaultTimeZone() {
  if (typeof Intl === "undefined") {
    return "UTC";
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getDefaultLanguage() {
  if (typeof navigator === "undefined") {
    return "en-US";
  }

  return navigator.language || "en-US";
}

function randomToken(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const fallback = () =>
    Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");

  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    return fallback();
  }

  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export function generateLocalApiKey() {
  return `twk_${randomToken(24)}`;
}

export function createDefaultWorkspaceSettings(): WorkspaceSettings {
  return {
    workspaceName: "Talvo Workspace",
    emailNotifications: true,
    pushNotifications: false,
    language: getDefaultLanguage(),
    timeZone: getDefaultTimeZone(),
    retentionDays: 90,
    teamInvites: [],
    localApiKey: generateLocalApiKey(),
  };
}

function normalizeRetentionDays(value: unknown): WorkspaceSettings["retentionDays"] {
  if (value === 30 || value === 60 || value === 90 || value === 180 || value === 365) {
    return value;
  }

  return 90;
}

function normalizeInvites(invites: unknown): WorkspaceInvite[] {
  if (!Array.isArray(invites)) {
    return [];
  }

  return invites
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const email = typeof item.email === "string" ? item.email.trim().toLowerCase() : "";
      const invitedAtISO =
        typeof item.invitedAtISO === "string" && item.invitedAtISO.trim()
          ? item.invitedAtISO
          : new Date().toISOString();

      if (!email) {
        return null;
      }

      return { email, invitedAtISO };
    })
    .filter((item): item is WorkspaceInvite => item !== null);
}

function normalizeSettings(input: PartialSettings | null): WorkspaceSettings {
  const defaults = createDefaultWorkspaceSettings();
  if (!input) {
    return defaults;
  }

  const workspaceName =
    typeof input.workspaceName === "string" && input.workspaceName.trim()
      ? input.workspaceName.trim()
      : defaults.workspaceName;

  const language =
    typeof input.language === "string" && input.language.trim()
      ? input.language
      : defaults.language;

  const timeZone =
    typeof input.timeZone === "string" && input.timeZone.trim()
      ? input.timeZone
      : defaults.timeZone;

  const localApiKey =
    typeof input.localApiKey === "string" && input.localApiKey.trim()
      ? input.localApiKey.trim()
      : defaults.localApiKey;

  return {
    workspaceName,
    emailNotifications:
      typeof input.emailNotifications === "boolean"
        ? input.emailNotifications
        : defaults.emailNotifications,
    pushNotifications:
      typeof input.pushNotifications === "boolean"
        ? input.pushNotifications
        : defaults.pushNotifications,
    language,
    timeZone,
    retentionDays: normalizeRetentionDays(input.retentionDays),
    teamInvites: normalizeInvites(input.teamInvites),
    localApiKey,
  };
}

export function loadWorkspaceSettings() {
  if (typeof window === "undefined") {
    return createDefaultWorkspaceSettings();
  }

  const stored = safeParse<PartialSettings>(window.localStorage.getItem(WORKSPACE_SETTINGS_KEY));
  return normalizeSettings(stored);
}

export function saveWorkspaceSettings(settings: WorkspaceSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WORKSPACE_SETTINGS_KEY, JSON.stringify(settings));
}

export function recordLastLoginAt(value = new Date()) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAST_LOGIN_AT_KEY, value.toISOString());
}

export function getLastLoginAt() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(LAST_LOGIN_AT_KEY);
  return typeof value === "string" && value.trim() ? value : null;
}

export function clearWorkspaceSettings() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WORKSPACE_SETTINGS_KEY);
  window.localStorage.removeItem(LAST_LOGIN_AT_KEY);
  window.localStorage.removeItem("theme");
  window.localStorage.removeItem("talvo:notification-read:v2");
  window.localStorage.removeItem("talvo:notifications:v1");
  window.localStorage.removeItem("talvo:candidate-overrides:v1");
  window.localStorage.removeItem("talvo:assistant:conversations:v1");
}

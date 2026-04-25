"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Code,
  Copy,
  Database,
  Download,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Moon,
  RefreshCw,
  Save,
  Sun,
  Trash2,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTheme } from "@/components/theme/ThemeProvider";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  getCandidates,
  getDashboardOverview,
  getJobs,
  getScreeningRuns,
  isMockMode,
  logoutUser,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import {
  clearWorkspaceSettings,
  createDefaultWorkspaceSettings,
  generateLocalApiKey,
  getLastLoginAt,
  loadWorkspaceSettings,
  saveWorkspaceSettings,
  type WorkspaceSettings,
} from "@/lib/settings";
import toast from "@/lib/toast";
import { clamp, formatShortDate } from "@/lib/utils";

const STORAGE_LIMIT_MB = 5;
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_MB * 1024 * 1024;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDateTime(iso: string | null | undefined) {
  if (!iso) {
    return "Unavailable";
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "Unavailable";
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function SettingSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="mt-1 text-xs text-text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        className={`relative h-6 w-11 rounded-full border transition-colors ${
          checked
            ? "border-accent bg-accent"
            : "border-border bg-border/70"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[21px]" : "translate-x-0.5"
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

type TeamMember =
  | {
      email: string;
      role: "Owner";
    }
  | {
      email: string;
      role: "Invited";
      invitedAtISO: string;
    };

export default function SettingsPage() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<WorkspaceSettings>(
    createDefaultWorkspaceSettings()
  );
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState(
    "Talvo Workspace"
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasHydratedSettings, setHasHydratedSettings] = useState(false);
  const [lastLoginAtISO, setLastLoginAtISO] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSignOutBusy, setIsSignOutBusy] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const { data: dashboardOverview } = useQuery({
    queryKey: ["dashboardOverview"],
    queryFn: getDashboardOverview,
    retry: 1,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const storedSettings = loadWorkspaceSettings();
    setSettings(storedSettings);
    setWorkspaceNameDraft(storedSettings.workspaceName);
    setLastLoginAtISO(getLastLoginAt());
    setHasHydratedSettings(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedSettings) {
      return;
    }

    saveWorkspaceSettings(settings);
  }, [settings, hasHydratedSettings]);

  const environmentLabel = isMockMode() ? "Mock API" : "Live API";

  const storageUsageBytes = useMemo(() => {
    if (!dashboardOverview) {
      return 0;
    }

    const payload = JSON.stringify({
      jobs: dashboardOverview.jobs,
      applicants: dashboardOverview.applicants,
      stats: dashboardOverview.stats,
    });
    return new Blob([payload]).size;
  }, [dashboardOverview]);

  const storageUsagePercent = clamp(
    (storageUsageBytes / STORAGE_LIMIT_BYTES) * 100,
    0,
    100
  );

  const accountVerificationLabel = currentUser?.isVerified
    ? "Verified"
    : "Not verified";

  const accountVerificationVariant = currentUser?.isVerified
    ? "success"
    : "warning";

  const teamMembers = useMemo<TeamMember[]>(() => {
    const owner = currentUser
      ? [
          {
            email: currentUser.email,
            role: "Owner" as const,
          },
        ]
      : [];

    const pending = settings.teamInvites.map((invite) => ({
      email: invite.email,
      role: "Invited" as const,
      invitedAtISO: invite.invitedAtISO,
    }));

    return [...owner, ...pending];
  }, [currentUser, settings.teamInvites]);

  const timeZoneOptions = useMemo(() => {
    const defaults = [
      "UTC",
      "Africa/Johannesburg",
      "Europe/London",
      "Europe/Paris",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Asia/Dubai",
    ];

    if (settings.timeZone && !defaults.includes(settings.timeZone)) {
      return [settings.timeZone, ...defaults];
    }

    return defaults;
  }, [settings.timeZone]);

  const handleWorkspaceSave = () => {
    const nextName = workspaceNameDraft.trim();
    if (nextName.length < 2) {
      toast.error({
        title: "Workspace Name Needed",
        description: "Please enter a workspace name with at least 2 characters.",
      });
      return;
    }

    setSettings((previous) => ({
      ...previous,
      workspaceName: nextName,
    }));

    toast.success({
      title: "Workspace Updated",
      description: `Workspace name saved as "${nextName}".`,
    });
  };

  const handlePushNotificationsToggle = async () => {
    if (settings.pushNotifications) {
      setSettings((previous) => ({ ...previous, pushNotifications: false }));
      toast.success({
        title: "Push Notifications Disabled",
        description: "Browser push alerts are now turned off.",
      });
      return;
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.warning({
        title: "Push Not Supported",
        description: "This browser does not support push notifications.",
      });
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      toast.warning({
        title: "Permission Required",
        description: "Allow browser notifications to enable push alerts.",
      });
      return;
    }

    setSettings((previous) => ({ ...previous, pushNotifications: true }));
    toast.success({
      title: "Push Notifications Enabled",
      description: "You will receive browser alerts for key updates.",
    });
  };

  const handleSendTestNotification = () => {
    if (settings.pushNotifications && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Talvo Notifications", {
          body: "Push notifications are working for this workspace.",
        });
      }
    }

    toast.success({
      title: "Test Notification Sent",
      description:
        "We sent a test alert using your current notification preferences.",
    });
  };

  const handleInviteMember = () => {
    const normalized = inviteEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalized)) {
      toast.error({
        title: "Invalid Email",
        description: "Enter a valid teammate email address to create an invite.",
      });
      return;
    }

    const alreadyExists =
      normalized === currentUser?.email.toLowerCase() ||
      settings.teamInvites.some((invite) => invite.email === normalized);

    if (alreadyExists) {
      toast.warning({
        title: "Already Added",
        description: "This email is already in your workspace member list.",
      });
      return;
    }

    setSettings((previous) => ({
      ...previous,
      teamInvites: [
        ...previous.teamInvites,
        {
          email: normalized,
          invitedAtISO: new Date().toISOString(),
        },
      ],
    }));
    setInviteEmail("");

    toast.success({
      title: "Invite Added",
      description: `${normalized} is now listed as a pending invite.`,
    });
  };

  const handleCopyInviteLink = async (email: string) => {
    if (typeof window === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard is not available in this browser.");
      return;
    }

    const link = `${window.location.origin}${ROUTES.register}?invite=${encodeURIComponent(email)}`;

    try {
      await navigator.clipboard.writeText(link);
      toast.success({
        title: "Invite Link Copied",
        description: `Share the link with ${email}.`,
      });
    } catch {
      toast.error("Unable to copy invite link right now.");
    }
  };

  const handleRemoveInvite = (email: string) => {
    setSettings((previous) => ({
      ...previous,
      teamInvites: previous.teamInvites.filter((invite) => invite.email !== email),
    }));
    toast.success({
      title: "Invite Removed",
      description: `${email} was removed from pending invites.`,
    });
  };

  const handleCopyApiKey = async () => {
    if (typeof window === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard is not available in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(settings.localApiKey);
      toast.success({
        title: "API Key Copied",
        description: "The key was copied to your clipboard.",
      });
    } catch {
      toast.error("Unable to copy the API key right now.");
    }
  };

  const handleRegenerateApiKey = () => {
    const nextKey = generateLocalApiKey();
    setSettings((previous) => ({
      ...previous,
      localApiKey: nextKey,
    }));
    setShowApiKey(false);
    toast.success({
      title: "API Key Regenerated",
      description: "A new local integration key has been created.",
    });
  };

  const handleThemeSelection = (value: "light" | "dark") => {
    setTheme(value);
    toast.success({
      title: "Theme Updated",
      description: `Switched to ${value} mode.`,
    });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [overview, jobs, candidates, screeningRuns] = await Promise.all([
        getDashboardOverview().catch(() => null),
        getJobs().catch(() => []),
        getCandidates().catch(() => []),
        getScreeningRuns().catch(() => []),
      ]);

      downloadJson(
        `talvo-workspace-export-${new Date().toISOString().slice(0, 10)}.json`,
        {
          exportedAtISO: new Date().toISOString(),
          environment: isMockMode() ? "mock" : "live",
          currentUser: currentUser ?? null,
          preferences: settings,
          workspace: {
            overview,
            jobs,
            candidates,
            screeningRuns,
          },
        }
      );

      toast.success({
        title: "Export Complete",
        description: "Workspace data was downloaded as a JSON file.",
      });
    } catch {
      toast.error({
        title: "Export Failed",
        description: "We could not export workspace data right now.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOutAndClear = async () => {
    setIsSignOutBusy(true);
    try {
      clearWorkspaceSettings();
      await logoutUser().catch(() => null);
      toast.success({
        title: "Signed Out",
        description: "Local settings were cleared for this browser.",
      });
      router.replace(ROUTES.login);
    } finally {
      setIsSignOutBusy(false);
      setShowClearModal(false);
    }
  };

  const isBusy = isExporting || isSignOutBusy;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-10"
      >
        <PageHeader
          title="Settings"
          subtitle="Manage workspace preferences, notifications, and account controls."
          backHref="/dashboard"
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Workspace"
              subtitle="Branding and environment configuration."
              icon={Zap}
            />
            <CardBody>
              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-semibold text-text-primary">
                    Workspace name
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={workspaceNameDraft}
                      onChange={(event) => setWorkspaceNameDraft(event.target.value)}
                      className="h-11 w-full rounded-input border border-border bg-bg px-4 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                      placeholder="Talvo Workspace"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="px-4"
                      onClick={handleWorkspaceSave}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-text-primary">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">{environmentLabel}</Badge>
                    <Badge variant="default">React Query</Badge>
                    <Badge variant="default">Next.js 16</Badge>
                  </div>
                </div>

                <div className="border-t border-border pt-4 text-sm text-text-muted">
                  Workspace changes are persisted in your browser immediately after saving.
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Notifications"
              subtitle="Control how alerts are delivered."
              icon={Bell}
              right={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendTestNotification}
                >
                  Send test
                </Button>
              }
            />
            <CardBody>
              <div className="space-y-6">
                <SettingSwitch
                  checked={settings.emailNotifications}
                  onChange={() => {
                    const nextValue = !settings.emailNotifications;
                    setSettings((previous) => ({
                      ...previous,
                      emailNotifications: nextValue,
                    }));
                    toast.success({
                      title: nextValue
                        ? "Email Notifications Enabled"
                        : "Email Notifications Disabled",
                      description:
                        "This preference is now saved for your workspace.",
                    });
                  }}
                  label="Email notifications"
                  description="Receive screening and pipeline updates by email."
                />

                <SettingSwitch
                  checked={settings.pushNotifications}
                  onChange={() => void handlePushNotificationsToggle()}
                  label="Push notifications"
                  description="Receive browser alerts for high-priority updates."
                />

                <div className="border-t border-border pt-4 text-xs text-text-muted">
                  Browser push alerts require notification permission in your current browser.
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Security"
              subtitle="Review account session and access posture."
              icon={Lock}
            />
            <CardBody>
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Account verification
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Verification status from your authenticated account.
                    </p>
                  </div>
                  <Badge variant={accountVerificationVariant}>
                    {accountVerificationLabel}
                  </Badge>
                </div>

                <div>
                  <p className="mb-1 text-sm font-semibold text-text-primary">Last login</p>
                  <p className="text-sm text-text-muted">
                    {formatDateTime(lastLoginAtISO ?? currentUser?.updatedAtISO)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(ROUTES.forgotPassword)}
                  >
                    Reset password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearModal(true)}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Team"
              subtitle="Invite and manage workspace participants."
              icon={Users}
            />
            <CardBody>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-text-primary">Team members</p>
                  <div className="space-y-2">
                    {teamMembers.length === 0 ? (
                      <div className="rounded-input border border-dashed border-border px-3 py-3 text-sm text-text-muted">
                        No team members yet.
                      </div>
                    ) : (
                      teamMembers.map((member) => (
                        <div
                          key={`${member.email}-${member.role}`}
                          className="flex items-center justify-between gap-3 rounded-input border border-border bg-bg px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text-primary">
                              {member.email}
                            </p>
                            <p className="text-xs text-text-muted">
                              {member.role}
                              {member.role === "Invited" && member.invitedAtISO
                                ? ` - ${formatShortDate(member.invitedAtISO)}`
                                : ""}
                            </p>
                          </div>
                          {member.role === "Invited" ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded-input border border-border px-2 py-1 text-xs font-semibold text-text-primary transition-colors hover:bg-bg"
                                onClick={() => void handleCopyInviteLink(member.email)}
                              >
                                Copy link
                              </button>
                              <button
                                type="button"
                                className="rounded-input border border-border px-2 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
                                onClick={() => handleRemoveInvite(member.email)}
                              >
                                Remove
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <label className="block text-sm font-semibold text-text-primary">
                    Invite teammate
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="colleague@company.com"
                      className="h-11 w-full rounded-input border border-border bg-bg px-4 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="px-4"
                      onClick={handleInviteMember}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add invite
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="API & Integrations"
              subtitle="Manage your local integration key."
              icon={Code}
            />
            <CardBody>
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-sm font-semibold text-text-primary">
                    Local API key
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={settings.localApiKey}
                      readOnly
                      className="h-11 flex-1 rounded-input border border-border bg-bg px-4 text-sm text-text-primary"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-input border border-border text-text-primary transition-colors hover:bg-bg"
                        onClick={() => setShowApiKey((current) => !current)}
                        aria-label={showApiKey ? "Hide key" : "Show key"}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-input border border-border text-text-primary transition-colors hover:bg-bg"
                        onClick={() => void handleCopyApiKey()}
                        aria-label="Copy API key"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateApiKey}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate key
                  </Button>
                  <Badge variant="info" dot>
                    Stored locally in this browser
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Data & Storage"
              subtitle="Monitor workspace data usage and retention."
              icon={Database}
            />
            <CardBody>
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-semibold text-text-primary">Storage usage</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${storageUsagePercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {formatMegabytes(storageUsageBytes)} of {STORAGE_LIMIT_MB} MB tracked in
                    this workspace snapshot.
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <label className="mb-2 block text-sm font-semibold text-text-primary">
                    Retention policy
                  </label>
                  <select
                    value={settings.retentionDays}
                    onChange={(event) => {
                      const next = Number(event.target.value) as WorkspaceSettings["retentionDays"];
                      setSettings((previous) => ({ ...previous, retentionDays: next }));
                    }}
                    className="h-11 w-full rounded-input border border-border bg-bg px-3 text-sm text-text-primary outline-none transition-all focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                  >
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                    <option value={365}>365 days</option>
                  </select>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="border-accent/20 bg-accent/5">
          <CardHeader
            title="Account & Preferences"
            subtitle="Control language, time zone, and visual theme."
          />
          <CardBody>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-text-primary">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(event) =>
                    setSettings((previous) => ({
                      ...previous,
                      language: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-input border border-border bg-bg px-3 text-sm text-text-primary outline-none transition-all focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="fr-FR">French</option>
                  <option value="es-ES">Spanish</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-primary">
                  Time zone
                </label>
                <select
                  value={settings.timeZone}
                  onChange={(event) =>
                    setSettings((previous) => ({
                      ...previous,
                      timeZone: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-input border border-border bg-bg px-3 text-sm text-text-primary outline-none transition-all focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
                >
                  {timeZoneOptions.map((timeZone) => (
                    <option key={timeZone} value={timeZone}>
                      {timeZone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-primary">
                  Theme
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleThemeSelection("light")}
                    className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-input border text-sm font-semibold transition-colors ${
                      theme === "light"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-bg text-text-primary hover:bg-card"
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThemeSelection("dark")}
                    className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-input border text-sm font-semibold transition-colors ${
                      theme === "dark"
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-border bg-bg text-text-primary hover:bg-card"
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 text-sm text-text-muted">
              Preferences are saved locally as you change them.
            </div>
          </CardBody>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader
            title="Danger Zone"
            subtitle="High-impact account and workspace actions"
          />
          <CardBody>
            <p className="mb-6 text-sm text-text-muted">
              These actions affect your local workspace state on this device.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleExportData()}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-input border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export workspace data"}
              </button>

              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 rounded-input border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
                {isSignOutBusy ? "Signing out..." : "Clear local settings & sign out"}
              </button>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      <Modal
        open={showClearModal}
        title="Clear Local Settings and Sign Out"
        onClose={() => {
          if (!isSignOutBusy) {
            setShowClearModal(false);
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            This will clear settings saved in this browser, then sign you out of your current
            session.
          </p>
          <div className="rounded-input border border-border bg-bg px-3 py-2 text-sm text-text-primary">
            Signed in as {currentUser?.email || "current user"}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowClearModal(false)}
              disabled={isSignOutBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleSignOutAndClear()}
              disabled={isSignOutBusy}
            >
              <LogOut className="h-4 w-4" />
              {isSignOutBusy ? "Signing out..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

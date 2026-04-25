"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronDown,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Moon,
  Settings2,
  SlidersHorizontal,
  Sun,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getWorkspaceNotifications, logoutUser, type WorkspaceNotification } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import {
  DashboardHeaderAccountSkeleton,
} from "@/components/dashboard/DashboardSkeletons";
import { cn, formatShortDate, initials } from "@/lib/utils";

const READ_NOTIFICATIONS_KEY = "talvo:notification-read:v2";

const navItems = [
  {
    href: ROUTES.dashboard,
    label: "Dashboard",
    Icon: Home,
    match: (pathname: string) => pathname === ROUTES.dashboard,
  },
  {
    href: ROUTES.candidates,
    label: "Candidates",
    Icon: Users,
    match: (pathname: string) =>
      pathname === ROUTES.candidates || pathname.startsWith(`${ROUTES.candidates}/`),
  },
  {
    href: ROUTES.messages,
    label: "Messages",
    Icon: MessageSquare,
    match: (pathname: string) =>
      pathname === ROUTES.messages || pathname.startsWith(`${ROUTES.messages}/`),
  },
  {
    href: ROUTES.jobs,
    label: "Jobs",
    Icon: FileText,
    match: (pathname: string) =>
      pathname === ROUTES.jobs ||
      pathname.startsWith(`${ROUTES.jobs}/`) ||
      pathname.startsWith("/dashboard/screening"),
  },
] as const;

export function DashboardHeader({ showLogo = false }: { showLogo?: boolean }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const { data: notificationFeed = [], refetch: refetchNotifications } = useQuery({
    queryKey: ["workspaceNotifications"],
    queryFn: getWorkspaceNotifications,
    staleTime: 15 * 1000,
    retry: 1,
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }

      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setShowAccountMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(READ_NOTIFICATIONS_KEY);
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as string[] | null;
      if (Array.isArray(parsed)) {
        setReadNotificationIds(parsed);
      }
    } catch {
      setReadNotificationIds([]);
    }
  }, []);

  const notifications = useMemo(
    () =>
      notificationFeed.map((notification) => ({
        ...notification,
        read: readNotificationIds.includes(notification.id),
      })),
    [notificationFeed, readNotificationIds],
  );

  const persistReadNotificationIds = (next: string[]) => {
    setReadNotificationIds(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(next));
    }
  };

  const markNotificationRead = (id: string) => {
    if (readNotificationIds.includes(id)) {
      return;
    }

    persistReadNotificationIds([...readNotificationIds, id]);
  };

  const markAllNotificationsRead = () => {
    persistReadNotificationIds(
      Array.from(new Set(notificationFeed.map((notification) => notification.id)))
    );
  };

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    [],
  );
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const displayName = currentUser?.name || "A. Recruiter";
  const roleLabel = "Recruiter";

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Signed out successfully");
      router.push(ROUTES.login);
    } catch {
      toast.error("Unable to fully clear the session right now.");
    }
  };

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-8 sm:pt-6 lg:px-10">
      <div className="rounded-[28px] border border-border/80 bg-card/95 px-4 py-3 shadow-soft backdrop-blur sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            {showLogo ? (
              <Link href={ROUTES.home} className="shrink-0 transition-opacity hover:opacity-90">
                <BrandLogo size="sm" tone={theme === "dark" ? "dark" : "light"} />
              </Link>
            ) : null}

            <nav className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-bg/80 p-1 shadow-sm">
              {navItems.map((item) => {
                const active = item.match(pathname);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "bg-text-primary text-bg shadow-sm"
                        : "text-text-muted hover:bg-card hover:text-text-primary",
                    )}
                  >
                    <item.Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((current) => !current);
                  setShowAccountMenu(false);
                }}
                className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-bg/80 px-3 py-2.5 shadow-sm transition-colors hover:bg-card"
                aria-label="Open notifications"
                aria-expanded={showNotifications}
                aria-haspopup="menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-text-primary">
                  <Bell className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-text-primary">{todayLabel}</span>
                {unreadCount > 0 ? (
                  <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-text-primary px-2 py-1 text-sm font-semibold leading-none text-bg">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {showNotifications ? (
                <div
                  className="absolute left-0 z-50 mt-3 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[24px] border border-border bg-card shadow-modal"
                  role="menu"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-text-primary">Notifications</div>
                      <div className="text-sm text-text-muted">
                        {unreadCount === 0
                          ? "You're all caught up."
                          : `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-border bg-bg px-3 py-1.5 text-sm font-semibold text-text-primary transition-colors hover:bg-card"
                      onClick={markAllNotificationsRead}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[320px] overflow-auto p-2">
                    {notifications.length === 0 ? (
                      <div className="rounded-[18px] border border-dashed border-border bg-bg/60 px-4 py-8 text-center text-sm text-text-muted">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(b.createdAtISO).getTime() -
                            new Date(a.createdAtISO).getTime(),
                        )
                        .map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            className={cn(
                              "mb-2 flex w-full flex-col gap-1 rounded-[18px] border px-4 py-3 text-left transition-colors last:mb-0",
                              notification.read
                                ? "border-border bg-bg/60 hover:bg-bg"
                                : "border-accent/20 bg-accent/5 hover:bg-accent/10",
                            )}
                            onClick={() => {
                              markNotificationRead(notification.id);
                              setShowNotifications(false);

                              if (notification.href) {
                                router.push(notification.href);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-text-primary">
                                {notification.title}
                              </div>
                              <div className="text-sm text-text-muted">
                                {formatShortDate(notification.createdAtISO)}
                              </div>
                            </div>
                            <div className="text-sm text-text-muted">{notification.body}</div>
                          </button>
                        ))
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted transition-colors hover:text-text-primary"
                      onClick={() => {
                        setShowNotifications(false);
                        router.push(ROUTES.dashboardSettings);
                      }}
                    >
                      <Settings2 className="h-4 w-4" />
                      Notification settings
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
                      onClick={async () => {
                        await refetchNotifications();
                        toast.success("Notifications refreshed.");
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border/80 bg-bg/80 text-text-primary shadow-sm transition-colors hover:bg-card"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            <div className="relative" ref={accountMenuRef}>
              {isUserLoading ? (
                <DashboardHeaderAccountSkeleton />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountMenu((current) => !current);
                    setShowNotifications(false);
                  }}
                  className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-bg/80 py-1.5 pl-2 pr-4 shadow-sm transition-colors hover:bg-card"
                  aria-label="Open account menu"
                  aria-expanded={showAccountMenu}
                  aria-haspopup="menu"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/12 text-sm font-bold text-accent">
                    {initials(displayName)}
                  </div>
                  <div className="hidden min-w-0 text-left sm:block">
                    <div className="truncate text-sm font-semibold text-text-primary">
                      {displayName}
                    </div>
                    <div className="text-sm text-text-muted">{roleLabel}</div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-text-muted transition-transform",
                      showAccountMenu && "rotate-180",
                    )}
                  />
                </button>
              )}

              {showAccountMenu && !isUserLoading ? (
                <div
                  className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-[22px] border border-border bg-card shadow-modal"
                  role="menu"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-bg"
                    onClick={() => {
                      setShowAccountMenu(false);
                      router.push(ROUTES.dashboardSettings);
                    }}
                  >
                    <Settings2 className="h-4 w-4 text-text-muted" />
                    Account settings
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-bg"
                    onClick={async () => {
                      setShowAccountMenu(false);
                      await handleLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4 text-text-muted" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => router.push(ROUTES.dashboardSettings)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border/80 bg-bg/80 text-text-primary shadow-sm transition-colors hover:bg-card"
              aria-label="Open dashboard settings"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

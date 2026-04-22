"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, Bell, Moon, Sun, Globe, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { logoutUser } from "@/lib/api";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { initials } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const initialNotifications = [
  {
    id: "1",
    title: "New candidate submitted",
    description: "A candidate has completed screening for UX Designer.",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    title: "New job activity",
    description: "3 applicants updated their status in Product Manager.",
    time: "15m ago",
    read: false,
  },
  {
    id: "3",
    title: "Daily summary ready",
    description: "Your recruitment dashboard is up to date.",
    time: "1h ago",
    read: true,
  },
];

export function DashboardHeader() {
  const { theme, toggleTheme } = useTheme();
  const { data: currentUser } = useCurrentUser();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleNotifications = () => {
    setShowNotifications((current) => !current);
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Signed out successfully");
      window.location.href = ROUTES.login;
    } catch (error) {
      toast.error("Unable to fully clear the session right now.");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="relative hidden min-w-0 flex-1 md:block md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            placeholder="Search jobs, candidates..."
            className="h-9 w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden rounded-badge border border-border bg-bg px-3 py-1 text-[11px] font-semibold text-text-muted xl:inline-flex">
          Live recruiter workspace
        </div>
        <Link href={ROUTES.newJob}>
          <Button size="sm" className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-bg hover:text-text-primary lg:inline-flex"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        <button
          type="button"
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-bg hover:text-text-primary lg:inline-flex"
          aria-label="Language"
        >
          <Globe className="h-4 w-4" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-card flex items-center justify-center">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {showNotifications && (
            <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-card border border-border bg-card shadow-modal">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-text-primary">Notifications</div>
                  <div className="text-xs text-text-muted">{unreadCount} unread</div>
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-text-primary hover:bg-bg transition-colors"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-bg ${
                      notification.read ? "bg-card" : "bg-accent/5"
                    }`}
                    onClick={() => {
                      setNotifications((current) =>
                        current.map((item) =>
                          item.id === notification.id ? { ...item, read: true } : item,
                        ),
                      );
                    }}
                  >
                    <span className="text-sm font-semibold text-text-primary">{notification.title}</span>
                    <span className="text-xs text-text-muted">{notification.description}</span>
                    <span className="text-[11px] text-text-muted">{notification.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="hidden text-right lg:block">
          <div className="text-sm font-semibold text-text-primary">
            {currentUser?.name || "Recruiter Workspace"}
          </div>
          <div className="text-xs text-text-muted">
            {currentUser?.email || "Sign in to sync your workspace"}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="hidden rounded-input border border-border px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-bg hover:text-text-primary lg:inline-flex"
        >
          Sign out
        </button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent ring-2 ring-accent/20">
          {initials(currentUser?.name || "WiseRank")}
        </div>
      </div>
    </header>
  );
}

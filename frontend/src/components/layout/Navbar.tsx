"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { logoutUser } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { initials } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await logoutUser();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Unable to fully clear the session right now.");
    } finally {
      setShowDropdown(false);
      router.push(ROUTES.login);
    }
  };

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/90 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <BrandLogo size="sm" subtitle="Recruiter workspace" />
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="info" className="hidden md:inline-flex">
          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
          Session-backed access
        </Badge>
        <ThemeToggle />
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold text-text-primary">
            {currentUser?.name || "Recruiter Workspace"}
          </div>
          <div className="text-xs text-text-muted">
            {currentUser?.email || "Sign in to sync your profile"}
          </div>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowDropdown((current) => !current);
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent transition-colors hover:bg-accent/25"
            aria-label="User menu"
            aria-expanded={showDropdown}
            aria-haspopup="menu"
          >
            {initials(currentUser?.name || "WiseRank")}
          </button>
          {showDropdown ? (
            <div
              className="absolute right-0 z-50 mt-2 w-52 rounded-card border border-border bg-card py-2 shadow-modal"
              role="menu"
            >
              <div className="border-b border-border px-4 py-3">
                <div className="text-sm font-semibold text-text-primary">
                  {currentUser?.name || "Recruiter Workspace"}
                </div>
                <div className="text-xs text-text-muted">
                  {currentUser?.email || "Connected account"}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-bg"
              >
                <LogOut className="h-4 w-4 text-danger" />
                <span>Sign out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

"use client";

import axios from "axios";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MobileDock } from "@/components/layout/MobileDock";
import { Sidebar } from "@/components/layout/Sidebar.client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ROUTES } from "@/lib/constants";
import toast from "@/lib/toast";
import { Loader2 } from "lucide-react";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasShownAuthToastRef = useRef(false);
  const { isLoading: isUserLoading, error: currentUserError } = useCurrentUser();
  const isAuthError =
    axios.isAxiosError(currentUserError) &&
    [401, 403].includes(currentUserError.response?.status ?? 0);

  useEffect(() => {
    if (!isAuthError) {
      hasShownAuthToastRef.current = false;
      return;
    }

    if (!hasShownAuthToastRef.current) {
      hasShownAuthToastRef.current = true;
      toast.error({
        title: "Sign In Required",
        description: "Please sign in to access the dashboard.",
      });
    }

    router.replace(ROUTES.login);
  }, [isAuthError, router]);

  if (isUserLoading || isAuthError) {
    return (
      <div className="dashboard-density flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          Checking your session...
        </div>
      </div>
    );
  }

  const isAskRuvo = pathname === "/dashboard/ask-ruvo";
  const isScreeningResults =
    pathname?.startsWith("/dashboard/screening/") && pathname.endsWith("/results");

  if (isAskRuvo) {
    return (
      <div className="dashboard-density h-screen bg-bg p-2 sm:p-4 md:p-6 flex flex-col overflow-hidden">
        {children}
      </div>
    );
  }

  if (isScreeningResults) {
    return <div className="dashboard-density min-h-screen bg-bg p-3 sm:p-4 lg:p-6">{children}</div>;
  }

  return (
    <div className="dashboard-density flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 pb-24 sm:p-8 sm:pb-24 lg:p-10 lg:pb-10">{children}</main>
      </div>
      <MobileDock />
    </div>
  );
}

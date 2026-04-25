"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MobileDock } from "@/components/layout/MobileDock";
import { Sidebar } from "@/components/layout/Sidebar.client";

import { usePathname } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

"use client";

import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MobileDock } from "@/components/layout/MobileDock";
import { Sidebar } from "@/components/layout/Sidebar.client";

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 pb-24 sm:p-8 sm:pb-24 lg:p-10 lg:pb-10">{children}</main>
      </div>
      <MobileDock />
    </div>
  );
}

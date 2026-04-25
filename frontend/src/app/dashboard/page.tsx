import type { Metadata } from "next";
import DashboardPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Dashboard",
  description:
    "Track hiring activity, review active roles, and monitor recent pipeline movement inside the Talvo recruiting workspace.",
  path: "/dashboard",
  noIndex: true,
  keywords: ["dashboard", "recruiting workspace", "hiring overview"],
});

export default function Page() {
  return <DashboardPageClient />;
}

import type { Metadata } from "next";
import SettingsPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Workspace Settings",
  description:
    "Manage workspace preferences, notifications, integrations, and account controls for the Talvo recruiting environment.",
  path: "/dashboard/settings",
  noIndex: true,
  keywords: ["workspace settings", "notifications", "integrations"],
});

export default function Page() {
  return <SettingsPageClient />;
}

import type { Metadata } from "next";
import SettingsPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Settings",
  description:
    "Manage workspace preferences, notifications, integrations, and account controls in Talvo.",
  canonicalPath: "/dashboard/settings",
  noIndex: true,
  keywords: ["settings", "workspace preferences", "account controls"],
});

export default function Page() {
  return <SettingsPageClient />;
}

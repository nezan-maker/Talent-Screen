import type { Metadata } from "next";
import MessagesPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Messages",
  description:
    "Open recruiter assistant shortcuts, workspace messaging placeholders, and communication tools inside Talvo.",
  path: "/dashboard/messages",
  noIndex: true,
  keywords: ["messages", "workspace chat", "recruiter assistant"],
});

export default function Page() {
  return <MessagesPageClient />;
}

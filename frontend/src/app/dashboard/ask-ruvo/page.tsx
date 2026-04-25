import type { Metadata } from "next";
import AskRuvoPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Talvo AI",
  description:
    "Use Talvo AI to explore top matches, pipeline summaries, and hiring insights across the workspace.",
  path: "/dashboard/ask-ruvo",
  noIndex: true,
  keywords: ["Talvo AI", "recruiting assistant", "pipeline insights"],
});

export default function Page() {
  return <AskRuvoPageClient />;
}

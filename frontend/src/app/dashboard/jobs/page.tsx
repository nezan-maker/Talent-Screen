import type { Metadata } from "next";
import JobsListPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Jobs",
  description:
    "Review active roles, drafts, and screening status across the Talvo workspace.",
  path: "/dashboard/jobs",
  noIndex: true,
  keywords: ["jobs", "role directory", "hiring roles"],
});

export default function Page() {
  return <JobsListPageClient />;
}

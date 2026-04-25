import type { Metadata } from "next";
import NewJobPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Create Job",
  description:
    "Create a new Talvo job brief, define screening criteria, and launch a role that is ready for recruiter review and AI matching.",
  path: "/dashboard/jobs/new",
  noIndex: true,
  keywords: ["create job", "job brief", "screening criteria"],
});

export default function Page() {
  return <NewJobPageClient />;
}

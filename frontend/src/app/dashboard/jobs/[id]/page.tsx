import type { Metadata } from "next";
import JobDetailPageClient from "./page.client";
import { buildMetadata, findJobById } from "@/lib/metadata";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const job = findJobById(params.id);

  return buildMetadata({
    title: job?.title ?? "Job Details",
    description: job
      ? `Review the ${job.title} role, AI screening criteria, applicant counts, and hiring context inside Talvo.`
      : "Review job details, applicant counts, and AI screening criteria inside Talvo.",
    path: `/dashboard/jobs/${params.id}`,
    noIndex: true,
    keywords: ["job details", "AI screening", "recruiting role"],
  });
}

export default function Page() {
  return <JobDetailPageClient />;
}

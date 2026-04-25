import type { Metadata } from "next";
import JobDetailPageClient from "./page.client";
import { buildMetadata, findJobById } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const job = findJobById(id);

  return buildMetadata({
    title: job?.title ?? "Job Details",
    description: job
      ? `Review the ${job.title} role, AI screening criteria, applicant counts, and hiring context inside Talvo.`
      : "Review job details, applicant counts, and AI screening criteria inside Talvo.",
    path: `/dashboard/jobs/${id}`,
    noIndex: true,
    keywords: ["job details", "AI screening", "recruiting role"],
  });
}

export default function Page() {
  return <JobDetailPageClient />;
}

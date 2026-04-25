import type { Metadata } from "next";
import DashboardJobDetailPage from "@/app/dashboard/jobs/[id]/page";
import { buildMetadata, findJobById } from "@/lib/metadata";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const job = findJobById(params.id);

  return buildMetadata({
    title: job?.title ?? "Job Details",
    description: job
      ? `Review the ${job.title} role, AI screening criteria, and applicant pipeline inside Talvo.`
      : "Review job details and AI screening criteria inside Talvo.",
    canonicalPath: `/dashboard/jobs/${params.id}`,
    noIndex: true,
    keywords: ["job details", "AI screening", "recruiting role"],
  });
}

export default function Page() {
  return <DashboardJobDetailPage />;
}

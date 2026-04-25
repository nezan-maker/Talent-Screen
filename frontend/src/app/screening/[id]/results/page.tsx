import type { Metadata } from "next";
import DashboardScreeningResultsPage from "@/app/dashboard/screening/[id]/results/page";
import { buildMetadata, findJobById } from "@/lib/metadata";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const job = findJobById(params.id);

  return buildMetadata({
    title: job ? `Screening Results for ${job.title}` : "Screening Results",
    description: job
      ? `Review ranked candidates, score breakdowns, and recruiter next steps for the ${job.title} screening run in Talvo.`
      : "Review ranked candidates, score breakdowns, and recruiter next steps from the latest screening run in Talvo.",
    canonicalPath: `/dashboard/screening/${params.id}/results`,
    noIndex: true,
    keywords: ["screening results", "candidate ranking", "AI shortlist"],
  });
}

export default function Page() {
  return <DashboardScreeningResultsPage />;
}

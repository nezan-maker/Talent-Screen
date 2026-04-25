import type { Metadata } from "next";
import ResultsPageClient from "./page.client";
import { buildMetadata, findJobById } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const job = findJobById(id);

  return buildMetadata({
    title: job ? `Screening Results for ${job.title}` : "Screening Results",
    description: job
      ? `Review ranked candidates, score breakdowns, and recruiter next steps for the ${job.title} screening run in Talvo.`
      : "Review ranked candidates, score breakdowns, and recruiter next steps from the latest screening run in Talvo.",
    path: `/dashboard/screening/${id}/results`,
    noIndex: true,
    keywords: ["screening results", "candidate ranking", "AI shortlist"],
  });
}

export default function Page() {
  return <ResultsPageClient />;
}

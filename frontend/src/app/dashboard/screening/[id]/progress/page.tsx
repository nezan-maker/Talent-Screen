import type { Metadata } from "next";
import ScreeningProgressPageClient from "./page.client";
import { buildMetadata, findJobById } from "@/lib/metadata";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const job = findJobById(params.id);

  return buildMetadata({
    title: job ? `Screening Progress for ${job.title}` : "Screening Progress",
    description: job
      ? `Track AI screening progress while Talvo analyzes candidates for the ${job.title} role.`
      : "Track AI screening progress while Talvo analyzes candidates for the selected role.",
    path: `/dashboard/screening/${params.id}/progress`,
    noIndex: true,
    keywords: ["screening progress", "AI analysis", "candidate ranking"],
  });
}

export default function Page() {
  return <ScreeningProgressPageClient />;
}

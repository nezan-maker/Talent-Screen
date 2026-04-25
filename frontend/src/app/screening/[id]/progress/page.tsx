import type { Metadata } from "next";
import DashboardScreeningProgressPage from "@/app/dashboard/screening/[id]/progress/page";
import { buildMetadata, findJobById } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const job = findJobById(id);

  return buildMetadata({
    title: job ? `Screening Progress for ${job.title}` : "Screening Progress",
    description: job
      ? `Track AI screening progress while Talvo analyzes candidates for the ${job.title} role.`
      : "Track AI screening progress while Talvo analyzes candidates for the selected role.",
    canonicalPath: `/dashboard/screening/${id}/progress`,
    noIndex: true,
    keywords: ["screening progress", "AI analysis", "candidate ranking"],
  });
}

export default function Page() {
  return <DashboardScreeningProgressPage />;
}

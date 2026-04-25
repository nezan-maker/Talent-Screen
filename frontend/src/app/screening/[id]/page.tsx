import type { Metadata } from "next";
import DashboardScreeningPage from "@/app/dashboard/screening/[id]/page";
import { buildMetadata, findJobById } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const job = findJobById(id);

  return buildMetadata({
    title: job ? `Applicant Intake for ${job.title}` : "Applicant Intake",
    description: job
      ? `Upload applicants, review candidate intake, and prepare screening for the ${job.title} role in Talvo.`
      : "Upload applicants, review candidate intake, and prepare AI screening inside Talvo.",
    canonicalPath: `/dashboard/screening/${id}`,
    noIndex: true,
    keywords: ["applicant intake", "candidate upload", "screening prep"],
  });
}

export default function Page() {
  return <DashboardScreeningPage />;
}

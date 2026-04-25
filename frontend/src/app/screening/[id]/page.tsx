import type { Metadata } from "next";
import DashboardScreeningPage from "@/app/dashboard/screening/[id]/page";
import { buildMetadata, findJobById } from "@/lib/metadata";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const job = findJobById(params.id);

  return buildMetadata({
    title: job ? `Applicant Intake for ${job.title}` : "Applicant Intake",
    description: job
      ? `Upload applicants, review candidate intake, and prepare screening for the ${job.title} role in Talvo.`
      : "Upload applicants, review candidate intake, and prepare AI screening inside Talvo.",
    canonicalPath: `/dashboard/screening/${params.id}`,
    noIndex: true,
    keywords: ["applicant intake", "candidate upload", "screening prep"],
  });
}

export default function Page() {
  return <DashboardScreeningPage />;
}

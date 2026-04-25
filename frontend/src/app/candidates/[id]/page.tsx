import type { Metadata } from "next";
import DashboardCandidateDetailPage from "@/app/dashboard/candidates/[id]/page";
import { buildMetadata, findCandidateById } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const candidate = findCandidateById(id);
  const appliedRole =
    candidate?.appliedJobTitle ?? candidate?.currentTitle ?? "Candidate profile";

  return buildMetadata({
    title: candidate?.name ?? "Candidate Profile",
    description: candidate
      ? `Review ${candidate.name}'s profile, ${appliedRole} fit, screening status, and hiring context in Talvo.`
      : "Review candidate skills, screening status, and hiring context in Talvo.",
    canonicalPath: `/dashboard/candidates/${id}`,
    noIndex: true,
    keywords: ["candidate profile", "screening status", "hiring context"],
  });
}

export default function Page() {
  return <DashboardCandidateDetailPage />;
}

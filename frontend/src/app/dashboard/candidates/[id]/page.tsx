import type { Metadata } from "next";
import CandidateDetailPageClient from "./page.client";
import { buildMetadata, findCandidateById } from "@/lib/metadata";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const candidate = findCandidateById(params.id);
  const appliedRole =
    candidate?.appliedJobTitle ?? candidate?.currentTitle ?? "Candidate profile";

  return buildMetadata({
    title: candidate?.name ?? "Candidate Profile",
    description: candidate
      ? `Review ${candidate.name}'s profile, ${appliedRole} fit, screening status, and hiring context in Talvo.`
      : "Review candidate skills, screening status, and hiring context in Talvo.",
    path: `/dashboard/candidates/${params.id}`,
    noIndex: true,
    keywords: ["candidate profile", "screening status", "hiring context"],
  });
}

export default function Page() {
  return <CandidateDetailPageClient />;
}

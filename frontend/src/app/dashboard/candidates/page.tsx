import type { Metadata } from "next";
import CandidatesListPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Candidates",
  description:
    "Browse candidate profiles, shortlist status, and linked screening results inside the Talvo recruiting workspace.",
  path: "/dashboard/candidates",
  noIndex: true,
  keywords: ["candidates", "candidate profiles", "talent pipeline"],
});

export default function Page() {
  return <CandidatesListPageClient />;
}

import type { Metadata } from "next";
import LandingPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "AI Candidate Screening for Recruiters",
  description:
    "Talvo helps recruiters screen candidates, explain AI hiring decisions, and manage pipeline workflows in one recruiting workspace.",
  path: "/",
  keywords: ["AI candidate screening", "recruiting software", "hiring analytics"],
});

export default function Page() {
  return <LandingPageClient />;
}

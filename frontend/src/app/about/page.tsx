import type { Metadata } from "next";
import AboutPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "Learn what Talvo is building for recruiters, how the product approaches explainable AI hiring workflows, and what guides the platform.",
  path: "/about",
  keywords: ["about Talvo", "explainable AI", "recruiting platform"],
});

export default function Page() {
  return <AboutPageClient />;
}

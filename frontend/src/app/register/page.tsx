import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Create Account",
  description:
    "Create a Talvo workspace to launch jobs, screen candidates, and manage recruiter-friendly hiring workflows.",
  path: "/register",
  noIndex: true,
  keywords: ["create workspace", "Talvo register", "recruiter signup"],
});

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RegisterPageClient />
    </Suspense>
  );
}

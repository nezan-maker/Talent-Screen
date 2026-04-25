import type { Metadata } from "next";
import LoginPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Sign In",
  description:
    "Sign in to Talvo to manage jobs, review candidates, run AI screening, and work inside the recruiter dashboard.",
  path: "/login",
  noIndex: true,
  keywords: ["Talvo login", "sign in", "recruiter dashboard"],
});

export default function Page() {
  return <LoginPageClient />;
}

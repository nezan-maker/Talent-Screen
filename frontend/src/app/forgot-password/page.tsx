import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Recover Account",
  description:
    "Recover your Talvo account, verify your reset code, and set a new password to return to the recruiting workspace.",
  path: "/forgot-password",
  noIndex: true,
  keywords: ["forgot password", "account recovery", "reset password"],
});

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageClient />
    </Suspense>
  );
}

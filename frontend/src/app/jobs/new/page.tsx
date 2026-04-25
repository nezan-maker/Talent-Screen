import type { Metadata } from "next";
import DashboardNewJobPage from "@/app/dashboard/jobs/new/page";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Create Job",
  description: "Create a new Talvo job brief and screening setup.",
  canonicalPath: "/dashboard/jobs/new",
  noIndex: true,
  keywords: ["create job", "job brief", "screening setup"],
});

export default function Page() {
  return <DashboardNewJobPage />;
}

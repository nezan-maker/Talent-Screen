import type { Metadata } from "next";
import ContactPageClient from "./page.client";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with the Talvo team about recruiting workflows, product questions, partnerships, or demo support.",
  path: "/contact",
  keywords: ["contact Talvo", "demo support", "recruiting software contact"],
});

export default function Page() {
  return <ContactPageClient />;
}

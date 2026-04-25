import type { Metadata, Viewport } from "next";
import { Nunito, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local"
import "./globals.css";
import { AppProviders } from "@/app/providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import {
  SITE_NAME,
  buildMetadata,
  getSiteUrl,
} from "@/lib/metadata";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const gresa = localFont({
    src: "../fonts/Gresa Regular.ttf",
    variable: "--font-gresa",
});
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  ...buildMetadata({
    title: SITE_NAME,
    description:
      "Talvo helps recruiting teams screen candidates, manage job pipelines, and review explainable AI hiring decisions with confidence.",
    path: "/",
    keywords: ["recruiter software", "AI screening", "candidate ranking"],
  }),
  referrer: "origin-when-cross-origin",
  category: "recruitment software",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  icons: {
    icon: [{ url: "/talvo-mark.svg", type: "image/svg+xml" }],
    shortcut: "/talvo-mark.svg",
    apple: "/talvo-mark.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${jetbrainsMono.variable} ${gresa.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-text-primary font-sans">
        <ErrorBoundary>
          <AppProviders>{children}</AppProviders>
          <ServiceWorkerRegister />
        </ErrorBoundary>
      </body>
    </html>
  );
}

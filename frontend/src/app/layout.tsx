import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/app/providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "WiseRank",
  description: "AI-powered candidate screening tool for recruiters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-bg text-text-primary font-sans">
        <ErrorBoundary>
          <AppProviders>{children}</AppProviders>
          <ServiceWorkerRegister />
        </ErrorBoundary>
      </body>
    </html>
  );
}

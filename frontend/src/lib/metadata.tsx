import type { Metadata } from "next";
import type { Candidate, Job } from "@/types";

export const SITE_NAME = "Talvo";
export const DEFAULT_SITE_DESCRIPTION =
  "Talvo helps recruiters screen candidates, manage pipelines, and review explainable AI hiring decisions in one workspace.";

const DEFAULT_KEYWORDS = [
  "Talvo",
  "AI recruiting",
  "candidate screening",
  "recruitment software",
  "hiring pipeline",
  "talent screening",
];

type RouteHeadOptions = {
  title: string;
  description: string;
  path?: string;
  canonicalPath?: string;
  keywords?: string[];
  noIndex?: boolean;
  includeCanonical?: boolean;
};

function normalizeUrlInput(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

export function getSiteUrl() {
  const rawValue =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (rawValue) {
    return new URL(normalizeUrlInput(rawValue));
  }

  return new URL("http://localhost:3000");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, getSiteUrl()).toString();
}

export function formatPageTitle(title: string) {
  return title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
}

function robotsContent(noIndex = false) {
  return noIndex
    ? "noindex, nofollow, noarchive"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
}

export function buildMetadata({
  title,
  description,
  path,
  canonicalPath,
  keywords = [],
  noIndex = false,
}: RouteHeadOptions): Metadata {
  const fullTitle = formatPageTitle(title);
  const canonicalTarget = canonicalPath ?? path;

  return {
    title: fullTitle,
    description,
    applicationName: SITE_NAME,
    alternates: canonicalTarget ? { canonical: canonicalTarget } : undefined,
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalTarget ? absoluteUrl(canonicalTarget) : undefined,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        },
  };
}

export function RouteHead({
  title,
  description,
  path,
  canonicalPath,
  keywords = [],
  noIndex = false,
  includeCanonical = true,
}: RouteHeadOptions) {
  const fullTitle = formatPageTitle(title);
  const canonicalTarget = canonicalPath ?? path;
  const canonicalUrl =
    includeCanonical && canonicalTarget ? absoluteUrl(canonicalTarget) : undefined;
  const robots = robotsContent(noIndex);

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="application-name" content={SITE_NAME} />
      <meta name="keywords" content={[...DEFAULT_KEYWORDS, ...keywords].join(", ")} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
    </>
  );
}

export function findJobById(_jobId: string): Job | undefined {
  return undefined;
}

export function findCandidateById(_candidateId: string): Candidate | undefined {
  return undefined;
}

import type { Metadata } from "next";

export type LandingConfig = {
  slug: string;
  pixelId: string;
  title: string;
  description: string;
  ogImage?: string;
};

// Homepage: https://www.hirepr0.com/
// Uses NEXT_PUBLIC_META_PIXEL_ID from Vercel, with the current Turkey pixel as fallback.
//
// Path pages:
// /Tr002 -> Turkey Pixel 002
// /Tr003 -> Turkey Pixel 003
// /Tr004 -> temporary/test Pixel 004
//
// Pixel IDs are public browser identifiers, not access tokens.
export const LANDING_PAGES: Record<string, LandingConfig> = {
  Tr002: {
    slug: "Tr002",
    pixelId: "2116887169708075",
    title: "HirePro Türkiye | Esnek Online İş Fırsatları",
    description:
      "Türkiye'de esnek ve uzaktan online iş fırsatlarını keşfedin. Yarı zamanlı ve tam zamanlı seçenekleri inceleyin.",
  },
  Tr003: {
    slug: "Tr003",
    pixelId: "1034374378987277",
    title: "HirePro Türkiye | Esnek Online İş Fırsatları",
    description:
      "Türkiye'de esnek ve uzaktan online iş fırsatlarını keşfedin. Yarı zamanlı ve tam zamanlı seçenekleri inceleyin.",
  },
  Tr004: {
    slug: "Tr004",
    pixelId: "2054700951850488",
    title: "HirePro Türkiye | Esnek Online İş Fırsatları",
    description:
      "Türkiye'de esnek ve uzaktan online iş fırsatlarını keşfedin. Yarı zamanlı ve tam zamanlı seçenekleri inceleyin.",
  },
};

export const HOME_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "1027659769983185";

export function getLandingConfig(slug?: string | null) {
  if (!slug) return null;
  return LANDING_PAGES[slug] || null;
}

export function getLandingConfigFromPath(pathname?: string | null) {
  if (!pathname || pathname === "/") return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return null;
  return getLandingConfig(segments[0]);
}

export function getPixelIdForPath(pathname?: string | null) {
  if (!pathname || pathname === "/") return HOME_PIXEL_ID;
  const landing = getLandingConfigFromPath(pathname);
  return landing?.pixelId || "";
}

export function metadataForLanding(config: LandingConfig): Metadata {
  const baseUrl = "https://www.hirepr0.com";
  const url = `${baseUrl}/${config.slug}`;

  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: url },
    openGraph: {
      title: config.title,
      description: config.description,
      url,
      siteName: "HirePro Türkiye",
      locale: "tr_TR",
      type: "website",
      ...(config.ogImage ? { images: [{ url: config.ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      ...(config.ogImage ? { images: [config.ogImage] } : {}),
    },
  };
}

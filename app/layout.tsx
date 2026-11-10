import "./globals.css";
import type { Metadata } from "next";
import MetaPixel from "@/components/MetaPixel";
import TikTokPixel from "@/components/TikTokPixel";

export const metadata: Metadata = {
  title: "HirePro Türkiye | Esnek Online İş Fırsatları",
  description:
    "Türkiye'de esnek ve uzaktan online iş fırsatlarını keşfedin. Yarı zamanlı ve tam zamanlı seçenekleri inceleyin.",
  openGraph: {
    title: "HirePro Türkiye | Esnek Online İş Fırsatları",
    description:
      "Türkiye'de esnek ve uzaktan online iş fırsatlarını keşfedin. Yarı zamanlı ve tam zamanlı seçenekleri inceleyin.",
    url: "https://www.hirepr0.com/",
    siteName: "HirePro Türkiye",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HirePro Türkiye | Esnek Online İş Fırsatları",
    description:
      "Türkiye'de esnek ve uzaktan online iş fırsatlarını keşfedin.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <MetaPixel />
        <TikTokPixel />
        {children}
      </body>
    </html>
  );
}

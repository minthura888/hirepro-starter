// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import MetaPixel from "@/components/MetaPixel";
import PixelRouteTracker from "./components/PixelRouteTracker";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "HirePro Starter",
  description: "Grab your jobs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MetaPixel />
        {/* Next.js requires a suspense boundary around useSearchParams/usePathname */}
        <Suspense fallback={null}>
          <PixelRouteTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

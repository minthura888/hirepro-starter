import "./globals.css";
import type { Metadata } from "next";
import MetaPixel from "@/components/MetaPixel";
import PixelRouteTracker from "@/components/PixelRouteTracker";

export const metadata: Metadata = {
  title: "HirePro Starter",
  description: "Grab your jobs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MetaPixel />
        <PixelRouteTracker />
        {children}
      </body>
    </html>
  );
}

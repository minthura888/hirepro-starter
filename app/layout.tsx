// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import MetaPixel from "@/components/MetaPixel"; // this stays the same
import PixelRouteTracker from "./components/PixelRouteTracker"; // <-- fixed path

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

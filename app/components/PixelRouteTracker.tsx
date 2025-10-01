// app/components/PixelRouteTracker.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __MPX_LAST_URL__?: string;
  }
}

export default function PixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;

    const q = searchParams?.toString();
    const url = q ? `${pathname}?${q}` : pathname;

    // First render already tracked in layout.tsx
    if (!window.__MPX_LAST_URL__) {
      window.__MPX_LAST_URL__ = url;
      return;
    }

    if (window.__MPX_LAST_URL__ !== url) {
      window.__MPX_LAST_URL__ = url;
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __MPX_LAST_URL__?: string;
  }
}

/** Fires exactly one PageView per unique URL (path + query). Skips first load. */
export default function PixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;

    const q = searchParams?.toString();
    const url = q ? `${pathname}?${q}` : pathname;

    // First render after load is already tracked by layout.tsx
    if (!window.__MPX_LAST_URL__) {
      window.__MPX_LAST_URL__ = url; // set baseline but do NOT fire
      return;
    }

    if (window.__MPX_LAST_URL__ !== url) {
      window.__MPX_LAST_URL__ = url;
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

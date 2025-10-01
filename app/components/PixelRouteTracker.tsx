// app/components/PixelRouteTracker.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __HP_PV_LAST_URL__?: string;   // last URL we tracked
  }
}

/**
 * Fires exactly one PageView per unique URL (path + query).
 * Prevents duplicates on first load and during Suspense/rehydration.
 */
export default function PixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;

    const query = searchParams?.toString();
    const currentUrl = query ? `${pathname}?${query}` : pathname;

    if (window.__HP_PV_LAST_URL__ === currentUrl) {
      // already tracked this URL; do nothing
      return;
    }

    window.__HP_PV_LAST_URL__ = currentUrl;
    window.fbq("track", "PageView");
  }, [pathname, searchParams]);

  return null;
}

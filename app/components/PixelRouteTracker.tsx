// app/components/PixelRouteTracker.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export default function PixelRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      // skip the first load, already tracked by base pixel
      isFirstLoad.current = false;
      return;
    }
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

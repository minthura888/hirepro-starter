"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getPixelIdForPath } from "@/lib/landing-config";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: unknown;
    __hireproMetaBaseLoaded?: boolean;
    __hireproMetaInitializedPixels?: Record<string, boolean>;
    __hireproMetaPageViewsSent?: Record<string, boolean>;
    __hireproActiveMetaPixelId?: string;
  }
}

function ensureMetaBase() {
  if (window.fbq) return;

  const fbq: any = function (...args: any[]) {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, args);
    } else {
      fbq.queue.push(args);
    }
  };

  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;

  if (!window.__hireproMetaBaseLoaded) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
    window.__hireproMetaBaseLoaded = true;
  }
}

export default function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    const pixelId = getPixelIdForPath(pathname);

    if (!pixelId || pixelId.startsWith("PASTE_PIXEL_")) {
      // A configured landing path with a placeholder must not silently fall
      // back to another path's Pixel.
      window.__hireproActiveMetaPixelId = undefined;
      return;
    }

    ensureMetaBase();

    window.__hireproMetaInitializedPixels ||= {};
    window.__hireproMetaPageViewsSent ||= {};

    if (!window.__hireproMetaInitializedPixels[pixelId]) {
      window.fbq?.("init", pixelId);
      window.__hireproMetaInitializedPixels[pixelId] = true;
    }

    window.__hireproActiveMetaPixelId = pixelId;

    const pageViewKey = `${pixelId}:${pathname || "/"}`;
    if (!window.__hireproMetaPageViewsSent[pageViewKey]) {
      // trackSingle is deliberate: if a browser visits more than one landing
      // path in the same session, this PageView goes only to the active Pixel.
      window.fbq?.("trackSingle", pixelId, "PageView");
      window.__hireproMetaPageViewsSent[pageViewKey] = true;
    }
  }, [pathname]);

  return null;
}

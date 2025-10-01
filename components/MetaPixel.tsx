"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    __fbqInitialized?: boolean;
  }
}

export default function MetaPixel() {
  const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  useEffect(() => {
    if (!PIXEL_ID) return;

    // hard guard against double init during Fast Refresh or multiple mounts
    if (typeof window !== "undefined" && window.__fbqInitialized) {
      return;
    }

    !(function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        (n as any).callMethod ? (n as any).callMethod.apply(n, arguments) : (n as any).queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      (n as any).push = (n as any);
      (n as any).loaded = true;
      (n as any).version = "2.0";
      (n as any).queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = "https://connect.facebook.net/en_US/fbevents.js";
      s = b.getElementsByTagName(e)[0];
      s.parentNode!.insertBefore(t, s);
    })(window, document, "script");

    window.fbq!("init", PIXEL_ID);
    window.fbq!("track", "PageView"); // initial load only
    window.__fbqInitialized = true;
  }, [PIXEL_ID]);

  // noscript pixel (optional)
  return null;
}

// lib/pixel.ts
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Match ambient typing so TS doesn't complain
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __fbqInitialized?: boolean;
    __hpPageViewSent?: boolean;
  }
}

/** Safe helper to track Meta Pixel events on the client. */
export function fbqTrack(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined" || !window.fbq) return;
  try { window.fbq("track", event, params); } catch {}
}

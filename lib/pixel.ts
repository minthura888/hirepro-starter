// lib/pixel.ts
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// IMPORTANT: match the ambient declaration exactly to avoid TS conflicts
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

/** Safe helper to track Meta Pixel events on the client. */
export function fbqTrack(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  const f = window.fbq;
  if (!f) return;
  try {
    f("track", event, params);
  } catch {
    // no-op
  }
}


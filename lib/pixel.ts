// lib/pixel.ts
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

// Track helper only (no init here!)
export function fbqTrack(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined" || !window.fbq) return;
  try { window.fbq("track", event, params); } catch {}
}


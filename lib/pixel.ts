// lib/pixel.ts
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Do NOT initialize fbq here. This file only tracks events.
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export function fbqTrack(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined" || !window.fbq) return;
  try { window.fbq("track", event, params); } catch {}
}

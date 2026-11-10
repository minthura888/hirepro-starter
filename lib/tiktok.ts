// lib/tiktok.ts
export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

declare global {
  interface Window {
    ttq?: any;
  }
}

export function ttqTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.ttq?.track) return;

  try {
    window.ttq.track(event, params);
  } catch {
    // Tracking must never interrupt the application flow.
  }
}

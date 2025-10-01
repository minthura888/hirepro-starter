// lib/pixel.ts
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type FBQ = ((command: "init", pixelId: string) => void) &
  ((command: "track", event: string, params?: Record<string, any>) => void) &
  ((command: "consent", action: string) => void);

declare global {
  interface Window {
    fbq?: FBQ;
  }
}

/** Call from client only. */
export function fbqTrack(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!window.fbq) return;
  try {
    window.fbq("track", event, params);
  } catch {}
}

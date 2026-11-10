// lib/pixel.ts
// Pixel initialization is handled only by components/MetaPixel.tsx.
// Event calls are sent to the currently active path Pixel with trackSingle.

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __hireproActiveMetaPixelId?: string;
  }
}

export function fbqTrack(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined" || !window.fbq) return;

  const pixelId = window.__hireproActiveMetaPixelId;
  if (!pixelId) return;

  try {
    window.fbq("trackSingle", pixelId, event, params);
  } catch {
    // Tracking must never interrupt the application flow.
  }
}

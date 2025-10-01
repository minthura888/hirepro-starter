// lib/fbq.ts
export function track(event: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
    (window as any).fbq("track", event, params);
  }
}

export function trackLead(params?: Record<string, any>) {
  track("Lead", params);
}

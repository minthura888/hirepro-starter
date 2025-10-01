// components/SendToTelegram.tsx
"use client";

/**
 * Opens Telegram instantly on tap (tg:// scheme) so iOS/Android allow it.
 * Sends the form data in the background (sendBeacon or fetch keepalive),
 * so leaving the page doesn't cancel the save.
 * Includes an Android "intent://" fallback as a last resort.
 */
export default function SendToTelegram({
  botUsername,
  formValues, // { name, phoneCountryCode, phoneDigits, gender, age, email }
  onSavedText = "Saved! Opening Telegram...",
}: {
  botUsername: string;
  formValues: Record<string, any>;
  onSavedText?: string;
}) {
  const tgApp = `tg://resolve?domain=${botUsername}`;
  const tgWeb = `https://t.me/${botUsername}`;
  const tgIntent = `intent://resolve?domain=${botUsername}#Intent;scheme=tg;package=org.telegram.messenger;end`;

  const onClick = () => {
    // 1) (optional) fire Meta Pixel "Lead" inside the user gesture
    try {
      // Safe: if fbq isn't present, this line is ignored
      // @ts-ignore
      window?.fbq?.("track", "Lead", { action: "telegram_start" });
    } catch {}

    // 2) send form in the background (DO NOT await)
    try {
      const body = JSON.stringify(formValues);
      if ("sendBeacon" in navigator) {
        navigator.sendBeacon("/api/apply", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          // @ts-ignore
          keepalive: true,
        });
      }
    } catch {}

    // Optional status text for the user
    try {
      const el = document.getElementById("apply-status");
      if (el) el.textContent = onSavedText;
    } catch {}

    // 3) open Telegram immediately (same tap)
    location.href = tgApp;

    // 4) fallbacks if the app didn't take over
    setTimeout(() => {
      if (document.visibilityState === "hidden") return; // app likely opened

      // iOS & general fallback to https
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        // try Android intent fallback
        location.href = tgIntent;
        setTimeout(() => {
          if (document.visibilityState === "hidden") return;
          location.href = tgWeb;
        }, 500);
      } else {
        location.href = tgWeb;
      }
    }, 700);
  };

  return (
    // IMPORTANT: do NOT add target="_blank"
    <a href={tgApp} onClick={onClick} className="btn btn-primary w-full">
      Send to Telegram
    </a>
  );
}

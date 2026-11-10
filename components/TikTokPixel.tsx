"use client";

import Script from "next/script";

declare global {
  interface Window {
    ttq?: any;
    TiktokAnalyticsObject?: string;
    __hireproTikTokInitialized?: boolean;
    __hireproTikTokPageViewSent?: boolean;
  }
}

export default function TikTokPixel() {
  const PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

  // Safe to deploy before a real TikTok Pixel exists.
  // Nothing is loaded or sent until NEXT_PUBLIC_TIKTOK_PIXEL_ID is configured.
  if (!PIXEL_ID) return null;

  return (
    <Script
      id="tiktok-pixel-base"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function (w, d, t) {
            w.TiktokAnalyticsObject = t;
            var ttq = w[t] = w[t] || [];
            ttq.methods = [
              "page","track","identify","instances","debug","on","off","once",
              "ready","alias","group","enableCookie","disableCookie",
              "holdConsent","revokeConsent","grantConsent"
            ];
            ttq.setAndDefer = function(t,e){
              t[e]=function(){
                t.push([e].concat(Array.prototype.slice.call(arguments,0)))
              }
            };
            for(var i=0;i<ttq.methods.length;i++) ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){
              for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)
                ttq.setAndDefer(e,ttq.methods[n]);
              return e
            };
            ttq.load=function(e,n){
              var r="https://analytics.tiktok.com/i18n/pixel/events.js";
              ttq._i=ttq._i||{};
              ttq._i[e]=[];
              ttq._i[e]._u=r;
              ttq._t=ttq._t||{};
              ttq._t[e]=+new Date;
              ttq._o=ttq._o||{};
              ttq._o[e]=n||{};
              var o=document.createElement("script");
              o.type="text/javascript";
              o.async=true;
              o.src=r+"?sdkid="+e+"&lib="+t;
              var a=document.getElementsByTagName("script")[0];
              a.parentNode.insertBefore(o,a)
            };

            if (!w.__hireproTikTokInitialized) {
              ttq.load("${PIXEL_ID}");
              w.__hireproTikTokInitialized = true;
            }

            if (!w.__hireproTikTokPageViewSent) {
              ttq.page();
              w.__hireproTikTokPageViewSent = true;
            }
          })(window, document, "ttq");
        `,
      }}
    />
  );
}

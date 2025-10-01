"use client"; // must be first

import "./globals.css";
import Script from "next/script";
import { Suspense } from "react";
import PixelRouteTracker from "./components/PixelRouteTracker";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1865880404348903";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Meta Pixel: init once + PageView once (guarded) */}
        <Script id="fb-pixel-init" strategy="afterInteractive">
          {`
            (function () {
              if (!window.__MPX_INIT__) {
                !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
                (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

                fbq('init', '${PIXEL_ID}');
                window.__MPX_INIT__ = true;
              }

              // Guard: only allow ONE PageView ever from "first load"
              if (!window.__MPX_PV_ONLOAD__) {
                fbq('track', 'PageView');
                window.__MPX_PV_ONLOAD__ = true;
              }

              // Wrap fbq to ignore any extra PageView calls (from other code)
              if (!window.__MPX_FBQ_WRAPPED__) {
                var __orig = window.fbq;
                window.fbq = function() {
                  try {
                    if (arguments && arguments[0] === 'track' && arguments[1] === 'PageView') {
                      if (window.__MPX_PV_BLOCKED__) return;
                      // If first-load PageView has already happened, allow others
                      // but block immediate duplicates during same load.
                      if (window.__MPX_PV_ONLOAD__ && window.__MPX_PV_SEEN_ON_LOAD__) {
                        // block duplicate "on-load" PV from other snippets
                        window.__MPX_PV_BLOCKED__ = true;
                        return;
                      }
                      window.__MPX_PV_SEEN_ON_LOAD__ = true;
                    }
                  } catch (e) {}
                  return __orig.apply(this, arguments);
                };
                window.__MPX_FBQ_WRAPPED__ = true;
              }
            })();
          `}
        </Script>

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </head>
      <body>
        {children}
        {/* Track client-side navigations (one PV per unique URL) */}
        <Suspense fallback={null}>
          <PixelRouteTracker />
        </Suspense>
      </body>
    </html>
  );
}

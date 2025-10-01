// app/layout.tsx
"use client";

import Script from "next/script";
import { Suspense } from "react";
import PixelRouteTracker from "./components/PixelRouteTracker";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1865880404348903";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Meta Pixel: init + PageView on first load only */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
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

        {/* IMPORTANT: wrap the hook user in Suspense */}
        <Suspense fallback={null}>
          <PixelRouteTracker />
        </Suspense>
      </body>
    </html>
  );
}

// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import PixelRouteTracker from "./components/PixelRouteTracker";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "HirePro Starter",
  description: "Landing page",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* INIT ONLY (no PageView here) */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1865880404348903');
            `,
          }}
        />
      </head>
      <body>
        {children}

        {/* Fire PageView on route changes (Suspense required for useSearchParams) */}
        <Suspense>
          <PixelRouteTracker />
        </Suspense>

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1865880404348903&ev=PageView&noscript=1"
          />
        </noscript>
      </body>
    </html>
  );
}

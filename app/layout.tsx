// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import PixelRouteTracker from "./_components/PixelRouteTracker";

// Use env var if present, otherwise fall back to your agency's ID
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1865880404348903";

export const metadata: Metadata = {
  title: "HirePro Starter",
  description: "Landing page",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Meta Pixel Base Code */}
        {PIXEL_ID ? (
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
                fbq('init', '${PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
        ) : null}
      </head>
      <body>
        {children}
        {/* Track PageView on client-side route changes */}
        <PixelRouteTracker />

        {/* noscript fallback */}
        <noscript>
          {PIXEL_ID ? (
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
            />
          ) : null}
        </noscript>
      </body>
    </html>
  );
}

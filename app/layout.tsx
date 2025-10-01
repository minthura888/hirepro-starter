// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "HirePro Starter",
  description: "Grab your jobs", // small copy tweak
};

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {META_PIXEL_ID ? (
          <>
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  (function () {
                    if (typeof window === 'undefined') return;

                    // Guard: only init once
                    if (!window.__fbqInitialized) {
                      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
                      (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

                      try { fbq('init', '${META_PIXEL_ID}'); } catch(e) {}
                      window.__fbqInitialized = true;
                    }

                    // Guard: only send PageView once per load
                    if (!window.__hpPageViewSent) {
                      try { fbq('track', 'PageView'); } catch(e) {}
                      window.__hpPageViewSent = true;
                    }
                  })();
                `,
              }}
            />
            <noscript>
              <img
                height="1" width="1" style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`} alt=""
              />
            </noscript>
          </>
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}

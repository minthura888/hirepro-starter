"use client";
import Script from "next/script";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __fbqInitialized?: boolean;
    __pageviewSent?: boolean;
  }
}

export default function MetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="fbq-base" strategy="afterInteractive">
        {`
          (function(){
            if (typeof window === 'undefined') return;

            // Load fbq only once
            if (!window.__fbqInitialized) {
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');

              try { fbq('init', '${PIXEL_ID}'); } catch(e) {}
              window.__fbqInitialized = true;
            }

            // Send PageView only once per page load
            if (!window.__pageviewSent) {
              try { fbq('track', 'PageView'); } catch(e) {}
              window.__pageviewSent = true;
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
          alt=""
        />
      </noscript>
    </>
  );
}

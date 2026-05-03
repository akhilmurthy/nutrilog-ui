import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nutrilog" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/apple-touch-icon.png" />

        <meta name="theme-color" content="#0c371e" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            /* Use tab bar color so safe area at bottom looks like navbar extension */
            background-color: #164a2e;
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
          }
          #root {
            background-color: #0c371e;
            margin: 0;
            padding: 0;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          /* Ensure proper flex layout for the app content */
          #root > div {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
          }
          /* PWA: Add safe area padding to tab bar and extend its background */
          [role="tablist"] {
            padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important;
            margin-bottom: 0 !important;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}

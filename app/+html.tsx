export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover" />

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

        <style dangerouslySetInnerHTML={{ __html: `
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #164a2e;
          }
          #root {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            background: #164a2e;
            overflow: hidden;
          }
          #root > div {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
          }
          /* Prevent input zoom */
          input, textarea, select {
            font-size: 16px !important;
          }
          /* PWA standalone mode - extend to safe areas */
          @media all and (display-mode: standalone) {
            html, body, #root {
              height: 100% !important;
              min-height: 100vh !important;
              min-height: 100dvh !important;
            }
            /* Tab bar should extend into bottom safe area */
            [role="tablist"] {
              padding-bottom: env(safe-area-inset-bottom, 8px) !important;
            }
          }
          /* iOS PWA specific */
          @supports (-webkit-touch-callout: none) {
            body {
              min-height: -webkit-fill-available;
            }
            #root {
              min-height: -webkit-fill-available;
            }
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}

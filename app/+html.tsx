export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Nutrilog" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/apple-touch-icon.png" />

        <meta name="theme-color" content="#164a2e" />

        <style dangerouslySetInnerHTML={{ __html: `
          *, *::before, *::after { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            height: 100dvh;
            width: 100%;
            overflow: hidden;
            background: #164a2e;
          }
          body {
            position: fixed;
            inset: 0;
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
          }
          #root {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
          }
          /* Tab bar with safe area padding */
          [role="tablist"] {
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
          }
          input, textarea, select { font-size: 16px !important; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}

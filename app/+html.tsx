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
          :root {
            --sat: env(safe-area-inset-top);
            --sar: env(safe-area-inset-right);
            --sab: env(safe-area-inset-bottom);
            --sal: env(safe-area-inset-left);
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html { height: 100%; }
          body {
            height: 100%;
            height: 100dvh;
            background: #164a2e;
            overflow: hidden;
            position: fixed;
            width: 100%;
            top: 0;
            left: 0;
          }
          #root {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          #root > div {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          input, textarea, select { font-size: 16px !important; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}

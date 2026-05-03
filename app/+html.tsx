import { ScrollViewStyleReset } from 'expo-router/html';

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

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          * {
            box-sizing: border-box;
          }
          html {
            height: 100%;
            height: -webkit-fill-available;
          }
          body {
            margin: 0;
            padding: 0;
            min-height: 100%;
            min-height: 100vh;
            min-height: -webkit-fill-available;
            overflow: hidden;
            background-color: #164a2e;
            display: flex;
            flex-direction: column;
          }
          #root {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: #164a2e;
            overflow: hidden;
            min-height: 0;
          }
          #root > div {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          /* Prevent input zoom */
          input, textarea, select {
            font-size: 16px !important;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}

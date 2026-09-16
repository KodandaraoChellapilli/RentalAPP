import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Web-only HTML shell. Constrains the app to a phone-sized frame so
 * browser preview looks like a mobile device instead of a full desktop page.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsivePhoneFrame }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsivePhoneFrame = `
html, body {
  height: 100%;
  margin: 0;
  background: #1c1917;
  overflow: hidden;
}
body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}
#root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-width: 430px;
  max-height: 932px;
  background: #f3eee6;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0,0,0,0.45);
}
#root > * {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
@media (min-width: 480px) {
  body {
    padding: 24px 0;
  }
  #root {
    height: min(932px, calc(100vh - 48px));
    border-radius: 28px;
    border: 10px solid #14110e;
  }
}
`;

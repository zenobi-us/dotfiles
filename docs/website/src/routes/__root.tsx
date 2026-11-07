/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import fontUrl from "../assets/fonts/jetbrains-mono-latin-400-normal.woff2?url";
import { NotFound } from "../components/NotFound";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#191521" },
    ],
    links: [
      { rel: "preload", href: fontUrl, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  // `404.html` loads for any missing path, so the client router can land here too.
  notFoundComponent: NotFound,
});

function RootDocument(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body id="top">
        {props.children}
        <Scripts />
      </body>
    </html>
  );
}

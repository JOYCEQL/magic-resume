import {
  ErrorComponent,
  HeadContent,
  Scripts,
  createRootRoute
} from "@tanstack/react-router";
import { RouteProviders } from "@/providers/RouteProviders";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        name: "theme-color",
        content: "#1B1B18"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      {
        rel: "icon",
        href: "/icon.png"
      }
    ]
  }),
  errorComponent: ({ error }) => (
    <RootDocument>
      <ErrorComponent error={error} />
    </RootDocument>
  ),
  shellComponent: RootDocument
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <RouteProviders>{children}</RouteProviders>
        <Scripts />
      </body>
    </html>
  );
}

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing.public";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(zh|en)/:path*"]
};

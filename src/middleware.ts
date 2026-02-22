import createMiddleware from "@/i18n/compat/middleware";
import { routing } from "./i18n/routing.public";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(zh|en)/:path*"]
};

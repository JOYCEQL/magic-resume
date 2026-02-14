import handler from "./intl-proxy";

export default handler;

export const config = {
  matcher: ["/", "/(zh|en)/:path*"],
};

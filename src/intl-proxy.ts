import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing.public";

const handler = createMiddleware(routing);

export default handler;

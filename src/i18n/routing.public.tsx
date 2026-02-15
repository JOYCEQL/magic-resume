import { Link as RouterLink, useRouterState } from "@tanstack/react-router";
import { defaultLocale, locales } from "./config";
import { useLocale } from "next-intl";
import { withLocale } from "./runtime";

export const routing = {
  locales,
  defaultLocale
};

export function usePathname() {
  return useRouterState({ select: (state) => state.location.pathname });
}

export function Link({
  href,
  locale,
  ...props
}: {
  href: string;
  locale?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const currentLocale = useLocale();
  const nextLocale = locale ?? currentLocale;

  return <RouterLink to={withLocale(href, nextLocale)} {...props} />;
}

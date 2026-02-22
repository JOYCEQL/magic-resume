import { Link as RouterLink, useLocation } from "@tanstack/react-router";
import { ComponentProps } from "react";
import { Locale } from "@/i18n/config";
import { replacePathLocale } from "@/i18n/runtime";

export function defineRouting<T extends Record<string, unknown>>(config: T) {
  return config;
}

export function createNavigation(_routing: {
  locales: readonly Locale[];
  defaultLocale: Locale;
}) {
  function Link({
    href,
    locale,
    ...rest
  }: Omit<ComponentProps<typeof RouterLink>, "to"> & {
    href: string;
    locale?: Locale;
  }) {
    const to = locale ? replacePathLocale(href, locale) : href;
    return <RouterLink to={to} {...rest} />;
  }

  function usePathname() {
    return useLocation({
      select: (location) => location.pathname
    });
  }

  return {
    Link,
    usePathname
  };
}


import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import type { Locale } from "./config";
import {
  getLocaleFromPathname,
  getPreferredLocale,
  replacePathLocale,
  setCookieLocale,
} from "./runtime";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  const navigate = useNavigate();
  const [locale, setLocaleState] = useState<Locale>(() =>
    getPreferredLocale(pathname)
  );

  useEffect(() => {
    setLocaleState(getPreferredLocale(pathname));
  }, [pathname]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setCookieLocale(nextLocale);
      setLocaleState(nextLocale);

      const currentPathLocale = getLocaleFromPathname(pathname);
      if (currentPathLocale) {
        navigate({ to: replacePathLocale(pathname, nextLocale) });
      }
    },
    [navigate, pathname]
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useAppLocale(): Locale {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useAppLocale must be used within LocaleProvider");
  }
  return context.locale;
}

export function useSetAppLocale(): (nextLocale: Locale) => void {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useSetAppLocale must be used within LocaleProvider");
  }
  return context.setLocale;
}

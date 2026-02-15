import { useMemo } from "react";
import {
  useNavigate,
  useRouter as useTanStackRouter,
  useRouterState
} from "@tanstack/react-router";

type UrlLike = string | URL;

function normalizeUrl(url: UrlLike): string {
  if (typeof url === "string") {
    return url;
  }
  return url.pathname + url.search + url.hash;
}

export function useRouter() {
  const navigate = useNavigate();
  const router = useTanStackRouter();

  return useMemo(
    () => ({
      push: (href: UrlLike) => {
        void navigate({ to: normalizeUrl(href) });
      },
      replace: (href: UrlLike) => {
        void navigate({ to: normalizeUrl(href), replace: true });
      },
      back: () => {
        if (typeof window !== "undefined") {
          window.history.back();
        }
      },
      forward: () => {
        if (typeof window !== "undefined") {
          window.history.forward();
        }
      },
      refresh: () => {
        void router.invalidate();
      }
    }),
    [navigate, router]
  );
}

export function usePathname() {
  return useRouterState({ select: (state) => state.location.pathname });
}

export function redirect(href: UrlLike): never {
  const target = normalizeUrl(href);

  if (typeof window !== "undefined") {
    window.location.assign(target);
  }

  throw new Error(`NEXT_REDIRECT:${target}`);
}

export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}

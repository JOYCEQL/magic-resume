import { useLocation, useNavigate } from "@tanstack/react-router";

type NavigateTarget =
  | string
  | {
      to: string;
      params?: Record<string, string>;
      search?: Record<string, unknown>;
      hash?: string;
    };

export function useRouter() {
  const navigate = useNavigate();
  const toNavigateOptions = (target: NavigateTarget) =>
    typeof target === "string" ? { to: target } : target;

  return {
    push: (target: NavigateTarget) => navigate(toNavigateOptions(target) as any),
    replace: (target: NavigateTarget) =>
      navigate({ ...toNavigateOptions(target), replace: true } as any),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload()
  };
}

export function usePathname() {
  return useLocation({
    select: (location) => location.pathname
  });
}

export function redirect(to: string): never {
  if (typeof window !== "undefined") {
    window.location.href = to;
  }
  throw new Error(`Redirected to ${to}`);
}

export function notFound(): never {
  throw new Error("Not Found");
}

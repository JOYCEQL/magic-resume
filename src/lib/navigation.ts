import { useLocation, useNavigate } from "@tanstack/react-router";

type NavigateTarget = string;

export function useRouter() {
  const navigate = useNavigate();

  return {
    push: (to: NavigateTarget) => navigate({ to }),
    replace: (to: NavigateTarget) => navigate({ to, replace: true }),
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

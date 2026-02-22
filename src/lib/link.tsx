import { Link as TanStackLink } from "@tanstack/react-router";
import { AnchorHTMLAttributes, forwardRef, PropsWithChildren } from "react";

type Props = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  }
>;

const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { href, children, ...rest },
  ref
) {
  return (
    <TanStackLink ref={ref} to={href} {...(rest as any)}>
      {children}
    </TanStackLink>
  );
});

export default Link;

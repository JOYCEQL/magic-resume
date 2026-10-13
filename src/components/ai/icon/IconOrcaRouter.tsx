import type * as React from "react";

/**
 * OrcaRouter mark. The project loads provider marks from the
 * `@lobehub/icons-static-svg` dependency, which has no OrcaRouter entry, so
 * this is the committed vector fallback the repository already uses for its
 * own logo asset. Same 24x24 grid as the surrounding provider marks.
 */
const OrcaRouterLogo = ({
  size = 24,
  className = "",
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="OrcaRouter Logo"
    role="img"
    {...props}
  >
    <path
      d="M12 2.2c-4.2 0-7.4 3.1-7.4 7 0 2.6 1.5 4.9 3.8 6l-.9 4.1a.7.7 0 0 0 1 .8l3.5-1.9 3.5 1.9a.7.7 0 0 0 1-.8l-.9-4.1c2.3-1.1 3.8-3.4 3.8-6 0-3.9-3.2-7-7.4-7Zm0 2.3c2.8 0 5.1 2.1 5.1 4.7s-2.3 4.7-5.1 4.7-5.1-2.1-5.1-4.7S9.2 4.5 12 4.5Z"
      fill="currentColor"
    />
    <circle cx="12" cy="9.2" r="2.1" fill="currentColor" />
  </svg>
);

export default OrcaRouterLogo;

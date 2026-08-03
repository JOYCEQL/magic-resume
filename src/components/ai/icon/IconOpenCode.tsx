import type * as React from "react";

interface IconOpenCodeProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const IconOpenCode = ({
  size = 24,
  className = "",
  ...props
}: IconOpenCodeProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    fillRule="evenodd"
    className={className}
    aria-label="OpenCode Logo"
    {...props}
  >
    <title>OpenCode</title>
    <path d="M16 6H8v12h8V6zm4 16H4V2h16v20z" />
  </svg>
);

export default IconOpenCode;

import type * as React from "react";

interface GrokLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const IconGrok = ({
  size = 24,
  className = "",
  ...props
}: GrokLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Grok Logo"
      {...props}
    >
      <title>Grok</title>
      <path
        fill="currentColor"
        d="M6.2 4.5h3.1l4.2 6.3 1.7-2.1V4.5h2.9v15h-2.9v-6.8l-5.1 6.8H6.9l5.4-7.1L6.2 4.5zm12.4 9.4c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3z"
      />
    </svg>
  );
};

export default IconGrok;

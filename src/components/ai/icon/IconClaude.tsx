import type * as React from "react";

interface ClaudeLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const IconClaude = ({
  size = 24,
  className = "",
  ...props
}: ClaudeLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Claude Logo"
      {...props}
    >
      <title>Claude</title>
      <path
        fill="currentColor"
        d="M17.304 3.541L12.96 15.293l-2.763-6.66h-2.39l4.528 10.897h2.39L20.695 3.541h-3.391zM6.305 3.541L2 14.117h2.52l.892-2.287h4.528l.88 2.287h2.532L9.048 3.541H6.305zm-.2 6.66l1.48-3.79 1.468 3.79H6.105z"
      />
    </svg>
  );
};

export default IconClaude;

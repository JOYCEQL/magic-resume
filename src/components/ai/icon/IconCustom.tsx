import * as React from "react";

interface CustomLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

const IconCustom = ({
  size = 24,
  className = "",
  ...props
}: CustomLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Custom Logo"
      {...props}
    >
      <title>Custom</title>
      <path
        d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm3-13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9 8a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm2 7a1 1 0 100 2h2a1 1 0 100-2h-2z"
        fill="currentColor"
        className="text-gray-500" // 默认颜色
      />
    </svg>
  );
};

export default IconCustom;

import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
  size = 100,
  className = "",
  onClick,
}) => {
  return (
    <img
      src="/logo.svg"
      alt="Magic Resume Logo"
      width={size}
      height={size}
      className={className}
      onClick={onClick}
    />
  );
};

export default Logo;

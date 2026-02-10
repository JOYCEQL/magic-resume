"use client";
import React from "react";
import Image from "next/image";

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
    <Image
      src="/logo.svg"
      alt="Magic Resume Logo"
      width={size}
      height={size}
      className={className}
      onClick={onClick}
      priority={size >= 64}
    />
  );
};

export default Logo;

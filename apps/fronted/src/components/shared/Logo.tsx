"use client";
import React from "react";
import { useTheme } from "next-themes";

interface LogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
  startColor?: string;
  endColor?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = 100,
  className = "",
  onClick,
  startColor,
  endColor,
}) => {
  const { theme } = useTheme();

  // 默认使用主题色
  const defaultStartColor = theme === "dark" ? "#A700FF" : "#000000";
  const defaultEndColor = theme === "dark" ? "#4F46E5" : "#171717";

  // 使用传入的颜色或默认颜色
  const gradientStartColor = startColor || defaultStartColor;
  const gradientEndColor = endColor || defaultEndColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Magic Resume Logo"
      onClick={onClick}
    >
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradientStartColor} />
          <stop offset="100%" stopColor={gradientEndColor} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 背景圆角矩形 */}
      <rect
        x="5"
        y="5"
        width="90"
        height="90"
        rx="24"
        fill="url(#gradient)"
        filter="url(#glow)"
      />

      {/* 字母 R */}
      <path
        d="M35 30 L35 70 L35 30 L60 30 C67 30 70 35 70 40 C70 45 67 50 60 50 L35 50 L60 70"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default Logo;

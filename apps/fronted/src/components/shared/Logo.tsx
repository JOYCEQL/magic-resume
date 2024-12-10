import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ size = 100, className = "", onClick }) => {
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
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#gradient)" />

      <path
        d="M35 25H65C67.7614 25 70 27.2386 70 30V70C70 72.7614 67.7614 75 65 75H35C32.2386 75 30 72.7614 30 70V30C30 27.2386 32.2386 25 35 25Z"
        fill="white"
      />
      <path
        d="M38 35H62M38 45H62M38 55H52"
        stroke="#E2E8F0"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M30 40C40 35 60 65 70 60"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#glow)"
      >
        <animate
          attributeName="d"
          values="M30 40C40 35 60 65 70 60; M30 60C40 65 60 35 70 40; M30 40C40 35 60 65 70 60"
          dur="4s"
          repeatCount="indefinite"
        />
      </path>

      <path
        d="M65.5 34.5L61.75 38.25L69.25 45.75L73 42L65.5 34.5ZM58 42L34.5 65.5V73H42L65.5 49.5L58 42ZM43.7 67.5L37.5 61.3L55.9 42.9L62.1 49.1L43.7 67.5Z"
        fill="#4F46E5"
      />
    </svg>
  );
};

export default Logo;

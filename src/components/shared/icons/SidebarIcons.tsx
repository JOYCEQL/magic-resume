import React from "react";

interface IconProps {
  size?: number;
  className?: string;
  active?: boolean;
}

/**
 * Modern Flat Vibrant Icons
 * Style: 2D, bold solid colors, no heavy shadows/skeuomorphism.
 * Designed to fill the viewport for maximum visibility.
 */

// Resumes: Flat Blue Document
export const IconResumes: React.FC<IconProps> = ({ size = 24, className, active }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Base Background - Bright Blue */}
    <rect x="4" y="4" width="32" height="32" rx="6" fill="#0066FF" />
    
    {/* Document Details - Flat White */}
    <rect x="10" y="10" width="20" height="3" rx="1" fill="white" />
    <rect x="10" y="17" width="14" height="3" rx="1" fill="white" fillOpacity="0.8" />
    <rect x="10" y="24" width="20" height="3" rx="1" fill="white" fillOpacity="0.8" />
    
    {/* Status indicator - Flat Pink disk */}
    {active && (
      <circle cx="32" cy="32" r="5" fill="#FF4D4F" stroke="white" strokeWidth="2" />
    )}
  </svg>
);

// Templates: 4-Color Grid (Vivid & Flat)
export const IconTemplates: React.FC<IconProps> = ({ size = 24, className, active }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* 4 Flat Squares - Pure Bold Colors */}
    <rect x="4" y="4" width="15" height="15" rx="3" fill="#FF4D4F" /> {/* Red */}
    <rect x="21" y="4" width="15" height="15" rx="3" fill="#FAAD14" /> {/* Yellow */}
    <rect x="4" y="21" width="15" height="15" rx="3" fill="#52C41A" /> {/* Green */}
    <rect x="21" y="21" width="15" height="15" rx="3" fill="#1890FF" /> {/* Blue */}
    
    {/* Simple white dots for 'template' detail */}
    <circle cx="9" cy="9" r="2" fill="white" fillOpacity="0.5" />
    <circle cx="26" cy="9" r="2" fill="white" fillOpacity="0.5" />
    <circle cx="9" cy="26" r="2" fill="white" fillOpacity="0.5" />
    <circle cx="26" cy="26" r="2" fill="white" fillOpacity="0.5" />
  </svg>
);

// Settings: Flat Bold Gear
export const IconSettings: React.FC<IconProps> = ({ size = 24, className, active }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Large Bold Gear Shape - Flat Dark Blue/Gray */}
    <path 
      d="M20 12.5C15.8579 12.5 12.5 15.8579 12.5 20C12.5 24.1421 15.8579 27.5 20 27.5C24.1421 27.5 27.5 24.1421 27.5 20C27.5 15.8579 24.1421 12.5 20 12.5ZM7.5 20C7.5 13.0964 13.0964 7.5 20 7.5V2.5C10.335 2.5 2.5 10.335 2.5 20C2.5 29.665 10.335 37.5 20 37.5V32.5C13.0964 32.5 7.5 26.9036 7.5 20ZM32.5 20C32.5 26.9036 26.9036 32.5 20 32.5V37.5C29.665 37.5 37.5 29.665 37.5 20C37.5 10.335 29.665 2.5 20 2.5V7.5C26.9036 7.5 32.5 13.0964 32.5 20Z" 
      fill="#434343" 
    />
    <path 
      d="M20 5V2.5M20 37.5V35M37.5 20H35M5 20H2.5" 
      stroke="#434343" strokeWidth="5" strokeLinecap="round" 
    />
    <path 
      d="M32.3744 7.62561L34.1421 5.85786M5.85786 34.1421L7.62561 32.3744M32.3744 32.3744L34.1421 34.1421M5.85786 5.85786L7.62561 7.62561" 
      stroke="#434343" strokeWidth="5" strokeLinecap="round" 
    />
    
    {/* Inner Core */}
    <circle cx="20" cy="20" r="4" fill={active ? "#1890FF" : "white"} />
  </svg>
);

// AI: Magic Sparkle (Flat Vibrant Purple)
export const IconAI: React.FC<IconProps> = ({ size = 24, className, active }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Main Flat Star - Vibrant Purple */}
    <path d="M20 2L24.5 14L37 18.5L24.5 23L20 35L15.5 23L3 18.5L15.5 14L20 2Z" fill="#722ED1" />
    
    {/* Inner Star Highlight - Flat Light Purple */}
    <path d="M20 8L22 16L30 18.5L22 21L20 29L18 21L10 18.5L18 16L20 8Z" fill="#B37FEB" />
    
    {/* Accessory Sparkles - Blue & Orange */}
    <circle cx="32" cy="10" r="4" fill="#1890FF" />
    <rect x="5" y="28" width="8" height="8" rx="2" fill="#FA8C16" transform="rotate(25 9 32)" />
  </svg>
);

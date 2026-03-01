import React from "react";
import { cn } from "@/lib/utils";

interface PdfIconProps {
    className?: string;
}

export const PdfIcon = ({ className }: PdfIconProps) => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("h-full w-full", className)}
        >
            {/* Main red body with rounded corners */}
            <path
                d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
                fill="#EF4444"
            />
            {/* Lighter fold corner */}
            <path
                d="M14 2V8H20L14 2Z"
                fill="#FECACA"
                fillOpacity="0.9"
            />
            {/* White 'PDF' text - using simplified paths for better scaling than <text> */}
            <g fill="white">
                <path d="M7 11.5H8.8C9.35228 11.5 9.8 11.9477 9.8 12.5C9.8 13.0523 9.35228 13.5 8.8 13.5H8V15H7V11.5ZM8.8 12.5H8V11.5H8.8V12.5Z" />
                <path d="M11 11.5H12.5C13.3284 11.5 14 12.1716 14 13C14 13.8284 13.3284 14.5 12.5 14.5H12V15H11V11.5ZM12.5 13.5C12.7761 13.5 13 13.2761 13 13C13 12.7239 12.7761 12.5 12.5 12.5H12V13.5H12.5Z" />
                <path d="M15 11.5H17.5V12.5H16V13H17.5V14H16V15H15V11.5Z" />
            </g>
        </svg>
    );
};

import type { PropsWithChildren } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

// Original sidebar glyphs share one grid and inherit the navigation text color.
const SidebarIcon = ({
  size = 20,
  className,
  children,
}: PropsWithChildren<IconProps>) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {children}
  </svg>
);

export const IconResumes = (props: IconProps) => (
  <SidebarIcon {...props}>
    <path d="M14.5 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5L14.5 3Z" />
    <path d="M14.5 3v5.5H20" />
    <circle cx="10" cy="9" r="1.5" />
    <path d="M7.5 14a2.5 2.5 0 0 1 5 0M7.5 17h9M7.5 19.5h6" />
  </SidebarIcon>
);

export const IconTemplates = (props: IconProps) => (
  <SidebarIcon {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <path d="M6.5 6.5H8v11H6.5" />
    <rect x="11.5" y="6.5" width="6" height="4" rx="0.5" />
    <rect x="11.5" y="13.5" width="6" height="4" rx="0.5" />
  </SidebarIcon>
);

export const IconSettings = (props: IconProps) => (
  <SidebarIcon {...props}>
    <path d="M3 7.5h4.5m5 0H21M3 16.5h8.5m5 0H21" />
    <circle cx="10" cy="7.5" r="2.5" />
    <circle cx="14" cy="16.5" r="2.5" />
  </SidebarIcon>
);

export const IconAI = (props: IconProps) => (
  <SidebarIcon {...props}>
    <path d="M4 20v-2c0-5 3-6 6-8 2-1.5 3-3.5 3-4.2" />
    <path d="M4.2 16c1.8-4.5 4.8-3 7.8-3 3.5 0 6-1 7.1-2.45" />
    <path d="M10 12.9c3 .3 3 6.1 7.2 6.1" />
    <circle cx="13" cy="4" r="1.8" />
    <circle cx="20" cy="9" r="1.8" />
    <circle cx="19" cy="19" r="1.8" />
  </SidebarIcon>
);

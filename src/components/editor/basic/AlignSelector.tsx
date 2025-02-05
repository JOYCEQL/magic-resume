import React from "react";
import { cn } from "@/lib/utils";

interface AlignSelectorProps {
  value: "left" | "center" | "right";
  onChange: (value: "left" | "center" | "right") => void;
}

const AlignSelector: React.FC<AlignSelectorProps> = ({ value, onChange }) => {
  const layouts = [
    {
      value: "left",
      icon: (
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="15" cy="24" r="6" className="fill-current" />
          <rect x="27" y="21" width="15" height="2" className="fill-current" />
          <rect x="27" y="25" width="12" height="2" className="fill-current" />
          <rect x="27" y="29" width="13" height="2" className="fill-current" />
        </svg>
      ),
      tooltip: "左对齐",
    },
    {
      value: "center",
      icon: (
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="24" cy="15" r="6" className="fill-current" />
          <rect
            x="16.5"
            y="27"
            width="15"
            height="2"
            className="fill-current"
          />
          <rect x="18" y="31" width="12" height="2" className="fill-current" />
          <rect x="17" y="35" width="14" height="2" className="fill-current" />
        </svg>
      ),
      tooltip: "居中",
    },
    {
      value: "right",
      icon: (
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="33" cy="24" r="6" className="fill-current" />
          <rect x="6" y="21" width="15" height="2" className="fill-current" />
          <rect x="9" y="25" width="12" height="2" className="fill-current" />
          <rect x="8" y="29" width="13" height="2" className="fill-current" />
        </svg>
      ),
      tooltip: "右对齐",
    },
  ];

  return (
    <div className="inline-flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
      {layouts.map((layout) => (
        <button
          key={layout.value}
          onClick={() => onChange(layout.value as "left" | "center" | "right")}
          title={layout.tooltip}
          className={cn(
            "p-2 rounded-lg transition-all duration-200",
            "hover:bg-white dark:hover:bg-neutral-700",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            value === layout.value
              ? "bg-white dark:bg-neutral-700 shadow-sm"
              : "text-neutral-600 dark:text-neutral-400"
          )}
        >
          {layout.icon}
        </button>
      ))}
    </div>
  );
};

export default AlignSelector;

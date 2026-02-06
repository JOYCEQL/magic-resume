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
    <div className="grid grid-cols-3 gap-3">
      {layouts.map((layout) => (
        <button
          key={layout.value}
          onClick={() => onChange(layout.value as "left" | "center" | "right")}
          title={layout.tooltip}
          className={cn(
            "group relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200",
            "hover:scale-[1.02] active:scale-[0.98]",
            value === layout.value
              ? "border-primary bg-primary/5 text-primary shadow-sm"
              : "border-transparent bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {/* Icon wrapper to control size */}
          <div className="w-10 h-10 flex items-center justify-center">
             {React.cloneElement(layout.icon as React.ReactElement, {
                width: "100%",
                height: "100%",
                className: "fill-current"
             })}
          </div>
          {/* <span className="text-[10px] mt-2 font-medium opacity-80">
            {layout.tooltip}
          </span> */}
          
           {value === layout.value && (
            <div className="absolute inset-0 rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background opacity-0 animate-in fade-in zoom-in-95 duration-200 fill-mode-forwards" />
          )}
        </button>
      ))}
    </div>
  );
};

export default AlignSelector;

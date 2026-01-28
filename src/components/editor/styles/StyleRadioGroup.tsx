"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StyleRadioOption {
  value: string;
  label: string;
}

interface StyleRadioGroupProps {
  label: string;
  value: string;
  options: StyleRadioOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function StyleRadioGroup({
  label,
  value,
  options,
  onChange,
  className,
}: StyleRadioGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-gray-600 dark:text-neutral-300 text-sm">
        {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-all",
              value === option.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white dark:bg-neutral-900 text-gray-600 dark:text-neutral-300 border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

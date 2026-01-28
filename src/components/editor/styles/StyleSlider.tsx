"use client";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StyleSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function StyleSlider({
  label,
  value,
  min,
  max,
  step,
  unit = "px",
  onChange,
  className,
}: StyleSliderProps) {
  const displayValue = step < 1 ? value.toFixed(1) : value;

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-gray-600 dark:text-neutral-300 text-sm">
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <div className="flex items-center">
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={displayValue}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v >= min && v <= max) {
                onChange(v);
              }
            }}
            className="h-8 w-16 text-center text-sm border-gray-200 dark:border-neutral-700"
          />
          <span className="ml-1 text-xs text-gray-500 dark:text-neutral-400 min-w-[20px]">
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

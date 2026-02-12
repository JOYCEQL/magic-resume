"use client";

import { DateInput } from "@heroui/date-input";
import { HeroUIProvider } from "@heroui/react";
import { CalendarDate, parseDate } from "@internationalized/date";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface UnifiedDateRangeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const SEPARATOR = " - ";
const PRESENT_VALUES = new Set(["至今", "Present", "Now"]);

const parsePart = (part: string): CalendarDate | null => {
  if (!part) return null;
  const cleanPart = part.trim();
  if (PRESENT_VALUES.has(cleanPart)) return null;

  try {
    let isoStr = cleanPart.replace(/[./]/g, "-");
    if (isoStr.length === 7) isoStr += "-01";
    if (isoStr.length === 4) isoStr += "-01-01";
    return parseDate(isoStr);
  } catch {
    return null;
  }
};

const parseRange = (rangeValue: string) => {
  if (!rangeValue) return { start: null, end: null };

  let startStr = "";
  let endStr = "";

  if (rangeValue.includes(SEPARATOR)) {
    [startStr, endStr] = rangeValue.split(SEPARATOR);
  } else {
    const match = rangeValue.match(/^([^\s]+)\s*(?:-|–|—)\s*([^\s]+)$/);
    if (match) {
      startStr = match[1];
      endStr = match[2];
    } else {
      startStr = rangeValue;
    }
  }

  return { start: parsePart(startStr), end: parsePart(endStr) };
};

export function UnifiedDateRangeInput({
  value,
  onChange,
  className,
}: UnifiedDateRangeInputProps) {
  const [range, setRange] = useState<{ start: CalendarDate | null; end: CalendarDate | null }>(
    () => parseRange(value)
  );

  const updateValue = (newStart: CalendarDate | null, newEnd: CalendarDate | null) => {
    const format = (d: CalendarDate) =>
      `${d.year}/${d.month.toString().padStart(2, "0")}`;

    const startStr = newStart ? format(newStart) : "";
    const endStr = newEnd ? format(newEnd) : "";

    if (!startStr && !endStr) {
      onChange("");
      return;
    }

    if (startStr && !endStr) {
      onChange(`${startStr}${SEPARATOR}`);
      return;
    }

    onChange(`${startStr}${SEPARATOR}${endStr}`);
  };

  const handleStartChange = (newStart: CalendarDate | null) => {
    setRange((prev) => {
      const next = { start: newStart, end: prev.end };
      updateValue(next.start, next.end);
      return next;
    });
  };

  const handleEndChange = (newEnd: CalendarDate | null) => {
    setRange((prev) => {
      const next = { start: prev.start, end: newEnd };
      updateValue(next.start, next.end);
      return next;
    });
  };

  return (
    <div className={cn("w-full", className)}>
      <HeroUIProvider locale="ja-JP">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <DateInput
              value={range.start}
              onChange={handleStartChange}
              variant="bordered"
              granularity="month"
              shouldForceLeadingZeros
              aria-label="Start Date"
              classNames={{
                inputWrapper:
                  "bg-background hover:bg-muted/20 h-9 min-h-0 py-0 px-3 shadow-sm ring-1 ring-inset ring-input border-0",
                innerWrapper: "pb-0",
              }}
            />
          </div>
          <span className="text-muted-foreground">-</span>
          <div className="flex-1 relative">
            <DateInput
              value={range.end}
              onChange={handleEndChange}
              variant="bordered"
              granularity="month"
              shouldForceLeadingZeros
              aria-label="End Date"
              classNames={{
                inputWrapper:
                  "bg-background hover:bg-muted/20 h-9 min-h-0 py-0 px-3 shadow-sm ring-1 ring-inset ring-input border-0",
                innerWrapper: "pb-0",
              }}
            />
          </div>
        </div>
      </HeroUIProvider>
    </div>
  );

}

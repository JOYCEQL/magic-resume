"use client";

import { DateInput } from "@heroui/date-input";
import { CalendarDate, parseDate } from "@internationalized/date";
import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface UnifiedDateRangeInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function UnifiedDateRangeInput({
  value,
  onChange,
  label,
  className,
}: UnifiedDateRangeInputProps) {
  // Parsing logic
  // Expected formats: "YYYY.MM - YYYY.MM"
  const t = useTranslations("common");

  // Helper to normalize separator
  const SEPARATOR = " - ";

  // Helper to parse a single date string part
  const parsePart = (part: string): CalendarDate | null => {
    if (!part) return null;
    const cleanPart = part.trim();
    // Legacy support: if value has "Present", treat as null/empty for end date input?
    // Or just let it fail parse and show empty.
    if (["至今", "Present", "Now"].includes(cleanPart)) return null;

    try {
        // Replace dots with dashes for standard parsing
        let isoStr = cleanPart.replace(/\./g, "-");
        if (isoStr.length === 7) isoStr += "-01"; // YYYY-MM -> YYYY-MM-DD
        if (isoStr.length === 4) isoStr += "-01-01"; // YYYY -> YYYY-MM-DD
        return parseDate(isoStr);
    } catch (e) {
        return null;
    }
  };

  // Deconstruct value into state
  const { start, end } = useMemo(() => {
    if (!value) return { start: null, end: null };
    
    // ... logic ...
    const parts = value.split("-").map(s => s.trim());
    let startStr = "", endStr = "";
    
    if (value.includes(" - ")) {
        [startStr, endStr] = value.split(" - ");
    } else {
         const match = value.match(/^([^\s]+)\s*(?:-|–|—)\s*([^\s]+)$/);
         if (match) {
             startStr = match[1];
             endStr = match[2];
         } else {
             startStr = value;
         }
    }

    const start = parsePart(startStr);
    // If endStr was "Present", parsePart returns null, which is what we want (empty input)
    const end = parsePart(endStr);

    return { start, end };
  }, []); // Empty dependency array for uncontrolled initialization

  const updateValue = (newStart: CalendarDate | null, newEnd: CalendarDate | null) => {
    // Format: YYYY.MM
    const format = (d: CalendarDate) => `${d.year}.${d.month.toString().padStart(2, "0")}`;
    
    const startStr = newStart ? format(newStart) : "";
    const endStr = newEnd ? format(newEnd) : "";

    if (!startStr && !endStr) {
        onChange("");
        return;
    }

    if (startStr && !endStr) {
        // If end is empty, maybe keep separator? "YYYY.MM - "
        // Or just "YYYY.MM"? Context usually implies " - Present" if missing?
        // But user removed "Present" option. 
        // Let's keep separator " - " to denote range started.
        onChange(`${startStr}${SEPARATOR}`); 
        return;
    }

    onChange(`${startStr}${SEPARATOR}${endStr}`);
  };

  return (
    <div className={cn("w-full", className)}>
        <div className="flex items-center gap-2">
            <div className="flex-1">
                <DateInput 
                    value={start}
                    onChange={(d) => updateValue(d, end)}
                    variant="bordered"
                    granularity="month"
                    aria-label="Start Date"
                    classNames={{ 
                        inputWrapper: "bg-background hover:bg-muted/20 h-9 min-h-0 py-0 px-3 shadow-sm ring-1 ring-inset ring-input border-0",
                        innerWrapper: "pb-0",
                    }}
                />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="flex-1 relative">
                <DateInput 
                    value={end}
                    onChange={(d) => updateValue(start, d)}
                    variant="bordered"
                    granularity="month"
                    aria-label="End Date"
                    classNames={{ 
                         inputWrapper: "bg-background hover:bg-muted/20 h-9 min-h-0 py-0 px-3 shadow-sm ring-1 ring-inset ring-input border-0",
                         innerWrapper: "pb-0",
                    }}
                />
            </div>
        </div>
    </div>
  );
}

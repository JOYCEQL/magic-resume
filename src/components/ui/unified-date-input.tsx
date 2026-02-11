"use client";

import { DateInput } from "@heroui/date-input";
import { CalendarDate, parseDate } from "@internationalized/date";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

interface UnifiedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  className?: string;
}

export function UnifiedDateInput({
  value,
  onChange,
  label,
  placeholder,
  isRequired,
  className,
}: UnifiedDateInputProps) {
  const t = useTranslations("common");

  // Parse string "YYYY-MM" to CalendarDate
  // We use useMemo to calculate the initial value only once or when key changes
  // actually, we want to respect value updates if they are completely different (e.g. item switch)
  // but ignore them if they are just caused by our own null update.
  // Easiest robust way for now: Uncontrolled with defaultValue.
  // Assuming the component is remounted when switching items (verified by AnimatePresence in parents).
  const initialDate = useMemo(() => {
    if (!value) return null;
    try {
      const dateStr = value.length === 7 ? `${value}-01` : value;
      return parseDate(dateStr);
    } catch (e) {
      return null;
    }
  }, []); // Empty dependency array to treat as mount-time config

  const handleDateChange = (date: CalendarDate | null) => {
    if (!date) {
      onChange("");
      return;
    }
    const month = date.month.toString().padStart(2, "0");
    onChange(`${date.year}-${month}`);
  };

  return (
    <div className={className}>
      <DateInput
        label={label}
        defaultValue={initialDate}
        onChange={handleDateChange}
        isRequired={isRequired}
        granularity="month"
        variant="bordered"
        labelPlacement="outside"
        classNames={{
             label: "text-sm font-medium text-foreground",
             inputWrapper: "shadow-sm hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary bg-background",
        }}
      />
    </div>
  );
}

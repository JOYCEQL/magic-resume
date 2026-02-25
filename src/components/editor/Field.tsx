import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import RichTextEditor from "../shared/rich-editor/RichEditor";
import AIPolishDialog from "../shared/ai/AIPolishDialog";
import { useAIConfiguration } from "@/hooks/useAIConfiguration";
import { UnifiedDateInput } from "../ui/unified-date-input";
import { UnifiedDateRangeInput } from "../ui/unified-date-range-input";

interface FieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "textarea" | "date" | "editor" | "date-range";
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className,
}: FieldProps) => {
  const [yearInput, setYearInput] = useState("");
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [showPolishDialog, setShowPolishDialog] = useState(false);
  const { checkConfiguration } = useAIConfiguration();
  const t = useTranslations();

  const currentDate = useMemo(
    () => (value ? new Date(value) : undefined),
    [value]
  );

  useEffect(() => {
    if (type === "date" && value) {
      const date = new Date(value);
      setYearInput(date.getFullYear().toString());
      setDisplayMonth(date);
    }
  }, [type, value]);

  useEffect(() => {
    if (type === "date") {
      if (!currentDate && fromDate) {
        setFromDate(undefined);
      } else if (
        currentDate &&
        (!fromDate || currentDate.getTime() !== fromDate.getTime())
      ) {
        setFromDate(currentDate);
      }
    }
  }, [type, currentDate, fromDate]);

  const renderLabel = () => {
    if (!label) return null;
    return (
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "block text-sm font-medium",
            "text-foreground"
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </div>
    );
  };

  const inputStyles = cn(
    "block w-full rounded-md border-0 py-1.5 px-3",
    "text-foreground bg-background",
    "shadow-sm ring-1 ring-inset ring-input",
    "placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary",
    "sm:text-sm sm:leading-6",
    className
  );

  if (type === "date") {
    return (
      <div className="block">
        {renderLabel()}
        <UnifiedDateInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          isRequired={required}
          className={className}
        />
      </div>
    );
  }

  if (type === "date-range") {
    return (
      <div className="block">
        {renderLabel()}
        <UnifiedDateRangeInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
        />
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <label className="block">
        {renderLabel()}
        <motion.textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputStyles}
          required={required}
          rows={4}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        />
      </label>
    );
  }

  if (type === "editor") {
    return (
      <motion.div className="block">
        {renderLabel()}
        <div className="mt-1.5">
          <RichTextEditor
            content={value || ""}
            onChange={onChange}
            placeholder={placeholder}
            onPolish={() => {
              if (checkConfiguration()) {
                setShowPolishDialog(true);
              }
            }}
          />
        </div>

        <AIPolishDialog
          open={showPolishDialog}
          onOpenChange={setShowPolishDialog}
          content={value || ""}
          onApply={(content) => {
            onChange(content);
          }}
        />
      </motion.div>
    );
  }

  return (
    <label className="block">
      {renderLabel()}
      <motion.input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputStyles}
        required={required}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      />
    </label>
  );
};

export default Field;

"use client";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/shared/rich-editor/RichEditor";
import { Button } from "../ui/button";

type FieldProps = {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  type?: "text" | "textarea" | "date" | "editor";
  placeholder?: string;
  required?: boolean;
  className?: string;
};

const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className
}) => {
  const renderLabel = () => (
    <span
      className={cn(
        "text-sm font-medium flex gap-1 items-center",
        "dark:text-neutral-300 text-gray-600"
      )}
    >
      {label}
      {required && <span className="text-red-500">*</span>}
    </span>
  );

  const inputStyles = cn(
    "mt-1.5 block w-full transition-all duration-200",
    "rounded-lg px-4 py-2.5",
    "border"
  );

  if (type === "date") {
    const date = value ? new Date(value) : undefined;

    return (
      <label className="block">
        <span className={cn("text-sm font-medium flex gap-1 items-center")}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full flex items-center justify-between")}
            >
              <span>{date ? format(date, "yyyy-MM-dd") : "选择日期"}</span>
              <CalendarIcon className="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => onChange(date ? date.toISOString() : "")}
              initialFocus
              className={cn("rounded-lg p-3")}
            />
          </PopoverContent>
        </Popover>
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label className="block">
        <span
          className={cn(
            "text-sm font-medium flex gap-1 items-center",
            "dark:text-neutral-300 text-gray-600"
          )}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
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
            content={value}
            onChange={onChange}
            placeholder={placeholder}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <label className="block">
      <span
        className={cn(
          "text-sm font-medium flex gap-1 items-center",
          "dark:text-neutral-300 text-gray-600"
        )}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputStyles}
        required={required}
      />
    </label>
  );
};

export default Field;

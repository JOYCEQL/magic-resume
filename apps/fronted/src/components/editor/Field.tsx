"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import RichTextEditor from "@/app/workbench/compoents/Editor/RichText";

type FieldProps = {
  label: string;
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
  const theme = useResumeStore((state) => state.theme);

  const renderLabel = () => (
    <span
      className={cn(
        "text-sm font-medium flex gap-1 items-center",
        theme === "dark" ? "text-neutral-300" : "text-gray-600"
      )}
    >
      {label}
      {required && <span className="text-red-500">*</span>}
    </span>
  );

  const inputStyles = cn(
    "mt-1.5 block w-full transition-all duration-200",
    "rounded-lg px-4 py-2.5",
    "border",
    theme === "dark"
      ? [
          "bg-neutral-900/30 border-neutral-800",
          "text-neutral-100",
          "focus:bg-neutral-900/50",
          "placeholder:text-neutral-500"
        ]
      : [
          "bg-white border-gray-100",
          "text-gray-900",
          "hover:border-gray-200",
          "placeholder:text-gray-400"
        ],
    "focus:ring-1 focus:ring-offset-1",
    theme === "dark"
      ? "focus:ring-indigo-500/20 focus:ring-offset-neutral-900"
      : "focus:ring-indigo-500/20 focus:ring-offset-white",
    "focus:border-indigo-500"
  );

  if (type === "date") {
    const date = value ? new Date(value) : undefined;

    return (
      <label className="block">
        <span
          className={cn(
            "text-sm font-medium flex gap-1 items-center",
            theme === "dark" ? "text-neutral-300" : "text-gray-600"
          )}
        >
          {label}
          {required && <span className="text-red-500">*</span>}
        </span>
        <Popover>
          <PopoverTrigger asChild>
            <motion.button
              type="button"
              className={cn(
                inputStyles,
                "flex items-center justify-between",
                !date && theme === "dark" ? "text-neutral-500" : "text-gray-400"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span>{date ? format(date, "yyyy-MM-dd") : "选择日期"}</span>
              <CalendarIcon className="w-4 h-4 opacity-50" />
            </motion.button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(
              "w-auto p-0",
              theme === "dark"
                ? "bg-neutral-900 border-neutral-800"
                : "bg-white border-gray-100",
              "shadow-lg rounded-lg"
            )}
            align="start"
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => onChange(date ? date.toISOString() : "")}
              initialFocus
              className={cn(
                "rounded-lg p-3",
                theme === "dark"
                  ? [
                      "bg-neutral-900",
                      "[&_.rdp-day_button:hover]:bg-neutral-800",
                      "[&_.rdp-day_button.rdp-day_selected]:bg-indigo-600",
                      "text-neutral-200"
                    ]
                  : [
                      "bg-white",
                      "[&_.rdp-day_button:hover]:bg-gray-50",
                      "[&_.rdp-day_button.rdp-day_selected]:bg-indigo-600",
                      "text-gray-900"
                    ]
              )}
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
            theme === "dark" ? "text-neutral-300" : "text-gray-600"
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
          theme === "dark" ? "text-neutral-300" : "text-gray-600"
        )}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
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

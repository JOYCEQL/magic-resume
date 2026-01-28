"use client";

import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StyleSelectOption {
  value: string;
  label: string;
}

interface StyleSelectProps {
  label: string;
  value: string;
  options: StyleSelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function StyleSelect({
  label,
  value,
  options,
  onChange,
  className,
}: StyleSelectProps) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-gray-600 dark:text-neutral-300 text-sm">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <SelectTrigger className="border border-gray-200 bg-white text-gray-700 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
            <SelectValue>{selectedOption?.label || value}</SelectValue>
          </SelectTrigger>
        </motion.div>
        <SelectContent
          className={cn(
            "dark:bg-neutral-900 dark:border-neutral-800 dark:text-white",
            "bg-white border-gray-200"
          )}
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

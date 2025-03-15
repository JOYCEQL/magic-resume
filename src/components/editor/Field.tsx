"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";

interface FieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "textarea" | "date" | "editor";
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
  const router = useRouter();
  const {
    doubaoModelId,
    doubaoApiKey,
    selectedModel,
    deepseekApiKey,
    deepseekModelId,
  } = useAIConfigStore();
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
            "text-gray-700 dark:text-neutral-300"
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
    "text-gray-900 dark:text-neutral-300",
    "shadow-sm ring-1 ring-inset ring-gray-300",
    "placeholder:text-gray-400",
    "focus:ring-2 focus:ring-inset focus:ring-primary",
    "dark:bg-neutral-900/30 dark:ring-neutral-700 dark:focus:ring-primary",
    "sm:text-sm sm:leading-6",
    className
  );

  if (type === "date") {
    const formatDate = (date: Date | undefined) => {
      if (!date) return "";
      return date.toLocaleDateString(["zh-CN", "en-US"], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    const handleYearInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const year = e.target.value;
      setYearInput(year);

      if (year && /^\d{4}$/.test(year)) {
        const newYear = parseInt(year);
        if (newYear >= 1900 && newYear <= 2100) {
          const newDate = currentDate
            ? new Date(newYear, currentDate.getMonth(), currentDate.getDate())
            : new Date(newYear, 0, 1);
          setFromDate(newDate);
          onChange(newDate.toISOString());
        }
      }
    };

    const handleYearChange = (year: number) => {
      if (year >= 1900 && year <= 2100) {
        const newDate = currentDate
          ? new Date(year, currentDate.getMonth(), currentDate.getDate())
          : new Date(year, 0, 1);
        setFromDate(newDate);
        setYearInput(year.toString());
        onChange(newDate.toISOString());
      }
    };

    return (
      <div className="block">
        {renderLabel()}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal mt-1.5",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {currentDate ? (
                formatDate(currentDate)
              ) : (
                <span>{t("field.selectDate")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Input
                  type="number"
                  placeholder={t("field.enterYear")}
                  className="w-full pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={yearInput}
                  onChange={handleYearInput}
                  min={1900}
                  max={2100}
                />
                <div className="absolute right-1 top-1 bottom-1 flex flex-col justify-center">
                  <button
                    type="button"
                    className="h-4 flex items-center justify-center text-muted-foreground hover:text-primary"
                    onClick={() => {
                      const currentYear = yearInput ? parseInt(yearInput) : 0;
                      handleYearChange(currentYear + 1);
                    }}
                  >
                    <ChevronUpIcon className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="h-4 flex items-center justify-center text-muted-foreground hover:text-primary"
                    onClick={() => {
                      const currentYear = yearInput ? parseInt(yearInput) : 0;
                      handleYearChange(currentYear - 1);
                    }}
                  >
                    <ChevronDownIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={currentDate}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              onSelect={(date) => {
                if (date) {
                  setDisplayMonth(date);
                  onChange(date.toISOString());
                  setYearInput(date.getFullYear().toString());
                } else {
                  onChange("");
                  setYearInput("");
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
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
              const config = AI_MODEL_CONFIGS[selectedModel];
              const isConfigured =
                selectedModel === "doubao"
                  ? doubaoApiKey && doubaoModelId
                  : config.requiresModelId
                  ? deepseekApiKey && deepseekModelId
                  : deepseekApiKey;

              if (!isConfigured) {
                toast.error(
                  <>
                    <span>{t("previewDock.grammarCheck.configurePrompt")}</span>
                    <Button
                      className="p-0 h-auto text-white"
                      onClick={() => router.push("/app/dashboard/ai")}
                    >
                      {t("previewDock.grammarCheck.configureButton")}
                    </Button>
                  </>
                );
                return;
              }
              setShowPolishDialog(true);
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

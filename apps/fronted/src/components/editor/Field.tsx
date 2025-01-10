"use client";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import RichTextEditor from "../shared/rich-editor/RichEditor";
import AIPolishDialog from "../shared/ai/AIPolishDialog";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface FieldProps {
  label?: string;
  value?: string;
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
  const router = useRouter();
  const [showPolishDialog, setShowPolishDialog] = useState(false);
  const { doubaoModelId, doubaoApiKey } = useAIConfigStore();

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
              {value ? (
                format(new Date(value), "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => onChange(date?.toISOString() || "")}
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
              if (!doubaoApiKey || !doubaoModelId) {
                toast.error(
                  <>
                    <span>请先配置 ApiKey 和 模型Id</span>
                    <Button
                      className="p-0 h-auto text-white"
                      onClick={() => router.push("/app/dashboard/settings")}
                    >
                      去配置
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

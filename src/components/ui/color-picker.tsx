
import { forwardRef, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useForwardedRef } from "../../lib/use-forwarded-ref";

interface ColorPickerProps
  extends Omit<ButtonProps, "value" | "onChange" | "onBlur"> {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    { disabled, value, onChange, onBlur, name, className, ...props },
    forwardedRef
  ) => {
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);

    const parsedValue = useMemo(() => {
      return value || "#FFFFFF";
    }, [value]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            {...props}
            disabled={disabled}
            className={cn(
              "w-[40px] h-[40px] rounded-lg cursor-pointer overflow-hidden p-0 border-2 transition-all hover:scale-105", 
              className
            )}
            onClick={() => setOpen(true)}
            style={{ backgroundColor: parsedValue }}
          >
             <span className="sr-only">Pick a color</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <HexColorPicker color={parsedValue} onChange={onChange} />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-muted-foreground text-sm">#</span>
            <Input
              maxLength={7}
              onChange={(e) => {
                onChange(e.currentTarget.value.startsWith("#") ? e.currentTarget.value : `#${e.currentTarget.value}`);
              }}
              value={parsedValue.replace("#", "")}
              className="h-8"
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
ColorPicker.displayName = "ColorPicker";

export { ColorPicker };

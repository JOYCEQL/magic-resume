import React from "react";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ContactPopoverProps {
  children?: React.ReactNode;
  side?: React.ComponentPropsWithoutRef<typeof PopoverContent>["side"];
  align?: React.ComponentPropsWithoutRef<typeof PopoverContent>["align"];
  sideOffset?: number;
  className?: string;
  renderWrapper?: (popover: React.ReactNode) => React.ReactNode;
}

export function ContactPopover({
  children,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  className,
  renderWrapper,
}: ContactPopoverProps) {
  const locale = useLocale();
  const t = useTranslations("home.redesign");

  if (locale !== "zh") {
    return null;
  }

  const popover = (
    <Popover>
      <PopoverTrigger asChild>
        {children ?? (
          <button
            type="button"
            className={cn(
              "landing-github-button cursor-pointer px-2.5 data-[state=open]:bg-[#f7f7f7]",
              className
            )}
            aria-label={t("nav.contact")}
          >
            <span>{t("nav.contact")}</span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="w-72 rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-xl"
      >
        <img
          src="/landing/xiaohongshu.jpg"
          alt={t("nav.xiaohongshuAlt")}
          width={750}
          height={1024}
          className="block h-auto w-full rounded-xl"
        />
      </PopoverContent>
    </Popover>
  );

  return renderWrapper ? <>{renderWrapper(popover)}</> : popover;
}

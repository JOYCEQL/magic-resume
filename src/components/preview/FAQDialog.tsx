import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FAQ_KEYS } from "@/config/faq";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/compat/client";

const DynamicHelpIcon = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  (props, ref) => (
    <button
      ref={ref}
      {...props}
      className={cn(
        "relative group flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-full",
        // Floating bounce animation to attract attention
        "animate-[bounce_5s_ease-in-out_infinite]",
        props.className
      )}
    >
      {/* Ambient Glow - Uses theme primary color */}
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl group-hover:bg-primary/30 transition-all duration-700 animate-[pulse_4s_ease-in-out_infinite]" />
      
      {/* Glass Container */}
      <div className="absolute inset-0 rounded-full bg-background/40 dark:bg-zinc-900/40 backdrop-blur-md border border-primary/20 group-hover:border-primary/50 transition-colors duration-500 shadow-lg" />

      <svg
        viewBox="0 0 100 100"
        className="relative w-10 h-10 md:w-11 md:h-11 origin-center transition-transform duration-500 group-hover:scale-110 overflow-visible"
      >
        <defs>
          <radialGradient id="magicGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer concentric rings - Thin and elegant */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-primary/20 origin-center animate-[spin_20s_linear_infinite]"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 10"
          className="text-primary/40 origin-center animate-[spin_15s_linear_infinite_reverse]"
        />

        {/* Orbiting dots */}
        <g className="origin-center animate-[spin_8s_linear_infinite]">
          <circle cx="50" cy="5" r="2" className="fill-primary drop-shadow-[0_0_5px_var(--primary)]" />
        </g>
        <g className="origin-center animate-[spin_12s_linear_infinite_reverse]">
          <circle cx="95" cy="50" r="1.5" className="fill-primary/60" />
        </g>

        {/* Inner glowing core */}
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="url(#magicGlow)"
          className="animate-[pulse_3s_ease-in-out_infinite]"
        />
        <circle
          cx="50"
          cy="50"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary/80"
        />

        {/* Question mark - Clean typography */}
        <text
          x="50"
          y="52"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-primary font-bold text-[32px] select-none pointer-events-none"
          style={{ fontFamily: "Inter, system-ui, sans-serif" }}
        >
          ?
        </text>

        {/* Subtle Sparkles */}
        <g className="text-primary">
          <circle cx="20" cy="20" r="1" className="animate-pulse">
            <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="30" r="0.8" className="animate-pulse">
            <animate attributeName="opacity" values="0;1;0" dur="3s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="80" r="1.2" className="animate-pulse">
            <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </button>
  )
);
DynamicHelpIcon.displayName = "DynamicHelpIcon";

export const FAQDialog = () => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("faqDialog");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <DynamicHelpIcon />
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={16}>
            <p>{t("title")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HelpCircle className="h-5 w-5" />
            </div>
             {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_KEYS.map((key) => (
              <AccordionItem key={key} value={key}>
                <AccordionTrigger className="text-left text-[15px] font-medium">
                  {t(`items.${key}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {t(`items.${key}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
};

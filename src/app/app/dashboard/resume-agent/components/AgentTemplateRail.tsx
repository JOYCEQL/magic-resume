import { useState } from "react";
import { ChevronsLeft, ChevronsRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Translator } from "@/i18n/compat/utils";
import { cn } from "@/lib/utils";
import type { ResumeTemplate } from "@/types/template";

interface AgentTemplateRailProps {
  t: Translator;
  templates: ResumeTemplate[];
  /** template.id → 缩略图 URL */
  snapshots: Record<string, string | null>;
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * 预览右侧的可折叠模板栏（贴面板右缘）。
 * 每个模板是一个圆角矩形卡片，内含模板缩略图；hover 微放大 + 边框高亮，
 * 选中态用 primary ring。收起时退化成一条窄竖条。
 */
export const AgentTemplateRail = ({
  t,
  templates,
  snapshots,
  activeId,
  onSelect,
}: AgentTemplateRailProps) => {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1 border-l bg-muted/10 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setOpen(true)}
          aria-label={t("preview.showTemplates")}
          title={t("preview.showTemplates")}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <LayoutGrid aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <aside className="flex w-24 shrink-0 flex-col border-l bg-muted/10">
      <div className="flex items-center justify-between border-b px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {t("preview.templates")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground"
          onClick={() => setOpen(false)}
          aria-label={t("preview.hideTemplates")}
          title={t("preview.hideTemplates")}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="space-y-2 overflow-y-auto p-2">
        {templates.map((template) => {
          const selected = template.id === activeId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              title={template.name}
              className={cn(
                "group block w-full overflow-hidden rounded-xl border bg-background transition",
                selected
                  ? "border-primary ring-2 ring-primary/60"
                  : "border-border hover:border-primary/50 hover:ring-2 hover:ring-primary/30"
              )}
            >
              <div className="aspect-[210/297] overflow-hidden bg-muted/15">
                {snapshots[template.id] ? (
                  <img
                    src={snapshots[template.id] ?? undefined}
                    alt={template.name}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-[10px] text-muted-foreground">
                    {t("template.previewUnavailable")}
                  </div>
                )}
              </div>
              <span className="block truncate px-1.5 py-1 text-center text-[10px] text-muted-foreground">
                {template.name}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

import { useState } from "react";
import { Compass, ExternalLink, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Translator } from "@/i18n/compat/utils";
import { cn } from "@/lib/utils";
import type { DiscoveredDirection } from "@/types/resume-agent";

export interface DirectionSelection {
  directionId: string;
  company: string;
  title?: string;
  url?: string;
}

interface AgentDiscoveryCardProps {
  t: Translator;
  directions: DiscoveredDirection[];
  /** 选择提交中：按钮禁用并显示 loading */
  submitting: boolean;
  onSelect: (selection: DirectionSelection) => void;
}

/**
 * 阶段一「方向发现」结果卡片。
 * 用户没给目标公司时，模型广域搜索后给出可选方向；每个方向列出代表公司与真实
 * JD 链接，用户点某家公司即进入阶段二（调研它的最新 JD 并定制简历）。
 */
export const AgentDiscoveryCard = ({
  t,
  directions,
  submitting,
  onSelect,
}: AgentDiscoveryCardProps) => {
  const [picked, setPicked] = useState<string>();

  if (!directions.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.03]">
      <div className="flex flex-wrap items-center gap-2 border-b border-primary/15 px-4 py-3">
        <Compass aria-hidden className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm font-medium">{t("discovery.title")}</span>
        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
          {t("discovery.count", { count: directions.length })}
        </Badge>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-[11px] leading-4 text-muted-foreground">{t("discovery.hint")}</p>

        {directions.map((direction) => (
          <div key={direction.id} className="rounded-xl border bg-background p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm">{direction.title}</strong>
              {direction.searchSourceCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Search className="h-3 w-3" />
                  {t("discovery.sources", { count: direction.searchSourceCount })}
                </span>
              )}
            </div>

            {direction.matchReason && (
              <p className="mt-1.5 break-words text-xs leading-5 text-muted-foreground">
                {direction.matchReason}
              </p>
            )}

            {direction.sampleUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {direction.sampleUrls.map((url, index) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary underline-offset-4 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t("discovery.viewJd", { index: index + 1 })}
                  </a>
                ))}
              </div>
            )}

            {/* 代表公司：点哪家就调研哪家的最新 JD */}
            {direction.companyExamples.length > 0 && (
              <div className="mt-3 border-t pt-2.5">
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("discovery.pickCompany")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {direction.companyExamples.map((company) => {
                    const key = `${direction.id}:${company}`;
                    const isPicked = picked === key;
                    return (
                      <Button
                        key={key}
                        type="button"
                        size="sm"
                        variant={isPicked ? "default" : "outline"}
                        className={cn("h-7 px-2 text-[11px] font-normal", isPicked && "gap-1.5")}
                        disabled={submitting}
                        onClick={() => {
                          setPicked(key);
                          onSelect({
                            directionId: direction.id,
                            company,
                            title: direction.title,
                            url: direction.sampleUrls[0],
                          });
                        }}
                      >
                        {isPicked && submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                        {company}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        <p className="text-[10px] leading-4 text-muted-foreground/70">{t("discovery.manualHint")}</p>
      </div>
    </div>
  );
};

"use client";

import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import { useResumeStore } from "@/store/useResumeStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet-no-overlay";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Mark from "mark.js";
import { toast } from "sonner";
import { ResumeData } from "@/types/resume";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

export function GrammarCheckDrawer() {
  const t = useTranslations("grammarCheck");
  const {
    errors,
    clearErrors,
    selectError,
    selectedErrorIndex,
    dismissError,
  } = useGrammarCheck();

  const { activeResume, updateResume } = useResumeStore();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (errors.length > 0) {
      setIsOpen(true);
    }
  }, [errors.length]);

  useEffect(() => {
    const handleOpenDrawer = () => setIsOpen(true);
    document.addEventListener("open-grammar-drawer", handleOpenDrawer);
    return () => {
      document.removeEventListener("open-grammar-drawer", handleOpenDrawer);
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleAccept = (index: number) => {
    const error = errors[index];
    if (!error || !activeResume) return;

    // 递归查找并替换简历数据中的文本
    const newResume = JSON.parse(JSON.stringify(activeResume));
    let replaced = false;

    const traverseAndReplace = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === "string") {
            // 优先匹配 context
            if (error.context && obj[key].includes(error.context)) {
                 // 在 context 中查找并替换 text，确保只替换错误部分
                 // 1. 获取原文片段
                 const originalContext = error.context;
                 // 2. 在原文片段中替换错误词汇为建议词汇
                 // 注意：这里假设 text 在 context 中只出现一次，或者我们需要替换的是 context 中的那个实例
                 // 为了安全，我们只替换 context 中的 text
                 if (originalContext.includes(error.text)) {
                     const correctedContext = originalContext.replace(error.text, error.suggestion);
                     // 3. 将修改后的 context 替换回 obj[key]
                     obj[key] = obj[key].replace(originalContext, correctedContext);
                     replaced = true;
                 } else {
                     // 如果 text 不在 context 中（奇怪的情况），尝试直接替换 context
                     // 这通常是 fallback，但如果是整句替换也可以
                     // 但根据新的 Prompt，suggestion 应该是片段，所以这里可能不适用
                     // 暂时保留作为最后的手段，但记录日志或谨慎处理
                     // obj[key] = obj[key].replace(error.context, error.suggestion); 
                     // 由于 suggestion 现在是片段，直接替换 context 是错误的。
                 }
            } 
            // 如果 context 没找到，尝试全局匹配 text（风险较高，但在某些情况下有效）
            // 只有当 text 足够长或者很独特时才安全
            else if (error.text && obj[key].includes(error.text) && error.text.length > 2) {
                 obj[key] = obj[key].replace(error.text, error.suggestion);
                 replaced = true;
            }
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          traverseAndReplace(obj[key]);
        }
      }
    };

    traverseAndReplace(newResume);

    if (replaced) {
      updateResume(activeResume.id, newResume);
      dismissError(index);
      toast.success(t("applied_success"));
    } else {
      toast.error(t("apply_error"));
    }
  };

  const handleIgnore = (index: number) => {
    dismissError(index);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <SheetContent side="left" className="w-[400px] sm:w-[450px] p-0 flex flex-col gap-0 border-r shadow-lg bg-muted/30 backdrop-blur-xl">
        <div className="p-6 pb-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">{t("title")}</SheetTitle>
                <SheetDescription className="text-xs">
                  {t("description", { count: errors.length })}
                </SheetDescription>
              </div>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                    clearErrors();
                    setIsOpen(false);
                }}
            >
                <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-6 h-full">
            <div className="space-y-6 pb-20">
              <AnimatePresence mode="popLayout">
                {errors.map((error, index) => (
                  <motion.div
                    key={`${error.text}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className={cn(
                      "group relative bg-card rounded-xl border border-border/50 shadow-sm transition-all duration-300 overflow-hidden",
                      "hover:shadow-md hover:border-primary/20",
                      selectedErrorIndex === index && "border-primary bg-primary/5 shadow-sm"
                    )}
                    onClick={() => selectError(index)}
                  >
                    {/* 卡片头部 */}
                    <div className="px-4 py-3 border-b border-border/50 flex justify-between items-center bg-muted/20 rounded-t-xl">
                        <Badge 
                            variant="secondary" 
                            className={cn(
                                "text-[10px] px-2 py-0.5 h-5 font-normal tracking-wide",
                                error.type === "spelling" 
                                    ? "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50" 
                                    : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                            )}
                        >
                            {error.type === "spelling" ? t("spelling") : t("punctuation")}
                        </Badge>
                        {/* 只有当 reason 与 Badge 内容不同时才显示 */}
                        {error.reason && error.reason !== "错别字" && error.reason !== "标点符号" && (
                            <span className="text-[10px] text-muted-foreground/70 italic max-w-[180px] truncate">
                                {error.reason}
                            </span>
                        )}
                    </div>

                    <div className="p-5 space-y-5">
                         {/* 内容对比区 */}
                         <div className="grid gap-3">
                            {/* 原文 */}
                            <div className="space-y-1.5 group/original">
                                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider pl-1">
                                    {t("original")}
                                </div>
                                <div className="p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 text-sm text-foreground/80 leading-relaxed border border-red-100/50 dark:border-red-900/30 transition-colors group-hover/original:bg-red-50 dark:group-hover/original:bg-red-950/30">
                                     <span className="line-through decoration-red-400/30 text-muted-foreground/80">
                                        {error.context}
                                     </span>
                                     {error.text && error.text !== error.context && (
                                        <div className="mt-2 text-xs flex items-center gap-1.5 text-red-500/80 font-medium">
                                            <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                                            {error.text}
                                        </div>
                                     )}
                                </div>
                            </div>

                            {/* 箭头 */}
                            <div className="flex justify-center -my-1 text-muted-foreground/20">
                                <ArrowRight className="w-4 h-4 rotate-90" />
                            </div>

                            {/* 建议 */}
                            <div className="space-y-1.5 group/suggestion">
                                <div className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider pl-1">
                                    {t("suggestion")}
                                </div>
                                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-sm text-foreground leading-relaxed border border-emerald-100/50 dark:border-emerald-900/30 font-medium transition-colors group-hover/suggestion:bg-emerald-50 dark:group-hover/suggestion:bg-emerald-950/30">
                                    {error.suggestion}
                                </div>
                            </div>
                         </div>
                    
                        {/* 按钮区 */}
                        <div className="flex gap-3 pt-1">
                            <Button 
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow transition-all" 
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAccept(index);
                                }}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {t("accept")}
                            </Button>
                            <Button 
                                variant="outline" 
                                className="flex-1 border-muted-foreground/20 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-muted-foreground/30 transition-all" 
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleIgnore(index);
                                }}
                            >
                                <X className="w-4 h-4 mr-2" />
                                {t("ignore")}
                            </Button>
                        </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
                
                {errors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                             <Check className="w-10 h-10 text-green-500 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{t("no_errors_title")}</h3>
                        <p className="text-muted-foreground max-w-[250px]">
                            {t("no_errors_desc")}
                        </p>
                    </div>
                )}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

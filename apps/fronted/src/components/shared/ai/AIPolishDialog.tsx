"use client";
import { useEffect, useState, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { cn } from "@/lib/utils";

interface AIPolishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onApply: (content: string) => void;
}

export default function AIPolishDialog({
  open,
  onOpenChange,
  content,
  onApply,
}: AIPolishDialogProps) {
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishedContent, setPolishedContent] = useState("");
  const { doubaoApiKey, doubaoModelId } = useAIConfigStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const polishedContentRef = useRef<HTMLDivElement>(null);

  const handlePolish = async () => {
    try {
      setIsPolishing(true);
      setPolishedContent("");

      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/polish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          apiKey: doubaoApiKey,
          model: doubaoModelId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to polish content");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setPolishedContent((prev) => {
          const newContent = prev + chunk;
          requestAnimationFrame(() => {
            if (polishedContentRef.current) {
              const container = polishedContentRef.current;
              container.scrollTop = container.scrollHeight;
            }
          });
          return newContent;
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Polish aborted");
        return;
      }
      console.error("Polish error:", error);
      toast.error("润色失败");
      onOpenChange(false);
    } finally {
      setIsPolishing(false);
    }
  };

  useEffect(() => {
    if (open) {
      handlePolish();
    } else {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setPolishedContent("");
    }
  }, [open]);

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    onOpenChange(false);
    setPolishedContent("");
  };

  const handleApply = () => {
    onApply(polishedContent);
    handleClose();
    toast.success("已应用润色内容");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isPolishing) {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[1000px]",
          "bg-white dark:bg-neutral-900",
          "border-neutral-200 dark:border-neutral-800",
          "rounded-2xl shadow-2xl dark:shadow-none"
        )}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="pb-6">
          <DialogTitle
            className={cn(
              "flex items-center gap-2 text-2xl",
              "text-neutral-800 dark:text-neutral-100"
            )}
          >
            <Sparkles
              className={cn(
                "h-6 w-6 text-primary animate-pulse",
                "dark:text-primary-400"
              )}
            />
            AI 润色
          </DialogTitle>
          <DialogDescription
            className={cn(
              "text-base",
              "text-neutral-600 dark:text-neutral-400"
            )}
          >
            {isPolishing
              ? "正在为您润色内容..."
              : "已经为您优化了内容，请查看效果"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  "bg-neutral-500 dark:bg-neutral-600"
                )}
              ></div>
              <span
                className={cn(
                  "text-sm font-medium",
                  "text-neutral-600 dark:text-neutral-400"
                )}
              >
                原始内容
              </span>
            </div>
            <div
              className={cn(
                "relative rounded-xl border",
                "bg-neutral-50 dark:bg-neutral-800/50",
                "border-neutral-200 dark:border-neutral-800",
                "p-6 h-[400px] overflow-auto shadow-sm"
              )}
            >
              <div
                className={cn(
                  "prose dark:prose-invert max-w-none",
                  "text-neutral-700 dark:text-neutral-300"
                )}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  "bg-primary animate-pulse"
                )}
              ></div>
              <span
                className={cn(
                  "text-sm font-medium",
                  "text-primary dark:text-primary-400"
                )}
              >
                润色后的内容
              </span>
            </div>
            <div
              ref={polishedContentRef}
              className={cn(
                "relative rounded-xl border",
                "bg-primary/[0.03] dark:bg-primary/[0.1]",
                "border-primary/20 dark:border-primary/30",
                "p-6 h-[400px] overflow-auto shadow-sm scroll-smooth"
              )}
            >
              <div
                className={cn(
                  "prose dark:prose-invert max-w-none",
                  "text-neutral-800 dark:text-neutral-200"
                )}
                dangerouslySetInnerHTML={{ __html: polishedContent }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex items-center gap-3">
          <Button
            onClick={handlePolish}
            disabled={isPolishing}
            className="flex-1 bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:opacity-90 text-white border-none h-11 shadow-lg shadow-purple-500/20"
          >
            {isPolishing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </div>
            ) : (
              "重新生成"
            )}
          </Button>

          <Button
            onClick={handleApply}
            disabled={!polishedContent || isPolishing}
            className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 shadow-lg shadow-primary/20"
          >
            应用内容
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

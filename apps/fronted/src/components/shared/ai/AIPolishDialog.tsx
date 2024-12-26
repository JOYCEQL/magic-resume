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
        className="sm:max-w-[1000px] bg-[#1a1d21] border-gray-800"
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
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            AI 润色
          </DialogTitle>
          <DialogDescription className="text-base text-gray-400">
            {isPolishing
              ? "正在为您润色内容..."
              : "已经为您优化了内容，请查看效果"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
              <span className="text-sm font-medium text-gray-400">
                原始内容
              </span>
            </div>
            <div className="relative rounded-xl border border-gray-800 bg-[#24282c] p-6 h-[400px] overflow-auto shadow-sm">
              <div
                className="prose prose-invert max-w-none text-gray-300"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm font-medium text-primary">
                润色后的内容
              </span>
            </div>
            <div
              ref={polishedContentRef}
              className="relative rounded-xl border border-primary/20 bg-primary/[0.03] p-6 h-[400px] overflow-auto shadow-sm scroll-smooth"
            >
              <div
                className="prose prose-invert max-w-none text-white"
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
            disabled={isPolishing || !polishedContent}
            className="flex-1 bg-primary hover:bg-primary/90 text-white h-11 shadow-lg shadow-primary/20"
          >
            应用内容
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

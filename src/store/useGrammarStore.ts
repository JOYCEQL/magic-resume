import { create } from "zustand";
import { toast } from "sonner";
import Mark from "mark.js";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import { cn } from "@/lib/utils";

export interface GrammarError {
  context: string;
  text: string;
  suggestion: string;
  reason: string;
  type: "spelling" | "grammar";
}

interface GrammarStore {
  isChecking: boolean;
  errors: GrammarError[];
  selectedErrorIndex: number | null;
  highlightKey: number;
  setErrors: (errors: GrammarError[]) => void;
  setIsChecking: (isChecking: boolean) => void;
  setSelectedErrorIndex: (index: number | null) => void;
  incrementHighlightKey: () => void;
  checkGrammar: (text: string) => Promise<void>;
  clearErrors: () => void;
  selectError: (index: number) => void;
  dismissError: (index: number) => void;
}

export const useGrammarStore = create<GrammarStore>((set, get) => ({
  isChecking: false,
  errors: [],
  selectedErrorIndex: null,
  highlightKey: 0,

  setErrors: (errors) => set({ errors }),
  setIsChecking: (isChecking) => set({ isChecking }),
  setSelectedErrorIndex: (selectedErrorIndex) => set({ selectedErrorIndex }),
  incrementHighlightKey: () =>
    set((state) => ({ highlightKey: state.highlightKey + 1 })),

  checkGrammar: async (text: string) => {
    const {
      selectedModel,
      doubaoApiKey,
      doubaoModelId,
      deepseekApiKey,
      deepseekModelId,
      openaiApiKey,
      openaiModelId
    } = useAIConfigStore.getState();

    const config = AI_MODEL_CONFIGS[selectedModel];
    const apiKey = selectedModel === "doubao" ? doubaoApiKey : selectedModel === "openai" ? openaiApiKey : deepseekApiKey;
    const modelId =
      selectedModel === "doubao" ? doubaoModelId : selectedModel === "openai" ? openaiModelId : deepseekModelId;

    set({ isChecking: true });

    try {
      const response = await fetch("/api/grammar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: text,
          apiKey,
          model: config.requiresModelId ? modelId : config.defaultModel,
          modelType: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        toast.error(data.error.message);
        throw new Error(data.error.message);
      }

      if (data.error?.code === "AuthenticationError") {
        toast.error("ApiKey 或 模型Id 不正确");
        throw new Error(data.error.message);
      }

      const aiResponse = data.choices[0]?.message?.content;

      try {
        const grammarErrors = JSON.parse(aiResponse);
        if (grammarErrors.errors.length === 0) {
          set({ errors: [] });
          toast.success("无语法错误");
          return;
        }
        set({ errors: grammarErrors.errors });

        const preview = document.getElementById("resume-preview");
        if (preview) {
          const marker = new Mark(preview);
          marker.unmark();
          grammarErrors.errors.forEach((error: GrammarError) => {
            marker.mark(error.context || error.text || "", {
              className: "bg-yellow-200 dark:bg-yellow-900",
            });
          });
        }
      } catch (parseError) {
        toast.error(`解析AI响应失败: ${parseError}`);
        set({ errors: [] });
      }
    } catch (error) {
      set({ errors: [] });
    } finally {
      set({ isChecking: false });
    }
  },

  clearErrors: () => {
    const preview = document.getElementById("resume-preview");
    if (preview) {
      const marker = new Mark(preview);
      marker.unmark();
    }
    set({ errors: [], selectedErrorIndex: null });
  },

  selectError: (index: number) => {
    const { errors } = get();
    const error = errors[index];
    if (!error) return;

    set({ selectedErrorIndex: index });

    const preview = document.getElementById("resume-preview");
    if (!preview) return;

    const marker = new Mark(preview);
    marker.unmark();

    errors.forEach((err, i) => {
      marker.mark(err.context || err.text || "", {
        className: cn(
          "bg-yellow-200 dark:bg-yellow-900",
          i === index && "bg-green-200 dark:bg-green-900"
        ),
      });
    });

    const marks = preview.querySelectorAll("mark");
    const selectedMark = marks[index];
    if (selectedMark) {
      selectedMark.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  },
  dismissError: (index: number) => {
    set((state) => {
      const newErrors = [...state.errors];
      newErrors.splice(index, 1);
      
      const preview = document.getElementById("resume-preview");
      if (preview) {
        // 重新标记剩余错误
        const marker = new Mark(preview);
        marker.unmark();
        newErrors.forEach((error, i) => {
             marker.mark(error.context || error.text || "", {
              className: cn(
                  "bg-yellow-200 dark:bg-yellow-900",
                  state.selectedErrorIndex === i && "bg-green-200 dark:bg-green-900" 
                  // 注意：selectedErrorIndex 可能因为删除而需要调整，这里简化处理，稍后在选中逻辑中可能需要优化
                  // 为了保持一致性，最好是重新选中当前索引或重置选中
              )
             });
        });
      }

      return { errors: newErrors, selectedErrorIndex: null };
    });
  },
}));

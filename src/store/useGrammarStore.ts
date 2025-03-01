import { create } from "zustand";
import { toast } from "sonner";
import Mark from "mark.js";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import { cn } from "@/lib/utils";
import type { AIModelType } from "@/store/useAIConfigStore";

export interface GrammarError {
  error: string;
  suggestion: string;
  context: string;
  type?: string;
  text?: string;
}

interface GrammarStore {
  isChecking: boolean;
  errors: GrammarError[];
  selectedErrorIndex: number | null;
  highlightKey: number;
  
  // 操作方法
  setErrors: (errors: GrammarError[]) => void;
  setIsChecking: (isChecking: boolean) => void;
  setSelectedErrorIndex: (index: number | null) => void;
  incrementHighlightKey: () => void;
  checkGrammar: (text: string) => Promise<void>;
  clearErrors: () => void;
  selectError: (index: number) => void;
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
      // 原有服务商配置
      doubaoApiKey,
      doubaoModelId,
      deepseekApiKey,
      deepseekModelId,
      // 新增自定义服务商配置
      customApiKey,
      customBaseURL,
      customModelId,
    } = useAIConfigStore.getState();

    // 动态获取配置参数
    let apiKey: string;
    let modelId: string;
    let baseURL: string | undefined;

    if (selectedModel === "custom") {
      apiKey = customApiKey;
      modelId = customModelId;
      baseURL = customBaseURL;
    } else {
      const config = AI_MODEL_CONFIGS[selectedModel];
      apiKey = selectedModel === "doubao" ? doubaoApiKey : deepseekApiKey;
      modelId = selectedModel === "doubao" ? doubaoModelId : deepseekModelId;
      baseURL = undefined; // 非自定义服务商不需要 baseURL
    }

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
          model: modelId,
          modelType: selectedModel,
          baseURL, // 新增 baseURL 参数
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // 错误处理增强
      if (data.error) {
        const errorMessage = selectedModel === "custom" 
          ? "自定义服务商配置错误" 
          : "API 密钥或模型 ID 不正确";
        
        toast.error(errorMessage);
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

        // 高亮逻辑
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
      console.error("Grammar check failed:", error);
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

    // 高亮所有错误，当前选中项特殊样式
    errors.forEach((err, i) => {
      marker.mark(err.context || err.text || "", {
        className: cn(
          "bg-yellow-200 dark:bg-yellow-900",
          i === index && "bg-green-200 dark:bg-green-900"
        ),
      });
    });

    // 滚动到选中错误
    const marks = preview.querySelectorAll("mark");
    const selectedMark = marks[index];
    if (selectedMark) {
      selectedMark.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  },
}));

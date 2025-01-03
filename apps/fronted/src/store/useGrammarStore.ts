import { create } from "zustand";
import { toast } from "sonner";
import Mark from "mark.js";
import { useAIConfigStore } from "@/store/useAIConfigStore";

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
    const { doubaoApiKey, doubaoModelId } = useAIConfigStore.getState();
    set({ isChecking: true });

    try {
      const response = await fetch("/api/grammar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: text,
          apiKey: doubaoApiKey,
          model: doubaoModelId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error?.code === "AuthenticationError") {
        toast.error("ApiKey 或 模型Id 不正确");
        throw new Error(data.error.message);
      }

      const aiResponse = data.choices[0]?.message?.content;

      try {
        const grammarErrors = JSON.parse(aiResponse);
        if (grammarErrors.errors.length === 0) {
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
    const state = get();
    const error = state.errors[index];
    if (!error) return;

    set({ selectedErrorIndex: index });

    const preview = document.getElementById("resume-preview");
    if (preview) {
      const marker = new Mark(preview);
      marker.unmark();

      state.errors.forEach((error) => {
        marker.mark(error.context || error.text || "", {
          className: `grammar-error ${error.type || ""}`,
          acrossElements: true,
          separateWordSearch: false,
          caseSensitive: true,
        });
      });

      const errorElements = preview.querySelectorAll(
        `.grammar-error[data-markjs=true]`
      );

      errorElements.forEach((el) => {
        el.classList.remove("active");
      });

      errorElements.forEach((el) => {
        if (el.textContent === (error.context || error.text)) {
          el.classList.add(`active-${state.highlightKey}`);

          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          setTimeout(() => {
            el.classList.remove(`active-${state.highlightKey}`);
          }, 2000);
        }
      });
    }
  },
}));

import { create } from "zustand";
import { toast } from "sonner";
import Mark from "mark.js";
import { useAIConfigStore } from "@/store/useAIConfigStore";

export interface GrammarError {
  text: string;
  message: string;
  type: "spelling" | "grammar";
  suggestions: string[];
}

interface GrammarState {
  errors: GrammarError[];
  isChecking: boolean;
  selectedErrorIndex: number | null;
  highlightKey: number;
  setErrors: (errors: GrammarError[]) => void;
  setIsChecking: (isChecking: boolean) => void;
  setSelectedErrorIndex: (index: number | null) => void;
  incrementHighlightKey: () => void;
}

export const useGrammarStore = create<GrammarState>((set) => ({
  errors: [],
  isChecking: false,
  selectedErrorIndex: null,
  highlightKey: 0,
  setErrors: (errors) => {
    const preview = document.getElementById("resume-preview");
    if (preview) {
      const marker = new Mark(preview);
      marker.unmark();
    }
    set({ errors });
  },
  setIsChecking: (isChecking) => set({ isChecking }),
  setSelectedErrorIndex: (selectedErrorIndex) => set({ selectedErrorIndex }),
  incrementHighlightKey: () =>
    set((state) => ({ highlightKey: state.highlightKey + 1 })),
}));

export const useGrammarCheck = () => {
  const {
    errors,
    isChecking,
    selectedErrorIndex,
    highlightKey,
    setErrors,
    setIsChecking,
    setSelectedErrorIndex,
  } = useGrammarStore();

  const { doubaoApiKey, doubaoModelId } = useAIConfigStore();

  const checkGrammar = async (text: string) => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/grammar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: doubaoApiKey,
          model: doubaoModelId,
          content: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error.code === "AuthenticationError") {
        toast.error("ApiKey 或 模型Id 不正确");
        throw new Error(data.error.message);
      }

      const aiResponse = data.choices[0]?.message?.content;

      try {
        const grammarErrors = JSON.parse(aiResponse).errors;
        toast.success("语法检查完成");
        setErrors(grammarErrors);

        const preview = document.getElementById("resume-preview");
        if (preview && grammarErrors.length > 0) {
          const marker = new Mark(preview);
          grammarErrors.forEach((error: GrammarError) => {
            marker.mark(error.text, {
              className: `grammar-error ${error.type}`,
              acrossElements: true,
              separateWordSearch: false,
              caseSensitive: true,
            });
          });
        }
      } catch (parseError) {
        toast.error(`解析AI响应失败: ${parseError}`);
        setErrors([]);
      }
    } catch (error) {
      setErrors([]);
    } finally {
      setIsChecking(false);
    }
  };

  const clearErrors = () => {
    const preview = document.getElementById("resume-preview");
    if (preview) {
      const marker = new Mark(preview);
      marker.unmark();
    }
    setErrors([]);
    setSelectedErrorIndex(null);
  };

  const selectError = (index: number) => {
    setSelectedErrorIndex(index);
    const error = errors[index];
    console.log(error, "error");
    if (!error) return;

    const preview = document.getElementById("resume-preview");
    if (preview) {
      if (preview && errors.length > 0) {
        const marker = new Mark(preview);
        errors.forEach((error: GrammarError) => {
          marker.mark(error.text, {
            className: `grammar-error ${error.type}`,
            acrossElements: true,
            separateWordSearch: false,
            caseSensitive: true,
          });
        });
      }

      const errorElements = preview.querySelectorAll(
        `.grammar-error[data-markjs=true]`
      );

      errorElements.forEach((el) => {
        el.classList.remove("active");
      });

      errorElements.forEach((el) => {
        if (el.textContent === error.text) {
          el.classList.add(`active-${highlightKey}`);

          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          setTimeout(() => {
            el.classList.remove(`active-${highlightKey}`);
          }, 2000);
        }
      });
    }
  };

  return {
    errors,
    isChecking,
    selectedErrorIndex,
    checkGrammar,
    clearErrors,
    selectError,
  };
};

import { create } from "zustand";
import Mark from "mark.js";

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

  const checkGrammar = async (text: string) => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/grammar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "",
          messages: [
            {
              role: "system",
              content: `你是一个专业的中文简历语法检查助手。请完整检查以下文本中的语法语境错别字，包括：
                1. 只考虑语法环境中的错别字
                2. 标点符号使用错误

                对每个发现的问题，请以JSON格式返回，格式如下：
                {
                  "errors": [
                    {
                      "text": "错误的文本",
                      "message": "详细的错误说明",
                      "type": "spelling"或"grammar",
                      "suggestions": ["建议修改1", "建议修改2"]
                    }
                  ]
                }

                请确保返回的是可解析的JSON格式。`,
            },
            {
              role: "user",
              content: text,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      try {
        const grammarErrors = JSON.parse(aiResponse).errors;
        console.log(grammarErrors, "grammarErrors");
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
        console.error("Failed to parse AI response:", parseError);
        setErrors([]);
      }
    } catch (error) {
      console.error("Grammar check error:", error);
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

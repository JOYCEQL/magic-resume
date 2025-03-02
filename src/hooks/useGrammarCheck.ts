// src/hooks/useGrammarCheck.ts
import { useGrammarStore } from "@/store/useGrammarStore";
import type { GrammarError } from "@/store/useGrammarStore"; // 从 store 导入类型

export const useGrammarCheck = () => {
  const {
    errors,
    isChecking,
    selectedErrorIndex,
    checkGrammar,
    clearErrors,
    selectError,
  } = useGrammarStore();

  return {
    errors,
    isChecking,
    selectedErrorIndex,
    checkGrammar,
    clearErrors,
    selectError,
  };
};

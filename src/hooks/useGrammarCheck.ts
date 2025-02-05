import { useGrammarStore } from "@/store/useGrammarStore";

export interface GrammarError {
  text: string;
  message: string;
  type: "spelling" | "grammar";
  suggestions: string[];
}

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

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ensureServerProxyDispatcher } from "./proxy";

export const getGeminiModelInstance = (params: {
  apiKey: string;
  model: string;
  systemInstruction?: string;
  generationConfig?: Record<string, unknown>;
}) => {
  ensureServerProxyDispatcher();
  const genAI = new GoogleGenerativeAI(params.apiKey);

  return genAI.getGenerativeModel({
    model: params.model,
    systemInstruction: params.systemInstruction,
    generationConfig: params.generationConfig,
  });
};

export const formatGeminiErrorMessage = (error: unknown) => {
  const anyError = error as any;
  const baseMessage =
    typeof anyError?.message === "string" && anyError.message
      ? anyError.message
      : "Gemini request failed";
  const details = anyError?.errorDetails;

  if (!details) return baseMessage;

  try {
    const detailText = Array.isArray(details)
      ? JSON.stringify(details)
      : String(details);
    return `${baseMessage} | details: ${detailText}`;
  } catch (stringifyError) {
    return baseMessage;
  }
};

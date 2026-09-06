import { AI_PROVIDERS, AI_PROVIDER_DEFINITIONS, isModelConfigured, type AIConnection, type AIProvider } from "./ai-models";

export { AI_PROVIDERS as PDF_IMPORT_PROVIDERS } from "./ai-models";
export type { AIProvider as PdfImportProvider, AIProtocol as PdfImportProtocol, AIConnection as PdfImportConnection } from "./ai-models";
export type PdfImportProfiles = Partial<Record<AIProvider, Partial<Omit<AIConnection, "provider">>>>;

export const PDF_IMPORT_PRESETS = Object.fromEntries(AI_PROVIDERS.map((provider) => {
  const preset = AI_PROVIDER_DEFINITIONS[provider];
  return [provider, { protocol: preset.protocol, model: preset.pdfModel, baseUrl: preset.baseUrl }];
})) as Record<AIProvider, Omit<AIConnection, "provider" | "apiKey">>;

export const MAX_PDF_IMPORT_PAGES = 10;
export const MAX_PDF_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_REQUEST_BYTES = 16 * 1024 * 1024;
export const PDF_IMPORT_TIMEOUT_MS = 120_000;
export const isPdfImportConfigured = isModelConfigured;

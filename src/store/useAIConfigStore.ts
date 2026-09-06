import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";
import {
  canModelParsePdf,
  getTaskModel,
  isModelConfigured,
  modelSupportsPdf,
  type AIModelProfile,
  type AISettingsData,
} from "@/config/ai-models";
import { migrateAISettings } from "./ai-config-migration";

interface AIConfigState extends AISettingsData {
  saveModel: (profile: AIModelProfile) => void;
  deleteModel: (id: string) => void;
  assignModel: (task: "text" | "pdf", id: string | null) => void;
  isConfigured: () => boolean;
}

export const createAIConfigStore = (storage?: PersistStorage<AISettingsData>) =>
  create<AIConfigState>()(
    persist<AIConfigState, [], [], AISettingsData>(
      (set, get) => ({
        models: [],
        textModelId: null,
        pdfModelId: null,
        saveModel: (profile) =>
          set((state) => {
            const normalized = {
              ...profile,
              name: profile.name.trim(),
              supportsPdf: modelSupportsPdf(profile.provider, profile.model),
            };
            const exists = state.models.some(
              (model) => model.id === profile.id,
            );
            return {
              models: exists
                ? state.models.map((model) =>
                    model.id === profile.id ? normalized : model,
                  )
                : [...state.models, normalized],
              pdfModelId:
                state.pdfModelId === profile.id && !canModelParsePdf(normalized)
                  ? null
                  : state.pdfModelId,
            };
          }),
        deleteModel: (id) =>
          set((state) => ({
            models: state.models.filter((model) => model.id !== id),
            textModelId: state.textModelId === id ? null : state.textModelId,
            pdfModelId: state.pdfModelId === id ? null : state.pdfModelId,
          })),
        assignModel: (task, id) =>
          set((state) => {
            const profile = state.models.find((model) => model.id === id);
            if (
              id !== null &&
              (!profile ||
                !isModelConfigured(profile) ||
                (task === "pdf" && !canModelParsePdf(profile)))
            )
              return state;
            return task === "pdf" ? { pdfModelId: id } : { textModelId: id };
          }),
        isConfigured: () => isModelConfigured(getTaskModel(get(), "text")),
      }),
      {
        name: "ai-config-storage",
        version: 1,
        storage:
          storage ?? createJSONStorage<AISettingsData>(() => localStorage),
        partialize: ({ models, textModelId, pdfModelId }) => ({
          models,
          textModelId,
          pdfModelId,
        }),
        migrate: migrateAISettings,
        merge: (persisted, current) => ({
          ...current,
          ...migrateAISettings(persisted),
        }),
      },
    ),
  );

export const useAIConfigStore = createAIConfigStore();

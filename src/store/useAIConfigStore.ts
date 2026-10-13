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
  profileAuthMethod,
  type AIModelProfile,
  type AISettingsData,
} from "@/config/ai-models";
import { migrateAISettings } from "./ai-config-migration";

interface AIConfigState extends AISettingsData {
  saveModel: (profile: AIModelProfile) => void;
  deleteModel: (id: string) => void;
  assignModel: (task: "text" | "pdf", id: string | null) => void;
  markNeedsReauth: (provider: AIModelProfile["provider"], generation: number) => void;
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
            const previous = state.models.find(
              (model) => model.id === profile.id,
            );
            const replacedCredential =
              !!previous && previous.apiKey.trim() !== profile.apiKey.trim();
            const normalized: AIModelProfile = {
              ...profile,
              name: profile.name.trim(),
              authMethod: profileAuthMethod(profile),
              supportsPdf: modelSupportsPdf(profile.provider, profile.model),
              generation: replacedCredential
                ? (previous?.generation ?? 0) + 1
                : (profile.generation ?? previous?.generation ?? 0),
              // A freshly stored credential is usable until it is rejected.
              needsReauth: replacedCredential
                ? false
                : (profile.needsReauth ?? previous?.needsReauth ?? false),
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
                profile.needsReauth ||
                (task === "pdf" && !canModelParsePdf(profile)))
            )
              return state;
            return task === "pdf" ? { pdfModelId: id } : { textModelId: id };
          }),
        /**
         * Terminal reauthentication. Only the exact account generation that
         * made the rejected request is marked, so a late failure can never
         * poison a credential the user just replaced.
         */
        markNeedsReauth: (provider, generation) =>
          set((state) => ({
            models: state.models.map((model) =>
              model.provider === provider &&
              (model.generation ?? 0) === generation
                ? { ...model, needsReauth: true }
                : model,
            ),
          })),
        isConfigured: () => {
          const task = getTaskModel(get(), "text");
          return !!task && !task.needsReauth && isModelConfigured(task);
        },
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

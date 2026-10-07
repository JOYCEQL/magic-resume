/**
 * Browser-side capability filter for the OrcaRouter model selector. The
 * server already filters a live catalog; this must still hold for the seed
 * and for any row that reached the client, and it never guesses a capability
 * from a model name.
 */

export interface OrcaOptionModel {
  id: string;
  name?: string;
  description?: string;
  contextLength?: number;
  supportsImages?: boolean;
}

/** A row is selectable for a text entry point only when it declares one. */
export function orcaChatOption(model: OrcaOptionModel): boolean {
  const id = model.id.trim();
  if (!id) return false;
  if (/(^|[/-])(embedding|rerank|whisper|tts)([/-]|$)/.test(id)) return false;
  return true;
}

/** A row may be offered to a multimodal entry point only when it declares image input. */
export function orcaImageOption(model: OrcaOptionModel): boolean {
  return orcaChatOption(model) && model.supportsImages === true;
}

export function filterOrcaOptions(
  models: OrcaOptionModel[],
  requiresImages: boolean,
): OrcaOptionModel[] {
  return models.filter((model) =>
    requiresImages ? orcaImageOption(model) : orcaChatOption(model),
  );
}

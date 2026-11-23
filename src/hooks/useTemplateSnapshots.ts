import { useMemo } from "react";
import { DEFAULT_TEMPLATES } from "@/config";
import { TEMPLATE_SNAPSHOT_MANIFEST } from "@/generated/templateSnapshotManifest";
import {
  getTemplateSnapshotSrc,
  isTemplatePreviewLocale,
} from "@/lib/templatePreview";

export const useTemplateSnapshots = (locale: string | null | undefined) => {
  const resolvedLocale = isTemplatePreviewLocale(locale) ? locale : "zh";

  const snapshotMap = useMemo(
    () =>
      Object.fromEntries(
        DEFAULT_TEMPLATES.map((template) => [
          template.id,
          getTemplateSnapshotSrc(
            TEMPLATE_SNAPSHOT_MANIFEST,
            resolvedLocale,
            template.id
          ),
        ])
      ) as Record<string, string | null>,
    [resolvedLocale]
  );

  return {
    resolvedLocale,
    snapshotMap,
  };
};

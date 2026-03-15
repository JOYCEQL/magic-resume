import { useEffect, useMemo } from "react";
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

  useEffect(() => {
    const preloaders = Object.values(snapshotMap)
      .filter((src): src is string => Boolean(src))
      .map((src) => {
        const image = new window.Image();
        image.decoding = "async";
        image.src = src;
        return image;
      });

    return () => {
      preloaders.forEach((image) => {
        image.src = "";
      });
    };
  }, [snapshotMap]);

  return {
    resolvedLocale,
    snapshotMap,
  };
};

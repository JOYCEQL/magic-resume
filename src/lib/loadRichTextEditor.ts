// Share the warm-up and route-loader request. A failed warm-up must not poison
// the next navigation attempt.
let pending: Promise<typeof import("@/components/shared/rich-editor/RichEditor")> | undefined;

export function loadRichTextEditor() {
  return pending ??= import("@/components/shared/rich-editor/RichEditor").catch(error => {
    pending = undefined;
    throw error;
  });
}

export function preloadRichTextEditor() {
  void loadRichTextEditor().catch(() => {
    // Navigation awaits the same dependency and presents a recoverable error.
  });
}

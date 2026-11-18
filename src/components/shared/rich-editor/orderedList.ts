import type { Editor } from "@tiptap/core";

// Continue only a preceding sibling list. Lists inside other items or sections
// must not affect this list's numbering.
export function getOrderedListNumbering(editor: Editor) {
  const { $from, $to } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const list = $from.node(depth);
    if (list.type.name !== "orderedList") continue;
    const pos = $from.before(depth);
    if ($to.depth < depth || $to.before(depth) !== pos) return null;
    const parent = $from.node(depth - 1);
    let nextStart: number | null = null;
    for (let index = $from.index(depth - 1) - 1; index >= 0; index--) {
      const previous = parent.child(index);
      if (previous.type.name === "orderedList") {
        nextStart = Number(previous.attrs.start ?? 1) + previous.childCount;
        break;
      }
    }
    return { pos, start: Number(list.attrs.start ?? 1), nextStart };
  }
  return null;
}

export function setOrderedListNumbering(editor: Editor, mode: "continue" | "restart") {
  const numbering = getOrderedListNumbering(editor);
  if (!numbering || (mode === "continue" && numbering.nextStart === null)) return false;
  const start = mode === "continue" ? numbering.nextStart : 1;
  return editor.chain().focus().command(({ tr }) => {
    const list = tr.doc.nodeAt(numbering.pos);
    if (!list || list.type.name !== "orderedList") return false;
    tr.setNodeMarkup(numbering.pos, undefined, { ...list.attrs, start });
    return true;
  }).run();
}

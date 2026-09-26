import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useTranslations } from "@/i18n/compat/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 24];

function readSelection(editor: Editor) {
  const { doc, selection } = editor.state;
  const sizes = new Set<string>();
    // 检查选区内的每个文本节点；光标 marks 无法识别混合字号。
  if (!selection.empty) {
    doc.nodesBetween(selection.from, selection.to, (node) => {
      if (node.isText) {
        const style = node.marks.find((mark) => mark.type.name === "textStyle");
        sizes.add(style?.attrs.fontSize || "default");
      }
    });
  }
  return {
    enabled: sizes.size > 0,
    value: sizes.size > 1 ? "mixed" : (sizes.values().next().value ?? "default"),
  };
}

export default function FontSizeSelect({ editor }: { editor: Editor }) {
  const t = useTranslations("richEditor");
  const [selection, setSelection] = useState(() => readSelection(editor));
  const savedState = useRef(editor.state);

  useEffect(() => {
    const sync = () => setSelection(readSelection(editor));
    sync();
    editor.on("transaction", sync);
    return () => {
      editor.off("transaction", sync);
    };
  }, [editor]);

  const applySize = (value: string) => {
    const saved = savedState.current;
    // 菜单打开期间若内容被替换，避免应用到过期选区。
    if (!editor.state.doc.eq(saved.doc) || saved.selection.empty) return;
    const chain = editor.chain().focus().setTextSelection({
      from: saved.selection.from,
      to: saved.selection.to,
    });
    if (value === "default") {
      chain.unsetFontSize().run();
    } else if (FONT_SIZES.some((size) => `${size}px` === value)) {
      chain.setFontSize(value).run();
    }
  };

  const label = selection.value === "mixed"
    ? t("fontSizeMixed")
    : selection.value === "default"
      ? t("fontSizeDefault")
      : selection.value;

  return (
    <span title={selection.enabled ? t("fontSize") : t("fontSizeSelectText")}>
      <Select
        value={selection.value}
        disabled={!selection.enabled}
        onOpenChange={(open) => {
          // 菜单会获取焦点，先保存编辑器选区供后续应用字号。
          if (open) savedState.current = editor.state;
        }}
        onValueChange={applySize}
      >
        <SelectTrigger className="h-8 w-24 text-xs" aria-label={t("fontSize")}>
          <span>{label}</span>
        </SelectTrigger>
        <SelectContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            editor.commands.focus();
          }}
        >
          <SelectItem value="default">{t("fontSizeReset")}</SelectItem>
          {FONT_SIZES.map((size) => (
            <SelectItem key={size} value={`${size}px`}>{size}px</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );
}

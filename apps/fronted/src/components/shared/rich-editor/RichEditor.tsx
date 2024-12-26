"use client";
import React, { useEffect } from "react";
import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  PaintBucket,
  Type,
  ChevronDown,
  Highlighter,
  Wand2,
} from "lucide-react";
import Highlight from "@tiptap/extension-highlight";
import { cn } from "@/lib/utils";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
interface RichTextEditorProps {
  content?: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onPolish?: () => void;
}

const COLORS = [
  { label: "黑色", value: "#000000" },
  { label: "深灰", value: "#333333" },
  { label: "灰色", value: "#666666" },
  { label: "红色", value: "#FF0000" },
  { label: "橙色", value: "#FF4D00" },
  { label: "橙黄", value: "#FF9900" },
  { label: "黄色", value: "#FFCC00" },
  { label: "黄绿", value: "#33CC00" },
  { label: "绿色", value: "#00CC00" },
  { label: "青色", value: "#00CCCC" },
  { label: "浅蓝", value: "#0066FF" },
  { label: "蓝色", value: "#0000FF" },
  { label: "紫色", value: "#6600FF" },
  { label: "紫红", value: "#CC00FF" },
  { label: "粉色", value: "#FF00FF" },
];

const BG_COLORS = COLORS;

interface MenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}

interface MenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  className = "",
  tooltip,
}: MenuButtonProps) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Button
        onMouseDown={(e) => e.preventDefault()}
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "h-9 w-9 rounded-md transition-all duration-200 hover:scale-105 p-0",
          isActive
            ? "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            : "hover:bg-primary/5 dark:hover:bg-neutral-800",
          disabled ? "opacity-50" : "",
          className
        )}
        onClick={handleClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </Button>
      {tooltip && showTooltip && (
        <div
          className={cn(
            "absolute -bottom-8 left-1/2 transform -translate-x-1/2",
            "px-2 py-1 text-xs rounded-md whitespace-nowrap z-50",
            "transition-opacity duration-200",
            "bg-secondary text-secondary-foreground dark:bg-neutral-800 dark:text-neutral-200"
          )}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
};

const TextColorButton = ({ editor }) => {
  const [activeColor, setActiveColor] = React.useState<string | null>(null);

  React.useEffect(() => {
    const color = editor?.getAttributes("textStyle").color;
    setActiveColor(color);
  }, [editor]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 rounded-md hover:scale-105 transition-all duration-200 hover:bg-primary/5 relative group"
        >
          <PaintBucket
            className="h-5 w-5"
            style={{
              color: activeColor || "currentColor",
              filter: activeColor
                ? "drop-shadow(0 1px 1px rgba(0,0,0,0.1))"
                : "none",
            }}
          />
          <span className="sr-only">文字颜色</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 rounded-lg">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <PaintBucket className="h-4 w-4" />
            <span className="text-sm font-medium">文字颜色</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            <button
              className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted"
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setActiveColor(null);
              }}
            >
              <span className="text-xl leading-none text-muted-foreground">
                /
              </span>
            </button>
            {COLORS.map((color) => (
              <button
                key={color.value}
                className={`h-8 w-8 rounded-md border hover:scale-110 transition-transform relative
                  ${activeColor === color.value ? "ring-2 ring-primary ring-offset-2" : ""}`}
                style={{
                  backgroundColor: color.value,
                  borderColor:
                    color.value === "#FFFFFF" ? "#E2E8F0" : color.value,
                }}
                onClick={() => {
                  editor.chain().focus().setColor(color.value).run();
                  setActiveColor(color.value);
                }}
                title={color.label}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const BackgroundColorButton = ({ editor }) => {
  const [activeBgColor, setActiveBgColor] = React.useState<string | null>(null);

  React.useEffect(() => {
    // highlight 属性可能直接返回颜色值
    const highlight =
      editor?.getAttributes("highlight").color ||
      editor?.getAttributes("highlight");
    setActiveBgColor(typeof highlight === "string" ? highlight : null);
  }, [editor]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 rounded-md hover:scale-105 transition-all duration-200 hover:bg-primary/5 relative group"
        >
          <div className="relative">
            <Highlighter
              className="h-5 w-5"
              style={{
                color: activeBgColor ? "currentColor" : "currentColor",
                filter: activeBgColor
                  ? "drop-shadow(0 1px 1px rgba(0,0,0,0.1))"
                  : "none",
              }}
            />
            {activeBgColor && (
              <div
                className="absolute -right-1 -bottom-1 w-2 h-2 rounded-full border border-white"
                style={{ backgroundColor: activeBgColor }}
              />
            )}
          </div>
          <span className="sr-only">背景颜色</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 rounded-lg">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Highlighter className="h-4 w-4" />
            <span className="text-sm font-medium">背景颜色</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            <button
              className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted"
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setActiveBgColor(null);
              }}
            >
              <span className="text-xl leading-none text-muted-foreground">
                /
              </span>
            </button>
            {BG_COLORS.map((color) => (
              <button
                key={color.value}
                className={`h-8 w-8 rounded-md border hover:scale-110 transition-transform relative
                  ${activeBgColor === color.value ? "ring-2 ring-primary ring-offset-2" : ""}`}
                style={{
                  backgroundColor: color.value,
                  borderColor: "transparent",
                }}
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .setHighlight({ color: color.value })
                    .run();
                  setActiveBgColor(color.value);
                }}
                title={color.label}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const HeadingSelect = ({ editor }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 px-2.5 rounded-md flex items-center gap-1.5 min-w-[100px]",
            "hover:bg-primary/5 dark:hover:bg-neutral-800"
          )}
        >
          <Type className="h-5 w-5" />
          <span className="text-sm">
            {editor.isActive("heading", { level: 1 })
              ? "标题 1"
              : editor.isActive("heading", { level: 2 })
                ? "标题 2"
                : editor.isActive("heading", { level: 3 })
                  ? "标题 3"
                  : "正文"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-40 p-1 rounded-lg", "bg-white dark:bg-neutral-900")}
      >
        <div className="flex flex-col gap-0.5">
          {[
            { label: "正文", value: "p" },
            { label: "标题 1", value: "1" },
            { label: "标题 2", value: "2" },
            { label: "标题 3", value: "3" },
          ].map((item) => (
            <Button
              key={item.value}
              variant="ghost"
              className={cn(
                "w-full justify-start px-2 py-1.5 text-sm rounded-md",
                editor.isActive(
                  item.value === "p" ? "paragraph" : "heading",
                  item.value === "p"
                    ? undefined
                    : { level: parseInt(item.value) }
                )
                  ? "bg-primary/10 text-primary dark:bg-neutral-800 dark:text-neutral-200"
                  : ""
              )}
              onClick={() => {
                if (item.value === "p") {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor
                    .chain()
                    .focus()
                    .toggleHeading({ level: parseInt(item.value) })
                    .run();
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const RichTextEditor = ({
  content = "",
  onChange,
  onPolish,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "custom-list",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "custom-list-ordered",
        },
      }),
      ListItem,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      TextStyle,
      Underline,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[150px] px-4 py-3",
          "dark:prose-invert",
          "dark:prose-headings:text-neutral-200",
          "dark:prose-p:text-neutral-300",
          "dark:prose-strong:text-neutral-200",
          "dark:prose-em:text-neutral-200",
          "dark:prose-blockquote:text-neutral-300",
          "dark:prose-blockquote:border-neutral-700",
          "dark:prose-ul:text-neutral-300",
          "dark:prose-ol:text-neutral-300"
        ),
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden border shadow-sm",
        "bg-card border-gray-100 dark:bg-neutral-900/30 dark:border-neutral-800"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "border-b px-2 py-1.5 flex flex-wrap items-center gap-3",
          "bg-background dark:bg-neutral-900/50 dark:border-neutral-800"
        )}
      >
        <div className="flex items-center">
          <HeadingSelect editor={editor} />
        </div>

        <div className={cn("h-5 w-px", "bg-border/60 dark:bg-neutral-800")} />

        <div className="flex items-center gap-0.5">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            tooltip="加粗"
          >
            <Bold className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            tooltip="斜体"
          >
            <Italic className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            tooltip="下划线"
          >
            <UnderlineIcon className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            tooltip="删除线"
          >
            <Strikethrough className="h-5 w-5" />
          </MenuButton>
          <TextColorButton editor={editor} tooltip="文字颜色" />
          <BackgroundColorButton editor={editor} />
        </div>

        <div className={cn("h-5 w-px", "bg-border/60 dark:bg-neutral-800")} />

        <div className="flex items-center gap-0.5">
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            tooltip="左对齐"
          >
            <AlignLeft className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            tooltip="居中对齐"
          >
            <AlignCenter className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            tooltip="右对齐"
          >
            <AlignRight className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            tooltip="两端对齐"
          >
            <AlignJustify className="h-5 w-5" />
          </MenuButton>
        </div>

        <div className={cn("h-5 w-px", "bg-border/60 dark:bg-neutral-800")} />

        <div className="flex items-center gap-0.5">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            tooltip="无序列表"
          >
            <List className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            tooltip="有序列表"
          >
            <ListOrdered className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            tooltip="引用"
          >
            <Quote className="h-5 w-5" />
          </MenuButton>
        </div>

        <div className={cn("h-5 w-px", "bg-border/60 dark:bg-neutral-800")} />

        <div className="flex items-center space-x-1">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="撤销"
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="重做"
          >
            <Redo className="h-4 w-4" />
          </MenuButton>
          {onPolish && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPolish}
              className="bg-gradient-to-r from-purple-400 to-pink-500 hover:from-pink-500 hover:to-purple-400 text-white border-none shadow-md transition-all duration-300"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI 润色
            </Button>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Bubble Menu */}
      {/* {editor && (
        <BubbleMenu
          className={cn(
            "flex items-center gap-0.5 p-1 rounded-md backdrop-blur border shadow-lg",
            theme === "dark"
              ? "bg-neutral-900/80 border-neutral-800"
              : "bg-background/80 border-gray-100"
          )}
          tippyOptions={{ duration: 100 }}
          editor={editor}
        >
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
          >
            <Bold className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
          >
            <Italic className="h-5 w-5" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
          >
            <UnderlineIcon className="h-5 w-5" />
          </MenuButton>
          <TextColorButton editor={editor} />
          <BackgroundColorButton editor={editor} />
        </BubbleMenu>
      )} */}
    </div>
  );
};

export default RichTextEditor;

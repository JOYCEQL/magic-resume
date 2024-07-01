import React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  CodeXml,
  CornerDownLeft,
  Eraser,
  FileCode2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  List,
  ListOrdered,
  MessageSquareQuote,
  Palette,
  Pilcrow,
  Redo,
  Strikethrough,
  Undo
} from "lucide-react";

import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

import ColorBar from "./ColorBar";
import CustomTooltip from "./CustomTooltip";

import "../styles/tiptap.scss";

const MenuBar = () => {
  const { editor } = useCurrentEditor();
  const setCurrentColor = (color: string) => () => {
    editor?.chain().focus().setColor(color).run();
  };
  if (!editor) {
    return null;
  }

  return (
    <div className="control-group">
      <div className="button-group">
        <CustomTooltip title="加粗">
          <Bold
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "is-active" : ""}
          ></Bold>
        </CustomTooltip>

        <CustomTooltip title="斜体">
          <Italic
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "is-active" : ""}
          ></Italic>
        </CustomTooltip>

        <CustomTooltip title="中划线">
          <Strikethrough
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "is-active" : ""}
          ></Strikethrough>
        </CustomTooltip>

        <CustomTooltip title="行内代码">
          <CodeXml
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive("code") ? "is-active" : ""}
          ></CodeXml>
        </CustomTooltip>

        <Heading1
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={
            editor.isActive("heading", { level: 1 }) ? "is-active" : ""
          }
        ></Heading1>

        <Heading2
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={
            editor.isActive("heading", { level: 2 }) ? "is-active" : ""
          }
        ></Heading2>
        <Heading3
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={
            editor.isActive("heading", { level: 3 }) ? "is-active" : ""
          }
        ></Heading3>
        <Heading4
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          className={
            editor.isActive("heading", { level: 4 }) ? "is-active" : ""
          }
        ></Heading4>

        <Heading5
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 5 }).run()
          }
          className={
            editor.isActive("heading", { level: 6 }) ? "is-active" : ""
          }
        ></Heading5>
        <Heading6
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 5 }).run()
          }
          className={
            editor.isActive("heading", { level: 6 }) ? "is-active" : ""
          }
        ></Heading6>

        <List
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "is-active" : ""}
        ></List>
        <ListOrdered
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "is-active" : ""}
        ></ListOrdered>
        <CustomTooltip title="代码块">
          <FileCode2
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? "is-active" : ""}
          ></FileCode2>
        </CustomTooltip>

        <MessageSquareQuote
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "is-active" : ""}
        ></MessageSquareQuote>

        <CornerDownLeft
          onClick={() => editor.chain().focus().setHardBreak().run()}
        ></CornerDownLeft>

        {/* <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          Undo
        </button> */}
        <Undo onClick={() => editor.chain().focus().undo().run()}></Undo>
        {/* <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          Redo
        </button> */}
        <Redo onClick={() => editor.chain().focus().undo().run()}></Redo>
        <CustomTooltip title="居左">
          <AlignLeft
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={
              editor.isActive({ textAlign: "left" }) ? "is-active" : ""
            }
          ></AlignLeft>
        </CustomTooltip>

        <CustomTooltip title="居中">
          <AlignCenter
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={
              editor.isActive({ textAlign: "center" }) ? "is-active" : ""
            }
          ></AlignCenter>
        </CustomTooltip>

        <CustomTooltip title="居右">
          <AlignRight
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={
              editor.isActive({ textAlign: "right" }) ? "is-active" : ""
            }
          ></AlignRight>
        </CustomTooltip>
        <Popover>
          <PopoverTrigger>
            <CustomTooltip title="文本颜色">
              <Palette></Palette>
            </CustomTooltip>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-[#21242a]">
            <ColorBar setCurrentColor={setCurrentColor}></ColorBar>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle,
  TextAlign.configure({
    types: ["heading", "paragraph"]
  }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    }
  })
];

const content = ``;

const Tiptap = () => {
  return (
    <EditorProvider
      slotBefore={<MenuBar />}
      extensions={extensions}
      content={content}
    ></EditorProvider>
  );
};

export default Tiptap;

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

import "../styles/tiptap.scss";
import ColorBar from "./ColorBar";

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
        {/* <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
        >
          Bold
        </button> */}
        <Bold
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
        ></Bold>
        {/* <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
        >
          Italic
        </button> */}
        <Italic
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
        ></Italic>
        {/* <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "is-active" : ""}
        >
          Strike
        </button> */}
        <Strikethrough
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "is-active" : ""}
        ></Strikethrough>
        {/* <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={editor.isActive("code") ? "is-active" : ""}
        >
          Code
        </button> */}
        <CodeXml
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive("code") ? "is-active" : ""}
        ></CodeXml>
        <Eraser
          onClick={() => editor.chain().focus().clearNodes().run()}
        ></Eraser>
        {/* 
        <Pilcrow
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive("paragraph") ? "is-active" : ""}
        ></Pilcrow> */}

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

        <FileCode2
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "is-active" : ""}
        ></FileCode2>

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
        <AlignLeft
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={editor.isActive({ textAlign: "left" }) ? "is-active" : ""}
        ></AlignLeft>
        <AlignCenter
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={
            editor.isActive({ textAlign: "center" }) ? "is-active" : ""
          }
        ></AlignCenter>
        <AlignRight
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={editor.isActive({ textAlign: "right" }) ? "is-active" : ""}
        ></AlignRight>
        <Popover>
          <PopoverTrigger>
            <Baseline></Baseline>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            {/* <div onClick={() => editor.chain().focus().setColor("blue").run()}>
              蓝色
            </div>
            <div onClick={() => editor.chain().focus().setColor("red").run()}>
              红色
            </div> */}
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

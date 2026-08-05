"use client";

import { cn } from "@ppn/ui-components";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const TOOLBAR_BUTTON = "rounded px-2 py-1 text-small font-medium hover:bg-neutral-100";

/** FR-CMS-04 — rich text editor for article content. */
export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[240px] px-4 py-3 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-field border border-neutral-300 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-neutral-200 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(TOOLBAR_BUTTON, editor.isActive("bold") && "bg-primary-50 text-primary-700")}
        >
          Tebal
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(TOOLBAR_BUTTON, editor.isActive("italic") && "bg-primary-50 text-primary-700")}
        >
          Miring
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(TOOLBAR_BUTTON, editor.isActive("heading", { level: 2 }) && "bg-primary-50 text-primary-700")}
        >
          Judul
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(TOOLBAR_BUTTON, editor.isActive("bulletList") && "bg-primary-50 text-primary-700")}
        >
          Daftar
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(TOOLBAR_BUTTON, editor.isActive("blockquote") && "bg-primary-50 text-primary-700")}
        >
          Kutipan
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

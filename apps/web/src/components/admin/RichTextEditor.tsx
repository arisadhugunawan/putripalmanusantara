"use client";

import { cn } from "@ppn/ui-components";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { useRef, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const TOOLBAR_BUTTON = "rounded px-2 py-1 text-small font-medium hover:bg-neutral-100 disabled:opacity-30";

/** FR-CMS-04 — rich text editor for article content.
 *
 * `StarterKit` (v3) already bundles Link, OrderedList and HorizontalRule internally — they
 * just had no toolbar buttons before. Only `Image` is a genuinely new extension here; it
 * uploads through the same `/admin/media` endpoint every other upload field uses, so inserted
 * images are ordinary `Media` rows, not a parallel asset store. */
export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, TiptapImage.configure({ HTMLAttributes: { class: "rounded-field" } })],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[240px] px-4 py-3 focus:outline-none",
      },
    },
  });

  async function handleImageFile() {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !editor) return;
    setUploadError(null);
    setUploading(true);
    try {
      const altText = file.name.replace(/\.[^./]+$/, "").replace(/[-_]+/g, " ").trim() || "Gambar";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", altText);
      const media = await adminApi.post<{ file_url: string; alt_text: string }>("/admin/media", formData);
      editor.chain().focus().setImage({ src: media.file_url, alt: media.alt_text }).run();
    } catch (err) {
      setUploadError(err instanceof ApiRequestError ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSetLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL tautan:", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

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
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(TOOLBAR_BUTTON, editor.isActive("heading", { level: 3 }) && "bg-primary-50 text-primary-700")}
        >
          Sub-judul
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
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(TOOLBAR_BUTTON, editor.isActive("orderedList") && "bg-primary-50 text-primary-700")}
        >
          Daftar Angka
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(TOOLBAR_BUTTON, editor.isActive("blockquote") && "bg-primary-50 text-primary-700")}
        >
          Kutipan
        </button>
        <button type="button" onClick={handleSetLink} className={cn(TOOLBAR_BUTTON, editor.isActive("link") && "bg-primary-50 text-primary-700")}>
          Tautan
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={TOOLBAR_BUTTON}>
          Pembatas
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={TOOLBAR_BUTTON}
        >
          {uploading ? "Mengunggah..." : "Gambar"}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={() => void handleImageFile()} className="hidden" />
      </div>
      {uploadError && <p className="border-b border-neutral-200 bg-red-50 px-3 py-1.5 text-small text-red-600">{uploadError}</p>}
      <EditorContent editor={editor} />
    </div>
  );
}

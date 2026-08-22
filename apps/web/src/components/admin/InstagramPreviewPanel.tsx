import type { Media } from "@ppn/shared-types";
import Image from "next/image";

/** Brief §28 — a stylized approximation of an Instagram post, for the Admin's own orientation
 * only. Deliberately labelled as a preview, never presented as the real Instagram UI. */
export function InstagramPreviewPanel({
  image,
  caption,
  username,
}: {
  image: Media | null;
  caption: string;
  username: string;
}) {
  const handle = username.trim() || "ppn.official";
  return (
    <div className="mx-auto w-full max-w-xs overflow-hidden rounded-field border border-neutral-300 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2">
        <div className="h-6 w-6 rounded-full bg-neutral-300" />
        <span className="text-small font-semibold text-neutral-900">{handle}</span>
      </div>
      <div className="relative aspect-square bg-neutral-100">
        {image ? (
          <Image src={image.file_url} alt={image.alt_text} fill sizes="320px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-small text-neutral-400">POST IMAGE</div>
        )}
      </div>
      <div className="px-3 py-2 text-neutral-700">
        <div className="flex gap-3 py-1 text-body">
          <span aria-hidden="true">♡</span>
          <span aria-hidden="true">💬</span>
          <span aria-hidden="true">↗</span>
        </div>
        <p className="text-small">
          <span className="font-semibold text-neutral-900">{handle}</span>{" "}
          <span className="whitespace-pre-line">{caption || "Instagram caption..."}</span>
        </p>
      </div>
      <p className="border-t border-neutral-200 px-3 py-1.5 text-center text-small text-neutral-400">
        Preview only — not the real Instagram UI
      </p>
    </div>
  );
}

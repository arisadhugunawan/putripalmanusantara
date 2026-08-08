"use client";

import type { HeroSlide } from "@ppn/shared-types";
import { buttonVariants, cn } from "@ppn/ui-components";
import { useState } from "react";
import { SafeImage } from "@/components/SafeImage";

type PreviewMode = "desktop" | "tablet" | "mobile";

const FRAME_CLASSES: Record<PreviewMode, string> = {
  desktop: "aspect-video w-full",
  tablet: "aspect-[3/4] w-full max-w-[420px]",
  mobile: "aspect-[9/19.5] w-full max-w-[260px]",
};

const ALIGNMENT_CLASSES: Record<HeroSlide["text_alignment"], string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

/** WYSIWYG-ish preview of a Hero Slide before it goes live — reads the same overlay
 * opacity/text alignment/button style/enabled fields the public HeroSlider.tsx renders, so
 * what the admin sees here is what visitors will see. Desktop/Tablet/Mobile are simulated
 * aspect-ratio frames, not a real viewport resize (this modal itself doesn't reflow). */
export function HeroSlidePreviewModal({ slide, onClose }: { slide: HeroSlide; onClose: () => void }) {
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const media = mode === "mobile" ? (slide.mobile_image ?? slide.desktop_image) : slide.desktop_image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-card bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <div className="flex gap-1 rounded-field bg-neutral-100 p-1">
            {(["desktop", "tablet", "mobile"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-field px-3 py-1.5 text-small font-medium capitalize transition-colors",
                  mode === m ? "bg-white text-primary-700 shadow-sm" : "text-neutral-600 hover:text-neutral-900",
                )}
              >
                {m === "desktop" ? "Desktop" : m === "tablet" ? "Tablet" : "Mobile"}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} className="text-small text-neutral-600 underline">
            Tutup
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-neutral-100 p-6">
          <div className={cn("relative overflow-hidden rounded-field bg-neutral-900", FRAME_CLASSES[mode])}>
            <SafeImage media={media} className="absolute inset-0" />
            <div className="absolute inset-0 bg-neutral-900" style={{ opacity: slide.overlay_opacity / 100 }} aria-hidden="true" />
            <div
              className={cn(
                "absolute inset-0 flex flex-col justify-end gap-2 p-4",
                ALIGNMENT_CLASSES[slide.text_alignment],
              )}
            >
              {slide.eyebrow_text && (
                <p className="text-[10px] font-medium uppercase tracking-wide text-primary-300">{slide.eyebrow_text}</p>
              )}
              <h2 className="text-h3 font-bold text-white">{slide.heading || "Judul slide"}</h2>
              {slide.subheading && <p className="text-small text-neutral-100/90">{slide.subheading}</p>}
              {slide.description && <p className="text-small text-neutral-100/75">{slide.description}</p>}
              <div className="mt-1 flex flex-wrap gap-2" style={{ justifyContent: mode === "desktop" ? undefined : "inherit" }}>
                {slide.button_1_enabled && slide.button_1_text && (
                  <span className={cn(buttonVariants(slide.button_1_style, "sm"), "pointer-events-none")}>
                    {slide.button_1_text}
                  </span>
                )}
                {slide.button_2_enabled && slide.button_2_text && (
                  <span
                    className={cn(
                      buttonVariants(slide.button_2_style, "sm"),
                      "pointer-events-none",
                      slide.button_2_style === "secondary" && "border-white/40 text-white",
                    )}
                  >
                    {slide.button_2_text}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {!slide.desktop_image && (
          <p className="border-t border-neutral-200 px-5 py-3 text-small text-amber-700">
            Belum ada gambar desktop — placeholder ditampilkan di beranda sampai gambar diunggah.
          </p>
        )}
      </div>
    </div>
  );
}

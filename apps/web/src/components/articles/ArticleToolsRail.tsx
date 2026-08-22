"use client";

import { cn } from "@ppn/ui-components";
import { useState } from "react";
import { Link } from "@/i18n/Link";

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Brand marks render as crisp solid glyphs (official logo shapes, fill not stroke) rather
 * than the hand-drawn line-art approximations used before — those looked soft/imprecise at
 * icon size, and the old "X" glyph was a plain crossing line indistinguishable from a close
 * button. Generic UI icons (link/check/print/arrow) stay stroke-based since they're pictograms,
 * not logotypes. */
function WhatsAppIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props} aria-hidden="true">
      <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-7.94 7.94 7.83 7.83 0 0 0 1.06 3.94L4 20l4.24-1.11a7.93 7.93 0 0 0 3.79.97 7.94 7.94 0 0 0 7.94-7.93 7.9 7.9 0 0 0-2.37-5.61Zm-5.55 12.2a6.59 6.59 0 0 1-3.36-.92l-.24-.14-2.5.66.67-2.44-.16-.25a6.58 6.58 0 0 1-1-3.51A6.61 6.61 0 0 1 12.05 5.3a6.55 6.55 0 0 1 4.67 1.94 6.56 6.56 0 0 1 1.94 4.67 6.61 6.61 0 0 1-6.61 6.61Zm3.6-4.95c-.2-.1-1.17-.58-1.35-.64s-.32-.1-.45.1-.51.64-.62.77-.23.15-.42.05a5.4 5.4 0 0 1-1.6-.99 6 6 0 0 1-1.1-1.37c-.12-.2 0-.31.09-.41s.2-.23.29-.35a1.3 1.3 0 0 0 .2-.33.37.37 0 0 0 0-.35c-.05-.1-.45-1.08-.62-1.48s-.33-.34-.45-.34-.25 0-.38 0a.72.72 0 0 0-.53.25 2.2 2.2 0 0 0-.69 1.64 3.84 3.84 0 0 0 .8 2 8.8 8.8 0 0 0 3.36 3 8.5 8.5 0 0 0 1.12.41 2.7 2.7 0 0 0 1.24.08 2 2 0 0 0 1.33-.94 1.65 1.65 0 0 0 .11-.94c-.05-.08-.18-.13-.38-.23Z" />
    </svg>
  );
}

function FacebookIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props} aria-hidden="true">
      <path d="M13.5 21v-7.6h2.55l.38-2.96h-2.93v-1.9c0-.86.24-1.44 1.47-1.44h1.57V4.46c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.16H8.1v2.96h2.86V21h2.54Z" />
    </svg>
  );
}

function LinkedInIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props} aria-hidden="true">
      <rect x="3.4" y="9" width="3.4" height="11" rx="0.4" />
      <circle cx="5.1" cy="4.9" r="2" />
      <path d="M9.7 9h3.26v1.83h.05c.45-.83 1.56-1.83 3.22-1.83 3.44 0 4.08 2.2 4.08 5.06V20h-3.4v-5.24c0-1.25-.02-2.86-1.77-2.86-1.77 0-2.04 1.35-2.04 2.76V20H9.7V9Z" />
    </svg>
  );
}

function XIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props} aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z" />
    </svg>
  );
}

function LinkIcon(props: { className?: string }) {
  return (
    <svg {...ICON_PROPS} {...props} aria-hidden="true">
      <path d="M9.5 14.5l5-5" />
      <path d="M10.8 8.3l1.4-1.4a3 3 0 0 1 4.3 4.3l-1.9 1.9" />
      <path d="M13.2 15.7l-1.4 1.4a3 3 0 0 1-4.3-4.3l1.9-1.9" />
    </svg>
  );
}

function CheckIcon(props: { className?: string }) {
  return (
    <svg {...ICON_PROPS} {...props} aria-hidden="true">
      <path d="M4 12.5l5 5L20 6" />
    </svg>
  );
}

function PrintIcon(props: { className?: string }) {
  return (
    <svg {...ICON_PROPS} {...props} aria-hidden="true">
      <path d="M6 9V4h12v5" />
      <rect x="4" y="9" width="16" height="8" rx="1.5" />
      <path d="M6 14h12v6H6z" />
    </svg>
  );
}

function ArrowLeftIcon(props: { className?: string }) {
  return (
    <svg {...ICON_PROPS} {...props} aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </svg>
  );
}

const TOOL_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all duration-200 hover:scale-110 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700";

/**
 * Share / Copy Link / Print — brief items 12/13/14. Minimalist icon buttons, not colorful
 * social pills. `orientation="vertical"` is the desktop sticky rail (brief item 12); the same
 * component renders `orientation="horizontal"` inline below the title on mobile (brief: "move
 * tools below title"), so the two surfaces can never drift out of sync on which channels are
 * offered.
 */
export function ArticleToolsRail({
  url,
  title,
  orientation = "horizontal",
  className,
}: {
  url: string;
  title: string;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — link remains visible/selectable in the address bar.
    }
  }

  const links = [
    { label: "Share on WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, Icon: WhatsAppIcon },
    { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, Icon: FacebookIcon },
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, Icon: LinkedInIcon },
    { label: "Share on X", href: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, Icon: XIcon },
  ];

  return (
    <div className={cn("flex gap-2.5", orientation === "vertical" ? "flex-col" : "flex-row flex-wrap items-center", className)}>
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={TOOL_BUTTON}
        >
          <Icon className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110" />
        </a>
      ))}
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
        className={TOOL_BUTTON}
      >
        {copied ? <CheckIcon className="h-4.5 w-4.5 text-primary-600" /> : <LinkIcon className="h-4.5 w-4.5" />}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        aria-label="Print article"
        title="Print article"
        className={cn(TOOL_BUTTON, "hidden sm:flex")}
      >
        <PrintIcon className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}

/** Brief item 32 — arrow moves left on hover. */
export function BackToInsightsLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 text-body font-medium text-primary-700">
      <ArrowLeftIcon className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
      {children}
    </Link>
  );
}

"use client";

import { ReactNode, RefObject, useEffect, useRef } from "react";
import { cn } from "./utils/cn";

const MAX_WIDTH_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
} as const;

export interface ModalProps {
  onClose: () => void;
  title?: ReactNode;
  /** Sits under the title, inside the header — for a one-line subtitle. Longer body content
   * belongs in `children`, not here. */
  description?: ReactNode;
  children?: ReactNode;
  /** Right-aligned action row under a divider — typically Cancel/Confirm buttons. */
  footer?: ReactNode;
  maxWidth?: keyof typeof MAX_WIDTH_CLASSES;
  /** Off for callers (like `ConfirmDialog`) that provide their own explicit Cancel action and
   * don't want a second, redundant way to dismiss. */
  hideCloseButton?: boolean;
  /** Element to focus when the modal opens — e.g. a Cancel button, so a destructive dialog
   * never lands initial focus on the dangerous action. Defaults to the close button, or the
   * dialog container itself if the close button is hidden. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * The one shared overlay/dialog shell — consolidates the ~10 independently hand-written
 * `fixed inset-0 z-50 ...` modal implementations found across the admin (only some of which had
 * `role="dialog"`/Escape handling/focus management). `ConfirmDialog` is built on top of this,
 * so every destructive-action confirmation gets the same mechanics as every other modal in the
 * app, not a slightly different one-off.
 */
export function Modal({
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  hideCloseButton = false,
  initialFocusRef,
  className,
}: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Moves focus into the dialog on open and hands it back to whatever opened it on close, so
  // keyboard users aren't dropped at the top of the page behind the overlay — same pattern
  // ConfirmDialog/AiChatWindow already use independently.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    (initialFocusRef?.current ?? closeButtonRef.current ?? dialogRef.current)?.focus();
    return () => previouslyFocused?.focus?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount/unmount only, matching ConfirmDialog's existing identical effect
  }, []);

  const titleId = title ? "modal-title" : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-card bg-white p-6 shadow-xl focus:outline-none",
          MAX_WIDTH_CLASSES[maxWidth],
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-4">
            <div>
              {title && (
                <h3 id={titleId} className="text-h3 text-neutral-900">
                  {title}
                </h3>
              )}
              {description && <p className="mt-1 text-body text-neutral-600">{description}</p>}
            </div>
            {!hideCloseButton && (
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-700"
              >
                ✕
              </button>
            )}
          </div>
        )}
        {children && <div className={cn(title || !hideCloseButton ? "mt-4" : undefined)}>{children}</div>}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-neutral-100 pt-4">{footer}</div>}
      </div>
    </div>
  );
}

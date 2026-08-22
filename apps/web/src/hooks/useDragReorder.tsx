"use client";

import { useState, type DragEvent, type HTMLAttributes } from "react";

/** Returns a new array with the item at `from` moved to `to`. */
export function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Native HTML5 drag-and-drop reordering — no drag library added to the bundle for what is a
 * handful of Admin lists.
 *
 * Dragging starts only from the handle (`getHandleProps`), not from anywhere on the row: rows
 * in these editors contain text inputs, and a permanently `draggable` container breaks
 * click-and-drag text selection inside them. The handle flips the row's `draggable` flag on
 * pointer-down and clears it when the drag ends.
 *
 * Pointer-only by nature, so every list that uses this keeps its Naik/Turun buttons as the
 * keyboard- and screen-reader-accessible path to the same reorder.
 *
 * `getRowProps` includes drag-state styling in its `className`, so callers must merge rather
 * than replace it: `<div {...rowProps} className={cn("…row classes…", rowProps.className)}>`.
 */
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [enabledIndex, setEnabledIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function reset() {
    setEnabledIndex(null);
    setDraggingIndex(null);
    setOverIndex(null);
  }

  function getRowProps(index: number): HTMLAttributes<HTMLElement> & { draggable: boolean } {
    const isDragging = draggingIndex === index;
    const isDropTarget = overIndex === index && draggingIndex !== null && draggingIndex !== index;
    return {
      draggable: enabledIndex === index,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        setDraggingIndex(index);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (draggingIndex === null) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOverIndex(index);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        const parsed = Number(event.dataTransfer.getData("text/plain"));
        const from = Number.isNaN(parsed) ? draggingIndex : parsed;
        reset();
        if (from !== null && from !== index) onReorder(from, index);
      },
      onDragEnd: reset,
      className: [
        isDragging ? "opacity-50" : "",
        isDropTarget ? "ring-2 ring-primary-600" : "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  }

  function getHandleProps(index: number) {
    return {
      onPointerDown: () => setEnabledIndex(index),
      onPointerUp: () => setEnabledIndex(null),
      onBlur: () => setEnabledIndex(null),
      "aria-hidden": true as const,
      title: "Seret untuk mengubah urutan",
      className: "cursor-grab select-none px-1 text-neutral-400 hover:text-neutral-600 active:cursor-grabbing",
    };
  }

  return { getRowProps, getHandleProps };
}

/** Six-dot grab affordance — pointer-only, so it is hidden from assistive tech (the
 * Naik/Turun buttons next to it are the accessible equivalent). */
export function DragHandle() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="3" r="1.4" />
      <circle cx="11" cy="3" r="1.4" />
      <circle cx="5" cy="8" r="1.4" />
      <circle cx="11" cy="8" r="1.4" />
      <circle cx="5" cy="13" r="1.4" />
      <circle cx="11" cy="13" r="1.4" />
    </svg>
  );
}

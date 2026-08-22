"use client";

import { Input, Label } from "@ppn/ui-components";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Plain `<input type="color">` swatch + hex text field, kept in sync both ways — no color
 * picker component exists anywhere else in this codebase yet, so this is deliberately minimal
 * (native browser color picker, not a custom palette/swatch UI) rather than a new dependency. */
export function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const swatchValue = HEX_PATTERN.test(value) ? value : "#FFFFFF";

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-field border border-neutral-300 bg-transparent p-1"
          aria-label={`${label} swatch`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#FFFFFF"
          maxLength={7}
          className="w-28 font-mono uppercase"
        />
      </div>
    </div>
  );
}

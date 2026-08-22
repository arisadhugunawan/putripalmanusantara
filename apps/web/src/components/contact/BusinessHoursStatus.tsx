"use client";

import type { ContactPageSettings } from "@ppn/shared-types";
import { useEffect, useState } from "react";

const WEEKDAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const UTC_DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** Collapses a set of weekday keys into human ranges, e.g. ["mon".."sat"] -> "Mon–Sat", or
 * ["mon","wed","fri"] -> "Mon, Wed, Fri" — never assumes the days on file are contiguous. */
function formatDayRanges(days: string[], weekdayShort: Record<string, string>): string {
  const set = new Set(days);
  const ranges: string[] = [];
  let i = 0;
  while (i < WEEKDAY_ORDER.length) {
    if (!set.has(WEEKDAY_ORDER[i])) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < WEEKDAY_ORDER.length && set.has(WEEKDAY_ORDER[j + 1])) j++;
    ranges.push(
      i === j
        ? weekdayShort[WEEKDAY_ORDER[i]]
        : `${weekdayShort[WEEKDAY_ORDER[i]]}–${weekdayShort[WEEKDAY_ORDER[j]]}`,
    );
    i = j + 1;
  }
  return ranges.join(", ");
}

/** Real current UTC time shifted by the fixed business-hours UTC offset (GMT+7 by default) —
 * deliberately not the visitor's own local clock/timezone, and no third-party time API. */
function computeIsOpen(settings: ContactPageSettings, now: Date): boolean {
  const shifted = new Date(now.getTime() + settings.business_hours_utc_offset * 3600 * 1000);
  const weekdayKey = UTC_DAY_KEYS[shifted.getUTCDay()];
  const minutesOfDay = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  const [openH, openM] = settings.business_hours_open_time.split(":").map(Number);
  const [closeH, closeM] = settings.business_hours_close_time.split(":").map(Number);
  const isOpenDay = settings.business_hours_open_days.includes(weekdayKey);
  return isOpenDay && minutesOfDay >= openH * 60 + openM && minutesOfDay < closeH * 60 + closeM;
}

export function BusinessHoursStatus({
  settings,
  labels,
  className,
  compact,
}: {
  settings: ContactPageSettings;
  labels: {
    weekdayShort: Record<string, string>;
    openNowLabel: string;
    closedNowLabel: string;
    closedLabel: string;
  };
  className?: string;
  /** Status dot + label only — used inside the WhatsApp Action Hub tile, where the full
   * day-range/closed-days text would crowd an already-busy tile. */
  compact?: boolean;
}) {
  // `open` starts `null` (not yet known) so the server-rendered markup and the first client
  // render match exactly — the real status is only ever computed after mount, from the
  // visitor's actual clock, never guessed at on the server.
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    function tick() {
      setOpen(computeIsOpen(settings, new Date()));
    }
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [settings]);

  const dayLabel = formatDayRanges(settings.business_hours_open_days, labels.weekdayShort);
  const closedDays = WEEKDAY_ORDER.filter((d) => !settings.business_hours_open_days.includes(d));

  if (compact) {
    return (
      <div className={className}>
        {open !== null && (
          <p className="flex items-center gap-1.5 text-small font-medium">
            <span
              className={`h-2 w-2 rounded-full ${open ? "bg-[#6FAF3A] animate-pulse" : "bg-neutral-400"}`}
              aria-hidden="true"
            />
            <span className={open ? "text-[#245C3A]" : "text-neutral-600"}>
              {open ? labels.openNowLabel : labels.closedNowLabel}
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="text-body text-neutral-900">
        {dayLabel}
        <span className="text-neutral-500">
          {" "}
          {settings.business_hours_open_time}–{settings.business_hours_close_time} (GMT
          {settings.business_hours_utc_offset >= 0 ? "+" : ""}
          {settings.business_hours_utc_offset})
        </span>
      </p>
      {closedDays.length > 0 && (
        <p className="mt-0.5 text-small text-neutral-500">
          {closedDays.map((d) => labels.weekdayShort[d]).join(", ")}: {labels.closedLabel}
        </p>
      )}
      {open !== null && (
        <p className="mt-2 flex items-center gap-1.5 text-small font-medium">
          <span
            className={`h-2 w-2 rounded-full ${open ? "bg-primary-500" : "bg-neutral-400"}`}
            aria-hidden="true"
          />
          <span className={open ? "text-primary-700" : "text-neutral-600"}>
            {open ? labels.openNowLabel : labels.closedNowLabel}
          </span>
        </p>
      )}
    </div>
  );
}

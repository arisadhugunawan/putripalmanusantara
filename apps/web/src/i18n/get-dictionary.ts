import "server-only";
import type { Locale } from "@ppn/shared-types";
import type { Dictionary } from "./dictionary.d";

const loaders: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  en: () => import("./dictionaries/en"),
  id: () => import("./dictionaries/id"),
  zh: () => import("./dictionaries/zh"),
  th: () => import("./dictionaries/th"),
  hi: () => import("./dictionaries/hi"),
  vi: () => import("./dictionaries/vi"),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const load = loaders[locale] ?? loaders.en;
  const mod = await load();
  return mod.default;
}

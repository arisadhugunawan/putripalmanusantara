import type { Media } from "./media";

export interface ProductionStep {
  id: string;
  title: string;
  description: string;
  illustration: Media | null;
  order: number;
}

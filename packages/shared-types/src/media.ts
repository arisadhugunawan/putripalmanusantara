export type MediaFileType = "image" | "video" | "pdf";

export interface Media {
  id: string;
  file_url: string;
  file_type: MediaFileType;
  alt_text: string;
  width: number | null;
  height: number | null;
  /** Present only where the mapper populates it (currently the Media Library's own mapper) —
   * optional rather than required so every module's existing local Media-relation mapper
   * (Article/Product/Homepage/... cover-image mappers, none of which need this field) doesn't
   * need touching. Null/absent for rows uploaded before this column existed (Post-Launch
   * Phase 3); the Media Library shows "—" rather than backfilling by re-fetching every file. */
  size_bytes?: number | null;
  uploaded_at: string;
  /** Present (non-null) once "Move to Trash" has been used — absent/null for active media. */
  deleted_at?: string | null;
}

/** GET /admin/media/:id/usage — computed on demand (media detail/delete dialog only), never
 * for every card in a list. */
export interface MediaUsageLiveReference {
  module: string;
  label: string;
}

export interface MediaUsageSnapshotReference {
  module: string;
  /** e.g. "Copra" — the content item's own name, not the snapshot's internal id. */
  content_label: string;
  version: number;
  published_at: string;
}

export interface MediaUsage {
  live: MediaUsageLiveReference[];
  version_history: MediaUsageSnapshotReference[];
}

import type { Media as SharedMedia } from '@ppn/shared-types';
import type { MediaModel as Media } from '../../generated/prisma/models';

/**
 * Maps a raw Prisma `Media` row (camelCase JS fields, e.g. `fileUrl`) to the shared snake_case
 * `Media` shape every consumer actually types against. `POST /admin/media` previously returned
 * the raw Prisma record directly — every caller that only reads `.id` off it never noticed, but
 * any caller reading `.file_url` (or `.file_type`/`.alt_text`/`.uploaded_at`) got `undefined`.
 */
export function toMedia(media: Media): SharedMedia {
  return {
    id: media.id,
    file_url: media.fileUrl,
    file_type: media.fileType,
    alt_text: media.altText,
    width: media.width,
    height: media.height,
    size_bytes: media.sizeBytes,
    uploaded_at: media.uploadedAt.toISOString(),
    deleted_at: media.deletedAt ? media.deletedAt.toISOString() : null,
  };
}

import type {
  LegalCertificateDocument as SharedLegalDocument,
  Media as SharedMedia,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  LegalCertificateDocumentModel as LegalDocument,
  LegalDocumentCategoryModel as LegalCategory,
  MediaModel as Media,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';
import { toLegalDocumentCategory } from './legal-category.mapper';

type LegalDocumentWithRelations = LegalDocument & {
  file: Media | null;
  previewImage: Media | null;
  category?: LegalCategory | null;
};

function toMedia(media: Media): SharedMedia {
  return {
    id: media.id,
    file_url: media.fileUrl,
    file_type: media.fileType,
    alt_text: media.altText,
    width: media.width,
    height: media.height,
    uploaded_at: media.uploadedAt.toISOString(),
  };
}

export function toLegalDocument(
  entry: LegalDocumentWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedLegalDocument {
  const t = translate(entry, entry.translations, locale, [
    'title',
    'description',
  ]);
  return {
    id: entry.id,
    title: t.title,
    document_type: entry.documentType,
    category: entry.category
      ? toLegalDocumentCategory(entry.category, locale)
      : null,
    document_number: entry.documentNumber,
    issuing_organization: entry.issuingOrganization,
    country: entry.country,
    verified: entry.verified,
    issue_date: entry.issueDate ? entry.issueDate.toISOString() : null,
    expiry_date: entry.expiryDate ? entry.expiryDate.toISOString() : null,
    description: t.description ?? null,
    file: entry.file ? toMedia(entry.file) : null,
    preview_image: entry.previewImage ? toMedia(entry.previewImage) : null,
    order: entry.order,
    active: entry.active,
    featured: entry.featured,
    translations: entry.translations as SharedLegalDocument['translations'],
  };
}

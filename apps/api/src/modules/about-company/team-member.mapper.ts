import type {
  Media as SharedMedia,
  TeamMember as SharedTeamMember,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  MediaModel as Media,
  TeamMemberModel as TeamMember,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type TeamMemberWithRelations = TeamMember & { photo: Media | null };

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

export function toTeamMember(
  entry: TeamMemberWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedTeamMember {
  const t = translate(entry, entry.translations, locale, [
    'name',
    'position',
    'biography',
    'responsibilities',
  ]);
  return {
    id: entry.id,
    name: t.name,
    position: t.position,
    biography: t.biography,
    responsibilities: t.responsibilities,
    department: entry.department,
    photo: entry.photo ? toMedia(entry.photo) : null,
    linkedin_url: entry.linkedinUrl,
    email: entry.email,
    phone: entry.phone,
    order: entry.order,
    active: entry.active,
    featured: entry.featured,
    translations: entry.translations as SharedTeamMember['translations'],
  };
}

import type { AboutCompanySectionConfig as SharedSectionConfig } from '@ppn/shared-types';
import type { AboutCompanySectionConfigModel as SectionConfig } from '../../../generated/prisma/models';

/**
 * `hasUnpublishedChanges` is draft-state metadata the Admin overview needs, not page content —
 * it's computed live in the service and defaults to `false` when this mapper is replaying rows
 * out of a frozen published snapshot, where "unpublished" has no meaning.
 */
export function toAboutCompanySectionConfig(
  entry: SectionConfig,
  hasUnpublishedChanges = false,
): SharedSectionConfig {
  return {
    id: entry.id,
    key: entry.key as SharedSectionConfig['key'],
    order: entry.order,
    visible: entry.visible,
    updated_at: entry.updatedAt.toISOString(),
    has_unpublished_changes: hasUnpublishedChanges,
  };
}

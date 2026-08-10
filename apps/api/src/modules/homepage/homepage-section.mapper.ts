import type { HomepageSectionConfig as SharedSectionConfig } from '@ppn/shared-types';
import type { HomepageSectionConfigModel as SectionConfig } from '../../../generated/prisma/models';

export function toHomepageSectionConfig(
  entry: SectionConfig,
): SharedSectionConfig {
  return {
    id: entry.id,
    key: entry.key as SharedSectionConfig['key'],
    order: entry.order,
    visible: entry.visible,
    updated_at: entry.updatedAt.toISOString(),
  };
}

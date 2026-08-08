import type {
  ExportDestination as SharedExportDestination,
  ExportDestinationProduct,
} from '@ppn/shared-types';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import type {
  ExportDestinationModel as ExportDestination,
  ProductModel as Product,
} from '../../../generated/prisma/models';
import { translate } from '../../common/utils/i18n.util';

type ExportDestinationWithRelations = ExportDestination & {
  products: Pick<Product, 'id' | 'slug' | 'name'>[];
};

export function toExportDestination(
  entry: ExportDestinationWithRelations,
  locale: string = DEFAULT_LOCALE,
): SharedExportDestination {
  const t = translate(entry, entry.translations, locale, [
    'countryName',
    'description',
  ]);
  const products: ExportDestinationProduct[] = entry.products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
  }));
  return {
    id: entry.id,
    country_code: entry.countryCode,
    country_code_alpha3: entry.countryCodeAlpha3,
    country_name: t.countryName,
    export_status: entry.exportStatus,
    description: t.description,
    export_volume: entry.exportVolume,
    export_frequency: entry.exportFrequency,
    destination_port: entry.destinationPort,
    products,
    order: entry.order,
    enabled: entry.enabled,
    featured: entry.featured,
    updated_at: entry.updatedAt.toISOString(),
    translations: entry.translations as SharedExportDestination['translations'],
  };
}

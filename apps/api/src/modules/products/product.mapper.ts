import type {
  Media as SharedMedia,
  ProductDetail,
  ProductDownload as SharedProductDownload,
  ProductGalleryItem as SharedProductGalleryItem,
  ProductPackagingApplication as SharedPackagingApplication,
  ProductSpecification as SharedProductSpecification,
  ProductSummary,
} from '@ppn/shared-types';
import type {
  MediaModel as Media,
  ProductModel as Product,
  ProductDownloadModel as ProductDownload,
  ProductGalleryImageModel as ProductGalleryImage,
  ProductShapeModel,
  ProductPackagingApplicationModel as ProductPackagingApplication,
  ProductSpecificationModel as ProductSpecification,
} from '../../../generated/prisma/models';
import { DEFAULT_LOCALE } from '@ppn/shared-types';
import { translate } from '../../common/utils/i18n.util';

type ProductWithRelations = Product & {
  coverImage: Media | null;
  gallery?: (ProductGalleryImage & { media: Media })[];
  shapes?: (ProductShapeModel & { media: Media | null })[];
  specifications?: ProductSpecification[];
  packagingAndApps?: (ProductPackagingApplication & { media: Media | null })[];
  downloads?: ProductDownload[];
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

export function toProductSummary(
  product: ProductWithRelations,
  locale: string = DEFAULT_LOCALE,
): ProductSummary {
  const t = translate(product, product.translations, locale, [
    'name',
    'category',
    'shortDescription',
  ]);
  return {
    id: product.id,
    slug: product.slug,
    name: t.name,
    title_accent: product.titleAccent,
    category: t.category,
    short_description: t.shortDescription,
    cover_image: product.coverImage ? toMedia(product.coverImage) : null,
    is_featured: product.isFeatured,
  };
}

export function toProductDetail(
  product: ProductWithRelations,
  locale: string = DEFAULT_LOCALE,
): ProductDetail {
  const t = translate(product, product.translations, locale, [
    'fullDescription',
    'metaTitle',
    'metaDescription',
  ]);

  const specifications: SharedProductSpecification[] = (
    product.specifications ?? []
  )
    .sort((a, b) => a.order - b.order)
    .map((spec) => {
      const specT = translate(spec, spec.translations, locale, [
        'specKey',
        'specValue',
      ]);
      return {
        id: spec.id,
        spec_key: specT.specKey,
        spec_value: specT.specValue,
        order: spec.order,
        group: spec.group,
        variant_label: spec.variantLabel,
      };
    });

  const gallery: SharedProductGalleryItem[] = (product.gallery ?? [])
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      id: item.id,
      media: toMedia(item.media),
      section: item.section,
      caption: item.caption,
      order: item.order,
    }));

  const mapPackagingApp = (
    item: ProductPackagingApplication & { media: Media | null },
  ): SharedPackagingApplication => {
    const itemT = translate(item, item.translations, locale, [
      'title',
      'description',
    ]);
    return {
      id: item.id,
      type: item.type,
      title: itemT.title,
      description: itemT.description,
      media: item.media ? toMedia(item.media) : null,
      order: item.order,
    };
  };

  const packaging: SharedPackagingApplication[] = (
    product.packagingAndApps ?? []
  )
    .filter((item) => item.type === 'packaging')
    .map(mapPackagingApp);

  const applications: SharedPackagingApplication[] = (
    product.packagingAndApps ?? []
  )
    .filter((item) => item.type === 'application')
    .map(mapPackagingApp);

  const downloads: SharedProductDownload[] = (product.downloads ?? []).map(
    (download) => ({
      id: download.id,
      file_name: download.fileName,
      file_url: download.fileUrl,
      uploaded_at: download.uploadedAt.toISOString(),
    }),
  );

  return {
    ...toProductSummary(product, locale),
    full_description: t.fullDescription,
    meta_title: t.metaTitle,
    meta_description: t.metaDescription,
    status: product.status,
    order: product.order,
    gallery,
    shapes: (product.shapes ?? [])
      .sort((a, b) => a.order - b.order)
      .map((shape) => {
        const shapeT = translate(shape, shape.translations, locale, [
          'name',
          'sizes',
        ]);
        return {
          id: shape.id,
          name: shapeT.name,
          media: shape.media ? toMedia(shape.media) : null,
          sizes: shapeT.sizes,
          order: shape.order,
        };
      }),
    specifications,
    packaging,
    applications,
    downloads,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString(),
    // Raw blob, not locale-resolved — lets the admin CMS populate LocaleTabs for editing.
    translations: product.translations as ProductDetail['translations'],
  };
}

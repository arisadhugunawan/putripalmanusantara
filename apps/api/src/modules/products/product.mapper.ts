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
  ProductPackagingApplicationModel as ProductPackagingApplication,
  ProductSpecificationModel as ProductSpecification,
} from '../../../generated/prisma/models';

type ProductWithRelations = Product & {
  coverImage: Media | null;
  gallery?: (ProductGalleryImage & { media: Media })[];
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
): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    short_description: product.shortDescription,
    cover_image: product.coverImage ? toMedia(product.coverImage) : null,
    is_featured: product.isFeatured,
  };
}

export function toProductDetail(product: ProductWithRelations): ProductDetail {
  const specifications: SharedProductSpecification[] = (
    product.specifications ?? []
  )
    .sort((a, b) => a.order - b.order)
    .map((spec) => ({
      id: spec.id,
      spec_key: spec.specKey,
      spec_value: spec.specValue,
      order: spec.order,
    }));

  const gallery: SharedProductGalleryItem[] = (product.gallery ?? [])
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      id: item.id,
      media: toMedia(item.media),
      order: item.order,
    }));

  const packaging: SharedPackagingApplication[] = (
    product.packagingAndApps ?? []
  )
    .filter((item) => item.type === 'packaging')
    .map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      media: item.media ? toMedia(item.media) : null,
    }));

  const applications: SharedPackagingApplication[] = (
    product.packagingAndApps ?? []
  )
    .filter((item) => item.type === 'application')
    .map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      media: item.media ? toMedia(item.media) : null,
    }));

  const downloads: SharedProductDownload[] = (product.downloads ?? []).map(
    (download) => ({
      id: download.id,
      file_name: download.fileName,
      file_url: download.fileUrl,
      uploaded_at: download.uploadedAt.toISOString(),
    }),
  );

  return {
    ...toProductSummary(product),
    full_description: product.fullDescription,
    meta_title: product.metaTitle,
    meta_description: product.metaDescription,
    status: product.status,
    order: product.order,
    gallery,
    specifications,
    packaging,
    applications,
    downloads,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString(),
  };
}

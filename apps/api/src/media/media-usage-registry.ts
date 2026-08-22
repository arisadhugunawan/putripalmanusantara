import type { PrismaService } from '../prisma/prisma.service';

export interface LiveUsageReference {
  module: string;
  label: string;
}

/**
 * Every place a live (non-snapshot) row can point at a `Media` row — used only by
 * `MediaService.getUsage()` for the "Used By" panel, on demand (media detail/delete dialog),
 * never for every card in a list. This mirrors the ~30 relations declared on the `Media`
 * model in schema.prisma; each entry is a small, direct Prisma query rather than a generic
 * introspection mechanism, since Prisma has no runtime "find every table referencing this
 * row" API — hand-listing the real, finite relation set is the simplest correct approach.
 * The permanent-delete GUARD does not depend on this list being complete — Postgres's own
 * FK constraint (via `MediaService.permanentDelete()`'s existing `P2003` catch) already
 * blocks deletion of anything with a live reference, including any relation accidentally
 * left out here. This registry only affects what's *displayed*, not what's *safe*.
 */
export async function findLiveUsage(
  prisma: PrismaService,
  mediaId: string,
): Promise<LiveUsageReference[]> {
  const results: LiveUsageReference[] = [];
  const push = (module: string, rows: { label: string }[]) => {
    for (const row of rows) results.push({ module, label: row.label });
  };

  const [
    productCovers,
    productShapes,
    productGallery,
    productPackaging,
    articleCovers,
    articleOg,
    articleGallery,
    galleryItems,
    facilityCovers,
    facilityGallery,
    productionSteps,
    supplyNetworkItems,
    heroSlidesDesktop,
    heroSlidesMobile,
    partnerLogos,
    shippingPartners,
    aboutPreviewVideo,
    aboutPreviewThumb,
    brandingHeader,
    brandingFooter,
    brandingMobile,
    brandingFavicon,
    brandingProductHeaderBg,
    contactHero,
    aboutCompanyMain,
    aboutCompanyStory,
    aboutCompanyGallery,
    teamPhotos,
    whatWeDoItems,
    legalDocFiles,
    legalDocPreviews,
    factoryGallery,
    factoryDocuments,
    aboutCompanyOg,
    pageHeaderBg,
    pageHeaderMobileBg,
    footerBg,
    footerMobileBg,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { coverImageId: mediaId },
      select: { name: true },
    }),
    prisma.productShape.findMany({
      where: { mediaId },
      select: { name: true, product: { select: { name: true } } },
    }),
    prisma.productGalleryImage.findMany({
      where: { mediaId },
      select: { product: { select: { name: true } } },
    }),
    prisma.productPackagingApplication.findMany({
      where: { mediaId },
      select: { title: true, product: { select: { name: true } } },
    }),
    prisma.article.findMany({
      where: { coverImageId: mediaId },
      select: { title: true },
    }),
    prisma.article.findMany({
      where: { ogImageId: mediaId },
      select: { title: true },
    }),
    prisma.articleGalleryImage.findMany({
      where: { mediaId },
      select: { article: { select: { title: true } } },
    }),
    prisma.galleryItem.findMany({
      where: { mediaId },
      select: { title: true },
    }),
    prisma.facility.findMany({
      where: { coverImageId: mediaId },
      select: { name: true },
    }),
    prisma.facilityGalleryImage.findMany({
      where: { mediaId },
      select: { facility: { select: { name: true } } },
    }),
    prisma.productionStep.findMany({
      where: { illustrationId: mediaId },
      select: { title: true },
    }),
    prisma.supplyNetworkItem.findMany({
      where: { illustrationId: mediaId },
      select: { title: true },
    }),
    prisma.heroSlide.findMany({
      where: { desktopImageId: mediaId },
      select: { id: true },
    }),
    prisma.heroSlide.findMany({
      where: { mobileImageId: mediaId },
      select: { id: true },
    }),
    prisma.partnerLogo.findMany({
      where: { logoId: mediaId },
      select: { partnerName: true },
    }),
    prisma.shippingPartner.findMany({
      where: { logoId: mediaId },
      select: { partnerName: true },
    }),
    prisma.homepageAboutPreview.findMany({
      where: { videoMediaId: mediaId },
      select: { id: true },
    }),
    prisma.homepageAboutPreview.findMany({
      where: { videoThumbnailId: mediaId },
      select: { id: true },
    }),
    prisma.siteBranding.findMany({
      where: { headerLogoId: mediaId },
      select: { id: true },
    }),
    prisma.siteBranding.findMany({
      where: { footerLogoId: mediaId },
      select: { id: true },
    }),
    prisma.siteBranding.findMany({
      where: { mobileLogoId: mediaId },
      select: { id: true },
    }),
    prisma.siteBranding.findMany({
      where: { faviconId: mediaId },
      select: { id: true },
    }),
    prisma.siteBranding.findMany({
      where: { productHeaderBackgroundId: mediaId },
      select: { id: true },
    }),
    prisma.contactPageSettings.findMany({
      where: { heroImageId: mediaId },
      select: { id: true },
    }),
    prisma.aboutCompanyProfile.findMany({
      where: { mainImageId: mediaId },
      select: { id: true },
    }),
    prisma.aboutCompanyProfile.findMany({
      where: { storyImageId: mediaId },
      select: { id: true },
    }),
    prisma.aboutCompanyGalleryImage.findMany({
      where: { mediaId },
      select: { caption: true },
    }),
    prisma.teamMember.findMany({
      where: { photoId: mediaId },
      select: { name: true },
    }),
    prisma.whatWeDoItem.findMany({
      where: { mediaId },
      select: { title: true },
    }),
    prisma.legalCertificateDocument.findMany({
      where: { fileId: mediaId },
      select: { title: true },
    }),
    prisma.legalCertificateDocument.findMany({
      where: { previewImageId: mediaId },
      select: { title: true },
    }),
    prisma.factoryGalleryImage.findMany({
      where: { mediaId },
      select: { caption: true },
    }),
    prisma.factoryDocument.findMany({
      where: { fileId: mediaId },
      select: { title: true },
    }),
    prisma.aboutCompanySettings.findMany({
      where: { ogImageId: mediaId },
      select: { id: true },
    }),
    prisma.pageHeader.findMany({
      where: { backgroundImageId: mediaId },
      select: { pageKey: true },
    }),
    prisma.pageHeader.findMany({
      where: { mobileBackgroundImageId: mediaId },
      select: { pageKey: true },
    }),
    prisma.footerSettings.findMany({
      where: { backgroundImageId: mediaId },
      select: { id: true },
    }),
    prisma.footerSettings.findMany({
      where: { mobileBackgroundImageId: mediaId },
      select: { id: true },
    }),
  ]);

  push(
    'Products',
    productCovers.map((p) => ({ label: `${p.name} — Cover` })),
  );
  push(
    'Products',
    productShapes.map((s) => ({
      label: `${s.product.name} — Shape: ${s.name}`,
    })),
  );
  push(
    'Products',
    productGallery.map((g) => ({ label: `${g.product.name} — Gallery` })),
  );
  push(
    'Products',
    productPackaging.map((p) => ({ label: `${p.product.name} — ${p.title}` })),
  );
  push(
    'News',
    articleCovers.map((a) => ({ label: `${a.title} — Cover` })),
  );
  push(
    'News',
    articleOg.map((a) => ({ label: `${a.title} — Social Share Image` })),
  );
  push(
    'News',
    articleGallery.map((g) => ({ label: `${g.article.title} — Gallery` })),
  );
  push(
    'Gallery',
    galleryItems.map((g) => ({ label: g.title || 'Gallery Item' })),
  );
  push(
    'Facilities',
    facilityCovers.map((f) => ({ label: `${f.name} — Cover` })),
  );
  push(
    'Facilities',
    facilityGallery.map((g) => ({ label: `${g.facility.name} — Gallery` })),
  );
  push(
    'Homepage',
    productionSteps.map((s) => ({
      label: `Supply & Export Process — ${s.title}`,
    })),
  );
  push(
    'Homepage',
    supplyNetworkItems.map((s) => ({ label: `Supply Network — ${s.title}` })),
  );
  push(
    'Homepage',
    [...heroSlidesDesktop, ...heroSlidesMobile].map(() => ({
      label: 'Hero Slide',
    })),
  );
  push(
    'Homepage',
    partnerLogos.map((p) => ({
      label: `Shipping Partner Logo — ${p.partnerName}`,
    })),
  );
  push(
    'Homepage',
    shippingPartners.map((p) => ({
      label: `Shipping Partner — ${p.partnerName}`,
    })),
  );
  push(
    'Homepage',
    [...aboutPreviewVideo, ...aboutPreviewThumb].map(() => ({
      label: 'About Preview Video',
    })),
  );
  push(
    'Settings — Branding',
    [
      ...brandingHeader,
      ...brandingFooter,
      ...brandingMobile,
      ...brandingFavicon,
      ...brandingProductHeaderBg,
    ].map(() => ({ label: 'Site Branding' })),
  );
  push(
    'Contact',
    contactHero.map(() => ({ label: 'Contact Page — Hero Image' })),
  );
  push(
    'About Company',
    [...aboutCompanyMain, ...aboutCompanyStory].map(() => ({
      label: 'Company Profile Image',
    })),
  );
  push(
    'About Company',
    aboutCompanyGallery.map((g) => ({ label: g.caption || 'Company Gallery' })),
  );
  push(
    'About Company',
    teamPhotos.map((t) => ({ label: `Team — ${t.name}` })),
  );
  push(
    'About Company',
    whatWeDoItems.map((w) => ({ label: `What We Supply — ${w.title}` })),
  );
  push(
    'About Company',
    [...legalDocFiles, ...legalDocPreviews].map((d) => ({
      label: `Legal & Certificates — ${d.title}`,
    })),
  );
  push(
    'About Company',
    factoryGallery.map((g) => ({ label: g.caption || 'Factory Gallery' })),
  );
  push(
    'About Company',
    factoryDocuments.map((d) => ({ label: `Factory Document — ${d.title}` })),
  );
  push(
    'About Company',
    aboutCompanyOg.map(() => ({ label: 'About Company — Social Share Image' })),
  );
  push(
    'Settings — Inner Page Header',
    [...pageHeaderBg, ...pageHeaderMobileBg].map((p) => ({
      label: `Page: ${p.pageKey}`,
    })),
  );
  push(
    'Settings — Footer',
    [...footerBg, ...footerMobileBg].map(() => ({
      label: 'Footer Background',
    })),
  );

  return results;
}

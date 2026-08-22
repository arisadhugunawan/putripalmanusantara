/**
 * Centralized upload policy (Post-Launch Phase 3) — replaces the ~10 differently-named
 * `MAX_*_BYTES` constants that were previously hardcoded per admin editor (found duplicated
 * across HeroSlideEditor/FacilitiesEditor/TeamEditor/FactoryEditor/LegalCertificateEditor/
 * WhatWeDoEditor/CompanyProfileEditor/ProfileBlockEditors/brand-logo page, all at the same
 * handful of real values: 1MB/2MB/5MB/10MB). Every context below preserves whichever of those
 * real values it already used — this is a consolidation of existing intentional choices, not
 * a redesign of them.
 *
 * `maxWidth`/`maxHeight` are the upload-time dimension cap applied server-side
 * (`MediaService.upload()`) — a generous ceiling to stop an oversized original from being
 * stored and repeatedly re-fetched by Next.js Image Optimization, not a strict per-context
 * requirement. `recommendedWidth`/`recommendedHeight`/`recommendedAspectRatio` are shown to
 * the admin as guidance only and are never enforced by rejecting an upload.
 */
export interface MediaPolicyEntry {
  maxBytes: number;
  recommendedWidth: number;
  recommendedHeight: number;
  recommendedAspectRatio: string;
  maxWidth: number;
  maxHeight: number;
  acceptedFormats: string[];
}

const MB = 1024 * 1024;

export const MEDIA_POLICY_CONTEXTS = [
  'hero',
  'innerPageHeader',
  'product',
  'facility',
  'gallery',
  'news',
  'team',
  'certificate',
  'logo',
  'partnerLogo',
  'footer',
  'favicon',
  'document',
  'general',
] as const;

export type MediaPolicyContext = (typeof MEDIA_POLICY_CONTEXTS)[number];

export const MEDIA_POLICY: Record<MediaPolicyContext, MediaPolicyEntry> = {
  hero: {
    maxBytes: 5 * MB,
    recommendedWidth: 2560,
    recommendedHeight: 1440,
    recommendedAspectRatio: '16:9',
    maxWidth: 2560,
    maxHeight: 1440,
    acceptedFormats: ['JPG', 'PNG', 'WebP'],
  },
  innerPageHeader: {
    maxBytes: 5 * MB,
    recommendedWidth: 2560,
    recommendedHeight: 1440,
    recommendedAspectRatio: '16:9',
    maxWidth: 2560,
    maxHeight: 1440,
    acceptedFormats: ['JPG', 'PNG', 'WebP'],
  },
  product: {
    maxBytes: 5 * MB,
    recommendedWidth: 2000,
    recommendedHeight: 2000,
    recommendedAspectRatio: '1:1',
    maxWidth: 2560,
    maxHeight: 2560,
    acceptedFormats: ['JPG', 'PNG', 'WebP'],
  },
  facility: {
    maxBytes: 5 * MB,
    recommendedWidth: 2000,
    recommendedHeight: 2000,
    recommendedAspectRatio: '1:1',
    maxWidth: 2560,
    maxHeight: 2560,
    acceptedFormats: ['JPG', 'PNG', 'WebP'],
  },
  gallery: {
    maxBytes: 5 * MB,
    recommendedWidth: 2000,
    recommendedHeight: 2000,
    recommendedAspectRatio: '1:1',
    maxWidth: 2560,
    maxHeight: 2560,
    acceptedFormats: ['JPG', 'PNG', 'WebP'],
  },
  news: {
    maxBytes: 5 * MB,
    recommendedWidth: 1600,
    recommendedHeight: 1000,
    recommendedAspectRatio: '16:10',
    maxWidth: 2560,
    maxHeight: 2560,
    acceptedFormats: ['JPG', 'PNG', 'WebP'],
  },
  team: {
    maxBytes: 5 * MB,
    recommendedWidth: 800,
    recommendedHeight: 1000,
    recommendedAspectRatio: '4:5',
    maxWidth: 1600,
    maxHeight: 2000,
    acceptedFormats: ['JPG', 'PNG', 'WebP'],
  },
  // The one deliberate high-resolution exception — certificate scans need to stay crisp in
  // the fullscreen document viewer, so this context's cap is intentionally much higher than
  // every other image context (matches the Phase 3 audit's explicit call-out).
  certificate: {
    maxBytes: 10 * MB,
    recommendedWidth: 2480,
    recommendedHeight: 3508,
    recommendedAspectRatio: 'A4 (300dpi)',
    maxWidth: 2480,
    maxHeight: 3508,
    acceptedFormats: ['PDF', 'JPG', 'PNG', 'WebP'],
  },
  logo: {
    maxBytes: 2 * MB,
    recommendedWidth: 800,
    recommendedHeight: 300,
    recommendedAspectRatio: '~3:1',
    maxWidth: 1600,
    maxHeight: 600,
    acceptedFormats: ['SVG', 'PNG'],
  },
  partnerLogo: {
    maxBytes: 2 * MB,
    recommendedWidth: 800,
    recommendedHeight: 800,
    recommendedAspectRatio: '1:1',
    maxWidth: 1200,
    maxHeight: 1200,
    acceptedFormats: ['SVG', 'PNG'],
  },
  footer: {
    maxBytes: 5 * MB,
    recommendedWidth: 1920,
    recommendedHeight: 480,
    recommendedAspectRatio: '4:1',
    maxWidth: 2560,
    maxHeight: 2560,
    acceptedFormats: ['JPG', 'PNG', 'WebP'],
  },
  favicon: {
    maxBytes: 1 * MB,
    recommendedWidth: 512,
    recommendedHeight: 512,
    recommendedAspectRatio: '1:1',
    maxWidth: 512,
    maxHeight: 512,
    acceptedFormats: ['PNG', 'SVG', 'ICO'],
  },
  // Non-image documents (factory brochures, legal/certificate source files) — no image
  // dimension cap applies; formats accepted is really just "PDF" in practice today.
  document: {
    maxBytes: 10 * MB,
    recommendedWidth: 0,
    recommendedHeight: 0,
    recommendedAspectRatio: '—',
    maxWidth: 0,
    maxHeight: 0,
    acceptedFormats: ['PDF'],
  },
  // Fallback for any upload context not explicitly listed above.
  general: {
    maxBytes: 5 * MB,
    recommendedWidth: 1600,
    recommendedHeight: 1200,
    recommendedAspectRatio: '4:3',
    maxWidth: 2560,
    maxHeight: 2560,
    acceptedFormats: ['JPG', 'PNG', 'WebP'],
  },
};

export function getMediaPolicy(context?: string | null): MediaPolicyEntry {
  if (context && (MEDIA_POLICY_CONTEXTS as readonly string[]).includes(context)) {
    return MEDIA_POLICY[context as MediaPolicyContext];
  }
  return MEDIA_POLICY.general;
}

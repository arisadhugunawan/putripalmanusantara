import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ABOUT_COMPANY_SECTION_KEYS,
  DEFAULT_LOCALE,
  LEGAL_DOCUMENT_TYPE_LABELS,
} from '@ppn/shared-types';
import type {
  AboutCompanySearchItem,
  PublishedAboutCompanyPayload,
} from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import {
  CONTENT_PUBLISHED_EVENT,
  type ContentPublishedEvent,
} from '../../common/events/content-published.event';
import { MediaService } from '../../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { toExportDestination } from '../homepage/export-destination.mapper';
import { toAboutCompanyFact } from './about-company-fact.mapper';
import { toAboutCompanySectionConfig } from './about-company-section.mapper';
import { toAboutCompanySettings } from './about-company-settings.mapper';
import { toAboutCompanyProfile } from './about-company-profile.mapper';
import { toAboutCompanySocialLink } from './about-company-social-link.mapper';
import { toFactoryProfile } from './factory.mapper';
import { toFacility } from './facility.mapper';
import { toAboutCompanyFacilitiesSection } from './facilities-section.mapper';
import { toAboutCompanyMoqPaymentSection } from './moq-payment-section.mapper';
import { toMoqPaymentQuickCard } from './moq-payment-quick-card.mapper';
import { toMoqPaymentBusinessTerm } from './moq-payment-business-term.mapper';
import { toAboutCompanyShipmentTermsSection } from './shipment-terms-section.mapper';
import { toShippingArrangementItem } from './shipping-arrangement-item.mapper';
import { toShipmentLoadingLocation } from './shipment-loading-location.mapper';
import { toShipmentContainerType } from './shipment-container-type.mapper';
import { toShipmentScheduleStep } from './shipment-schedule-step.mapper';
import { toShipmentDocument } from './shipment-document.mapper';
import { toShipmentCommitmentItem } from './shipment-commitment-item.mapper';
import { toAboutCompanyFacilitiesFaqSection } from './facilities-faq-section.mapper';
import { toFacilitiesFaqItem } from './facilities-faq-item.mapper';
import { toFacilitiesFaqProductTag } from './facilities-faq-product-tag.mapper';
import { toLegalDocumentCategory } from './legal-category.mapper';
import { toLegalDocument } from './legal-document.mapper';
import { toAboutCompanyLegalSection } from './legal-section.mapper';
import { toTeamMember } from './team-member.mapper';
import { toAboutCompanyTeamSection } from './team-section.mapper';
import { toWhatWeDoItem } from './what-we-do.mapper';
import { toAboutCompanyWhatWeDoSection } from './what-we-supply-section.mapper';
import { toWhoWeSupplyItem } from './who-we-supply.mapper';
import type {
  AddAboutCompanyGalleryItemDto,
  CreateAboutCompanyFactDto,
  UpdateAboutCompanyFactDto,
  UpdateAboutCompanyGalleryItemDto,
  UpdateAboutCompanyProfileDto,
} from './dto/profile.dto';
import type {
  CreateAboutCompanySocialLinkDto,
  UpdateAboutCompanySocialLinkDto,
} from './dto/social-link.dto';
import type { UpdateAboutCompanySectionDto } from './dto/about-company-section.dto';
import type { UpdateAboutCompanySettingsDto } from './dto/settings.dto';
import type {
  AddFactoryGalleryItemDto,
  CreateFactoryDocumentDto,
  CreateFactoryVideoDto,
  UpdateFactoryDocumentDto,
  UpdateFactoryGalleryItemDto,
  UpdateFactoryProfileDto,
  UpdateFactoryVideoDto,
} from './dto/factory.dto';
import type {
  AddFacilityGalleryItemDto,
  UpdateFacilityDto,
  UpdateFacilityGalleryItemDto,
} from './dto/facility.dto';
import type { UpdateAboutCompanyFacilitiesSectionDto } from './dto/facilities-section.dto';
import type {
  CreateMoqPaymentBusinessTermDto,
  CreateMoqPaymentQuickCardDto,
  UpdateAboutCompanyMoqPaymentSectionDto,
  UpdateMoqPaymentBusinessTermDto,
  UpdateMoqPaymentQuickCardDto,
} from './dto/moq-payment.dto';
import type {
  CreateShipmentCommitmentItemDto,
  CreateShipmentContainerTypeDto,
  CreateShipmentDocumentDto,
  CreateShipmentLoadingLocationDto,
  CreateShipmentScheduleStepDto,
  CreateShippingArrangementItemDto,
  UpdateAboutCompanyShipmentTermsSectionDto,
  UpdateShipmentCommitmentItemDto,
  UpdateShipmentContainerTypeDto,
  UpdateShipmentDocumentDto,
  UpdateShipmentLoadingLocationDto,
  UpdateShipmentScheduleStepDto,
  UpdateShippingArrangementItemDto,
} from './dto/shipment-terms.dto';
import type {
  CreateFacilitiesFaqItemDto,
  CreateFacilitiesFaqProductTagDto,
  UpdateAboutCompanyFacilitiesFaqSectionDto,
  UpdateFacilitiesFaqItemDto,
  UpdateFacilitiesFaqProductTagDto,
} from './dto/facilities-faq.dto';
import type {
  CreateLegalDocumentCategoryDto,
  CreateLegalDocumentDto,
  UpdateAboutCompanyLegalSectionDto,
  UpdateLegalDocumentCategoryDto,
  UpdateLegalDocumentDto,
} from './dto/legal-document.dto';
import type {
  CreateTeamMemberDto,
  UpdateAboutCompanyTeamSectionDto,
  UpdateTeamMemberDto,
} from './dto/team-member.dto';
import type {
  CreateWhatWeDoItemDto,
  UpdateWhatWeDoItemDto,
} from './dto/what-we-do.dto';
import type { UpdateAboutCompanyWhatWeDoSectionDto } from './dto/what-we-supply-section.dto';
import type {
  CreateWhoWeSupplyItemDto,
  UpdateWhoWeSupplyItemDto,
} from './dto/who-we-supply.dto';

const PROFILE_INCLUDE = {
  mainImage: true,
  storyImage: true,
  gallery: { include: { media: true }, orderBy: { order: 'asc' as const } },
};
const TEAM_MEMBER_INCLUDE = { photo: true };
const WHAT_WE_DO_INCLUDE = {
  media: true,
  product: {
    select: { id: true, slug: true, name: true, coverImage: true },
  },
};
/** Same shape the Homepage's Global Export Reach uses — one export-country list site-wide. */
const EXPORT_DESTINATION_INCLUDE = {
  products: { select: { id: true, slug: true, name: true } },
};
const LEGAL_DOCUMENT_INCLUDE = {
  file: true,
  previewImage: true,
  category: true,
};
const FACTORY_INCLUDE = {
  gallery: { include: { media: true }, orderBy: { order: 'asc' as const } },
  documents: { include: { file: true }, orderBy: { order: 'asc' as const } },
  videos: { orderBy: { order: 'asc' as const } },
};
const FACILITY_INCLUDE = {
  coverImage: true,
  gallery: { include: { media: true }, orderBy: { order: 'asc' as const } },
};
const SETTINGS_INCLUDE = { ogImage: true };

/** Section display names for search results. Kept here rather than imported from the web app's
 * `section-registry.ts` — the API must not depend on Next.js code — and asserted complete
 * against `ABOUT_COMPANY_SECTION_KEYS` by the `Record` type. */
const SECTION_SEARCH_META: Record<
  (typeof ABOUT_COMPANY_SECTION_KEYS)[number],
  { label: string; description: string }
> = {
  company: {
    label: 'CV. Putri Palma Nusantara',
    description: 'Company profile and introduction',
  },
  team: {
    label: 'PPN Team',
    description: 'Team and organizational information',
  },
  what_we_do: {
    label: 'What We Supply',
    description: 'Product cards, audience segments, and Buyer/Supplier CTAs',
  },
  legal_certificate: {
    label: 'Legal & Certificate',
    description: 'Legal documents and certifications',
  },
  factory: {
    label: 'Factory',
    description: 'Factory, warehouse, facilities and gallery',
  },
  facilities: {
    label: 'Facilities',
    description: 'Facility navigation and photo gallery',
  },
  moq_payment_terms: {
    label: 'MOQ & Payment Terms',
    description: 'Ordering terms, quick overview cards, and business terms',
  },
  shipment_terms: {
    label: 'Shipment Terms',
    description:
      'Shipping arrangement, loading locations, container types, schedule, documentation, and commitment',
  },
  facilities_faq: {
    label: 'FAQ',
    description: 'Facilities FAQ questions, product tags, and CTA',
  },
};

const LEGAL_DOCUMENT_TYPE_SEARCH_LABELS: Record<string, string> =
  LEGAL_DOCUMENT_TYPE_LABELS;

/** The "no snapshot exists yet" payload — see `getPublishedAboutCompany`. */
const EMPTY_PUBLISHED_ABOUT_COMPANY: PublishedAboutCompanyPayload = {
  profile: {
    id: '',
    headline: '',
    short_description: '',
    main_description: '',
    vision: '',
    mission: '',
    company_overview: '',
    main_image: null,
    gallery: [],
    eyebrow: '',
    subheading: '',
    cta_label: null,
    cta_href: null,
    youtube_video_url: null,
    social_label: '',
    social_visible: false,
    story_label: '',
    story_heading: '',
    story_description: '',
    story_secondary_description: '',
    story_image: null,
    story_visible: false,
    scope_label: '',
    scope_heading: '',
    scope_description: '',
    scope_visible: false,
    facts_label: '',
    facts_heading: '',
    facts_visible: false,
    export_label: '',
    export_heading: '',
    export_description: '',
    export_visible: false,
    legal_label: '',
    legal_heading: '',
    business_type: '',
    registered_address: '',
    business_id_number: '',
    established_year: '',
    legal_visible: false,
    closing_label: '',
    closing_heading: '',
    closing_description: '',
    closing_cta_label: null,
    closing_cta_href: null,
    closing_visible: false,
  },
  facts: [],
  export_destinations: [],
  social_links: [],
  company_profile_countries: [],
  team_members: [],
  team_section: {
    id: '',
    eyebrow: '',
    heading: '',
    description: '',
    cta_label: null,
    cta_href: null,
    show_counter: false,
  },
  what_we_do_section: {
    id: '',
    eyebrow: '',
    heading: '',
    description: '',
    who_heading: '',
    who_description: '',
    buyer_cta_heading: '',
    buyer_cta_description: '',
    buyer_cta_button_text: '',
    supplier_cta_heading: '',
    supplier_cta_description: '',
    supplier_cta_button_text: '',
  },
  what_we_do_items: [],
  who_we_supply_items: [],
  legal_documents: [],
  legal_section: {
    id: '',
    eyebrow: '',
    heading: '',
    description: '',
    hide_expired: false,
  },
  legal_categories: [],
  factory: {
    id: '',
    eyebrow: '',
    name: '',
    short_description: '',
    detailed_description: '',
    location: null,
    operational_info: null,
    capacity: null,
    additional_notes: null,
    gallery: [],
    documents: [],
    videos: [],
  },
  facilities: [],
  facilities_section: {
    id: '',
    eyebrow: '',
    heading: '',
    description: '',
    auto_rotate: true,
    rotate_interval_seconds: 6,
  },
  moq_payment_section: {
    id: '',
    eyebrow: '',
    heading: '',
    introduction: '',
    supply_capacity_title: '',
    supply_capacity_description: '',
    commitment_title: '',
    commitment_description: '',
    cta_title: '',
    cta_description: '',
    cta_button_label: '',
    cta_button_href: '/contact#request-quotation',
  },
  moq_payment_quick_cards: [],
  moq_payment_business_terms: [],
  shipment_terms_section: {
    id: '',
    eyebrow: '',
    heading: '',
    introduction: '',
    commitment_title: '',
    commitment_description: '',
    cta_label: '',
    cta_href: '/contact#request-quotation',
    cta_open_new_tab: false,
  },
  shipping_arrangement_items: [],
  shipment_loading_locations: [],
  shipment_container_types: [],
  shipment_schedule_steps: [],
  shipment_documents: [],
  shipment_commitment_items: [],
  facilities_faq_section: {
    id: '',
    eyebrow: '',
    heading: '',
    description: '',
    accordion_mode: 'single',
    cta_title: '',
    cta_description: '',
    cta_primary_label: '',
    cta_primary_href: '/contact',
    cta_secondary_label: '',
    cta_secondary_href: '',
  },
  facilities_faq_items: [],
  settings: {
    id: '',
    page_title: '',
    page_subtitle: '',
    seo_title: null,
    seo_description: null,
    og_image: null,
    visible: false,
  },
  section_config: [],
};

type SnapshotPayload = Awaited<
  ReturnType<AboutCompanyService['buildSnapshotPayload']>
>;

/**
 * Backfills keys that a snapshot published by an *older* build of this service could not have
 * contained (the company-profile storytelling blocks, Company Facts, export destinations).
 *
 * A published snapshot is a frozen JSON document: once the payload shape grows, every snapshot
 * already in the table is missing the new keys, and reading one would otherwise throw and take
 * the whole public About page down with a 500. Defaults here mean an old snapshot keeps
 * rendering exactly what it used to — with the new blocks simply switched off — until the next
 * Publish writes a full payload.
 */
function withSnapshotDefaults(raw: SnapshotPayload): SnapshotPayload {
  const profile = raw.profile ?? ({} as SnapshotPayload['profile']);
  const teamSection = raw.teamSection ?? ({} as SnapshotPayload['teamSection']);
  return {
    ...raw,
    facts: raw.facts ?? [],
    exportDestinations: raw.exportDestinations ?? [],
    socialLinks: raw.socialLinks ?? [],
    companyProfileCountries: raw.companyProfileCountries ?? [],
    // Nested rows need the same treatment as the top-level keys: a snapshot frozen before
    // these columns existed has team members without them, and the public section calls
    // `.trim()` on the text fields. Defaulting here keeps an old snapshot renderable.
    teamMembers: (raw.teamMembers ?? []).map((member) => ({
      ...member,
      biography: member.biography ?? '',
      responsibilities: member.responsibilities ?? '',
      department: member.department ?? null,
      linkedinUrl: member.linkedinUrl ?? null,
      email: member.email ?? null,
      phone: member.phone ?? null,
    })),
    teamSection: {
      ...teamSection,
      eyebrow: teamSection.eyebrow ?? '',
      heading: teamSection.heading ?? 'PPN Team',
      description: teamSection.description ?? '',
      ctaLabel: teamSection.ctaLabel ?? null,
      ctaHref: teamSection.ctaHref ?? null,
      showCounter: teamSection.showCounter ?? false,
    },
    whatWeDoSection: {
      ...(raw.whatWeDoSection ?? ({} as SnapshotPayload['whatWeDoSection'])),
      eyebrow: raw.whatWeDoSection?.eyebrow ?? 'What We Supply',
      heading:
        raw.whatWeDoSection?.heading ?? 'Coconut Products for Global Markets',
      description: raw.whatWeDoSection?.description ?? '',
      whoHeading:
        raw.whatWeDoSection?.whoHeading ??
        'Serving Buyers Across the Coconut Value Chain',
      whoDescription: raw.whatWeDoSection?.whoDescription ?? '',
      buyerCtaHeading: raw.whatWeDoSection?.buyerCtaHeading ?? '',
      buyerCtaDescription: raw.whatWeDoSection?.buyerCtaDescription ?? '',
      buyerCtaButtonText: raw.whatWeDoSection?.buyerCtaButtonText ?? '',
      supplierCtaHeading: raw.whatWeDoSection?.supplierCtaHeading ?? '',
      supplierCtaDescription: raw.whatWeDoSection?.supplierCtaDescription ?? '',
      supplierCtaButtonText: raw.whatWeDoSection?.supplierCtaButtonText ?? '',
    },
    // Snapshot rows frozen before `key_points` existed have items missing the field —
    // `WhatWeDoSection.tsx` maps over it directly, so a missing array would throw.
    whatWeDoItems: (raw.whatWeDoItems ?? []).map((item) => ({
      ...item,
      keyPoints: item.keyPoints ?? [],
    })),
    whoWeSupplyItems: raw.whoWeSupplyItems ?? [],
    legalDocuments: (raw.legalDocuments ?? []).map((doc) => ({
      ...doc,
      category: doc.category ?? null,
      country: doc.country ?? null,
      verified: doc.verified ?? false,
    })),
    legalCategories: raw.legalCategories ?? [],
    legalSection: {
      ...(raw.legalSection ?? ({} as SnapshotPayload['legalSection'])),
      eyebrow: raw.legalSection?.eyebrow ?? '',
      heading: raw.legalSection?.heading ?? 'Legal & Certificate',
      description: raw.legalSection?.description ?? '',
      hideExpired: raw.legalSection?.hideExpired ?? false,
    },
    // A snapshot frozen before the Factory TikTok showcase existed has no `eyebrow`/`videos` —
    // default them so the redesigned public section can render an old snapshot safely.
    factory: {
      ...(raw.factory ?? ({} as SnapshotPayload['factory'])),
      eyebrow: raw.factory?.eyebrow ?? 'Factory & Facilities',
      videos: raw.factory?.videos ?? [],
      gallery: (raw.factory?.gallery ?? []).map((item) => ({
        ...item,
        category: item.category ?? null,
      })),
    },
    // A snapshot frozen before the "About Company → Facilities" redesign has no `facilities`/
    // `facilitiesSection` keys at all — default to an empty list + default copy so an old
    // snapshot keeps rendering the rest of the page instead of throwing.
    facilities: (raw.facilities ?? []).map((f) => ({
      ...f,
      facilityType: f.facilityType ?? null,
      location: f.location ?? null,
      status: f.status ?? null,
      active: f.active ?? true,
      featured: f.featured ?? false,
      gallery: (f.gallery ?? []).map((g) => ({
        ...g,
        title: g.title ?? null,
        caption: g.caption ?? null,
        category: g.category ?? null,
        altText: g.altText ?? null,
        featured: g.featured ?? false,
        active: g.active ?? true,
      })),
    })),
    facilitiesSection: {
      ...(raw.facilitiesSection ??
        ({} as SnapshotPayload['facilitiesSection'])),
      eyebrow: raw.facilitiesSection?.eyebrow ?? 'Built for Scale',
      heading: raw.facilitiesSection?.heading ?? 'Our Facilities',
      description: raw.facilitiesSection?.description ?? '',
      autoRotate: raw.facilitiesSection?.autoRotate ?? true,
      rotateIntervalSeconds: raw.facilitiesSection?.rotateIntervalSeconds ?? 6,
    },
    // A snapshot frozen before "Facilities → MOQ & Payment Terms" existed has none of these
    // keys at all — default to an empty section/lists so an old snapshot keeps rendering the
    // rest of the page instead of throwing.
    moqPaymentSection: {
      ...(raw.moqPaymentSection ??
        ({} as SnapshotPayload['moqPaymentSection'])),
      eyebrow: raw.moqPaymentSection?.eyebrow ?? 'ORDERING & PAYMENT TERMS',
      heading:
        raw.moqPaymentSection?.heading ?? 'Minimum Order & Payment Terms',
      introduction: raw.moqPaymentSection?.introduction ?? '',
      supplyCapacityTitle:
        raw.moqPaymentSection?.supplyCapacityTitle ?? 'Supply Capacity',
      supplyCapacityDescription:
        raw.moqPaymentSection?.supplyCapacityDescription ?? '',
      commitmentTitle:
        raw.moqPaymentSection?.commitmentTitle ?? 'Our Commitment',
      commitmentDescription: raw.moqPaymentSection?.commitmentDescription ?? '',
      ctaTitle: raw.moqPaymentSection?.ctaTitle ?? 'Discuss Your Requirements',
      ctaDescription: raw.moqPaymentSection?.ctaDescription ?? '',
      ctaButtonLabel: raw.moqPaymentSection?.ctaButtonLabel ?? 'Contact PPN',
      ctaButtonHref:
        raw.moqPaymentSection?.ctaButtonHref ?? '/contact#request-quotation',
    },
    moqPaymentQuickCards: raw.moqPaymentQuickCards ?? [],
    moqPaymentBusinessTerms: raw.moqPaymentBusinessTerms ?? [],
    // A snapshot frozen before "Facilities → Shipment Terms" existed has none of these keys —
    // same empty-defaults treatment as MOQ & Payment Terms above.
    shipmentTermsSection: {
      ...(raw.shipmentTermsSection ??
        ({} as SnapshotPayload['shipmentTermsSection'])),
      eyebrow: raw.shipmentTermsSection?.eyebrow ?? 'SHIPMENT TERMS',
      heading: raw.shipmentTermsSection?.heading ?? 'Shipment Terms',
      introduction: raw.shipmentTermsSection?.introduction ?? '',
      commitmentTitle:
        raw.shipmentTermsSection?.commitmentTitle ?? 'Our Commitment',
      commitmentDescription:
        raw.shipmentTermsSection?.commitmentDescription ?? '',
      ctaLabel:
        raw.shipmentTermsSection?.ctaLabel ??
        'Discuss Your Shipment Requirements',
      ctaHref:
        raw.shipmentTermsSection?.ctaHref ?? '/contact#request-quotation',
      ctaOpenNewTab: raw.shipmentTermsSection?.ctaOpenNewTab ?? false,
    },
    shippingArrangementItems: raw.shippingArrangementItems ?? [],
    shipmentLoadingLocations: raw.shipmentLoadingLocations ?? [],
    shipmentContainerTypes: raw.shipmentContainerTypes ?? [],
    shipmentScheduleSteps: raw.shipmentScheduleSteps ?? [],
    shipmentDocuments: raw.shipmentDocuments ?? [],
    shipmentCommitmentItems: raw.shipmentCommitmentItems ?? [],
    // A snapshot frozen before "Facilities → FAQ" existed has none of these keys — same
    // empty-defaults treatment as Shipment Terms above.
    facilitiesFaqSection: {
      ...(raw.facilitiesFaqSection ??
        ({} as SnapshotPayload['facilitiesFaqSection'])),
      eyebrow: raw.facilitiesFaqSection?.eyebrow ?? 'FAQ',
      heading:
        raw.facilitiesFaqSection?.heading ?? 'Frequently Asked Questions',
      description: raw.facilitiesFaqSection?.description ?? '',
      accordionMode: raw.facilitiesFaqSection?.accordionMode ?? 'single',
      ctaTitle: raw.facilitiesFaqSection?.ctaTitle ?? 'Still have questions?',
      ctaDescription: raw.facilitiesFaqSection?.ctaDescription ?? '',
      ctaPrimaryLabel:
        raw.facilitiesFaqSection?.ctaPrimaryLabel ?? 'Contact PPN',
      ctaPrimaryHref: raw.facilitiesFaqSection?.ctaPrimaryHref ?? '/contact',
      ctaSecondaryLabel:
        raw.facilitiesFaqSection?.ctaSecondaryLabel ?? 'WhatsApp PPN',
      ctaSecondaryHref: raw.facilitiesFaqSection?.ctaSecondaryHref ?? '',
    },
    facilitiesFaqItems: raw.facilitiesFaqItems ?? [],
    sectionConfig: raw.sectionConfig ?? [],
    profile: {
      ...profile,
      eyebrow: profile.eyebrow ?? '',
      subheading: profile.subheading ?? '',
      ctaLabel: profile.ctaLabel ?? null,
      ctaHref: profile.ctaHref ?? null,
      youtubeVideoUrl: profile.youtubeVideoUrl ?? null,
      socialLabel: profile.socialLabel ?? 'Connect With PPN',
      socialVisible: profile.socialVisible ?? false,
      storyLabel: profile.storyLabel ?? '',
      storyHeading: profile.storyHeading ?? '',
      storyDescription: profile.storyDescription ?? '',
      storySecondaryDescription: profile.storySecondaryDescription ?? '',
      storyImage: profile.storyImage ?? null,
      storyVisible: profile.storyVisible ?? false,
      scopeLabel: profile.scopeLabel ?? '',
      scopeHeading: profile.scopeHeading ?? '',
      scopeDescription: profile.scopeDescription ?? '',
      scopeVisible: profile.scopeVisible ?? false,
      factsLabel: profile.factsLabel ?? '',
      factsHeading: profile.factsHeading ?? '',
      factsVisible: profile.factsVisible ?? false,
      exportLabel: profile.exportLabel ?? '',
      exportHeading: profile.exportHeading ?? '',
      exportDescription: profile.exportDescription ?? '',
      exportVisible: profile.exportVisible ?? false,
      legalLabel: profile.legalLabel ?? '',
      legalHeading: profile.legalHeading ?? '',
      businessType: profile.businessType ?? '',
      registeredAddress: profile.registeredAddress ?? '',
      businessIdNumber: profile.businessIdNumber ?? '',
      establishedYear: profile.establishedYear ?? '',
      legalVisible: profile.legalVisible ?? false,
      closingLabel: profile.closingLabel ?? '',
      closingHeading: profile.closingHeading ?? '',
      closingDescription: profile.closingDescription ?? '',
      closingCtaLabel: profile.closingCtaLabel ?? null,
      closingCtaHref: profile.closingCtaHref ?? null,
      closingVisible: profile.closingVisible ?? false,
      gallery: profile.gallery ?? [],
    },
  };
}

/** The eight document groupings the brief lists — seeded once, then Admin-owned. */
const DEFAULT_LEGAL_CATEGORIES = [
  'Company Legal Documents',
  'Business Registration',
  'Certificates',
  'Laboratory Reports',
  'Quality & Compliance',
  'Export Documents',
  'Product Certifications',
  'Other Documents',
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Admin forms post `""` for a cleared optional field; store that as SQL NULL so "no value"
 * has exactly one representation and `field && render(field)` checks behave predictably. */
function emptyToNull(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.trim() === '' ? null : value;
}

function newest(...dates: (Date | null)[]): Date | null {
  const present = dates.filter((d): d is Date => Boolean(d));
  if (present.length === 0) return null;
  return new Date(Math.max(...present.map((d) => d.getTime())));
}

@Injectable()
export class AboutCompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Section 01: Company Profile (singleton) ─────────────────────────────

  private async getOrCreateProfile() {
    const existing = await this.prisma.aboutCompanyProfile.findFirst({
      include: PROFILE_INCLUDE,
    });
    if (existing) return existing;
    return this.prisma.aboutCompanyProfile.create({
      data: {},
      include: PROFILE_INCLUDE,
    });
  }

  async findProfile(locale: string = DEFAULT_LOCALE) {
    const entry = await this.getOrCreateProfile();
    return toAboutCompanyProfile(entry, locale);
  }

  async updateProfile(dto: UpdateAboutCompanyProfileDto) {
    const existing = await this.getOrCreateProfile();
    const updated = await this.prisma.aboutCompanyProfile.update({
      where: { id: existing.id },
      data: {
        headline: dto.headline,
        shortDescription: dto.short_description,
        mainDescription: dto.main_description,
        vision: dto.vision,
        mission: dto.mission,
        companyOverview: dto.company_overview,
        mainImageId: dto.main_image_id,

        eyebrow: dto.eyebrow,
        subheading: dto.subheading,
        ctaLabel: dto.cta_label,
        ctaHref: dto.cta_href,
        youtubeVideoUrl: dto.youtube_video_url,
        socialLabel: dto.social_label,
        socialVisible: dto.social_visible,

        storyLabel: dto.story_label,
        storyHeading: dto.story_heading,
        storyDescription: dto.story_description,
        storySecondaryDescription: dto.story_secondary_description,
        storyImageId: dto.story_image_id,
        storyVisible: dto.story_visible,

        scopeLabel: dto.scope_label,
        scopeHeading: dto.scope_heading,
        scopeDescription: dto.scope_description,
        scopeVisible: dto.scope_visible,

        factsLabel: dto.facts_label,
        factsHeading: dto.facts_heading,
        factsVisible: dto.facts_visible,

        exportLabel: dto.export_label,
        exportHeading: dto.export_heading,
        exportDescription: dto.export_description,
        exportVisible: dto.export_visible,

        legalLabel: dto.legal_label,
        legalHeading: dto.legal_heading,
        businessType: dto.business_type,
        registeredAddress: dto.registered_address,
        businessIdNumber: dto.business_id_number,
        establishedYear: dto.established_year,
        legalVisible: dto.legal_visible,

        closingLabel: dto.closing_label,
        closingHeading: dto.closing_heading,
        closingDescription: dto.closing_description,
        closingCtaLabel: dto.closing_cta_label,
        closingCtaHref: dto.closing_cta_href,
        closingVisible: dto.closing_visible,

        translations: dto.translations,
      },
      include: PROFILE_INCLUDE,
    });
    return toAboutCompanyProfile(updated);
  }

  // ── Company Facts ─────────────────────────────────────────────────────────

  async findFacts() {
    const facts = await this.prisma.aboutCompanyFact.findMany({
      orderBy: { order: 'asc' },
    });
    return facts.map((f) => toAboutCompanyFact(f));
  }

  async createFact(dto: CreateAboutCompanyFactDto) {
    const count = await this.prisma.aboutCompanyFact.count();
    const fact = await this.prisma.aboutCompanyFact.create({
      data: {
        label: dto.label,
        value: dto.value,
        icon: dto.icon,
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toAboutCompanyFact(fact);
  }

  async updateFact(id: string, dto: UpdateAboutCompanyFactDto) {
    await this.assertExists(this.prisma.aboutCompanyFact, id, 'Company fact');
    const fact = await this.prisma.aboutCompanyFact.update({
      where: { id },
      data: {
        label: dto.label,
        value: dto.value,
        icon: dto.icon,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toAboutCompanyFact(fact);
  }

  async removeFact(id: string) {
    await this.assertExists(this.prisma.aboutCompanyFact, id, 'Company fact');
    await this.prisma.aboutCompanyFact.delete({ where: { id } });
    return { deleted: true };
  }

  // ── "Connect With PPN" Social Links ─────────────────────────────────────

  async findSocialLinks() {
    const links = await this.prisma.aboutCompanySocialLink.findMany({
      orderBy: { order: 'asc' },
    });
    return links.map(toAboutCompanySocialLink);
  }

  async createSocialLink(dto: CreateAboutCompanySocialLinkDto) {
    const count = await this.prisma.aboutCompanySocialLink.count();
    const link = await this.prisma.aboutCompanySocialLink.create({
      data: {
        platform: dto.platform,
        displayName: dto.display_name,
        url: dto.url,
        active: dto.active ?? true,
        openInNewTab: dto.open_in_new_tab ?? true,
        order: dto.order ?? count,
      },
    });
    return toAboutCompanySocialLink(link);
  }

  async updateSocialLink(id: string, dto: UpdateAboutCompanySocialLinkDto) {
    await this.assertExists(
      this.prisma.aboutCompanySocialLink,
      id,
      'Social link',
    );
    const link = await this.prisma.aboutCompanySocialLink.update({
      where: { id },
      data: {
        platform: dto.platform,
        displayName: dto.display_name,
        url: dto.url,
        active: dto.active,
        openInNewTab: dto.open_in_new_tab,
        order: dto.order,
      },
    });
    return toAboutCompanySocialLink(link);
  }

  async removeSocialLink(id: string) {
    await this.assertExists(
      this.prisma.aboutCompanySocialLink,
      id,
      'Social link',
    );
    await this.prisma.aboutCompanySocialLink.delete({ where: { id } });
    return { deleted: true };
  }

  // ── "Countries We Have Exported To" — reuses ExportDestination ──────────
  // Deliberately not a second country model: same real records the Homepage's Global Export
  // Reach map uses, curated independently here via `showInCompanyProfile`. Add/Edit/Delete of
  // the underlying country record stays in the existing Homepage Export Destinations editor
  // (see README) — this only toggles/reorders which of those records surface on this section.

  async findCompanyProfileCountries() {
    const destinations = await this.prisma.exportDestination.findMany({
      include: EXPORT_DESTINATION_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return destinations.map((d) => toExportDestination(d));
  }

  async setCompanyProfileCountryVisibility(id: string, show: boolean) {
    await this.assertExists(this.prisma.exportDestination, id, 'Country');
    const updated = await this.prisma.exportDestination.update({
      where: { id },
      data: { showInCompanyProfile: show },
      include: EXPORT_DESTINATION_INCLUDE,
    });
    return toExportDestination(updated);
  }

  async addGalleryItem(dto: AddAboutCompanyGalleryItemDto) {
    const profile = await this.getOrCreateProfile();
    const count = await this.prisma.aboutCompanyGalleryImage.count({
      where: { profileId: profile.id },
    });
    await this.prisma.aboutCompanyGalleryImage.create({
      data: {
        profileId: profile.id,
        mediaId: dto.media_id,
        caption: dto.caption,
        altText: dto.alt_text,
        order: count,
      },
    });
    return this.findProfile();
  }

  async updateGalleryItem(id: string, dto: UpdateAboutCompanyGalleryItemDto) {
    await this.assertExists(
      this.prisma.aboutCompanyGalleryImage,
      id,
      'Gallery item',
    );
    await this.prisma.aboutCompanyGalleryImage.update({
      where: { id },
      data: {
        caption: dto.caption,
        altText: dto.alt_text,
        order: dto.order,
        featured: dto.featured,
      },
    });
    return this.findProfile();
  }

  async removeGalleryItem(id: string) {
    await this.assertExists(
      this.prisma.aboutCompanyGalleryImage,
      id,
      'Gallery item',
    );
    await this.prisma.aboutCompanyGalleryImage.delete({ where: { id } });
    return this.findProfile();
  }

  // ── Section 02: Team ─────────────────────────────────────────────────────

  async findTeamMembers(publicOnly = false) {
    const members = await this.prisma.teamMember.findMany({
      where: publicOnly ? { active: true } : undefined,
      include: TEAM_MEMBER_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return members.map((m) => toTeamMember(m));
  }

  async createTeamMember(dto: CreateTeamMemberDto) {
    const count = await this.prisma.teamMember.count();
    const member = await this.prisma.teamMember.create({
      data: {
        name: dto.name,
        position: dto.position,
        biography: dto.biography ?? '',
        responsibilities: dto.responsibilities ?? '',
        department: emptyToNull(dto.department),
        photoId: dto.photo_id,
        linkedinUrl: emptyToNull(dto.linkedin_url),
        email: emptyToNull(dto.email),
        phone: emptyToNull(dto.phone),
        order: dto.order ?? count,
        active: dto.active ?? true,
        featured: dto.featured ?? false,
        translations: dto.translations,
      },
      include: TEAM_MEMBER_INCLUDE,
    });
    return toTeamMember(member);
  }

  async updateTeamMember(id: string, dto: UpdateTeamMemberDto) {
    await this.assertExists(this.prisma.teamMember, id, 'Team member');
    const member = await this.prisma.teamMember.update({
      where: { id },
      data: {
        name: dto.name,
        position: dto.position,
        biography: dto.biography,
        responsibilities: dto.responsibilities,
        department: emptyToNull(dto.department),
        photoId: dto.photo_id,
        linkedinUrl: emptyToNull(dto.linkedin_url),
        email: emptyToNull(dto.email),
        phone: emptyToNull(dto.phone),
        order: dto.order,
        active: dto.active,
        featured: dto.featured,
        translations: dto.translations,
      },
      include: TEAM_MEMBER_INCLUDE,
    });
    return toTeamMember(member);
  }

  async removeTeamMember(id: string) {
    await this.assertExists(this.prisma.teamMember, id, 'Team member');
    await this.prisma.teamMember.delete({ where: { id } });
    return { deleted: true };
  }

  async duplicateTeamMember(id: string) {
    const source = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!source)
      throw new ApiException('NOT_FOUND', 'Team member not found.', 404);
    const count = await this.prisma.teamMember.count();
    const member = await this.prisma.teamMember.create({
      data: {
        name: `${source.name} — Copy`,
        position: source.position,
        biography: source.biography,
        responsibilities: source.responsibilities,
        department: source.department,
        photoId: source.photoId,
        linkedinUrl: source.linkedinUrl,
        email: source.email,
        phone: source.phone,
        order: count,
        active: false,
        featured: false,
      },
      include: TEAM_MEMBER_INCLUDE,
    });
    return toTeamMember(member);
  }

  private async getOrCreateTeamSection() {
    const existing = await this.prisma.aboutCompanyTeamSection.findFirst();
    if (existing) return existing;
    return this.prisma.aboutCompanyTeamSection.create({ data: {} });
  }

  async findTeamSection(locale: string = DEFAULT_LOCALE) {
    return toAboutCompanyTeamSection(
      await this.getOrCreateTeamSection(),
      locale,
    );
  }

  async updateTeamSection(dto: UpdateAboutCompanyTeamSectionDto) {
    const existing = await this.getOrCreateTeamSection();
    const updated = await this.prisma.aboutCompanyTeamSection.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        heading: dto.heading,
        description: dto.description,
        ctaLabel: emptyToNull(dto.cta_label),
        ctaHref: emptyToNull(dto.cta_href),
        showCounter: dto.show_counter,
        translations: dto.translations,
      },
    });
    return toAboutCompanyTeamSection(updated);
  }

  // ── Section 03: What We Do ───────────────────────────────────────────────

  async findWhatWeDoItems(publicOnly = false) {
    const items = await this.prisma.whatWeDoItem.findMany({
      where: publicOnly ? { active: true } : undefined,
      include: WHAT_WE_DO_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return items.map((i) => toWhatWeDoItem(i));
  }

  async createWhatWeDoItem(dto: CreateWhatWeDoItemDto) {
    const count = await this.prisma.whatWeDoItem.count();
    const item = await this.prisma.whatWeDoItem.create({
      data: {
        title: dto.title,
        shortDescription: dto.short_description ?? '',
        detailedDescription: dto.detailed_description ?? '',
        keyPoints: dto.key_points ?? [],
        mediaId: dto.media_id,
        productId: dto.product_id,
        order: dto.order ?? count,
        active: dto.active ?? true,
        featured: dto.featured ?? false,
        translations: dto.translations,
      },
      include: WHAT_WE_DO_INCLUDE,
    });
    return toWhatWeDoItem(item);
  }

  async updateWhatWeDoItem(id: string, dto: UpdateWhatWeDoItemDto) {
    await this.assertExists(this.prisma.whatWeDoItem, id, 'What We Do item');
    const item = await this.prisma.whatWeDoItem.update({
      where: { id },
      data: {
        title: dto.title,
        shortDescription: dto.short_description,
        detailedDescription: dto.detailed_description,
        keyPoints: dto.key_points,
        mediaId: dto.media_id,
        productId: dto.product_id,
        order: dto.order,
        active: dto.active,
        featured: dto.featured,
        translations: dto.translations,
      },
      include: WHAT_WE_DO_INCLUDE,
    });
    return toWhatWeDoItem(item);
  }

  async removeWhatWeDoItem(id: string) {
    await this.assertExists(this.prisma.whatWeDoItem, id, 'What We Do item');
    await this.prisma.whatWeDoItem.delete({ where: { id } });
    return { deleted: true };
  }

  async duplicateWhatWeDoItem(id: string) {
    const source = await this.prisma.whatWeDoItem.findUnique({ where: { id } });
    if (!source)
      throw new ApiException('NOT_FOUND', 'What We Do item not found.', 404);
    const count = await this.prisma.whatWeDoItem.count();
    const item = await this.prisma.whatWeDoItem.create({
      data: {
        title: `${source.title} — Copy`,
        shortDescription: source.shortDescription,
        detailedDescription: source.detailedDescription,
        keyPoints: source.keyPoints,
        mediaId: source.mediaId,
        productId: source.productId,
        order: count,
        active: false,
        featured: false,
      },
      include: WHAT_WE_DO_INCLUDE,
    });
    return toWhatWeDoItem(item);
  }

  // ── "What We Supply" section copy (+ "Who We Supply" copy, Buyer/Supplier CTAs) ────────

  private async getOrCreateWhatWeDoSection() {
    const existing = await this.prisma.aboutCompanyWhatWeDoSection.findFirst();
    if (existing) return existing;
    return this.prisma.aboutCompanyWhatWeDoSection.create({ data: {} });
  }

  async findWhatWeDoSection(locale: string = DEFAULT_LOCALE) {
    return toAboutCompanyWhatWeDoSection(
      await this.getOrCreateWhatWeDoSection(),
      locale,
    );
  }

  async updateWhatWeDoSection(dto: UpdateAboutCompanyWhatWeDoSectionDto) {
    const existing = await this.getOrCreateWhatWeDoSection();
    const updated = await this.prisma.aboutCompanyWhatWeDoSection.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        heading: dto.heading,
        description: dto.description,
        whoHeading: dto.who_heading,
        whoDescription: dto.who_description,
        buyerCtaHeading: dto.buyer_cta_heading,
        buyerCtaDescription: dto.buyer_cta_description,
        buyerCtaButtonText: dto.buyer_cta_button_text,
        supplierCtaHeading: dto.supplier_cta_heading,
        supplierCtaDescription: dto.supplier_cta_description,
        supplierCtaButtonText: dto.supplier_cta_button_text,
        translations: dto.translations,
      },
    });
    return toAboutCompanyWhatWeDoSection(updated);
  }

  // ── "Who We Supply" audience segments ────────────────────────────────────

  async findWhoWeSupplyItems() {
    const items = await this.prisma.whoWeSupplyItem.findMany({
      orderBy: { order: 'asc' },
    });
    return items.map((i) => toWhoWeSupplyItem(i));
  }

  async createWhoWeSupplyItem(dto: CreateWhoWeSupplyItemDto) {
    const count = await this.prisma.whoWeSupplyItem.count();
    const item = await this.prisma.whoWeSupplyItem.create({
      data: {
        title: dto.title,
        description: dto.description ?? '',
        icon: dto.icon,
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toWhoWeSupplyItem(item);
  }

  async updateWhoWeSupplyItem(id: string, dto: UpdateWhoWeSupplyItemDto) {
    await this.assertExists(
      this.prisma.whoWeSupplyItem,
      id,
      'Who We Supply item',
    );
    const item = await this.prisma.whoWeSupplyItem.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        icon: dto.icon,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toWhoWeSupplyItem(item);
  }

  async removeWhoWeSupplyItem(id: string) {
    await this.assertExists(
      this.prisma.whoWeSupplyItem,
      id,
      'Who We Supply item',
    );
    await this.prisma.whoWeSupplyItem.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Section 04: Legal & Certificate ──────────────────────────────────────

  async findLegalDocuments(publicOnly = false) {
    const documents = await this.prisma.legalCertificateDocument.findMany({
      where: publicOnly ? { active: true } : undefined,
      include: LEGAL_DOCUMENT_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return documents.map((d) => toLegalDocument(d));
  }

  /**
   * Auto-fills a document's preview image from its PDF's first page when no
   * preview exists yet. A manual thumbnail (existing or explicitly set in
   * this same request) always takes priority and is never overwritten.
   */
  private async autoGeneratePreviewForFile(
    fileId: string,
  ): Promise<string | undefined> {
    const file = await this.prisma.media.findUnique({ where: { id: fileId } });
    if (!file || file.fileType !== 'pdf') return undefined;
    const generated = await this.mediaService.generatePdfThumbnail(
      file.fileUrl,
      'Document preview',
    );
    return generated?.id;
  }

  async createLegalDocument(dto: CreateLegalDocumentDto) {
    const count = await this.prisma.legalCertificateDocument.count();
    const previewImageId =
      dto.preview_image_id ??
      (dto.file_id
        ? await this.autoGeneratePreviewForFile(dto.file_id)
        : undefined);

    const document = await this.prisma.legalCertificateDocument.create({
      data: {
        title: dto.title,
        documentType: (dto.document_type as never) ?? 'other',
        categoryId: emptyToNull(dto.category_id),
        country: emptyToNull(dto.country),
        verified: dto.verified ?? false,
        documentNumber: dto.document_number,
        issuingOrganization: dto.issuing_organization,
        issueDate: dto.issue_date ? new Date(dto.issue_date) : undefined,
        expiryDate: dto.expiry_date ? new Date(dto.expiry_date) : undefined,
        description: dto.description,
        fileId: dto.file_id,
        previewImageId,
        order: dto.order ?? count,
        active: dto.active ?? true,
        featured: dto.featured ?? false,
        translations: dto.translations,
      },
      include: LEGAL_DOCUMENT_INCLUDE,
    });
    return toLegalDocument(document);
  }

  async updateLegalDocument(id: string, dto: UpdateLegalDocumentDto) {
    const existing = await this.prisma.legalCertificateDocument.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new ApiException('NOT_FOUND', 'Document not found.', 404);
    }

    let previewImageId = dto.preview_image_id;
    if (previewImageId === undefined && !existing.previewImageId) {
      const finalFileId =
        dto.file_id !== undefined ? dto.file_id : existing.fileId;
      previewImageId = finalFileId
        ? await this.autoGeneratePreviewForFile(finalFileId)
        : undefined;
    }

    const document = await this.prisma.legalCertificateDocument.update({
      where: { id },
      data: {
        title: dto.title,
        documentType: dto.document_type as never,
        categoryId: emptyToNull(dto.category_id),
        country: emptyToNull(dto.country),
        verified: dto.verified,
        documentNumber: dto.document_number,
        issuingOrganization: dto.issuing_organization,
        issueDate: dto.issue_date ? new Date(dto.issue_date) : undefined,
        expiryDate: dto.expiry_date ? new Date(dto.expiry_date) : undefined,
        description: dto.description,
        fileId: dto.file_id,
        previewImageId,
        order: dto.order,
        active: dto.active,
        featured: dto.featured,
        translations: dto.translations,
      },
      include: LEGAL_DOCUMENT_INCLUDE,
    });
    return toLegalDocument(document);
  }

  async removeLegalDocument(id: string) {
    await this.assertExists(
      this.prisma.legalCertificateDocument,
      id,
      'Document',
    );
    await this.prisma.legalCertificateDocument.delete({ where: { id } });
    return { deleted: true };
  }

  async duplicateLegalDocument(id: string) {
    const source = await this.prisma.legalCertificateDocument.findUnique({
      where: { id },
    });
    if (!source)
      throw new ApiException('NOT_FOUND', 'Document not found.', 404);
    const count = await this.prisma.legalCertificateDocument.count();
    const document = await this.prisma.legalCertificateDocument.create({
      data: {
        title: `${source.title} — Copy`,
        documentType: source.documentType,
        categoryId: source.categoryId,
        country: source.country,
        documentNumber: source.documentNumber,
        issuingOrganization: source.issuingOrganization,
        issueDate: source.issueDate,
        expiryDate: source.expiryDate,
        description: source.description,
        fileId: source.fileId,
        previewImageId: source.previewImageId,
        order: count,
        active: false,
        featured: false,
        // `verified` is deliberately NOT copied. It is a claim an Admin makes about one
        // specific record; a duplicate is a new record that nobody has verified yet, and a
        // badge must never appear without an explicit tick (README "Legal & Company
        // Information" — no automatic verification).
        verified: false,
      },
      include: LEGAL_DOCUMENT_INCLUDE,
    });
    return toLegalDocument(document);
  }

  // ── Section 04: categories + section copy ────────────────────────────────

  async findLegalCategories() {
    await this.ensureLegalCategoriesSeeded();
    const categories = await this.prisma.legalDocumentCategory.findMany({
      orderBy: { order: 'asc' },
    });
    return categories.map((c) => toLegalDocumentCategory(c));
  }

  /** Seeds the eight groupings the brief lists, once, only when the table is empty. These are
   * generic category names (not company claims) and stay fully editable afterwards. */
  private async ensureLegalCategoriesSeeded() {
    const count = await this.prisma.legalDocumentCategory.count();
    if (count > 0) return;
    await this.prisma.legalDocumentCategory.createMany({
      data: DEFAULT_LEGAL_CATEGORIES.map((name, order) => ({
        name,
        slug: slugify(name),
        order,
      })),
      skipDuplicates: true,
    });
  }

  async createLegalCategory(dto: CreateLegalDocumentCategoryDto) {
    const count = await this.prisma.legalDocumentCategory.count();
    const category = await this.prisma.legalDocumentCategory.create({
      data: {
        name: dto.name,
        slug: await this.uniqueCategorySlug(slugify(dto.name)),
        description: emptyToNull(dto.description),
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toLegalDocumentCategory(category);
  }

  async updateLegalCategory(id: string, dto: UpdateLegalDocumentCategoryDto) {
    await this.assertExists(this.prisma.legalDocumentCategory, id, 'Category');
    const category = await this.prisma.legalDocumentCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: emptyToNull(dto.description),
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toLegalDocumentCategory(category);
  }

  /** Deleting a category must not delete the documents filed under it — the FK is
   * `onDelete: SetNull`, so they become uncategorised and stay editable. */
  async removeLegalCategory(id: string) {
    await this.assertExists(this.prisma.legalDocumentCategory, id, 'Category');
    await this.prisma.legalDocumentCategory.delete({ where: { id } });
    return { deleted: true };
  }

  private async uniqueCategorySlug(base: string) {
    let slug = base || 'category';
    let suffix = 2;
    while (
      await this.prisma.legalDocumentCategory.findUnique({ where: { slug } })
    ) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  private async getOrCreateLegalSection() {
    const existing = await this.prisma.aboutCompanyLegalSection.findFirst();
    if (existing) return existing;
    return this.prisma.aboutCompanyLegalSection.create({ data: {} });
  }

  async findLegalSection(locale: string = DEFAULT_LOCALE) {
    return toAboutCompanyLegalSection(
      await this.getOrCreateLegalSection(),
      locale,
    );
  }

  async updateLegalSection(dto: UpdateAboutCompanyLegalSectionDto) {
    const existing = await this.getOrCreateLegalSection();
    const updated = await this.prisma.aboutCompanyLegalSection.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        heading: dto.heading,
        description: dto.description,
        hideExpired: dto.hide_expired,
        translations: dto.translations,
      },
    });
    return toAboutCompanyLegalSection(updated);
  }

  // ── Section 05: Factory (singleton profile + gallery + documents) ───────

  private async getOrCreateFactory() {
    const existing = await this.prisma.factoryProfile.findFirst({
      include: FACTORY_INCLUDE,
    });
    if (existing) return existing;
    return this.prisma.factoryProfile.create({
      data: {},
      include: FACTORY_INCLUDE,
    });
  }

  async findFactory(locale: string = DEFAULT_LOCALE) {
    const entry = await this.getOrCreateFactory();
    return toFactoryProfile(entry, locale);
  }

  async updateFactory(dto: UpdateFactoryProfileDto) {
    const existing = await this.getOrCreateFactory();
    const updated = await this.prisma.factoryProfile.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        name: dto.name,
        shortDescription: dto.short_description,
        detailedDescription: dto.detailed_description,
        location: dto.location,
        operationalInfo: dto.operational_info,
        capacity: dto.capacity,
        additionalNotes: dto.additional_notes,
        translations: dto.translations,
      },
      include: FACTORY_INCLUDE,
    });
    return toFactoryProfile(updated);
  }

  async addFactoryGalleryItem(dto: AddFactoryGalleryItemDto) {
    const factory = await this.getOrCreateFactory();
    const count = await this.prisma.factoryGalleryImage.count({
      where: { factoryId: factory.id },
    });
    await this.prisma.factoryGalleryImage.create({
      data: {
        factoryId: factory.id,
        mediaId: dto.media_id,
        title: dto.title,
        caption: dto.caption,
        category: dto.category,
        altText: dto.alt_text,
        order: count,
      },
    });
    return this.findFactory();
  }

  async updateFactoryGalleryItem(id: string, dto: UpdateFactoryGalleryItemDto) {
    await this.assertExists(
      this.prisma.factoryGalleryImage,
      id,
      'Gallery item',
    );
    await this.prisma.factoryGalleryImage.update({
      where: { id },
      data: {
        title: dto.title,
        caption: dto.caption,
        category: dto.category,
        altText: dto.alt_text,
        order: dto.order,
        featured: dto.featured,
        active: dto.active,
      },
    });
    return this.findFactory();
  }

  async removeFactoryGalleryItem(id: string) {
    await this.assertExists(
      this.prisma.factoryGalleryImage,
      id,
      'Gallery item',
    );
    await this.prisma.factoryGalleryImage.delete({ where: { id } });
    return this.findFactory();
  }

  // ── Facilities ("About Company → Facilities") ──────────────────────────

  async findFacilities(publicOnly = false) {
    const facilities = await this.prisma.facility.findMany({
      where: publicOnly ? { active: true } : undefined,
      include: FACILITY_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return facilities.map((f) => toFacility(f));
  }

  async updateFacility(id: string, dto: UpdateFacilityDto) {
    await this.assertExists(this.prisma.facility, id, 'Facility');
    const facility = await this.prisma.facility.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        facilityType: dto.facility_type,
        location: dto.location,
        status: dto.status,
        coverImageId: dto.cover_image_id,
        order: dto.order,
        active: dto.active,
        featured: dto.featured,
        translations: dto.translations,
      },
      include: FACILITY_INCLUDE,
    });
    return toFacility(facility);
  }

  async addFacilityGalleryItem(
    facilityId: string,
    dto: AddFacilityGalleryItemDto,
  ) {
    await this.assertExists(this.prisma.facility, facilityId, 'Facility');
    const count = await this.prisma.facilityGalleryImage.count({
      where: { facilityId },
    });
    await this.prisma.facilityGalleryImage.create({
      data: {
        facilityId,
        mediaId: dto.media_id,
        title: dto.title,
        caption: dto.caption,
        category: dto.category,
        altText: dto.alt_text,
        order: count,
      },
    });
    const facility = await this.prisma.facility.findUniqueOrThrow({
      where: { id: facilityId },
      include: FACILITY_INCLUDE,
    });
    return toFacility(facility);
  }

  async updateFacilityGalleryItem(
    id: string,
    dto: UpdateFacilityGalleryItemDto,
  ) {
    const item = await this.prisma.facilityGalleryImage.findUnique({
      where: { id },
    });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Gallery item not found.', 404);
    await this.prisma.facilityGalleryImage.update({
      where: { id },
      data: {
        title: dto.title,
        caption: dto.caption,
        category: dto.category,
        altText: dto.alt_text,
        order: dto.order,
        featured: dto.featured,
        active: dto.active,
      },
    });
    const facility = await this.prisma.facility.findUniqueOrThrow({
      where: { id: item.facilityId },
      include: FACILITY_INCLUDE,
    });
    return toFacility(facility);
  }

  async removeFacilityGalleryItem(id: string) {
    const item = await this.prisma.facilityGalleryImage.findUnique({
      where: { id },
    });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Gallery item not found.', 404);
    await this.prisma.facilityGalleryImage.delete({ where: { id } });
    const facility = await this.prisma.facility.findUniqueOrThrow({
      where: { id: item.facilityId },
      include: FACILITY_INCLUDE,
    });
    return toFacility(facility);
  }

  private async getOrCreateFacilitiesSection() {
    const existing =
      await this.prisma.aboutCompanyFacilitiesSection.findFirst();
    if (existing) return existing;
    return this.prisma.aboutCompanyFacilitiesSection.create({ data: {} });
  }

  async findFacilitiesSection(locale: string = DEFAULT_LOCALE) {
    return toAboutCompanyFacilitiesSection(
      await this.getOrCreateFacilitiesSection(),
      locale,
    );
  }

  async updateFacilitiesSection(dto: UpdateAboutCompanyFacilitiesSectionDto) {
    const existing = await this.getOrCreateFacilitiesSection();
    const updated = await this.prisma.aboutCompanyFacilitiesSection.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        heading: dto.heading,
        description: dto.description,
        autoRotate: dto.auto_rotate,
        rotateIntervalSeconds: dto.rotate_interval_seconds,
        translations: dto.translations,
      },
    });
    return toAboutCompanyFacilitiesSection(updated);
  }

  // ── "Facilities → MOQ & Payment Terms" ──────────────────────────────────

  private async getOrCreateMoqPaymentSection() {
    const existing =
      await this.prisma.aboutCompanyMoqPaymentSection.findFirst();
    if (existing) return existing;
    return this.prisma.aboutCompanyMoqPaymentSection.create({ data: {} });
  }

  async findMoqPaymentSection(locale: string = DEFAULT_LOCALE) {
    return toAboutCompanyMoqPaymentSection(
      await this.getOrCreateMoqPaymentSection(),
      locale,
    );
  }

  async updateMoqPaymentSection(dto: UpdateAboutCompanyMoqPaymentSectionDto) {
    const existing = await this.getOrCreateMoqPaymentSection();
    const updated = await this.prisma.aboutCompanyMoqPaymentSection.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        heading: dto.heading,
        introduction: dto.introduction,
        supplyCapacityTitle: dto.supply_capacity_title,
        supplyCapacityDescription: dto.supply_capacity_description,
        commitmentTitle: dto.commitment_title,
        commitmentDescription: dto.commitment_description,
        ctaTitle: dto.cta_title,
        ctaDescription: dto.cta_description,
        ctaButtonLabel: dto.cta_button_label,
        ctaButtonHref: dto.cta_button_href,
        translations: dto.translations,
      },
    });
    return toAboutCompanyMoqPaymentSection(updated);
  }

  async findMoqPaymentQuickCards(publicOnly = false) {
    const cards = await this.prisma.moqPaymentQuickCard.findMany({
      where: publicOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return cards.map((c) => toMoqPaymentQuickCard(c));
  }

  async createMoqPaymentQuickCard(dto: CreateMoqPaymentQuickCardDto) {
    const count = await this.prisma.moqPaymentQuickCard.count();
    const card = await this.prisma.moqPaymentQuickCard.create({
      data: {
        label: dto.label,
        value: dto.value ?? '',
        icon: dto.icon ?? 'container',
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toMoqPaymentQuickCard(card);
  }

  async updateMoqPaymentQuickCard(
    id: string,
    dto: UpdateMoqPaymentQuickCardDto,
  ) {
    await this.assertExists(this.prisma.moqPaymentQuickCard, id, 'Quick card');
    const card = await this.prisma.moqPaymentQuickCard.update({
      where: { id },
      data: {
        label: dto.label,
        value: dto.value,
        icon: dto.icon,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toMoqPaymentQuickCard(card);
  }

  async removeMoqPaymentQuickCard(id: string) {
    await this.assertExists(this.prisma.moqPaymentQuickCard, id, 'Quick card');
    await this.prisma.moqPaymentQuickCard.delete({ where: { id } });
    return { deleted: true };
  }

  async findMoqPaymentBusinessTerms(publicOnly = false) {
    const terms = await this.prisma.moqPaymentBusinessTerm.findMany({
      where: publicOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return terms.map((t) => toMoqPaymentBusinessTerm(t));
  }

  async createMoqPaymentBusinessTerm(dto: CreateMoqPaymentBusinessTermDto) {
    const count = await this.prisma.moqPaymentBusinessTerm.count();
    const term = await this.prisma.moqPaymentBusinessTerm.create({
      data: {
        label: dto.label,
        value: dto.value,
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toMoqPaymentBusinessTerm(term);
  }

  async updateMoqPaymentBusinessTerm(
    id: string,
    dto: UpdateMoqPaymentBusinessTermDto,
  ) {
    await this.assertExists(
      this.prisma.moqPaymentBusinessTerm,
      id,
      'Business term',
    );
    const term = await this.prisma.moqPaymentBusinessTerm.update({
      where: { id },
      data: {
        label: dto.label,
        value: dto.value,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toMoqPaymentBusinessTerm(term);
  }

  async removeMoqPaymentBusinessTerm(id: string) {
    await this.assertExists(
      this.prisma.moqPaymentBusinessTerm,
      id,
      'Business term',
    );
    await this.prisma.moqPaymentBusinessTerm.delete({ where: { id } });
    return { deleted: true };
  }

  // ── "Facilities → Shipment Terms" ───────────────────────────────────────

  private async getOrCreateShipmentTermsSection() {
    const existing =
      await this.prisma.aboutCompanyShipmentTermsSection.findFirst();
    if (existing) return existing;
    return this.prisma.aboutCompanyShipmentTermsSection.create({ data: {} });
  }

  async findShipmentTermsSection(locale: string = DEFAULT_LOCALE) {
    return toAboutCompanyShipmentTermsSection(
      await this.getOrCreateShipmentTermsSection(),
      locale,
    );
  }

  async updateShipmentTermsSection(
    dto: UpdateAboutCompanyShipmentTermsSectionDto,
  ) {
    const existing = await this.getOrCreateShipmentTermsSection();
    const updated = await this.prisma.aboutCompanyShipmentTermsSection.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        heading: dto.heading,
        introduction: dto.introduction,
        commitmentTitle: dto.commitment_title,
        commitmentDescription: dto.commitment_description,
        ctaLabel: dto.cta_label,
        ctaHref: dto.cta_href,
        ctaOpenNewTab: dto.cta_open_new_tab,
        translations: dto.translations,
      },
    });
    return toAboutCompanyShipmentTermsSection(updated);
  }

  async findShippingArrangementItems(publicOnly = false) {
    const items = await this.prisma.shippingArrangementItem.findMany({
      where: publicOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return items.map((i) => toShippingArrangementItem(i));
  }

  async createShippingArrangementItem(dto: CreateShippingArrangementItemDto) {
    const count = await this.prisma.shippingArrangementItem.count();
    const item = await this.prisma.shippingArrangementItem.create({
      data: {
        icon: dto.icon ?? 'ship',
        title: dto.title,
        value: dto.value,
        description: dto.description ?? '',
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toShippingArrangementItem(item);
  }

  async updateShippingArrangementItem(
    id: string,
    dto: UpdateShippingArrangementItemDto,
  ) {
    await this.assertExists(
      this.prisma.shippingArrangementItem,
      id,
      'Shipping arrangement item',
    );
    const item = await this.prisma.shippingArrangementItem.update({
      where: { id },
      data: {
        icon: dto.icon,
        title: dto.title,
        value: dto.value,
        description: dto.description,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toShippingArrangementItem(item);
  }

  async removeShippingArrangementItem(id: string) {
    await this.assertExists(
      this.prisma.shippingArrangementItem,
      id,
      'Shipping arrangement item',
    );
    await this.prisma.shippingArrangementItem.delete({ where: { id } });
    return { deleted: true };
  }

  async findShipmentLoadingLocations(publicOnly = false) {
    const locations = await this.prisma.shipmentLoadingLocation.findMany({
      where: publicOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return locations.map((l) => toShipmentLoadingLocation(l));
  }

  async createShipmentLoadingLocation(dto: CreateShipmentLoadingLocationDto) {
    const count = await this.prisma.shipmentLoadingLocation.count();
    const location = await this.prisma.shipmentLoadingLocation.create({
      data: {
        name: dto.name,
        region: dto.region ?? '',
        country: dto.country ?? '',
        mapsUrl: dto.maps_url,
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toShipmentLoadingLocation(location);
  }

  async updateShipmentLoadingLocation(
    id: string,
    dto: UpdateShipmentLoadingLocationDto,
  ) {
    await this.assertExists(
      this.prisma.shipmentLoadingLocation,
      id,
      'Loading location',
    );
    const location = await this.prisma.shipmentLoadingLocation.update({
      where: { id },
      data: {
        name: dto.name,
        region: dto.region,
        country: dto.country,
        mapsUrl: dto.maps_url,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toShipmentLoadingLocation(location);
  }

  async removeShipmentLoadingLocation(id: string) {
    await this.assertExists(
      this.prisma.shipmentLoadingLocation,
      id,
      'Loading location',
    );
    await this.prisma.shipmentLoadingLocation.delete({ where: { id } });
    return { deleted: true };
  }

  async findShipmentContainerTypes(publicOnly = false) {
    const types = await this.prisma.shipmentContainerType.findMany({
      where: publicOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return types.map((t) => toShipmentContainerType(t));
  }

  async createShipmentContainerType(dto: CreateShipmentContainerTypeDto) {
    const count = await this.prisma.shipmentContainerType.count();
    const type = await this.prisma.shipmentContainerType.create({
      data: {
        label: dto.label,
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toShipmentContainerType(type);
  }

  async updateShipmentContainerType(
    id: string,
    dto: UpdateShipmentContainerTypeDto,
  ) {
    await this.assertExists(
      this.prisma.shipmentContainerType,
      id,
      'Container type',
    );
    const type = await this.prisma.shipmentContainerType.update({
      where: { id },
      data: {
        label: dto.label,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toShipmentContainerType(type);
  }

  async removeShipmentContainerType(id: string) {
    await this.assertExists(
      this.prisma.shipmentContainerType,
      id,
      'Container type',
    );
    await this.prisma.shipmentContainerType.delete({ where: { id } });
    return { deleted: true };
  }

  async findShipmentScheduleSteps(publicOnly = false) {
    const steps = await this.prisma.shipmentScheduleStep.findMany({
      where: publicOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return steps.map((s) => toShipmentScheduleStep(s));
  }

  async createShipmentScheduleStep(dto: CreateShipmentScheduleStepDto) {
    const count = await this.prisma.shipmentScheduleStep.count();
    const step = await this.prisma.shipmentScheduleStep.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        icon: dto.icon ?? 'calendar',
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toShipmentScheduleStep(step);
  }

  async updateShipmentScheduleStep(
    id: string,
    dto: UpdateShipmentScheduleStepDto,
  ) {
    await this.assertExists(
      this.prisma.shipmentScheduleStep,
      id,
      'Schedule step',
    );
    const step = await this.prisma.shipmentScheduleStep.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toShipmentScheduleStep(step);
  }

  async removeShipmentScheduleStep(id: string) {
    await this.assertExists(
      this.prisma.shipmentScheduleStep,
      id,
      'Schedule step',
    );
    await this.prisma.shipmentScheduleStep.delete({ where: { id } });
    return { deleted: true };
  }

  async findShipmentDocuments(publicOnly = false) {
    const documents = await this.prisma.shipmentDocument.findMany({
      where: publicOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return documents.map((d) => toShipmentDocument(d));
  }

  async createShipmentDocument(dto: CreateShipmentDocumentDto) {
    const count = await this.prisma.shipmentDocument.count();
    const document = await this.prisma.shipmentDocument.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        url: dto.url,
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toShipmentDocument(document);
  }

  async updateShipmentDocument(id: string, dto: UpdateShipmentDocumentDto) {
    await this.assertExists(this.prisma.shipmentDocument, id, 'Document');
    const document = await this.prisma.shipmentDocument.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        url: dto.url,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toShipmentDocument(document);
  }

  async removeShipmentDocument(id: string) {
    await this.assertExists(this.prisma.shipmentDocument, id, 'Document');
    await this.prisma.shipmentDocument.delete({ where: { id } });
    return { deleted: true };
  }

  async findShipmentCommitmentItems(publicOnly = false) {
    const items = await this.prisma.shipmentCommitmentItem.findMany({
      where: publicOnly ? { active: true } : undefined,
      orderBy: { order: 'asc' },
    });
    return items.map((i) => toShipmentCommitmentItem(i));
  }

  async createShipmentCommitmentItem(dto: CreateShipmentCommitmentItemDto) {
    const count = await this.prisma.shipmentCommitmentItem.count();
    const item = await this.prisma.shipmentCommitmentItem.create({
      data: {
        title: dto.title,
        description: dto.description ?? '',
        icon: dto.icon ?? 'route',
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toShipmentCommitmentItem(item);
  }

  async updateShipmentCommitmentItem(
    id: string,
    dto: UpdateShipmentCommitmentItemDto,
  ) {
    await this.assertExists(
      this.prisma.shipmentCommitmentItem,
      id,
      'Commitment item',
    );
    const item = await this.prisma.shipmentCommitmentItem.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        icon: dto.icon,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toShipmentCommitmentItem(item);
  }

  async removeShipmentCommitmentItem(id: string) {
    await this.assertExists(
      this.prisma.shipmentCommitmentItem,
      id,
      'Commitment item',
    );
    await this.prisma.shipmentCommitmentItem.delete({ where: { id } });
    return { deleted: true };
  }

  // ── "Facilities → FAQ" ───────────────────────────────────────────────────

  private async getOrCreateFacilitiesFaqSection() {
    const existing =
      await this.prisma.aboutCompanyFacilitiesFaqSection.findFirst();
    if (existing) return existing;
    return this.prisma.aboutCompanyFacilitiesFaqSection.create({ data: {} });
  }

  async findFacilitiesFaqSection(locale: string = DEFAULT_LOCALE) {
    return toAboutCompanyFacilitiesFaqSection(
      await this.getOrCreateFacilitiesFaqSection(),
      locale,
    );
  }

  async updateFacilitiesFaqSection(
    dto: UpdateAboutCompanyFacilitiesFaqSectionDto,
  ) {
    const existing = await this.getOrCreateFacilitiesFaqSection();
    const updated = await this.prisma.aboutCompanyFacilitiesFaqSection.update({
      where: { id: existing.id },
      data: {
        eyebrow: dto.eyebrow,
        heading: dto.heading,
        description: dto.description,
        accordionMode: dto.accordion_mode,
        ctaTitle: dto.cta_title,
        ctaDescription: dto.cta_description,
        ctaPrimaryLabel: dto.cta_primary_label,
        ctaPrimaryHref: dto.cta_primary_href,
        ctaSecondaryLabel: dto.cta_secondary_label,
        ctaSecondaryHref: dto.cta_secondary_href,
        translations: dto.translations,
      },
    });
    return toAboutCompanyFacilitiesFaqSection(updated);
  }

  async findFacilitiesFaqItems(publicOnly = false) {
    const items = await this.prisma.facilitiesFaqItem.findMany({
      where: publicOnly ? { active: true } : undefined,
      include: { tags: true },
      orderBy: { order: 'asc' },
    });
    return items.map((i) => toFacilitiesFaqItem(i));
  }

  async createFacilitiesFaqItem(dto: CreateFacilitiesFaqItemDto) {
    const count = await this.prisma.facilitiesFaqItem.count();
    const item = await this.prisma.facilitiesFaqItem.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        category: dto.category ?? '',
        icon: dto.icon,
        featured: dto.featured ?? false,
        highlightText: dto.highlight_text,
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
      include: { tags: true },
    });
    return toFacilitiesFaqItem(item);
  }

  async updateFacilitiesFaqItem(id: string, dto: UpdateFacilitiesFaqItemDto) {
    await this.assertExists(this.prisma.facilitiesFaqItem, id, 'FAQ item');
    const item = await this.prisma.facilitiesFaqItem.update({
      where: { id },
      data: {
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        icon: dto.icon,
        featured: dto.featured,
        highlightText: dto.highlight_text,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
      include: { tags: true },
    });
    return toFacilitiesFaqItem(item);
  }

  async removeFacilitiesFaqItem(id: string) {
    await this.assertExists(this.prisma.facilitiesFaqItem, id, 'FAQ item');
    await this.prisma.facilitiesFaqItem.delete({ where: { id } });
    return { deleted: true };
  }

  async findFacilitiesFaqTags(faqItemId: string, publicOnly = false) {
    const tags = await this.prisma.facilitiesFaqProductTag.findMany({
      where: publicOnly ? { faqItemId, active: true } : { faqItemId },
      orderBy: { order: 'asc' },
    });
    return tags.map((t) => toFacilitiesFaqProductTag(t));
  }

  async createFacilitiesFaqTag(dto: CreateFacilitiesFaqProductTagDto) {
    await this.assertExists(
      this.prisma.facilitiesFaqItem,
      dto.faq_item_id,
      'FAQ item',
    );
    const count = await this.prisma.facilitiesFaqProductTag.count({
      where: { faqItemId: dto.faq_item_id },
    });
    const tag = await this.prisma.facilitiesFaqProductTag.create({
      data: {
        faqItemId: dto.faq_item_id,
        name: dto.name,
        order: dto.order ?? count,
        active: dto.active ?? true,
        translations: dto.translations,
      },
    });
    return toFacilitiesFaqProductTag(tag);
  }

  async updateFacilitiesFaqTag(
    id: string,
    dto: UpdateFacilitiesFaqProductTagDto,
  ) {
    await this.assertExists(
      this.prisma.facilitiesFaqProductTag,
      id,
      'Product tag',
    );
    const tag = await this.prisma.facilitiesFaqProductTag.update({
      where: { id },
      data: {
        name: dto.name,
        order: dto.order,
        active: dto.active,
        translations: dto.translations,
      },
    });
    return toFacilitiesFaqProductTag(tag);
  }

  async removeFacilitiesFaqTag(id: string) {
    await this.assertExists(
      this.prisma.facilitiesFaqProductTag,
      id,
      'Product tag',
    );
    await this.prisma.facilitiesFaqProductTag.delete({ where: { id } });
    return { deleted: true };
  }

  async addFactoryDocument(dto: CreateFactoryDocumentDto) {
    const factory = await this.getOrCreateFactory();
    const count = await this.prisma.factoryDocument.count({
      where: { factoryId: factory.id },
    });
    await this.prisma.factoryDocument.create({
      data: {
        factoryId: factory.id,
        title: dto.title,
        fileId: dto.file_id,
        description: dto.description,
        order: dto.order ?? count,
        active: dto.active ?? true,
      },
    });
    return this.findFactory();
  }

  async updateFactoryDocument(id: string, dto: UpdateFactoryDocumentDto) {
    await this.assertExists(this.prisma.factoryDocument, id, 'Document');
    await this.prisma.factoryDocument.update({
      where: { id },
      data: {
        title: dto.title,
        fileId: dto.file_id,
        description: dto.description,
        order: dto.order,
        active: dto.active,
      },
    });
    return this.findFactory();
  }

  async removeFactoryDocument(id: string) {
    await this.assertExists(this.prisma.factoryDocument, id, 'Document');
    await this.prisma.factoryDocument.delete({ where: { id } });
    return this.findFactory();
  }

  async addFactoryVideo(dto: CreateFactoryVideoDto) {
    const factory = await this.getOrCreateFactory();
    const count = await this.prisma.factoryVideo.count({
      where: { factoryId: factory.id },
    });
    await this.prisma.factoryVideo.create({
      data: {
        factoryId: factory.id,
        title: dto.title,
        tiktokUrl: dto.tiktok_url,
        description: dto.description,
        order: dto.order ?? count,
        featured: dto.featured ?? false,
        active: dto.active ?? true,
      },
    });
    return this.findFactory();
  }

  async updateFactoryVideo(id: string, dto: UpdateFactoryVideoDto) {
    await this.assertExists(this.prisma.factoryVideo, id, 'Video');
    await this.prisma.factoryVideo.update({
      where: { id },
      data: {
        title: dto.title,
        tiktokUrl: dto.tiktok_url,
        description: dto.description,
        order: dto.order,
        featured: dto.featured,
        active: dto.active,
      },
    });
    return this.findFactory();
  }

  async removeFactoryVideo(id: string) {
    await this.assertExists(this.prisma.factoryVideo, id, 'Video');
    await this.prisma.factoryVideo.delete({ where: { id } });
    return this.findFactory();
  }

  // ── Settings (singleton) ─────────────────────────────────────────────────

  private async getOrCreateSettings() {
    const existing = await this.prisma.aboutCompanySettings.findFirst({
      include: SETTINGS_INCLUDE,
    });
    if (existing) return existing;
    return this.prisma.aboutCompanySettings.create({
      data: {},
      include: SETTINGS_INCLUDE,
    });
  }

  async findSettings() {
    const entry = await this.getOrCreateSettings();
    return toAboutCompanySettings(entry);
  }

  async updateSettings(dto: UpdateAboutCompanySettingsDto) {
    const existing = await this.getOrCreateSettings();
    const updated = await this.prisma.aboutCompanySettings.update({
      where: { id: existing.id },
      data: {
        pageTitle: dto.page_title,
        pageSubtitle: dto.page_subtitle,
        seoTitle: dto.seo_title,
        seoDescription: dto.seo_description,
        ogImageId: dto.og_image_id,
        visible: dto.visible,
      },
      include: SETTINGS_INCLUDE,
    });
    return toAboutCompanySettings(updated);
  }

  // ── Homepage-Manager-style Draft/Publish ─────────────────────────────────

  async getSections() {
    await this.ensureSectionConfigsSeeded();
    const [configs, lastPublishedAt, perSectionChangedAt] = await Promise.all([
      this.prisma.aboutCompanySectionConfig.findMany({
        orderBy: { order: 'asc' },
      }),
      this.lastPublishedAt(),
      this.sectionDraftChangedAt(),
    ]);
    return configs.map((config) => {
      const changedAt = perSectionChangedAt[config.key] ?? config.updatedAt;
      const hasUnpublishedChanges =
        !lastPublishedAt ||
        changedAt > lastPublishedAt ||
        config.updatedAt > lastPublishedAt;
      return toAboutCompanySectionConfig(config, hasUnpublishedChanges);
    });
  }

  private async lastPublishedAt(): Promise<Date | null> {
    const latest = await this.prisma.aboutCompanyPublishedSnapshot.findFirst({
      orderBy: { publishedAt: 'desc' },
      select: { publishedAt: true },
    });
    return latest?.publishedAt ?? null;
  }

  /**
   * Newest draft-table `updatedAt` per section key. Child rows count towards their parent
   * section (a renamed gallery caption makes "CV. Putri Palma Nusantara" a Draft), which is
   * what makes the per-section Published/Draft badge in the overview truthful rather than a
   * whole-page flag repeated five times.
   */
  private async sectionDraftChangedAt(): Promise<Record<string, Date | null>> {
    const [
      profile,
      profileGallery,
      facts,
      exportDestinations,
      team,
      teamSection,
      whatWeDo,
      legal,
      legalSection,
      legalCategories,
      factory,
      factoryGallery,
      factoryDocuments,
      factoryVideos,
      facilities,
      facilityGallery,
      facilitiesSection,
      moqPaymentSection,
      moqPaymentQuickCards,
      moqPaymentBusinessTerms,
      shipmentTermsSection,
      shippingArrangementItems,
      shipmentLoadingLocations,
      shipmentContainerTypes,
      shipmentScheduleSteps,
      shipmentDocuments,
      shipmentCommitmentItems,
      facilitiesFaqSection,
      facilitiesFaqItems,
      facilitiesFaqTags,
    ] = await Promise.all([
      this.latestUpdatedAt(this.prisma.aboutCompanyProfile),
      this.latestUpdatedAt(this.prisma.aboutCompanyGalleryImage),
      this.latestUpdatedAt(this.prisma.aboutCompanyFact),
      // Export destinations are shared with the Homepage map but are *published* into the
      // About snapshot, so editing one there also leaves this section with a pending change.
      this.latestUpdatedAt(this.prisma.exportDestination),
      this.latestUpdatedAt(this.prisma.teamMember),
      this.latestUpdatedAt(this.prisma.aboutCompanyTeamSection),
      this.latestUpdatedAt(this.prisma.whatWeDoItem),
      this.latestUpdatedAt(this.prisma.legalCertificateDocument),
      this.latestUpdatedAt(this.prisma.aboutCompanyLegalSection),
      this.latestUpdatedAt(this.prisma.legalDocumentCategory),
      this.latestUpdatedAt(this.prisma.factoryProfile),
      this.latestUpdatedAt(this.prisma.factoryGalleryImage),
      this.latestUpdatedAt(this.prisma.factoryDocument),
      this.latestUpdatedAt(this.prisma.factoryVideo),
      this.latestUpdatedAt(this.prisma.facility),
      this.latestUpdatedAt(this.prisma.facilityGalleryImage),
      this.latestUpdatedAt(this.prisma.aboutCompanyFacilitiesSection),
      this.latestUpdatedAt(this.prisma.aboutCompanyMoqPaymentSection),
      this.latestUpdatedAt(this.prisma.moqPaymentQuickCard),
      this.latestUpdatedAt(this.prisma.moqPaymentBusinessTerm),
      this.latestUpdatedAt(this.prisma.aboutCompanyShipmentTermsSection),
      this.latestUpdatedAt(this.prisma.shippingArrangementItem),
      this.latestUpdatedAt(this.prisma.shipmentLoadingLocation),
      this.latestUpdatedAt(this.prisma.shipmentContainerType),
      this.latestUpdatedAt(this.prisma.shipmentScheduleStep),
      this.latestUpdatedAt(this.prisma.shipmentDocument),
      this.latestUpdatedAt(this.prisma.shipmentCommitmentItem),
      this.latestUpdatedAt(this.prisma.aboutCompanyFacilitiesFaqSection),
      this.latestUpdatedAt(this.prisma.facilitiesFaqItem),
      this.latestUpdatedAt(this.prisma.facilitiesFaqProductTag),
    ]);

    return {
      company: newest(profile, profileGallery, facts, exportDestinations),
      team: newest(team, teamSection),
      what_we_do: whatWeDo,
      legal_certificate: newest(legal, legalSection, legalCategories),
      factory: newest(factory, factoryGallery, factoryDocuments, factoryVideos),
      facilities: newest(facilities, facilityGallery, facilitiesSection),
      moq_payment_terms: newest(
        moqPaymentSection,
        moqPaymentQuickCards,
        moqPaymentBusinessTerms,
      ),
      shipment_terms: newest(
        shipmentTermsSection,
        shippingArrangementItems,
        shipmentLoadingLocations,
        shipmentContainerTypes,
        shipmentScheduleSteps,
        shipmentDocuments,
        shipmentCommitmentItems,
      ),
      facilities_faq: newest(
        facilitiesFaqSection,
        facilitiesFaqItems,
        facilitiesFaqTags,
      ),
    };
  }

  private async latestUpdatedAt(delegate: unknown): Promise<Date | null> {
    type TimestampedDelegate = {
      findFirst: (args: {
        orderBy: { updatedAt: 'desc' };
        select: { updatedAt: true };
      }) => Promise<{ updatedAt: Date } | null>;
    };
    const row = await (delegate as TimestampedDelegate).findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });
    return row?.updatedAt ?? null;
  }

  /**
   * Flat, presentation-free index of every piece of About Company content — one request backing
   * the Manager's search box, filter chips and sort selector (brief items 4/46/47/48). Reuses
   * the same draft tables the editors write to, so a result is always something the Admin can
   * actually open.
   */
  async getSearchIndex(): Promise<AboutCompanySearchItem[]> {
    await this.ensureSectionConfigsSeeded();
    const [
      configs,
      profile,
      facts,
      teamMembers,
      whatWeDoItems,
      legalDocuments,
      factory,
      facilities,
      moqPaymentQuickCards,
      moqPaymentBusinessTerms,
      shippingArrangementItems,
      shipmentLoadingLocations,
      shipmentContainerTypes,
      shipmentScheduleSteps,
      shipmentDocuments,
      shipmentCommitmentItems,
      facilitiesFaqItems,
    ] = await Promise.all([
      this.prisma.aboutCompanySectionConfig.findMany({
        orderBy: { order: 'asc' },
      }),
      this.getOrCreateProfile(),
      this.prisma.aboutCompanyFact.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.teamMember.findMany({
        include: TEAM_MEMBER_INCLUDE,
        orderBy: { order: 'asc' },
      }),
      this.prisma.whatWeDoItem.findMany({
        include: WHAT_WE_DO_INCLUDE,
        orderBy: { order: 'asc' },
      }),
      this.prisma.legalCertificateDocument.findMany({
        include: LEGAL_DOCUMENT_INCLUDE,
        orderBy: { order: 'asc' },
      }),
      this.getOrCreateFactory(),
      this.prisma.facility.findMany({
        include: FACILITY_INCLUDE,
        orderBy: { order: 'asc' },
      }),
      this.prisma.moqPaymentQuickCard.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.moqPaymentBusinessTerm.findMany({
        orderBy: { order: 'asc' },
      }),
      this.prisma.shippingArrangementItem.findMany({
        orderBy: { order: 'asc' },
      }),
      this.prisma.shipmentLoadingLocation.findMany({
        orderBy: { order: 'asc' },
      }),
      this.prisma.shipmentContainerType.findMany({
        orderBy: { order: 'asc' },
      }),
      this.prisma.shipmentScheduleStep.findMany({
        orderBy: { order: 'asc' },
      }),
      this.prisma.shipmentDocument.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.shipmentCommitmentItem.findMany({
        orderBy: { order: 'asc' },
      }),
      this.prisma.facilitiesFaqItem.findMany({
        include: { tags: true },
        orderBy: { order: 'asc' },
      }),
    ]);

    const items: AboutCompanySearchItem[] = [];

    for (const config of configs) {
      // `key` is a plain string column; the guard covers a row whose key isn't (or is no
      // longer) one of the five known sections rather than emitting a blank search result.
      const sectionKey = config.key as AboutCompanySearchItem['section_key'];
      const meta: { label: string; description: string } | undefined =
        SECTION_SEARCH_META[sectionKey];
      if (!meta) continue;
      items.push({
        id: config.id,
        type: 'section',
        section_key: sectionKey,
        label: meta.label,
        sublabel: meta.description,
        active: config.visible,
        featured: false,
        file_name: null,
        file_type: null,
        order: config.order,
        updated_at: config.updatedAt.toISOString(),
      });
    }

    for (const image of profile.gallery) {
      items.push({
        id: image.id,
        type: 'gallery_image',
        section_key: 'company',
        label: image.caption || image.altText || 'Gambar galeri',
        sublabel: 'Company Gallery',
        active: null,
        featured: image.featured,
        file_name: image.media.altText,
        file_type: image.media.fileType,
        order: image.order,
        updated_at: image.updatedAt.toISOString(),
      });
    }

    for (const fact of facts) {
      items.push({
        id: fact.id,
        type: 'fact',
        section_key: 'company',
        label: fact.label,
        sublabel: fact.value,
        active: fact.active,
        featured: false,
        file_name: null,
        file_type: null,
        order: fact.order,
        updated_at: fact.updatedAt.toISOString(),
      });
    }

    for (const member of teamMembers) {
      items.push({
        id: member.id,
        type: 'team_member',
        section_key: 'team',
        label: member.name,
        sublabel: member.position,
        active: member.active,
        featured: member.featured,
        file_name: member.photo?.altText ?? null,
        file_type:
          (member.photo?.fileType as AboutCompanySearchItem['file_type']) ??
          null,
        order: member.order,
        updated_at: member.updatedAt.toISOString(),
      });
    }

    for (const item of whatWeDoItems) {
      items.push({
        id: item.id,
        type: 'activity',
        section_key: 'what_we_do',
        label: item.title,
        sublabel: item.shortDescription || null,
        active: item.active,
        featured: item.featured,
        file_name: item.media?.altText ?? null,
        file_type:
          (item.media?.fileType as AboutCompanySearchItem['file_type']) ?? null,
        order: item.order,
        updated_at: item.updatedAt.toISOString(),
      });
    }

    for (const doc of legalDocuments) {
      items.push({
        id: doc.id,
        type: 'document',
        section_key: 'legal_certificate',
        label: doc.title,
        sublabel:
          [doc.issuingOrganization, doc.documentNumber]
            .filter(Boolean)
            .join(' · ') || LEGAL_DOCUMENT_TYPE_SEARCH_LABELS[doc.documentType],
        active: doc.active,
        featured: doc.featured,
        file_name: doc.file?.altText ?? null,
        file_type:
          (doc.file?.fileType as AboutCompanySearchItem['file_type']) ?? null,
        order: doc.order,
        updated_at: doc.updatedAt.toISOString(),
      });
    }

    for (const image of factory.gallery) {
      items.push({
        id: image.id,
        type: 'factory_image',
        section_key: 'factory',
        label: image.title || image.caption || 'Foto factory',
        sublabel:
          image.caption && image.title ? image.caption : 'Factory Gallery',
        active: image.active,
        featured: image.featured,
        file_name: image.media.altText,
        file_type: image.media.fileType,
        order: image.order,
        updated_at: image.updatedAt.toISOString(),
      });
    }

    for (const doc of factory.documents) {
      items.push({
        id: doc.id,
        type: 'factory_document',
        section_key: 'factory',
        label: doc.title,
        sublabel: doc.description || 'Factory Document',
        active: doc.active,
        featured: false,
        file_name: doc.file?.altText ?? null,
        file_type:
          (doc.file?.fileType as AboutCompanySearchItem['file_type']) ?? null,
        order: doc.order,
        updated_at: doc.updatedAt.toISOString(),
      });
    }

    for (const facility of facilities) {
      items.push({
        id: facility.id,
        type: 'facility',
        section_key: 'facilities',
        label: facility.name,
        sublabel: facility.description || null,
        active: facility.active,
        featured: facility.featured,
        file_name: facility.coverImage?.altText ?? null,
        file_type:
          (facility.coverImage
            ?.fileType as AboutCompanySearchItem['file_type']) ?? null,
        order: facility.order,
        updated_at: facility.updatedAt.toISOString(),
      });

      for (const image of facility.gallery) {
        items.push({
          id: image.id,
          type: 'facility_image',
          section_key: 'facilities',
          label: image.title || image.caption || 'Foto fasilitas',
          sublabel: `${facility.name} — Gallery`,
          active: image.active,
          featured: image.featured,
          file_name: image.media.altText,
          file_type: image.media.fileType,
          order: image.order,
          updated_at: image.updatedAt.toISOString(),
        });
      }
    }

    for (const card of moqPaymentQuickCards) {
      items.push({
        id: card.id,
        type: 'moq_quick_card',
        section_key: 'moq_payment_terms',
        label: card.label,
        sublabel: card.value || null,
        active: card.active,
        featured: false,
        file_name: null,
        file_type: null,
        order: card.order,
        updated_at: card.updatedAt.toISOString(),
      });
    }

    for (const term of moqPaymentBusinessTerms) {
      items.push({
        id: term.id,
        type: 'moq_business_term',
        section_key: 'moq_payment_terms',
        label: term.label,
        sublabel: term.value || null,
        active: term.active,
        featured: false,
        file_name: null,
        file_type: null,
        order: term.order,
        updated_at: term.updatedAt.toISOString(),
      });
    }

    for (const item of shippingArrangementItems) {
      items.push({
        id: item.id,
        type: 'shipment_item',
        section_key: 'shipment_terms',
        label: item.title,
        sublabel: item.value || null,
        active: item.active,
        featured: false,
        file_name: null,
        file_type: null,
        order: item.order,
        updated_at: item.updatedAt.toISOString(),
      });
    }

    for (const location of shipmentLoadingLocations) {
      items.push({
        id: location.id,
        type: 'shipment_location',
        section_key: 'shipment_terms',
        label: location.name,
        sublabel:
          [location.region, location.country].filter(Boolean).join(', ') ||
          null,
        active: location.active,
        featured: false,
        file_name: null,
        file_type: null,
        order: location.order,
        updated_at: location.updatedAt.toISOString(),
      });
    }

    for (const type of shipmentContainerTypes) {
      items.push({
        id: type.id,
        type: 'shipment_container',
        section_key: 'shipment_terms',
        label: type.label,
        sublabel: null,
        active: type.active,
        featured: false,
        file_name: null,
        file_type: null,
        order: type.order,
        updated_at: type.updatedAt.toISOString(),
      });
    }

    for (const step of shipmentScheduleSteps) {
      items.push({
        id: step.id,
        type: 'shipment_schedule',
        section_key: 'shipment_terms',
        label: step.name,
        sublabel: step.description || null,
        active: step.active,
        featured: false,
        file_name: null,
        file_type: null,
        order: step.order,
        updated_at: step.updatedAt.toISOString(),
      });
    }

    for (const document of shipmentDocuments) {
      items.push({
        id: document.id,
        type: 'shipment_document',
        section_key: 'shipment_terms',
        label: document.name,
        sublabel: document.description || null,
        active: document.active,
        featured: false,
        file_name: null,
        file_type: null,
        order: document.order,
        updated_at: document.updatedAt.toISOString(),
      });
    }

    for (const item of shipmentCommitmentItems) {
      items.push({
        id: item.id,
        type: 'shipment_commitment',
        section_key: 'shipment_terms',
        label: item.title,
        sublabel: item.description || null,
        active: item.active,
        featured: false,
        file_name: null,
        file_type: null,
        order: item.order,
        updated_at: item.updatedAt.toISOString(),
      });
    }

    for (const faqItem of facilitiesFaqItems) {
      items.push({
        id: faqItem.id,
        type: 'facilities_faq_item',
        section_key: 'facilities_faq',
        label: faqItem.question,
        sublabel: faqItem.highlightText || null,
        active: faqItem.active,
        featured: faqItem.featured,
        file_name: null,
        file_type: null,
        order: faqItem.order,
        updated_at: faqItem.updatedAt.toISOString(),
      });
      for (const tag of faqItem.tags) {
        items.push({
          id: tag.id,
          type: 'facilities_faq_tag',
          section_key: 'facilities_faq',
          label: tag.name,
          sublabel: faqItem.question,
          active: tag.active,
          featured: false,
          file_name: null,
          file_type: null,
          order: tag.order,
          updated_at: tag.updatedAt.toISOString(),
        });
      }
    }

    return items;
  }

  async updateSection(key: string, dto: UpdateAboutCompanySectionDto) {
    await this.ensureSectionConfigsSeeded();
    if (!ABOUT_COMPANY_SECTION_KEYS.includes(key as never)) {
      throw new ApiException(
        'NOT_FOUND',
        'Unknown About Company section.',
        404,
      );
    }
    const updated = await this.prisma.aboutCompanySectionConfig.update({
      where: { key },
      data: { order: dto.order, visible: dto.visible },
    });
    return toAboutCompanySectionConfig(updated);
  }

  private async ensureSectionConfigsSeeded() {
    // `>=` (not `>`) — a deployment that already seeded the original 5 keys must still get the
    // one newly-added key (e.g. "facilities") backfilled, not skip seeding forever because a
    // row count already existed from before this key was introduced.
    const count = await this.prisma.aboutCompanySectionConfig.count();
    if (count >= ABOUT_COMPANY_SECTION_KEYS.length) return;
    await this.prisma.aboutCompanySectionConfig.createMany({
      data: ABOUT_COMPANY_SECTION_KEYS.map((key, order) => ({ key, order })),
      skipDuplicates: true,
    });
  }

  async getPublishStatus() {
    const lastPublishedAt = await this.lastPublishedAt();

    if (!lastPublishedAt) {
      return { last_published_at: null, has_unpublished_changes: true };
    }

    const latestChange = await this.latestDraftChangeAt();
    return {
      last_published_at: lastPublishedAt.toISOString(),
      has_unpublished_changes: !latestChange || latestChange > lastPublishedAt,
    };
  }

  private async latestDraftChangeAt(): Promise<Date | null> {
    const perSection = await this.sectionDraftChangedAt();
    const [settings, sectionConfig] = await Promise.all([
      this.latestUpdatedAt(this.prisma.aboutCompanySettings),
      this.latestUpdatedAt(this.prisma.aboutCompanySectionConfig),
    ]);
    return newest(...Object.values(perSection), settings, sectionConfig);
  }

  private async buildSnapshotPayload() {
    await this.ensureSectionConfigsSeeded();
    const [
      profile,
      facts,
      exportDestinations,
      socialLinks,
      companyProfileCountries,
      teamMembers,
      teamSection,
      whatWeDoSection,
      whatWeDoItems,
      whoWeSupplyItems,
      legalDocuments,
      legalSection,
      legalCategories,
      factory,
      facilities,
      facilitiesSection,
      moqPaymentSection,
      moqPaymentQuickCards,
      moqPaymentBusinessTerms,
      shipmentTermsSection,
      shippingArrangementItems,
      shipmentLoadingLocations,
      shipmentContainerTypes,
      shipmentScheduleSteps,
      shipmentDocuments,
      shipmentCommitmentItems,
      facilitiesFaqSection,
      facilitiesFaqItems,
      settings,
      sectionConfig,
    ] = await Promise.all([
      this.getOrCreateProfile(),
      this.prisma.aboutCompanyFact.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      // Only confirmed, currently-active destinations are ever published — same dual gate the
      // Homepage map uses, so the two surfaces can never disagree about where PPN exports.
      this.prisma.exportDestination.findMany({
        where: { enabled: true, exportStatus: 'active_destination' },
        include: EXPORT_DESTINATION_INCLUDE,
        orderBy: { order: 'asc' },
      }),
      this.prisma.aboutCompanySocialLink.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      // Independent curation for "Countries We Have Exported To" — `enabled` is still the
      // master kill switch, but never gated by Homepage's own `featured`/exportStatus rules.
      this.prisma.exportDestination.findMany({
        where: { enabled: true, showInCompanyProfile: true },
        include: EXPORT_DESTINATION_INCLUDE,
        orderBy: { order: 'asc' },
      }),
      this.prisma.teamMember.findMany({
        where: { active: true },
        include: TEAM_MEMBER_INCLUDE,
        orderBy: { order: 'asc' },
      }),
      this.getOrCreateTeamSection(),
      this.getOrCreateWhatWeDoSection(),
      this.prisma.whatWeDoItem.findMany({
        where: { active: true },
        include: WHAT_WE_DO_INCLUDE,
        orderBy: { order: 'asc' },
      }),
      this.prisma.whoWeSupplyItem.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.legalCertificateDocument.findMany({
        where: { active: true },
        include: LEGAL_DOCUMENT_INCLUDE,
        orderBy: { order: 'asc' },
      }),
      this.getOrCreateLegalSection(),
      this.prisma.legalDocumentCategory.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.getOrCreateFactory().then((f) => ({
        ...f,
        gallery: f.gallery.filter((g) => g.active),
        documents: f.documents.filter((d) => d.active),
        videos: f.videos.filter((v) => v.active),
      })),
      this.prisma.facility
        .findMany({
          where: { active: true },
          include: FACILITY_INCLUDE,
          orderBy: { order: 'asc' },
        })
        .then((list) =>
          list.map((f) => ({
            ...f,
            gallery: f.gallery.filter((g) => g.active),
          })),
        ),
      this.getOrCreateFacilitiesSection(),
      this.getOrCreateMoqPaymentSection(),
      this.prisma.moqPaymentQuickCard.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.moqPaymentBusinessTerm.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.getOrCreateShipmentTermsSection(),
      this.prisma.shippingArrangementItem.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.shipmentLoadingLocation.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.shipmentContainerType.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.shipmentScheduleStep.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.shipmentDocument.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.shipmentCommitmentItem.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.getOrCreateFacilitiesFaqSection(),
      this.prisma.facilitiesFaqItem.findMany({
        where: { active: true },
        include: { tags: { where: { active: true } } },
        orderBy: { order: 'asc' },
      }),
      this.getOrCreateSettings(),
      this.prisma.aboutCompanySectionConfig.findMany({
        orderBy: { order: 'asc' },
      }),
    ]);

    return {
      profile,
      facts,
      exportDestinations,
      socialLinks,
      companyProfileCountries,
      teamMembers,
      teamSection,
      whatWeDoSection,
      whatWeDoItems,
      whoWeSupplyItems,
      legalDocuments,
      legalSection,
      legalCategories,
      factory,
      facilities,
      facilitiesSection,
      moqPaymentSection,
      moqPaymentQuickCards,
      moqPaymentBusinessTerms,
      shipmentTermsSection,
      shippingArrangementItems,
      shipmentLoadingLocations,
      shipmentContainerTypes,
      shipmentScheduleSteps,
      shipmentDocuments,
      shipmentCommitmentItems,
      facilitiesFaqSection,
      facilitiesFaqItems,
      settings,
      sectionConfig,
    };
  }

  async publishAboutCompany() {
    const payload = await this.buildSnapshotPayload();
    const [snapshot] = await this.prisma.$transaction([
      this.prisma.aboutCompanyPublishedSnapshot.create({
        data: { data: payload as never },
      }),
    ]);
    // One event per bundled publish — this single call already covers all 6 AI source keys
    // (about_company/facilities/moq_payment_terms/shipment_terms/faq/legal_certificates), so a
    // full resync after this one event picks up every one of them in the same rebuild.
    const event: ContentPublishedEvent = { source: 'about_company' };
    this.events.emit(CONTENT_PUBLISHED_EVENT, event);
    return {
      id: snapshot.id,
      published_at: snapshot.publishedAt.toISOString(),
    };
  }

  async listSnapshots() {
    const snapshots = await this.prisma.aboutCompanyPublishedSnapshot.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: { id: true, publishedAt: true },
    });
    return snapshots.map((s) => ({
      id: s.id,
      published_at: s.publishedAt.toISOString(),
    }));
  }

  async restoreSnapshot(id: string) {
    const source = await this.prisma.aboutCompanyPublishedSnapshot.findUnique({
      where: { id },
    });
    if (!source)
      throw new ApiException('NOT_FOUND', 'Snapshot not found.', 404);
    const [snapshot] = await this.prisma.$transaction([
      this.prisma.aboutCompanyPublishedSnapshot.create({
        data: { data: source.data as never },
      }),
    ]);
    return {
      id: snapshot.id,
      published_at: snapshot.publishedAt.toISOString(),
    };
  }

  async getPublishedAboutCompany(locale: string = DEFAULT_LOCALE) {
    const latest = await this.prisma.aboutCompanyPublishedSnapshot.findFirst({
      orderBy: { publishedAt: 'desc' },
    });

    // Nothing published yet → nothing public. Deliberately does NOT fall back to the draft
    // tables: doing so would put unpublished Admin edits straight onto /about, which is exactly
    // what the Draft/Publish split exists to prevent (README "About Company Manager" — Rule 1).
    // `visible: false` makes /about 404 and drops the About Company menu from Header/Footer
    // until the first Publish, so the site never advertises a page with no published content.
    if (!latest) return EMPTY_PUBLISHED_ABOUT_COMPANY;

    const raw = withSnapshotDefaults(
      reviveDates(latest.data as unknown) as Awaited<
        ReturnType<AboutCompanyService['buildSnapshotPayload']>
      >,
    );

    return {
      profile: toAboutCompanyProfile(raw.profile, locale),
      facts: raw.facts.map((f) => toAboutCompanyFact(f, locale)),
      export_destinations: raw.exportDestinations.map((d) =>
        toExportDestination(d, locale),
      ),
      social_links: raw.socialLinks.map((s) => toAboutCompanySocialLink(s)),
      company_profile_countries: raw.companyProfileCountries.map((d) =>
        toExportDestination(d, locale),
      ),
      team_members: raw.teamMembers.map((m) => toTeamMember(m, locale)),
      team_section: toAboutCompanyTeamSection(raw.teamSection, locale),
      what_we_do_section: toAboutCompanyWhatWeDoSection(
        raw.whatWeDoSection,
        locale,
      ),
      what_we_do_items: raw.whatWeDoItems.map((i) => toWhatWeDoItem(i, locale)),
      who_we_supply_items: raw.whoWeSupplyItems.map((i) =>
        toWhoWeSupplyItem(i, locale),
      ),
      legal_documents: raw.legalDocuments.map((d) =>
        toLegalDocument(d, locale),
      ),
      legal_section: toAboutCompanyLegalSection(raw.legalSection, locale),
      legal_categories: raw.legalCategories.map((c) =>
        toLegalDocumentCategory(c, locale),
      ),
      factory: toFactoryProfile(raw.factory, locale),
      facilities: raw.facilities.map((f) => toFacility(f, locale)),
      facilities_section: toAboutCompanyFacilitiesSection(
        raw.facilitiesSection,
        locale,
      ),
      moq_payment_section: toAboutCompanyMoqPaymentSection(
        raw.moqPaymentSection,
        locale,
      ),
      moq_payment_quick_cards: raw.moqPaymentQuickCards.map((c) =>
        toMoqPaymentQuickCard(c, locale),
      ),
      moq_payment_business_terms: raw.moqPaymentBusinessTerms.map((t) =>
        toMoqPaymentBusinessTerm(t, locale),
      ),
      shipment_terms_section: toAboutCompanyShipmentTermsSection(
        raw.shipmentTermsSection,
        locale,
      ),
      shipping_arrangement_items: raw.shippingArrangementItems.map((i) =>
        toShippingArrangementItem(i, locale),
      ),
      shipment_loading_locations: raw.shipmentLoadingLocations.map((l) =>
        toShipmentLoadingLocation(l, locale),
      ),
      shipment_container_types: raw.shipmentContainerTypes.map((t) =>
        toShipmentContainerType(t, locale),
      ),
      shipment_schedule_steps: raw.shipmentScheduleSteps.map((s) =>
        toShipmentScheduleStep(s, locale),
      ),
      shipment_documents: raw.shipmentDocuments.map((d) =>
        toShipmentDocument(d, locale),
      ),
      shipment_commitment_items: raw.shipmentCommitmentItems.map((i) =>
        toShipmentCommitmentItem(i, locale),
      ),
      facilities_faq_section: toAboutCompanyFacilitiesFaqSection(
        raw.facilitiesFaqSection,
        locale,
      ),
      facilities_faq_items: raw.facilitiesFaqItems.map((i) =>
        toFacilitiesFaqItem(i, locale),
      ),
      settings: toAboutCompanySettings(raw.settings),
      // Snapshot rows are by definition published, so the draft flag is always false here.
      section_config: raw.sectionConfig.map((c) =>
        toAboutCompanySectionConfig(c),
      ),
    };
  }

  private async assertExists(
    delegate: {
      findUnique: (args: { where: { id: string } }) => Promise<unknown>;
    },
    id: string,
    label: string,
  ) {
    const entry = await delegate.findUnique({ where: { id } });
    if (!entry) throw new ApiException('NOT_FOUND', `${label} not found.`, 404);
  }
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** JSON round-trips through the `Json` column turn every Date into a plain ISO string —
 * this reconstructs real Date objects so the existing mapper functions (which call
 * `.toISOString()` on some fields) work unmodified against snapshot data. Same helper as
 * homepage.service.ts, duplicated per-service by this codebase's convention. */
function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) {
    const items = value as unknown[];
    return items.map((v) => reviveDates(v)) as never;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] =
        typeof val === 'string' && ISO_DATE_RE.test(val)
          ? new Date(val)
          : reviveDates(val);
    }
    return out as T;
  }
  return value;
}

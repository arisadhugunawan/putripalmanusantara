import { Injectable, Logger } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import {
  SUPPORTED_LOCALES,
  type AiSourceKey,
  type Locale,
} from '@ppn/shared-types';
import { AboutCompanyService } from '../about-company/about-company.service';
import { ArticlesService } from '../articles/articles.service';
import { ArticleQueryDto } from '../articles/dto/article.dto';
import { ContactPageService } from '../contact-page/contact-page.service';
import { GalleryService } from '../gallery/gallery.service';
import { HomepageService } from '../homepage/homepage.service';
import { ProductsService } from '../products/products.service';
import type { AiSettingsModel } from '../../../generated/prisma/models';

export interface ExtractedChunk {
  sourceKey: AiSourceKey;
  contentType: string;
  page: string;
  section: string | null;
  language: string;
  productId: string | null;
  sourceUrl: string;
  content: string;
  updatedAt: Date;
}

/** Strips HTML/markup down to plain readable text (brief §C.2 "dibersihkan dari HTML/UI
 * markup") — reuses `sanitize-html` (already a dependency, used elsewhere for SVG sanitization)
 * with an empty allow-list rather than a hand-rolled regex, since it correctly handles
 * malformed/nested markup that a regex would mangle. */
function stripHtml(input: string | null | undefined): string {
  if (!input) return '';
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function block(...parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join('\n');
}

function list(items: string[]): string {
  return items
    .filter(Boolean)
    .map((i) => `- ${i}`)
    .join('\n');
}

const MAX_ARTICLE_CHARS = 1200;

/**
 * Reads PUBLISHED content directly from the same NestJS services the public website renders
 * through — never a separate/duplicated data store — and normalizes each module into flat,
 * plain-text, retrieval-ready chunks (see README "AI Assistant" for the full source-per-module
 * table, and why Homepage/About Company/Contact Page read their `*PublishedSnapshot` while
 * Facilities/Gallery/Articles read the live `status`/`active`-filtered tables — both are
 * "published only", just via different mechanisms already established elsewhere in this
 * codebase). Products moved into the snapshot group (Post-Launch Products Draft/Publish) —
 * `productsService.findPublished()`/`findPublishedBySlug()` now read the latest
 * `ProductPublishedSnapshot` internally, so this extractor needed no changes at all to pick up
 * the new boundary; it was already calling the right methods. This class only reads;
 * `AiSyncService` is the only caller and owns writing the result to `ai_knowledge_chunks`.
 */
@Injectable()
export class AiContentExtractorService {
  private readonly logger = new Logger(AiContentExtractorService.name);

  constructor(
    private readonly homepageService: HomepageService,
    private readonly aboutCompanyService: AboutCompanyService,
    private readonly productsService: ProductsService,
    private readonly galleryService: GalleryService,
    private readonly articlesService: ArticlesService,
    private readonly contactPageService: ContactPageService,
  ) {}

  async extractAll(
    settings: AiSettingsModel,
  ): Promise<{ chunks: ExtractedChunk[]; failedSources: AiSourceKey[] }> {
    const chunks: ExtractedChunk[] = [];
    // Dedupes by source group — the same group failing in multiple locales (e.g. contact/en,
    // contact/id, contact/zh all throwing) must still surface as a single 'contact' entry, not
    // one per failed locale.
    const failedSources = new Set<AiSourceKey>();

    // Each source is wrapped in its OWN try/catch — one source throwing (e.g. a locale this
    // module hasn't been translated into yet) must never skip the sources listed after it for
    // that same locale; a shared try/catch around the whole block did exactly that in an
    // earlier version of this method (News extraction hit `ArticleQueryDto`'s missing default
    // for `sort` and swallowed Contact right along with it) — bug found and fixed during launch
    // verification of this feature.
    //
    // `sourceKey` identifies the failure group for `failedSources` at the SAME granularity this
    // wrapper already isolates failures at — the about-company bundle (`extractAboutCompany()`)
    // covers 6 distinct `AiSourceKey`s (about_company/facilities/moq_payment_terms/
    // shipment_terms/legal_certificates/faq) behind one try/catch, so a failure there is
    // recorded under the single representative key `'about_company'` rather than attributed to
    // whichever of the 6 actually broke — deliberate (P0.4-D4/P1-5 Option A): this method is not
    // restructured to fail at finer granularity than it already does.
    const safely = async (
      label: string,
      sourceKey: AiSourceKey,
      fn: () => Promise<ExtractedChunk[]>,
    ): Promise<ExtractedChunk[]> => {
      try {
        return await fn();
      } catch (err) {
        this.logger.warn(
          `Extraction failed for "${label}": ${(err as Error).message}`,
        );
        failedSources.add(sourceKey);
        return [];
      }
    };

    for (const locale of SUPPORTED_LOCALES) {
      const language = locale;
      if (settings.includeHome) {
        chunks.push(
          ...(await safely(`home/${language}`, 'home', () =>
            this.extractHome(language),
          )),
        );
      }
      if (
        settings.includeAboutCompany ||
        settings.includeFacilities ||
        settings.includeMoqPaymentTerms ||
        settings.includeShipmentTerms ||
        settings.includeLegalCertificates ||
        settings.includeFaq
      ) {
        chunks.push(
          ...(await safely(`about-company/${language}`, 'about_company', () =>
            this.extractAboutCompany(language, settings),
          )),
        );
      }
      if (settings.includeProducts) {
        chunks.push(
          ...(await safely(`products/${language}`, 'products', () =>
            this.extractProducts(language),
          )),
        );
      }
      if (settings.includeGallery) {
        chunks.push(
          ...(await safely(`gallery/${language}`, 'gallery', () =>
            this.extractGallery(language),
          )),
        );
      }
      if (settings.includeNews) {
        chunks.push(
          ...(await safely(`news/${language}`, 'news', () =>
            this.extractNews(language),
          )),
        );
      }
      if (settings.includeContact) {
        chunks.push(
          ...(await safely(`contact/${language}`, 'contact', () =>
            this.extractContact(language),
          )),
        );
      }
    }

    return { chunks, failedSources: [...failedSources] };
  }

  private async extractHome(language: Locale): Promise<ExtractedChunk[]> {
    const now = new Date();
    const home = await this.homepageService.getPublishedHomepage(language);
    const chunks: ExtractedChunk[] = [];

    const overview = block(
      home.about_preview?.heading,
      home.about_preview?.paragraph_1,
      home.about_preview?.paragraph_2,
      home.about_preview?.paragraph_3,
      home.highlights?.length
        ? `Why choose PPN:\n${list(home.highlights.map((h) => `${h.title}: ${h.description}`))}`
        : '',
      home.statistics?.length
        ? `Key numbers:\n${list(home.statistics.map((s) => `${s.label}: ${s.value}`))}`
        : '',
    );
    if (overview) {
      chunks.push({
        sourceKey: 'home',
        contentType: 'home_overview',
        page: 'Home',
        section: 'Overview',
        language,
        productId: null,
        sourceUrl: `/${language}`,
        content: overview,
        updatedAt: now,
      });
    }

    for (const faq of home.faqs ?? []) {
      chunks.push({
        sourceKey: 'faq',
        contentType: 'faq',
        page: 'Home / FAQ',
        section: faq.question,
        language,
        productId: null,
        sourceUrl: `/${language}#faq`,
        content: block(`Q: ${faq.question}`, `A: ${stripHtml(faq.answer)}`),
        updatedAt: now,
      });
    }

    return chunks;
  }

  private async extractAboutCompany(
    language: Locale,
    settings: AiSettingsModel,
  ): Promise<ExtractedChunk[]> {
    const now = new Date();
    const data =
      await this.aboutCompanyService.getPublishedAboutCompany(language);
    const chunks: ExtractedChunk[] = [];
    const url = `/${language}/about`;

    if (settings.includeAboutCompany) {
      const p = data.profile;
      const profileText = block(
        p.headline,
        stripHtml(p.short_description),
        stripHtml(p.main_description),
        p.vision ? `Vision: ${stripHtml(p.vision)}` : '',
        p.mission ? `Mission: ${stripHtml(p.mission)}` : '',
        stripHtml(p.company_overview),
        p.business_type ? `Business type: ${p.business_type}` : '',
        p.registered_address
          ? `Registered address: ${p.registered_address}`
          : '',
        p.established_year ? `Established: ${p.established_year}` : '',
        stripHtml(p.story_description),
      );
      if (profileText) {
        chunks.push({
          sourceKey: 'about_company',
          contentType: 'company_profile',
          page: 'About Company',
          section: 'CV. Putri Palma Nusantara',
          language,
          productId: null,
          sourceUrl: url,
          content: profileText,
          updatedAt: now,
        });
      }

      if (data.facts?.length) {
        chunks.push({
          sourceKey: 'about_company',
          contentType: 'company_facts',
          page: 'About Company',
          section: 'Company Facts',
          language,
          productId: null,
          sourceUrl: url,
          content: list(
            data.facts
              .filter((f) => f.active)
              .map((f) => `${f.label}: ${f.value}`),
          ),
          updatedAt: now,
        });
      }

      if (data.team_members?.length) {
        chunks.push({
          sourceKey: 'about_company',
          contentType: 'team',
          page: 'About Company',
          section: 'PPN Team',
          language,
          productId: null,
          sourceUrl: `${url}#team`,
          content: list(
            data.team_members
              .filter((m) => m.active)
              .map(
                (m) =>
                  `${m.name} — ${m.position}${m.department ? ` (${m.department})` : ''}: ${stripHtml(m.biography)}`,
              ),
          ),
          updatedAt: now,
        });
      }

      const whatWeDo = block(
        data.what_we_do_section?.description,
        data.what_we_do_items?.length
          ? list(
              data.what_we_do_items
                .filter((i) => i.active)
                .map((i) => `${i.title}: ${stripHtml(i.short_description)}`),
            )
          : '',
        data.who_we_supply_items?.length
          ? `Who PPN supplies:\n${list(data.who_we_supply_items.filter((i) => i.active).map((i) => `${i.title}: ${i.description}`))}`
          : '',
      );
      if (whatWeDo) {
        chunks.push({
          sourceKey: 'about_company',
          contentType: 'what_we_supply',
          page: 'About Company',
          section: 'What We Supply',
          language,
          productId: null,
          sourceUrl: `${url}#what-we-do`,
          content: whatWeDo,
          updatedAt: now,
        });
      }

      const factory = data.factory;
      const factoryText = block(
        factory?.name,
        stripHtml(factory?.short_description),
        stripHtml(factory?.detailed_description),
        factory?.location ? `Location: ${factory.location}` : '',
        factory?.operational_info
          ? `Operations: ${factory.operational_info}`
          : '',
        factory?.capacity ? `Capacity: ${factory.capacity}` : '',
      );
      if (factoryText) {
        chunks.push({
          sourceKey: 'about_company',
          contentType: 'factory',
          page: 'About Company',
          section: 'Factory',
          language,
          productId: null,
          sourceUrl: `${url}#factory`,
          content: factoryText,
          updatedAt: now,
        });
      }
    }

    if (settings.includeLegalCertificates) {
      for (const doc of data.legal_documents ?? []) {
        if (!doc.active) continue;
        chunks.push({
          sourceKey: 'legal_certificates',
          contentType: 'legal_document',
          page: 'Legal & Certificates',
          section: doc.title,
          language,
          productId: null,
          sourceUrl: `${url}#legal`,
          content: block(
            doc.title,
            doc.category?.name ? `Type: ${doc.category.name}` : '',
            doc.issuing_organization
              ? `Issued by: ${doc.issuing_organization}`
              : '',
            doc.country ? `Country: ${doc.country}` : '',
            doc.document_number
              ? `Document number: ${doc.document_number}`
              : '',
            doc.verified ? 'Status: verified by PPN' : '',
            stripHtml(doc.description),
          ),
          updatedAt: now,
        });
      }
    }

    if (settings.includeFacilities) {
      const facSection = block(data.facilities_section?.description);
      if (facSection) {
        chunks.push({
          sourceKey: 'facilities',
          contentType: 'facilities_overview',
          page: 'Facilities',
          section: 'Overview',
          language,
          productId: null,
          sourceUrl: `/${language}/facilities`,
          content: facSection,
          updatedAt: now,
        });
      }
      for (const facility of data.facilities ?? []) {
        if (!facility.active) continue;
        chunks.push({
          sourceKey: 'facilities',
          contentType: 'facility',
          page: 'Facilities',
          section: facility.name,
          language,
          productId: null,
          sourceUrl: `/${language}/facilities`,
          content: block(
            facility.name,
            stripHtml(facility.description),
            facility.facility_type ? `Type: ${facility.facility_type}` : '',
            facility.location ? `Location: ${facility.location}` : '',
          ),
          updatedAt: now,
        });
      }
    }

    if (settings.includeMoqPaymentTerms) {
      const moq = data.moq_payment_section;
      const moqText = block(
        moq?.introduction,
        moq?.supply_capacity_title
          ? `${moq.supply_capacity_title}: ${moq.supply_capacity_description}`
          : '',
        moq?.commitment_title
          ? `${moq.commitment_title}: ${moq.commitment_description}`
          : '',
        data.moq_payment_quick_cards?.length
          ? list(
              data.moq_payment_quick_cards
                .filter((c) => c.active && c.value)
                .map((c) => `${c.label}: ${c.value}`),
            )
          : '',
        data.moq_payment_business_terms?.length
          ? `Terms:\n${list(data.moq_payment_business_terms.filter((t) => t.active).map((t) => `${t.label}: ${t.value}`))}`
          : '',
      );
      if (moqText) {
        chunks.push({
          sourceKey: 'moq_payment_terms',
          contentType: 'moq_payment_terms',
          page: 'Facilities / MOQ & Payment Terms',
          section: null,
          language,
          productId: null,
          sourceUrl: `/${language}/facilities#moq-payment`,
          content: moqText,
          updatedAt: now,
        });
      }
    }

    if (settings.includeShipmentTerms) {
      const ship = data.shipment_terms_section;
      const shipOverview = block(
        ship?.introduction,
        data.shipping_arrangement_items?.length
          ? list(
              data.shipping_arrangement_items
                .filter((i) => i.active)
                .map((i) => `${i.title}: ${i.value} — ${i.description}`),
            )
          : '',
        ship?.commitment_title
          ? `${ship.commitment_title}: ${ship.commitment_description}`
          : '',
      );
      if (shipOverview) {
        chunks.push({
          sourceKey: 'shipment_terms',
          contentType: 'shipment_overview',
          page: 'Facilities / Shipment Terms',
          section: 'Overview',
          language,
          productId: null,
          sourceUrl: `/${language}/facilities#shipment-terms`,
          content: shipOverview,
          updatedAt: now,
        });
      }
      const logistics = block(
        data.shipment_loading_locations?.length
          ? `Loading locations:\n${list(data.shipment_loading_locations.filter((l) => l.active).map((l) => `${l.name}, ${l.region}, ${l.country}`))}`
          : '',
        data.shipment_container_types?.length
          ? `Container types:\n${list(data.shipment_container_types.filter((c) => c.active).map((c) => c.label))}`
          : '',
        data.shipment_schedule_steps?.length
          ? `Shipping schedule:\n${list(data.shipment_schedule_steps.filter((s) => s.active).map((s) => `${s.name}: ${s.description}`))}`
          : '',
        data.shipment_documents?.length
          ? `Shipping documents:\n${list(data.shipment_documents.filter((d) => d.active).map((d) => `${d.name}: ${d.description}`))}`
          : '',
      );
      if (logistics) {
        chunks.push({
          sourceKey: 'shipment_terms',
          contentType: 'shipment_logistics',
          page: 'Facilities / Shipment Terms',
          section: 'Loading & Logistics',
          language,
          productId: null,
          sourceUrl: `/${language}/facilities#shipment-terms`,
          content: logistics,
          updatedAt: now,
        });
      }
    }

    if (settings.includeFaq) {
      for (const item of data.facilities_faq_items ?? []) {
        if (!item.active) continue;
        chunks.push({
          sourceKey: 'faq',
          contentType: 'faq',
          page: 'Facilities / FAQ',
          section: item.question,
          language,
          productId: null,
          sourceUrl: `/${language}/facilities#faq`,
          content: block(`Q: ${item.question}`, `A: ${stripHtml(item.answer)}`),
          updatedAt: now,
        });
      }
    }

    return chunks;
  }

  private async extractProducts(language: Locale): Promise<ExtractedChunk[]> {
    const now = new Date();
    const products = await this.productsService.findPublished(language);
    const chunks: ExtractedChunk[] = [];

    if (products.length) {
      chunks.push({
        sourceKey: 'products',
        contentType: 'product_list',
        page: 'Products',
        section: 'Overview',
        language,
        productId: null,
        sourceUrl: `/${language}/products`,
        content: `PPN's coconut product range:\n${list(products.map((p) => `${p.name} (${p.category}): ${p.short_description}`))}`,
        updatedAt: now,
      });
    }

    for (const summary of products) {
      const detail = await this.productsService.findPublishedBySlug(
        summary.slug,
        language,
      );
      if (!detail) continue;
      const specsByGroup = (group: string) =>
        (detail.specifications ?? [])
          .filter((s) => s.group === group)
          .map((s) =>
            s.variant_label
              ? `[${s.variant_label}] ${s.spec_key}: ${s.spec_value}`
              : `${s.spec_key}: ${s.spec_value}`,
          );

      const content = block(
        `${detail.name} (${detail.category})`,
        stripHtml(detail.short_description),
        stripHtml(detail.full_description),
        specsByGroup('detail_info').length
          ? `Details:\n${list(specsByGroup('detail_info'))}`
          : '',
        specsByGroup('specification').length
          ? `Specifications:\n${list(specsByGroup('specification'))}`
          : '',
        specsByGroup('export_info').length
          ? `Export info:\n${list(specsByGroup('export_info'))}`
          : '',
        detail.packaging?.length
          ? `Packaging options:\n${list(detail.packaging.map((p) => `${p.title}: ${stripHtml(p.description)}`))}`
          : '',
        detail.applications?.length
          ? `Applications:\n${list(detail.applications.map((a) => `${a.title}: ${stripHtml(a.description)}`))}`
          : '',
      );
      chunks.push({
        sourceKey: 'products',
        contentType: 'product_detail',
        page: 'Products',
        section: detail.name,
        language,
        productId: detail.id,
        sourceUrl: `/${language}/products/${detail.slug}`,
        content,
        updatedAt: new Date(detail.updated_at),
      });
    }

    return chunks;
  }

  private async extractGallery(language: Locale): Promise<ExtractedChunk[]> {
    const now = new Date();
    const items = await this.galleryService.findPublic(undefined, language);
    if (!items.length) return [];

    const byCategory = new Map<string, typeof items>();
    for (const item of items) {
      const key = item.category?.name ?? 'General';
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(item);
    }

    return [...byCategory.entries()].map(([categoryName, categoryItems]) => ({
      sourceKey: 'gallery' as const,
      contentType: 'gallery_category',
      page: 'Gallery',
      section: categoryName,
      language,
      productId: null,
      sourceUrl: `/${language}/gallery`,
      content: block(
        `PPN Gallery — ${categoryName}: ${categoryItems.length} photo(s)/video(s).`,
        list(
          categoryItems
            .slice(0, 8)
            .map((i) => i.title || i.caption || i.short_description || '')
            .filter(Boolean),
        ),
      ),
      updatedAt: now,
    }));
  }

  private async extractNews(language: Locale): Promise<ExtractedChunk[]> {
    const query = new ArticleQueryDto();
    query.page = 1;
    query.limit = 50;
    query.locale = language;
    const { items } = await this.articlesService.findPublished(query);
    const chunks: ExtractedChunk[] = [];
    for (const summary of items) {
      const detail = await this.articlesService.findPublishedBySlug(
        summary.slug,
        language,
      );
      if (!detail) continue;
      const bodyText = stripHtml(detail.content).slice(0, MAX_ARTICLE_CHARS);
      chunks.push({
        sourceKey: 'news',
        contentType: 'article',
        page: 'News',
        section: detail.title,
        language,
        productId: null,
        sourceUrl: `/${language}/articles/${detail.slug}`,
        content: block(detail.title, stripHtml(detail.excerpt), bodyText),
        updatedAt: new Date(detail.updated_at),
      });
    }
    return chunks;
  }

  private async extractContact(language: Locale): Promise<ExtractedChunk[]> {
    const payload = await this.contactPageService.getPublished(language);
    if (!payload) return [];

    const now = new Date();
    const s = payload.settings;
    const hours = `${s.business_hours_open_days.join(', ')} ${s.business_hours_open_time}-${s.business_hours_close_time} (GMT${s.business_hours_utc_offset >= 0 ? '+' : ''}${s.business_hours_utc_offset})`;

    const chunks: ExtractedChunk[] = [
      {
        sourceKey: 'contact',
        contentType: 'contact_info',
        page: 'Contact',
        section: 'General',
        language,
        productId: null,
        sourceUrl: `/${language}/contact`,
        content: block(
          `Email: ${s.email}`,
          `WhatsApp: ${s.whatsapp_number}`,
          `Business hours: ${hours}`,
          s.hero_eyebrow,
          s.hero_heading,
          s.hero_description,
          s.whatsapp_message_greeting,
          s.whatsapp_message_intro,
          s.whatsapp_message_product_list_label,
          s.whatsapp_message_closing,
        ),
        updatedAt: now,
      },
    ];

    for (const loc of payload.locations) {
      if (!loc.active) continue;
      chunks.push({
        sourceKey: 'contact',
        contentType: 'location',
        page: 'Contact',
        section: loc.name,
        language,
        productId: null,
        sourceUrl: `/${language}/contact`,
        content: block(
          `${loc.name}${loc.label ? ` (${loc.label})` : ''}`,
          loc.address,
          loc.phone ? `Phone: ${loc.phone}` : '',
          loc.email ? `Email: ${loc.email}` : '',
          loc.google_maps_url ? `Google Maps: ${loc.google_maps_url}` : '',
        ),
        updatedAt: now,
      });
    }

    return chunks;
  }
}

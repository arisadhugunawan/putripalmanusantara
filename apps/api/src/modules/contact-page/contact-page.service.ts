import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DEFAULT_LOCALE,
  type ContactLocation as SharedContactLocation,
  type ContactPageSettings as SharedContactPageSettings,
  type ContactSocialLink as SharedContactSocialLink,
} from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import {
  CONTENT_PUBLISHED_EVENT,
  type ContentPublishedEvent,
} from '../../common/events/content-published.event';
import { mergeTranslations } from '../../common/utils/i18n.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  resolveContactLocationsLocale,
  resolveContactPageSettingsLocale,
  toContactLocation,
  toContactPageSettings,
  toContactSocialLink,
} from './contact-page.mapper';
import type {
  CreateContactLocationDto,
  UpdateContactLocationDto,
  UpdateContactPageSettingsDto,
} from './dto/contact-page.dto';
import type {
  CreateContactSocialLinkDto,
  UpdateContactSocialLinkDto,
} from './dto/contact-social-link.dto';

const SETTINGS_INCLUDE = { heroImage: true } as const;

@Injectable()
export class ContactPageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Settings (singleton, draft) ────────────────────────────────────────

  private async getOrCreateSettings() {
    const existing = await this.prisma.contactPageSettings.findFirst({
      include: SETTINGS_INCLUDE,
    });
    if (existing) return existing;
    return this.prisma.contactPageSettings.create({
      data: {},
      include: SETTINGS_INCLUDE,
    });
  }

  async findSettings() {
    const entry = await this.getOrCreateSettings();
    return toContactPageSettings(entry);
  }

  async updateSettings(dto: UpdateContactPageSettingsDto) {
    const existing = await this.getOrCreateSettings();
    const updated = await this.prisma.contactPageSettings.update({
      where: { id: existing.id },
      data: {
        email: dto.email,
        whatsappNumber: dto.whatsapp_number,
        businessHoursOpenDays: dto.business_hours_open_days,
        businessHoursOpenTime: dto.business_hours_open_time,
        businessHoursCloseTime: dto.business_hours_close_time,
        businessHoursUtcOffset: dto.business_hours_utc_offset,
        heroEyebrow: dto.hero_eyebrow,
        heroHeading: dto.hero_heading,
        heroDescription: dto.hero_description,
        heroImageId: dto.hero_image_id,
        heroOverlayOpacity: dto.hero_overlay_opacity,
        heroCtaPrimaryText: dto.hero_cta_primary_text,
        heroCtaSecondaryText: dto.hero_cta_secondary_text,
        buyerCtaHeading: dto.buyer_cta_heading,
        buyerCtaDescription: dto.buyer_cta_description,
        buyerCtaButtonText: dto.buyer_cta_button_text,
        supplierCtaHeading: dto.supplier_cta_heading,
        supplierCtaDescription: dto.supplier_cta_description,
        supplierCtaButtonText: dto.supplier_cta_button_text,
        supplierCtaWhatsappMessage: dto.supplier_cta_whatsapp_message,
        whatsappMessageGreeting: dto.whatsapp_message_greeting,
        whatsappMessageIntro: dto.whatsapp_message_intro,
        whatsappMessageProductListLabel:
          dto.whatsapp_message_product_list_label,
        whatsappMessageClosing: dto.whatsapp_message_closing,
        mainMapLocationId: dto.main_map_location_id,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
      include: SETTINGS_INCLUDE,
    });
    return toContactPageSettings(updated);
  }

  // ── Locations (draft) ────────────────────────────────────────────────────

  async findLocations() {
    const locations = await this.prisma.contactLocation.findMany({
      orderBy: { order: 'asc' },
    });
    return locations.map(toContactLocation);
  }

  async createLocation(dto: CreateContactLocationDto) {
    const count = await this.prisma.contactLocation.count();
    if (dto.location_type === 'head_office') {
      await this.demoteExistingHeadOffice(null);
    }
    const location = await this.prisma.contactLocation.create({
      data: {
        name: dto.name,
        locationType: (dto.location_type as never) ?? 'operational',
        label: dto.label ?? '',
        address: dto.address,
        googleMapsUrl: dto.google_maps_url ?? '',
        phone: dto.phone,
        email: dto.email,
        order: dto.order ?? count,
        active: dto.active ?? true,
      },
    });
    return toContactLocation(location);
  }

  async updateLocation(id: string, dto: UpdateContactLocationDto) {
    const existing = await this.assertLocationExists(id);
    if (dto.location_type === 'head_office') {
      await this.demoteExistingHeadOffice(id);
    }
    const location = await this.prisma.contactLocation.update({
      where: { id },
      data: {
        name: dto.name,
        locationType: dto.location_type as never,
        label: dto.label,
        address: dto.address,
        googleMapsUrl: dto.google_maps_url,
        phone: dto.phone,
        email: dto.email,
        order: dto.order,
        active: dto.active,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
    });
    return toContactLocation(location);
  }

  /** Only one location may be Head Office at a time — setting a new one automatically demotes
   * whichever location currently holds it to Operational, rather than allowing two locations
   * to both claim Head Office (which would leave the public page's "PPN Head Office" emphasis
   * ambiguous). `exceptId` excludes the row being written to itself (relevant on update, when
   * the target row might already be the current head office). The Admin confirms this change
   * before it's sent, via a confirmation dialog on the frontend. */
  private async demoteExistingHeadOffice(exceptId: string | null) {
    await this.prisma.contactLocation.updateMany({
      where: {
        locationType: 'head_office',
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { locationType: 'operational' },
    });
  }

  async removeLocation(id: string) {
    await this.assertLocationExists(id);
    // A location currently selected as the main map falls back to null (see
    // `onDelete: SetNull` on `ContactPageSettings.mainMapLocation`) rather than blocking the
    // delete — the Admin can always pick a new main map location afterwards.
    await this.prisma.contactLocation.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertLocationExists(id: string) {
    const location = await this.prisma.contactLocation.findUnique({
      where: { id },
    });
    if (!location)
      throw new ApiException('NOT_FOUND', 'Contact location not found.', 404);
    return location;
  }

  // ── Social links (draft, open platform list) ────────────────────────────
  //
  // Replaces the old four fixed instagram/tiktok/facebook/linkedin columns (migrated into rows
  // here, see migration `add_contact_social_links_and_whatsapp_template`) — the Admin can now
  // add, remove, and reorder any platform, including ones the fixed slots never supported.

  async findSocialLinks() {
    const links = await this.prisma.contactSocialLink.findMany({
      orderBy: { order: 'asc' },
    });
    return links.map(toContactSocialLink);
  }

  async createSocialLink(dto: CreateContactSocialLinkDto) {
    const count = await this.prisma.contactSocialLink.count();
    const link = await this.prisma.contactSocialLink.create({
      data: {
        platform: dto.platform,
        displayName: dto.display_name,
        url: dto.url,
        active: dto.active ?? true,
        openInNewTab: dto.open_in_new_tab ?? true,
        order: dto.order ?? count,
      },
    });
    return toContactSocialLink(link);
  }

  async updateSocialLink(id: string, dto: UpdateContactSocialLinkDto) {
    await this.assertSocialLinkExists(id);
    const link = await this.prisma.contactSocialLink.update({
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
    return toContactSocialLink(link);
  }

  async removeSocialLink(id: string) {
    await this.assertSocialLinkExists(id);
    await this.prisma.contactSocialLink.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertSocialLinkExists(id: string) {
    const link = await this.prisma.contactSocialLink.findUnique({
      where: { id },
    });
    if (!link)
      throw new ApiException('NOT_FOUND', 'Social link not found.', 404);
  }

  // ── Draft/Publish (Post-Launch) ──────────────────────────────────────────
  //
  // Settings/Locations above are the Admin's draft working copy. `ContactPagePublishedSnapshot`
  // is a singleton row holding a frozen copy of that draft — the public site reads only from
  // it, never from the draft tables directly, so an in-progress edit (or a failed save) can
  // never leak onto the live page. See README "Contact Page — Full Redesign" for why this is a
  // simpler singleton rather than Homepage's append-only snapshot history.

  private async getOrCreateSnapshot() {
    const existing = await this.prisma.contactPagePublishedSnapshot.findFirst();
    if (existing) return existing;
    return this.prisma.contactPagePublishedSnapshot.create({ data: {} });
  }

  async getPublishStatus() {
    const snapshot = await this.getOrCreateSnapshot();
    if (!snapshot.isPublished || !snapshot.publishedAt) {
      return {
        is_published: false,
        last_published_at: snapshot.publishedAt?.toISOString() ?? null,
        has_unpublished_changes: true,
      };
    }
    const latestChange = await this.latestDraftChangeAt();
    return {
      is_published: true,
      last_published_at: snapshot.publishedAt.toISOString(),
      has_unpublished_changes:
        !latestChange || latestChange > snapshot.publishedAt,
    };
  }

  private async latestDraftChangeAt(): Promise<Date | null> {
    const [settings, latestLocation] = await Promise.all([
      this.prisma.contactPageSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
      this.prisma.contactLocation.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ]);
    const dates = [settings?.updatedAt, latestLocation?.updatedAt].filter(
      (d): d is Date => Boolean(d),
    );
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }

  /** Maps through the same mapper functions the draft-read endpoints use, so the stored JSON
   * is already plain strings/numbers (no `Date` objects) — the public read path can then use
   * it as-is with no date-revival step, unlike Homepage's snapshot (which stores raw Prisma
   * rows and revives `Date`s on read because its mappers need real `Date.toISOString()` calls
   * at read time for locale-aware fields this payload doesn't have). */
  private async buildSnapshotPayload() {
    const [settingsEntry, locations, socialLinks] = await Promise.all([
      this.getOrCreateSettings(),
      this.prisma.contactLocation.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
      this.prisma.contactSocialLink.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      }),
    ]);
    return {
      settings: toContactPageSettings(settingsEntry),
      locations: locations.map(toContactLocation),
      social_links: socialLinks.map(toContactSocialLink),
    };
  }

  async publish() {
    const payload = await this.buildSnapshotPayload();
    const existing = await this.getOrCreateSnapshot();
    const snapshot = await this.prisma.contactPagePublishedSnapshot.update({
      where: { id: existing.id },
      data: {
        isPublished: true,
        data: payload as never,
        publishedAt: new Date(),
      },
    });
    const event: ContentPublishedEvent = { source: 'contact' };
    this.events.emit(CONTENT_PUBLISHED_EVENT, event);
    return {
      is_published: true,
      published_at: snapshot.publishedAt?.toISOString() ?? null,
    };
  }

  /** Takes the public page down without discarding the last published payload — Publish
   * again later re-uses whatever is current in the draft tables at that time, exactly like a
   * fresh publish. */
  async unpublish() {
    const existing = await this.getOrCreateSnapshot();
    const snapshot = await this.prisma.contactPagePublishedSnapshot.update({
      where: { id: existing.id },
      data: { isPublished: false },
    });
    // Same event as publish() (P0.4-C1) — an unpublish is also a change to what's publicly
    // visible, so AI knowledge must resync to drop Contact too. The listener always triggers a
    // full rebuild, which naturally stops re-extracting Contact once it's no longer published
    // rather than needing a separate "remove" signal.
    const event: ContentPublishedEvent = { source: 'contact' };
    this.events.emit(CONTENT_PUBLISHED_EVENT, event);
    return {
      is_published: false,
      published_at: snapshot.publishedAt?.toISOString() ?? null,
    };
  }

  /** The public Contact page's single data source. Returns `null` when nothing has ever been
   * published, or after an explicit Unpublish — the page then renders nothing rather than
   * risking a stale or draft payload leaking through.
   *
   * `locale` defaults to English so every existing caller — most notably the AI content
   * extractor, which fetches this once and deliberately reuses it across every language (see
   * `ai-content-extractor.service.ts`, "Contact is locale-invariant") — keeps getting exactly
   * the same payload as before this phase. Only the public controller passes a real locale. */
  async getPublished(locale: string = DEFAULT_LOCALE) {
    const snapshot = await this.getOrCreateSnapshot();
    if (!snapshot.isPublished || !snapshot.data) return null;

    const raw = snapshot.data as unknown as {
      settings: SharedContactPageSettings;
      locations: SharedContactLocation[];
      social_links?: SharedContactSocialLink[];
    };
    const locations = resolveContactLocationsLocale(
      [...raw.locations].sort((a, b) => a.order - b.order),
      locale,
    );
    const mainMapLocation =
      locations.find((l) => l.id === raw.settings.main_map_location_id) ??
      locations[0] ??
      null;
    // `social_links` didn't exist on snapshots published before this feature — falls back to
    // an empty list rather than throwing, so an old, still-live snapshot keeps rendering
    // exactly as it did (with an empty Social tile) until the next Publish.
    const socialLinks = [...(raw.social_links ?? [])].sort(
      (a, b) => a.order - b.order,
    );

    return {
      settings: resolveContactPageSettingsLocale(raw.settings, locale),
      locations,
      social_links: socialLinks,
      main_map_location: mainMapLocation,
    };
  }
}

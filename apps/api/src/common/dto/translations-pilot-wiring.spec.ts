import 'reflect-metadata';
import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateGalleryCategoryDto,
  UpdateGalleryCategoryDto,
} from '../../modules/gallery/dto/gallery-category.dto';
import {
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from '../../modules/gallery/dto/gallery-item.dto';
import {
  UpdateContactLocationDto,
  UpdateContactPageSettingsDto,
} from '../../modules/contact-page/dto/contact-page.dto';
import {
  UpsertProductPackagingApplicationDto,
  UpsertProductShapeDto,
  UpsertProductSpecificationDto,
} from '../../modules/products/dto/product-subresources.dto';
import { GalleryService } from '../../modules/gallery/gallery.service';
import { ContactPageService } from '../../modules/contact-page/contact-page.service';
import { ProductsService } from '../../modules/products/products.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Phase P0.3-E — pilot rollout. `@IsObject()` alone (the pre-pilot state, still true for the
 * other ~30 DTOs) never touches the *value* — it only rejects/accepts based on the raw shape.
 * Wiring `@Transform(({ value }) => normalizeTranslationsInput(value))` in ahead of `@IsObject()`
 * only actually normalizes anything if NestJS's real pipeline (`plainToInstance()` then
 * `validate()`, exactly what `ValidationPipe({ transform: true })` in main.ts does under the
 * hood) is what's driving it — a service-level unit test that hand-constructs a plain `dto`
 * object and calls `service.create(dto)` directly bypasses this entirely and would pass whether
 * or not the decorator was wired correctly. These tests drive the actual DTO classes through
 * `plainToInstance`/`validate` to prove the normalized value is what a controller would really
 * receive, for every pilot module.
 */

const REQUIRED_SHAPE_FIELDS = { name: 'CUBE' };
const REQUIRED_SPEC_FIELDS = { spec_key: 'Moisture', spec_value: '≤ 6%' };
const REQUIRED_PACKAGING_FIELDS = {
  type: 'packaging',
  title: 'Jute Gunny Bags',
  description: 'Standard export packaging.',
};

const MIXED_INPUT = {
  id: { name: 'Valid Indonesian' },
  fr: { name: 'Invalid locale' },
  zh: 'not-an-object',
};

const EXPECTED_NORMALIZED = { id: { name: 'Valid Indonesian' } };

/** Mirrors the global `ValidationPipe`'s `transformOptions` (main.ts:
 * `{ enableImplicitConversion: true }`) exactly, so this drives the DTO classes through the
 * same transformation NestJS itself performs on every real request. */
function build<T extends object>(cls: ClassConstructor<T>, raw: object): T {
  return plainToInstance(cls, raw, { enableImplicitConversion: true });
}

describe('Phase P0.3-E pilot — DTO wiring reaches the transformed instance', () => {
  it('Gallery: CreateGalleryCategoryDto normalizes translations and produces zero validation errors', async () => {
    const instance = build(CreateGalleryCategoryDto, {
      name: 'Sorting',
      translations: MIXED_INPUT,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(EXPECTED_NORMALIZED);
  });

  it('Gallery: UpdateGalleryCategoryDto normalizes translations and produces zero validation errors', async () => {
    const instance = build(UpdateGalleryCategoryDto, {
      translations: MIXED_INPUT,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(EXPECTED_NORMALIZED);
  });

  it('Gallery: CreateGalleryItemDto normalizes translations and produces zero validation errors', async () => {
    const instance = build(CreateGalleryItemDto, {
      category_id: 'cat-1',
      media_id: 'media-1',
      translations: MIXED_INPUT,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(EXPECTED_NORMALIZED);
  });

  it('Gallery: UpdateGalleryItemDto normalizes translations and produces zero validation errors', async () => {
    const instance = build(UpdateGalleryItemDto, {
      translations: MIXED_INPUT,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(EXPECTED_NORMALIZED);
  });

  it('Contact: UpdateContactPageSettingsDto normalizes translations and produces zero validation errors', async () => {
    const instance = build(UpdateContactPageSettingsDto, {
      translations: MIXED_INPUT,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(EXPECTED_NORMALIZED);
  });

  it('Contact: UpdateContactLocationDto normalizes translations and produces zero validation errors', async () => {
    const instance = build(UpdateContactLocationDto, {
      translations: MIXED_INPUT,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(EXPECTED_NORMALIZED);
  });

  it('Product: UpsertProductShapeDto normalizes translations and produces zero validation errors', async () => {
    const instance = build(UpsertProductShapeDto, {
      ...REQUIRED_SHAPE_FIELDS,
      translations: MIXED_INPUT,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(EXPECTED_NORMALIZED);
  });

  it('Product: UpsertProductSpecificationDto normalizes translations and produces zero validation errors', async () => {
    const instance = build(UpsertProductSpecificationDto, {
      ...REQUIRED_SPEC_FIELDS,
      translations: MIXED_INPUT,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(EXPECTED_NORMALIZED);
  });

  it('Product: UpsertProductPackagingApplicationDto normalizes translations and produces zero validation errors', async () => {
    const instance = build(UpsertProductPackagingApplicationDto, {
      ...REQUIRED_PACKAGING_FIELDS,
      translations: MIXED_INPUT,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(EXPECTED_NORMALIZED);
  });

  // Proves the "normalize, don't reject" philosophy end to end: a request carrying an invalid
  // locale/value never fails validation just because of that — it's silently dropped, not
  // rejected, exactly like every other admin-only DTO field in this codebase already behaves
  // for unknown top-level properties (`whitelist: true`).
  it('never produces a validation error for the translations field itself, regardless of how malformed the nested content is', async () => {
    const instance = build(UpdateGalleryCategoryDto, {
      translations: {
        completelyBogusLocale: { anything: 'goes' },
        anotherOne: 'a plain string, not even an object',
      },
    });
    const errors = await validate(instance);
    const translationsErrors = errors.filter(
      (e) => e.property === 'translations',
    );
    expect(translationsErrors).toHaveLength(0);
    expect(instance.translations).toEqual({});
  });

  // Six-locale payload survives the real pipeline intact — the pilot's core positive case.
  it('a full six-locale payload passes through the real DTO pipeline unchanged', async () => {
    const sixLocales = {
      en: { name: 'English' },
      id: { name: 'Indonesian' },
      zh: { name: 'Chinese' },
      th: { name: 'Thai' },
      hi: { name: 'Hindi' },
      vi: { name: 'Vietnamese' },
    };
    const instance = build(UpdateGalleryCategoryDto, {
      translations: sixLocales,
    });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toEqual(sixLocales);
  });

  // undefined/null/{} still safe through the real pipeline, matching the isolated helper tests.
  it('translations omitted from the payload stays undefined through the real pipeline', async () => {
    const instance = build(UpdateGalleryCategoryDto, { name: 'Sorting' });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
    expect(instance.translations).toBeUndefined();
  });

  it('translations: null stays a no-op through the real pipeline', async () => {
    const instance = build(UpdateGalleryCategoryDto, { translations: null });
    const errors = await validate(instance);
    expect(errors).toHaveLength(0);
  });
});

/**
 * Full chain: DTO transform → service → the exact object handed to Prisma. Each test drives a
 * pilot DTO class through the real `plainToInstance`/`validate` pipeline (proving the decorator
 * fires), then feeds the resulting, already-normalized `dto.translations` into the real service
 * method (mocked Prisma) to prove requirement E — an unknown locale key can never reach the
 * persisted JSON, at every layer, not only inside the isolated helper function.
 */
describe('Phase P0.3-E pilot — full DTO → service → Prisma chain', () => {
  it('Gallery: updateCategory() merges the DTO-normalized translations, no unknown locale reaches the Prisma call', async () => {
    const dto = build(UpdateGalleryCategoryDto, { translations: MIXED_INPUT });

    const galleryCategory = {
      findUnique: jest.fn<Promise<unknown>, unknown[]>().mockResolvedValue({
        id: 'cat-1',
        translations: { zh: { name: 'Existing Chinese' } },
      }),
      update: jest
        .fn<Promise<unknown>, unknown[]>()
        .mockResolvedValue({ id: 'cat-1' }),
    };
    const prisma = { galleryCategory } as unknown as PrismaService;
    const service = new GalleryService(prisma);

    await service.updateCategory('cat-1', dto);

    const [call] = galleryCategory.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations).toEqual({
      id: { name: 'Valid Indonesian' },
      zh: { name: 'Existing Chinese' },
    });
    expect(call.data.translations).not.toHaveProperty('fr');
  });

  it('Contact: updateSettings() merges the DTO-normalized translations, no unknown locale reaches the Prisma call', async () => {
    const dto = build(UpdateContactPageSettingsDto, {
      translations: MIXED_INPUT,
    });

    const stubSettingsRow = {
      id: 'contact-1',
      email: '',
      whatsappNumber: '',
      businessHoursOpenDays: [],
      businessHoursOpenTime: '08:00',
      businessHoursCloseTime: '17:00',
      businessHoursUtcOffset: 7,
      heroEyebrow: '',
      heroHeading: '',
      heroDescription: '',
      heroImage: null,
      heroOverlayOpacity: 55,
      heroCtaPrimaryText: '',
      heroCtaSecondaryText: '',
      buyerCtaHeading: '',
      buyerCtaDescription: '',
      buyerCtaButtonText: '',
      supplierCtaHeading: '',
      supplierCtaDescription: '',
      supplierCtaButtonText: '',
      supplierCtaWhatsappMessage: '',
      whatsappMessageGreeting: '',
      whatsappMessageIntro: '',
      whatsappMessageProductListLabel: '',
      whatsappMessageClosing: '',
      mainMapLocationId: null,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      translations: { zh: { heroEyebrow: 'Existing Chinese' } },
    };
    const contactPageSettings = {
      upsert: jest
        .fn<Promise<unknown>, unknown[]>()
        .mockResolvedValue(stubSettingsRow),
      update: jest
        .fn<Promise<unknown>, unknown[]>()
        .mockResolvedValue(stubSettingsRow),
    };
    const prisma = { contactPageSettings } as unknown as PrismaService;
    const events = { emit: jest.fn() } as unknown as EventEmitter2;
    const service = new ContactPageService(prisma, events);

    await service.updateSettings(dto);

    const [call] = contactPageSettings.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations).toEqual({
      id: { name: 'Valid Indonesian' },
      zh: { heroEyebrow: 'Existing Chinese' },
    });
    expect(call.data.translations).not.toHaveProperty('fr');
  });

  it('Product: updateShape() merges the DTO-normalized translations, no unknown locale reaches the Prisma call', async () => {
    const dto = build(UpsertProductShapeDto, {
      ...REQUIRED_SHAPE_FIELDS,
      translations: MIXED_INPUT,
    });

    const productShape = {
      findFirst: jest.fn<Promise<unknown>, unknown[]>().mockResolvedValue({
        id: 'shape-1',
        productId: 'p1',
        translations: { zh: { name: 'Existing Chinese' } },
      }),
      update: jest
        .fn<Promise<unknown>, unknown[]>()
        .mockResolvedValue({ id: 'shape-1' }),
    };
    const product = {
      update: jest.fn<Promise<unknown>, unknown[]>().mockResolvedValue({}),
    };
    const prisma = { productShape, product } as unknown as PrismaService;
    const events = { emit: jest.fn() } as unknown as EventEmitter2;
    const service = new ProductsService(prisma, events);

    await service.updateShape('p1', 'shape-1', dto);

    const [call] = productShape.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations).toEqual({
      id: { name: 'Valid Indonesian' },
      zh: { name: 'Existing Chinese' },
    });
    expect(call.data.translations).not.toHaveProperty('fr');
  });
});

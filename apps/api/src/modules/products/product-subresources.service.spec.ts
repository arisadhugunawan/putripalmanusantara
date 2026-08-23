import type { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductsService } from './products.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const product = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const productShape = {
    count: jest.fn<Promise<number>, unknown[]>().mockResolvedValue(0),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const productSpecification = {
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const productPackagingApplication = {
    count: jest.fn<Promise<number>, unknown[]>().mockResolvedValue(0),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const productPublishedSnapshot = {
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, [{ data: Record<string, unknown> }]>(),
  };
  const prisma = {
    product,
    productShape,
    productSpecification,
    productPackagingApplication,
    productPublishedSnapshot,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const events = { emit: jest.fn() };
  const service = new ProductsService(
    prisma as unknown as PrismaService,
    events as unknown as EventEmitter2,
  );
  return {
    service,
    product,
    productShape,
    productSpecification,
    productPackagingApplication,
    productPublishedSnapshot,
  };
}

// Phase P0.3-D — before this phase, none of the three sub-resource create/update methods ever
// referenced `dto.translations` at all: the DTOs didn't even have the field, so it was
// structurally impossible to write a shape/specification/packaging-application translation,
// even by direct API call. These tests prove the fix — create persists it as-is, update merges
// it via `mergeTranslations()` exactly like every other translated model in this codebase.

describe('ProductsService.addShape / updateShape — translations', () => {
  it('create persists dto.translations directly', async () => {
    const { service, product, productShape } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    productShape.create.mockResolvedValue({ id: 'shape-1' });

    await service.addShape('p1', {
      name: 'CUBE',
      translations: { id: { name: 'KUBUS' } },
    });

    const [call] = productShape.create.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toEqual({ id: { name: 'KUBUS' } });
  });

  it('update merges a single-locale partial payload, preserving every other locale already saved', async () => {
    const { service, productShape, product } = buildService();
    productShape.findFirst.mockResolvedValue({
      id: 'shape-1',
      productId: 'p1',
      translations: {
        en: { name: 'CUBE' },
        zh: { name: '立方体' },
      },
    });
    productShape.update.mockResolvedValue({ id: 'shape-1' });
    product.update.mockResolvedValue({});

    await service.updateShape('p1', 'shape-1', {
      translations: { id: { name: 'KUBUS' } },
    });

    const [call] = productShape.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({ name: 'KUBUS' });
    expect(call.data.translations.en).toEqual({ name: 'CUBE' });
    expect(call.data.translations.zh).toEqual({ name: '立方体' });
  });

  it('update does not touch translations when the caller omits it from the patch', async () => {
    const { service, productShape, product } = buildService();
    productShape.findFirst.mockResolvedValue({
      id: 'shape-1',
      productId: 'p1',
      translations: { id: { name: 'KUBUS' } },
    });
    productShape.update.mockResolvedValue({ id: 'shape-1' });
    product.update.mockResolvedValue({});

    await service.updateShape('p1', 'shape-1', { sizes: 'new sizes' });

    const [call] = productShape.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toBeUndefined();
  });

  it('update on a legacy shape with translations = null still succeeds (backward compatibility)', async () => {
    const { service, productShape, product } = buildService();
    productShape.findFirst.mockResolvedValue({
      id: 'shape-1',
      productId: 'p1',
      translations: null,
    });
    productShape.update.mockResolvedValue({ id: 'shape-1' });
    product.update.mockResolvedValue({});

    await expect(
      service.updateShape('p1', 'shape-1', {
        translations: { id: { name: 'KUBUS' } },
      }),
    ).resolves.toBeDefined();

    const [call] = productShape.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({ name: 'KUBUS' });
  });
});

describe('ProductsService.addSpecification / updateSpecification — translations', () => {
  it('create persists dto.translations directly', async () => {
    const { service, product, productSpecification } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    productSpecification.create.mockResolvedValue({ id: 'spec-1' });

    await service.addSpecification('p1', {
      spec_key: 'Moisture Content',
      spec_value: '≤ 6%',
      translations: { id: { specKey: 'Kadar Air' } },
    });

    const [call] = productSpecification.create.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toEqual({ id: { specKey: 'Kadar Air' } });
  });

  it('update merges a single-field partial payload, preserving the sibling field already saved for that locale', async () => {
    const { service, productSpecification, product } = buildService();
    productSpecification.findFirst.mockResolvedValue({
      id: 'spec-1',
      productId: 'p1',
      translations: {
        id: { specKey: 'Kadar Air lama', specValue: 'Nilai lama' },
      },
    });
    productSpecification.update.mockResolvedValue({ id: 'spec-1' });
    product.update.mockResolvedValue({});

    await service.updateSpecification('p1', 'spec-1', {
      spec_key: 'Moisture Content',
      spec_value: '≤ 6%',
      translations: { id: { specKey: 'Kadar Air baru' } },
    });

    const [call] = productSpecification.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({
      specKey: 'Kadar Air baru',
      specValue: 'Nilai lama',
    });
  });

  it('does not change non-translatable fields (group, variant_label) when only translations are patched', async () => {
    const { service, productSpecification, product } = buildService();
    productSpecification.findFirst.mockResolvedValue({
      id: 'spec-1',
      productId: 'p1',
      translations: null,
    });
    productSpecification.update.mockResolvedValue({ id: 'spec-1' });
    product.update.mockResolvedValue({});

    await service.updateSpecification('p1', 'spec-1', {
      spec_key: 'Moisture Content',
      spec_value: '≤ 6%',
      translations: { id: { specKey: 'Kadar Air' } },
    });

    const [call] = productSpecification.update.mock.calls[0] as [
      { data: { group: unknown; variantLabel: unknown } },
    ];
    expect(call.data.group).toBeUndefined();
    expect(call.data.variantLabel).toBeUndefined();
  });
});

describe('ProductsService.addPackagingApplication / updatePackagingApplication — translations', () => {
  it('create persists dto.translations directly', async () => {
    const { service, product, productPackagingApplication } = buildService();
    product.findUnique.mockResolvedValue({ id: 'p1' });
    productPackagingApplication.create.mockResolvedValue({ id: 'pkg-1' });

    await service.addPackagingApplication('p1', {
      type: 'packaging',
      title: 'Jute Gunny Bags',
      description: 'Standard export packaging.',
      translations: { id: { title: 'Karung Goni' } },
    });

    const [call] = productPackagingApplication.create.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toEqual({ id: { title: 'Karung Goni' } });
  });

  it('update merges a single-locale partial payload, preserving every other locale already saved', async () => {
    const { service, productPackagingApplication, product } = buildService();
    productPackagingApplication.findFirst.mockResolvedValue({
      id: 'pkg-1',
      productId: 'p1',
      translations: {
        zh: { title: '麻袋' },
        th: { title: 'กระสอบปอ' },
      },
    });
    productPackagingApplication.update.mockResolvedValue({ id: 'pkg-1' });
    product.update.mockResolvedValue({});

    await service.updatePackagingApplication('p1', 'pkg-1', {
      type: 'packaging',
      title: 'Jute Gunny Bags',
      description: 'Standard export packaging.',
      translations: { id: { title: 'Karung Goni' } },
    });

    const [call] = productPackagingApplication.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id).toEqual({ title: 'Karung Goni' });
    expect(call.data.translations.zh).toEqual({ title: '麻袋' });
    expect(call.data.translations.th).toEqual({ title: 'กระสอบปอ' });
  });
});

// Phase P0.3-D — Products use the versioned publish/snapshot architecture (see
// products.service.ts's own "Public — reads the latest PUBLISHED SNAPSHOT" comment). `publish()`
// re-reads the live draft row fresh via `DETAIL_INCLUDE` and freezes the entire thing into
// `ProductPublishedSnapshot.data` — since sub-model `translations` now flows through the mapper
// unchanged, this proves it also flows through the snapshot unchanged, with no special-casing
// needed (same mechanism Contact's `buildSnapshotPayload()` relies on).
describe('ProductsService.publish — sub-model translations reach the snapshot', () => {
  it("embeds a shape/spec/packaging row's translations into the published snapshot as-is", async () => {
    const { service, product, productPublishedSnapshot } = buildService();
    const draftProduct = {
      id: 'p1',
      slug: 'copra',
      shapes: [
        {
          id: 'shape-1',
          name: 'CUBE',
          translations: { id: { name: 'KUBUS' } },
        },
      ],
      specifications: [
        {
          id: 'spec-1',
          specKey: 'Moisture',
          translations: { id: { specKey: 'Kadar Air' } },
        },
      ],
      packagingAndApps: [
        {
          id: 'pkg-1',
          type: 'packaging',
          title: 'Bags',
          translations: { id: { title: 'Karung' } },
        },
      ],
      gallery: [],
      downloads: [],
    };
    product.findUnique
      .mockResolvedValueOnce({ id: 'p1' }) // assertExists
      .mockResolvedValueOnce(draftProduct); // buildSnapshotData
    productPublishedSnapshot.findFirst.mockResolvedValue(null);
    productPublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date('2026-08-23T00:00:00.000Z'),
    });
    product.update.mockResolvedValue({});

    await service.publish('p1', { id: 'admin-1', name: 'Ari' });

    const [call] = productPublishedSnapshot.create.mock.calls[0] as [
      { data: { data: typeof draftProduct } },
    ];
    expect(call.data.data.shapes[0].translations).toEqual({
      id: { name: 'KUBUS' },
    });
    expect(call.data.data.specifications[0].translations).toEqual({
      id: { specKey: 'Kadar Air' },
    });
    expect(call.data.data.packagingAndApps[0].translations).toEqual({
      id: { title: 'Karung' },
    });
  });
});

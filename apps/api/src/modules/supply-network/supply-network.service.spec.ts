import { SupplyNetworkService } from './supply-network.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const supplyNetworkItem = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const prisma = { supplyNetworkItem };
  return {
    service: new SupplyNetworkService(prisma as unknown as PrismaService),
    supplyNetworkItem,
  };
}

function stubSupplyNetworkItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'node-1',
    label: 'DIRECT FARMERS',
    title: 'Local Farmer Network',
    shortTitle: 'Farmers',
    description: 'Sourced directly from farmer cooperatives.',
    icon: 'farmer',
    illustration: null,
    ctaLabel: null,
    ctaHref: null,
    position: 'top',
    order: 0,
    active: true,
    translations: null,
    ...overrides,
  };
}

// Phase 5E-B: the Admin's LocaleTabs editors merge the full six-locale `translations` object
// client-side before every save (see apps/web/.../SupplyNetworkEditor.tsx `handleUpdateTranslation`),
// identical to the Phase 5D/5E-A contract — these tests guard the service half of that contract
// for the Supply Network module, which had zero existing test coverage before this phase.
describe('SupplyNetworkService.update — translation preservation (Phase 5E-B)', () => {
  it('a TH-only edit persists EN, ID, ZH, HI, and VI content unchanged', async () => {
    const { service, supplyNetworkItem } = buildService();
    supplyNetworkItem.findUnique.mockResolvedValue({ id: 'node-1' }); // assertExists
    const mergedAfterThEdit = {
      id: { title: 'Jaringan Petani Lokal' },
      zh: { title: '本地农民网络' },
      hi: { title: 'स्थानीय किसान नेटवर्क' },
      vi: { title: 'Mạng lưới nông dân địa phương' },
      th: { title: 'เครือข่ายเกษตรกรท้องถิ่น (แก้ไขแล้ว)' },
    };
    supplyNetworkItem.update.mockResolvedValue(stubSupplyNetworkItemRow());

    await service.update('node-1', { translations: mergedAfterThEdit });

    const args = supplyNetworkItem.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterThEdit);
    expect(args[0].data.translations.id).toEqual({
      title: 'Jaringan Petani Lokal',
    });
    expect(args[0].data.translations.zh).toEqual({ title: '本地农民网络' });
    expect(args[0].data.translations.hi).toEqual({
      title: 'स्थानीय किसान नेटवर्क',
    });
    expect(args[0].data.translations.vi).toEqual({
      title: 'Mạng lưới nông dân địa phương',
    });
  });

  it('a ZH-only edit persists EN, ID, TH, HI, and VI content unchanged', async () => {
    const { service, supplyNetworkItem } = buildService();
    supplyNetworkItem.findUnique.mockResolvedValue({ id: 'node-1' });
    const mergedAfterZhEdit = {
      id: { title: 'Jaringan Petani Lokal' },
      th: { title: 'เครือข่ายเกษตรกรท้องถิ่น' },
      hi: { title: 'स्थानीय किसान नेटवर्क' },
      vi: { title: 'Mạng lưới nông dân địa phương' },
      zh: { title: '本地农民网络（已编辑）' },
    };
    supplyNetworkItem.update.mockResolvedValue(stubSupplyNetworkItemRow());

    await service.update('node-1', { translations: mergedAfterZhEdit });

    const args = supplyNetworkItem.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterZhEdit);
    expect(args[0].data.translations.id).toEqual({
      title: 'Jaringan Petani Lokal',
    });
    expect(args[0].data.translations.th).toEqual({
      title: 'เครือข่ายเกษตรกรท้องถิ่น',
    });
    expect(args[0].data.translations.hi).toEqual({
      title: 'स्थानीय किसान नेटवर्क',
    });
    expect(args[0].data.translations.vi).toEqual({
      title: 'Mạng lưới nông dân địa phương',
    });
  });

  it('does not touch the translations column when the caller omits it from the patch', async () => {
    const { service, supplyNetworkItem } = buildService();
    supplyNetworkItem.findUnique.mockResolvedValue({ id: 'node-1' });
    supplyNetworkItem.update.mockResolvedValue(stubSupplyNetworkItemRow());

    await service.update('node-1', { title: 'Renamed' });

    const args = supplyNetworkItem.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(args[0].data.translations).toBeUndefined();
  });

  it('leaves non-translatable fields (icon, position, order, active) untouched by a translation-only update', async () => {
    const { service, supplyNetworkItem } = buildService();
    supplyNetworkItem.findUnique.mockResolvedValue({ id: 'node-1' });
    supplyNetworkItem.update.mockResolvedValue(stubSupplyNetworkItemRow());

    await service.update('node-1', {
      translations: { th: { title: 'ทดสอบ' } },
    });

    const args = supplyNetworkItem.update.mock.calls[0] as [
      {
        data: {
          icon: unknown;
          position: unknown;
          order: unknown;
          active: unknown;
        };
      },
    ];
    expect(args[0].data.icon).toBeUndefined();
    expect(args[0].data.position).toBeUndefined();
    expect(args[0].data.order).toBeUndefined();
    expect(args[0].data.active).toBeUndefined();
  });
});

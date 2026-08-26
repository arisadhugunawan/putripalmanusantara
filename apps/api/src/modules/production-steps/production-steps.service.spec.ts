import { ApiException } from '../../common/exceptions/api.exception';
import { ProductionStepsService } from './production-steps.service';
import type { AiTranslationService } from '../ai/ai-translation.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const productionStep = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const homepageProcessSection = {
    upsert: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const prisma = { productionStep, homepageProcessSection };
  return {
    service: new ProductionStepsService(
      prisma as unknown as PrismaService,
      {} as unknown as AiTranslationService,
    ),
    productionStep,
    homepageProcessSection,
  };
}

function stubStepRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'step-1',
    label: 'Step 1',
    title: 'Sorting',
    description: 'Sorting the harvest.',
    icon: null,
    illustration: null,
    illustrationId: null,
    ctaLabel: null,
    ctaHref: null,
    order: 0,
    active: true,
    translations: null,
    ...overrides,
  };
}

function stubSectionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'section-1',
    eyebrow: 'Process',
    heading: 'How We Work',
    description: 'Description',
    finalHeading: null,
    finalDescription: null,
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    translations: null,
    ...overrides,
  };
}

// Phase 5F-P0.3-A — this module had zero automated test coverage before this phase (confirmed
// by the P0.3 translation audit). Both update() and updateSection() previously wrote
// `translations: dto.translations` as a straight column replace; both now merge against the
// row's existing translations first.
describe('ProductionStepsService.update — partial-payload merge safety (Phase 5F-P0.3-A)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, productionStep } = buildService();
    productionStep.findUnique.mockResolvedValue(
      stubStepRow({
        translations: { id: { title: 'Penyortiran' }, zh: { title: '分拣' } },
      }),
    );
    productionStep.update.mockResolvedValue(stubStepRow());

    await service.update('step-1', {
      translations: { th: { title: 'การคัดแยก' } },
    });

    const [call] = productionStep.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({ title: 'การคัดแยก' });
    expect(call.data.translations.id).toEqual({ title: 'Penyortiran' });
    expect(call.data.translations.zh).toEqual({ title: '分拣' });
  });

  it('a single-field edit preserves sibling fields already saved in that same locale', async () => {
    const { service, productionStep } = buildService();
    productionStep.findUnique.mockResolvedValue(
      stubStepRow({
        translations: { vi: { title: 'Tiêu đề cũ', description: 'Mô tả' } },
      }),
    );
    productionStep.update.mockResolvedValue(stubStepRow());

    await service.update('step-1', {
      translations: { vi: { title: 'Tiêu đề mới' } },
    });

    const [call] = productionStep.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.vi).toEqual({
      title: 'Tiêu đề mới',
      description: 'Mô tả',
    });
  });

  it('omitting translations from the patch leaves the column untouched', async () => {
    const { service, productionStep } = buildService();
    productionStep.findUnique.mockResolvedValue(
      stubStepRow({ translations: { id: { title: 'T' } } }),
    );
    productionStep.update.mockResolvedValue(stubStepRow());

    await service.update('step-1', { title: 'New title' });

    const [call] = productionStep.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(call.data.translations).toBeUndefined();
  });

  it('throws NOT_FOUND before attempting any update when the stage does not exist', async () => {
    const { service, productionStep } = buildService();
    productionStep.findUnique.mockResolvedValue(null);

    await expect(service.update('nonexistent', { title: 'x' })).rejects.toThrow(
      ApiException,
    );
    expect(productionStep.update).not.toHaveBeenCalled();
  });
});

describe('ProductionStepsService.updateSection — partial-payload merge safety (Phase 5F-P0.3-A)', () => {
  it('a single-locale partial payload preserves every other locale already saved', async () => {
    const { service, homepageProcessSection } = buildService();
    homepageProcessSection.upsert.mockResolvedValue(
      stubSectionRow({
        translations: {
          id: { heading: 'Cara Kerja Kami' },
          zh: { heading: '我们的工作方式' },
        },
      }),
    );
    homepageProcessSection.update.mockResolvedValue(stubSectionRow());

    await service.updateSection({
      translations: { th: { heading: 'วิธีการทำงานของเรา' } },
    });

    const [call] = homepageProcessSection.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({
      heading: 'วิธีการทำงานของเรา',
    });
    expect(call.data.translations.id).toEqual({ heading: 'Cara Kerja Kami' });
    expect(call.data.translations.zh).toEqual({ heading: '我们的工作方式' });
  });
});

import { AiTranslationService } from './ai-translation.service';

function buildService() {
  const provider = {
    isConfigured: jest.fn<boolean, unknown[]>(),
    generateReply: jest.fn<Promise<string>, unknown[]>(),
  };
  return {
    service: new AiTranslationService(provider),
    provider,
  };
}

const TARGET_LOCALES = ['id', 'zh', 'th', 'hi', 'vi'] as const;

describe('AiTranslationService.translateFields', () => {
  it('returns available:false without calling the provider when unconfigured', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(false);

    const result = await service.translateFields(
      { name: 'Semi Husked Coconut' },
      TARGET_LOCALES,
    );

    expect(result).toEqual({ available: false, translations: {} });
    expect(provider.generateReply).not.toHaveBeenCalled();
  });

  it('parses a well-formed JSON response into the expected shape', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    // One request per locale — each resolves with a flat `{field: value}` object, not nested
    // under the locale key, since the locale is no longer part of the response shape.
    provider.generateReply
      .mockResolvedValueOnce(JSON.stringify({ name: 'Kelapa Semi Kupas' }))
      .mockResolvedValueOnce(JSON.stringify({ name: '半剥壳椰子' }))
      .mockResolvedValueOnce(
        JSON.stringify({ name: 'มะพร้าวปอกเปลือกครึ่งลูก' }),
      )
      .mockResolvedValueOnce(JSON.stringify({ name: 'अर्ध-छिली नारियल' }))
      .mockResolvedValueOnce(JSON.stringify({ name: 'Dừa gọt vỏ một phần' }));

    const result = await service.translateFields(
      { name: 'Semi Husked Coconut' },
      TARGET_LOCALES,
    );

    expect(result.available).toBe(true);
    expect(result.translations.id).toEqual({ name: 'Kelapa Semi Kupas' });
    expect(result.translations.zh).toEqual({ name: '半剥壳椰子' });
    expect(Object.keys(result.translations)).toHaveLength(5);
    expect(provider.generateReply).toHaveBeenCalledTimes(5);
  });

  it('strips a markdown code fence around the JSON before parsing', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    provider.generateReply.mockResolvedValue('```json\n{"name":"Kelapa"}\n```');

    const result = await service.translateFields({ name: 'Coconut' }, ['id']);

    expect(result.translations.id).toEqual({ name: 'Kelapa' });
  });

  it('drops a locale whose response is not valid JSON, without affecting the other locales', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    provider.generateReply
      .mockResolvedValueOnce(JSON.stringify({ name: 'Kelapa' })) // id
      .mockResolvedValueOnce('not valid JSON'); // zh

    const result = await service.translateFields({ name: 'Coconut' }, [
      'id',
      'zh',
    ]);

    expect(result.available).toBe(true);
    expect(result.translations.id).toEqual({ name: 'Kelapa' });
    expect(result.translations.zh).toBeUndefined();
  });

  it('returns available:true with empty translations for completely unparseable output', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    provider.generateReply.mockResolvedValue('Sorry, I cannot help with that.');

    const result = await service.translateFields(
      { name: 'Coconut' },
      TARGET_LOCALES,
    );

    expect(result).toEqual({ available: true, translations: {} });
  });

  it('returns available:true with empty translations when the provider throws, never propagating the error', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    provider.generateReply.mockRejectedValue(new Error('rate limited'));

    const result = await service.translateFields(
      { name: 'Coconut' },
      TARGET_LOCALES,
    );

    expect(result).toEqual({ available: true, translations: {} });
  });

  it('skips calling the provider entirely when every source field is empty', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);

    const result = await service.translateFields(
      { name: '', category: '   ' },
      TARGET_LOCALES,
    );

    expect(result).toEqual({ available: true, translations: {} });
    expect(provider.generateReply).not.toHaveBeenCalled();
  });

  it('only includes non-empty string field values in the parsed result, dropping empty/non-string ones', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    provider.generateReply.mockResolvedValue(
      JSON.stringify({ name: 'Kelapa', category: '', shortDescription: 123 }),
    );

    const result = await service.translateFields(
      { name: 'Coconut', category: 'Copra', shortDescription: 'Fresh.' },
      ['id'],
    );

    expect(result.translations.id).toEqual({ name: 'Kelapa' });
  });
});

describe('AiTranslationService.isConfigured', () => {
  it('passes through the underlying provider check', () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    expect(service.isConfigured()).toBe(true);
    provider.isConfigured.mockReturnValue(false);
    expect(service.isConfigured()).toBe(false);
  });
});

describe('AiTranslationService.generateAndMerge', () => {
  it('returns available:false without calling translateFields when unconfigured', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(false);

    const result = await service.generateAndMerge(
      { name: 'Coconut' },
      { zh: { name: 'Existing Chinese name' } },
    );

    expect(result).toEqual({
      available: false,
      translatedLocales: [],
      generated: {},
      mergedTranslations: undefined,
    });
    expect(provider.generateReply).not.toHaveBeenCalled();
  });

  it('deep-merges the generated translations into the existing column, preserving untouched locales/fields', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    provider.generateReply
      .mockResolvedValueOnce(JSON.stringify({ name: 'Kelapa' })) // id
      .mockResolvedValueOnce(JSON.stringify({})) // zh — nothing translated
      .mockResolvedValueOnce(JSON.stringify({ name: 'มะพร้าว' })); // th

    const result = await service.generateAndMerge(
      { name: 'Coconut' },
      {
        id: { shortDescription: 'Manually written.' },
        zh: { name: 'Existing Chinese name' },
      },
      ['id', 'zh', 'th'],
    );

    expect(result.available).toBe(true);
    expect(result.translatedLocales.sort()).toEqual(['id', 'th']);
    expect(result.generated).toEqual({
      id: { name: 'Kelapa' },
      th: { name: 'มะพร้าว' },
    });
    expect(result.mergedTranslations).toEqual({
      id: { shortDescription: 'Manually written.', name: 'Kelapa' },
      zh: { name: 'Existing Chinese name' },
      th: { name: 'มะพร้าว' },
    });
  });

  it('returns mergedTranslations:undefined (nothing to save) when nothing was generated', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    provider.generateReply.mockResolvedValue('not valid json at all');

    const result = await service.generateAndMerge(
      { name: 'Coconut' },
      { id: { name: 'Existing' } },
    );

    expect(result.available).toBe(true);
    expect(result.translatedLocales).toEqual([]);
    expect(result.generated).toEqual({});
    expect(result.mergedTranslations).toBeUndefined();
  });

  it('defaults targetLocales to every non-English SUPPORTED_LOCALES entry when omitted', async () => {
    const { service, provider } = buildService();
    provider.isConfigured.mockReturnValue(true);
    provider.generateReply.mockResolvedValue('{}');

    await service.generateAndMerge({ name: 'Coconut' }, null);

    // One generateReply call per locale — assert indirectly via each call's systemPrompt,
    // since the locale is the only thing that varies between them.
    expect(provider.generateReply).toHaveBeenCalledTimes(5);
    const localeCodes = provider.generateReply.mock.calls.map((call) => {
      const { systemPrompt } = call[0] as { systemPrompt: string };
      return /locale code: "(\w+)"/.exec(systemPrompt)?.[1];
    });
    expect(localeCodes.sort()).toEqual(['hi', 'id', 'th', 'vi', 'zh']);
  });
});

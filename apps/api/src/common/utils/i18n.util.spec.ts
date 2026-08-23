import { mergeTranslations } from './i18n.util';

const FULL = {
  en: { title: 'Title EN' },
  id: { title: 'Judul ID' },
  zh: { title: '标题 ZH' },
  th: { title: 'หัวข้อ TH' },
  hi: { title: 'शीर्षक HI' },
  vi: { title: 'Tiêu đề VI' },
};

describe('mergeTranslations — Phase 5F-P0.3-A', () => {
  it('A/B/C/D/E/F — updating one locale preserves all five others untouched', () => {
    for (const locale of ['en', 'id', 'zh', 'th', 'hi', 'vi'] as const) {
      const incoming = { [locale]: { title: `Updated ${locale}` } };
      const result = mergeTranslations(FULL, incoming);
      expect(result![locale].title).toBe(`Updated ${locale}`);
      for (const other of ['en', 'id', 'zh', 'th', 'hi', 'vi'] as const) {
        if (other === locale) continue;
        expect(result![other]).toEqual(FULL[other]);
      }
    }
  });

  it('G — updating one field inside a locale preserves sibling fields in that same locale (the exact brief example)', () => {
    const existing = { en: { title: 'Title', description: 'Description' } };
    const incoming = { en: { title: 'New Title' } };

    const result = mergeTranslations(existing, incoming);

    expect(result).toEqual({
      en: { title: 'New Title', description: 'Description' },
    });
  });

  it('H — updating an SEO translation field preserves the normal content translation field in the same locale', () => {
    const existing = { th: { content: 'เนื้อหา', metaTitle: 'SEO เดิม' } };
    const incoming = { th: { metaTitle: 'SEO ใหม่' } };

    const result = mergeTranslations(existing, incoming);

    expect(result!.th).toEqual({ content: 'เนื้อหา', metaTitle: 'SEO ใหม่' });
  });

  it('I — updating normal content preserves the SEO translation field in the same locale', () => {
    const existing = { th: { content: 'เนื้อหาเดิม', metaTitle: 'SEO' } };
    const incoming = { th: { content: 'เนื้อหาใหม่' } };

    const result = mergeTranslations(existing, incoming);

    expect(result!.th).toEqual({ content: 'เนื้อหาใหม่', metaTitle: 'SEO' });
  });

  it('J — an empty incoming object preserves every existing locale exactly (not a wipe signal)', () => {
    const result = mergeTranslations(FULL, {});

    expect(result).toEqual(FULL);
  });

  it('K — undefined incoming returns undefined (Prisma skips the column write; existing data is never touched)', () => {
    expect(mergeTranslations(FULL, undefined)).toBeUndefined();
  });

  it('null incoming also returns undefined — never interpreted as "clear everything"', () => {
    expect(mergeTranslations(FULL, null)).toBeUndefined();
  });

  it('L — a multi-locale partial update leaves every untouched locale exactly as it was', () => {
    const incoming = {
      id: { title: 'Judul Baru' },
      zh: { title: '新标题' },
    };

    const result = mergeTranslations(FULL, incoming);

    expect(result!.id.title).toBe('Judul Baru');
    expect(result!.zh.title).toBe('新标题');
    expect(result!.en).toEqual(FULL.en);
    expect(result!.th).toEqual(FULL.th);
    expect(result!.hi).toEqual(FULL.hi);
    expect(result!.vi).toEqual(FULL.vi);
  });

  it('an explicit empty-string field value overwrites (it is a real, deliberate value, not an omission)', () => {
    const existing = { en: { title: 'Was set', description: 'Kept' } };
    const incoming = { en: { title: '' } };

    const result = mergeTranslations(existing, incoming);

    expect(result!.en).toEqual({ title: '', description: 'Kept' });
  });

  it('a brand-new locale not present in existing is added without disturbing any other locale', () => {
    const existing = { en: { title: 'Title' } };
    const incoming = { id: { title: 'Judul' } };

    const result = mergeTranslations(existing, incoming);

    expect(result).toEqual({ en: { title: 'Title' }, id: { title: 'Judul' } });
  });

  it('existing = null (row has never had any translations) merges cleanly into just the incoming data', () => {
    const result = mergeTranslations(null, { en: { title: 'First ever' } });

    expect(result).toEqual({ en: { title: 'First ever' } });
  });

  it('existing = undefined behaves the same as existing = null', () => {
    const result = mergeTranslations(undefined, {
      en: { title: 'First ever' },
    });

    expect(result).toEqual({ en: { title: 'First ever' } });
  });

  it('a malformed (non-object) locale block in the incoming payload is skipped, not thrown, and does not corrupt other locales', () => {
    const incoming = {
      en: { title: 'Valid' },
      id: 'not an object' as unknown as Record<string, string>,
    };

    const result = mergeTranslations(FULL, incoming);

    expect(result!.en.title).toBe('Valid');
    expect(result!.id).toEqual(FULL.id); // untouched — malformed block ignored, not merged as garbage
  });

  it('a malformed (non-object) existing value never throws — treated as if there were no prior translations', () => {
    const result = mergeTranslations('not an object at all', {
      en: { title: 'New' },
    });

    expect(result).toEqual({ en: { title: 'New' } });
  });

  it('an unrecognized locale key is merged through as-is rather than rejected (validation is explicitly out of scope for this phase)', () => {
    const result = mergeTranslations(FULL, { fr: { title: 'Bonjour' } });

    expect(result!.fr).toEqual({ title: 'Bonjour' });
    expect(result!.en).toEqual(FULL.en); // every real locale still untouched
  });

  it('never mutates the existing object passed in', () => {
    const existing = { en: { title: 'Original' } };
    const snapshot = JSON.parse(JSON.stringify(existing)) as typeof existing;

    mergeTranslations(existing, { en: { title: 'Changed' } });

    expect(existing).toEqual(snapshot);
  });

  it('never mutates the incoming object passed in', () => {
    const incoming = { en: { title: 'New' } };
    const snapshot = JSON.parse(JSON.stringify(incoming)) as typeof incoming;

    mergeTranslations({ en: { title: 'Old', extra: 'kept' } }, incoming);

    expect(incoming).toEqual(snapshot);
  });
});

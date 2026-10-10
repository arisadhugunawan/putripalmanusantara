import { joinKeyTakeaways, toArticleDetail } from './article.mapper';

function stubArticleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    slug: 'copra-export',
    title: 'Copra Export',
    excerpt: 'Excerpt',
    content: '<p>Clean</p>',
    coverImage: null,
    ogImage: null,
    category: null,
    categoryRef: null,
    tags: [],
    author: 'CV Putri Palma Nusantara',
    featured: false,
    contentSource: 'website',
    instagramCaption: null,
    instagramUrl: null,
    instagramDate: null,
    instagramUsername: null,
    instagramPostId: null,
    instagramImportedAt: null,
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
    focusKeyword: null,
    keyTakeaways: [],
    quoteText: null,
    quoteAuthor: null,
    statistics: null,
    readingTimeMinutes: null,
    status: 'published',
    publishedAt: new Date('2026-01-02T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    translations: null,
    galleryImages: [],
    ...overrides,
  };
}

// Phase 5F-P0.1 — read-time defense-in-depth. These simulate a row that was saved BEFORE the
// write-time sanitization existed (i.e. raw malicious HTML already sitting in the database) —
// toArticleDetail() is the one shared mapper used by both the public article page and the AI
// content extractor, so sanitizing here protects every consumer without any migration.
describe('toArticleDetail — read-time XSS defense (Phase 5F-P0.1)', () => {
  it('strips a <script> payload from a pre-existing unsanitized English content value', () => {
    const row = stubArticleRow({
      content: '<p>Hello</p><script>alert(1)</script>',
    });

    const result = toArticleDetail(row as never, 'en');

    expect(result.content).not.toContain('<script');
    expect(result.content).not.toContain('alert(1)');
    expect(result.content).toContain('<p>Hello</p>');
  });

  it('strips a payload from a pre-existing unsanitized translated content value', () => {
    const row = stubArticleRow({
      content: '<p>Clean English</p>',
      translations: {
        th: { content: '<img src=x onerror=alert(1)><p>สะอาด</p>' },
      },
    });

    const result = toArticleDetail(row as never, 'th');

    expect(result.content).not.toContain('onerror');
    expect(result.content).not.toContain('alert(1)');
    expect(result.content).toContain('<p>สะอาด</p>');
  });

  it('leaves already-clean content unchanged (idempotent, no visible diff)', () => {
    const row = stubArticleRow({
      content: '<h2>Heading</h2><p><strong>Bold</strong></p>',
    });

    const result = toArticleDetail(row as never, 'en');

    expect(result.content).toBe('<h2>Heading</h2><p><strong>Bold</strong></p>');
  });
});

// P1.23 QA finding — key_takeaways silently stayed in English on every non-English locale of a
// real published article, because it's a string[] and translate()'s generic mechanism only
// resolves flat string fields. joinKeyTakeaways()/resolveKeyTakeaways() are the fix.
describe('toArticleDetail — key_takeaways per-locale resolution', () => {
  it('falls back to the English array when no translation exists', () => {
    const row = stubArticleRow({
      keyTakeaways: ['Point one.', 'Point two.'],
      translations: null,
    });

    const result = toArticleDetail(row as never, 'th');

    expect(result.key_takeaways).toEqual(['Point one.', 'Point two.']);
  });

  it('splits the translated newline-joined string back into an array', () => {
    const row = stubArticleRow({
      keyTakeaways: ['Point one.', 'Point two.'],
      translations: {
        th: { keyTakeaways: 'ข้อแรก\nข้อสอง' },
      },
    });

    const result = toArticleDetail(row as never, 'th');

    expect(result.key_takeaways).toEqual(['ข้อแรก', 'ข้อสอง']);
  });

  it('never translates for the English locale itself', () => {
    const row = stubArticleRow({
      keyTakeaways: ['Point one.'],
      translations: { en: { keyTakeaways: 'Should never be read' } },
    });

    const result = toArticleDetail(row as never, 'en');

    expect(result.key_takeaways).toEqual(['Point one.']);
  });
});

describe('joinKeyTakeaways', () => {
  it('joins non-empty items with a newline', () => {
    expect(joinKeyTakeaways(['One.', 'Two.'])).toBe('One.\nTwo.');
  });

  it('drops blank/whitespace-only entries', () => {
    expect(joinKeyTakeaways(['One.', '  ', ''])).toBe('One.');
  });

  it('returns an empty string for an empty array', () => {
    expect(joinKeyTakeaways([])).toBe('');
  });
});

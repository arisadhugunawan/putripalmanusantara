import { ArticlesService } from './articles.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const article = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    count: jest.fn<Promise<number>, unknown[]>(),
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const articleCategory = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const prisma = { article, articleCategory };
  return {
    service: new ArticlesService(prisma as unknown as PrismaService),
    article,
    articleCategory,
  };
}

function stubArticleCategoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cat-1',
    name: 'Export News',
    slug: 'export-news',
    description: null,
    order: 0,
    active: true,
    translations: null,
    ...overrides,
  };
}

function stubArticleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    slug: 'copra-export',
    title: 'Copra Export',
    excerpt: 'Excerpt',
    content: '<p>Body</p>',
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

describe('ArticlesService.findAllForAdminPaginated', () => {
  it('paginates using skip/take derived from page/limit and returns total-based meta', async () => {
    const { service, article } = buildService();
    article.findMany.mockResolvedValue([stubArticleRow()]);
    article.count.mockResolvedValue(41);

    const result = await service.findAllForAdminPaginated({
      page: 2,
      limit: 20,
      sort: '-published_at',
    });

    expect(article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
    expect(result.meta).toEqual({
      page: 2,
      limit: 20,
      total: 41,
      total_pages: 3,
    });
  });

  it('searches title/excerpt/instagram caption/category name/tags via q', async () => {
    const { service, article } = buildService();
    article.findMany.mockResolvedValue([]);
    article.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({
      page: 1,
      limit: 20,
      q: '  coconut  ',
      sort: '-published_at',
    });

    const args = article.findMany.mock.calls[0] as [{ where: { OR: unknown } }];
    expect(args[0].where.OR).toEqual([
      { title: { contains: 'coconut', mode: 'insensitive' } },
      { excerpt: { contains: 'coconut', mode: 'insensitive' } },
      { instagramCaption: { contains: 'coconut', mode: 'insensitive' } },
      { categoryRef: { name: { contains: 'coconut', mode: 'insensitive' } } },
      { tags: { has: 'coconut' } },
    ]);
  });

  it('filters by status', async () => {
    const { service, article } = buildService();
    article.findMany.mockResolvedValue([]);
    article.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({
      page: 1,
      limit: 20,
      status: 'draft',
      sort: '-published_at',
    });

    const [args] = article.findMany.mock.calls;
    expect(args[0].where).toMatchObject({ status: 'draft' });
  });

  it('filters by category slug', async () => {
    const { service, article } = buildService();
    article.findMany.mockResolvedValue([]);
    article.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({
      page: 1,
      limit: 20,
      category: 'coconut-export',
      sort: '-published_at',
    });

    const [args] = article.findMany.mock.calls;
    expect(args[0].where).toMatchObject({
      categoryRef: { slug: 'coconut-export' },
    });
  });

  it('content_type=website excludes instagram-only articles', async () => {
    const { service, article } = buildService();
    article.findMany.mockResolvedValue([]);
    article.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({
      page: 1,
      limit: 20,
      content_type: 'website',
      sort: '-published_at',
    });

    const [args] = article.findMany.mock.calls;
    expect(args[0].where).toMatchObject({
      contentSource: { not: 'instagram' },
    });
  });

  it('sort=-featured orders featured first, then published_at desc', async () => {
    const { service, article } = buildService();
    article.findMany.mockResolvedValue([]);
    article.count.mockResolvedValue(0);

    await service.findAllForAdminPaginated({
      page: 1,
      limit: 20,
      sort: '-featured',
    });

    const [args] = article.findMany.mock.calls;
    expect(args[0].orderBy).toEqual([
      { featured: 'desc' },
      { publishedAt: 'desc' },
    ]);
  });
});

// Phase 5E-C: the Admin's LocaleTabs editor (apps/web/.../artikel/[id]/page.tsx
// `updateTranslation`) merges the full six-locale `translations` object in local form state
// before every Save Draft/Publish, identical in contract to the Phase 5D/5E-A/5E-B pattern —
// these tests guard the service half of that contract: a save must persist every locale key
// it was given untouched, never silently dropping the ones the Admin wasn't actively editing.
describe('ArticlesService.update — translation preservation (Phase 5E-C)', () => {
  it('a TH-only title edit persists EN, ID, ZH, HI, and VI content unchanged', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow()); // assertExists
    const mergedAfterThEdit = {
      id: { title: 'Ekspor Kopra' },
      zh: { title: '椰干出口' },
      hi: { title: 'कोपरा निर्यात' },
      vi: { title: 'Xuất khẩu cùi dừa khô' },
      th: { title: 'การส่งออกโคปรา (แก้ไขแล้ว)' },
    };
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', { translations: mergedAfterThEdit });

    const args = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterThEdit);
    expect(args[0].data.translations.id).toEqual({ title: 'Ekspor Kopra' });
    expect(args[0].data.translations.zh).toEqual({ title: '椰干出口' });
    expect(args[0].data.translations.hi).toEqual({ title: 'कोपरा निर्यात' });
    expect(args[0].data.translations.vi).toEqual({
      title: 'Xuất khẩu cùi dừa khô',
    });
  });

  it('a ZH-only excerpt edit persists all other locales unchanged', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    const mergedAfterZhEdit = {
      id: { excerpt: 'Ringkasan ekspor kopra.' },
      th: { excerpt: 'สรุปการส่งออกโคปรา' },
      hi: { excerpt: 'कोपरा निर्यात सारांश।' },
      vi: { excerpt: 'Tóm tắt xuất khẩu cùi dừa khô.' },
      zh: { excerpt: '椰干出口摘要（已编辑）。' },
    };
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', { translations: mergedAfterZhEdit });

    const args = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterZhEdit);
    expect(args[0].data.translations.id).toEqual({
      excerpt: 'Ringkasan ekspor kopra.',
    });
    expect(args[0].data.translations.th).toEqual({
      excerpt: 'สรุปการส่งออกโคปรา',
    });
    expect(args[0].data.translations.hi).toEqual({
      excerpt: 'कोपरा निर्यात सारांश।',
    });
    expect(args[0].data.translations.vi).toEqual({
      excerpt: 'Tóm tắt xuất khẩu cùi dừa khô.',
    });
  });

  it('a VI-only content edit persists all other locales unchanged', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    const mergedAfterViEdit = {
      id: { content: '<p>Isi dalam Bahasa Indonesia.</p>' },
      zh: { content: '<p>中文内容。</p>' },
      th: { content: '<p>เนื้อหาภาษาไทย</p>' },
      hi: { content: '<p>हिन्दी सामग्री।</p>' },
      vi: { content: '<p>Nội dung tiếng Việt (đã chỉnh sửa).</p>' },
    };
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', { translations: mergedAfterViEdit });

    const args = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterViEdit);
    expect(args[0].data.translations.id).toEqual({
      content: '<p>Isi dalam Bahasa Indonesia.</p>',
    });
    expect(args[0].data.translations.zh).toEqual({
      content: '<p>中文内容。</p>',
    });
    expect(args[0].data.translations.th).toEqual({
      content: '<p>เนื้อหาภาษาไทย</p>',
    });
    expect(args[0].data.translations.hi).toEqual({
      content: '<p>हिन्दी सामग्री।</p>',
    });
  });

  it('a TH-only SEO metaTitle edit persists other SEO translations (metaDescription) unchanged', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    const mergedAfterSeoEdit = {
      zh: { metaDescription: '中文元描述。' },
      th: {
        metaTitle: 'ชื่อ SEO ภาษาไทย (แก้ไขแล้ว)',
        metaDescription: 'คำอธิบาย SEO ภาษาไทย',
      },
    };
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', { translations: mergedAfterSeoEdit });

    const args = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterSeoEdit);
    expect(args[0].data.translations.zh).toEqual({
      metaDescription: '中文元描述。',
    });
    expect(args[0].data.translations.th.metaDescription).toBe(
      'คำอธิบาย SEO ภาษาไทย',
    );
  });

  it('does not touch the translations column when the caller omits it from the patch', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', { title: 'Renamed' });

    const args = article.update.mock.calls[0] as [
      { data: { translations: unknown } },
    ];
    expect(args[0].data.translations).toBeUndefined();
  });
});

describe('ArticlesService.updateCategory — translation preservation (Phase 5E-C)', () => {
  it('a TH-only category name edit persists all other locale translations unchanged', async () => {
    const { service, articleCategory } = buildService();
    articleCategory.findUnique.mockResolvedValue(stubArticleCategoryRow()); // assertCategoryExists
    const mergedAfterThEdit = {
      id: { name: 'Berita Ekspor' },
      zh: { name: '出口新闻' },
      hi: { name: 'निर्यात समाचार' },
      vi: { name: 'Tin tức xuất khẩu' },
      th: { name: 'ข่าวการส่งออก (แก้ไขแล้ว)' },
    };
    articleCategory.update.mockResolvedValue(stubArticleCategoryRow());

    await service.updateCategory('cat-1', { translations: mergedAfterThEdit });

    const args = articleCategory.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations).toEqual(mergedAfterThEdit);
    expect(args[0].data.translations.id).toEqual({ name: 'Berita Ekspor' });
    expect(args[0].data.translations.zh).toEqual({ name: '出口新闻' });
    expect(args[0].data.translations.hi).toEqual({ name: 'निर्यात समाचार' });
    expect(args[0].data.translations.vi).toEqual({
      name: 'Tin tức xuất khẩu',
    });
  });
});

// Phase 5F-P0.1 — stored-XSS hardening. Article.content is the confirmed attack surface
// (rendered via dangerouslySetInnerHTML in ArticleDetailView.tsx with no prior sanitization).
// These tests prove the write boundary in ArticlesService.create()/update() actually strips
// malicious markup before it reaches Prisma, for both the English field and every locale's
// translated content.
describe('ArticlesService — stored-XSS hardening (Phase 5F-P0.1)', () => {
  it('create() strips a <script> payload from content before persisting', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(null); // slug not taken
    article.create.mockResolvedValue(stubArticleRow());

    await service.create({
      title: 'Test Article',
      excerpt: 'Excerpt',
      content: '<p>Hello</p><script>alert(1)</script>',
    });

    const args = article.create.mock.calls[0] as [
      { data: { content: string } },
    ];
    expect(args[0].data.content).not.toContain('<script');
    expect(args[0].data.content).not.toContain('alert(1)');
    expect(args[0].data.content).toContain('<p>Hello</p>');
  });

  it('create() strips a malicious payload from every locale in translations.content', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(null);
    article.create.mockResolvedValue(stubArticleRow());

    await service.create({
      title: 'Test Article',
      excerpt: 'Excerpt',
      content: '<p>Clean</p>',
      translations: {
        zh: { content: '<img src=x onerror=alert(1)><p>干净</p>' },
        th: { content: '<svg onload=alert(1)></svg><p>สะอาด</p>' },
      },
    });

    const args = article.create.mock.calls[0] as [
      {
        data: {
          translations: Record<string, Record<string, string>>;
        };
      },
    ];
    expect(args[0].data.translations.zh.content).not.toContain('onerror');
    expect(args[0].data.translations.zh.content).not.toContain('alert(1)');
    expect(args[0].data.translations.zh.content).toContain('<p>干净</p>');
    expect(args[0].data.translations.th.content).not.toContain('<svg');
    expect(args[0].data.translations.th.content).toContain('<p>สะอาด</p>');
  });

  it('update() strips a <a href="javascript:..."> payload from content', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow()); // assertExists
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', {
      content: '<a href="javascript:alert(1)">Click</a><p>Body</p>',
    });

    const args = article.update.mock.calls[0] as [
      { data: { content: string } },
    ];
    expect(args[0].data.content).not.toContain('javascript:');
    expect(args[0].data.content).not.toContain('alert(1)');
    expect(args[0].data.content).toContain('<p>Body</p>');
  });

  it('update() strips an <iframe> payload from every locale in translations.content', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', {
      translations: {
        vi: {
          content: '<iframe src="javascript:alert(1)"></iframe><p>Sạch</p>',
        },
      },
    });

    const args = article.update.mock.calls[0] as [
      {
        data: {
          translations: Record<string, Record<string, string>>;
        };
      },
    ];
    expect(args[0].data.translations.vi.content).not.toContain('<iframe');
    expect(args[0].data.translations.vi.content).not.toContain('javascript:');
    expect(args[0].data.translations.vi.content).toContain('<p>Sạch</p>');
  });

  it('update() preserves legitimate formatting untouched (headings, bold, lists, safe links)', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    article.update.mockResolvedValue(stubArticleRow());

    const legitimateHtml =
      '<h2>Heading</h2><p><strong>Bold</strong> text</p>' +
      '<ul><li>Item</li></ul><a href="https://example.com">Link</a>';

    await service.update('a1', { content: legitimateHtml });

    const args = article.update.mock.calls[0] as [
      { data: { content: string } },
    ];
    expect(args[0].data.content).toContain('<h2>Heading</h2>');
    expect(args[0].data.content).toContain('<strong>Bold</strong>');
    expect(args[0].data.content).toContain('<ul><li>Item</li></ul>');
    expect(args[0].data.content).toContain('href="https://example.com"');
  });

  it('update() leaves content untouched (undefined) when the caller omits it from the patch', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', { title: 'Renamed' });

    const args = article.update.mock.calls[0] as [
      { data: { content: unknown } },
    ];
    expect(args[0].data.content).toBeUndefined();
  });
});

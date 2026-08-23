import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { EventEmitter2 } from '@nestjs/event-emitter';
import { CONTENT_PUBLISHED_EVENT } from '../../common/events/content-published.event';
import { ApiException } from '../../common/exceptions/api.exception';
import type { CurrentAdminPayload } from '../../common/decorators/current-admin.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ArticlesService } from './articles.service';
import type { PrismaService } from '../../prisma/prisma.service';

// Mirrors roles.guard.spec.ts's own helpers exactly — see that file for the guard's generic,
// decorator-agnostic behavior. These are scoped locally so the Article-specific describe block
// below reads as a self-contained proof of the publish/unpublish boundary.
function buildGuardContext(user?: CurrentAdminPayload): ExecutionContext {
  return {
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

function buildRolesGuard(
  requiredRoles: CurrentAdminPayload['role'][] | undefined,
) {
  const reflector = {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

function buildService() {
  const article = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    count: jest.fn<Promise<number>, unknown[]>(),
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    create: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
    delete: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const articleCategory = {
    findUnique: jest.fn<Promise<unknown>, unknown[]>(),
    update: jest.fn<Promise<unknown>, unknown[]>(),
  };
  const articlePublishedSnapshot = {
    findFirst: jest.fn<Promise<unknown>, unknown[]>(),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    create: jest.fn<Promise<unknown>, [{ data: Record<string, unknown> }]>(),
  };
  const articleGalleryImage = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>().mockResolvedValue([]),
  };
  const prisma = {
    article,
    articleCategory,
    articlePublishedSnapshot,
    articleGalleryImage,
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const events = { emit: jest.fn() };
  return {
    service: new ArticlesService(
      prisma as unknown as PrismaService,
      events as unknown as EventEmitter2,
    ),
    article,
    articleCategory,
    articlePublishedSnapshot,
    articleGalleryImage,
    events,
  };
}

const ACTOR = { id: 'admin-1', name: 'Ari' };

/** The frozen JSON blob a real `ArticlePublishedSnapshot.data` row holds — same raw-Prisma-row
 * shape as `stubArticleRow()`, but with dates as ISO strings (how Postgres `jsonb` actually
 * round-trips them) instead of `Date` instances, so these stubs exercise `reviveDates()` for
 * real exactly like production data does. */
function stubSnapshotData(overrides: Record<string, unknown> = {}) {
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
    categoryId: null,
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
    publishedAt: '2026-01-02T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    translations: null,
    galleryImages: [],
    ...overrides,
  };
}

function stubSnapshotRow(
  overrides: {
    articleId?: string;
    version?: number;
    data?: Record<string, unknown>;
  } = {},
) {
  const articleId = overrides.articleId ?? 'a1';
  return {
    id: `snap-${articleId}-${overrides.version ?? 1}`,
    articleId,
    version: overrides.version ?? 1,
    data: stubSnapshotData({ id: articleId, ...overrides.data }),
    publishedById: 'system-backfill',
    publishedByName: 'System (backfilled)',
    publishedAt: new Date('2026-01-02T00:00:00.000Z'),
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

// Phase 5F-P0.3-A — the actual data-preservation guarantee, distinct from the Phase 5E-C tests
// above (which only prove the service round-trips whatever complete object the *client*
// pre-merged). These tests simulate a genuinely partial payload — the shape any non-UI caller,
// or a future admin surface, might legitimately send — against a row that already has other
// locales saved in the database, and prove the server itself now preserves them.
describe('ArticlesService.update — partial-payload merge safety (Phase 5F-P0.3-A)', () => {
  const EXISTING_TRANSLATIONS = {
    en: { title: 'Title EN' },
    id: { title: 'Judul ID' },
    zh: { title: '标题 ZH' },
    th: { title: 'หัวข้อ TH' },
    hi: { title: 'शीर्षक HI' },
    vi: { title: 'Tiêu đề VI' },
  };

  it('A/B/C/D/E/F — a genuinely partial payload for one locale preserves all five others from the database', async () => {
    for (const locale of ['id', 'zh', 'th', 'hi', 'vi'] as const) {
      const { service, article } = buildService();
      article.findUnique.mockResolvedValue(
        stubArticleRow({ translations: EXISTING_TRANSLATIONS }),
      );
      article.update.mockResolvedValue(stubArticleRow());

      await service.update('a1', {
        translations: { [locale]: { title: `Updated via ${locale}` } },
      });

      const [call] = article.update.mock.calls[0] as [
        { data: { translations: Record<string, Record<string, string>> } },
      ];
      expect(call.data.translations[locale].title).toBe(
        `Updated via ${locale}`,
      );
      for (const other of ['en', 'id', 'zh', 'th', 'hi', 'vi'] as const) {
        if (other === locale) continue;
        expect(call.data.translations[other]).toEqual(
          EXISTING_TRANSLATIONS[other],
        );
      }
    }
  });

  it('G — a partial field within one locale preserves sibling fields already saved in that same locale', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(
      stubArticleRow({
        translations: { th: { title: 'หัวข้อ', excerpt: 'บทคัดย่อ' } },
      }),
    );
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', {
      translations: { th: { title: 'หัวข้อใหม่' } },
    });

    const [call] = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({
      title: 'หัวข้อใหม่',
      excerpt: 'บทคัดย่อ',
    });
  });

  it('H — updating an SEO translation field preserves the content translation already saved for that locale', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(
      stubArticleRow({
        translations: {
          th: { content: '<p>เนื้อหาเดิม</p>', metaTitle: 'SEO เดิม' },
        },
      }),
    );
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', {
      translations: { th: { metaTitle: 'SEO ใหม่' } },
    });

    const [call] = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({
      content: '<p>เนื้อหาเดิม</p>',
      metaTitle: 'SEO ใหม่',
    });
  });

  it('I — updating content preserves the SEO translation already saved for that locale', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(
      stubArticleRow({
        translations: {
          th: { content: '<p>เนื้อหาเดิม</p>', metaTitle: 'SEO' },
        },
      }),
    );
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', {
      translations: { th: { content: '<p>เนื้อหาใหม่</p>' } },
    });

    const [call] = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.th).toEqual({
      content: '<p>เนื้อหาใหม่</p>',
      metaTitle: 'SEO',
    });
  });

  it('J — an empty translations object preserves every existing locale exactly', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(
      stubArticleRow({ translations: EXISTING_TRANSLATIONS }),
    );
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', { translations: {} });

    const [call] = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations).toEqual(EXISTING_TRANSLATIONS);
  });

  it('L — a multi-locale partial payload leaves every untouched locale exactly as saved', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(
      stubArticleRow({ translations: EXISTING_TRANSLATIONS }),
    );
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', {
      translations: {
        id: { title: 'Judul Baru' },
        zh: { title: '新标题' },
      },
    });

    const [call] = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.id.title).toBe('Judul Baru');
    expect(call.data.translations.zh.title).toBe('新标题');
    expect(call.data.translations.en).toEqual(EXISTING_TRANSLATIONS.en);
    expect(call.data.translations.th).toEqual(EXISTING_TRANSLATIONS.th);
    expect(call.data.translations.hi).toEqual(EXISTING_TRANSLATIONS.hi);
    expect(call.data.translations.vi).toEqual(EXISTING_TRANSLATIONS.vi);
  });

  it('rich-text sanitization still applies to the merged content field, not just newly-incoming locales', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(
      stubArticleRow({ translations: { en: { title: 'Existing' } } }),
    );
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', {
      translations: {
        vi: { content: '<script>alert(1)</script><p>Sạch</p>' },
      },
    });

    const [call] = article.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations.vi.content).not.toContain('<script');
    expect(call.data.translations.vi.content).toContain('<p>Sạch</p>');
    expect(call.data.translations.en).toEqual({ title: 'Existing' });
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

  it('Phase 5F-P0.3-A — a genuinely partial payload preserves locales already saved in the database, not just those the client happened to resend', async () => {
    const { service, articleCategory } = buildService();
    articleCategory.findUnique.mockResolvedValue(
      stubArticleCategoryRow({
        translations: {
          id: { name: 'Berita Ekspor' },
          zh: { name: '出口新闻' },
        },
      }),
    );
    articleCategory.update.mockResolvedValue(stubArticleCategoryRow());

    await service.updateCategory('cat-1', {
      translations: { th: { name: 'ข่าวการส่งออก' } },
    });

    const args = articleCategory.update.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(args[0].data.translations.th).toEqual({ name: 'ข่าวการส่งออก' });
    expect(args[0].data.translations.id).toEqual({ name: 'Berita Ekspor' });
    expect(args[0].data.translations.zh).toEqual({ name: '出口新闻' });
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

// Phase 5F-P0.2 — Articles/News RBAC + draft/publish boundary. Mirrors the exact
// `ProductsService.update` / `ProductsService.publish` regression pattern (see
// products.service.spec.ts) rather than inventing a new one: `update()` must never be able to
// change `status` (that would let any authenticated admin bypass the `@Roles('super_admin')`
// gate on the controller's dedicated publish/unpublish routes by just including `status` in an
// ordinary content save), and `create()` must never let a new Article be born pre-published.
describe('ArticlesService.create — publish boundary (Phase 5F-P0.2)', () => {
  it('always creates as draft with publishedAt=null — dto.status is ignored', async () => {
    const { service, article } = buildService();
    article.create.mockResolvedValue(stubArticleRow());

    await service.create({
      title: 'New Article',
      excerpt: 'Excerpt',
      content: '<p>Body</p>',
      status: 'published',
    } as never);

    const args = article.create.mock.calls[0] as [
      { data: { status: unknown; publishedAt: unknown } },
    ];
    expect(args[0].data.status).toBe('draft');
    expect(args[0].data.publishedAt).toBeNull();
  });
});

describe('ArticlesService.update — publish boundary (Phase 5F-P0.2)', () => {
  it('never writes status or publishedAt — only publish()/unpublish() may change them', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow()); // assertExists
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', {
      status: 'published',
      title: 'New Title',
    } as never);

    const call = article.update.mock.calls[0][0] as { data: object };
    expect(call.data).not.toHaveProperty('status');
    expect(call.data).not.toHaveProperty('publishedAt');
  });
});

describe('ArticlesService.unpublish (Phase 5F-P0.2)', () => {
  it('sets status=draft and leaves publishedAt untouched (undefined in the update payload)', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(
      stubArticleRow({ status: 'published' }),
    ); // assertExists
    article.update.mockResolvedValue(stubArticleRow({ status: 'draft' }));

    await service.unpublish('a1');

    const args = article.update.mock.calls[0] as [
      {
        where: { id: string };
        data: { status: unknown; publishedAt?: unknown };
      },
    ];
    expect(args[0]).toMatchObject({
      where: { id: 'a1' },
      data: { status: 'draft' },
    });
    expect(args[0].data).not.toHaveProperty('publishedAt');
  });
});

// The concrete Article scenario `RolesGuard` exists to protect — see roles.guard.spec.ts for
// the generic decorator-agnostic behavior; these prove the exact role strings the Article
// publish/unpublish routes require, matching brief §12's explicit ask.
describe('RolesGuard — Article publish/unpublish boundary (Phase 5F-P0.2)', () => {
  it('rejects an editor calling a route restricted to super_admin (publish/unpublish)', () => {
    const guard = buildRolesGuard(['super_admin']);
    expect(() =>
      guard.canActivate(
        buildGuardContext({
          id: 'e1',
          name: 'Editor',
          email: 'editor@ppn.test',
          role: 'editor',
        }),
      ),
    ).toThrow(ApiException);
  });

  it('allows a super_admin through the same restricted route', () => {
    const guard = buildRolesGuard(['super_admin']);
    expect(
      guard.canActivate(
        buildGuardContext({
          id: 's1',
          name: 'Super Admin',
          email: 'admin@ppn.test',
          role: 'super_admin',
        }),
      ),
    ).toBe(true);
  });
});

// Phase 5F-P0.2b-B — the public read boundary. Fixes the exact bug proven during P0.2a:
// Published Article → Editor edits → Save Draft → the public site must not change until the
// next Publish. Every public method must resolve content from the Article's latest
// `ArticlePublishedSnapshot`, never the live row — mirrors `products.service.spec.ts`'s
// "published data boundary" describe block, extended to Article's extra list/related methods.
describe('ArticlesService.findPublishedBySlug — snapshot boundary (Phase 5F-P0.2b-B)', () => {
  it('returns content from the latest snapshot, not the live row', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findFirst.mockResolvedValue({ id: 'a1' });
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({ data: { title: 'Frozen Title' } }),
    );

    const result = await service.findPublishedBySlug('copra-export');

    expect(result.title).toBe('Frozen Title');
    // The live row's actual content is never even selected — only `{ id: true }`.
    expect(article.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'copra-export', status: 'published' },
      }),
    );
  });

  it('selects the latest snapshot by version desc — latest version always wins', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findFirst.mockResolvedValue({ id: 'a1' });
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({ version: 2, data: { title: 'V2 Title' } }),
    );

    await service.findPublishedBySlug('copra-export');

    expect(articlePublishedSnapshot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { articleId: 'a1' },
        orderBy: { version: 'desc' },
      }),
    );
  });

  it('NEVER falls back to the live row when status=published but no snapshot exists', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findFirst.mockResolvedValue({ id: 'a1' });
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);

    await expect(service.findPublishedBySlug('copra-export')).rejects.toThrow(
      ApiException,
    );
  });

  it('excludes drafts — a non-published slug never reaches the snapshot lookup', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findFirst.mockResolvedValue(null); // where: status='published' matched nothing

    await expect(service.findPublishedBySlug('draft-slug')).rejects.toThrow(
      ApiException,
    );
    expect(articlePublishedSnapshot.findFirst).not.toHaveBeenCalled();
  });

  it('revives ISO date strings back into real Dates before mapping', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findFirst.mockResolvedValue({ id: 'a1' });
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({
        data: {
          publishedAt: '2026-03-10T09:30:00.000Z',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-10T09:30:00.000Z',
        },
      }),
    );

    const result = await service.findPublishedBySlug('copra-export');

    expect(result.published_at).toBe('2026-03-10T09:30:00.000Z');
    expect(result.created_at).toBe('2026-03-01T00:00:00.000Z');
    expect(result.updated_at).toBe('2026-03-10T09:30:00.000Z');
  });

  it('preserves the frozen media objects (cover image, og image, gallery)', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    const media = {
      id: 'm1',
      fileUrl: '/media/cover.jpg',
      fileType: 'image/jpeg',
      altText: 'Cover',
      width: 1200,
      height: 630,
      uploadedAt: '2026-01-01T00:00:00.000Z',
    };
    article.findFirst.mockResolvedValue({ id: 'a1' });
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({
        data: {
          coverImage: media,
          galleryImages: [
            { id: 'g1', media, caption: null, altText: null, order: 0 },
          ],
        },
      }),
    );

    const result = await service.findPublishedBySlug('copra-export');

    expect(result.cover_image).toEqual(
      expect.objectContaining({ id: 'm1', file_url: '/media/cover.jpg' }),
    );
    expect(result.gallery_images).toHaveLength(1);
    expect(result.gallery_images[0].media).toEqual(
      expect.objectContaining({ id: 'm1' }),
    );
  });

  it('feeds snapshot translations through the existing translate() logic unchanged', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findFirst.mockResolvedValue({ id: 'a1' });
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({
        data: {
          title: 'English Title',
          translations: {
            id: { title: 'Judul Bahasa Indonesia' },
            zh: { title: '中文标题' },
          },
        },
      }),
    );

    const idResult = await service.findPublishedBySlug('copra-export', 'id');
    const zhResult = await service.findPublishedBySlug('copra-export', 'zh');
    const enResult = await service.findPublishedBySlug('copra-export', 'en');

    expect(idResult.title).toBe('Judul Bahasa Indonesia');
    expect(zhResult.title).toBe('中文标题');
    expect(enResult.title).toBe('English Title');
  });
});

describe('ArticlesService — draft isolation (Phase 5F-P0.2b-B, brief §15)', () => {
  it('a live draft edit (simulated by the live row differing from the snapshot) never leaks into the public response', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    // The live row has since been edited to a different title — but findPublishedBySlug only
    // ever selects `{ id: true }` from it, so this "edit" is structurally unreachable.
    article.findFirst.mockResolvedValue({ id: 'a1' });
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({ data: { title: 'Published V1 Title' } }),
    );

    const result = await service.findPublishedBySlug('copra-export');

    expect(result.title).toBe('Published V1 Title');
  });

  it('a second, newer snapshot (v2) is what the public sees once one exists', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findFirst.mockResolvedValue({ id: 'a1' });
    // findFirst + orderBy:{version:'desc'} is exactly how the DB would return v2 first — the
    // mock returning v2 directly proves the service trusts that ordering rather than picking
    // some other row itself.
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({ version: 2, data: { title: 'Published V2 Title' } }),
    );

    const result = await service.findPublishedBySlug('copra-export');

    expect(result.title).toBe('Published V2 Title');
  });
});

describe('ArticlesService.findPublished — snapshot boundary + list correctness (Phase 5F-P0.2b-B)', () => {
  it('only returns published Articles that have a snapshot — unsnapshotted published Articles are excluded', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
    // a2 is published but has no snapshot yet — absent from the bulk result entirely.
    articlePublishedSnapshot.findMany.mockResolvedValue([
      stubSnapshotRow({ articleId: 'a1', data: { title: 'Has Snapshot' } }),
    ]);

    const result = await service.findPublished({
      page: 1,
      limit: 10,
      sort: '-published_at',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('a1');
    expect(result.meta.total).toBe(1);
  });

  it('a draft Article (excluded from the live status=published query) never reaches the snapshot fetch', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findMany.mockResolvedValue([]); // draft never matched status:'published'
    articlePublishedSnapshot.findMany.mockResolvedValue([]);

    const result = await service.findPublished({
      page: 1,
      limit: 10,
      sort: '-published_at',
    });

    expect(result.items).toHaveLength(0);
    expect(article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'published' } }),
    );
  });

  it('a published Article with multiple snapshots is represented exactly once, by its latest', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findMany.mockResolvedValue([{ id: 'a1' }]);
    // The DB's distinct+orderBy already collapses this to one row per article — the bulk fetch
    // mock reflects that contract directly (Jest can't simulate SQL DISTINCT ON).
    articlePublishedSnapshot.findMany.mockResolvedValue([
      stubSnapshotRow({ articleId: 'a1', version: 3, data: { title: 'V3' } }),
    ]);

    const result = await service.findPublished({
      page: 1,
      limit: 10,
      sort: '-published_at',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('V3');
    expect(articlePublishedSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        distinct: ['articleId'],
        orderBy: [{ articleId: 'asc' }, { version: 'desc' }],
      }),
    );
  });

  it('filters by category_id and featured against the frozen snapshot data', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
    articlePublishedSnapshot.findMany.mockResolvedValue([
      stubSnapshotRow({
        articleId: 'a1',
        data: { categoryId: 'cat-1', featured: true },
      }),
      stubSnapshotRow({
        articleId: 'a2',
        data: { categoryId: 'cat-2', featured: false },
      }),
    ]);

    const result = await service.findPublished({
      page: 1,
      limit: 10,
      sort: '-published_at',
      category_id: 'cat-1',
      featured: true,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('a1');
  });

  it('uses exactly 2 queries regardless of list size — no per-Article snapshot lookup loop', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    const ids = Array.from({ length: 25 }, (_, i) => ({ id: `a${i}` }));
    article.findMany.mockResolvedValue(ids);
    articlePublishedSnapshot.findMany.mockResolvedValue(
      ids.map((a) => stubSnapshotRow({ articleId: a.id })),
    );

    await service.findPublished({
      page: 1,
      limit: 10,
      sort: '-published_at',
    });

    expect(article.findMany).toHaveBeenCalledTimes(1);
    expect(articlePublishedSnapshot.findMany).toHaveBeenCalledTimes(1);
  });
});

describe('ArticlesService.findLatest — snapshot boundary (Phase 5F-P0.2b-B)', () => {
  it('returns snapshot-backed summaries, newest first, capped at 3', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findMany.mockResolvedValue([
      { id: 'a1' },
      { id: 'a2' },
      { id: 'a3' },
      { id: 'a4' },
    ]);
    articlePublishedSnapshot.findMany.mockResolvedValue([
      stubSnapshotRow({
        articleId: 'a1',
        data: { title: 'Oldest', publishedAt: '2026-01-01T00:00:00.000Z' },
      }),
      stubSnapshotRow({
        articleId: 'a2',
        data: { title: 'Newest', publishedAt: '2026-01-04T00:00:00.000Z' },
      }),
      stubSnapshotRow({
        articleId: 'a3',
        data: { title: 'Middle', publishedAt: '2026-01-03T00:00:00.000Z' },
      }),
      stubSnapshotRow({
        articleId: 'a4',
        data: { title: 'Second', publishedAt: '2026-01-02T00:00:00.000Z' },
      }),
    ]);

    const result = await service.findLatest();

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.title)).toEqual(['Newest', 'Middle', 'Second']);
  });
});

describe('ArticlesService.findRelated — snapshot boundary (Phase 5F-P0.2b-B)', () => {
  it('resolves the source Article category from ITS latest snapshot, not the live row', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({ articleId: 'a1', data: { categoryId: 'cat-1' } }),
    );
    article.findMany.mockResolvedValue([]);
    articlePublishedSnapshot.findMany.mockResolvedValue([]);

    await service.findRelated('a1');

    expect(articlePublishedSnapshot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { articleId: 'a1' },
        orderBy: { version: 'desc' },
      }),
    );
    // The live row's own categoryId is never read at all — only the snapshot's.
    expect(article.findUnique).not.toHaveBeenCalled();
  });

  it('returns [] when the source Article has no snapshot (never reads the live row for content)', async () => {
    const { service, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);

    const result = await service.findRelated('a1');

    expect(result).toEqual([]);
  });

  it('only returns published Articles that have a snapshot, matched by category, excluding the source', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({ articleId: 'a1', data: { categoryId: 'cat-1' } }),
    );
    article.findMany.mockResolvedValue([
      { id: 'a1' },
      { id: 'a2' },
      { id: 'a3' },
    ]);
    articlePublishedSnapshot.findMany.mockResolvedValue([
      stubSnapshotRow({ articleId: 'a1', data: { categoryId: 'cat-1' } }),
      stubSnapshotRow({
        articleId: 'a2',
        data: { categoryId: 'cat-1', title: 'Same Category' },
      }),
      stubSnapshotRow({
        articleId: 'a3',
        data: { categoryId: 'cat-2', title: 'Different Category' },
      }),
    ]);

    const result = await service.findRelated('a1', 'en', 3);

    // a1 (the source) is excluded; a2 matches category; a3 is the fallback fill.
    expect(result.map((r) => r.id)).toEqual(['a2', 'a3']);
  });

  it('excludes a published-but-unsnapshotted candidate from related results', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({ articleId: 'a1', data: { categoryId: 'cat-1' } }),
    );
    article.findMany.mockResolvedValue([
      { id: 'a1' },
      { id: 'a2' },
      { id: 'a3' },
    ]);
    // a3 is published but has no snapshot — absent from the bulk fetch entirely.
    articlePublishedSnapshot.findMany.mockResolvedValue([
      stubSnapshotRow({ articleId: 'a1', data: { categoryId: 'cat-1' } }),
      stubSnapshotRow({ articleId: 'a2', data: { categoryId: 'cat-1' } }),
    ]);

    const result = await service.findRelated('a1', 'en', 3);

    expect(result.map((r) => r.id)).toEqual(['a2']);
  });

  it('uses a fixed, small query count regardless of candidate pool size (no N+1)', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst.mockResolvedValue(
      stubSnapshotRow({ articleId: 'a1', data: { categoryId: 'cat-1' } }),
    );
    const ids = Array.from({ length: 30 }, (_, i) => ({ id: `a${i}` }));
    article.findMany.mockResolvedValue(ids);
    articlePublishedSnapshot.findMany.mockResolvedValue(
      ids.map((a) =>
        stubSnapshotRow({ articleId: a.id, data: { categoryId: 'cat-1' } }),
      ),
    );

    await service.findRelated('a1');

    // 1 source-snapshot lookup + 1 eligible-id query + 1 bulk snapshot query = 3, fixed.
    expect(articlePublishedSnapshot.findFirst).toHaveBeenCalledTimes(1);
    expect(article.findMany).toHaveBeenCalledTimes(1);
    expect(articlePublishedSnapshot.findMany).toHaveBeenCalledTimes(1);
  });
});

describe('ArticlesService — admin reads still see the live draft row (Phase 5F-P0.2b-B)', () => {
  it('findByIdForAdmin reads the live Article row directly, never a snapshot', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findUnique.mockResolvedValue(
      stubArticleRow({ title: 'Live Draft Title' }),
    );

    const result = await service.findByIdForAdmin('a1');

    expect(result.title).toBe('Live Draft Title');
    expect(articlePublishedSnapshot.findFirst).not.toHaveBeenCalled();
    expect(articlePublishedSnapshot.findMany).not.toHaveBeenCalled();
  });

  it('findAllForAdmin reads live Article rows directly, never a snapshot', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findMany.mockResolvedValue([stubArticleRow()]);

    await service.findAllForAdmin();

    expect(articlePublishedSnapshot.findFirst).not.toHaveBeenCalled();
    expect(articlePublishedSnapshot.findMany).not.toHaveBeenCalled();
  });
});

// Phase 5F-P0.2b-C — the write half of the publish lifecycle: publish() now creates an
// immutable ArticlePublishedSnapshot transactionally instead of just flipping status, closing
// the interim "published Article without a snapshot → public 404" window P0.2b-B opened.
// Mirrors products.service.spec.ts's publish/restore describe blocks exactly.
describe('ArticlesService.publish (Phase 5F-P0.2b-C)', () => {
  it('creates version 1 and sets status=published for a never-published article', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findUnique.mockResolvedValueOnce(
      stubArticleRow({ status: 'draft' }),
    ); // assertExists
    article.findUnique.mockResolvedValueOnce(
      stubArticleRow({ status: 'draft' }),
    ); // buildSnapshotData
    articlePublishedSnapshot.findFirst.mockResolvedValue(null); // no prior version
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    article.update.mockResolvedValue(stubArticleRow({ status: 'published' }));

    const result = await service.publish('a1', ACTOR);

    expect(result).toEqual({
      id: 'snap-1',
      version: 1,
      published_at: '2026-02-01T00:00:00.000Z',
    });
    const [createArgs] = articlePublishedSnapshot.create.mock.calls;
    expect(createArgs[0].data.version).toBe(1);
    expect(createArgs[0].data.articleId).toBe('a1');
  });

  it('increments to the next version on a second publish', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    articlePublishedSnapshot.findFirst.mockResolvedValue({ version: 3 });
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-4',
      version: 4,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.publish('a1', ACTOR);

    const [call] = articlePublishedSnapshot.create.mock.calls;
    expect(call[0].data.version).toBe(4);
  });

  it('sets status=published, publishedAt, and lastPublishedAt using ONE shared `now`', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow({ status: 'draft' }));
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);
    articlePublishedSnapshot.create.mockImplementation((args) =>
      Promise.resolve({
        id: 'snap-1',
        version: args.data.version,
        publishedAt: args.data.publishedAt,
      }),
    );
    article.update.mockResolvedValue(stubArticleRow());

    await service.publish('a1', ACTOR);

    const [snapshotCall] = articlePublishedSnapshot.create.mock.calls;
    const [updateCall] = article.update.mock.calls[0] as [
      {
        data: {
          status: unknown;
          publishedAt: Date;
          lastPublishedAt: Date;
          updatedAt: Date;
        };
      },
    ];
    expect(updateCall.data.status).toBe('published');
    expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
    // All three timestamps are the exact same Date instance — proves no @updatedAt drift.
    expect(updateCall.data.publishedAt).toBe(updateCall.data.lastPublishedAt);
    expect(updateCall.data.publishedAt).toBe(updateCall.data.updatedAt);
    expect(snapshotCall[0].data.publishedAt).toEqual(
      updateCall.data.publishedAt,
    );
  });

  // Caught live during P0.2b-C verification: `buildSnapshotData()` reads the live row BEFORE
  // this transaction updates it, so the frozen blob's OWN `publishedAt` field (which
  // `toArticleSummary` reads for the public "published_at" display, separately from the
  // snapshot row's own `publishedAt` metadata column) was silently stuck at whatever the
  // PREVIOUS publish had set — a v2 publish's public page kept showing v1's date forever.
  it("overrides the frozen data's own stale publishedAt/status with the fresh `now` — not the pre-publish live-row value", async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    // The live row still carries the OLD publish's data at the moment buildSnapshotData() reads
    // it — status is already 'published' from the prior publish, and publishedAt is stale.
    const stalePublishedAt = new Date('2026-01-01T00:00:00.000Z');
    article.findUnique.mockResolvedValue(
      stubArticleRow({ status: 'published', publishedAt: stalePublishedAt }),
    );
    articlePublishedSnapshot.findFirst.mockResolvedValue({ version: 1 });
    articlePublishedSnapshot.create.mockImplementation((args) =>
      Promise.resolve({
        id: 'snap-2',
        version: args.data.version,
        publishedAt: args.data.publishedAt,
      }),
    );
    article.update.mockResolvedValue(stubArticleRow());

    await service.publish('a1', ACTOR);

    const [snapshotCall] = articlePublishedSnapshot.create.mock.calls;
    const frozenData = snapshotCall[0].data.data as {
      status: unknown;
      publishedAt: Date;
    };
    expect(frozenData.publishedAt).not.toEqual(stalePublishedAt);
    expect(frozenData.publishedAt).toEqual(snapshotCall[0].data.publishedAt);
    expect(frozenData.status).toBe('published');
  });

  it('records the authenticated admin as publisher — never "system"', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.publish('a1', { id: 'admin-42', name: 'Super Admin' });

    const [call] = articlePublishedSnapshot.create.mock.calls;
    expect(call[0].data.publishedById).toBe('admin-42');
    expect(call[0].data.publishedByName).toBe('Super Admin');
    expect(call[0].data.publishedById).not.toBe('system');
  });

  it('wraps the snapshot create and the article publish update in one transaction', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.publish('a1', ACTOR);

    expect(article.update).toHaveBeenCalledTimes(1);
    expect(articlePublishedSnapshot.create).toHaveBeenCalledTimes(1);
  });

  it('preserves translations, SEO fields, category, author, and media exactly as they are on the live row', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    const liveRow = stubArticleRow({
      translations: {
        id: { title: 'Judul ID' },
        zh: { title: '中文标题' },
        th: { title: 'หัวข้อภาษาไทย' },
        hi: { title: 'हिन्दी शीर्षक' },
        vi: { title: 'Tiêu đề tiếng Việt' },
      },
      metaTitle: 'SEO Title',
      metaDescription: 'SEO Description',
      focusKeyword: 'coconut export',
      canonicalUrl: 'https://ppn.example/copra-export',
      ogImage: { id: 'og1', fileUrl: '/og.jpg' },
      category: null,
      categoryRef: { id: 'cat-1', name: 'Export News', slug: 'export-news' },
      author: 'CV Putri Palma Nusantara',
      coverImage: { id: 'cover1', fileUrl: '/cover.jpg' },
      galleryImages: [{ id: 'g1', media: { id: 'm1' }, order: 0 }],
    });
    article.findUnique.mockResolvedValue(liveRow);
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(liveRow);

    await service.publish('a1', ACTOR);

    const [call] = articlePublishedSnapshot.create.mock.calls;
    const snapshotData = call[0].data.data as Record<string, unknown>;
    expect(snapshotData.translations).toEqual(liveRow.translations);
    expect(snapshotData.metaTitle).toBe('SEO Title');
    expect(snapshotData.metaDescription).toBe('SEO Description');
    expect(snapshotData.focusKeyword).toBe('coconut export');
    expect(snapshotData.canonicalUrl).toBe('https://ppn.example/copra-export');
    expect(snapshotData.ogImage).toEqual({ id: 'og1', fileUrl: '/og.jpg' });
    expect(snapshotData.categoryRef).toEqual(liveRow.categoryRef);
    expect(snapshotData.author).toBe('CV Putri Palma Nusantara');
    expect(snapshotData.coverImage).toEqual(liveRow.coverImage);
    expect(snapshotData.galleryImages).toEqual(liveRow.galleryImages);
  });
});

describe('ArticlesService.restoreSnapshot (Phase 5F-P0.2b-C)', () => {
  it('creates a new incrementing version copying the source snapshot data verbatim', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-1',
        articleId: 'a1',
        version: 1,
        data: stubSnapshotData({ title: 'Restored From V1' }),
      }) // source lookup
      .mockResolvedValueOnce({ version: 3 }); // last version lookup
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-4',
      version: 4,
      publishedAt: new Date('2026-03-01T00:00:00.000Z'),
    });
    article.update.mockResolvedValue(stubArticleRow());

    const result = await service.restoreSnapshot('a1', 'snap-1', ACTOR);

    expect(result).toEqual({
      id: 'snap-4',
      version: 4,
      published_at: '2026-03-01T00:00:00.000Z',
    });
    const [call] = articlePublishedSnapshot.create.mock.calls;
    expect(call[0].data.version).toBe(4);
    expect((call[0].data.data as Record<string, unknown>).title).toBe(
      'Restored From V1',
    );
  });

  it('does not mutate or delete the source snapshot — old versions remain', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-1',
        articleId: 'a1',
        version: 1,
        data: stubSnapshotData(),
      })
      .mockResolvedValueOnce({ version: 3 });
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-4',
      version: 4,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.restoreSnapshot('a1', 'snap-1', ACTOR);

    // Only ever creates — never updates or deletes an existing snapshot row.
    expect(articlePublishedSnapshot.create).toHaveBeenCalledTimes(1);
  });

  it('records the RESTORING admin as the new snapshot publisher, never the original publisher', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-1',
        articleId: 'a1',
        version: 1,
        data: stubSnapshotData(),
        publishedById: 'admin-A',
        publishedByName: 'Admin A',
      })
      .mockResolvedValueOnce({ version: 1 });
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-2',
      version: 2,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.restoreSnapshot('a1', 'snap-1', {
      id: 'admin-B',
      name: 'Admin B',
    });

    const [call] = articlePublishedSnapshot.create.mock.calls;
    expect(call[0].data.publishedById).toBe('admin-B');
    expect(call[0].data.publishedByName).toBe('Admin B');
  });

  it('uses ONE shared `now` for the new snapshot and Article.publishedAt/lastPublishedAt', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-1',
        articleId: 'a1',
        version: 1,
        data: stubSnapshotData(),
      })
      .mockResolvedValueOnce({ version: 1 });
    articlePublishedSnapshot.create.mockImplementation((args) =>
      Promise.resolve({
        id: 'snap-2',
        version: args.data.version,
        publishedAt: args.data.publishedAt,
      }),
    );
    article.update.mockResolvedValue(stubArticleRow());

    await service.restoreSnapshot('a1', 'snap-1', ACTOR);

    const [snapshotCall] = articlePublishedSnapshot.create.mock.calls;
    const [updateCall] = article.update.mock.calls[0] as [
      { data: { publishedAt: Date; lastPublishedAt: Date; updatedAt: Date } },
    ];
    expect(updateCall.data.publishedAt).toBe(updateCall.data.lastPublishedAt);
    expect(updateCall.data.publishedAt).toBe(updateCall.data.updatedAt);
    expect(snapshotCall[0].data.publishedAt).toEqual(
      updateCall.data.publishedAt,
    );
  });

  it('sets Article back to status=published (a restore is a publish)', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-1',
        articleId: 'a1',
        version: 1,
        data: stubSnapshotData(),
      })
      .mockResolvedValueOnce(null);
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-2',
      version: 2,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.restoreSnapshot('a1', 'snap-1', ACTOR);

    const [updateCall] = article.update.mock.calls[0] as [
      { data: { status: unknown } },
    ];
    expect(updateCall.data.status).toBe('published');
  });

  it('throws NOT_FOUND when the snapshot does not exist', async () => {
    const { service, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);

    await expect(
      service.restoreSnapshot('a1', 'nonexistent', ACTOR),
    ).rejects.toThrow(ApiException);
  });

  it('throws NOT_FOUND (never leaks ownership) when the snapshot belongs to a different Article', async () => {
    const { service, articlePublishedSnapshot } = buildService();
    // The query itself scopes by { id: snapshotId, articleId } — a mismatched articleId means
    // the DB returns no row at all, which is exactly what this mock simulates.
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);

    await expect(
      service.restoreSnapshot('a1', 'snap-belongs-to-a2', ACTOR),
    ).rejects.toThrow(ApiException);
  });
});

describe('ArticlesService.listSnapshots (Phase 5F-P0.2b-C)', () => {
  it('returns snapshots newest-first with the documented fields only', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow()); // assertExists
    articlePublishedSnapshot.findMany.mockResolvedValue([
      {
        id: 'snap-2',
        version: 2,
        publishedAt: new Date('2026-02-01T00:00:00.000Z'),
        publishedById: 'admin-1',
        publishedByName: 'Ari',
      },
      {
        id: 'snap-1',
        version: 1,
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
        publishedById: 'system-backfill',
        publishedByName: 'System (backfilled)',
      },
    ]);

    const result = await service.listSnapshots('a1');

    expect(result).toEqual([
      {
        id: 'snap-2',
        version: 2,
        published_at: '2026-02-01T00:00:00.000Z',
        published_by_id: 'admin-1',
        published_by_name: 'Ari',
      },
      {
        id: 'snap-1',
        version: 1,
        published_at: '2026-01-01T00:00:00.000Z',
        published_by_id: 'system-backfill',
        published_by_name: 'System (backfilled)',
      },
    ]);
    expect(articlePublishedSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { articleId: 'a1' },
        orderBy: { version: 'desc' },
      }),
    );
  });
});

// The concrete Article scenario RolesGuard exists to protect for the new P0.2b-C routes — see
// roles.guard.spec.ts for the generic behavior and admin-articles.controller.spec.ts for the
// decorator-placement proof; these prove the SERVICE-level RBAC-relevant behavior stays
// reachable only via the role-gated routes (the guard itself is what actually blocks editors —
// these tests document that publish/restore accept an actor and don't special-case role).
describe('RolesGuard — Article publish/unpublish/restore boundary (Phase 5F-P0.2b-C)', () => {
  it('rejects an editor calling publish/unpublish/restore (super_admin only)', () => {
    const guard = buildRolesGuard(['super_admin']);
    const editor: CurrentAdminPayload = {
      id: 'e1',
      name: 'Editor',
      email: 'editor@ppn.test',
      role: 'editor',
    };
    expect(() => guard.canActivate(buildGuardContext(editor))).toThrow(
      ApiException,
    );
  });

  it('allows a super_admin through publish/unpublish/restore', () => {
    const guard = buildRolesGuard(['super_admin']);
    const superAdmin: CurrentAdminPayload = {
      id: 's1',
      name: 'Super Admin',
      email: 'admin@ppn.test',
      role: 'super_admin',
    };
    expect(guard.canActivate(buildGuardContext(superAdmin))).toBe(true);
  });
});

describe('ArticlesService — dates revived correctly through publish + restore (Phase 5F-P0.2b-C)', () => {
  it('a restored snapshot, once read publicly, has correctly revived ISO dates', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    articlePublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-1',
        articleId: 'a1',
        version: 1,
        data: stubSnapshotData({
          publishedAt: '2026-01-05T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      })
      .mockResolvedValueOnce(null);
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-2',
      version: 2,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.restoreSnapshot('a1', 'snap-1', ACTOR);

    const [call] = articlePublishedSnapshot.create.mock.calls;
    const restoredData = call[0].data.data as { publishedAt: string };
    // The restored data field is the source's raw frozen JSON, dates included — verbatim, not
    // re-revived (revival only happens at PUBLIC READ time, in ArticlesService's Public methods).
    expect(restoredData.publishedAt).toBe('2026-01-05T00:00:00.000Z');
  });
});

// P0.2b-C hotfix — live verification found that deleting an Article with published snapshot
// history threw a raw, unhandled Prisma P2003 (surfaced as an opaque 500) instead of a clear
// application error. Mirrors products.service.spec.ts's identical
// "converts a P2003 foreign-key violation into ..._HAS_PUBLISHED_HISTORY (409)" test exactly.
// The real Prisma 7 driver-adapter error shape for this exact FK RESTRICT violation,
// confirmed empirically against the live dev DB during hotfix verification — NOT the classic
// P2003 that ProductsService.remove()'s identical pattern assumes. Prisma's driver-adapter
// architecture wraps this specific violation as the generic unmapped-error code P2039, with the
// real Postgres SQLSTATE (23001 = restrict_violation) preserved in `error.meta`.
function stubDriverAdapterRestrictError() {
  return {
    code: 'P2039',
    meta: {
      modelName: 'Article',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          originalCode: '23001',
          kind: 'postgres',
          code: '23001',
        },
      },
    },
  };
}

describe('ArticlesService.remove (P0.2b-C hotfix)', () => {
  it('converts the real Prisma 7 driver-adapter P2039/23001 error into ARTICLE_HAS_PUBLISHED_HISTORY (409)', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow()); // assertExists
    article.delete.mockRejectedValue(stubDriverAdapterRestrictError());

    let thrown: ApiException | undefined;
    try {
      await service.remove('a1');
    } catch (err) {
      thrown = err as ApiException;
    }
    expect(thrown).toBeInstanceOf(ApiException);
    expect(thrown?.code).toBe('ARTICLE_HAS_PUBLISHED_HISTORY');
    expect(thrown?.getStatus()).toBe(409);
  });

  it("also converts a classic P2003 (Prisma's documented code, kept as a forward-compatible fallback)", async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    article.delete.mockRejectedValue({ code: 'P2003' });

    await expect(service.remove('a1')).rejects.toMatchObject({
      code: 'ARTICLE_HAS_PUBLISHED_HISTORY',
    });
  });

  it('does NOT convert an unrelated P2039 (a different, non-RESTRICT database error)', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    const unrelatedError = {
      code: 'P2039',
      meta: {
        driverAdapterError: { cause: { originalCode: '40001' } }, // serialization_failure, unrelated
      },
    };
    article.delete.mockRejectedValue(unrelatedError);

    await expect(service.remove('a1')).rejects.toBe(unrelatedError);
  });

  it('does not attempt to delete any snapshot as part of the failed removal', async () => {
    const { service, article, articlePublishedSnapshot } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    article.delete.mockRejectedValue(stubDriverAdapterRestrictError());

    await expect(service.remove('a1')).rejects.toThrow(ApiException);

    // ArticlesService never calls a snapshot-deleting method anywhere — this asserts the mock
    // has no such method invoked, i.e. history genuinely stays untouched.
    expect(articlePublishedSnapshot.findFirst).not.toHaveBeenCalled();
    expect(articlePublishedSnapshot.findMany).not.toHaveBeenCalled();
  });

  it('an Article with no snapshot history still deletes normally', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    article.delete.mockResolvedValue(stubArticleRow());

    const result = await service.remove('a1');

    expect(result).toEqual({ deleted: true });
    expect(article.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
  });

  it('re-throws any other error unchanged — only P2003 is special-cased', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    const otherError = new Error('connection lost');
    article.delete.mockRejectedValue(otherError);

    await expect(service.remove('a1')).rejects.toBe(otherError);
  });

  it('a missing Article still throws the existing NOT_FOUND before any delete is attempted', async () => {
    const { service, article } = buildService();
    article.findUnique.mockResolvedValue(null); // assertExists

    await expect(service.remove('nonexistent')).rejects.toThrow(ApiException);
    expect(article.delete).not.toHaveBeenCalled();
  });
});

// Phase 5F-P0.2b-D — publish()/restoreSnapshot() now emit CONTENT_PUBLISHED_EVENT, the exact
// same domain-neutral event Products/Homepage/About Company/Contact already emit, so
// AiPublishSyncListener triggers an immediate AI resync instead of waiting for the 5-minute
// cron. Mirrors products.service.spec.ts's publish/restore event-emission tests — no new event
// system, no listener changes (it was already fully source-agnostic).
describe('ArticlesService.publish — AI sync event (Phase 5F-P0.2b-D)', () => {
  it('emits CONTENT_PUBLISHED_EVENT with source="news" and the article id', async () => {
    const { service, article, articlePublishedSnapshot, events } =
      buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.publish('a1', ACTOR);

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(CONTENT_PUBLISHED_EVENT, {
      source: 'news',
      entityId: 'a1',
    });
  });

  it('never includes the article content/body in the event payload', async () => {
    const { service, article, articlePublishedSnapshot, events } =
      buildService();
    article.findUnique.mockResolvedValue(
      stubArticleRow({ content: '<p>Sensitive draft-adjacent text</p>' }),
    );
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.publish('a1', ACTOR);

    const [, payload] = events.emit.mock.calls[0] as [string, unknown];
    // Only { source, entityId } — the AI listener must re-read published content itself, never
    // receive it smuggled through the event (same rule as Products/Homepage/About Company).
    expect(Object.keys(payload as object).sort()).toEqual([
      'entityId',
      'source',
    ]);
  });

  it('emits the event only AFTER the snapshot-create + status-update transaction resolves', async () => {
    const { service, article, articlePublishedSnapshot, events } =
      buildService();
    const callOrder: string[] = [];
    article.findUnique.mockResolvedValue(stubArticleRow());
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);
    articlePublishedSnapshot.create.mockImplementation((args) => {
      callOrder.push('snapshot.create');
      return Promise.resolve({
        id: 'snap-1',
        version: args.data.version,
        publishedAt: args.data.publishedAt,
      });
    });
    article.update.mockImplementation(() => {
      callOrder.push('article.update');
      return Promise.resolve(stubArticleRow());
    });
    events.emit.mockImplementation(() => {
      callOrder.push('event.emit');
    });

    await service.publish('a1', ACTOR);

    expect(callOrder).toEqual([
      'snapshot.create',
      'article.update',
      'event.emit',
    ]);
  });

  it('emits NO event when the publish transaction fails — AI must never index a failed publish', async () => {
    const { service, article, articlePublishedSnapshot, events } =
      buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-1',
      version: 1,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());
    // Override $transaction itself (not the individual calls) to simulate a failed COMMIT —
    // both operations were attempted, but the transaction as a whole did not succeed.
    const transactionError = new Error('transaction rolled back');
    const prisma = (
      service as unknown as { prisma: { $transaction: jest.Mock } }
    ).prisma;
    prisma.$transaction.mockRejectedValueOnce(transactionError);

    await expect(service.publish('a1', ACTOR)).rejects.toBe(transactionError);
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('a second publish (creating v2) also emits the event — AI stays current after every publish', async () => {
    const { service, article, articlePublishedSnapshot, events } =
      buildService();
    article.findUnique.mockResolvedValue(stubArticleRow());
    articlePublishedSnapshot.findFirst.mockResolvedValue({ version: 1 });
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-2',
      version: 2,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.publish('a1', ACTOR);

    expect(events.emit).toHaveBeenCalledWith(CONTENT_PUBLISHED_EVENT, {
      source: 'news',
      entityId: 'a1',
    });
  });
});

describe('ArticlesService.update — no AI sync event on draft save (Phase 5F-P0.2b-D)', () => {
  it('an ordinary Save Draft (update()) never emits CONTENT_PUBLISHED_EVENT', async () => {
    const { service, article, events } = buildService();
    article.findUnique.mockResolvedValue(stubArticleRow()); // assertExists
    article.update.mockResolvedValue(stubArticleRow());

    await service.update('a1', { title: 'Edited Draft Title' });

    expect(events.emit).not.toHaveBeenCalled();
  });
});

describe('ArticlesService.restoreSnapshot — AI sync event (Phase 5F-P0.2b-D)', () => {
  it('emits CONTENT_PUBLISHED_EVENT with source="news" after a successful restore', async () => {
    const { service, article, articlePublishedSnapshot, events } =
      buildService();
    articlePublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-1',
        articleId: 'a1',
        version: 1,
        data: stubSnapshotData(),
      })
      .mockResolvedValueOnce({ version: 2 });
    articlePublishedSnapshot.create.mockResolvedValue({
      id: 'snap-3',
      version: 3,
      publishedAt: new Date(),
    });
    article.update.mockResolvedValue(stubArticleRow());

    await service.restoreSnapshot('a1', 'snap-1', ACTOR);

    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(CONTENT_PUBLISHED_EVENT, {
      source: 'news',
      entityId: 'a1',
    });
  });

  it('emits NO event when the snapshot to restore does not exist (nothing was published)', async () => {
    const { service, articlePublishedSnapshot, events } = buildService();
    articlePublishedSnapshot.findFirst.mockResolvedValue(null);

    await expect(
      service.restoreSnapshot('a1', 'nonexistent', ACTOR),
    ).rejects.toThrow(ApiException);
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('emits the event only AFTER the restore transaction resolves', async () => {
    const { service, article, articlePublishedSnapshot, events } =
      buildService();
    const callOrder: string[] = [];
    articlePublishedSnapshot.findFirst
      .mockResolvedValueOnce({
        id: 'snap-1',
        articleId: 'a1',
        version: 1,
        data: stubSnapshotData(),
      })
      .mockResolvedValueOnce(null);
    articlePublishedSnapshot.create.mockImplementation((args) => {
      callOrder.push('snapshot.create');
      return Promise.resolve({
        id: 'snap-2',
        version: args.data.version,
        publishedAt: args.data.publishedAt,
      });
    });
    article.update.mockImplementation(() => {
      callOrder.push('article.update');
      return Promise.resolve(stubArticleRow());
    });
    events.emit.mockImplementation(() => {
      callOrder.push('event.emit');
    });

    await service.restoreSnapshot('a1', 'snap-1', ACTOR);

    expect(callOrder).toEqual([
      'snapshot.create',
      'article.update',
      'event.emit',
    ]);
  });
});

// Phase 5F-P0.3-A (final hardening) — duplicate() clones an entire article into a brand-new
// draft row. It was found missing `translations: source.translations` entirely, so a duplicated
// article silently started with zero translations regardless of how many locales the source had
// filled in — a genuine translation-loss bug distinct from the wholesale-replace-on-update bug
// this phase otherwise fixes. Homepage's `duplicateHeroSlide` etc. already carried this line
// correctly; this brings Articles' `duplicate()` in line with that pattern.
describe('ArticlesService.duplicate — preserves the source translations (Phase 5F-P0.3-A final hardening)', () => {
  it('the new draft carries the complete six-locale translations object from the source', async () => {
    const { service, article } = buildService();
    const sixLocaleTranslations = {
      en: { title: 'English', content: '<p>English</p>' },
      id: { title: 'Indonesia', content: '<p>Indonesia</p>' },
      zh: { title: '标题', content: '<p>内容</p>' },
      th: { title: 'หัวข้อ', content: '<p>เนื้อหา</p>' },
      hi: { title: 'शीर्षक', content: '<p>सामग्री</p>' },
      vi: { title: 'Tiêu đề', content: '<p>Nội dung</p>' },
    };
    article.findUnique.mockResolvedValueOnce(
      stubArticleRow({ translations: sixLocaleTranslations }),
    ); // duplicate()'s own source lookup
    article.findUnique.mockResolvedValueOnce(null); // resolveSlug -> slugTaken: slug is free
    article.create.mockResolvedValue(
      stubArticleRow({ id: 'a2', translations: sixLocaleTranslations }),
    );

    const result = await service.duplicate('a1');

    const [call] = article.create.mock.calls[0] as [
      { data: { translations: Record<string, Record<string, string>> } },
    ];
    expect(call.data.translations).toEqual(sixLocaleTranslations);
    expect(Object.keys(call.data.translations)).toEqual([
      'en',
      'id',
      'zh',
      'th',
      'hi',
      'vi',
    ]);
    // Existing duplicate-specific behavior (new draft, not featured, fresh slug) survives
    // unchanged.
    expect(result.id).toBe('a2');
    expect(result.id).not.toBe('a1');
    // The source row is only ever read (source lookup + slug-uniqueness check), never written.
    expect(article.update).not.toHaveBeenCalled();
  });
});

import { ArticlesService } from './articles.service';
import type { PrismaService } from '../../prisma/prisma.service';

function buildService() {
  const article = {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    count: jest.fn<Promise<number>, unknown[]>(),
  };
  const prisma = { article };
  return {
    service: new ArticlesService(prisma as unknown as PrismaService),
    article,
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

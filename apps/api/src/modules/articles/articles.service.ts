import { Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  parseSort,
} from '../../common/dto/pagination-query.dto';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { toArticleDetail, toArticleSummary } from './article.mapper';
import type {
  ArticleQueryDto,
  CreateArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';

const SORT_FIELD_MAP: Record<string, string> = {
  published_at: 'publishedAt',
  created_at: 'createdAt',
  title: 'title',
};

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public ──────────────────────────────────────────────────────────
  async findPublished(query: ArticleQueryDto) {
    const { field, direction } = parseSort(query.sort);
    const orderField = SORT_FIELD_MAP[field] ?? 'publishedAt';

    const where = { status: 'published' as const };
    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: { coverImage: true },
        orderBy: { [orderField]: direction },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: items.map(toArticleSummary),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findLatest() {
    const items = await this.prisma.article.findMany({
      where: { status: 'published' },
      include: { coverImage: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    return items.map(toArticleSummary);
  }

  async findPublishedBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: 'published' },
      include: { coverImage: true },
    });
    if (!article) {
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);
    }
    return toArticleDetail(article);
  }

  // ── Admin ───────────────────────────────────────────────────────────
  async findAllForAdmin() {
    const items = await this.prisma.article.findMany({
      include: { coverImage: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map(toArticleDetail);
  }

  async findByIdForAdmin(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { coverImage: true },
    });
    if (!article) {
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);
    }
    return toArticleDetail(article);
  }

  async create(dto: CreateArticleDto) {
    await this.assertSlugAvailable(dto.slug);
    const article = await this.prisma.article.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImageId: dto.cover_image_id,
        category: dto.category,
        author: dto.author,
        metaTitle: dto.meta_title,
        metaDescription: dto.meta_description,
        status: dto.status ?? 'draft',
        publishedAt: dto.status === 'published' ? new Date() : null,
      },
      include: { coverImage: true },
    });
    return toArticleDetail(article);
  }

  async update(id: string, dto: UpdateArticleDto) {
    const existing = await this.assertExists(id);
    if (dto.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }
    const justPublished =
      dto.status === 'published' && existing.status !== 'published';

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        slug: dto.slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        coverImageId: dto.cover_image_id,
        category: dto.category,
        author: dto.author,
        metaTitle: dto.meta_title,
        metaDescription: dto.meta_description,
        status: dto.status,
        publishedAt: justPublished ? new Date() : undefined,
      },
      include: { coverImage: true },
    });
    return toArticleDetail(article);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.article.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertExists(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article)
      throw new ApiException('NOT_FOUND', 'Article not found.', 404);
    return article;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string) {
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ApiException(
        'CONFLICT',
        `Slug "${slug}" is already in use.`,
        409,
      );
    }
  }
}

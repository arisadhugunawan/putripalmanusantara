import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RetrievedChunk {
  page: string;
  section: string | null;
  language: string;
  sourceUrl: string;
  content: string;
}

interface RawRetrievalRow {
  page: string;
  section: string | null;
  language: string;
  source_url: string;
  content: string;
}

/**
 * Retrieval step of the RAG pipeline — PostgreSQL full-text search against the generated
 * `search_vector` column (see `AiKnowledgeChunk`'s doc comment in schema.prisma for why this is
 * `tsvector`, not embeddings). `websearch_to_tsquery` is used over `plainto_tsquery` because it
 * handles free-text, multi-word buyer questions the way a search engine would (implicit OR/AND
 * heuristics, quoted phrases) rather than requiring every word to match.
 */
@Injectable()
export class AiRetrievalService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    query: string;
    language: string;
    activeVersion: bigint;
    productId?: string | null;
    topK: number;
  }): Promise<RetrievedChunk[]> {
    // `::text` casts are required on the nullable `productId` parameter — Postgres can't infer
    // a bare NULL parameter's type from `product_id = $n` alone in a prepared statement
    // (error 42P18 "could not determine data type of parameter"), reproduced and fixed during
    // launch verification of this feature.
    const productId: string | null = params.productId ?? null;
    const rows = await this.prisma.$queryRaw<RawRetrievalRow[]>`
      SELECT page, section, language, source_url, content
      FROM ai_knowledge_chunks
      WHERE version = ${params.activeVersion}
        AND language = ${params.language}
        AND search_vector @@ websearch_to_tsquery('simple', ${params.query})
      ORDER BY
        (CASE WHEN product_id = ${productId}::text AND ${productId}::text IS NOT NULL THEN 1 ELSE 0 END) DESC,
        ts_rank(search_vector, websearch_to_tsquery('simple', ${params.query})) DESC
      LIMIT ${params.topK}
    `;
    return rows.map((r) => ({
      page: r.page,
      section: r.section,
      language: r.language,
      sourceUrl: r.source_url,
      content: r.content,
    }));
  }

  /** Falls back to the newest chunks for the current product/page when the free-text query
   * matches nothing (e.g. a greeting, or a question phrased with only stopwords) — still scoped
   * to real published content, never fabricated. */
  async fallbackForProduct(params: {
    productId: string;
    language: string;
    activeVersion: bigint;
    topK: number;
  }): Promise<RetrievedChunk[]> {
    const rows = await this.prisma.aiKnowledgeChunk.findMany({
      where: {
        version: params.activeVersion,
        language: params.language,
        productId: params.productId,
      },
      orderBy: { updatedAt: 'desc' },
      take: params.topK,
      select: {
        page: true,
        section: true,
        language: true,
        sourceUrl: true,
        content: true,
      },
    });
    return rows.map((r) => ({
      page: r.page,
      section: r.section,
      language: r.language,
      sourceUrl: r.sourceUrl,
      content: r.content,
    }));
  }
}

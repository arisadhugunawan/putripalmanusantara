"use client";

import type { ProductDetail } from "@ppn/shared-types";
import { Card, Container } from "@ppn/ui-components";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

/**
 * Admin-auth-gated Preview for one Product's current DRAFT — mirrors the
 * `/admin/preview/about-company`/`/admin/preview/homepage` pattern (fetch draft data via
 * `adminApi`, never a public/unauthenticated route) rather than the public `/products/[slug]`
 * page's own component tree, which is deeply inlined into that page file rather than built as
 * a reusable component — extracting it would be a real refactor of a page this phase's brief
 * explicitly says not to redesign. This shows the same buyer-facing content in a simpler layout
 * instead: correct data, not pixel-identical to the live page. See Phase 2 report for this
 * scoping call.
 */
export default function ProductPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    adminApi
      .get<ProductDetail>(`/admin/products/${id}/preview`)
      .then((data) => {
        setProduct(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [id]);

  if (status === "loading") {
    return <p className="p-10 text-center text-body text-neutral-600">Memuat pratinjau...</p>;
  }
  if (status === "error" || !product) {
    return <p className="p-10 text-center text-body text-red-600">Gagal memuat pratinjau produk.</p>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 border-b border-amber-200 bg-amber-50 px-6 py-3 text-center text-small font-medium text-amber-900">
        PREVIEW MODE — this shows the current draft, not what is live on the public site.
        {product.has_unpublished_changes === false && " (This draft matches the last published version.)"}
      </div>

      <Container className="py-10">
        <p className="text-small font-medium uppercase tracking-[0.1em] text-primary-700">{product.category}</p>
        <h1 className="mt-1 text-h1 text-neutral-900">{product.name}</h1>
        <p className="mt-3 max-w-2xl text-body text-neutral-600">{product.short_description}</p>

        {product.cover_image && (
          <div className="relative mt-6 aspect-video w-full max-w-2xl overflow-hidden rounded-card bg-neutral-100">
            <Image
              src={product.cover_image.file_url}
              alt={product.cover_image.alt_text || product.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <Card className="mt-8 max-w-2xl">
          <h2 className="text-h3 text-neutral-900">Description</h2>
          <p className="mt-2 whitespace-pre-line text-body text-neutral-700">{product.full_description}</p>
        </Card>

        {product.gallery.length > 0 && (
          <div className="mt-8">
            <h2 className="text-h3 text-neutral-900">Gallery</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {product.gallery.map((item) => (
                <div key={item.id} className="relative aspect-square overflow-hidden rounded-field bg-neutral-100">
                  <Image src={item.media.file_url} alt={item.media.alt_text || product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {product.shapes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-h3 text-neutral-900">Shapes &amp; Sizes</h2>
            <div className="mt-3 flex flex-col gap-2">
              {product.shapes.map((shape) => (
                <Card key={shape.id}>
                  <p className="font-medium text-neutral-900">{shape.name}</p>
                  <p className="mt-1 whitespace-pre-line text-small text-neutral-600">{shape.sizes}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {product.specifications.length > 0 && (
          <div className="mt-8">
            <h2 className="text-h3 text-neutral-900">Specifications</h2>
            <div className="mt-3 overflow-hidden rounded-field border border-neutral-200">
              {product.specifications.map((spec) => (
                <div key={spec.id} className="flex justify-between border-b border-neutral-100 px-4 py-2 last:border-0">
                  <span className="text-small text-neutral-500">{spec.spec_key}</span>
                  <span className="text-small font-medium text-neutral-900">{spec.spec_value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(product.packaging.length > 0 || product.applications.length > 0) && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {product.packaging.length > 0 && (
              <div>
                <h2 className="text-h3 text-neutral-900">Packaging</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {product.packaging.map((item) => (
                    <Card key={item.id}>
                      <p className="font-medium text-neutral-900">{item.title}</p>
                      <p className="mt-1 text-small text-neutral-600">{item.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {product.applications.length > 0 && (
              <div>
                <h2 className="text-h3 text-neutral-900">Applications</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {product.applications.map((item) => (
                    <Card key={item.id}>
                      <p className="font-medium text-neutral-900">{item.title}</p>
                      <p className="mt-1 text-small text-neutral-600">{item.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}

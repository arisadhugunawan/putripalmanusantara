"use client";

import { Card } from "@ppn/ui-components";
import type { ProductDetail } from "@ppn/shared-types";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";

export function FeaturedProductsEditor() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);

  async function load() {
    const data = await adminApi.get<ProductDetail[]>("/admin/products");
    setProducts(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function toggleFeatured(id: string, current: boolean) {
    await adminApi.put(`/admin/products/${id}/featured`, { is_featured: !current });
    await load();
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Produk Unggulan</h2>
      <div className="mt-4 flex flex-col gap-2">
        {products?.map((product) => (
          <label key={product.id} className="flex items-center gap-3 text-body">
            <input
              type="checkbox"
              checked={product.is_featured}
              onChange={() => void toggleFeatured(product.id, product.is_featured)}
              className="h-5 w-5"
            />
            {product.name}
          </label>
        ))}
      </div>
    </Card>
  );
}

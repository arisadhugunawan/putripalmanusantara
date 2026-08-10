"use client";

import { Badge, Button } from "@ppn/ui-components";
import type { ProductDetail } from "@ppn/shared-types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";

// FR-CMS-03 — daftar produk (termasuk draft).
export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDetail[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  async function load() {
    const data = await adminApi.get<ProductDetail[]>("/admin/products");
    setProducts(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await adminApi.delete(`/admin/products/${id}`);
      await load();
      showToast("Produk berhasil dihapus.");
      setDeleteTarget(null);
    } catch {
      showToast("Gagal menghapus produk. Silakan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Produk</h1>
        <Link href="/admin/produk/baru">
          <Button>Tambah Produk</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-card bg-white shadow-card">
        <table className="w-full text-body">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-small text-neutral-600">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Unggulan</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium text-neutral-900">{product.name}</td>
                <td className="px-4 py-3 text-neutral-600">{product.category}</td>
                <td className="px-4 py-3">
                  <Badge variant={product.status === "published" ? "primary" : "neutral"}>
                    {product.status === "published" ? "Diterbitkan" : "Draf"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600">{product.is_featured ? "Ya" : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/produk/${product.id}`}
                      className="text-body text-primary-700 underline underline-offset-4"
                    >
                      Ubah
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                      className="text-body text-red-600 underline underline-offset-4"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products?.length === 0 && (
          <p className="p-6 text-body text-neutral-600">Belum ada produk.</p>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Hapus produk "${deleteTarget.name}"?`}
          message="Tindakan ini tidak dapat dibatalkan."
          confirmLabel={deleting ? "Menghapus..." : "Hapus"}
          onConfirm={() => {
            if (!deleting) void handleDelete(deleteTarget.id);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

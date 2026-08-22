"use client";

import type { AboutCompanySocialLink } from "@ppn/shared-types";
import { Badge, Button, Card, cn, Input, Label } from "@ppn/ui-components";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SkeletonListRows } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";
import { SOCIAL_PLATFORM_OPTIONS } from "@/components/about/company-profile/SocialIcons";

/**
 * "Connect With PPN" social row CRUD, shown directly under the Introduction video. An icon
 * only ever appears once the Admin has entered a real URL for it — nothing here is pre-seeded
 * or invented, matching the same "no fabricated data" rule used across About Company.
 */
export function SocialLinksEditor() {
  const fetchLinks = useCallback(
    () => adminApi.get<AboutCompanySocialLink[]>("/admin/about-company/social-links"),
    [],
  );
  const { data: links, status, reload, retry } = useAdminResource(fetchLinks);

  const [newPlatform, setNewPlatform] = useState<string>(SOCIAL_PLATFORM_OPTIONS[0].value);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!newDisplayName.trim() || !newUrl.trim()) {
      setError("Display Name dan URL wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/social-links", {
        platform: newPlatform,
        display_name: newDisplayName,
        url: newUrl,
        order: links?.length ?? 0,
        active: true,
        open_in_new_tab: true,
      });
      setNewDisplayName("");
      setNewUrl("");
      setNewPlatform(SOCIAL_PLATFORM_OPTIONS[0].value);
      await reload();
      showToast("Social link ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah social link.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/about-company/social-links/${id}`, patch);
      await reload();
    } catch {
      showToast("Changes could not be saved. Please try again.", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/about-company/social-links/${id}`);
      await reload();
      showToast("Social link dihapus.");
    } catch {
      showToast("Gagal menghapus social link. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!links) return;
    if (to < 0 || to >= links.length) return;
    const next = arrayMove(links, from, to);
    try {
      await Promise.all(
        next
          .map((link, index) =>
            link.order === index
              ? null
              : adminApi.put(`/admin/about-company/social-links/${link.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan social link.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Connect With PPN — Social Links</h2>
      <p className="mt-1 text-small text-neutral-600">
        Ikon hanya tampil di halaman publik jika URL diisi dan status Aktif. Seret kartu untuk mengubah urutan, atau
        gunakan Naik/Turun.
      </p>

      {status === "error" && (
        <AdminLoadError message="Failed to load social links." onRetry={() => void retry()} />
      )}

      {status === "loading" && (
        <div className="mt-4">
          <SkeletonListRows rows={2} />
        </div>
      )}

      {status === "ready" && links && (
        <div className="mt-5 flex flex-col gap-3">
          {links.length === 0 && (
            <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
              <p className="text-body text-neutral-600">Belum ada social link.</p>
              <p className="mt-1 text-small text-neutral-500">Gunakan formulir “+ Add Social Link” di bawah.</p>
            </div>
          )}
          {links.map((link, index) => {
            const rowProps = getRowProps(index);
            return (
              <div
                key={link.id}
                {...rowProps}
                className={cn(
                  "rounded-field border border-neutral-200 p-3 transition-opacity",
                  rowProps.className,
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span {...getHandleProps(index)}>
                    <DragHandle />
                  </span>
                  <Badge variant={link.active ? "primary" : "neutral"}>
                    {link.active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-small text-neutral-500">
                    Order {String(index + 1).padStart(2, "0")}
                  </span>
                  <label className="flex items-center gap-2 text-small text-neutral-600">
                    <input
                      type="checkbox"
                      checked={link.active}
                      onChange={(e) => void handleUpdate(link.id, { active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Aktif
                  </label>
                  <label className="flex items-center gap-2 text-small text-neutral-600">
                    <input
                      type="checkbox"
                      checked={link.open_in_new_tab}
                      onChange={(e) => void handleUpdate(link.id, { open_in_new_tab: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Buka di tab baru
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index - 1)}
                    disabled={index === 0}
                    className="text-small text-neutral-600 underline disabled:opacity-30"
                  >
                    Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReorder(index, index + 1)}
                    disabled={index === links.length - 1}
                    className="text-small text-neutral-600 underline disabled:opacity-30"
                  >
                    Turun
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(link.id)}
                    className="ml-auto text-small text-red-600 underline"
                  >
                    Hapus
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_1.4fr]">
                  <div>
                    <Label className="text-small">Platform</Label>
                    <select
                      defaultValue={link.platform}
                      onChange={(e) => void handleUpdate(link.id, { platform: e.target.value })}
                      className="w-full rounded-field border border-neutral-300 px-3 py-2.5 text-body"
                    >
                      {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-small">Display Name</Label>
                    <Input
                      defaultValue={link.display_name}
                      onBlur={(e) => void handleUpdate(link.id, { display_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-small">URL</Label>
                    <Input
                      defaultValue={link.url}
                      onBlur={(e) => void handleUpdate(link.id, { url: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Social Link</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_1.4fr]">
          <div>
            <Label htmlFor="new-social-platform">Platform</Label>
            <select
              id="new-social-platform"
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="w-full rounded-field border border-neutral-300 px-3 py-2.5 text-body"
            >
              {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="new-social-name">Display Name</Label>
            <Input
              id="new-social-name"
              value={newDisplayName}
              placeholder="mis. @ppncoconut"
              onChange={(e) => setNewDisplayName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new-social-url">URL</Label>
            <Input
              id="new-social-url"
              value={newUrl}
              placeholder="mis. https://instagram.com/ppncoconut"
              onChange={(e) => setNewUrl(e.target.value)}
              required
            />
          </div>
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Social Link
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Delete this item?"
          message="This action cannot be undone."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}

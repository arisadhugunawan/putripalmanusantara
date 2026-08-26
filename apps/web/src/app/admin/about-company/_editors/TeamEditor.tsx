"use client";

import { Badge, Button, Card, cn, FormField, Input, Label, Textarea } from "@ppn/ui-components";
import { getMediaPolicy } from "@ppn/shared-types";
import type { Locale, TeamMember } from "@ppn/shared-types";
import Image from "next/image";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ListToolbar, type ActiveFilter, type SortKey } from "@/components/admin/ListToolbar";
import { GenerateTranslationsPanel } from "@/components/admin/GenerateTranslationsPanel";
import { LocaleTabs } from "@/components/admin/LocaleTabs";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { SkeletonCard, SkeletonListRows } from "@/components/admin/Skeleton";
import { TranslationStatusBadges } from "@/components/admin/TranslationStatusBadges";
import { useToast } from "@/components/admin/Toast";

function teamMemberTranslationBase(member: TeamMember) {
  return {
    name: member.name,
    position: member.position,
    biography: member.biography,
    responsibilities: member.responsibilities,
    department: member.department,
  };
}

/** `FieldGroup` title showing "6 · Translations" plus the shared per-locale completeness
 * badges — used instead of a bare heading so a row's translation gaps are visible without
 * expanding the group. */
function TranslationsGroupTitle({ member }: { member: TeamMember }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      6 · Translations
      <TranslationStatusBadges
        translations={member.translations}
        base={teamMemberTranslationBase(member)}
      />
    </span>
  );
}

// Centralized in @ppn/shared-types' MEDIA_POLICY (Post-Launch Phase 3).
const MAX_PHOTO_BYTES = getMediaPolicy("team").maxBytes;

/** One labelled group inside a member's form — keeps a member card from becoming a single
 * undifferentiated wall of inputs (brief item 79). */
function FieldGroup({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <fieldset className="mt-4 border-t border-neutral-100 pt-3">
      <legend className="sr-only">{title}</legend>
      <p className="mb-2 text-small font-medium uppercase tracking-wide text-neutral-500">{title}</p>
      {children}
    </fieldset>
  );
}

export function TeamEditor() {
  const fetchMembers = useCallback(
    () => adminApi.get<TeamMember[]>("/admin/about-company/team-members"),
    [],
  );
  const { data: members, status, reload, retry } = useAdminResource(fetchMembers);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("order");
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newPhotoId, setNewPhotoId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    if (!newName.trim() || !newPosition.trim()) {
      setError("Nama dan Posisi wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/about-company/team-members", {
        name: newName,
        position: newPosition,
        photo_id: newPhotoId ?? undefined,
        order: members?.length ?? 0,
        active: true,
      });
      form.reset();
      setNewName("");
      setNewPosition("");
      setNewPhotoId(null);
      await reload();
      showToast("Team member added.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah anggota tim.");
    }
  }

  /**
   * `requiredLabel` marks a field the server refuses to blank (name/position). Caught here
   * first so the Admin gets a specific message instead of a generic failure — and the input is
   * reverted, because leaving the emptied value on screen would imply it had been saved.
   */
  async function handleUpdate(
    id: string,
    patch: Record<string, unknown>,
    requiredLabel?: string,
  ) {
    if (requiredLabel) {
      const value = Object.values(patch)[0];
      if (typeof value === "string" && !value.trim()) {
        showToast(`${requiredLabel} wajib diisi.`, "error");
        await reload();
        return;
      }
    }
    try {
      await adminApi.put(`/admin/about-company/team-members/${id}`, patch);
      await reload();
    } catch (err) {
      // Surface the server's own validation message (invalid email/URL/phone) rather than a
      // generic one, so the Admin knows which value to correct.
      showToast(
        err instanceof ApiRequestError ? err.message : "Changes could not be saved.",
        "error",
      );
      await reload();
    }
  }

  async function handleUpdateTranslation(
    member: TeamMember,
    locale: Exclude<Locale, "en">,
    field: "name" | "position" | "biography" | "responsibilities" | "department",
    value: string,
  ) {
    const current = member.translations ?? {};
    await handleUpdate(member.id, {
      translations: { ...current, [locale]: { ...current[locale], [field]: value } },
    });
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/about-company/team-members/${id}`);
      await reload();
      showToast("Anggota tim berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus anggota tim. Silakan coba lagi.", "error");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await adminApi.post(`/admin/about-company/team-members/${id}/duplicate`);
      await reload();
      showToast("Anggota tim diduplikasi sebagai draf nonaktif.");
    } catch {
      showToast("Gagal menduplikasi anggota tim. Silakan coba lagi.", "error");
    }
  }

  /** Rewrites the whole sequence so drag-and-drop and Naik/Turun always agree. */
  async function handleReorder(from: number, to: number) {
    if (!members) return;
    if (to < 0 || to >= members.length) return;
    const next = arrayMove(members, from, to);
    try {
      await Promise.all(
        next
          .map((member, index) =>
            member.order === index
              ? null
              : adminApi.put(`/admin/about-company/team-members/${member.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan tim.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (status === "error") return <AdminLoadError message="Failed to load team members." onRetry={() => void retry()} />;

  if (status === "loading" || !members) {
    return (
      <div className="mt-6">
        <SkeletonCard rows={0} />
        <div className="mt-4">
          <SkeletonListRows rows={3} />
        </div>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const visible = members
    .map((member, index) => ({ member, index }))
    .filter(({ member }) => {
      if (activeFilter === "active" && !member.active) return false;
      if (activeFilter === "inactive" && member.active) return false;
      if (featuredOnly && !member.featured) return false;
      if (!query) return true;
      return (
        member.name.toLowerCase().includes(query) ||
        member.position.toLowerCase().includes(query) ||
        member.biography.toLowerCase().includes(query) ||
        (member.department ?? "").toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sort === "name") return a.member.name.localeCompare(b.member.name);
      return a.member.order - b.member.order;
    });

  // Drag-and-drop moves rows by their real position in `members`; a filtered or name-sorted
  // list would make a drop ambiguous, so the handles only appear on the untouched list.
  const reorderable = !query && activeFilter === "all" && !featuredOnly && sort === "order";

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Team Members</h2>
      <p className="mt-1 text-small text-neutral-600">
        Anggota tim yang tampil di section PPN Team.{" "}
        {reorderable
          ? "Seret kartu untuk mengubah urutan, atau gunakan Naik/Turun."
          : "Hapus filter/pencarian untuk mengubah urutan."}
      </p>

      {members.length > 0 && (
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama, posisi, departemen, atau biografi..."
          activeFilter={activeFilter}
          onActiveFilterChange={setActiveFilter}
          sort={sort}
          onSortChange={setSort}
          resultCount={visible.length}
          totalCount={members.length}
        >
          <button
            type="button"
            aria-pressed={featuredOnly}
            onClick={() => setFeaturedOnly((current) => !current)}
            className={cn(
              "rounded-button border px-3 py-1 text-small transition-colors",
              featuredOnly
                ? "border-primary-600 bg-primary-100 text-primary-700"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400",
            )}
          >
            ★ Featured
          </button>
        </ListToolbar>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {members.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-8 text-center">
            <p className="text-body text-neutral-600">No team members have been added yet.</p>
            <p className="mt-1 text-small text-neutral-500">Gunakan formulir “+ Add Team Member” di bawah.</p>
          </div>
        )}
        {members.length > 0 && visible.length === 0 && (
          <p className="text-small text-neutral-500">Tidak ada anggota tim yang cocok dengan pencarian/filter.</p>
        )}
        {visible.map(({ member, index }) => {
          const rowProps = reorderable ? getRowProps(index) : { draggable: false, className: "" };
          return (
            <div
              key={member.id}
              {...rowProps}
              className={cn("rounded-field border border-neutral-200 p-4 transition-opacity", rowProps.className)}
            >
              <div className="flex flex-wrap items-start gap-3">
                {reorderable && (
                  <span {...getHandleProps(index)} className={cn("mt-7", getHandleProps(index).className)}>
                    <DragHandle />
                  </span>
                )}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50">
                  {member.photo ? (
                    <Image src={member.photo.file_url} alt={member.photo.alt_text} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-small text-neutral-400">No Photo</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-neutral-900">{member.name}</p>
                  <p className="text-small text-neutral-500">{member.position}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={member.active ? "primary" : "neutral"}>{member.active ? "Active" : "Inactive"}</Badge>
                    {member.featured && <Badge variant="primary">★ Featured</Badge>}
                    <span className="text-small text-neutral-500">Order {String(index + 1).padStart(2, "0")}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-neutral-100 pb-3">
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={member.active} onChange={(e) => void handleUpdate(member.id, { active: e.target.checked })} className="h-4 w-4" />
                  Aktif
                </label>
                <label className="flex items-center gap-2 text-small text-neutral-600">
                  <input type="checkbox" checked={member.featured} onChange={(e) => void handleUpdate(member.id, { featured: e.target.checked })} className="h-4 w-4" />
                  Featured
                </label>
                <button type="button" onClick={() => void handleDuplicate(member.id)} className="text-small text-neutral-600 underline">
                  Duplicate
                </button>
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
                  disabled={index === members.length - 1}
                  className="text-small text-neutral-600 underline disabled:opacity-30"
                >
                  Turun
                </button>
                <button type="button" onClick={() => setDeleteTargetId(member.id)} className="ml-auto text-small text-red-600 underline">
                  Hapus
                </button>
              </div>

              {/* Grouped rather than one long form (item 79). */}
              <FieldGroup title="1 · Informasi Dasar">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-small">Nama *</Label>
                    <Input
                      defaultValue={member.name}
                      maxLength={100}
                      onBlur={(e) => void handleUpdate(member.id, { name: e.target.value }, "Nama")}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Posisi *</Label>
                    <Input
                      defaultValue={member.position}
                      maxLength={100}
                      onBlur={(e) => void handleUpdate(member.id, { position: e.target.value }, "Posisi")}
                    />
                  </div>
                  <div>
                    <Label className="text-small">Departemen / Grup Tim (opsional)</Label>
                    <Input
                      defaultValue={member.department ?? ""}
                      maxLength={60}
                      placeholder="mis. Operations"
                      onBlur={(e) => void handleUpdate(member.id, { department: e.target.value })}
                    />
                  </div>
                </div>
              </FieldGroup>

              <FieldGroup title="2 · Foto Profil">
                <MediaUploadField
                  label="Foto Profil"
                  media={member.photo}
                  onChange={(media) => void handleUpdate(member.id, { photo_id: media.id })}
                  onRemove={() => void handleUpdate(member.id, { photo_id: null })}
                  maxSizeBytes={MAX_PHOTO_BYTES}
                  hint="Rekomendasi: potret 4:5 — 800×1000px atau 1200×1500px. Maksimum 5MB. Wajah sebaiknya di bagian atas frame; kartu publik memakai object-position atas agar wajah tidak terpotong."
                  previewFit="cover"
                />
              </FieldGroup>

              <FieldGroup title="3 · Biografi">
                <Label className="text-small">Biografi Singkat (opsional)</Label>
                <Textarea
                  rows={3}
                  defaultValue={member.biography}
                  placeholder="Disarankan 100–180 karakter."
                  onBlur={(e) => void handleUpdate(member.id, { biography: e.target.value })}
                />
              </FieldGroup>

              <FieldGroup title="4 · Tanggung Jawab">
                <Label className="text-small">Responsibilities (opsional)</Label>
                <Textarea
                  rows={3}
                  defaultValue={member.responsibilities}
                  placeholder={"Satu baris per poin, mis.\nExport coordination\nSupplier communication"}
                  onBlur={(e) => void handleUpdate(member.id, { responsibilities: e.target.value })}
                />
                <p className="mt-1 text-small text-neutral-500">
                  Satu baris menjadi satu poin di modal profil publik. Kosongkan jika belum ada.
                </p>
              </FieldGroup>

              <FieldGroup title="5 · Kontak & Sosial">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FormField label="Email (opsional)" htmlFor={`team-${member.id}-email`}>
                    <Input
                      id={`team-${member.id}-email`}
                      type="email"
                      defaultValue={member.email ?? ""}
                      onBlur={(e) => void handleUpdate(member.id, { email: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Telepon (opsional)" htmlFor={`team-${member.id}-phone`}>
                    <Input
                      id={`team-${member.id}-phone`}
                      defaultValue={member.phone ?? ""}
                      placeholder="+62..."
                      onBlur={(e) => void handleUpdate(member.id, { phone: e.target.value })}
                    />
                  </FormField>
                  <FormField label="LinkedIn URL (opsional)" htmlFor={`team-${member.id}-linkedin`}>
                    <Input
                      id={`team-${member.id}-linkedin`}
                      placeholder="https://linkedin.com/in/..."
                      defaultValue={member.linkedin_url ?? ""}
                      onBlur={(e) => void handleUpdate(member.id, { linkedin_url: e.target.value })}
                    />
                  </FormField>
                </div>
                <p className="mt-1 text-small text-neutral-500">
                  Hanya field yang diisi yang tampil di halaman publik — tidak akan ada ikon kosong.
                </p>
              </FieldGroup>

              <FieldGroup title={<TranslationsGroupTitle member={member} />}>
                <GenerateTranslationsPanel
                  statusUrl={`/admin/about-company/team-members/${member.id}/translation-status`}
                  generateUrl={`/admin/about-company/team-members/${member.id}/translations/generate`}
                  onGenerated={() => void reload()}
                />
                <LocaleTabs>
                  {(locale) =>
                    locale === "en" ? (
                      <p className="text-small text-neutral-500">
                        Bahasa Inggris diedit langsung pada field di atas (1–4).
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div>
                          <Label className="text-small">Nama</Label>
                          <Input
                            defaultValue={member.translations?.[locale]?.name ?? ""}
                            placeholder={member.name}
                            onBlur={(e) =>
                              void handleUpdateTranslation(member, locale, "name", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-small">Posisi</Label>
                          <Input
                            defaultValue={member.translations?.[locale]?.position ?? ""}
                            placeholder={member.position}
                            onBlur={(e) =>
                              void handleUpdateTranslation(member, locale, "position", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-small">Departemen</Label>
                          <Input
                            defaultValue={member.translations?.[locale]?.department ?? ""}
                            placeholder={member.department ?? ""}
                            onBlur={(e) =>
                              void handleUpdateTranslation(member, locale, "department", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-small">Biografi Singkat</Label>
                          <Textarea
                            rows={3}
                            defaultValue={member.translations?.[locale]?.biography ?? ""}
                            placeholder={member.biography}
                            onBlur={(e) =>
                              void handleUpdateTranslation(member, locale, "biography", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-small">Responsibilities</Label>
                          <Textarea
                            rows={3}
                            defaultValue={member.translations?.[locale]?.responsibilities ?? ""}
                            placeholder={member.responsibilities}
                            onBlur={(e) =>
                              void handleUpdateTranslation(member, locale, "responsibilities", e.target.value)
                            }
                          />
                        </div>
                        <p className="text-small text-neutral-500">
                          Kosongkan untuk memakai teks Inggris sebagai fallback.
                        </p>
                      </div>
                    )
                  }
                </LocaleTabs>
              </FieldGroup>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <p className="text-small font-medium text-neutral-900">+ Add Team Member</p>
        <MediaUploadField
          label="Foto Profil (opsional)"
          media={null}
          onChange={(media) => setNewPhotoId(media.id)}
          maxSizeBytes={MAX_PHOTO_BYTES}
          hint="Rekomendasi: foto persegi 800×800px. Maksimum 5MB."
          previewFit="cover"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-member-name">Nama</Label>
            <Input id="new-member-name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="new-member-position">Posisi</Label>
            <Input id="new-member-position" value={newPosition} onChange={(e) => setNewPosition(e.target.value)} required />
          </div>
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Add Team Member
        </Button>
      </form>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus anggota tim ini?"
          message="Anggota tim akan dihapus dan tidak akan tampil di halaman About Company. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}

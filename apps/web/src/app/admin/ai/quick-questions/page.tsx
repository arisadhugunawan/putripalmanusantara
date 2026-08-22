"use client";

import { LOCALE_LABELS, SUPPORTED_LOCALES, type AiQuickQuestion } from "@ppn/shared-types";
import { Badge, Button, Card, cn, Input, Label } from "@ppn/ui-components";
import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { useAdminResource } from "@/hooks/useAdminResource";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SkeletonCard } from "@/components/admin/Skeleton";
import { useToast } from "@/components/admin/Toast";

const selectClassName = "rounded-field border border-neutral-300 px-3 py-2 text-small";

/** Shortcut prompts shown in the chat window's welcome screen (brief §M/§U) — clicking one just
 * submits `question` as a normal chat message through the same retrieval pipeline as free-typed
 * questions. Not a Q&A knowledge database. */
export default function AiQuickQuestionsPage() {
  const fetchQuestions = useCallback(() => adminApi.get<AiQuickQuestion[]>("/admin/ai/quick-questions"), []);
  const { data: questions, status, reload, retry } = useAdminResource(fetchQuestions);
  const [language, setLanguage] = useState<string>("en");
  const [newLabel, setNewLabel] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = (questions ?? []).filter((q) => q.language === language);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!newLabel.trim() || !newQuestion.trim()) {
      setError("Label dan pertanyaan wajib diisi.");
      return;
    }
    try {
      await adminApi.post("/admin/ai/quick-questions", { label: newLabel, question: newQuestion, language });
      setNewLabel("");
      setNewQuestion("");
      await reload();
      showToast("Quick question ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah quick question.");
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      await adminApi.put(`/admin/ai/quick-questions/${id}`, patch);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiRequestError ? err.message : "Perubahan gagal disimpan.", "error");
      await reload();
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/ai/quick-questions/${id}`);
      await reload();
      showToast("Quick question dihapus.");
    } catch {
      showToast("Gagal menghapus quick question.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (to < 0 || to >= filtered.length) return;
    const next = arrayMove(filtered, from, to);
    try {
      await adminApi.put("/admin/ai/quick-questions/reorder", { ordered_ids: next.map((q) => q.id) });
      await reload();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-neutral-900">Quick Questions</h1>
        <Link href="/admin/ai" className="text-body text-primary-700 underline">
          ← Kembali ke AI Assistant
        </Link>
      </div>
      <p className="mt-2 text-body text-neutral-600">
        Shortcut pertanyaan yang tampil saat chat pertama kali dibuka. Klik hanya mengirim
        pertanyaan itu ke AI — bukan jawaban tersimpan.
      </p>

      <div className="mt-4 flex gap-2">
        {SUPPORTED_LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setLanguage(loc)}
            className={cn(
              "rounded-button px-3 py-1.5 text-small font-medium transition-colors",
              language === loc ? "bg-primary-500 text-neutral-900" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
            )}
          >
            {LOCALE_LABELS[loc].flag} {LOCALE_LABELS[loc].name}
          </button>
        ))}
      </div>

      <Card className="mt-4">
        {status === "error" && <AdminLoadError message="Gagal memuat quick questions." onRetry={() => void retry()} />}
        {status === "loading" && (
          <div className="mt-4">
            <SkeletonCard rows={3} />
          </div>
        )}

        {status === "ready" && (
          <div className="flex flex-col gap-2">
            {filtered.length === 0 && (
              <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
                <p className="text-body text-neutral-600">Belum ada quick question untuk bahasa ini.</p>
              </div>
            )}
            {filtered.map((q, index) => {
              const rowProps = getRowProps(index);
              return (
                <div
                  key={q.id}
                  {...rowProps}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-field border border-neutral-200 p-3 transition-opacity",
                    rowProps.className,
                  )}
                >
                  <span {...getHandleProps(index)}>
                    <DragHandle />
                  </span>
                  <div className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
                    <Input
                      className="max-w-xs"
                      defaultValue={q.label}
                      placeholder="Label (tombol)"
                      onBlur={(e) => void handleUpdate(q.id, { label: e.target.value })}
                    />
                    <Input
                      defaultValue={q.question}
                      placeholder="Pertanyaan yang dikirim ke AI"
                      onBlur={(e) => void handleUpdate(q.id, { question: e.target.value })}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-small text-neutral-600">
                    <input
                      type="checkbox"
                      checked={q.active}
                      onChange={(e) => void handleUpdate(q.id, { active: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Aktif
                  </label>
                  <Badge variant={q.active ? "primary" : "neutral"}>{q.active ? "Published" : "Draft"}</Badge>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(q.id)}
                    className="ml-auto text-small text-red-600 underline"
                  >
                    Hapus
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
          <div className="min-w-[12rem] flex-1">
            <Label htmlFor="new-label">Label</Label>
            <Input id="new-label" value={newLabel} placeholder="mis. Our Products" onChange={(e) => setNewLabel(e.target.value)} />
          </div>
          <div className="min-w-[16rem] flex-[2]">
            <Label htmlFor="new-question">Pertanyaan</Label>
            <Input
              id="new-question"
              value={newQuestion}
              placeholder="mis. What products does PPN supply?"
              onChange={(e) => setNewQuestion(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-lang">Bahasa</Label>
            <select id="new-lang" value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClassName}>
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCALE_LABELS[loc].flag} {LOCALE_LABELS[loc].name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Tambah</Button>
          {error && <p className="w-full text-small text-red-600">{error}</p>}
        </form>
      </Card>

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus quick question ini?"
          message="Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}

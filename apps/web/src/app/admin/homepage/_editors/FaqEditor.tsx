"use client";

import { Badge, Button, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type { Faq } from "@ppn/shared-types";
import { FormEvent, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";

export function FaqEditor() {
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await adminApi.get<Faq[]>("/admin/faqs");
    setFaqs(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Captured before the `await` below — React nulls `event.currentTarget` once the
    // synchronous event-dispatch task finishes, so reading it after an `await` throws even
    // though the request already succeeded.
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    try {
      await adminApi.post("/admin/faqs", {
        question: formData.get("question"),
        answer: formData.get("answer"),
        status: "published",
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah FAQ.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus FAQ ini?")) return;
    await adminApi.delete(`/admin/faqs/${id}`);
    await load();
  }

  async function toggleStatus(faq: Faq) {
    await adminApi.put(`/admin/faqs/${faq.id}`, {
      status: faq.status === "published" ? "draft" : "published",
    });
    await load();
  }

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">FAQ</h2>
      <div className="mt-4 flex flex-col gap-3">
        {faqs?.map((faq) => (
          <div key={faq.id} className="rounded-field border border-neutral-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-neutral-900">{faq.question}</p>
                <p className="mt-1 text-small text-neutral-600">{faq.answer}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge variant={faq.status === "published" ? "primary" : "neutral"}>
                  {faq.status === "published" ? "Tampil" : "Draf"}
                </Badge>
                <button type="button" onClick={() => void toggleStatus(faq)} className="text-small text-primary-700 underline">
                  {faq.status === "published" ? "Sembunyikan" : "Tampilkan"}
                </button>
                <button type="button" onClick={() => void handleDelete(faq.id)} className="text-small text-red-600 underline">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <div>
          <Label htmlFor="faq-question">Pertanyaan Baru</Label>
          <Input id="faq-question" name="question" required />
        </div>
        <div>
          <Label htmlFor="faq-answer">Jawaban</Label>
          <Textarea id="faq-answer" name="answer" rows={2} required />
        </div>
        {error && <p className="text-small text-red-600">{error}</p>}
        <Button type="submit" className="w-fit">
          Tambah FAQ
        </Button>
      </form>
    </Card>
  );
}

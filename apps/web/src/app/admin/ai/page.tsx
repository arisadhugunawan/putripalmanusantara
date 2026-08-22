"use client";

import { Badge, Card, Input, Label, Textarea } from "@ppn/ui-components";
import type {
  AiKnowledgeSourceSummary,
  AiSettings,
  AiSyncLog,
  AiSyncStatus,
  AiTestQueryResult,
} from "@ppn/shared-types";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/client";
import { AdminLoadError } from "@/components/admin/AdminLoadError";
import { useToast } from "@/components/admin/Toast";
import { useSaveState } from "@/hooks/useSaveState";

const SOURCE_TOGGLE_KEYS = [
  ["include_home", "home"],
  ["include_about_company", "about_company"],
  ["include_products", "products"],
  ["include_facilities", "facilities"],
  ["include_moq_payment_terms", "moq_payment_terms"],
  ["include_shipment_terms", "shipment_terms"],
  ["include_faq", "faq"],
  ["include_gallery", "gallery"],
  ["include_news", "news"],
  ["include_contact", "contact"],
  ["include_legal_certificates", "legal_certificates"],
] as const;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default function AiAssistantPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [status, setStatus] = useState<AiSyncStatus | null>(null);
  const [sources, setSources] = useState<AiKnowledgeSourceSummary[]>([]);
  const [logs, setLogs] = useState<AiSyncLog[]>([]);
  const [pageStatus, setPageStatus] = useState<"loading" | "ready" | "error">("loading");
  const [syncing, setSyncing] = useState(false);
  const [testQuestion, setTestQuestion] = useState("");
  const [testResult, setTestResult] = useState<AiTestQueryResult | null>(null);
  const [testing, setTesting] = useState(false);
  const saveState = useSaveState();
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setPageStatus("loading");
    try {
      const [settingsData, statusData, sourcesData, logsData] = await Promise.all([
        adminApi.get<AiSettings>("/admin/ai/settings"),
        adminApi.get<AiSyncStatus>("/admin/ai/sync-status"),
        adminApi.get<AiKnowledgeSourceSummary[]>("/admin/ai/sources"),
        adminApi.get<AiSyncLog[]>("/admin/ai/sync-logs"),
      ]);
      setSettings(settingsData);
      setStatus(statusData);
      setSources(sourcesData);
      setLogs(logsData);
      setPageStatus("ready");
    } catch {
      setPageStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  if (pageStatus === "error") {
    return <AdminLoadError message="Gagal memuat AI Assistant." onRetry={() => void load()} />;
  }
  if (pageStatus === "loading" || !settings || !status) {
    return <p className="text-body text-neutral-600">Memuat...</p>;
  }

  function patch(update: Partial<AiSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...update } : prev));
  }

  async function handleSave() {
    if (!settings) return;
    const result = await saveState.run(() =>
      adminApi.put<AiSettings>("/admin/ai/settings", {
        enabled: settings.enabled,
        assistant_name: settings.assistant_name,
        subtitle: settings.subtitle,
        desktop_enabled: settings.desktop_enabled,
        mobile_enabled: settings.mobile_enabled,
        business_instructions: settings.business_instructions,
        include_home: settings.include_home,
        include_about_company: settings.include_about_company,
        include_products: settings.include_products,
        include_facilities: settings.include_facilities,
        include_moq_payment_terms: settings.include_moq_payment_terms,
        include_shipment_terms: settings.include_shipment_terms,
        include_faq: settings.include_faq,
        include_gallery: settings.include_gallery,
        include_news: settings.include_news,
        include_contact: settings.include_contact,
        include_legal_certificates: settings.include_legal_certificates,
        whatsapp_enabled: settings.whatsapp_enabled,
        whatsapp_number: settings.whatsapp_number,
        whatsapp_display_name: settings.whatsapp_display_name,
        whatsapp_general_message: settings.whatsapp_general_message,
        whatsapp_product_message: settings.whatsapp_product_message,
      }),
    );
    if (result.success) {
      setSettings(result.value);
      showToast("Perubahan tersimpan.");
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const result = await adminApi.post<{ success: boolean; chunksCreated: number; error?: string }>(
        "/admin/ai/sync",
        {},
      );
      if (result.success) {
        showToast(`Sync berhasil — ${result.chunksCreated} chunk ter-index.`);
      } else {
        showToast(result.error ?? "Sync gagal.", "error");
      }
      await load();
    } catch {
      showToast("Sync gagal.", "error");
    } finally {
      setSyncing(false);
    }
  }

  async function handleTest() {
    if (!testQuestion.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await adminApi.post<AiTestQueryResult>("/admin/ai/test", { question: testQuestion, language: "en" });
      setTestResult(result);
    } catch {
      showToast("Test gagal.", "error");
    } finally {
      setTesting(false);
    }
  }

  const pendingSourceChanges = sources.filter((s) => s.chunk_count === 0 && s.enabled).length;

  return (
    <div className="max-w-3xl pb-16">
      <h1 className="text-h2 text-neutral-900">AI Assistant</h1>
      <p className="mt-2 text-body text-neutral-600">
        PPN Assistant menjawab pertanyaan visitor menggunakan konten website yang sudah published —
        bukan database FAQ terpisah. Ubah konten di modul CMS masing-masing (Products, Facilities,
        dst.), lalu AI otomatis memakai versi terbaru setelah sinkronisasi berikutnya.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">General</p>
          <div className="mt-3 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                [
                  ["enabled", "AI Assistant Active"],
                  ["desktop_enabled", "Desktop"],
                  ["mobile_enabled", "Mobile"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-small text-neutral-700">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => patch({ [key]: e.target.checked })}
                    className="h-4 w-4"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="assistant-name">Assistant Name</Label>
                <Input
                  id="assistant-name"
                  value={settings.assistant_name}
                  onChange={(e) => patch({ assistant_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input id="subtitle" value={settings.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="business-instructions">Business Instructions (optional)</Label>
              <Textarea
                id="business-instructions"
                rows={3}
                value={settings.business_instructions}
                onChange={(e) => patch({ business_instructions: e.target.value })}
                placeholder='Contoh: "Always present PPN as a professional Indonesian coconut supplier."'
              />
              <p className="mt-1 text-small text-neutral-500">
                Ini hanya menambah konteks bisnis — aturan keamanan inti (anti-halusinasi) tidak
                bisa diubah dari sini.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Knowledge Status</p>
            <span className="flex items-center gap-1.5 text-small font-medium">
              <span
                className={`h-2 w-2 rounded-full ${status.last_status === "success" ? "bg-primary-500" : "bg-red-500"}`}
              />
              {status.last_status === "success" ? "Synced" : "Sync Failed"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-h3 font-heading text-neutral-900">{status.total_sources}</p>
              <p className="text-small text-neutral-500">Total Sources</p>
            </div>
            <div>
              <p className="text-h3 font-heading text-neutral-900">{status.indexed_count}</p>
              <p className="text-small text-neutral-500">Indexed</p>
            </div>
            <div>
              <p className="text-h3 font-heading text-neutral-900">{pendingSourceChanges}</p>
              <p className="text-small text-neutral-500">Empty (enabled)</p>
            </div>
            <div>
              <p className="text-h3 font-heading text-neutral-900">{status.failed_count}</p>
              <p className="text-small text-neutral-500">Failed</p>
            </div>
          </div>
          <p className="mt-3 text-small text-neutral-500">Last Sync: {formatDate(status.last_synced_at)}</p>
          {status.last_error && <p className="mt-1 text-small text-red-600">{status.last_error}</p>}
          {status.auto_sync_suppressed && (
            <p className="mt-2 rounded-field border border-amber-300 bg-amber-50 p-3 text-small text-amber-800">
              Automatic sync after publish is temporarily paused after repeated failures. The
              5-minute background sync keeps trying; click <strong>Sync Now</strong> below to
              retry immediately and clear this.
            </p>
          )}
          <p className="mt-3 rounded-field bg-neutral-50 p-3 text-small text-neutral-600">
            AI automatically uses published website content. You do not need to enter the same
            information twice. Content changes are picked up automatically within a few minutes,
            or immediately with Sync Now below.
          </p>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="mt-3 rounded-button border border-neutral-300 px-4 py-2 text-small font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </button>

          <div className="mt-4 flex flex-col divide-y divide-neutral-100 border-t border-neutral-100">
            {sources.map((s) => (
              <div key={s.source_key} className="flex items-center justify-between gap-3 py-2.5">
                <label className="flex items-center gap-2 text-small text-neutral-800">
                  <input
                    type="checkbox"
                    checked={settings[SOURCE_TOGGLE_KEYS.find(([, key]) => key === s.source_key)?.[0] ?? "include_home"]}
                    onChange={(e) => {
                      const field = SOURCE_TOGGLE_KEYS.find(([, key]) => key === s.source_key)?.[0];
                      if (field) patch({ [field]: e.target.checked });
                    }}
                    className="h-4 w-4"
                  />
                  {s.label}
                </label>
                <Badge variant="neutral">{s.chunk_count} chunks</Badge>
              </div>
            ))}
          </div>
        </Card>

        {logs.length > 0 && (
          <Card>
            <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Sync Activity Log</p>
            <div className="mt-3 flex flex-col divide-y divide-neutral-100">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-3 py-2 text-small">
                  <span className="text-neutral-600">
                    {formatDate(log.started_at)} · {log.trigger}
                  </span>
                  <span className="flex items-center gap-2">
                    <span>{log.chunks_created} chunks</span>
                    <Badge variant={log.status === "success" ? "primary" : "neutral"}>{log.status}</Badge>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">WhatsApp</p>
          <div className="mt-3 flex flex-col gap-4">
            <label className="flex items-center gap-2 text-small text-neutral-700">
              <input
                type="checkbox"
                checked={settings.whatsapp_enabled}
                onChange={(e) => patch({ whatsapp_enabled: e.target.checked })}
                className="h-4 w-4"
              />
              Floating WhatsApp Button Enabled
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="wa-number">WhatsApp Number</Label>
                <Input
                  id="wa-number"
                  value={settings.whatsapp_number}
                  onChange={(e) => patch({ whatsapp_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="wa-name">Display Name</Label>
                <Input
                  id="wa-name"
                  value={settings.whatsapp_display_name}
                  onChange={(e) => patch({ whatsapp_display_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="wa-general">General Inquiry Template</Label>
              <Textarea
                id="wa-general"
                rows={4}
                value={settings.whatsapp_general_message}
                onChange={(e) => patch({ whatsapp_general_message: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="wa-product">
                Product Message Template <span className="text-neutral-400">(use {"{product}"} as placeholder)</span>
              </Label>
              <Textarea
                id="wa-product"
                rows={4}
                value={settings.whatsapp_product_message}
                onChange={(e) => patch({ whatsapp_product_message: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveState.status === "saving"}
            className="rounded-button bg-primary-500 px-6 py-2.5 text-small font-semibold text-neutral-900 hover:bg-primary-600 disabled:opacity-50"
          >
            {saveState.status === "saving" ? "Saving..." : "Save Changes"}
          </button>
          {saveState.status === "saved" && <span className="text-small text-primary-700">Tersimpan.</span>}
          {saveState.status === "error" && <span className="text-small text-red-600">{saveState.error}</span>}
        </div>

        <Card>
          <p className="text-small font-semibold uppercase tracking-wide text-neutral-500">Test AI</p>
          <div className="mt-3 flex gap-2">
            <Input
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder='Contoh: "What products does PPN supply?"'
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => void handleTest()}
              disabled={testing || !testQuestion.trim()}
              className="rounded-button bg-neutral-900 px-4 py-2 text-small font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test"}
            </button>
          </div>
          {testResult && (
            <div className="mt-3 rounded-field bg-neutral-50 p-3">
              <p className="text-small text-neutral-800">{testResult.answer}</p>
              {testResult.sources.length > 0 && (
                <p className="mt-2 text-[11px] text-neutral-500">
                  Sources: {testResult.sources.map((s) => s.label).join(", ")}
                </p>
              )}
              <p className="mt-1 text-[11px] text-neutral-400">
                Language: {testResult.language} · Knowledge version: {testResult.knowledge_version ?? "—"}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

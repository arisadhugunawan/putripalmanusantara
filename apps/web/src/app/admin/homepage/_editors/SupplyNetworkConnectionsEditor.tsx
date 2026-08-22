"use client";

import { Button, Card, cn } from "@ppn/ui-components";
import type { SupplyNetworkConnection, SupplyNetworkItem } from "@ppn/shared-types";
import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiRequestError } from "@/lib/admin/client";
import { arrayMove, DragHandle, useDragReorder } from "@/hooks/useDragReorder";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";

/** "From Node → To Node" links the public visual draws as animated curved connection paths and
 * the supply-flow particles travel along. Every active node also always connects to the fixed
 * center "PPN" node automatically (not configurable here — the center isn't a manageable node),
 * so this list only needs to cover node-to-node links. */
export function SupplyNetworkConnectionsEditor() {
  const [connections, setConnections] = useState<SupplyNetworkConnection[] | null>(null);
  const [items, setItems] = useState<SupplyNetworkItem[] | null>(null);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    const [connectionData, itemData] = await Promise.all([
      adminApi.get<SupplyNetworkConnection[]>("/admin/supply-network/connections"),
      adminApi.get<SupplyNetworkItem[]>("/admin/supply-network"),
    ]);
    setConnections(connectionData);
    setItems(itemData);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; load() sets state only inside its own async body, not synchronously in this effect
    void load();
  }, [load]);

  const nodeName = (id: string) => items?.find((item) => item.id === id)?.title ?? "(node dihapus)";

  async function handleCreate() {
    setError(null);
    if (!fromId || !toId) {
      setError("Pilih From Node dan To Node.");
      return;
    }
    if (fromId === toId) {
      setError("From Node dan To Node tidak boleh sama.");
      return;
    }
    try {
      await adminApi.post("/admin/supply-network/connections", {
        from_node_id: fromId,
        to_node_id: toId,
        order: connections?.length ?? 0,
      });
      setFromId("");
      setToId("");
      await load();
      showToast("Connection berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal menambah connection.");
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    try {
      await adminApi.delete(`/admin/supply-network/connections/${id}`);
      await load();
      showToast("Connection berhasil dihapus.");
    } catch {
      showToast("Gagal menghapus connection. Silakan coba lagi.", "error");
    }
  }

  async function handleReorder(from: number, to: number) {
    if (!connections) return;
    if (to < 0 || to >= connections.length) return;
    const next = arrayMove(connections, from, to);
    try {
      await Promise.all(
        next
          .map((connection, index) =>
            connection.order === index
              ? null
              : adminApi.put(`/admin/supply-network/connections/${connection.id}`, { order: index }),
          )
          .filter(Boolean),
      );
      await load();
    } catch {
      showToast("Gagal memperbarui urutan.", "error");
    }
  }

  const { getRowProps, getHandleProps } = useDragReorder((from, to) => void handleReorder(from, to));

  if (!connections || !items) return null;

  return (
    <Card className="mt-6">
      <h2 className="text-h3 text-neutral-900">Supply Flow Connections</h2>
      <p className="mt-1 text-small text-neutral-600">
        Alur panah/partikel antar node (mis. Farmers → Collectors). Setiap node juga otomatis
        terhubung ke pusat PPN — tidak perlu ditambahkan di sini.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {connections.length === 0 && (
          <div className="rounded-field border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-body text-neutral-600">Belum ada connection.</p>
          </div>
        )}
        {connections.map((connection, index) => {
          const rowProps = getRowProps(index);
          return (
            <div
              key={connection.id}
              {...rowProps}
              className={cn(
                "flex items-center gap-3 rounded-field border border-neutral-200 p-3 transition-opacity",
                rowProps.className,
              )}
            >
              <span {...getHandleProps(index)}>
                <DragHandle />
              </span>
              <p className="flex-1 text-body text-neutral-900">
                {nodeName(connection.from_node_id)} <span className="text-primary-600">→</span>{" "}
                {nodeName(connection.to_node_id)}
              </p>
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
                disabled={index === connections.length - 1}
                className="text-small text-neutral-600 underline disabled:opacity-30"
              >
                Turun
              </button>
              <button type="button" onClick={() => setDeleteTargetId(connection.id)} className="text-small text-red-600 underline">
                Hapus
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-4">
        <div>
          <label className="text-small text-neutral-600">From Node</label>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className="mt-1 block w-52 rounded-field border border-neutral-300 px-3 py-2 text-body"
          >
            <option value="">Pilih node...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-small text-neutral-600">To Node</label>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="mt-1 block w-52 rounded-field border border-neutral-300 px-3 py-2 text-body"
          >
            <option value="">Pilih node...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={() => void handleCreate()}>
          Add Connection
        </Button>
      </div>
      {error && <p className="mt-2 text-small text-red-600">{error}</p>}

      {deleteTargetId && (
        <ConfirmDialog
          title="Hapus connection ini?"
          message="Alur panah/partikel ini akan dihapus dari diagram. Tindakan ini tidak dapat dibatalkan."
          confirmLabel="Hapus"
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </Card>
  );
}

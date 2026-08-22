"use client";

import type { ShipmentDocument } from "@ppn/shared-types";
import { Link } from "@/i18n/Link";
import { useState } from "react";
import { SHIPMENT_ICONS } from "./ShipmentIcons";

/** "Documentation" panel — the expandable list renders nothing at all (no trigger, no
 * "no documents" placeholder) until the admin has added at least one real document. */
export function ShipmentDocumentsDisclosure({ documents }: { documents: ShipmentDocument[] }) {
  const [open, setOpen] = useState(false);
  const FileCheckIcon = SHIPMENT_ICONS.file_check;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          <FileCheckIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-h3 text-neutral-900">Documentation</h3>
          <p className="mt-1 text-body text-neutral-600">
            Prepared according to shipment requirements and applicable regulations.
          </p>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="text-small font-medium text-primary-700 underline"
          >
            {open ? "Sembunyikan daftar dokumen" : "Lihat daftar dokumen"}
          </button>
          {open && (
            <ul className="mt-3 flex flex-col gap-2">
              {documents.map((doc) =>
                doc.url ? (
                  <li key={doc.id}>
                    <Link
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body text-primary-700 underline"
                    >
                      {doc.name}
                    </Link>
                    {doc.description && <p className="text-small text-neutral-600">{doc.description}</p>}
                  </li>
                ) : (
                  <li key={doc.id}>
                    <p className="text-body text-neutral-900">{doc.name}</p>
                    {doc.description && <p className="text-small text-neutral-600">{doc.description}</p>}
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

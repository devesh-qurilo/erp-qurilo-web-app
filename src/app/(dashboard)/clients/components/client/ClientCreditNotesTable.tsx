// src/components/ClientCreditNotesTable.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, Loader } from "lucide-react";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";



import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // adjust import if different

type ApiClient = {
  clientId?: string;
  name?: string | null;
  profilePictureUrl?: string | null;
  email?: string | null;
  mobile?: string | null;
  companyName?: string | null;
};

type ApiProject = {
  projectName?: string | null;
  projectCode?: string | null;
};

type CreditNote = {
  id: number;
  creditNoteNumber?: string | null;
  invoiceNumber?: string | null;
  creditNoteDate?: string | null;
  currency?: string | null;
  adjustment?: number | null;
  adjustmentPositive?: boolean | null;
  tax?: number | null;
  amount?: number | null;
  notes?: string | null;
  fileUrl?: string | null;
  client?: ApiClient | null;
  project?: ApiProject | null;
  totalAmount?: number | null;
  createdAt?: string | null;
};

const BASE_URL = process.env.NEXT_PUBLIC_MAIN ; // provided base url

export default function ClientCreditNotesTable({ clientId }: { clientId?: string | number | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  // modal state for details view
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [active, setActive] = useState<CreditNote | null>(null);

  useEffect(() => {
    // If no clientId provided, clear and exit
    if (!clientId && clientId !== 0) {
      setCreditNotes([]);
      setError("No client selected.");
      setLoading(false);
      return;
    }

    // Build URL using the clientId value directly (it may be string or number)
    const controller = new AbortController();
    const idStr = String(clientId);
    const url = `${BASE_URL}/api/credit-notes/client/${encodeURIComponent(idStr)}`;

    setLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");
    fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCreditNotes(data);
        } else if (data && typeof data === "object") {
          // handle { data: [...] } or similar shapes
          if (Array.isArray((data as any).data)) {
            setCreditNotes((data as any).data);
          } else if (Array.isArray((data as any).creditNotes)) {
            setCreditNotes((data as any).creditNotes);
          } else {
            setCreditNotes([]);
          }
        } else {
          setCreditNotes([]);
        }
      })
      .catch((err) => {
        if ((err as any).name === "AbortError") return;
        console.error("Error fetching credit notes:", err);
        setError("Failed to load credit notes.");
        setCreditNotes([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [clientId]);

  // Formatting helpers
  const formatDate = (d?: string | null) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yyyy = dt.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return d;
    }
  };

  const formatCurrency = (amount?: number | null, currency?: string | null) => {
    if (amount == null || Number.isNaN(Number(amount))) return "$ 0.00";
    const curr = currency || "USD";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: curr,
        maximumFractionDigits: 2,
      }).format(Number(amount));
    } catch {
      return `${curr} ${Number(amount).toFixed(2)}`;
    }
  };

  // open modal with selected credit note
  const openDetails = useCallback((cn: CreditNote) => {
    setActive(cn);
    setIsModalOpen(true);
  }, []);

  const closeDetails = useCallback(() => {
    setIsModalOpen(false);
    setActive(null);
  }, []);

  // render file thumbnail (small) — click download opens file url
  const FileThumb: React.FC<{ url?: string | null; alt?: string }> = ({ url, alt }) => {
    if (!url) return <div className="text-sm text-gray-500">No file attached</div>;
    return (
      <div className="relative inline-block">
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={alt ?? "file"}
            style={{ width: 140, height: 90, objectFit: "cover", borderRadius: 4 }}
            className="border"
          />
        </a>
        <a
          href={url}
          download
          target="_blank"
          rel="noreferrer"
          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
          title="Download"
          onClick={(e) => e.stopPropagation()}
        >
          {/* small download icon using inline SVG to avoid extra imports */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3v12" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 11l4 4 4-4" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 21H3" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Outer card with rounded border and subtle background */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Credit Notes</h3>
          <div className="text-sm text-muted-foreground">
            {/* {creditNotes.length} record{creditNotes.length !== 1 ? "s" : ""} */}


{loading ? (
  <Skeleton width={80} />
) : (
  `${creditNotes.length} record${creditNotes.length !== 1 ? "s" : ""}`
)}


          </div>
        </div>

        {/* {loading ? (
          <div className="py-12 flex justify-center">
            <Loader className="animate-spin" />
          </div>
        ) */}


{loading ? (
  <div className="rounded-lg border overflow-hidden">
    {/* Header skeleton */}
    <div className="bg-[#e8f3ff] px-6 py-3 flex">
      <div className="w-1/6"><Skeleton width={100} /></div>
      <div className="w-1/6"><Skeleton width={100} /></div>
      <div className="w-2/6"><Skeleton width={150} /></div>
      <div className="w-1/6"><Skeleton width={80} /></div>
      <div className="w-1/6"><Skeleton width={100} /></div>
      <div className="w-12"><Skeleton width={30} /></div>
    </div>

    {/* Rows skeleton */}
    <div className="px-6 py-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center rounded-md border px-4 py-4">
          
          <div className="w-1/6">
            <Skeleton width={80} />
          </div>

          <div className="w-1/6">
            <Skeleton width={70} />
          </div>

          <div className="w-2/6 flex items-center gap-3">
            <Skeleton circle width={32} height={32} />
            <div className="flex flex-col gap-1">
              <Skeleton width={120} />
              <Skeleton width={80} />
            </div>
          </div>

          <div className="w-1/6">
            <Skeleton width={90} />
            <Skeleton width={70} />
          </div>

          <div className="w-1/6">
            <Skeleton width={100} />
          </div>

          <div className="w-12 flex justify-center">
            <Skeleton circle width={30} height={30} />
          </div>
        </div>
      ))}
    </div>
  </div>
)


        
        
        
        : error ? (
          <div className="py-6 text-center text-red-600">{error}</div>
        ) : creditNotes.length === 0 ? (
          <div className="py-8 text-center text-gray-600">No credit notes found for this client.</div>
        ) : (
          /* Table-like layout matching screenshot */
          <div className="rounded-lg border overflow-hidden">
            {/* pale-blue header with rounded top corners */}
            <div className="bg-[#e8f3ff] px-6 py-3 flex text-sm text-gray-700 font-medium">
              <div className="w-1/6">Credit Note</div>
              <div className="w-1/6">Invoice</div>
              <div className="w-2/6">Client</div>
              <div className="w-1/6">Total</div>
              <div className="w-1/6">Credit Note Date</div>
              <div className="w-12 text-center">Action</div>
            </div>

            {/* rows */}
            <div className="px-6 py-4">
              <div className="space-y-3">
                {creditNotes.map((cn) => (
                  <div
                    key={cn.id}
                    className="flex items-center rounded-md border px-4 py-4 bg-white"
                    style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.02) inset" }}
                  >
                    {/* Credit Note */}
                    <div className="w-1/6 text-sm">
                      <div className="font-medium">{cn.creditNoteNumber ?? `CN#${cn.id}`}</div>
                    </div>

                    {/* Invoice */}
                    <div className="w-1/6 text-sm">{cn.invoiceNumber ?? "-"}</div>

                    {/* Client */}
                    <div className="w-2/6 flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                        {cn.client?.profilePictureUrl ? (
                          <Image
                            src={cn.client.profilePictureUrl}
                            alt={cn.client?.name ?? "client"}
                            fill
                            sizes="32px"
                            style={{ objectFit: "cover" }}
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-xs text-gray-500">
                            {cn.client?.name ? cn.client.name.charAt(0) : "U"}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{cn.client?.name ?? "-"}</span>
                        <span className="text-xs text-gray-500">{cn.project?.projectName ?? ""}</span>
                      </div>
                    </div>

                    {/* Total + Adjustment */}
                    <div className="w-1/6 text-sm">
                      <div className="text-sm font-semibold">{formatCurrency(cn.totalAmount ?? cn.amount, cn.currency)}</div>
                      <div className="text-xs text-amber-600">Adjustment : {cn.adjustment != null ? Number(cn.adjustment).toFixed(2) : "0.00"}</div>
                    </div>

                    {/* Date */}
                    <div className="w-1/6 text-sm">{formatDate(cn.creditNoteDate ?? cn.createdAt)}</div>

                    {/* Only view icon */}
                    <div className="w-12 text-center">
                      <button
                        type="button"
                        onClick={() => openDetails(cn)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAILS MODAL: matches screenshot layout (labels left, values right) */}
      {isModalOpen && active && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeDetails} />

          {/* <div className="relative z-10 w-[820px] max-w-full"> */}
          <div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="bg-white rounded-lg border shadow">
              {/* modal header */}
              <div className="flex items-center justify-between px-6 py-3 border-b">
                <h3 className="text-lg font-semibold">Credit Note Details</h3>
                <button onClick={closeDetails} className="text-gray-600 hover:text-gray-800" aria-label="Close">✕</button>
              </div>

              {/* modal content */}
              <div className="p-6">
                <div className="rounded-md border p-5">
                  <div className="grid grid-cols-2 gap-6">
                    {/* left column with labels */}
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">Credit Note #</div>
                      <div className="text-sm text-gray-600">Credit Note Date</div>
                      <div className="text-sm text-gray-600">Client</div>
                      <div className="text-sm text-gray-600">Project</div>
                      <div className="text-sm text-gray-600">Invoice Amount</div>
                      <div className="text-sm text-gray-600">Adjustment</div>
                      <div className="text-sm text-gray-600">Tax</div>
                      <div className="text-sm text-gray-600">Note</div>
                      <div className="text-sm text-gray-600">File</div>
                    </div>

                    {/* right column with values */}
                    <div className="space-y-4">
                      <div className="text-sm font-medium">{active.creditNoteNumber ?? `CN#${active.id}`}</div>

                      <div className="text-sm">{formatDate(active.creditNoteDate ?? active.createdAt)}</div>

                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 relative">
                          {active.client?.profilePictureUrl ? (
                            <Image src={active.client.profilePictureUrl} alt={active.client?.name ?? "client"} fill sizes="32px" style={{ objectFit: "cover" }} unoptimized />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-gray-500">
                              {active.client?.name ? active.client.name.charAt(0) : "U"}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{active.client?.name ?? "-"}</div>
                          <div className="text-xs text-gray-500">{active.client?.companyName ?? ""}</div>
                        </div>
                      </div>

                      <div className="text-sm">{active.project?.projectName ?? "-"}</div>

                      <div className="text-sm">{formatCurrency(active.totalAmount ?? active.amount, active.currency)}</div>

                      <div className="text-sm">{active.adjustment != null ? formatCurrency(active.adjustment, active.currency) : formatCurrency(0, active.currency)} {active.adjustmentPositive ? "(Add)" : ""}</div>

                      <div className="text-sm">{active.tax != null ? `${active.tax} %` : "-"}</div>

                      <div className="text-sm text-gray-700">{active.notes ?? "-"}</div>

                      <div className="text-sm">
                        <FileThumb url={active.fileUrl} alt={active.creditNoteNumber ?? `CN#${active.id}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* footer: only Close to match screenshot (non-destructive) */}
              <div className="flex items-center justify-end px-6 py-3 border-t">
                <button onClick={closeDetails} className="px-4 py-2 rounded border bg-white hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

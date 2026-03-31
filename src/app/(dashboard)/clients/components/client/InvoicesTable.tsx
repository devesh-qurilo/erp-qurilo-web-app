
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { createPortal } from "react-dom";
import ClientAddPaymentModal from "./ClientAddPaymentModal";
import InvoicePaymentsDrawer from "./InvoicePaymentsDrawer";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import {
  Plus,
  CheckCircle,
  Trash,
  Upload,
  Copy,
  MoreHorizontal,
  Edit2,
  FileText,
  Eye,
  CircleDollarSign,
  Bell,
  PlusCircle,
  Download,
  X,
  CloudUpload,
} from "lucide-react";
import CreditNoteModal from "./CreditNoteModal";
import ViewCreditNoteModal from "./ViewCreditNoteModal";
import DuplicateInvoiceModal from "./DuplicateInvoiceModal";
import { format } from "date-fns";

const API_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;

type InvoiceState = "PAID" | "UNPAID" | "PARTIAL" | "CREDIT" | "UNKNOWN";
const tryParseResponse = async (res: Response) => {
  try {
    return { parsed: await res.clone().json(), raw: null };
  } catch {
    try {
      const txt = await res.clone().text();
      return { parsed: JSON.parse(txt), raw: txt };
    } catch {
      return { parsed: null, raw: null };
    }
  }
};

export default function InvoicesTable({
  clientId,
  invoicesProp,
  onInvoiceCreated,
}: {
  clientId?: string | number | null;
  invoicesProp?: any[] | null;
  onInvoiceCreated?: (invOrNull: any) => void;
}) {
  const [invoices, setInvoices] = useState<any[]>(invoicesProp ?? []);
  const [loading, setLoading] = useState<boolean>(Boolean(!invoicesProp));
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);

// Client Add Payment Modal
const [showClientPaymentModal, setShowClientPaymentModal] = useState(false);
const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);

const [showPaymentsDrawer, setShowPaymentsDrawer] = useState(false);
const [paymentsInvoiceNo, setPaymentsInvoiceNo] = useState<string | null>(null);




  // Credit Note Modals
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showViewCreditModal, setShowViewCreditModal] = useState(false);
  const [activeCredit, setActiveCredit] = useState<any>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const [search, setSearch] = useState("");
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<any>({
    invoiceNumber: "",
    invoiceDate: "",
    currency: "USD",
    projectId: "",
    clientId: clientId
      ? String(clientId)
      : invoicesProp && invoicesProp[0]?.client?.clientId
        ? String(invoicesProp[0].client.clientId)
        : "",
    amount: 0,
    taxPercent: 10,
    discountValue: 0,
    discountIsPercent: true,
    notes: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  // Receipt create modal (existing)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [receiptForm, setReceiptForm] = useState<any>({
    invoiceNumber: "",
    issueDate: "",
    currency: "USD",
    sellerCompanyName: "",
    sellerCompanyAddress: "",
    sellerCompanyCode: "",
    sellerCompanyTaxNumber: "",
    sellerCompanyEmail: "",
    sellerCompanyPhoneNumber: "",
    sellerCompanyBankName: "",
    sellerCompanyBankAccountNumber: "",
    buyerCompanyName: "",
    buyerCompanyAddress: "",
    buyerCompanyCode: "",
    buyerCompanyTaxNumber: "",
    buyerCleintName: "",
    buyerCompanyEmail: "",
    buyerCompanyPhoneNumber: "",
    buyerCompanyBankName: "",
    buyerCompanyBankAccountNumber: "",
    productName: "",
    tax: 0,
    priceWithOutTax: 0,
    quantity: 1,
    description: "",
  });

  // NEW receipts modal state
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);
  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [selectedInvoiceForReceipts, setSelectedInvoiceForReceipts] = useState<
    any | null
  >(null);

  const [viewReceipt, setViewReceipt] = useState<any | null>(null);

  // Per-receipt action menu state (new)
  const [receiptMenuOpenFor, setReceiptMenuOpenFor] = useState<any | null>(
    null,
  );
  const [receiptMenuPos, setReceiptMenuPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const receiptMenuRef = useRef<HTMLDivElement | null>(null);

  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  // hidden input refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // OLD upload flow kept for compatibility but we will use modal flow
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const uploadTargetRef = useRef<any | null>(null);
  const [uploading, setUploading] = useState(false);

  // NEW: Upload modal UI state (matches screenshot)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSelectedFile, setUploadSelectedFile] = useState<File | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [menuOpenFor, setMenuOpenFor] = useState<any | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement | null>(null);

  async function downloadReceiptPDF(r: any) {
    const createdIdUSD = r?.createdIdUSD || r?.id;

    if (!createdIdUSD) {
      alert("PDF ID not found");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/invoice/${createdIdUSD}/pdf?disposition=attachment`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!res.ok) throw new Error("Failed to download PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${createdIdUSD}.pdf`;
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ PDF Download Error", err);
      alert("Failed to download PDF");
    }
  }

  async function deleteReceipt(r: any) {
    if (!confirm("Are you sure you want to delete this receipt?")) return;

    const id = r?.id;
    if (!id) {
      alert("Receipt ID missing");
      return;
    }

    await fetch(`${API_BASE}/api/invoice/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    // reload receipts list
    if (selectedInvoiceForReceipts) {
      await viewReceipts(selectedInvoiceForReceipts);
    }
  }

  useEffect(() => {
    setCreateForm((p: any) => ({
      ...p,
      clientId: clientId ? String(clientId) : (p.clientId ?? ""),
    }));
  }, [clientId, invoicesProp]);

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") || ""
        : "";
    return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
  };

  const invoicePaths = (inv: any) => {
    const paths: string[] = [];
    if (!inv) return paths;
    if (inv.invoiceNumber)
      paths.push(
        `${API_BASE}/api/invoices/${encodeURIComponent(String(inv.invoiceNumber))}`,
      );
    if (inv.id !== undefined && inv.id !== null)
      paths.push(
        `${API_BASE}/api/invoices/${encodeURIComponent(String(inv.id))}`,
      );
    return paths;
  };

  const isPaidInvoice = (inv: any) => {
    if (!inv) return false;
    const s = String(inv?.status ?? "").toLowerCase();
    if (s.includes("paid")) return true;
    if (typeof inv.unpaidAmount === "number" && inv.unpaidAmount === 0)
      return true;
    if (
      typeof inv.total === "number" &&
      typeof inv.paidAmount === "number" &&
      inv.total <= (inv.paidAmount ?? 0)
    )
      return true;
    return false;
  };
  const isUnpaidInvoice = (inv: any) => {
    if (!inv) return false;
    const s = String(inv?.status ?? "").toLowerCase();
    if (
      s.includes("unpaid") ||
      s.includes("partial") ||
      s.includes("partially")
    )
      return true;
    if (typeof inv.unpaidAmount === "number" && inv.unpaidAmount > 0)
      return true;
    return false;
  };
  const isCreditInvoice = (inv: any) => {
    if (!inv) return false;
    const s = String(inv?.status ?? "").toLowerCase();
    if (
      s.includes("credit") ||
      s.includes("creditnote") ||
      s.includes("credit-note")
    )
      return true;
    if (inv.isCreditNote) return true;
    if (Array.isArray(inv.creditNotes) && inv.creditNotes.length > 0)
      return true;
    return false;
  };

  // fetch invoices
  const fetchInvoices = async (explicitClientId?: string | number | null) => {
    setLoading(true);
    setError(null);
    setRawResponse(null);
    try {
      const cid = explicitClientId ?? clientId ?? null;
      if (!cid) {
        setInvoices([]);
        setError("No client specified (pass invoicesProp or clientId)");
        setLoading(false);
        return;
      }
      const candidates = [
        `${API_BASE}/api/invoices/client/${encodeURIComponent(String(cid))}`,
        `/api/invoices/client/${encodeURIComponent(String(cid))}`,
        `${API_BASE}/api/finance/invoices?clientId=${encodeURIComponent(String(cid))}`,
        `/api/finance/invoices?clientId=${encodeURIComponent(String(cid))}`,
      ];
      let lastErr: any = null;
      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            headers: getAuthHeaders(),
            cache: "no-store",
          });
          if (res.status === 401 || res.status === 403) {
            const t = await res.text().catch(() => "");
            setError(`Auth error ${res.status}. Check access token.`);
            setInvoices([]);
            setRawResponse(t || null);
            setLoading(false);
            return;
          }
          if (!res.ok) {
            lastErr = {
              url,
              status: res.status,
              text: await res.text().catch(() => ""),
            };
            continue;
          }
          const parsed = await tryParseResponse(res);
          if (Array.isArray(parsed.parsed)) {
            setInvoices(parsed.parsed);
            setLoading(false);
            return;
          }
          if (typeof parsed.raw === "string") {
            try {
              const maybe = JSON.parse(parsed.raw);
              if (Array.isArray(maybe)) {
                setInvoices(maybe);
                setLoading(false);
                return;
              }
            } catch {}
          }
          if (parsed.parsed && typeof parsed.parsed === "object") {
            const obj = parsed.parsed as any;
            if (Array.isArray(obj.invoices)) {
              setInvoices(obj.invoices);
              setLoading(false);
              return;
            }
            if (Array.isArray(obj.items)) {
              setInvoices(obj.items);
              setLoading(false);
              return;
            }
          }
          setRawResponse(parsed.raw ?? null);
          //console.log("guuuuuuuu",rawResponse)
          setInvoices([]);
          setError(
            "Server returned unexpected payload. See rawResponse for details.",
          );
          setLoading(false);
          return;
        } catch (err) {
          lastErr = err;
          continue;
        }
      }
      setInvoices([]);
      setError(
        `All fetch attempts failed. Last error: ${JSON.stringify(lastErr)}`,
      );
    } catch (err: any) {
      setInvoices([]);
      setError(err?.message ?? "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoicesProp && Array.isArray(invoicesProp)) {
      setInvoices(invoicesProp);
      setLoading(false);
      setError(null);
      return;
    }
    if (clientId) {
      fetchInvoices(clientId);
      return;
    }
    setInvoices([]);
    setLoading(false);
    setError("No client specified (pass invoicesProp or clientId)");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, invoicesProp]);

  // dropdown lists
  const fetchProjectsList = async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/projects/AllProject`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setProjectsList([]);
        setProjectsLoading(false);
        return;
      }
      const txt = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(txt);
      } catch {
        parsed = null;
      }
      if (Array.isArray(parsed)) setProjectsList(parsed);
      else {
        try {
          const maybe = JSON.parse(String(parsed ?? txt));
          if (Array.isArray(maybe)) setProjectsList(maybe);
          else setProjectsList([]);
        } catch {
          setProjectsList([]);
        }
      }
    } catch (err) {
      console.error("fetchProjectsList", err);
      setProjectsList([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchClientsList = async () => {
    setClientsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/clients`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setClientsList([]);
        setClientsLoading(false);
        return;
      }
      const txt = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(txt);
      } catch {
        parsed = null;
      }
      if (Array.isArray(parsed)) setClientsList(parsed);
      else {
        try {
          const maybe = JSON.parse(String(parsed ?? txt));
          if (Array.isArray(maybe)) setClientsList(maybe);
          else setClientsList([]);
        } catch {
          setClientsList([]);
        }
      }
    } catch (err) {
      console.error("fetchClientsList", err);
      setClientsList([]);
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsList();
    fetchClientsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // menu close handlers
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (menuRef.current && menuRef.current.contains(el)) return;
      if (receiptMenuRef.current && receiptMenuRef.current.contains(el)) return;
      if (el.closest(".invoice-action-button")) return;
      if (el.closest(".receipt-action-button")) return;
      setMenuOpenFor(null);
      setMenuPos(null);
      setReceiptMenuOpenFor(null);
      setReceiptMenuPos(null);
    };
    const onScrollOrResize = () => {
      setMenuOpenFor(null);
      setMenuPos(null);
      setReceiptMenuOpenFor(null);
      setReceiptMenuPos(null);
    };
    document.addEventListener("click", onDoc);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("click", onDoc);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

const openMenuFor = (inv: any, buttonEl: HTMLElement | null) => {
  if (!buttonEl) return;

  const rect = buttonEl.getBoundingClientRect();
  const menuWidth = 260;
  const menuHeight = 320; // approx
  const margin = 8;

  let left = rect.right - menuWidth;
  if (left < margin) left = rect.left;

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  let top =
    spaceBelow >= menuHeight
      ? rect.bottom + 6
      : rect.top - menuHeight - 6;

  top = Math.max(margin, Math.min(top, window.innerHeight - menuHeight));

  setMenuPos({
    left: Math.max(left, margin),
    top,
  });

  setMenuOpenFor(inv);
};



  const openReceiptMenuFor = (r: any, buttonEl: HTMLElement | null) => {
    if (!buttonEl) return;
    const rect = buttonEl.getBoundingClientRect();
    const menuWidth = 220;
    const margin = 8;
    let left = rect.right - menuWidth;
    if (left < margin) left = rect.left;
    const top = rect.bottom + window.scrollY + 6;
    const maxLeft = window.scrollX + window.innerWidth - menuWidth - margin;
    if (left + window.scrollX > maxLeft)
      left = Math.max(window.scrollX + margin, maxLeft);
    setReceiptMenuPos({ left: Math.max(left, window.scrollX + margin), top });
    setReceiptMenuOpenFor(r);
  };

  // -----------------------
  // UPLOAD MODAL FLOW (NEW)
  // -----------------------

  // when user clicks "Upload File" in menu, we open upload modal instead of immediate file dialog
  const openUploadModalFor = (inv: any) => {
    uploadTargetRef.current = inv;
    setUploadSelectedFile(null);
    setUploadError(null);
    setShowUploadModal(true);
    setMenuOpenFor(null);
    setMenuPos(null);
  };

  // handle file choose via hidden input
  const onChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      setUploadSelectedFile(f);
      setUploadError(null);
    }
    // reset input value so same file can be picked again
    e.currentTarget.value = "";
  };

  // drag/drop handlers for the big drop area
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) {
      setUploadSelectedFile(f);
      setUploadError(null);
    }
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // IMPORTANT: uses explicit API path per your note: POST {Gateway}/api/invoices/{invoiceNumber}/files
  const handleUploadSave = async () => {
    if (!uploadSelectedFile) {
      setUploadError("Please choose a file first");
      return;
    }
    const inv = uploadTargetRef.current;
    if (!inv) {
      setUploadError("Upload target not set");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      // prefer invoiceNumber path as specified by your API
      const invoiceNumber = inv.invoiceNumber ?? inv.id ?? null;
      if (!invoiceNumber)
        throw new Error("Invoice number not available for upload");
      // console.log("Uploading to invoice number:", invoiceNumber);
      const uploadUrl = `${API_BASE}/api/invoices/${encodeURIComponent(String(invoiceNumber))}/files`;

      const fd = new FormData();
      fd.append("file", uploadSelectedFile);
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Upload failed ${res.status} ${t}`);
      }

      // parse response: your console shows plain URL string in body
      const resText = await res.text().catch(() => "");
      // if it's a JSON, try to parse; else treat as returned URL
      let returnedUrl: string | null = null;
      try {
        const maybe = JSON.parse(resText);
        if (typeof maybe === "string") returnedUrl = maybe;
        else if (maybe && typeof maybe.url === "string")
          returnedUrl = maybe.url;
      } catch {
        if (typeof resText === "string" && resText.trim().length > 0)
          returnedUrl = resText.trim();
      }

      // refresh parent/state similarly
      if (invoicesProp && typeof onInvoiceCreated === "function")
        onInvoiceCreated(null as any);
      else await fetchInvoices(clientId);

      // If receipts modal open for same invoice, reload receipts for that invoice
      if (showReceiptsModal && selectedInvoiceForReceipts) {
        const sameInvoice = (a: any, b: any) => {
          if (!a || !b) return false;
          const ai = a.id ?? a.invoiceId ?? a.invoiceNumber ?? null;
          const bi = b.id ?? b.invoiceId ?? b.invoiceNumber ?? null;
          return ai != null && bi != null && String(ai) === String(bi);
        };
        if (sameInvoice(selectedInvoiceForReceipts, inv)) {
          await viewReceipts(selectedInvoiceForReceipts);
        }
      }


      if (returnedUrl) {
        setInvoices((prev) =>
          prev.map((iv) => {
            const idA = iv.id ?? iv.invoiceNumber ?? null;
            const idB = inv.id ?? inv.invoiceNumber ?? null;
            if (idA != null && idB != null && String(idA) === String(idB)) {
              const files = Array.isArray(iv.files) ? [...iv.files] : [];
              files.unshift({
                url: returnedUrl,
                name: uploadSelectedFile.name,
              });

              const fileUrls = Array.isArray(iv.fileUrls)
                ? [...iv.fileUrls]
                : [];
              // push string URL (avoid duplicates)
              if (!fileUrls.includes(returnedUrl))
                fileUrls.unshift(returnedUrl);

              return { ...iv, files, fileUrls };
            }
            return iv;
          }),
        );
      }

      alert("Upload successful");
      setShowUploadModal(false);
      uploadTargetRef.current = null;
      setUploadSelectedFile(null);
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed");
      alert(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const getInvoiceState = (inv: any): InvoiceState => {
    if (!inv) return "UNKNOWN";

    const status = String(inv.status ?? "").toUpperCase();


if (
  status === "CREDIT" ||
  status === "CREDIT_NOTE" ||
  status === "CREDIT_NOTES" ||
  inv.isCreditNote === true ||
  (Array.isArray(inv.creditNotes) && inv.creditNotes.length > 0)
) {
  return "CREDIT";
}



    // backend is authoritative
    if (status === "PAID") return "PAID";
    if (status === "UNPAID") return "UNPAID";
    if (status === "PARTIALLY_PAID" || status === "PARTIAL") return "PARTIAL";

    // fallback safety (should rarely hit)
    const unpaid = Number(inv.unpaidAmount ?? 0);
    const paid = Number(inv.paidAmount ?? 0);

    if (paid > 0 && unpaid > 0) return "PARTIAL";
    if (unpaid === 0 && paid >= 0) return "PAID";
    if (unpaid > 0) return "UNPAID";

    return "UNKNOWN";
  };

  // keep legacy effect in case other code sets fileToUpload (not used now, but safe)
  useEffect(() => {
    if (!fileToUpload) return;
    (async () => {
      const inv = uploadTargetRef.current;
      if (!inv) {
        alert("Upload target not set");
        setFileToUpload(null);
        return;
      }
      setUploading(true);
      try {
        const p = invoicePaths(inv)[0];
        if (!p) throw new Error("Cannot determine invoice resource for upload");
        const fd = new FormData();
        fd.append("file", fileToUpload);
        const res = await fetch(`${p}/files`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: fd,
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(`Upload failed ${res.status} ${t}`);
        }
        if (invoicesProp && typeof onInvoiceCreated === "function")
          onInvoiceCreated(null as any);
        else await fetchInvoices(clientId);
        alert("Upload successful");
      } catch (err: any) {
        alert(err?.message ?? "Upload failed");
      } finally {
        setFileToUpload(null);
        setUploading(false);
        uploadTargetRef.current = null;
        setMenuOpenFor(null);
        setMenuPos(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileToUpload]);

  const fetchInvoiceDetails = async (inv: any) => {
    if (!inv) return inv;
    for (const p of invoicePaths(inv)) {
      try {
        const res = await fetch(p, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
        if (!res.ok) continue;
        const parsed = await tryParseResponse(res);
        return parsed.parsed ?? parsed.raw ?? inv;
      } catch {}
    }
    return inv;
  };

  const openViewFromMenu = async (inv: any) => {
    const full = await fetchInvoiceDetails(inv);
    setActiveInvoice(full);
    setShowViewModal(true);
    setMenuOpenFor(null);
    setMenuPos(null);
  };

  // create invoice (existing)
  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        invoiceNumber: createForm.invoiceNumber || undefined,
        invoiceDate: createForm.invoiceDate || undefined,
        currency: createForm.currency,
        projectId: createForm.projectId || undefined,
        clientId:
          createForm.clientId || String(clientId ?? createForm.clientId ?? ""),
        amount: Number(createForm.amount || 0),
        tax: Number(createForm.taxPercent || 0),
        discount: Number(createForm.discountValue || 0),
        discountIsPercent: Boolean(createForm.discountIsPercent),
        notes: createForm.notes || undefined,
      };
      const res = await fetch(`${API_BASE}/api/invoices`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Create failed: ${res.status} ${t}`);
      }
      const parsed = await tryParseResponse(res);
      const created = parsed.parsed ?? null;
      if (invoicesProp && typeof onInvoiceCreated === "function")
        onInvoiceCreated(created);
      else await fetchInvoices(clientId);
      setShowCreateModal(false);
      setCreateForm((prev: any) => ({
        ...prev,
        invoiceNumber: "",
        invoiceDate: "",
        projectId: "",
        amount: 0,
        taxPercent: 10,
        discountValue: 0,
        discountIsPercent: true,
        notes: "",
      }));
      if (created?.id || created?.invoiceNumber) {
        const full = await fetchInvoiceDetails(created);
        setActiveInvoice(full);
        setShowViewModal(true);
      }
    } catch (err: any) {
      alert(err?.message ?? "Create failed");
    } finally {
      setCreating(false);
      setMenuOpenFor(null);
      setMenuPos(null);
    }
  };

  // remaining handlers unchanged (edit, payments, credit etc.)
  const openEditModal = async (inv: any) => {
    const full = await fetchInvoiceDetails(inv);
    setEditForm({
      id: full.id ?? full.invoiceNumber ?? null,
      invoiceNumber: full.invoiceNumber ?? "",
      invoiceDate: full.invoiceDate ?? "",
      currency: full.currency ?? "USD",
      projectId: full.project?.projectId ?? full.projectId ?? "",
      amount: full.amount ?? full.total ?? 0,
      tax: full.tax ?? 0,
      discount: full.discount ?? 0,
      notes: full.notes ?? "",
    });
    setShowEditModal(true);
    setMenuOpenFor(null);
    setMenuPos(null);
  };

  const handleEditSave = async () => {
    if (!editForm) return;
    setEditing(true);
    try {
      const paths: string[] = [];
      if (editForm.id)
        paths.push(
          `${API_BASE}/api/invoices/${encodeURIComponent(String(editForm.id))}`,
        );
      if (editForm.invoiceNumber)
        paths.push(
          `${API_BASE}/api/invoices/${encodeURIComponent(String(editForm.invoiceNumber))}`,
        );
      let success = false;
      for (const p of paths) {
        try {
          console.log("pathhhhh", p);
          const res = await fetch(p, {
            method: "PUT",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              invoiceNumber: editForm.invoiceNumber,
              invoiceDate: editForm.invoiceDate,
              currency: editForm.currency,
              projectId: editForm.projectId,
              amount: Number(editForm.amount || 0),
              tax: Number(editForm.tax || 0),
              discount: Number(editForm.discount || 0),
              notes: editForm.notes || undefined,
            }),
          });
          if (!res.ok) continue;
          success = true;
          break;
        } catch {}
      }
      if (!success) throw new Error("Edit/save failed (no supported endpoint)");
      if (invoicesProp && typeof onInvoiceCreated === "function")
        onInvoiceCreated(null as any);
      else await fetchInvoices(clientId);
      setShowEditModal(false);
    } catch (err: any) {
      alert(err?.message ?? "Save failed");
    } finally {
      setEditing(false);
      setMenuOpenFor(null);
      setMenuPos(null);
    }
  };

  const openCreditModal = (inv: any) => {
    setActiveInvoice(inv);
    setShowCreditModal(true);
    setMenuOpenFor(null);
    setMenuPos(null);
  };

  {
    /* VIEW CREDIT NOTE MODAL */
  }
  {
    showViewCreditModal && activeCredit && (
      <ViewCreditNoteModal
        open={showViewCreditModal}
        credit={activeCredit}
        onClose={() => {
          setShowViewCreditModal(false);
          setActiveCredit(null);
        }}
      />
    );
  }

  const handleMarkPaid = async (inv: any) => {
    if (!inv) return;
    if (!confirm("Mark this invoice as paid?")) return;
    let success = false;
    for (const p of invoicePaths(inv)) {
      try {
        const res = await fetch(`${p}/mark-paid`, {
          method: "PATCH",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          success = true;
          break;
        }
      } catch {}
    }
    if (!success) return alert("Mark paid failed (endpoint not supported?)");
    if (invoicesProp && typeof onInvoiceCreated === "function")
      onInvoiceCreated(null as any);
    else await fetchInvoices(clientId);
    setMenuOpenFor(null);
    setMenuPos(null);
  };

  const handleDelete = async (inv: any) => {
    if (!inv) return;
    if (!confirm("Delete this invoice?")) return;
    let success = false;
    for (const p of invoicePaths(inv)) {
      try {
        const res = await fetch(p, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          success = true;
          break;
        }
      } catch {}
    }
    if (!success) return alert("Delete failed (endpoint missing?)");
    if (invoicesProp && typeof onInvoiceCreated === "function")
      onInvoiceCreated(null as any);
    else await fetchInvoices(clientId);
    setMenuOpenFor(null);
    setMenuPos(null);
  };

  const handleDuplicate = (inv: any) => {
    setCreateForm({
      invoiceNumber: "",
      invoiceDate: inv?.invoiceDate ?? "",
      currency: inv?.currency ?? "USD",
      projectId: inv?.project?.projectId ?? "",
      clientId: inv?.client?.clientId ?? (clientId ? String(clientId) : ""),
      amount: inv?.amount ?? inv?.total ?? 0,
      taxPercent: inv?.tax ?? 0,
      discountValue: inv?.discount ?? 0,
      discountIsPercent: true,
      notes: inv?.notes ?? "",
    });
    setShowCreateModal(true);
    setMenuOpenFor(null);
    setMenuPos(null);
  };

  // 🔥 REPLACED: prompt-based payment → modal-based payment
  const openAddPayment = (inv: any) => {
  setPaymentInvoice(inv);
  setShowClientPaymentModal(true);

  // close kebab menu
  setMenuOpenFor(null);
  setMenuPos(null);
};

console.log(paymentInvoice)

const openViewPaymentsDrawer = (inv: any) => {
  const invoiceNo = inv?.invoiceNumber ?? inv?.id ?? null;
  if (!invoiceNo) {
    alert("Invoice number not found");
    return; 
  }

  setPaymentsInvoiceNo(String(invoiceNo));
  setShowPaymentsDrawer(true);

  setMenuOpenFor(null);
  setMenuPos(null);
};



  const sendPaymentReminder = async (inv: any) => {
    if (!inv) return;
    if (!confirm("Send payment reminder?")) return;
    try {
      const p = invoicePaths(inv)[0];
      if (!p) throw new Error("Cannot determine invoice endpoint for reminder");
      const res = await fetch(`${p}/actions/send-reminder-email`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Reminder send failed");
      alert("Reminder sent");
    } catch (err: any) {
      alert(err?.message ?? "Send reminder failed");
    } finally {
      setMenuOpenFor(null);
      setMenuPos(null);
    }
  };

  const addReceipt = (inv: any) => {
    uploadTargetRef.current = inv;
    // map invoice -> receipt form defaults where possible
    setReceiptForm((p: any) => ({
      ...p,
      invoiceNumber: inv?.invoiceNumber ?? p.invoiceNumber,
      issueDate: p.issueDate,
      currency: inv?.currency ?? p.currency,
      sellerCompanyName: p.sellerCompanyName,
      sellerCompanyAddress: p.sellerCompanyAddress,
      productName: inv?.project?.projectName ?? p.productName,
      priceWithOutTax: inv?.amount ?? inv?.total ?? p.priceWithOutTax,
      tax: inv?.tax ?? p.tax,
      quantity: p.quantity,
      description: inv?.notes ?? p.description,
      buyerCleintName: inv?.client?.name ?? p.buyerCleintName,
      buyerCompanyEmail: inv?.client?.email ?? p.buyerCompanyEmail,
      buyerCompanyPhoneNumber: inv?.client?.mobile ?? p.buyerCompanyPhoneNumber,
    }));
    setShowReceiptModal(true);
    setMenuOpenFor(null);
    setMenuPos(null);
  };

  const viewReceipts = async (inv: any) => {
    setReceiptsError(null);
    setReceiptsList([]);
    setReceiptsLoading(true);
    try {
      const id = inv?.id ?? inv?.invoiceId ?? inv?.invoiceNumber ?? null;
      if (!id) throw new Error("Invoice id not available");
      const url = `${API_BASE}/api/invoice/receipt/${inv.invoiceNumber}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Receipts fetch failed ${res.status} ${txt}`);
      }
      const parsed = await tryParseResponse(res);
      let arr: any[] = [];
      if (Array.isArray(parsed.parsed)) arr = parsed.parsed;
      else if (Array.isArray(parsed.parsed?.data)) arr = parsed.parsed.data;
      else if (Array.isArray(parsed.raw)) arr = parsed.raw;
      else if (typeof parsed.raw === "string") {
        try {
          const maybe = JSON.parse(parsed.raw);
          if (Array.isArray(maybe)) arr = maybe;
        } catch {}
      }
      setReceiptsList(arr);
      setSelectedInvoiceForReceipts(inv);
      setShowReceiptsModal(true);
    } catch (err: any) {
      setReceiptsError(err?.message ?? "Failed to fetch receipts");
      alert(err?.message ?? "Failed to fetch receipts");
    } finally {
      setReceiptsLoading(false);
      setMenuOpenFor(null);
      setMenuPos(null);
    }
  };


  const openViewCreditModal = async (inv: any) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/invoices/${inv.invoiceNumber}/credit-notes`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (!res.ok) {
        alert("Failed to load credit notes");
        return;
      }

      const credits = await res.json();

      if (!credits || credits.length === 0) {
        alert("No credit notes found");
        return;
      }

      // latest credit
      setActiveCredit(credits[0]);
      setShowViewCreditModal(true);
    } catch (err) {
      alert("Error loading credit note");
    }
  };

  const creditDuplicate = (inv: any) => {
    const amt = prompt(
      "Credit amount for duplicate:",
      String(inv.unpaidAmount ?? inv.total ?? 0),
    );
    if (!amt) return;
    const amount = Number(amt);
    if (isNaN(amount) || amount <= 0) return alert("Invalid amount");
    (async () => {
      try {
        const p = invoicePaths(inv)[0];
        if (!p) throw new Error("Cannot determine credit endpoint");
        const res = await fetch(`${p}/credit-note`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ amount }),
        });
        if (!res.ok) throw new Error("Credit duplicate failed");
        if (invoicesProp && typeof onInvoiceCreated === "function")
          onInvoiceCreated(null as any);
        else await fetchInvoices(clientId);
        alert("Credit created");
      } catch (err: any) {
        alert(err?.message ?? "Credit failed");
      } finally {
        setMenuOpenFor(null);
        setMenuPos(null);
      }
    })();
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return invoices;
    return invoices.filter((inv) => {
      if (!inv) return false;
      return (
        String(inv.invoiceNumber ?? "")
          .toLowerCase()
          .includes(s) ||
        String(inv.project?.projectName ?? inv.project?.projectCode ?? "")
          .toLowerCase()
          .includes(s) ||
        String(inv.client?.name ?? "")
          .toLowerCase()
          .includes(s)
      );
    });
  }, [invoices, search]);

  // const renderMenuFor = (inv: any) => {
  const renderMenuFor = (inv: any) => {
    const state = getInvoiceState(inv);
    // if (isCreditInvoice(inv)) {
    if (state === "CREDIT") {
      return (
        <>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => openViewFromMenu(inv)}
            >
              <Eye className="inline mr-2 -mt-1" /> View
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => openAddPayment(inv)}
            >
              <PlusCircle className="inline mr-2 -mt-1" /> Add Payment
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
onClick={() => openViewPaymentsDrawer(inv)}
            >
              <CircleDollarSign className="inline mr-2 -mt-1" /> View Payment(s)
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              //  onClick={() => creditDuplicate(inv)}

              onClick={() => {
                setActiveInvoice(inv);
                setShowDuplicateModal(true);
              }}
            >
              <Copy className="inline mr-2 -mt-1" /> Credit Duplicate
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
              onClick={() => handleDelete(inv)}
            >
              <Trash className="inline mr-2 -mt-1" /> Delete
            </button>
          </li>
        </>
      );
    }
    // if (isPaidInvoice(inv)) {
    if (state === "PAID") {
      return (
        <>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => openViewFromMenu(inv)}
              // onClick={() => openViewCreditModal(inv)}
            >
              <Eye className="inline mr-2 -mt-1" /> View
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => addReceipt(inv)}
            >
              <PlusCircle className="inline mr-2 -mt-1" /> Add Receipt
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => viewReceipts(inv)}
            >
              <FileText className="inline mr-2 -mt-1" /> View Receipt(s)
            </button>
          </li>
          {/* CHANGED: opens modal UI instead of clicking hidden input directly */}
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => openUploadModalFor(inv)}
            >
              <Upload className="inline mr-2 -mt-1" /> Upload File
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              // onClick={() => openViewPayments(inv)}
              onClick={() => openViewPaymentsDrawer(inv)}

            >
              <CircleDollarSign className="inline mr-2 -mt-1" /> View Payment(s)
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => openCreditModal(inv)}
            >
              <FileText className="inline mr-2 -mt-1" /> Add Credit Note
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => openViewCreditModal(inv)}
              // onClick={() => openViewCreditModal(inv)}
            >
              <FileText className="inline mr-2 -mt-1" /> View Credit(s) Note
            </button>
          </li>
          {/* <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => {
                setActiveInvoice(inv);
                setShowDuplicateModal(true);
              }}
            >
              <FileText className="inline mr-2 -mt-1" /> Create Duplicate in paid
            </button>
          </li> */}

          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
              onClick={() => handleDelete(inv)}
            >
              <Trash className="inline mr-2 -mt-1" /> Delete
            </button>
          </li>
        </>
      );
    }
    // if (isUnpaidInvoice(inv)) {
    if (state === "UNPAID" || state === "PARTIAL") {
      return (
        <>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => openViewFromMenu(inv)}
            >
              <Eye className="inline mr-2 -mt-1" /> View
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => openEditModal(inv)}
            >
              <Edit2 className="inline mr-2 -mt-1" /> Edit
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => handleMarkPaid(inv)}
            >
              <CheckCircle className="inline mr-2 -mt-1" /> Mark as Paid
            </button>
          </li>
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => openAddPayment(inv)}
            >
              <PlusCircle className="inline mr-2 -mt-1" /> Add Payment 
            </button>
          </li>

 <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              // onClick={() => openViewPayments(inv)}
              onClick={() => openViewPaymentsDrawer(inv)}

            >
              <CircleDollarSign className="inline mr-2 -mt-1" /> View Payment(s)
            </button>
          </li>

          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => sendPaymentReminder(inv)}
            >
              <Bell className="inline mr-2 -mt-1" /> Payment Reminder
            </button>
          </li>
         
          {/* <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
              onClick={() => handleDuplicate(inv)}
            >
              <Copy className="inline mr-2 -mt-1" /> Create Duplicate in unpaid
            </button>
          </li> */}
          <li>
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
              onClick={() => handleDelete(inv)}
            >
              <Trash className="inline mr-2 -mt-1" /> Delete
            </button>
          </li>
        </>
      );
    }
    return (
      <>
        <li>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
            onClick={() => openViewFromMenu(inv)}
          >
            <Eye className="inline mr-2 -mt-1" /> View
          </button>
        </li>
        <li>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
            onClick={() => openEditModal(inv)}
          >
            <Edit2 className="inline mr-2 -mt-1" /> Edit
          </button>
        </li>
        <li>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
            onClick={() => handleDuplicate(inv)}
          >
            <Copy className="inline mr-2 -mt-1" /> Duplicate
          </button>
        </li>
        <li>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
            onClick={() => handleDelete(inv)}
          >
            <Trash className="inline mr-2 -mt-1" /> Delete
          </button>
        </li>
      </>
    );
  };

  const subtotal = Number(createForm.amount || 0);
  const discountAmount = createForm.discountIsPercent
    ? subtotal * (Number(createForm.discountValue || 0) / 100)
    : Number(createForm.discountValue || 0);
  const taxAmount =
    (subtotal - discountAmount) * (Number(createForm.taxPercent || 0) / 100);
  const total = Math.max(0, subtotal - discountAmount + taxAmount);


  const firstFileUrl = (inv: any) => {
    if (!inv) return null;

    const extractUrl = (f: any) => {
      if (!f) return null;
      if (typeof f === "string") return f;
      return f.url ?? f.fileUrl ?? f.path ?? f.downloadUrl ?? null;
    };

    // NEW: take the *latest* (last) item in each array

    if (Array.isArray(inv.fileUrls) && inv.fileUrls.length > 0) {
      const latest = inv.fileUrls[inv.fileUrls.length - 1];
      return extractUrl(latest);
    }

    if (Array.isArray(inv.files) && inv.files.length > 0) {
      const latest = inv.files[inv.files.length - 1];
      return extractUrl(latest);
    }

    if (Array.isArray(inv.attachments) && inv.attachments.length > 0) {
      const latest = inv.attachments[inv.attachments.length - 1];
      return extractUrl(latest);
    }

    if (Array.isArray(inv.filesList) && inv.filesList.length > 0) {
      const latest = inv.filesList[inv.filesList.length - 1];
      return extractUrl(latest);
    }

    return extractUrl(inv.fileUrl ?? inv.downloadUrl ?? null);
  };

  // handle saving receipt (unchanged logic)
  const handleSaveReceipt = async () => {
    setSavingReceipt(true);
    try {
      const body = {
        invoiceId:
          receiptForm.invoiceNumber ||
          (uploadTargetRef.current?.invoiceNumber ?? undefined),
        issueDate: receiptForm.issueDate || undefined,
        currency: receiptForm.currency || undefined,
        sellerCompanyName: receiptForm.sellerCompanyName,
        sellerCompanyAddress: receiptForm.sellerCompanyAddress,
        sellerCompanyCode: receiptForm.sellerCompanyCode,
        sellerCompanyTaxNumber: receiptForm.sellerCompanyTaxNumber,
        sellerCompanyEmail: receiptForm.sellerCompanyEmail,
        sellerCompanyPhoneNumber: receiptForm.sellerCompanyPhoneNumber,
        sellerCompanyBankName: receiptForm.sellerCompanyBankName,
        sellerCompanyBankAccountNumber:
          receiptForm.sellerCompanyBankAccountNumber,
        buyerCompanyName: receiptForm.buyerCompanyName,
        buyerCompanyAddress: receiptForm.buyerCompanyAddress,
        buyerCompanyCode: receiptForm.buyerCompanyCode,
        buyerCompanyTaxNumber: receiptForm.buyerCompanyTaxNumber,
        buyerCleintName: receiptForm.buyerCleintName,
        buyerCompanyEmail: receiptForm.buyerCompanyEmail,
        buyerCompanyPhoneNumber: receiptForm.buyerCompanyPhoneNumber,
        buyerCompanyBankName: receiptForm.buyerCompanyBankName,
        buyerCompanyBankAccountNumber:
          receiptForm.buyerCompanyBankAccountNumber,
        productName: receiptForm.productName,
        tax: Number(receiptForm.tax || 0),
        priceWithOutTax: Number(receiptForm.priceWithOutTax || 0),
        quantity: Number(receiptForm.quantity || 1),
        description: receiptForm.description,
      };

      const res = await fetch(`${API_BASE}/api/invoice`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Save failed: ${res.status} ${t}`);
      }

      const parsed = await tryParseResponse(res);
      let created: any = parsed.parsed ?? null;
      if (!created && typeof parsed.raw === "string") {
        try {
          created = JSON.parse(parsed.raw);
        } catch {
          created = null;
        }
      }

      if (invoicesProp && typeof onInvoiceCreated === "function")
        onInvoiceCreated(null as any);
      else await fetchInvoices(clientId);

      const targetInv = uploadTargetRef.current;
      const sameInvoice = (invA: any, invB: any) => {
        if (!invA || !invB) return false;
        const aId = invA.id ?? invA.invoiceId ?? invA.invoiceNumber ?? null;
        const bId = invB.id ?? invB.invoiceId ?? invB.invoiceNumber ?? null;
        return aId != null && bId != null && String(aId) === String(bId);
      };

      if (created) {
        if (
          showReceiptsModal &&
          selectedInvoiceForReceipts &&
          sameInvoice(
            selectedInvoiceForReceipts,
            uploadTargetRef.current ?? created,
          )
        ) {
          setReceiptsList((prev) => [created, ...prev]);
        } else if (targetInv) {
          setSelectedInvoiceForReceipts(targetInv);
          setReceiptsList((prev) => [created, ...prev]);
          setShowReceiptsModal(true);
        }
      }

      setShowReceiptModal(false);
      alert("Receipt created");
    } catch (err: any) {
      alert(err?.message ?? "Save receipt failed");
    } finally {
      uploadTargetRef.current = null;
      setSavingReceipt(false);
      setMenuOpenFor(null);
      setMenuPos(null);
    }
  };

  // delete receipt (unchanged)
  const handleDeleteReceipt = async (r: any) => {
    if (!r) return;
    if (!confirm("Delete this receipt?")) return;
    try {
      const id = r.id ?? r.invoiceId ?? null;
      if (!id) throw new Error("Receipt id not available for delete");
      const url = `${API_BASE}/api/invoice/${encodeURIComponent(String(id))}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Delete failed ${res.status} ${txt}`);
      }
      setReceiptsList((prev) =>
        prev.filter((x) => {
          const a = x.id ?? x.invoiceId ?? x.invoiceNumber ?? null;
          return String(a) !== String(id);
        }),
      );
      setReceiptMenuOpenFor(null);
      setReceiptMenuPos(null);
      alert("Receipt deleted");
    } catch (err: any) {
      alert(err?.message ?? "Delete failed");
    }
  };

  const receiptDownloadUrl = (r: any) =>
    r._downloadUrl ?? r.downloadUrl ?? r.fileUrl ?? null;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Client Invoices</CardTitle>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setShowCreateModal(true);
              setCreateForm((p: any) => ({
                ...p,
                clientId: String(clientId ?? p.clientId ?? ""),
              }));
            }}
            className="flex items-center"
          >
            <Plus className=" h-3 w-3" /> Create Invoice
          </Button>
          <Button 
          className="px-2 py-2 border rounded"
            variant="ghost"
            onClick={async () => {
              if (invoicesProp && typeof onInvoiceCreated === "function")
                onInvoiceCreated(null);
              else await fetchInvoices(clientId);
              if (showReceiptsModal && selectedInvoiceForReceipts) {
                await viewReceipts(selectedInvoiceForReceipts);
              }
            }}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-1 flex items-center justify-between overflow-hidden">
          <div>
            {/* <input
              placeholder="Search invoice number / project / client"
              className="w-60  px-2 py-2 border rounded"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            /> */}



{loading ? (
  <Skeleton height={35} width={250} />
) : (
  <input
    placeholder="Search invoice number / project / client"
    className="w-60 px-2 py-2 border rounded"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
)}




          </div>
          <div className="text-sm text-gray-500">
            {/* {loading ? "Loading..." : `${invoices.length} invoices`} */}

{loading ? <Skeleton width={100} /> : `${invoices.length} invoices`}

          </div>
        </div>

<div className="overflow-auto p-4 relative">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-left text-xs">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Unpaid</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    Loading invoices...
                  </td>
                </tr>
              ) */}




{loading ? (
  [...Array(5)].map((_, i) => (
    <tr key={i} className="border-t">
      <td className="px-4 py-3">
        <Skeleton width={80} />
      </td>
      <td className="px-4 py-3">
        <Skeleton width={100} />
      </td>
      <td className="px-4 py-3">
        <Skeleton width={120} />
      </td>
      <td className="px-4 py-3">
        <Skeleton width={60} />
      </td>
      <td className="px-4 py-3">
        <Skeleton width={90} />
      </td>
      <td className="px-4 py-3">
        <Skeleton width={90} />
      </td>
      <td className="px-4 py-3">
        <Skeleton width={80} height={20} />
      </td>
      <td className="px-4 py-3">
        <Skeleton circle width={30} height={30} />
      </td>
    </tr>
  ))
)

              
              
              : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-red-600">
                    {error}
                    {rawResponse && (
                      <div className="mt-2 text-xs text-gray-600">
                        <pre className="whitespace-pre-wrap">{rawResponse}</pre>
                      </div>
                    )}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const key = inv.id ?? inv.invoiceNumber ?? Math.random();
                  return (
                    <tr key={key} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">{inv.invoiceNumber ?? "—"}</td>
                      <td className="px-4 py-3">
                        {inv.invoiceDate
                          ?
                          //  new Date(inv.invoiceDate).toLocaleDateString()
                           format(new Date(inv.invoiceDate), "dd-MM-yyyy")

                          
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {inv.project?.projectName ??
                          inv.project?.projectCode ??
                          "—"}
                      </td>
                      <td className="px-4 py-3">{inv.currency ?? "—"}</td>
                      <td className="px-4 py-3">
                        {typeof inv.total === "number"
                          ? inv.total.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })
                          : inv.total
                            ? String(inv.total)
                            : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {typeof inv.unpaidAmount === "number"
                          ? inv.unpaidAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })
                          : inv.unpaidAmount
                            ? String(inv.unpaidAmount)
                            : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{inv.status ?? "—"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 relative">
                          <button
                            className="invoice-action-button inline-flex items-center px-2 py-1 border rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              const btn = e.currentTarget as HTMLElement;
                              if (
                                menuOpenFor &&
                                (menuOpenFor.id ??
                                  menuOpenFor.invoiceNumber) ===
                                  (inv.id ?? inv.invoiceNumber)
                              ) {
                                setMenuOpenFor(null);
                                setMenuPos(null);
                              } else {
                                openMenuFor(inv, btn);
                              }
                            }}
                            title="Actions"
                            aria-expanded={
                              menuOpenFor &&
                              (menuOpenFor.id ?? menuOpenFor.invoiceNumber) ===
                                (inv.id ?? inv.invoiceNumber)
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

    


{menuOpenFor && menuPos &&
  createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: `${menuPos.left}px`,
        top: `${menuPos.top}px`,
        width: 260,

        // 🔥 MAIN FIX
        maxHeight: "calc(100vh - 24px)", // viewport safe
        overflowY: "auto",

        zIndex: 99999,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
      className="bg-white border rounded"
      onClick={(e) => e.stopPropagation()}
    >
      {/* <ul className="divide-y">{renderMenuFor(menuOpenFor)}</ul> */}


<ul className="max-h-full overflow-y-auto">
  {renderMenuFor(menuOpenFor)}
</ul>



    </div>,
    document.body
  )
}




      {/* hidden file input used by modal choose */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={onFileInputChange}
      />

      {/* VIEW modal */}
      {showViewModal && activeInvoice && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-6">
  // <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

  <div className="fixed inset-0 z-50 flex justify-end">


          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowViewModal(false);
              setActiveInvoice(null);
            }}
          />
          {/* <div className="relative z-10 w-full max-w-4xl bg-white rounded shadow-lg overflow-auto"> */}
              {/* <div className="relative z-10 w-full max-w-4xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]"> */}
<div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="text-lg font-semibold">Invoice Details</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowViewModal(false);
                    setActiveInvoice(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* client, project, invoice details and files (same as before) */}
              <div className="border rounded-lg p-4">
                <div className="text-sm font-semibold mb-2">Client Details</div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <div className="w-28 text-gray-500">Name</div>
                    <div className="font-medium">
                      {activeInvoice.client?.name ?? "—"}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-28 text-gray-500">Email</div>
                    <div className="font-medium">
                      {activeInvoice.client?.email ??
                        activeInvoice.client?.contactEmail ??
                        "—"}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-28 text-gray-500">Company Name</div>
                    <div className="font-medium">
                      {activeInvoice.client?.company?.companyName ??
                        activeInvoice.client?.companyName ??
                        "—"}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-28 text-gray-500">Mobile</div>
                    <div className="font-medium">
                      {activeInvoice.client?.mobile ??
                        activeInvoice.client?.phone ??
                        "—"}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-28 text-gray-500">Address</div>
                    <div className="font-medium">
                      {activeInvoice.client?.address ??
                        activeInvoice.client?.street ??
                        "—"}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-28 text-gray-500">Country</div>
                    <div className="font-medium">
                      {activeInvoice.client?.country ?? "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-sm font-semibold mb-2">
                  Project Details
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <div className="w-32 text-gray-500">Project Name</div>
                    <div className="font-medium">
                      {activeInvoice.project?.projectName ??
                        activeInvoice.project?.name ??
                        "—"}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-32 text-gray-500">Project Code</div>
                    <div className="font-medium">
                      {activeInvoice.project?.projectCode ??
                        activeInvoice.project?.code ??
                        "—"}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-32 text-gray-500">Start Date</div>
                    <div className="font-medium">
                      {/* {activeInvoice.project?.startDate
                        ? new Date(
                            activeInvoice.project.startDate,
                          ).toLocaleDateString()
                        : activeInvoice.startDate
                          ? new Date(
                              activeInvoice.startDate,
                            ).toLocaleDateString()
                          : "—"} */}



{activeInvoice?.project?.startDate
  ? format(new Date(activeInvoice.project.startDate), "dd-MM-yyyy")
  : activeInvoice?.startDate
  ? format(new Date(activeInvoice.startDate), "dd-MM-yyyy")
  : "—"}


                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-32 text-gray-500">End Date</div>
                    <div className="font-medium">
                      {/* {activeInvoice.project?.endDate
                        ? new Date(
                            activeInvoice.project.endDate,
                          ).toLocaleDateString()
                        : activeInvoice.endDate
                          ? new Date(activeInvoice.endDate).toLocaleDateString()
                          : "—"} */}

{activeInvoice?.project?.endDate
  ? format(new Date(activeInvoice.project.endDate), "dd-MM-yyyy")
  : activeInvoice?.endDate
  ? format(new Date(activeInvoice.endDate), "dd-MM-yyyy")
  : "—"}


                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="text-sm font-semibold mb-3">
                  Invoice Details 
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="text-gray-500">Invoice No.</div>
                      <div className="font-medium">
                        {activeInvoice.invoiceNumber ?? activeInvoice.id ?? "—"}
                      </div>
                    </div>

                    <div className="flex justify-between mb-2">
                      <div className="text-gray-500">Invoice Date</div>
                      <div className="font-medium">
                        {/* {activeInvoice.invoiceDate
                          ? new Date(
                              activeInvoice.invoiceDate,
                            ).toLocaleDateString()
                          : "—"} */}


                          {activeInvoice?.invoiceDate
  ? format(new Date(activeInvoice.invoiceDate), "dd-MM-yyyy")
  : "—"}

                      </div>
                    </div>

                    <div className="flex justify-between mb-2">
                      <div className="text-gray-500">Currency</div>
                      <div className="font-medium">
                        {activeInvoice.currency ?? "—"}
                      </div>
                    </div>

                    <div className="flex justify-between mb-2">
                      <div className="text-gray-500">Amount</div>
                      <div className="font-medium">
                        {typeof activeInvoice.amount === "number"
                          ? (activeInvoice.currency
                              ? `${activeInvoice.currency} `
                              : "") +
                            Number(activeInvoice.amount).toLocaleString()
                          : (activeInvoice.total ?? "—")}
                      </div>
                    </div>

                    <div className="flex justify-between mb-2">
                      <div className="text-gray-500">Tax</div>
                      <div className="font-medium">
                        {(activeInvoice.tax ?? activeInvoice.taxPercent)
                          ? `${activeInvoice.tax ?? activeInvoice.taxPercent}%`
                          : "—"}
                      </div>
                    </div>

                    <div className="flex justify-between mb-2">
                      <div className="text-gray-500">Subtotal</div>
                      <div className="font-medium">
                        {typeof activeInvoice.subtotal === "number"
                          ? activeInvoice.subtotal
                          : activeInvoice.amount
                            ? Number(activeInvoice.amount).toLocaleString()
                            : "—"}
                      </div>
                    </div>

                    <div className="flex justify-between mb-2">
                      <div className="text-gray-500">Discount</div>
                      <div className="font-medium">
                        {activeInvoice.discount ?? "0.00"}
                      </div>
                    </div>

                    <div className="flex justify-between mb-2">
                      <div className="text-gray-500">Total Amount</div>
                      <div className="font-medium">
                        {typeof activeInvoice.total === "number"
                          ? activeInvoice.total
                          : activeInvoice.amount
                            ? Number(activeInvoice.amount).toLocaleString()
                            : "—"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-gray-500">Status</div>
                      <div>
                        {activeInvoice.status ? (
                          <Badge>{activeInvoice.status}</Badge>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-2">Files</div>
                    <div className="w-full h-40 bg-gray-50 rounded overflow-hidden border relative flex items-center justify-center">
                      {firstFileUrl(activeInvoice) ? (
                        <>
                          <img
                            src={firstFileUrl(activeInvoice) as string}
                            alt="file"
                            className="object-cover w-full h-full"
                          />
                          <a
                            href={firstFileUrl(activeInvoice) as string}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-2 right-2 bg-white rounded p-1 shadow"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">
                          No files attached
                        </div>
                      )}
                    </div>
                    {((activeInvoice.files && activeInvoice.files.length > 0) ||
                      (activeInvoice.attachments &&
                        activeInvoice.attachments.length > 0) ||
                      (activeInvoice.filesList &&
                        activeInvoice.filesList.length > 0) ||
                      (activeInvoice.fileUrls &&
                        activeInvoice.fileUrls.length > 0)) && (
                      <div className="mt-3 space-y-2 text-sm">
                        {(() => {
                          const arr: { url: string | null; name?: string }[] =
                            [];

                          const pushFrom = (f: any) => {
                            if (!f) return;

                            if (typeof f === "string") {
                              arr.push({
                                url: f,
                                name: f.split("/").pop(),
                              });
                              return;
                            }

                            const url =
                              f.url ??
                              f.fileUrl ??
                              f.path ??
                              f.downloadUrl ??
                              null;
                            const name =
                              f.name ??
                              f.filename ??
                              f.fileName ??
                              (typeof url === "string"
                                ? url.split("/").pop()
                                : undefined);

                            arr.push({ url, name });
                          };

                          (activeInvoice.files ?? []).forEach(pushFrom);
                          (activeInvoice.attachments ?? []).forEach(pushFrom);
                          (activeInvoice.filesList ?? []).forEach(pushFrom);
                          (activeInvoice.fileUrls ?? []).forEach(pushFrom);

                          // 🔥 Sort newest first (last pushed = newest = first displayed)
                          const latestFirst = arr.reverse();

                          return latestFirst.map((f, idx) => {
                            if (!f.url) return null;
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2"
                              >
                                <div className="text-gray-700 truncate">
                                  {f.name ?? `File ${idx + 1}`}
                                </div>
                                <a
                                  href={f.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center px-2 py-1 border rounded text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" /> Download
                                </a>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-500">Notes</div>
                  <div className="mt-2 text-sm text-gray-800">
                    {activeInvoice.notes ?? "No notes"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceiptsModal && selectedInvoiceForReceipts && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-6">
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowReceiptsModal(false);
              setSelectedInvoiceForReceipts(null);
              setReceiptsList([]);
            }}
          />

          {/* <div className="relative z-10 w-full max-w-4xl bg-white rounded shadow-lg overflow-auto"> */}
          <div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Receipts  </h3>
              <div className="flex items-center gap-3">
                <Button onClick={() => addReceipt(selectedInvoiceForReceipts)}>
                  <Plus className="mr-2 h-4 w-4" /> Add a Receipt
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowReceiptsModal(false);
                    setSelectedInvoiceForReceipts(null);
                    setReceiptsList([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              {receiptsLoading ? (
                <div className="text-center py-8">Loading receipts...</div>
              ) : receiptsList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No receipts found
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 text-left text-xs">
                      <th className="px-4 py-3">Invoice No.</th>
                      <th className="px-4 py-3">Project</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Issue Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {receiptsList.map((r: any) => {
                      const amount =
                        r.totalAmount ??
                        r.totalExcluidingTax ??
                        r.subtotal ??
                        r.priceWithOutTax ??
                        0;

                      return (
                        <tr key={r.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">{r.invoiceId}</td>
                          <td className="px-4 py-3">{r.productName}</td>
                          <td className="px-4 py-3">{r.buyerCleintName}</td>
                          <td className="px-4 py-3">
                            {r.currency} {amount}
                          </td>
                          <td className="px-4 py-3">
                            {/* {new Date(r.issueDate).toLocaleDateString()} */}
{r?.issueDate
  ? format(new Date(r.issueDate), "dd-MM-yyyy")
  : "—"}


                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setViewReceipt(r)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => downloadReceiptPDF(r)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => deleteReceipt(r)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {viewReceipt && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setViewReceipt(null)}
          />

          {/* <div className="relative z-10 w-full max-w-4xl bg-white rounded shadow-lg p-6 text-sm"> */}
          <div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto p-6 text-sm">
            <h2 className="text-lg font-semibold mb-2">Proforma Invoice</h2>
            <p>Invoice No.: {viewReceipt.invoiceId}</p>
            {/* <p>Issue Date: {new Date(viewReceipt.issueDate).toDateString()}</p> */}
            <p>
  Issue Date:{" "}
  {viewReceipt?.issueDate
    ? format(new Date(viewReceipt.issueDate), "dd-MM-yyyy")
    : "—"}
</p>


            <div className="grid grid-cols-2 gap-6 mt-4 border p-4">
              <div>
                <h3 className="font-semibold mb-1">Seller</h3>
                <p>{viewReceipt.sellerCompanyName}</p>
                <p>{viewReceipt.sellerCompanyAddress}</p>
                <p>Bank: {viewReceipt.sellerCompanyBankName}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Buyer</h3>
                <p>{viewReceipt.buyerCompanyName}</p>
                <p>{viewReceipt.buyerCompanyAddress}</p>
                <p>Client: {viewReceipt.buyerCleintName}</p>
              </div>
            </div>

            <div className="mt-4 text-right font-semibold">
              Total: {viewReceipt.currency} {viewReceipt.totalAmount}
            </div>

            <div className="mt-4 text-right">
              <Button variant="ghost" onClick={() => setViewReceipt(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE modal (unchanged) */}
      {showCreateModal && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-6">
          // <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
<div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCreateModal(false)}
          />
          {/* <div className="relative z-10 w-full max-w-3xl bg-white rounded shadow-lg overflow-auto"> */}
              {/* <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]"> */}
<div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="text-lg font-semibold">Create Invoice</h3>
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Close
              </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Invoice Details */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Invoice Details</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Invoice Number
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={createForm.invoiceNumber}
                      onChange={(e) =>
                        setCreateForm((p: any) => ({
                          ...p,
                          invoiceNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2"
                      value={createForm.invoiceDate}
                      onChange={(e) =>
                        setCreateForm((p: any) => ({
                          ...p,
                          invoiceDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Currency
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={createForm.currency}
                      onChange={(e) =>
                        setCreateForm((p: any) => ({
                          ...p,
                          currency: e.target.value,
                        }))
                      }
                    >
                      <option value="USD">USD $</option>
                      <option value="USD">USD ₹</option>
                      <option value="EUR">EUR €</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Project Details (dropdowns) */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Project Details</h4>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Project
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={createForm.projectId}
                      onChange={(e) =>
                        setCreateForm((p: any) => ({
                          ...p,
                          projectId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Project</option>
                      {projectsLoading ? (
                        <option>Loading...</option>
                      ) : (
                        projectsList.map((p: any) => {
                          const id = p.id ?? p.projectId ?? p._id ?? p.id;
                          const name =
                            p.projectName ??
                            p.name ??
                            p.title ??
                            p.shortCode ??
                            String(id);
                          return (
                            <option key={String(id)} value={String(id)}>
                              {name}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Client
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={createForm.clientId}
                      onChange={(e) =>
                        setCreateForm((p: any) => ({
                          ...p,
                          clientId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Client</option>
                      {clientsLoading ? (
                        <option>Loading...</option>
                      ) : (
                        clientsList.map((c: any) => {
                          const id =
                            c.clientId ?? c.id ?? c.client_id ?? c.clientId;
                          const name =
                            c.name ?? c.company?.companyName ?? String(id);
                          return (
                            <option key={String(id)} value={String(id)}>
                              {name}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Project Budget
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-2 bg-gray-100 rounded"> $ </span>
                      <input
                        className="w-full border rounded px-3 py-2"
                        value={""}
                        disabled
                        placeholder="$ 30,000"
                      />
                    </div>
                  </div>
                </div>

                {/* amount row */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 block mb-1">
                      Amount
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-2 bg-gray-100 rounded">
                        {createForm.currency === "USD" ? "₹" : "$"}
                      </span>
                      <input
                        type="number"
                        className="w-full border rounded px-3 py-2"
                        value={createForm.amount}
                        onChange={(e) =>
                          setCreateForm((p: any) => ({
                            ...p,
                            amount: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="w-36">
                    <label className="text-sm text-gray-600 block mb-1">
                      Tax %
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={createForm.taxPercent}
                      onChange={(e) =>
                        setCreateForm((p: any) => ({
                          ...p,
                          taxPercent: Number(e.target.value),
                        }))
                      }
                    />
                  </div>

                  <div className="w-36">
                    <label className="text-sm text-gray-600 block mb-1 text-right">
                      Amount
                    </label>
                    <div className="bg-gray-100 rounded px-3 py-2 text-right font-medium">
                      {total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* totals box */}
                <div className="mt-4 border-t pt-3">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div />
                    <div className="text-right text-xs text-gray-500">
                      Sub Total
                    </div>
                    <div className="text-right font-medium">
                      {subtotal.toFixed(2)}
                    </div>

                    <div />
                    <div className="text-right text-xs text-gray-500">
                      Discount
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        className="w-20 border rounded px-2 py-1"
                        value={createForm.discountValue}
                        onChange={(e) =>
                          setCreateForm((p: any) => ({
                            ...p,
                            discountValue: Number(e.target.value),
                          }))
                        }
                      />
                      <select
                        className="border rounded px-2 py-1"
                        value={
                          createForm.discountIsPercent ? "percent" : "fixed"
                        }
                        onChange={(e) =>
                          setCreateForm((p: any) => ({
                            ...p,
                            discountIsPercent: e.target.value === "percent",
                          }))
                        }
                      >
                        <option value="percent">%</option>
                        <option value="fixed">₹ / $</option>
                      </select>
                      <div className="w-20 text-right">
                        {discountAmount.toFixed(2)}
                      </div>
                    </div>

                    <div />
                    <div className="text-right text-xs text-gray-500">Tax</div>
                    <div className="text-right font-medium">
                      {taxAmount.toFixed(2)}
                    </div>

                    <div />
                    <div className="text-right text-xs text-gray-500 font-medium">
                      Total
                    </div>
                    <div className="text-right font-semibold">
                      {total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Amount in words
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Amount in words"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Note / Description for the recipient
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm((p: any) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? "Creating..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Receipt modal (unchanged UI & logic) */}
      {showReceiptModal && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-6">
          // <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 z-50 flex justify-end">

          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowReceiptModal(false);
              uploadTargetRef.current = null;
            }}
          />
          {/* <div className="relative z-10 w-full max-w-4xl bg-white rounded shadow-lg overflow-auto"> */}
              {/* <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]"> */}
<div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b shrink-0 ">
              <h3 className="text-lg font-semibold">Create Receipt</h3>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowReceiptModal(false);
                  uploadTargetRef.current = null;
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Invoice Details */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Invoice Details</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Invoice Number *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.invoiceNumber}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          invoiceNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Issue Date *
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.issueDate}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          issueDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Currency *
                    </label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.currency}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          currency: e.target.value,
                        }))
                      }
                    >
                      <option value="USD">USD $</option>
                      <option value="USD">USD ₹</option>
                      <option value="EUR">EUR €</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* seller, buyer, project details etc. (same as before) */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Seller Details</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Company Name *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.sellerCompanyName}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          sellerCompanyName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Email Id *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.sellerCompanyEmail}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          sellerCompanyEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Contact No. *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.sellerCompanyPhoneNumber}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          sellerCompanyPhoneNumber: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Company Code *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.sellerCompanyCode}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          sellerCompanyCode: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Tax No. *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.sellerCompanyTaxNumber}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          sellerCompanyTaxNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div />
                </div>

                <div className="mt-3">
                  <label className="text-sm text-gray-600 block mb-1">
                    Company Address *
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={receiptForm.sellerCompanyAddress}
                    onChange={(e) =>
                      setReceiptForm((p: any) => ({
                        ...p,
                        sellerCompanyAddress: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Bank Account No. *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.sellerCompanyBankAccountNumber}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          sellerCompanyBankAccountNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Name of the Bank *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.sellerCompanyBankName}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          sellerCompanyBankName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Buyer Details</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Client Name *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.buyerCleintName}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          buyerCleintName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Company Name *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.buyerCompanyName}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          buyerCompanyName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Email Id *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.buyerCompanyEmail}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          buyerCompanyEmail: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Contact No. *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.buyerCompanyPhoneNumber}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          buyerCompanyPhoneNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Company Code *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.buyerCompanyCode}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          buyerCompanyCode: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Tax No. *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.buyerCompanyTaxNumber}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          buyerCompanyTaxNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-sm text-gray-600 block mb-1">
                    Company Address *
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={receiptForm.buyerCompanyAddress}
                    onChange={(e) =>
                      setReceiptForm((p: any) => ({
                        ...p,
                        buyerCompanyAddress: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Bank Account No. *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.buyerCompanyBankAccountNumber}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          buyerCompanyBankAccountNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Name of the Bank *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.buyerCompanyBankName}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          buyerCompanyBankName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Project Details</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Product / Project *
                    </label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.productName}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          productName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={receiptForm.quantity}
                      onChange={(e) =>
                        setReceiptForm((p: any) => ({
                          ...p,
                          quantity: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Price Without Tax *
                    </label>
                    <div className="flex items-center">
                      <span className="px-2 py-2 bg-gray-100 rounded-l border">
                        {" "}
                        {receiptForm.currency === "USD" ? "₹" : "$"}{" "}
                      </span>
                      <input
                        type="number"
                        className="w-full border rounded-r px-3 py-2"
                        value={receiptForm.priceWithOutTax}
                        onChange={(e) =>
                          setReceiptForm((p: any) => ({
                            ...p,
                            priceWithOutTax: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Tax *
                    </label>
                    <div className="flex items-center">
                      <span className="px-2 py-2 bg-gray-100 rounded-l border">
                        {" "}
                        %{" "}
                      </span>
                      <input
                        type="number"
                        className="w-full border rounded-r px-3 py-2"
                        value={receiptForm.tax}
                        onChange={(e) =>
                          setReceiptForm((p: any) => ({
                            ...p,
                            tax: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-sm text-gray-600 block mb-1">
                    Note/ Description for the recipient *
                  </label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={receiptForm.description}
                    onChange={(e) =>
                      setReceiptForm((p: any) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowReceiptModal(false);
                    uploadTargetRef.current = null;
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveReceipt} disabled={savingReceipt}>
                  {savingReceipt ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT modal (unchanged) */}
      {showEditModal && editForm && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-6">
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowEditModal(false)}
          />
          {/* <div className="relative z-10 w-full max-w-2xl bg-white rounded shadow-lg overflow-auto"> */}
          <div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Edit Invoice</h3>
              <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                Close
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Invoice Number
                </label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={editForm.invoiceNumber}
                  onChange={(e) =>
                    setEditForm((p: any) => ({
                      ...p,
                      invoiceNumber: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={editForm.invoiceDate}
                    onChange={(e) =>
                      setEditForm((p: any) => ({
                        ...p,
                        invoiceDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Currency
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={editForm.currency}
                    onChange={(e) =>
                      setEditForm((p: any) => ({
                        ...p,
                        currency: e.target.value,
                      }))
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm((p: any) => ({
                      ...p,
                      amount: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSave} disabled={editing}>
                  {editing ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD modal (NEW) - matches screenshot style */}
      {showUploadModal && (
        // <div className="fixed inset-0 z-60 flex items-start justify-center overflow-auto p-6">
        <div className="fixed inset-0 z-60 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowUploadModal(false);
              uploadTargetRef.current = null;
              setUploadSelectedFile(null);
              setUploadError(null);
            }}
          />
          {/* <div className="relative z-10 w-full max-w-2xl bg-white rounded shadow-lg overflow-hidden"> */}
          <div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="text-base font-semibold ml-3">Upload File</h3>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowUploadModal(false);
                  uploadTargetRef.current = null;
                  setUploadSelectedFile(null);
                  setUploadError(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6">
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="w-full h-36 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer"
                onClick={onChooseFileClick}
              >
                <CloudUpload className="h-6 w-6 text-gray-400" />
                <div className="text-sm text-gray-600">Choose a file</div>
                <div className="text-xs text-gray-400">or drag & drop here</div>
                {uploadSelectedFile && (
                  <div className="mt-2 text-sm text-gray-700">
                    {uploadSelectedFile.name}
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="mt-3 text-sm text-red-600">{uploadError}</div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowUploadModal(false);
                    uploadTargetRef.current = null;
                    setUploadSelectedFile(null);
                    setUploadError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUploadSave} disabled={uploading}>
                  {uploading ? "Uploading..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreditModal && activeInvoice && (
        
        <CreditNoteModal
          open={showCreditModal}
          invoice={activeInvoice}
          onClose={() => {
            setShowCreditModal(false);
            setActiveInvoice(null);
          }}
          onCreated={async () => {
            await fetchInvoices(clientId); // refresh invoices / credits
          }}
        />
      )}

      {showViewCreditModal && activeCredit && (
        <ViewCreditNoteModal
          open={showViewCreditModal}
          credit={activeCredit}
          onClose={() => {
            setShowViewCreditModal(false);
            setActiveCredit(null);
          }}
        />
      )}

      {showDuplicateModal && activeInvoice && (
        <DuplicateInvoiceModal
          open={showDuplicateModal}
          invoice={activeInvoice}
          projects={projectsList}
          clients={clientsList}
          onClose={() => {
            setShowDuplicateModal(false);
            setActiveInvoice(null);
          }}
          onSave={async (payload) => {
            await fetch(`${API_BASE}/api/invoices`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            await fetchInvoices(clientId);
            setShowDuplicateModal(false);
            setActiveInvoice(null);
          }}
        />
      )}

{/* 
{showClientPaymentModal && paymentInvoice && (
  
  <ClientAddPaymentModal
    open={showClientPaymentModal}
    clientId={paymentInvoice?.client?.clientId}
    onClose={() => {
      setShowClientPaymentModal(false);
      setPaymentInvoice(null);
    }}
    onSaved={async () => {
      // 🔥 payment save ke baad invoices refresh
      await fetchInvoices(clientId);

      setShowClientPaymentModal(false);
      setPaymentInvoice(null);
    }}
  />
)} */}


{showClientPaymentModal && paymentInvoice && (
  <ClientAddPaymentModal
    open={showClientPaymentModal}
    clientId={paymentInvoice?.client?.clientId}
    projectId={paymentInvoice?.id}
    invoiceNumber={paymentInvoice?.invoiceNumber}
    onClose={() => {
      setShowClientPaymentModal(false);
      setPaymentInvoice(null);
    }}
    onSaved={async () => {
      await fetchInvoices(clientId);

      setShowClientPaymentModal(false);
      setPaymentInvoice(null);
    }}
  />
)}



{showPaymentsDrawer && paymentsInvoiceNo && (
  <InvoicePaymentsDrawer
    open={showPaymentsDrawer}
    invoiceNumber={paymentsInvoiceNo}
    onClose={() => {
      setShowPaymentsDrawer(false);
      setPaymentsInvoiceNo(null);
    }}
  />
)}




    </Card>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


type EmployeeMeta = {
  employeeId?: string;
  name?: string;
  designation?: string | null;
  department?: string | null;
  profileUrl?: string | null;
};

type Lead = {
  id: number;
  name?: string;
  email?: string;
  clientCategory?: string;
  leadSource?: string;
  leadOwner?: string;
  addedBy?: string;
  leadOwnerMeta?: EmployeeMeta;
  addedByMeta?: EmployeeMeta;
  createDeal?: boolean;
  autoConvertToClient?: boolean;
  companyName?: string;
  mobileNumber?: string;
  city?: string;
  country?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: unknown[];
  deals?: unknown[];
  officePhone?: string;
  officialWebsite?: string;
  postalCode?: string;
  companyAddress?: string;
};

type Followup = {
  id: number;
  nextDate?: string;
  startTime?: string;
  remarks?: string;
  sendReminder?: boolean;
  reminderSent?: boolean;
  createdAt?: string;
};

type Deal = {
  id: number;
  title?: string;
  value?: number;
  dealStage?: string;
  dealAgent?: string;
  dealWatchers?: string[];
  leadId?: number;
  leadName?: string;
  leadMobile?: string;
  leadCompanyName?: string;
  pipeline?: string;
  dealCategory?: string;
  expectedCloseDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  followups?: Followup[];
  tags?: string[];
  comments?: unknown[];
  assignedEmployeesMeta?: EmployeeMeta[];
  dealAgentMeta?: EmployeeMeta;
  dealWatchersMeta?: EmployeeMeta[];
};

type DealCategory = { id: number; categoryName: string };

type Note = {
  id?: number;
  noteTitle: string;
  noteType: "PUBLIC" | "PRIVATE";
  noteDetails?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const BASE = `${process.env.NEXT_PUBLIC_MAIN}`; // change if needed
const CREATE_URL = `${BASE}/deals`; // adjust if your create endpoint differs
const EMP_API = `${BASE}/employee/all?page=0&size=2000`;
const CAT_API = `${BASE}/deals/dealCategory`;

const fetcher = async (url: string) => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) throw new Error("No access token found. Please log in.");

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let message = "Failed to load data.";
    try {
      const json = await res.json();
      message = json?.message || json?.error || message;
    } catch {
      message = (await res.text()) || message;
    }
    throw new Error(message);
  }
  return res.json();
};

function fmt(v?: string | null) {
  return v && v !== "null" ? v : "--";
}
function fmtDate(d?: string | null) {
  return d ?
    // new Date(d).toLocaleString()
    format(new Date(d), "dd-MM-yyyy HH:mm")
    : "--";
}
function fmtShortDate(d?: string | null) {
  return d ?
    // new Date(d).toLocaleDateString()
    format(new Date(d), "dd-MM-yyyy")
    : "--";
}
function fmtCurrency(n?: number | null) {
  if (n == null || isNaN(Number(n))) return "--";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ---------------- DealViewModal (kept intact) ---------------- */
function DealViewModal({ deal, lead, onClose }: { deal: Deal; lead?: Lead | null; onClose: () => void }) {
  const [files, setFiles] = useState<{ name: string; url?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const res = await fetch(`${BASE}/deals/${deal.id}/files`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json)) setFiles(json);
      } catch (err) {
        // ignore silently
      }
    };
    loadFiles();
  }, [deal.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setFileError("Select a file first.");
      return;
    }
    setFileError(null);
    setUploading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const fd = new FormData();
      fd.append("file", selectedFile);

      const res = await fetch(`${BASE}/deals/${deal.id}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const uploaded = (json && (json.name || json.url)) ? { name: json.name || selectedFile.name, url: json.url } : { name: selectedFile.name };
      setFiles((s) => [uploaded, ...s]);
      setSelectedFile(null);
      (document.getElementById("deal-file-input") as HTMLInputElement | null)?.value && ((document.getElementById("deal-file-input") as HTMLInputElement).value = "");
    } catch (err: any) {
      setFileError(err?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };
  const leadCompanyName = lead?.companyName ?? "";
  const leadEmail = lead?.email ?? "";
  const leadPhone = lead?.mobileNumber ?? deal.leadMobile ?? "";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center px-4 pt-8">
        <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg border overflow-auto" style={{ maxHeight: "92vh" }}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Deal {deal.id ?? ""}</h3>
            <button onClick={onClose} className="text-muted-foreground p-1 rounded hover:bg-slate-100">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-lg border p-4">
              <h4 className="font-medium mb-2">Deal Information </h4>
              <div className="text-sm text-muted-foreground mb-4">
                {deal.pipeline ?? "Default Pipeline"} → {deal.dealStage ?? "--"}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Deal Name</div>
                  <div className="font-medium">{deal.title ?? `Deal ${deal.id}`}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Lead Contact</div>
                  <div>{deal.leadName ?? "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div>{leadEmail ? <a className="text-sky-600 underline" href={`mailto:${leadEmail}`}>{leadEmail}</a> : "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Company Name</div>
                  <div>{leadCompanyName ?? "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Deal Category</div>
                  <div>{deal.dealCategory ?? "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Deal Agent</div>
                  <div>{deal.dealAgentMeta?.name ?? deal.dealAgent ?? "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Deal Watcher</div>
                  <div>{deal.dealWatchersMeta && deal.dealWatchersMeta.length ? deal.dealWatchersMeta[0].name : "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Close Date</div>
                  <div>{deal.expectedCloseDate ? fmtShortDate(deal.expectedCloseDate) : "--"}</div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Deal Value</div>
                  <div>{fmtCurrency(deal.value ?? 0)}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3">Lead Contact Details</h4>
              <div className="text-sm grid gap-2">
                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">Name</div>
                  <div>{deal.leadName ?? "--"}</div>
                </div>

                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div>
                    {leadEmail ? (
                      <a className="text-sky-600 underline" href={`mailto:${leadEmail}`} target="_blank" rel="noreferrer">
                        {leadEmail}
                      </a>
                    ) : (
                      "--"
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">Mobile</div>
                  <div>
                    {leadPhone ? (
                      <a className="text-sky-600 underline" href={`tel:${leadPhone}`}>
                        {leadPhone}
                      </a>
                    ) : (
                      "--"
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="text-xs text-muted-foreground">Company Name</div>
                  <div>{leadCompanyName ?? "--"}</div>
                </div>

                <div className="mt-3 flex gap-2">
                  <a href={leadEmail ? `mailto:${leadEmail}` : "#"} className="px-3 py-2 border rounded text-sm inline-flex items-center gap-2" target="_blank" rel="noreferrer">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a3 3 0 003.22 0L21 8" />
                    </svg>
                    Email
                  </a>
                  <a href={leadPhone ? `tel:${leadPhone}` : "#"} className="px-3 py-2 border rounded text-sm inline-flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M22 16.92V21a1 1 0 01-1.11 1A19.86 19.86 0 013 5.11 1 1 0 014 4h4.09a1 1 0 01.95.68 12.05 12.05 0 00.7 2.28 1 1 0 01-.24 1.02L8.91 10.9" />
                    </svg>
                    Call
                  </a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 mt-4 rounded-lg border p-4">
              <div className="flex gap-6 border-b pb-3 text-sm">
                <button className="pb-2 border-b-2 border-sky-600 text-sky-600 font-medium">Files</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">Follow Up</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">People</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">Notes</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">Comments</button>
                <button className="pb-2 border-b-2 border-transparent text-slate-700">Tags</button>
              </div>

              <div className="mt-4 text-sm">
                <div className="mb-4">
                  <label className="block text-xs text-muted-foreground mb-2">Upload File</label>
                  <div className="flex items-center gap-3">
                    <input id="deal-file-input" type="file" onChange={handleFileChange} className="text-sm" />
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className={`px-3 py-2 rounded bg-blue-600 text-white ${uploading ? "opacity-60" : "hover:bg-blue-700"}`}
                    >
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                    {fileError && <div className="text-destructive text-xs">{fileError}</div>}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-2">Files</h5>
                  {files.length === 0 ? (
                    <div className="text-muted-foreground">No files uploaded.</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {files.map((f, i) => (
                        <li key={i}>
                          {f.url ? <a href={f.url} className="text-sky-600 underline" target="_blank" rel="noreferrer">{f.name}</a> : f.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4">Follow ups / files listing area — replicate your existing UI here as needed.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- DealCategoryModal (kept intact) ---------------- */
function DealCategoryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [categories, setCategories] = useState<DealCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(CAT_API, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setCategories(json);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) {
      setError("Category name required.");
      return;
    }
    setError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(CAT_API, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ categoryName: newName }),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      onSaved();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add category");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(`${CAT_API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
      onSaved();
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err));
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center px-4 pt-12">
        <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg border overflow-auto" style={{ maxHeight: "80vh" }}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Deal Category</h3>
            <button onClick={onClose} className="text-muted-foreground p-1 rounded hover:bg-slate-100">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {error && <div className="text-destructive mb-3">{error}</div>}
            <div className="rounded-lg border p-4 mb-4">
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sky-50 text-left">
                    <tr>
                      <th className="px-4 py-2 w-12">#</th>
                      <th className="px-4 py-2">Category Name</th>
                      <th className="px-4 py-2 w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">Loading…</td></tr>
                    ) : categories.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">No categories.</td></tr>
                    ) : (
                      categories.map((c, idx) => (
                        <tr key={c.id} className="border-t">
                          <td className="px-4 py-3">{idx + 1}</td>
                          <td className="px-4 py-3">{c.categoryName}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDelete(c.id)} className="text-destructive px-2 py-1 rounded border">🗑</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-2">Deal Category Name *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-2 border rounded-md" />
            </div>

            <div className="flex items-center justify-center gap-6">
              <button onClick={onClose} className="px-6 py-2 border rounded-full text-blue-600 hover:bg-blue-50">Cancel</button>
              <button onClick={handleAdd} className="px-6 py-2 rounded-full text-white bg-blue-600 hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- AddDealModal (kept intact) ---------------- */
function AddDealModal({
  lead,
  onClose,
  onCreated,
  possibleAgents,
  possibleWatchers,
}: {
  lead: Lead;
  onClose: () => void;
  onCreated: (d: Deal) => void;
  possibleAgents: EmployeeMeta[];
  possibleWatchers: EmployeeMeta[];
}) {
  const [form, setForm] = useState({
    leadContact: lead?.id ?? "",
    title: "",
    pipeline: "",
    dealStage: "Qualified",
    dealCategory: "",
    dealAgent: "",
    dealWatchers: [] as string[],
    value: "",
    closeDate: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [watchersOpen, setWatchersOpen] = useState(false);
  const watchersButtonRef = useRef<HTMLButtonElement | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const [categories, setCategories] = useState<DealCategory[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catModalOpen, setCatModalOpen] = useState(false);

  const update = (k: keyof typeof form, v: any) => setForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const loadCategories = async () => {
    setCatsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(CAT_API, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const json: DealCategory[] = await res.json();
      setCategories(json);
      if (!form.dealCategory && json.length > 0) {
        setForm((s) => ({ ...s, dealCategory: json[0].categoryName }));
      }
    } catch (err: any) {
      console.error("Failed to load categories", err);
    } finally {
      setCatsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const validate = () => {
    if (!form.title.trim()) return "Deal Name is required.";
    if (!form.pipeline.trim()) return "Pipeline is required.";
    if (!form.dealStage.trim()) return "Deal stage is required.";
    if (!form.closeDate.trim()) return "Close date is required.";
    return null;
  };

  const toggleWatcher = (employeeId: string, checked: boolean) => {
    setForm((s) => {
      const curr = s.dealWatchers || [];
      const updated = checked ? [...curr, employeeId] : curr.filter((id) => id !== employeeId);
      return { ...s, dealWatchers: updated };
    });
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");

      const body: any = {
        title: form.title,
        pipeline: form.pipeline || undefined,
        dealStage: form.dealStage || undefined,
        dealCategory: form.dealCategory || undefined,
        dealAgent: form.dealAgent || undefined,
        dealWatchers: form.dealWatchers && form.dealWatchers.length ? form.dealWatchers : undefined,
        value: form.value ? Number(form.value) : undefined,
        closeDate: form.closeDate || undefined,
        leadId: lead.id,
      };

      const res = await fetch(CREATE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to create deal.");
      }

      const createdDeal = await res.json();
      onCreated(createdDeal as Deal);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to create deal.");
    } finally {
      setSubmitting(false);
    }
  };

  const openWatchers = () => {
    const btn = watchersButtonRef.current;
    if (!btn) {
      setWatchersOpen(true);
      return;
    }
    const rect = btn.getBoundingClientRect();
    const top = rect.bottom + 8;
    const left = rect.left;
    const width = rect.width;
    setPanelPos({ top, left, width });
    setWatchersOpen((s) => !s);
  };

  const selectedWatcherNames = () => {
    const selected = possibleWatchers.filter((w) => form.dealWatchers.includes(w.employeeId || ""));
    if (selected.length === 0) return "--";
    return selected.map((s) => s.name).join(", ");
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center px-4 pt-12">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg border overflow-auto" style={{ maxHeight: "92vh" }}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Add Deal Information</h3>
            <button onClick={onClose} className="text-muted-foreground p-1 rounded hover:bg-slate-100">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={submit} className="p-6">
            {error && <div className="text-destructive text-sm mb-3">{error}</div>}

            <div className="rounded-lg border p-6">
              <h4 className="font-medium mb-4">Deal Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Lead Contact *</label>
                  <select
                    className="w-full p-2 border rounded-md bg-white text-sm"
                    value={String(form.leadContact)}
                    onChange={(e) => update("leadContact", Number(e.target.value))}
                  >
                    <option value="">{lead?.name ?? "--"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Deal Name *</label>
                  <input
                    className="w-full p-2 border rounded-md text-sm"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Pipeline *</label>
                  <select
                    className="w-full p-2 border rounded-md bg-white text-sm"
                    value={form.pipeline}
                    onChange={(e) => update("pipeline", e.target.value)}
                  >
                    <option value="">--</option>
                    <option>Default Pipeline</option>
                    <option>Sales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Deal Stages *</label>
                  <div className="relative">
                    <select
                      className="w-full p-2 border rounded-md bg-white text-sm"
                      value={form.dealStage}
                      onChange={(e) => update("dealStage", e.target.value)}
                    >
                      <option>Qualified</option>
                      <option>Generated</option>
                      <option>Proposal</option>
                      <option>Won</option>
                      <option>Lost</option>
                    </select>
                    <div className="absolute left-3 top-3 w-2 h-2 rounded-full bg-sky-600"></div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Deal Category</label>
                  <div className="flex">
                    <select
                      className="flex-1 p-2 border rounded-l-md bg-white text-sm"
                      value={form.dealCategory}
                      onChange={(e) => update("dealCategory", e.target.value)}
                    >
                      <option value="">--</option>
                      {!catsLoading && categories.map((c) => (
                        <option key={c.id} value={c.categoryName}>{c.categoryName}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setCatModalOpen(true)}
                      className="px-3 py-2 border rounded-r-md bg-gray-200 text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Deal Agent</label>
                  <select
                    className="w-full p-2 border rounded-md bg-white text-sm"
                    value={form.dealAgent}
                    onChange={(e) => update("dealAgent", e.target.value)}
                  >
                    <option value="">--</option>
                    {possibleAgents.map((a) => (
                      <option key={a.employeeId} value={a.employeeId}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Deal Value</label>
                  <div className="flex items-stretch">
                    <span className="inline-flex items-center px-3 rounded-l-md border bg-slate-100 text-sm">USD $</span>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-r-md text-sm"
                      value={form.value}
                      onChange={(e) => update("value", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Close Date *</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded-md text-sm"
                    value={form.closeDate}
                    onChange={(e) => update("closeDate", e.target.value)}
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs text-muted-foreground mb-2">Deal Watcher</label>

                  <button
                    type="button"
                    ref={watchersButtonRef}
                    onClick={openWatchers}
                    className="w-full p-2 border rounded-md text-left bg-white text-sm flex items-center justify-between"
                  >
                    <span className="truncate">{selectedWatcherNames()}</span>
                    <svg className={`w-4 h-4 transform ${watchersOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M6 8l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {watchersOpen && panelPos && (
                    <div
                      style={{
                        position: "fixed",
                        top: panelPos.top + window.scrollY,
                        left: panelPos.left,
                        width: panelPos.width,
                        zIndex: 60,
                      }}
                    >
                      <div className="bg-white border rounded-md shadow-lg p-3 max-h-[60vh] overflow-auto">
                        {possibleWatchers.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No employees</div>
                        ) : (
                          <div className="grid gap-2">
                            {possibleWatchers.map((w) => (
                              <label key={w.employeeId} className="flex items-start gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={form.dealWatchers.includes(w.employeeId || "")}
                                  onChange={(e) => toggleWatcher(w.employeeId || "", e.target.checked)}
                                />
                                <div>
                                  <div className="text-sm">{w.name}</div>
                                  {w.designation && <div className="text-xs text-muted-foreground">{w.designation}</div>}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mt-1">Click to open and select watchers</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border rounded-full text-blue-600 hover:bg-blue-50"
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2 rounded-full text-white ${submitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {catModalOpen && (
        <DealCategoryModal
          onClose={() => { setCatModalOpen(false); }}
          onSaved={() => { loadCategories(); }}
        />
      )}
    </div>
  );
}

/* ---------------- EditModal (kept intact) ---------------- */
function EditModal({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: lead?.name ?? "",
    email: lead?.email ?? "",
    clientCategory: lead?.clientCategory ?? "",
    leadSource: lead?.leadSource ?? "",
    leadOwner: lead?.leadOwner ?? "",
    addedBy: lead?.addedBy ?? "",
    autoConvertToClient: !!lead?.autoConvertToClient,
    companyName: lead?.companyName ?? "",
    officialWebsite: lead?.officialWebsite ?? "",
    mobileNumber: String(lead?.mobileNumber ?? ""),
    officePhone: lead?.officePhone ?? "",
    city: lead?.city ?? "",
    state: lead?.state ?? "",
    postalCode: lead?.postalCode ?? "",
    country: lead?.country ?? "",
    companyAddress: lead?.companyAddress ?? "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = (k: keyof typeof form, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    if (!form.name.trim() || !form.email.trim()) return "Name and Email are required.";
    return null;
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = validate();
    if (v) {
      setErrorMsg(v);
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");

      const body: any = {
        name: form.name,
        email: form.email,
        clientCategory: form.clientCategory || undefined,
        leadSource: form.leadSource || undefined,
        leadOwner: form.leadOwner || undefined,
        addedBy: form.addedBy || undefined,
        autoConvertToClient: !!form.autoConvertToClient,
        companyName: form.companyName || undefined,
        officialWebsite: form.officialWebsite || undefined,
        mobileNumber: form.mobileNumber ? Number(form.mobileNumber) : undefined,
        officePhone: form.officePhone || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        postalCode: form.postalCode || undefined,
        country: form.country || undefined,
        companyAddress: form.companyAddress || undefined,
      };

      const res = await fetch(`${BASE}/leads/${lead.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Update failed");
      }

      await res.json();
      alert("Lead updated successfully.");
      await onSaved();
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to update lead.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="fixed inset-0 flex items-start justify-center px-4 pt-12">
        <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg border overflow-auto" style={{ maxHeight: "92vh" }}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Update Lead Contact</h3>
            <button onClick={onClose} className="text-muted-foreground p-1 rounded hover:bg-slate-100">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-6">
            {errorMsg && <div className="text-destructive text-sm">{errorMsg}</div>}

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3">Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Name *</label>
                  <input className="w-full border rounded-md p-2" value={form.name} onChange={(e) => update("name", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Email *</label>
                  <input className="w-full border rounded-md p-2" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Lead Source</label>
                  <input className="w-full border rounded-md p-2" value={form.leadSource} onChange={(e) => update("leadSource", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Lead Owner</label>
                  <input className="w-full border rounded-md p-2" value={form.leadOwner} onChange={(e) => update("leadOwner", e.target.value)} />
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <input type="checkbox" id="autoConvert" checked={!!form.autoConvertToClient} onChange={(e) => update("autoConvertToClient", e.target.checked)} />
                  <label htmlFor="autoConvert" className="text-sm">Auto Convert lead to client when the deal stage is set to "WIN".</label>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3">Company Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Company Name</label>
                  <input className="w-full border rounded-md p-2" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Official Website</label>
                  <input className="w-full border rounded-md p-2" value={form.officialWebsite} onChange={(e) => update("officialWebsite", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Mobile Number</label>
                  <input className="w-full border rounded-md p-2" value={form.mobileNumber} onChange={(e) => update("mobileNumber", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Office Phone No.</label>
                  <input className="w-full border rounded-md p-2" value={form.officePhone} onChange={(e) => update("officePhone", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">City</label>
                  <input className="w-full border rounded-md p-2" value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">State</label>
                  <input className="w-full border rounded-md p-2" value={form.state} onChange={(e) => update("state", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Postal Code</label>
                  <input className="w-full border rounded-md p-2" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Country</label>
                  <input className="w-full border rounded-md p-2" value={form.country} onChange={(e) => update("country", e.target.value)} />
                </div>

                <div className="md:col-span-3">
                  <label className="text-sm text-muted-foreground">Company Address</label>
                  <textarea className="w-full border rounded-md p-2 h-28" value={form.companyAddress} onChange={(e) => update("companyAddress", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" onClick={submit} disabled={submitting}>{submitting ? "Updating..." : "Update"}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Add/Edit Note Modal (kept intact) ---------------- */
function AddEditNoteModal({
  leadId,
  initial,
  onClose,
  onSaved,
}: {
  leadId: number;
  initial?: Note | null;
  onClose: () => void;
  onSaved: (note?: Note) => void;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Note>({
    noteTitle: initial?.noteTitle ?? "",
    noteType: (initial?.noteType as "PUBLIC" | "PRIVATE") ?? "PUBLIC",
    noteDetails: initial?.noteDetails ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = (k: keyof Note, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    if (!form.noteTitle.trim()) return "Note Title is required.";
    return null;
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const url = isEdit
        ? `${BASE}/leads/${leadId}/notes/${initial?.id}`
        : `${BASE}/leads/${leadId}/notes`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          noteTitle: form.noteTitle,
          noteType: form.noteType,
          noteDetails: form.noteDetails,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to save note.");
      }
      const saved = await res.json();
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message ?? "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center px-4 pt-12">
        <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg border overflow-auto" style={{ maxHeight: "90vh" }}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{isEdit ? "Edit Lead Note" : "Add Lead Note"}</h3>
            <button onClick={onClose} className="text-muted-foreground p-1 rounded hover:bg-slate-100">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={submit} className="p-6">
            {error && <div className="text-destructive text-sm mb-3">{error}</div>}
            <div className="rounded-lg border p-6">
              <h4 className="font-medium mb-4">Lead Note Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Note Title *</label>
                  <input
                    className="w-full p-2 border rounded-md text-sm"
                    value={form.noteTitle}
                    onChange={(e) => update("noteTitle", e.target.value)}
                    placeholder="Enter Note Title"
                  />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Note Type</label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={form.noteType === "PUBLIC"} onChange={() => update("noteType", "PUBLIC")} />
                      <span>Public</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={form.noteType === "PRIVATE"} onChange={() => update("noteType", "PRIVATE")} />
                      <span>Private</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-2">Note Detail</label>
                  <textarea
                    className="w-full p-3 border rounded-md text-sm h-36"
                    value={form.noteDetails}
                    onChange={(e) => update("noteDetails", e.target.value)}
                    placeholder="Enter details..."
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6">
              <button type="button" onClick={onClose} className="px-6 py-2 border rounded-full text-blue-600 hover:bg-blue-50" disabled={submitting}>
                Cancel
              </button>

              <button type="submit" disabled={submitting} className={`px-6 py-2 rounded-full text-white ${submitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}>
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------- NEW: ViewNoteModal (keeps same UI) ---------------- */
function ViewNoteModal({ note, onClose }: { note: Note; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-start justify-center px-4 pt-12">
        <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg border overflow-auto" style={{ maxHeight: "90vh" }}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{note.noteTitle ?? "My Note"}</h3>
            <button onClick={onClose} className="text-muted-foreground p-1 rounded hover:bg-slate-100">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            <div className="rounded-lg border p-6">
              <h4 className="font-medium mb-4">Project Note Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-muted-foreground">Note Title</div>
                <div className="md:col-span-2">{note.noteTitle ?? "--"}</div>

                <div className="text-muted-foreground">Note Type</div>
                <div className="md:col-span-2">{note.noteType === "PUBLIC" ? "Public" : "Private"}</div>

                <div className="text-muted-foreground">Note Detail</div>
                <div className="md:col-span-2">{note.noteDetails ? note.noteDetails : "---"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Main Page Component (updated: notes popup fixed positioning) ---------------- */

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = params?.id;

  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<Lead>(
    leadId ? `/api/leads/admin/get/${leadId}` : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    },
  );

  const [activeTab, setActiveTab] = useState<"profile" | "deals" | "notes">("profile");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [editOpen, setEditOpen] = useState(false);

  const { data: dealsData, error: dealsError, isLoading: dealsLoading, mutate: mutateDeals } = useSWR<Deal[]>(
    activeTab === "deals" ? `${BASE}/deals/lead/${params.id}` : null,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const { data: empResp } = useSWR(EMP_API, fetcher, { refreshInterval: 0 });
  const employees: EmployeeMeta[] = (empResp && Array.isArray(empResp.content) ? empResp.content.map((e: any) => ({
    employeeId: e.employeeId,
    name: e.name,
    designation: e.designationName ?? null,
    department: e.departmentName ?? null,
    profileUrl: e.profilePictureUrl ?? null,
  })) : []);

  const [addDealOpen, setAddDealOpen] = useState(false);

  // NEW: pass lead to view modal
  const [viewDeal, setViewDeal] = useState<Deal | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return;
      const t = e.target as Node;
      if (menuOpen && !menuRef.current.contains(t)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const goEdit = () => {
    setMenuOpen(false);
    router.push(`/leads/admin/edit/${params.id}`);
  };




  const convertToClient = async () => {
    setMenuOpen(false);
    //router.push(`/clients/new`);
    if (!confirm("Convert this lead to client?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(`${BASE}/leads/${params.id}/convert`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Converted to client.");
      await mutate();
      router.push("/leads");
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err));
    }
  };

  const remove = async () => {
    setMenuOpen(false);
    if (!confirm("Delete this lead?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(`${BASE}/leads/${params.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Deleted.");
      router.push("/leads");
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err));
    }
  };

  const handleCreatedDeal = async (created: Deal) => {
    if (mutateDeals) {
      mutateDeals((curr: Deal[] | undefined) => (curr ? [created, ...curr] : [created]), false);
    }
  };

  const agents = employees;
  const watchers = employees;

  /* ---------------- Notes state & functions ---------------- */
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);

  // openNoteMenuId stays the id; menuPos holds fixed coordinates for popup
  const [openNoteMenuId, setOpenNoteMenuId] = useState<number | null>(null);
  const [noteMenuPos, setNoteMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  const [viewNote, setViewNote] = useState<Note | null>(null); // for view modal

  const NOTES_API = (leadId: string | number) => `${BASE}/leads/${leadId}/notes`;

  const loadNotes = async () => {
    setNotesLoading(true);
    setNotesError(null);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(NOTES_API(params.id), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setNotes(Array.isArray(json) ? json : []);
    } catch (err: any) {
      setNotesError(err?.message ?? "Failed to load notes");
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "notes") {
      loadNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, params.id]);

  const openAddNote = () => {
    setEditNote(null);
    setNoteModalOpen(true);
  };

  const handleNoteSaved = (saved?: Note) => {
    setNoteModalOpen(false);
    setEditNote(null);
    setOpenNoteMenuId(null);
    if (saved) {
      loadNotes();
    } else {
      loadNotes();
    }
  };

  const handleDeleteNote = async (noteId?: number) => {
    if (!noteId) return;
    if (!confirm("Delete this note?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token.");
      const res = await fetch(`${NOTES_API(params.id)}/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setNotes((s) => s.filter((n) => n.id !== noteId));
      setOpenNoteMenuId(null);
      setNoteMenuPos(null);
    } catch (err: any) {
      alert("Error: " + (err?.message ?? err));
    }
  };

  // open fixed menu popup near button
  const onOpenNoteMenu = (e: React.MouseEvent, noteId?: number) => {
    e.stopPropagation();
    if (!noteId) return;
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    // compute top/left for fixed positioned popup
    const top = rect.bottom + 8 + window.scrollY; // include scrollY to position correctly
    const left = rect.right - 160; // align right edge of popup near button (popup width ~ 160)
    setOpenNoteMenuId((prev) => (prev === noteId ? null : noteId));
    setNoteMenuPos({ top, left: Math.max(left, 8) });
  };

  // close popup on outside click / scroll / resize
  useEffect(() => {
    if (openNoteMenuId == null) return;
    const onDocClick = (ev: MouseEvent) => {
      const t = ev.target as Node;
      if (!menuContainerRef.current) return;
      if (!menuContainerRef.current.contains(t)) {
        setOpenNoteMenuId(null);
        setNoteMenuPos(null);
      }
    };
    const onScroll = () => {
      setOpenNoteMenuId(null);
      setNoteMenuPos(null);
    };
    const onResize = () => {
      setOpenNoteMenuId(null);
      setNoteMenuPos(null);
    };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [openNoteMenuId]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
            {/* <ArrowLeft className="h-5 w-5" /> */}
          </Button>

        </div>



        {/* Card */}
        <Card className="p-6">
          {/* {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading lead details…</div>
          ) : error ? ( */}


{isLoading ? (
  <div className="space-y-6">
    <div className="rounded-lg border p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Labels */}
        <div className="hidden md:block space-y-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} width={120} height={12} />
          ))}
        </div>

        {/* Values */}
        <div className="md:col-span-2 space-y-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} height={14} />
          ))}
        </div>

      </div>
    </div>

    {/* Bottom Info */}
    <div className="flex justify-between">
      <Skeleton width={200} height={14} />
      <Skeleton width={120} height={20} />
    </div>
  </div>
): error ? (



            <div className="py-12 text-center">
              <p className="text-destructive">Failed to load lead details.</p>
              <p className="text-sm text-muted-foreground mt-2">{(error as Error)?.message}</p>
              <div className="mt-4">
                <Button variant="ghost" onClick={() => router.back()}>
                  Back to Leads
                </Button>
              </div>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-muted-foreground">No lead found.</div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-lg font-semibold">{activeTab === "profile" ? "Profile Information" : activeTab === "deals" ? "Deals" : "Notes"}</h3>


              </div>

              {/* PROFILE TAB */}
              {/* {activeTab === "profile" && ( */}
              <>
                <div className="rounded-lg border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <dl className="hidden md:block md:col-span-1 space-y-4 text-sm text-muted-foreground">
                      <dt>Name</dt>
                      <dt>Email</dt>
                      <dt>Lead Owner</dt>
                      <dt>Source</dt>
                      <dt>Company Name</dt>
                      <dt>Website</dt>
                      <dt>Mobile</dt>
                      <dt>Office Phone Number</dt>
                      <dt>City</dt>
                      <dt>State</dt>
                      <dt>Country</dt>
                      <dt>Postal Code</dt>
                      <dt>Address</dt>
                    </dl>

                    <div className="md:col-span-2">
                      <div className="grid gap-y-3">
                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Name</div>
                          <div className="text-sm mt-2">{fmt(data?.name)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Email</div>
                          <div className="text-sm mt-2">{fmt(data?.email)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Lead Owner</div>
                          <div className="text-sm">{data?.leadOwnerMeta?.name ?? data?.leadOwner ?? "--"}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Source</div>
                          <div className="text-sm mt-2">{fmt(data?.leadSource)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Company Name</div>
                          <div className="text-sm mt-2">{fmt(data?.companyName)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Website</div>
                          <div className="text-sm">{fmt((data as any)?.officialWebsite)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Mobile</div>
                          <div className="text-sm mt-2">{fmt(data?.mobileNumber)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Office Phone Number</div>
                          <div className="text-sm">{fmt(data?.officePhone)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">City</div>
                          <div className="text-sm">{fmt(data?.city)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">State</div>
                          <div className="text-sm">{fmt(data?.state)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Country</div>
                          <div className="text-sm">{fmt(data?.country)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Postal Code</div>
                          <div className="text-sm">{fmt(data?.postalCode)}</div>
                        </div>

                        <div className="flex items-start gap-6">
                          <div className="w-48 md:hidden text-sm text-muted-foreground">Address</div>
                          <div className="text-sm">{fmt(data?.companyAddress)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-sm text-muted-foreground grid md:grid-cols-2 gap-2">
                  <div>Created: {fmtDate(data?.createdAt)}</div>
                  <div className="text-right">
                    Status: <Badge variant="secondary">{data?.status ?? "--"}</Badge>
                  </div>
                </div>
              </>



            </div>
          )}
        </Card>
      </div>
    </main>
  );
}








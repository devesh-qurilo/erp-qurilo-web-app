"use client";

import useSWR from "swr";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarIcon } from "lucide-react";
// import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

/* =======================
   Types & constants
   ======================= */
const BASE = `${process.env.NEXT_PUBLIC_MAIN}`;

type EmployeeMeta = {
  employeeId: string;
  name: string;
  designation: string;
  department?: string;
  profileUrl?: string;
};

type Employee = { employeeId: string; name: string; designation?: string };

type Lead = {
  id: number;
  name: string;
  email: string;
  companyName?: string;
  mobileNumber?: string;
  city?: string;
  country?: string;
  status?: string;
  leadOwner?: string;
  addedBy?: string;
  leadOwnerMeta?: EmployeeMeta;
  addedByMeta?: EmployeeMeta;
  createdAt?: string;
  updatedAt?: string;
};

/* =======================
   fetcher
   ======================= */
const fetcher = async (url: string) => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    throw new Error("No access token found. Please log in.");
  }
  const res = await fetch(`${BASE}/leads/my-leads`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    let errorMessage = "Failed to load.";
    try {
      const j = await res.json();
      errorMessage = j.message || errorMessage;
    } catch {
      errorMessage = (await res.text()) || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

/* =======================
   OwnerCell helper
   ======================= */
function OwnerCell({ meta, fallback }: { meta?: EmployeeMeta; fallback?: string }) {
  const src = meta?.profileUrl || "/placeholder.svg?height=32&width=32&query=profile-avatar";
  return (
    <div className="flex items-center gap-3">
      <img
        src={src}
        alt={meta?.name ? `Profile photo of ${meta.name}` : "Profile avatar"}
        className="h-8 w-8 rounded-full object-cover border"
        crossOrigin="anonymous"
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{meta?.name || fallback || "—"}</span>
        <span className="text-xs text-muted-foreground">{meta?.designation || "—"}</span>
      </div>
    </div>
  );
}

/* =======================
   AddLeadModal (your working implementation)
   - Slightly trimmed comments but unchanged logic
   ======================= */

type DealCategoryItem = { id: number; categoryName: string };
type LeadSourceItem = { id: number; name: string };



export function AddLeadModal({
  onClose,
  onCreated,
  employees,
}: {
  onClose: () => void;
  onCreated: () => void;
  employees: Employee[];
}) {

  const [dealCategories, setDealCategories] = useState<DealCategoryItem[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSourceItem[]>([]);
  const [clientCategories, setClientCategories] = useState<DealCategoryItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    (async () => {
      try {
        const res1 = await fetch(`${BASE}/deals/dealCategory`, { headers: { Authorization: `Bearer ${token}` } });
        if (res1.ok) {
          const json = await res1.json();
          if (Array.isArray(json)) {
            setDealCategories(json);
            setClientCategories(json);
          }
        }
        const res2 = await fetch(`${BASE}/deals/dealCategory/LeadSource`, { headers: { Authorization: `Bearer ${token}` } });
        if (res2.ok) {
          const json2 = await res2.json();
          if (Array.isArray(json2)) setLeadSources(json2);
        }
      } catch {
        // ignore
      }
    })();
  }, []);



  const [payload, setPayload] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    clientCategory: "",
    leadSource: "",
    addedBy: "",
    leadOwner: "",
    autoConvertToClient: true,   // ✅ ADD THIS

    companyName: "",
    officialWebsite: "",
    officePhone: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    companyAddress: "",
  });

  const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Italy",
    "Spain",
    "Brazil",
    "Japan",
    "China",
    "South Korea",
    "Singapore",
    "UAE",
    "Saudi Arabia",
    "South Africa",
    "Russia",
    "Mexico",
    "Netherlands",
    "Switzerland"
  ];




  const [addModalOpen, setAddModalOpen] = useState<null | "clientCategory" | "leadSource" | "dealCategory">(null);
  const [addName, setAddName] = useState("");
  const [loadingAddList, setLoadingAddList] = useState(false);
  const [addListItems, setAddListItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);



  // slide + focus + prevent background scroll
  const [visible, setVisible] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => firstInputRef.current?.focus(), 120);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const update = (k: string, v: any) => setPayload((p) => ({ ...p, [k]: v }));

  const validate = () => {
    if (!payload.name?.trim() || !payload.email?.trim() || !payload.companyName?.trim()) {
      return "Name, Email and Company Name are required.";
    }

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
      if (!token) throw new Error("No access token found.");
      const body: any = {
        name: payload.name,
        email: payload.email,
        mobileNumber: payload.mobileNumber || undefined,
        clientCategory: payload.clientCategory || undefined,
        leadSource: payload.leadSource || undefined,
        addedBy: payload.addedBy || undefined,
        leadOwner: payload.leadOwner || undefined,
        autoConvertToClient: !!payload.autoConvertToClient,


        companyName: payload.companyName,
        officialWebsite: payload.officialWebsite || undefined,
        officePhone: payload.officePhone || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
        postalCode: payload.postalCode || undefined,
        country: payload.country || undefined,
        companyAddress: payload.companyAddress || undefined,
      };

      const res = await fetch(`${BASE}/leads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to create lead");
      }

      onCreated();
      alert("Lead created successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to create lead.");
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = async (type: "clientCategory" | "leadSource" | "dealCategory") => {
    setAddModalOpen(type);
    setAddName("");
    setLoadingAddList(true);
    setAddListItems([]);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token");
      if (type === "leadSource") {
        const res = await fetch(`${BASE}/deals/dealCategory/LeadSource`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) setAddListItems(json);
        }
      } else {
        const res = await fetch(`${BASE}/deals/dealCategory`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) setAddListItems(json);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingAddList(false);
    }
  };

  const addItem = async (type: "clientCategory" | "leadSource" | "dealCategory") => {
    if (!addName.trim()) return alert("Please enter a name.");
    setLoadingAddList(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token");
      let url = "";
      let body: any = {};
      if (type === "leadSource") {
        url = `${BASE}/deals/dealCategory/LeadSource`;
        body = { name: addName.trim() };
      } else {
        url = `${BASE}/deals/dealCategory`;
        body = { categoryName: addName.trim() };
      }
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to add");
      }
      const created = await res.json();
      if (type === "leadSource") {
        setLeadSources((prev) => [{ id: created.id, name: created.name || addName.trim() }, ...prev]);
        setPayload((p) => ({ ...p, leadSource: created.name || addName.trim() }));
      } else {
        setDealCategories((prev) => [{ id: created.id, categoryName: created.categoryName || addName.trim() }, ...prev]);
        setClientCategories((prev) => [{ id: created.id, categoryName: created.categoryName || addName.trim() }, ...prev]);
        setPayload((p) => ({ ...p, deal: { ...(p.deal as DealPayload), dealCategory: created.categoryName || addName.trim() }, clientCategory: created.categoryName || addName.trim() }));
      }
      setAddName("");
      setAddModalOpen(null);
      alert("Added successfully.");
    } catch (err: any) {
      alert("Error: " + (err?.message || err));
    } finally {
      setLoadingAddList(false);
    }
  };

  const deleteItem = async (type: "clientCategory" | "leadSource" | "dealCategory", id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token");
      let url = "";
      if (type === "leadSource") {
        url = `${BASE}/deals/dealCategory/LeadSource/${id}`;
      } else {
        url = `${BASE}/deals/dealCategory/${id}`;
      }
      const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Delete failed");
      }
      if (type === "leadSource") setLeadSources((s) => s.filter((x) => x.id !== id));
      else {
        setDealCategories((s) => s.filter((x) => x.id !== id));
        setClientCategories((s) => s.filter((x) => x.id !== id));
      }
      alert("Deleted successfully.");
    } catch (err: any) {
      alert("Error deleting: " + (err?.message || err));
    }
  };

  /* ---------------- UI: compact + left-aligned titles ---------------- */
  const FormContent = (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="text-destructive text-sm">{error}</div>}

      {/* Contact Card */}
      <div className="bg-white rounded-lg border p-6 shadow-sm flex flex-col">
        <h4 className="text-sm font-medium mb-4 text-left order-first">Lead Contact Detail</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Name *</label>
            <input ref={firstInputRef} className="w-full border rounded-md px-3 py-2 text-sm" value={payload.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Email *</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.email} type="email" onChange={(e) => update("email", e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Client Category</label>
            <div className="flex gap-2">
              <select className="flex-1 border rounded-md px-3 py-2 text-sm" value={payload.clientCategory} onChange={(e) => update("clientCategory", e.target.value)}>
                <option value="">--</option>
                {clientCategories.map((c) => <option key={c.id} value={c.categoryName}>{c.categoryName}</option>)}
              </select>
              <button type="button" onClick={() => openAddModal("clientCategory")} className="px-3 py-2 rounded border text-sm">Add</button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Lead Source</label>
            <div className="flex gap-2">
              <select className="flex-1 border  rounded-md px-3 py-2 text-sm" value={payload.leadSource} onChange={(e) => update("leadSource", e.target.value)}>
                <option value="">--</option>
                {leadSources.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <button type="button" onClick={() => openAddModal("leadSource")} className="px-3 py-2 rounded border text-sm">Add</button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Added By</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={payload.addedBy} onChange={(e) => update("addedBy", e.target.value)}>
              <option value="">--</option>
              {employees.map((emp) => <option key={emp.employeeId} value={emp.employeeId}>{emp.name} ({emp.employeeId})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Lead Owner</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={payload.leadOwner} onChange={(e) => update("leadOwner", e.target.value)}>
              <option value="">--</option>
              {employees.map((emp) => <option key={emp.employeeId} value={emp.employeeId}>{emp.name} ({emp.employeeId})</option>)}
            </select>
          </div>



          <div className="flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              id="autoConvert"
              checked={!!payload.autoConvertToClient}
              onChange={(e) => update("autoConvertToClient", e.target.checked)}
            />
            <label htmlFor="autoConvert" className="text-sm">
              Auto Convert lead to client when the deal stage is set to "WIN".
            </label>
          </div>


        </div>
      </div>


      {/* Company */}
      <div className="bg-white rounded-lg border p-5 shadow-sm flex flex-col">
        <h4 className="text-sm font-medium mb-4 text-left order-first">Company Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div >
            <label className="block text-xs text-left text-muted-foreground mb-1">Company Name *</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.companyName} onChange={(e) => update("companyName", e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Official Website</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.officialWebsite} onChange={(e) => update("officialWebsite", e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Mobile Number</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.mobileNumber} onChange={(e) => update("mobileNumber", e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Office Phone No.</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.officePhone} onChange={(e) => update("officePhone", e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">City</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.city} onChange={(e) => update("city", e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">State</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.state} onChange={(e) => update("state", e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">Postal Code</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
          </div>




          <div>
            <label className="block text-xs text-left text-muted-foreground mb-1">
              Country
            </label>

            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              value={payload.country}
              onChange={(e) => update("country", e.target.value)}
            >
              <option value="">-- Select Country --</option>

              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>



          <div className="md:col-span-3">
            <label className="block text-xs text-left text-muted-foreground mb-1">Company Address</label>
            <textarea className="w-full border rounded-md p-3 text-sm h-28" value={payload.companyAddress} onChange={(e) => update("companyAddress", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border text-sm" disabled={submitting}>Cancel</button>
        <button type="button" onClick={submit} className="px-4 py-2 rounded-md bg-sky-600 text-white text-sm" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button>
      </div>
    </form>
  );

  /* -------- Small add-list modal (unchanged logic) -------- */
  const SmallAddListModal = addModalOpen ? (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={() => setAddModalOpen(null)} />
      <div className="fixed inset-0 flex items-start justify-center px-4 pt-20">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border overflow-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">
              {addModalOpen === "clientCategory" ? "Client Category" : addModalOpen === "leadSource" ? "Lead Source" : "Deal Category"}
            </h3>
            <button onClick={() => setAddModalOpen(null)} className="text-muted-foreground p-1 rounded hover:bg-slate-100">✕</button>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(addListItems.length ? addListItems : addModalOpen === "clientCategory" ? clientCategories : addModalOpen === "leadSource" ? leadSources : dealCategories).map((item: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{item.categoryName || item.name}</td>
                        <td className="p-2">
                          <button onClick={() => deleteItem(addModalOpen === "leadSource" ? "leadSource" : addModalOpen === "clientCategory" ? "clientCategory" : "dealCategory", item.id)} className="text-destructive">🗑</button>
                        </td>
                      </tr>
                    ))}
                    {(!addListItems.length && !(addModalOpen === "clientCategory" ? clientCategories.length : addModalOpen === "leadSource" ? leadSources.length : dealCategories.length)) && (
                      <tr>
                        <td colSpan={3} className="p-4 text-sm text-muted-foreground">No items found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-muted-foreground mb-1">Name *</label>
              <input value={addName} onChange={(e) => setAddName(e.target.value)} className="w-full border rounded-md p-2" placeholder="Enter name" />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setAddModalOpen(null)} className="rounded-md px-4 py-2 border">Cancel</button>
              <button onClick={() => addItem(addModalOpen)} disabled={loadingAddList} className="rounded-md bg-sky-600 text-white px-4 py-2">
                {loadingAddList ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  /* ---------------- final render of AddLeadModal ---------------- */
  return (
    <>
      <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />

        <aside
          className={[
            "absolute right-0 top-0 h-full bg-gray-50 flex flex-col",
            "w-full sm:w-[83vw] max-w-full",
            "transform transition-transform duration-300 ease-out",
            visible ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
          style={{ willChange: "transform" }}
        >
          <div className="flex items-start justify-between p-4 border-b bg-white sticky top-0 z-10">
            <div>
              <h3 className="text-lg font-semibold text-left">Add Lead Contact Information </h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-2 rounded hover:bg-slate-100">✕</button>
            </div>
          </div>

          <div className="p-6 overflow-auto flex-1">
            {FormContent}
          </div>
        </aside>
      </div>

      {SmallAddListModal}
    </>
  );
}

function LeadRow({
  lead,
  idx,
  mutate,
  onEdit,
  onView,
  onChangeToClient, // NEW
}: {
  lead: Lead;
  idx: number;
  mutate: () => Promise<any>;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onChangeToClient: (id: number) => void; // NEW
}) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rowRef.current && !rowRef.current.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const remove = async () => {
    if (!confirm("Delete this lead?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${BASE}/leads/${lead.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Deleted");
      await mutate();
    } catch (e: any) {
      alert("Error: " + (e.message || e));
    } finally {
      setOpen(false);
    }
  };

  return (
    <TableRow ref={rowRef}>
      <TableCell>{idx + 1}</TableCell>
      <TableCell>
        {/* <Link href={`/leads/${lead.id}`}> */}
        <div className="flex flex-col">
          <span className="font-medium">{lead.name}</span>
          <span className="text-xs text-muted-foreground">{lead.companyName || "—"}</span>
        </div>
        {/* </Link> */}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{lead.email || "—"}</span>
          <span className="text-xs text-muted-foreground">{lead.mobileNumber || "—"}</span>
        </div>
      </TableCell>
      <TableCell>
        <OwnerCell meta={lead.leadOwnerMeta} fallback={lead.leadOwner} />
      </TableCell>
      <TableCell>
        <OwnerCell meta={lead.addedByMeta} fallback={lead.addedBy} />
      </TableCell>
      <TableCell>
        <span className="text-sm">
          {lead.createdAt ?
            //  new Date(lead.createdAt).toLocaleDateString() 
            format(new Date(lead.createdAt), "dd-MM-yyyy")
            : "—"}
        </span>
      </TableCell>

      <TableCell className="relative text-right">
        <button
          onClick={() => {
            setOpen(false);
            onView(lead.id);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
            />
            <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
          </svg>

        </button>

        {open && (
          <div className="absolute right-0 z-30 mt-2 w-56 rounded-md bg-white shadow-lg border">
            <ul className="py-1">
              <li>

              </li>




            </ul>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}


/* =======================
   Main Page
   ======================= */
export default function LeadsAdminPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<Lead[]>("/api/leads/admin/get", fetcher, {
    // const { data, error, isLoading, mutate } = useSWR<Lead[]>("/api/leads/admin/get", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  const { data: employeesData } = useSWR<{ content?: Employee[] }>(`${BASE}/employee/all?page=0&size=2000`, fetcher, {
    revalidateOnFocus: false,
  });
  const employees = (employeesData && (employeesData as any).content) ? (employeesData as any).content : (employeesData as unknown as Employee[]) || [];

  // UI state
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dateFilterOn, setDateFilterOn] = useState<"created" | "updated">("created");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedLeadOwner, setSelectedLeadOwner] = useState<string>("All");
  const [selectedAddedBy, setSelectedAddedBy] = useState<string>("All");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalLeadId, setEditModalLeadId] = useState<number | null>(null);
  const [viewLeadId, setViewLeadId] = useState<number | null>(null);

  const leads = data || [];

  const leadOwners = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.leadOwner) s.add(l.leadOwner);
      if (l.leadOwnerMeta?.name) s.add(l.leadOwnerMeta.name);
    });
    return ["All", ...Array.from(s).sort()];
  }, [leads]);

  const addedByOptions = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => {
      if (l.addedBy) s.add(l.addedBy);
      if (l.addedByMeta?.name) s.add(l.addedByMeta.name);
    });
    return ["All", ...Array.from(s).sort()];
  }, [leads]);

  const parseDate = (s?: string) => {
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (leads || []).filter((l) => {
      if (q) {
        const fields = [
          l.name,
          l.email,
          l.companyName,
          l.city,
          l.country,
          l.status,
          l.leadOwner,
          l.addedBy,
          l.mobileNumber,
        ];
        const matchSearch = fields.some((f) => !!f && f.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }
      if (selectedLeadOwner !== "All") {
        const ownerName = l.leadOwnerMeta?.name || l.leadOwner || "";
        if (ownerName !== selectedLeadOwner) return false;
      }
      if (selectedAddedBy !== "All") {
        const addedByName = l.addedByMeta?.name || l.addedBy || "";
        if (addedByName !== selectedAddedBy) return false;
      }
      if (startDate || endDate) {
        const target = dateFilterOn === "created" ? l.createdAt : l.updatedAt;
        const parsed = parseDate(target);
        if (!parsed) return false;
        if (startDate) {
          const sDate = parseDate(startDate);
          if (!sDate) return false;
          if (parsed < sDate) return false;
        }
        if (endDate) {
          const eDate = parseDate(endDate);
          if (!eDate) return false;
          eDate.setHours(23, 59, 59, 999);
          if (parsed > eDate) return false;
        }
      }
      return true;
    });
  }, [leads, query, selectedLeadOwner, selectedAddedBy, startDate, endDate, dateFilterOn]);

  // open edit modal by id (fetch lead in modal)
  const handleEdit = (id: number) => {
    setEditModalLeadId(id);
  };

  const handleChangeToClient = (id: number) => {
    // router.push(`/clients/changeToClient?leadId=${id}`);
  };

  const handleView = (id: number) => {
    // navigate to view page or open view modal — here we navigate
    router.push(`/employees/leads/admin/get/${id}`);
  };

  const handleConvert = async (id: number) => {
    if (!confirm("Are you sure you want to convert this lead to a client?")) return;
    try {
      const accessToken = localStorage.getItem("accessToken");
      const res = await fetch(`/api/leads/admin/${id}/convert`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Lead converted to client.");
      await mutate();
    } catch (err: any) {
      alert("Error: " + (err?.message || err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;
    try {
      const accessToken = localStorage.getItem("accessToken");
      const res = await fetch(`/api/leads/admin/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error(await res.text());
      await mutate((current) => (current ? current.filter((l) => l.id !== id) : current), { revalidate: true });
      alert("Lead deleted.");
    } catch (err: any) {
      alert("Error: " + (err?.message || err));
    }
  };

  const applyFilters = () => setDrawerOpen(false);
  const clearFilters = () => {
    setDateFilterOn("created");
    setStartDate("");
    setEndDate("");
    setSelectedLeadOwner("All");
    setSelectedAddedBy("All");
  };



  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      {/* header */}







      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center justify-between py-3">



          <Popover>
            <PopoverTrigger asChild>


              <div className="flex items-center   gap-4 cursor-pointer
               border border-gray-300 px-3 py-2 rounded-md hover:border-slate-400 transition

              ">
                <div className="text-sm text-muted-foreground

                ">Duration </div>
                <div className="text-sm text-muted-foreground  font-medium">
                  {startDate && endDate
                    ? `${
                    // new Date(startDate).toLocaleDateString()
                    format(new Date(startDate), "dd-MM-yyyy")
                    } to ${
                    // new Date(endDate).toLocaleDateString()
                    format(new Date(endDate), "dd-MM-yyyy")
                    }`
                    : <div className="flex items-center gap-3">
                      StartDate to EndDate <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    </div>}
                </div>
              </div>

            </PopoverTrigger>

            {/* <PopoverContent className="w-[320px] p-4"> */}
            <PopoverContent
              side="bottom"
              align="start"
              sideOffset={8}
              className="w-[320px] p-0 z-50"
            >

              {/* <div className="space-y-4 bg-white border rounded-md p-4"> */}
              <div className="space-y-4 bg-white p-4">
                <h4 className="font-medium">Select Duration</h4>

                {/* Start Date */}
                <div>
                  <label className="text-sm text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border  px-3 py-2"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="text-sm gap-6 text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                {/* Reset */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>






          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 text-sm text-muted-foreground 
            border border-gray-300 px-3 py-2 rounded-md hover:border-slate-400 transition

 hover:text-slate-700">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M6 12h12M10 18h4" /></svg>
              <span className="hidden sm:inline">Filters</span>
            </button>
            {/* <div className="w-9 h-9 rounded-full bg-gray-200" /> */}
          </div>
        </div>
      </div>



      <Card className="p-4 md:p-6">
        {/* controls */}
        <div className="flex items-start md:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setAddModalOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-sky-700">
              + Add Lead
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search leads" className="border-0 p-0 focus:ring-0" />
            </div>
            {/* <Button variant="secondary" onClick={() => mutate()}>Refresh</Button> */}
          </div>
        </div>

        {/* {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Loading leads…</div>
        )
         */}
        
        


{isLoading ? (
  <div className="mt-4 overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">S.No.</TableHead>
          <TableHead className="min-w-[220px]">Lead Name</TableHead>
          <TableHead>Contact Details</TableHead>
          <TableHead>Lead Owner</TableHead>
          <TableHead>Added By</TableHead>
          <TableHead>Created On</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton width={20} /></TableCell>

            <TableCell>
              <Skeleton width={120} height={14} />
              <Skeleton width={80} height={12} />
            </TableCell>

            <TableCell>
              <Skeleton width={140} height={14} />
              <Skeleton width={100} height={12} />
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton circle width={32} height={32} />
                <div>
                  <Skeleton width={80} height={12} />
                  <Skeleton width={60} height={10} />
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-2">
                <Skeleton circle width={32} height={32} />
                <div>
                  <Skeleton width={80} height={12} />
                  <Skeleton width={60} height={10} />
                </div>
              </div>
            </TableCell>

            <TableCell>
              <Skeleton width={90} height={12} />
            </TableCell>

            <TableCell className="text-right">
              <Skeleton width={24} height={24} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)



        : error ? (
          <div className="py-10 text-center">
            <p className="text-destructive">Failed to load leads.</p>
            <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
            <Button className="mt-4" onClick={() => mutate()}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">No leads found.</div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S.No.</TableHead>
                    <TableHead className="min-w-[220px]">Lead Name</TableHead>
                    <TableHead>Contact Details</TableHead>
                    <TableHead>Lead Owner</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>



                {/* ......... */}
                <TableBody>
                  {filtered.map((lead, idx) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      idx={idx}
                      mutate={() => mutate()}
                      onEdit={(id) => handleEdit(id)}
                      onView={(id) => handleView(id)}
                      onChangeToClient={handleChangeToClient}   // 👈 added
                    />
                  ))}
                </TableBody>

              </Table>
            </div>

            {/* Footer */}
            {/* <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
              <div>Result per page-8</div>
              <div>Page 1 of 1 </div>
              <div className="flex items-center gap-3">
                <button className="p-2 rounded hover:bg-slate-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button className="p-2 rounded hover:bg-slate-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div> */}
          </>
        )}
      </Card>

      {/* Right-side Filters Drawer (same as earlier) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/20" />
          <aside className="absolute right-0 top-0 h-full w-80 bg-white border-l shadow-lg p-6 overflow-auto" role="dialog" aria-label="Filters">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="p-1 rounded hover:bg-slate-100">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Date Filter On</label>
                <select value={dateFilterOn} onChange={(e) => setDateFilterOn(e.target.value as "created" | "updated")} className="block w-full rounded-md border px-3 py-2">
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full rounded-md border px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block w-full rounded-md border px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Lead Owner</label>
                <select value={selectedLeadOwner} onChange={(e) => setSelectedLeadOwner(e.target.value)} className="block w-full rounded-md border px-3 py-2">
                  {leadOwners.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Added by</label>
                <select value={selectedAddedBy} onChange={(e) => setSelectedAddedBy(e.target.value)} className="block w-full rounded-md border px-3 py-2">
                  {addedByOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button onClick={clearFilters} className="rounded-md px-4 py-2 border">Clear</button>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                  <Button onClick={applyFilters}>Apply</Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Add Lead Modal (rendered at top level — outside table) */}
      {addModalOpen && (
        <AddLeadModal
          onClose={() => setAddModalOpen(false)}
          onCreated={async () => {
            setAddModalOpen(false);
            await mutate();
          }}
          employees={employees}
        />
      )}


    </main>
  );
}

/* =======================
   EditLeadModal (simple wrapper that fetches a lead and renders the existing Update form you had)
   This keeps your edit behavior — fetches the single lead and uses the Update form previously posted.
   (I included a compact in-file version so this single file works.)
   ======================= */

function EditLeadModal({ leadId, onClose, onSaved }: { leadId: number; onClose: () => void; onSaved: () => void }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${BASE}/leads/${leadId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(await res.text());
        const j = await res.json();
        if (mounted) setLead(j);
      } catch (err) {
        alert("Failed to load lead: " + (err as any)?.message);
        onClose();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [leadId, onClose]);

  if (loading || !lead) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow">Loading…</div>
      </div>
    );
  }

  // Reuse your earlier EditModal UI (the one you posted) — slightly adapted to accept `lead`
  // For brevity, we call the component UpdateLeadForm which we define below.
  return (
    <UpdateLeadForm lead={lead} onClose={onClose} onSaved={onSaved} />
  );
}

/* UpdateLeadForm: copy of your EditModal form (keeps all fields and logic you posted earlier) */
function UpdateLeadForm({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: lead?.name ?? "",
    email: lead?.email ?? "",
    clientCategory: (lead as any)?.clientCategory ?? "",
    leadSource: (lead as any)?.leadSource ?? "",
    leadOwner: lead?.leadOwner ?? "",
    addedBy: lead?.addedBy ?? "",
    autoConvertToClient: !!(lead as any)?.autoConvertToClient,
    companyName: lead?.companyName ?? "",
    officialWebsite: (lead as any)?.officialWebsite ?? "",
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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
            <button onClick={onClose} className="text-muted-foreground p-1 rounded hover:bg-slate-100">✕</button>
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




              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3">Company Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div>
                  <label className="text-sm text-muted-foreground">Company Name</label>
                  <input className="w-full border rounded-md p-2" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Official Website</label>
                  <input className="w-full border rounded-md p-2" value={form.officialWebsite} onChange={(e) => update("officialWebsite", e.target.value)} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground ">Mobile Number</label>
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










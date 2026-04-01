"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { useAdminLeadsQuery, useCreateLeadMutation, useDealCategoriesQuery, useLeadEmployeesQuery, useLeadSourcesQuery } from "../api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

type Employee = { employeeId: string; name: string; designation?: string };
type DealCategoryItem = { id: number; categoryName: string };
type LeadSourceItem = { id: number; name: string };

type DealPayload = {
  title: string;
  pipeline: string;
  dealStage: string;
  dealCategory: string;
  value: number | "";
  expectedCloseDate: string;
  dealAgent: string;
  dealWatchers: string[]; // array of employeeId
};

type Lead = {
  id: number;
  name: string;
  email: string;
  mobileNumber?: string;
  clientCategory?: string;
  leadSource?: string;
  addedBy?: string;
  leadOwner?: string;
  createDeal?: boolean;
  autoConvertToClient?: boolean;
  deal?: DealPayload;
  companyName?: string;
  officialWebsite?: string;
  officePhone?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  companyAddress?: string;
  createdAt?: string;
  leadOwnerMeta?: { name?: string };
  addedByMeta?: { name?: string };
};

const BASE =  `${process.env.NEXT_PUBLIC_MAIN}`;

const fetcher = async (url: string) => {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No access token found. Please login.");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to fetch");
  }
  return res.json();
};

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
    // close on escape
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    // if lead prop changes, update form
    setForm({
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
  }, [lead]);

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

      // prepare body — convert mobile to number if possible, booleans to boolean
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

      // const json = await res.json();
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

            {/* Contact Details */}
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

            {/* Company Details */}
            <div className="rounded-lg  border p-4">
              <h4 className="font-medium mb-3">Company Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 text-left gap-4">
                <div >
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

            {/* Buttons */}
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

/* ---------------------------
   Main Leads page
   --------------------------- */
export default function LeadsPage() {
  const router = useRouter();

  const leadsQuery = useAdminLeadsQuery({
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const leadsData = leadsQuery.data;
  const leadsError = leadsQuery.error;
  const leadsLoading = leadsQuery.isLoading;
  const mutate = async () => {
    await leadsQuery.refetch();
  };

  // new state to hold which lead is being edited
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const employeesQuery = useLeadEmployeesQuery({
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  const employees = (employeesQuery.data ?? []).map((employee) => ({
    employeeId: employee.employeeId,
    name: employee.name,
    designation: employee.designationName ?? undefined,
  }));

  const [query, setQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!leadsData) return [];
    if (!q) return leadsData;
    return leadsData.filter((l) =>
      [
        l.name,
        l.email,
        l.companyName,
        l.mobileNumber,
        l.clientCategory,
        l.leadSource,
        l.city,
        l.country,
        l.leadOwner,
        l.addedBy,
      ]
        .filter(Boolean)
        .some((f) => (f as string).toLowerCase().includes(q))
    );
  }, [leadsData, query]);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Duration</div>
            <div className="text-sm text-muted-foreground underline">Start Date to End Date</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex items-start md:items-center justify-between gap-3">
        <div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-white text-sm font-medium shadow-sm hover:bg-sky-700"
          >
            + Add Lead
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-md border bg-white px-3 py-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="border-0 p-0 outline-none text-sm" />
          </div>
          <button onClick={() => mutate()} className="inline-flex items-center rounded-md border px-3 py-2 text-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0">
        {leadsLoading ? (
          <div className="p-6 text-center text-muted-foreground">Loading…</div>
        ) : leadsError ? (
          <div className="p-6 text-center text-destructive">{(leadsError as Error).message}</div>
        ) : (
          <div className="overflow-x-auto">
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
                {filtered.map((lead, idx) => (
                  <LeadRow key={lead.id} lead={lead} idx={idx} mutate={mutate} onEdit={(l) => setSelectedLead(l)} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      {selectedLead && (
        <EditModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSaved={async () => {
            setSelectedLead(null);
            await mutate(); // refresh SWR data
          }}
        />
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <div>Result per page - 8</div>
        <div>Page 1 of 1 </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded hover:bg-slate-100">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="p-2 rounded hover:bg-slate-100">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Lead Modal */}
      {addModalOpen && (
        <AddLeadModal
          onClose={() => setAddModalOpen(false)}
          onCreated={() => {
            setAddModalOpen(false);
            mutate();
          }}
          employees={employees}
        />
      )}
    </main>
  );
}

/* ------------------------
   LeadRow (with actions)
   ------------------------ */
function LeadRow({
  lead,
  idx,
  mutate,
  onEdit,
}: {
  lead: Lead;
  idx: number;
  mutate: () => Promise<any>;
  onEdit: (lead: Lead) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(`[data-lead-row="${lead.id}"]`)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, lead.id]);

  const router = useRouter();

  const convert = async () => {
    if (!confirm("Convert this lead to client?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${BASE}/leads/${lead.id}/convert`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Converted to client");
      await mutate();
    } catch (e: any) {
      alert("Error: " + (e.message || e));
    } finally {
      setOpen(false);
    }
  };

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
    <TableRow data-lead-row={`${lead.id}`}>
      <TableCell>{idx + 1}</TableCell>
      <TableCell>
        <Link href={`/leads/${lead.id}`}>
          <div className="flex flex-col">
            <span className="font-medium">{lead.name}</span>
            <span className="text-xs text-muted-foreground">{lead.companyName || "—"}</span>
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{lead.email}</span>
          <span className="text-xs text-muted-foreground">{lead.mobileNumber || "—"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-sm">{lead.leadOwnerMeta?.name || lead.leadOwner || "—"}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-sm">{lead.addedByMeta?.name || lead.addedBy || "—"}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{lead.createdAt ?
        format( new Date(lead.createdAt), "dd-MM-yyyy")
          : "—"}</span>
      </TableCell>

      <TableCell className="relative text-right">
        <button onClick={() => setOpen((s) => !s)} className="inline-flex items-center rounded-full p-2 hover:bg-slate-100">
          <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 z-30 mt-2 w-56 rounded-md bg-white shadow-lg border">
            <ul className="py-1">
              <li>
                <button
                  onClick={() => {
                    setOpen(false);
                    window.location.href = `/leads/admin/get/${lead.id}`;
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                  </svg>
                  View
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setOpen(false);
                    onEdit(lead); // <- open edit modal in parent with this lead
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6L20 10M3 21h6l11-11a2 2 0 00-2-2L7 19v2z" />
                  </svg>
                  Edit
                </button>
              </li>

              <li>
                <button onClick={convert} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50">
                  <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 11c2.21 0 4-1.79 4-4S14.21 3 12 3 8 4.79 8 7s1.79 4 4 4z" />
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
                  </svg>
                  Change to Client
                </button>
              </li>

              <li>
                <button onClick={remove} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-slate-50">
                  <svg className="w-5 h-5 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6M10 6V4a2 2 0 012-2h0a2 2 0 012 2v2" />
                  </svg>
                  Delete
                </button>
              </li>
            </ul>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

/* ---------------------------
   Main Leads page
   --------------------------- */


/* ----------------------------
   AddLeadModal component
   (with server-backed add/list/delete for categories & lead sources)
   ---------------------------- */
export function AddLeadModal({
  onClose,
  onCreated,
  employees,
}: {
  onClose: () => void;
  onCreated: () => void;
  employees: Employee[];
}) {
  const defaultPipelines = ["Default Pipeline", "Sales Pipeline", "Enterprise Pipeline" , "Client Success Pipeline" , "Finance Pipeline" , "Marketing Pipeline"];
  const defaultDealStages = ["Generated", "Qualified", "Proposal", "WIN", "LOST"];

  const createLeadMutation = useCreateLeadMutation();
  const dealCategoriesQuery = useDealCategoriesQuery({ staleTime: 60 * 1000, refetchOnWindowFocus: false });
  const leadSourcesQuery = useLeadSourcesQuery({ staleTime: 60 * 1000, refetchOnWindowFocus: false });

  const dealCategories: DealCategoryItem[] = (dealCategoriesQuery.data ?? [])
    .map((item) => ({ id: item.id, categoryName: item.categoryName || item.name || "" }))
    .filter((item) => item.categoryName);
  const clientCategories: DealCategoryItem[] = dealCategories;
  const leadSources: LeadSourceItem[] = (leadSourcesQuery.data ?? [])
    .map((item) => ({ id: item.id, name: item.name || "" }))
    .filter((item) => item.name);

  const emptyDeal: DealPayload = {
    title: "",
    pipeline: defaultPipelines[0],
    dealStage: defaultDealStages[0],
    dealCategory: "",
    value: "" as unknown as number,
    expectedCloseDate: "",
    dealAgent: "",
    dealWatchers: [],
  };

  const [payload, setPayload] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    clientCategory: "",
    leadSource: "",
    addedBy: "",
    leadOwner: "",
    createDeal: true,
    autoConvertToClient: true,
    deal: emptyDeal,
    companyName: "",
    officialWebsite: "",
    officePhone: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    companyAddress: "",
  });

  // small add-list modal state
  const [addModalOpen, setAddModalOpen] = useState<null | "clientCategory" | "leadSource" | "dealCategory">(null);
  const [addName, setAddName] = useState("");
  const [loadingAddList, setLoadingAddList] = useState(false);
  const [addListItems, setAddListItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // watcher dropdown
  const [watcherDropdownOpen, setWatcherDropdownOpen] = useState(false);
  const [watcherFilter, setWatcherFilter] = useState("");
  const watcherRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (watcherDropdownOpen && watcherRef.current && !watcherRef.current.contains(t)) {
        setWatcherDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [watcherDropdownOpen]);

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

  /* ----- helpers ----- */
  const update = (k: string, v: any) => setPayload((p) => ({ ...p, [k]: v }));
  const updateDeal = (k: keyof DealPayload, v: any) => setPayload((p) => ({ ...p, deal: { ...(p.deal as DealPayload), [k]: v } }));

  const toggleWatcher = (id: string) => {
    setPayload((p) => {
      const s = new Set(p.deal!.dealWatchers || []);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return { ...p, deal: { ...(p.deal as DealPayload), dealWatchers: Array.from(s) } };
    });
  };

  const clearWatchers = () => setPayload((p) => ({ ...p, deal: { ...(p.deal as DealPayload), dealWatchers: [] } }));

  const validate = () => {
    if (!payload.name?.trim() || !payload.email?.trim() || !payload.companyName?.trim()) {
      return "Name, Email and Company Name are required.";
    }
    if (payload.createDeal || payload.autoConvertToClient) {
      const d = payload.deal!;
      if (!d.title?.trim() || !d.value || !d.expectedCloseDate || !d.dealAgent) {
        return "Deal title, value, expected close date and deal agent are required when creating a deal.";
      }
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
      const body: any = {
        name: payload.name,
        email: payload.email,
        mobileNumber: payload.mobileNumber || undefined,
        clientCategory: payload.clientCategory || undefined,
        leadSource: payload.leadSource || undefined,
        addedBy: payload.addedBy || undefined,
        leadOwner: payload.leadOwner || undefined,
        createDeal: !!payload.createDeal,
        autoConvertToClient: !!payload.autoConvertToClient,
        deal: payload.createDeal || payload.autoConvertToClient ? {
          title: payload.deal!.title,
          pipeline: payload.deal!.pipeline,
          dealStage: payload.deal!.dealStage,
          dealCategory: payload.deal!.dealCategory,
          value: Number(payload.deal!.value),
          expectedCloseDate: payload.deal!.expectedCloseDate,
          dealAgent: payload.deal!.dealAgent,
          dealWatchers: payload.deal!.dealWatchers || [],
        } : undefined,
        companyName: payload.companyName,
        officialWebsite: payload.officialWebsite || undefined,
        officePhone: payload.officePhone || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
        postalCode: payload.postalCode || undefined,
        country: payload.country || undefined,
        companyAddress: payload.companyAddress || undefined,
      };

      await createLeadMutation.mutateAsync(body);
      onCreated();
      alert("Lead created successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to create lead.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ----- small add-list helpers ----- */
  const openAddModal = async (type: "clientCategory" | "leadSource" | "dealCategory") => {
    setAddModalOpen(type);
    setAddName("");
    setLoadingAddList(true);
    try {
      if (type === "leadSource") {
        await leadSourcesQuery.refetch();
        setAddListItems(leadSources);
      } else {
        await dealCategoriesQuery.refetch();
        setAddListItems(type === "clientCategory" ? clientCategories : dealCategories);
      }
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
        await leadSourcesQuery.refetch();
        setPayload((p) => ({ ...p, leadSource: created.name || addName.trim() }));
      } else {
        await dealCategoriesQuery.refetch();
        const categoryValue = created.categoryName || created.name || addName.trim();
        setPayload((p) => ({ ...p, deal: { ...(p.deal as DealPayload), dealCategory: categoryValue }, clientCategory: categoryValue }));
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

      if (type === "leadSource") {
        await leadSourcesQuery.refetch();
      } else {
        await dealCategoriesQuery.refetch();
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
                {clientCategories.map((c) => { const label = c.categoryName || (c as any).name || ""; return <option key={c.id} value={label}>{label}</option>; })}
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

          <div className="flex items-center gap-3">
            <input id="createDeal" type="checkbox" checked={!!payload.createDeal} onChange={(e) => update("createDeal", e.target.checked)} />
            <label htmlFor="createDeal" className="text-sm">Create Deal</label>
          </div>

          <div className="flex items-center gap-3">
            <input id="autoConvert" type="checkbox" checked={!!payload.autoConvertToClient} onChange={(e) => update("autoConvertToClient", e.target.checked)} />
            <label htmlFor="autoConvert" className="text-sm">Auto convert on WIN</label>
          </div>
        </div>
      </div>

      {/* Deal Card */}
      {(payload.createDeal || payload.autoConvertToClient) && (
        <div className="bg-white rounded-lg border p-5 shadow-sm flex flex-col">
          <h4 className="text-sm font-medium mb-4 text-left order-first">Deal Details</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-left text-muted-foreground mb-1">Deal Name *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.deal!.title} onChange={(e) => updateDeal("title", e.target.value)} />
            </div>

            <div>
              <label className="block text-xs text-left text-muted-foreground mb-1">Pipeline *</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={payload.deal!.pipeline} onChange={(e) => updateDeal("pipeline", e.target.value)}>
                {defaultPipelines.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-left text-muted-foreground mb-1">Deal Stage *</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={payload.deal!.dealStage} onChange={(e) => updateDeal("dealStage", e.target.value)}>
                {defaultDealStages.map((s) => <option key={s} value={s}>{s === "WIN" ? "Win" : s === "LOST" ? "Lost" : s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-left text-muted-foreground mb-1">Deal Value *</label>
              <div className="flex">
                <div className="px-3 py-2 bg-gray-100 rounded-l text-sm">USD $</div>
                <input className="flex-1 border rounded-r px-3 py-2 text-sm" type="number" value={payload.deal!.value as any} onChange={(e) => updateDeal("value", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-left text-muted-foreground mb-1">Close Date *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" type="date" value={payload.deal!.expectedCloseDate} onChange={(e) => updateDeal("expectedCloseDate", e.target.value)} />
            </div>

            <div>
              <label className="block text-xs text-left text-muted-foreground mb-1">Deal Category</label>
              <div className="flex gap-2">
                <select className="flex-1 border rounded-md px-3 py-2 text-sm" value={payload.deal!.dealCategory} onChange={(e) => updateDeal("dealCategory", e.target.value)}>
                  <option value="">--</option>
                  {dealCategories.map((d) => { const label = d.categoryName || (d as any).name || ""; return <option key={d.id} value={label}>{label}</option>; })}
                </select>
                <button type="button" onClick={() => openAddModal("dealCategory")} className="px-3 py-2 rounded border text-sm">Add</button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-left text-muted-foreground mb-1">Deal Agent *</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={payload.deal!.dealAgent} onChange={(e) => updateDeal("dealAgent", e.target.value)}>
                <option value="">--</option>
                {employees.map((emp) => <option key={emp.employeeId} value={emp.employeeId}>{emp.name} ({emp.employeeId})</option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs text-left text-muted-foreground mb-1">Deal Watcher(s)</label>
              <div ref={watcherRef} className="relative">
                <button type="button" onClick={() => setWatcherDropdownOpen((s) => !s)} className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-white">
                  <div className="truncate">
                    {payload.deal!.dealWatchers.length === 0 ? "-- select --" : payload.deal!.dealWatchers.map((id) => employees.find((emp) => emp.employeeId === id)?.name ?? id).join(", ")}
                  </div>
                  <div className="ml-2">
                    {payload.deal!.dealWatchers.length > 0 && (<button type="button" onClick={(e) => { e.stopPropagation(); clearWatchers(); }} className="text-xs px-2 py-1 rounded hover:bg-slate-100">Clear</button>)}
                  </div>
                </button>

                {watcherDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 z-40 rounded-md bg-white border shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b">
                      <input className="w-full border rounded-md p-2 text-sm" placeholder="Search employees..." value={watcherFilter} onChange={(e) => setWatcherFilter(e.target.value)} />
                    </div>
                    <ul className="p-2 space-y-1">
                      {employees.filter((emp) => emp.name.toLowerCase().includes(watcherFilter.trim().toLowerCase()) || emp.employeeId.toLowerCase().includes(watcherFilter.trim().toLowerCase())).map((emp) => {
                        const checked = payload.deal!.dealWatchers.includes(emp.employeeId);
                        return (
                          <li key={emp.employeeId}>
                            <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer text-sm">
                              <input type="checkbox" checked={checked} onChange={() => toggleWatcher(emp.employeeId)} />
                              <span>{emp.name} <span className="text-xs text-muted-foreground">({emp.employeeId})</span></span>
                            </label>
                          </li>
                        );
                      })}
                      {employees.length === 0 && <li className="p-2 text-sm text-muted-foreground">No employees</li>}
                    </ul>
                    <div className="p-2 border-t flex justify-end gap-2">
                      <button type="button" onClick={() => setWatcherDropdownOpen(false)} className="rounded-md px-3 py-1 border text-sm">Done</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 text-sm text-muted-foreground">Selected: {payload.deal!.dealWatchers.length === 0 ? "—" : payload.deal!.dealWatchers.map((id) => employees.find((emp) => emp.employeeId === id)?.name ?? id).join(", ")}</div>
            </div>
          </div>
        </div>
      )}

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
            <label className="block text-xs text-left text-muted-foreground mb-1">Country</label>
            <input className="w-full border rounded-md px-3 py-2 text-sm" value={payload.country} onChange={(e) => update("country", e.target.value)} />
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
      <div className="absolute inset-0 bg-yellow/20" onClick={() => setAddModalOpen(null)} />
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

  /* ---------------- final render ---------------- */
  return (
    <>
      <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
        {/* backdrop */}
        <div className="absolute inset-0 bg-yellow/50 transition-opacity" onClick={onClose} />

        {/* slide-in panel: 80% width on desktop, full on mobile */}
        <aside
          className={[
            "absolute right-0 top-0 h-full bg-gray-50 flex flex-col",
            "w-full sm:w-[80vw] max-w-full",
            "transform transition-transform duration-300 ease-out",
            visible ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
          style={{ willChange: "transform" }}
        >
          {/* header (left-aligned title) */}
          <div className="flex items-start justify-between p-4 border-b bg-white sticky top-0 z-10">
            <div>
              <h3 className="text-lg font-semibold text-left">Add Lead Contact Information </h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-2 rounded hover:bg-slate-100">✕</button>
            </div>
          </div>

          {/* body */}
          <div className="p-6 overflow-auto flex-1">
            {FormContent}
          </div>

        </aside>
      </div>

      {/* small add-list modal */}
      {SmallAddListModal}
    </>
  );
}







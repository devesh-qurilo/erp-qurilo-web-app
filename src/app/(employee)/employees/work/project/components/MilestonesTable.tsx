"use client";
import React, { useEffect, useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type Milestone = {
  id?: number;
  title: string;
  milestoneCost?: number;
  taskCount?: number;
  status?: string;
  summary?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  [k: string]: any;
};

const DEFAULT_MAIN = process.env.NEXT_PUBLIC_MAIN ;

// Temporary provided token (for local testing only). DON'T commit real tokens.
const PROVIDED_TOKEN = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
export default function MilestonesTable({
  projectId,
  gatewayPath = "/api/projects",
  authToken = PROVIDED_TOKEN,
  mainBase,
}: {
  projectId: number | string;
  gatewayPath?: string;
  authToken?: string | null;
  mainBase?: string | null;
}) {
  const MAIN = (mainBase || DEFAULT_MAIN).replace(/\/$/, "");
  const [rows, setRows] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals & form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [selected, setSelected] = useState<Milestone | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    milestoneCost: "",
    // taskCount removed from forms per request
    status: "INCOMPLETE", // default uppercase
    summary: "",
    startDate: "",
    endDate: "",
  });

  // dropdown state
  const [actionOpenFor, setActionOpenFor] = useState<number | null>(null);
  const [statusMenuOpenFor, setStatusMenuOpenFor] = useState<number | null>(null);

  // build URL helper
  const buildUrl = (path: string) => {
    const p = String(path || "");
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    if (p.startsWith("/")) return `${MAIN}${p}`;
    return `${MAIN}/${p}`;
  };

  const headers = (extra: Record<string, string> = {}) => {
    const h: Record<string, string> = { ...extra };
    if (authToken) h["Authorization"] = `Bearer ${authToken}`;
    return h;
  };

  // fetch wrapper
  const doFetch = async (url: string, init: RequestInit = {}, msTimeout = 15000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), msTimeout);
    try {
      const merged = { ...init, signal: controller.signal };
      const res = await fetch(url, merged);
      clearTimeout(timeout);

      const ct = res.headers.get("content-type") || "";
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        if (ct.includes("text/html") || text.trim().startsWith("<!DOCTYPE html")) {
          throw new Error(
            `HTTP ${res.status} ${res.statusText} — server returned HTML. Snippet: ${text.slice(0, 300)}`
          );
        }
        if (ct.includes("application/json")) {
          try {
            const json = JSON.parse(text || "{}");
            throw new Error(`HTTP ${res.status} ${res.statusText} — ${JSON.stringify(json)}`);
          } catch {}
        }
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? "- " + text.slice(0, 300) : ""}`);
      }

      if (ct.includes("application/json")) return JSON.parse(text || "[]");
      return text;
    } catch (err: any) {
      if (err.name === "AbortError") throw new Error("Request timed out");
      if (err.message === "Failed to fetch") throw new Error("Network Error - check CORS / server availability");
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  };

  // parse & validate projectId to avoid accidental "{{projectId}}"
  const parsedProjectId = useMemo(() => {
    if (projectId === null || projectId === undefined) return null;
    const s = String(projectId).trim();
    if (/{{\s*projectId\s*}}/.test(s)) return "__INVALID_PLACEHOLDER__";
    const n = Number(s);
    if (Number.isNaN(n)) return "__INVALID_NUMBER__";
    return n;
  }, [projectId]);

  // fetch list
  const fetchMilestones = async () => {
    setLoading(true);
    setError(null);
    try {
      if (parsedProjectId === null) {
        setError("projectId is required.");
        setRows([]);
        setLoading(false);
        return;
      }
      if (parsedProjectId === "__INVALID_PLACEHOLDER__") {
        setError('projectId looks like a template placeholder ("{{projectId}}"). Pass a real numeric id.');
        setRows([]);
        setLoading(false);
        return;
      }
      if (parsedProjectId === "__INVALID_NUMBER__") {
        setError(`projectId "${projectId}" is not a valid number.`);
        setRows([]);
        setLoading(false);
        return;
      }

      const url = buildUrl(`${gatewayPath}/${parsedProjectId}/milestones`);
      console.info("[milestones] GET", url, "AuthPresent:", !!authToken);
      const res = await doFetch(url, {
        method: "GET",
        headers: headers({ "Content-Type": "application/json" }),
        credentials: "same-origin",
      });

      if (Array.isArray(res)) setRows(res as Milestone[]);
      else if (res?.data && Array.isArray(res.data)) setRows(res.data);
      else if (res?.milestones && Array.isArray(res.milestones)) setRows(res.milestones);
      else {
        console.warn("Unexpected milestones response:", res);
        setRows([]);
        setError("Unexpected response shape from server. See console.");
      }
    } catch (err: any) {
      console.error("fetchMilestones error:", err);
      setRows([]);
      setError(err?.message || "Failed to load milestones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, refreshKey]);

  // helpers
  const formatCurrency = (v?: number) => {
    if (typeof v !== "number") return "-";
    return `$${v.toFixed(2)}`;
  };

  // open create modal
  const openCreate = () => {
    setForm({
      title: "",
      milestoneCost: "",
      status: "INCOMPLETE",
      summary: "",
      startDate: "",
      endDate: "",
    });
    setSaveError(null);
    setIsCreateOpen(true);
  };

  // open view modal
  const openView = (m: Milestone) => {
    setSelected(m);
    setIsViewOpen(true);
    setActionOpenFor(null);
  };

  // open edit modal
  const openEdit = (m: Milestone) => {
    setSelected(m);
    setForm({
      title: m.title || "",
      milestoneCost: String(m.milestoneCost ?? ""),
      status: (m.status || "INCOMPLETE").toUpperCase(),
      summary: m.summary ?? "",
      startDate: m.startDate ? String(m.startDate).slice(0, 10) : "", // prefer ISO date portion
      endDate: m.endDate ? String(m.endDate).slice(0, 10) : "",
    });
    setSaveError(null);
    setIsEditOpen(true);
    setActionOpenFor(null);
  };

  // open delete confirm
  const openDelete = (m: Milestone) => {
    setSelected(m);
    setIsDeleteConfirmOpen(true);
    setActionOpenFor(null);
  };

  // create
  const createMilestone = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (!form.title?.trim()) {
        setSaveError("Title is required.");
        setSaving(false);
        return;
      }
      if (typeof parsedProjectId !== "number") {
        setSaveError("Invalid projectId.");
        setSaving(false);
        return;
      }
      const payload = {
        title: form.title.trim(),
        milestoneCost: Number(form.milestoneCost || 0),
        // note: taskCount intentionally not sent (removed from form)
        status: (form.status || "INCOMPLETE").toUpperCase(),
        summary: form.summary?.trim() || "",
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      const url = buildUrl(`${gatewayPath}/${parsedProjectId}/milestones`);
      await doFetch(url, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      setIsCreateOpen(false);
      setForm({
        title: "",
        milestoneCost: "",
        status: "INCOMPLETE",
        summary: "",
        startDate: "",
        endDate: "",
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("createMilestone error:", err);
      setSaveError(err?.message || "Failed to create milestone");
    } finally {
      setSaving(false);
    }
  };

  // update (PUT)
  const updateMilestone = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (!selected?.id) {
        setSaveError("No milestone selected for update.");
        setSaving(false);
        return;
      }
      if (!form.title?.trim()) {
        setSaveError("Title is required.");
        setSaving(false);
        return;
      }
      const payload = {
        title: form.title.trim(),
        milestoneCost: Number(form.milestoneCost || 0),
        status: (form.status || "INCOMPLETE").toUpperCase(),
        summary: form.summary?.trim() || "",
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      const url = buildUrl(`${gatewayPath}/${parsedProjectId}/milestones/${selected.id}`);
      await doFetch(url, {
        method: "PUT",
        headers: headers({ "Content-Type": "application/json" }),
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      setIsEditOpen(false);
      setSelected(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("updateMilestone error:", err);
      setSaveError(err?.message || "Failed to update milestone");
    } finally {
      setSaving(false);
    }
  };

  // delete
  const deleteMilestone = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (!selected?.id) {
        setSaveError("No milestone selected for delete.");
        setSaving(false);
        return;
      }
      const url = buildUrl(`${gatewayPath}/${parsedProjectId}/milestones/${selected.id}`);
      await doFetch(url, {
        method: "DELETE",
        headers: headers({ "Content-Type": "application/json" }),
        credentials: "same-origin",
      });
      setIsDeleteConfirmOpen(false);
      setSelected(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("deleteMilestone error:", err);
      setSaveError(err?.message || "Failed to delete milestone");
    } finally {
      setSaving(false);
    }
  };

  // change status using the explicit endpoint you provided:
  // /api/projects/{projectId}/milestones/{milestoneId}/status
  // IMPORTANT: this now sends FormData with field name "status"
  const changeStatus = async (m: Milestone, newStatus: "COMPLETED" | "INCOMPLETE" | string) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (!m?.id) {
        setSaveError("Invalid milestone");
        setSaving(false);
        return;
      }

      const url = buildUrl(`${gatewayPath}/${parsedProjectId}/milestones/${m.id}/status`);

      // Build FormData and append 'status' field (server expects form field named 'status')
      const fd = new FormData();
      fd.append("status", String(newStatus).toUpperCase());

      // IMPORTANT: do not set Content-Type header manually for FormData requests.
      // Include only Authorization (if present).
      await doFetch(url, {
        method: "PATCH",
        headers: headers(), // don't pass Content-Type so browser adds multipart/form-data boundary
        credentials: "same-origin",
        body: fd,
      });

      setStatusMenuOpenFor(null);
      setActionOpenFor(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("changeStatus error:", err);
      setSaveError(err?.message || "Failed to change status");
    } finally {
      setSaving(false);
    }
  };

  // UI helpers for status colors (supports both old and uppercase)
  const statusIsCompleted = (s?: string) => {
    const st = String(s || "").toLowerCase();
    return st === "complete" || st === "completed";
  };

  // simpler color helpers (also tolerant)
  const statusClasses = (s?: string) => {
    const st = String(s || "").toLowerCase();
    if (st === "complete" || st === "completed" || String(s) === "COMPLETED") {
      return "bg-green-50 text-green-700 border-green-200";
    }
    return "bg-red-50 text-red-700 border-red-200";
  };

  const dotColor = (s?: string) => {
    const st = String(s || "").toLowerCase();
    if (st === "complete" || st === "completed" || String(s) === "COMPLETED") return "bg-green-600";
    return "bg-red-600";
  };

  // render
  return (
    <div className="p-6 bg-white rounded shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Milestones</h2>

      {/* top controls: button on left, filters/actions on right */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {/* <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            + Create Milestone
          </button> */}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="bg-gray-100 px-3 py-2 rounded text-sm border hover:bg-gray-200"
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* table */}
      <div className="rounded-md border h-full overflow-hidden">
        <div className="bg-blue-50 text-gray-700 text-sm">
          <div className="grid grid-cols-12 gap-0 items-center px-4 py-3">
            <div className="col-span-4 font-medium">Title</div>
            <div className="col-span-2 font-medium">Milestone Cost</div>
            <div className="col-span-2 font-medium">Task Count</div>
            <div className="col-span-2 font-medium">Status</div>
            {/* <div className="col-span-2 font-medium text-right">Action</div> */}
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading milestones...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No milestones found</div>
        ) : (
          <div>
            {rows.map((m) => (
              <div key={m.id ?? Math.random()} className="grid grid-cols-12 gap-0 items-center px-4 py-4 border-t">
                <div className="col-span-4 text-sm">{m.title}</div>
                <div className="col-span-2 text-sm">{formatCurrency(m.milestoneCost)}</div>
                <div className="col-span-2 text-sm">{String(m.taskCount ?? "00").padStart(2, "0")}</div>

                {/* STATUS with dropdown - styled to look like your screenshot */}
                <div className="col-span-2 text-sm">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setStatusMenuOpenFor(statusMenuOpenFor === m.id ? null : (m.id ?? null))}
                      className={`inline-flex items-center justify-between w-full gap-2 px-3 py-1 rounded-md border text-sm bg-white ${statusIsCompleted(m.status) ? "border-green-200" : "border-gray-200"}`}
                      title="Change status"
                      aria-haspopup="true"
                      aria-expanded={statusMenuOpenFor === m.id}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotColor(m.status)}`} />
                        <span className="uppercase">{String(m.status || "INCOMPLETE").toUpperCase()}</span>
                      </div>

                      {/* small down chevron */}
                      <svg className="w-3 h-3 shrink-0 text-gray-500" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {statusMenuOpenFor === m.id && (
                      <div className="absolute mt-2 right-0 z-20 w-44 bg-white border rounded-md shadow-lg">
                        <button
                          onClick={() => changeStatus(m, "COMPLETED")}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center justify-between ${statusIsCompleted(m.status) ? "font-semibold" : ""}`}
                        >
                          <span>COMPLETED</span>
                          {statusIsCompleted(m.status) && (
                            <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>

                        <button
                          onClick={() => changeStatus(m, "INCOMPLETE")}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center justify-between ${!statusIsCompleted(m.status) ? "font-semibold" : ""}`}
                        >
                          <span>INCOMPLETE</span>
                          {!statusIsCompleted(m.status) && (
                            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                
              </div>
            ))}
          </div>
        )}

        {/* footer */}
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600">
          <div>Result per page - {rows.length ? rows.length : 0}</div>
          <div>Page 1 of 1</div>
        </div>
      </div>

      {/* Create modal */}
    

      {/* View modal */}
      

      {/* Edit modal */}
     

      {/* Delete confirm modal */}
     
    </div>
  );
}

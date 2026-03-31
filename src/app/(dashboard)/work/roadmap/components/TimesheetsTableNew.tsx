// components/TimesheetsTableNew.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { UserIcon, XMarkIcon } from "@heroicons/react/24/outline";

type EmployeeItem = {
  employeeId: string;
  name?: string | null;
  profileUrl?: string | null;
  designation?: string | null;
  department?: string | null;
};

type Timesheet = {
  id: number;
  projectId?: number;
  taskId?: number;
  employeeId?: string;
  employees?: EmployeeItem[];
  startDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:MM:SS or HH:MM
  endDate?: string;
  endTime?: string;
  memo?: string | null;
  durationHours?: number;
  createdBy?: string;
  createdAt?: string; // ISO
};

const DEFAULT_MAIN = process.env.NEXT_PUBLIC_MAIN ;

// *** default token (from your message). For prod DO NOT hardcode.
const PROVIDED_TOKEN = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
export default function TimesheetsTableNew({
  gatewayPath = "/timesheets",
  mainBase,
  authToken = PROVIDED_TOKEN,
}: {
  gatewayPath?: string;
  mainBase?: string;
  authToken?: string | null;
}) {
  const MAIN = (mainBase || DEFAULT_MAIN).replace(/\/$/, "");
  const [data, setData] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // search / filters
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("All");

  // modal/form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    projectId: "",
    taskId: "",
    employeeId: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    memo: "",
  });

  // action dropdown + view/delete modals
  const [actionOpenFor, setActionOpenFor] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Timesheet | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // helpers
  const buildUrl = (path: string) => {
    const p = String(path || "");
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    if (p.startsWith("/")) return `${MAIN}${p}`;
    return `${MAIN}/${p}`;
  };

  const headersWithAuth = (extra: Record<string, string> = {}) => {
    const h: Record<string, string> = { ...extra };
    if (authToken) h["Authorization"] = `Bearer ${authToken}`;
    return h;
  };

  // fetch wrapper with timeout + helpful errors
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
        if (ct.includes("application/json")) {
          try {
            const json = JSON.parse(text || "{}");
            const msg = json?.message || JSON.stringify(json);
            throw new Error(`HTTP ${res.status} ${res.statusText} — ${msg}`);
          } catch {
            throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0, 300)}`);
          }
        }
        if (ct.includes("text/html") || text.trim().startsWith("<!DOCTYPE html")) {
          throw new Error(`HTTP ${res.status} ${res.statusText} — server returned HTML (likely auth).`);
        }
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? "- " + text.slice(0, 300) : ""}`);
      }
      if (ct.includes("application/json")) {
        return JSON.parse(text || "[]");
      }
      return text;
    } catch (err: any) {
      if (err.name === "AbortError") throw new Error("Request timed out");
      if (err.message === "Failed to fetch") throw new Error("Network Error - check CORS / server availability");
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  };

  // fetch timesheets
  const fetchTimesheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildUrl(gatewayPath);
      const res = await doFetch(url, {
        method: "GET",
        headers: headersWithAuth({ "Content-Type": "application/json" }),
        credentials: "same-origin",
      });
      if (Array.isArray(res)) setData(res as Timesheet[]);
      else if (res?.data && Array.isArray(res.data)) setData(res.data);
      else {
        console.warn("Unexpected timesheets response:", res);
        setData([]);
        setError("Unexpected response shape from server. See console.");
      }
    } catch (err: any) {
      console.error("fetchTimesheets error:", err);
      setData([]);
      setError(err?.message || "Failed to load timesheets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // derive employees for filter/select
  const employeeList = useMemo(() => {
    const map = new Map<string, EmployeeItem>();
    data.forEach((r) => {
      const e = r.employees && r.employees[0];
      if (e && e.employeeId) map.set(e.employeeId, e);
      else if (r.employeeId) map.set(r.employeeId, { employeeId: r.employeeId });
    });
    return Array.from(map.values());
  }, [data]);

  // filtered rows
  const filtered = data.filter((row) => {
    if (employeeFilter !== "All" && row.employeeId !== employeeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const emp = row.employees && row.employees[0];
    return (
      String(row.employeeId || "").toLowerCase().includes(q) ||
      String(row.projectId || "").toLowerCase().includes(q) ||
      String(row.taskId || "").toLowerCase().includes(q) ||
      String(row.memo || "").toLowerCase().includes(q) ||
      String(emp?.name || "").toLowerCase().includes(q)
    );
  });

  // helpers to format
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatDateTimeDisplay = (date?: string, time?: string) => {
    if (!date) return "-";
    // date: YYYY-MM-DD, time: HH:MM or HH:MM:SS
    try {
      const [y, m, d] = date.split("-").map(Number);
      let hh = 0,
        mm = 0;
      if (time) {
        const parts = time.split(":").map(Number);
        hh = parts[0] ?? 0;
        mm = parts[1] ?? 0;
      }
      const dt = new Date(y, m - 1, d, hh, mm);
      // format DD/MM/YYYY hh:mm AM/PM
      const day = pad(dt.getDate());
      const mon = pad(dt.getMonth() + 1);
      const year = dt.getFullYear();
      let hours = dt.getHours();
      const minutes = pad(dt.getMinutes());
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const hoursStr = pad(hours);
      return `${day}/${mon}/${year} ${hoursStr}:${minutes} ${ampm}`;
    } catch {
      return date + (time ? ` ${time}` : "");
    }
  };

  const fmtDateTime = (date?: string, time?: string) => {
    return formatDateTimeDisplay(date, time);
  };

  const computeDurationHours = (sDate?: string, sTime?: string, eDate?: string, eTime?: string) => {
    if (!sDate || !eDate) return 0;
    try {
      const sParts = sDate.split("-").map(Number);
      const eParts = eDate.split("-").map(Number);
      let sH = 0,
        sM = 0,
        eH = 0,
        eM = 0;
      if (sTime) [sH, sM] = sTime.split(":").map((v) => Number(v));
      if (eTime) [eH, eM] = eTime.split(":").map((v) => Number(v));
      const start = new Date(sParts[0], sParts[1] - 1, sParts[2], sH, sM);
      const end = new Date(eParts[0], eParts[1] - 1, eParts[2], eH, eM);
      const diffMs = end.getTime() - start.getTime();
      if (isNaN(diffMs) || diffMs <= 0) return 0;
      return Math.round(diffMs / (1000 * 60 * 60)); // hours
    } catch {
      return 0;
    }
  };

  const modalTotalHours = computeDurationHours(form.startDate, form.startTime, form.endDate, form.endTime);

  // open modal to create new or edit existing
  const openModal = (row?: Timesheet) => {
    if (!row) {
      setEditingId(null);
      setForm({
        projectId: "",
        taskId: "",
        employeeId: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        memo: "",
      });
    } else {
      setEditingId(row.id);
      setForm({
        projectId: String(row.projectId ?? ""),
        taskId: String(row.taskId ?? ""),
        employeeId: row.employeeId ?? "",
        startDate: row.startDate ?? "",
        startTime: row.startTime ?? "",
        endDate: row.endDate ?? "",
        endTime: row.endTime ?? "",
        memo: row.memo ?? "",
      });
    }
    setSaveError(null);
    setIsModalOpen(true);
  };

  // View row (read-only modal)
  const openView = (row: Timesheet) => {
    setSelectedRow(row);
    setIsViewOpen(true);
    setActionOpenFor(null);
  };

  // Delete flow
  const openDelete = (row: Timesheet) => {
    setSelectedRow(row);
    setIsDeleteConfirmOpen(true);
    setActionOpenFor(null);
  };

  const deleteTimesheet = async () => {
    if (!selectedRow) return;
    setSaving(true);
    setSaveError(null);
    try {
      const url = buildUrl(`${gatewayPath}/${selectedRow.id}`);
      await doFetch(url, {
        method: "DELETE",
        headers: headersWithAuth({ "Content-Type": "application/json" }),
        credentials: "same-origin",
      });
      setIsDeleteConfirmOpen(false);
      setSelectedRow(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("deleteTimesheet error:", err);
      setSaveError(err?.message || "Failed to delete timesheet");
    } finally {
      setSaving(false);
    }
  };

  // save (create or update)
  const saveEntry = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // validation
      if (!form.projectId || !form.taskId || !form.employeeId || !form.startDate || !form.startTime || !form.endDate || !form.endTime || !form.memo) {
        setSaveError("Please fill all required fields.");
        setSaving(false);
        return;
      }

      const payload: any = {
        projectId: Number(form.projectId),
        taskId: Number(form.taskId),
        employeeId: form.employeeId,
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate,
        endTime: form.endTime,
        memo: form.memo,
        durationHours: computeDurationHours(form.startDate, form.startTime, form.endDate, form.endTime),
      };

      const url = buildUrl(gatewayPath) + (editingId ? `/${editingId}` : "");
      const method = editingId ? "PUT" : "POST";

      await doFetch(url, {
        method,
        headers: headersWithAuth({ "Content-Type": "application/json" }),
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      setIsModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      console.error("saveEntry error:", err);
      setSaveError(err?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Timesheet</h2>

        <div className="flex items-center gap-3">
          <label className="text-sm">Employee</label>
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="All">All</option>
            {employeeList.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.name ? `${e.name} (${e.employeeId})` : e.employeeId}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700">
            + Log Time
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setRefreshKey((k) => k + 1)} className="bg-gray-100 px-3 py-2 rounded text-sm border hover:bg-gray-200">
            Refresh
          </button>

          <input type="search" placeholder="Search employee, memo, project..." value={search} onChange={(e) => setSearch(e.target.value)} className="border px-3 py-2 rounded-md text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-gray-500">Loading timesheets...</div>
      ) : (
        <>
          {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700"><strong>Error:</strong> {error}</div>}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-left text-gray-600">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Start Time</th>
                  <th className="px-4 py-3">End Time</th>
                  <th className="px-4 py-3">Total Hours</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-500">No timesheets found</td></tr>
                ) : (
                  filtered.map((row) => {
                    const emp = row.employees && row.employees[0];
                    const code = `RTA-${String(row.id).padStart(2, "0")}`;
                    const taskLabel = `Task ${row.taskId ?? "-"} · Project ${row.projectId ?? "-"}`;
                    return (
                      <tr key={row.id} className="border-b last:border-b-0 bg-white hover:bg-gray-50">
                        <td className="px-4 py-4 align-top">{code}</td>

                        <td className="px-4 py-4 align-top">
                          <div className="text-sm font-medium">{taskLabel}</div>
                          <div className="text-xs text-gray-400">{row.memo ?? ""}</div>
                        </td>

                        <td className="px-4 py-4 align-top flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            {emp?.profileUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={emp.profileUrl} alt={emp?.name ?? ""} className="w-full h-full object-cover" />
                            ) : <UserIcon className="w-6 h-6 text-gray-400 p-1" />}
                          </div>

                          <div>
                            <div className="font-medium">{emp?.name || row.employeeId}</div>
                            <div className="text-xs text-gray-500">{emp?.designation || emp?.department || row.employeeId}</div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">{fmtDateTime(row.startDate, row.startTime)}</td>
                        <td className="px-4 py-4 align-top">{fmtDateTime(row.endDate, row.endTime)}</td>
                        <td className="px-4 py-4 align-top">{typeof row.durationHours === "number" ? `${row.durationHours}h` : "-"}</td>

                        <td className="px-4 py-4 align-top">
                          <div className="relative inline-block text-left">
                            {/* Three-dot button */}
                            <button
                              onClick={() => setActionOpenFor(actionOpenFor === row.id ? null : row.id)}
                              className="px-2 py-1 border rounded text-sm"
                              aria-haspopup="true"
                              aria-expanded={actionOpenFor === row.id}
                              title="More"
                            >
                              ⋮
                            </button>

                            {/* Dropdown */}
                            {actionOpenFor === row.id && (
                              <div className="absolute right-0 mt-2 z-30 w-40 bg-white border rounded-md shadow-lg text-sm">
                                <button
                                  onClick={() => openView(row)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                >
                                  View
                                </button>

                                <button
                                  onClick={() => { openModal(row); setActionOpenFor(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                >
                                  Edit
                                </button>

                                <button
                                  onClick={() => openDelete(row)}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Log Time Modal (create/edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />

          <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">{editingId ? "Edit TimeLog" : "Log Time"}</h3>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => setIsModalOpen(false)} aria-label="Close">
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-white rounded-md border p-6">
                <h4 className="text-md font-medium mb-4">TimeLog Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Project *</label>
                    <input value={form.projectId} onChange={(e) => setForm((s) => ({ ...s, projectId: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Project ID" type="text" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Task *</label>
                    <input value={form.taskId} onChange={(e) => setForm((s) => ({ ...s, taskId: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Task ID" type="text" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Employee *</label>
                    <select value={form.employeeId} onChange={(e) => setForm((s) => ({ ...s, employeeId: e.target.value }))} className="w-full border rounded px-3 py-2">
                      <option value="">--</option>
                      {employeeList.map((e) => (
                        <option key={e.employeeId} value={e.employeeId}>
                          {e.name ? `${e.name} (${e.employeeId})` : e.employeeId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Start Date *</label>
                    <input type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Start Time *</label>
                    <input type="time" value={form.startTime} onChange={(e) => setForm((s) => ({ ...s, startTime: e.target.value }))} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">End Date *</label>
                    <input type="date" value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">End Time *</label>
                    <input type="time" value={form.endTime} onChange={(e) => setForm((s) => ({ ...s, endTime: e.target.value }))} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Memo *</label>
                    <input type="text" value={form.memo} onChange={(e) => setForm((s) => ({ ...s, memo: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Memo" />
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Hours</div>
                    <div className="text-2xl font-semibold text-blue-600">{modalTotalHours}h</div>
                  </div>
                </div>

                {saveError && <div className="mt-4 text-sm text-red-600">{saveError}</div>}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-center gap-6 mt-8 pb-6">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-md border text-blue-600" disabled={saving}>Cancel</button>

                <button onClick={saveEntry} className="px-6 py-2 rounded-md bg-blue-600 text-white shadow" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal - redesigned to match provided screenshot */}
      {isViewOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsViewOpen(false)} />

          <div className="relative bg-white w-full max-w-6xl rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">Timesheet</h3>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => setIsViewOpen(false)} aria-label="Close">
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* grid: left big card + right small history card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Big Card */}
                <div className="lg:col-span-2 relative bg-white rounded-xl border p-6">
                  {/* three-dot icon top-right inside card */}
                  <div className="absolute top-4 right-4 text-gray-500">⋮</div>

                  <h4 className="text-lg font-medium mb-4">TimeLog Details</h4>

                  <div className="grid grid-cols-3 gap-y-4 gap-x-6 items-center text-sm">
                    <div className="text-gray-500">Start Time</div>
                    <div className="col-span-2">{fmtDateTime(selectedRow.startDate, selectedRow.startTime)}</div>

                    <div className="text-gray-500">End Time</div>
                    <div className="col-span-2">{fmtDateTime(selectedRow.endDate, selectedRow.endTime)}</div>

                    <div className="text-gray-500">Total Hours</div>
                    <div className="col-span-2">{typeof selectedRow.durationHours === "number" ? `${selectedRow.durationHours}h` : "-"}</div>

                    <div className="text-gray-500">Memo</div>
                    <div className="col-span-2">{selectedRow.memo ?? "-"}</div>

                    <div className="text-gray-500">Project</div>
                    <div className="col-span-2">Project {selectedRow.projectId ?? "-"}</div>

                    <div className="text-gray-500">Task</div>
                    <div className="col-span-2">Task {selectedRow.taskId ?? "-"}</div>

                    <div className="text-gray-500">Employee</div>
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {selectedRow.employees && selectedRow.employees[0]?.profileUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedRow.employees![0]!.profileUrl!} alt={selectedRow.employees![0]!.name ?? ""} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-gray-400 p-1" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{selectedRow.employees && selectedRow.employees[0]?.name ? selectedRow.employees[0]!.name : selectedRow.employeeId}</div>
                        <div className="text-xs text-gray-500">{selectedRow.employees && selectedRow.employees[0]?.designation ? selectedRow.employees[0]!.designation : ""}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: History Card */}
                <div className="bg-white rounded-xl border p-5">
                  <h5 className="font-medium mb-3">History</h5>

                  <div className="space-y-4 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <div className="text-gray-500">Start Time</div>
                      <div>{fmtDateTime(selectedRow.startDate, selectedRow.startTime)}</div>
                    </div>

                    <div className="flex justify-between">
                      <div className="text-gray-500">Task</div>
                      <div>Task {selectedRow.taskId ?? "-"}</div>
                    </div>

                    <div className="flex justify-between">
                      <div className="text-gray-500">End Time</div>
                      <div>{fmtDateTime(selectedRow.endDate, selectedRow.endTime)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* footer buttons */}
              <div className="flex items-center justify-center gap-6 mt-8 pb-6">
                <button onClick={() => setIsViewOpen(false)} className="px-6 py-2 rounded-md border text-blue-600">Close</button>
                <button onClick={() => { openModal(selectedRow); setIsViewOpen(false); }} className="px-6 py-2 rounded-md bg-blue-600 text-white">Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {isDeleteConfirmOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteConfirmOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Delete TimeLog</h3>
              <p className="text-sm text-gray-700">Are you sure you want to delete timesheet <strong>RTA-{String(selectedRow.id).padStart(2, "0")}</strong>? This action cannot be undone.</p>

              {saveError && <div className="mt-4 text-sm text-red-600">{saveError}</div>}

              <div className="flex items-center justify-end gap-4 mt-6">
                <button className="px-4 py-2 rounded border" onClick={() => setIsDeleteConfirmOpen(false)} disabled={saving}>Cancel</button>
                <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={deleteTimesheet} disabled={saving}>{saving ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

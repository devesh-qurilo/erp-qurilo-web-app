
// // components/TimesheetSummaryList.tsx
// "use client";

// import React, { useEffect, useState } from "react";

// type EmployeeAvatar = {
//   employeeId: string;
//   name?: string | null;
//   profileUrl?: string | null;
//   designation?: string | null;
//   department?: string | null;
// };

// type TimeLog = {
//   id: number;
//   projectId?: number;
//   projectShortCode?: string;
//   projectName?: string;
//   taskId?: number;
//   taskName?: string;
//   employeeId?: string;
//   employees?: EmployeeAvatar[];
//   startDate?: string; // "YYYY-MM-DD"
//   startTime?: string; // "HH:MM:SS" or "HH:MM"
//   endDate?: string;
//   endTime?: string;
//   memo?: string | null;
//   durationHours?: number;
//   createdAt?: string;
// };

// type EmployeeSummary = {
//   employeeId: string;
//   employeeName: string;
//   employeeEmail?: string;
//   designation?: string;
//   totalMinutes?: number;
//   totalHours?: number;
//   timeLogs: TimeLog[];
// };

// const BASE =
//   (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MAIN) ||
//   (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GATEWAY) ||
//   "http://localhost:3000";

// const fetchUrl = () => `${BASE.replace(/\/$/, "")}/timesheets/summary`;

// function formatHours(hours?: number) {
//   if (hours == null || isNaN(Number(hours))) return "0h";
//   const n = Number(hours);
//   if (n === 0) return "0h";
//   return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}h`;
// }

// function formatDateTime(dateStr?: string, timeStr?: string) {
//   if (!dateStr) return "-";
//   const dt = timeStr ? `${dateStr}T${timeStr}` : dateStr;
//   const d = new Date(dt);
//   if (isNaN(d.getTime())) {
//     return `${dateStr}${timeStr ? " " + timeStr : ""}`;
//   }
//   return d.toLocaleString(undefined, {
//     month: "2-digit",
//     day: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// function computeDurationHours(
//   sDate?: string,
//   sTime?: string,
//   eDate?: string,
//   eTime?: string
// ) {
//   if (!sDate || !eDate) return 0;
//   try {
//     const sParts = sDate.split("-").map(Number);
//     const eParts = eDate.split("-").map(Number);
//     let sH = 0,
//       sM = 0,
//       eH = 0,
//       eM = 0;
//     if (sTime) {
//       const st = sTime.split(":").map((v) => Number(v));
//       sH = st[0] ?? 0;
//       sM = st[1] ?? 0;
//     }
//     if (eTime) {
//       const et = eTime.split(":").map((v) => Number(v));
//       eH = et[0] ?? 0;
//       eM = et[1] ?? 0;
//     }
//     const start = new Date(sParts[0], sParts[1] - 1, sParts[2], sH, sM);
//     const end = new Date(eParts[0], eParts[1] - 1, eParts[2], eH, eM);
//     const diffMs = end.getTime() - start.getTime();
//     if (isNaN(diffMs) || diffMs <= 0) return 0;
//     return Math.round(diffMs / (1000 * 60 * 60));
//   } catch {
//     return 0;
//   }
// }

// export default function TimesheetSummaryList() {
//   const [data, setData] = useState<EmployeeSummary[] | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [expanded, setExpanded] = useState<Record<string, boolean>>({});

//   // --- Action states (View/Edit/Delete) ---
//   const [openMenuId, setOpenMenuId] = useState<number | null>(null);

//   const [isViewOpen, setIsViewOpen] = useState(false);
//   const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null);

//   const [showLogModal, setShowLogModal] = useState(false);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [form, setForm] = useState({
//     projectId: "",
//     taskId: "",
//     employeeId: "",
//     startDate: "",
//     startTime: "",
//     endDate: "",
//     endTime: "",
//     memo: "",
//   });
//   const [saving, setSaving] = useState(false);
//   const [saveError, setSaveError] = useState<string | null>(null);

//   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

//   // Projects + tasks for edit modal
//   const [projectOptions, setProjectOptions] = useState<
//     { id: number | string | null; shortCode: string; name?: string; assignedEmployees?: EmployeeAvatar[] }[]
//   >([]);
//   const [projectsLoading, setProjectsLoading] = useState(false);
//   const [projectsError, setProjectsError] = useState<string | null>(null);

//   const [projectTasks, setProjectTasks] = useState<
//     { id: number; title?: string; projectId?: number; assignedEmployees?: EmployeeAvatar[] }[]
//   >([]);
//   const [selectedTaskEmployees, setSelectedTaskEmployees] = useState<EmployeeAvatar[]>([]);

//   // --- Load summary ---
//   useEffect(() => {
//     let mounted = true;
//     async function load() {
//       setLoading(true);
//       setError(null);
//       try {
//         const token =
//           typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//         const headers: Record<string, string> = {
//           "Content-Type": "application/json",
//         };
//         if (token) headers.Authorization = `Bearer ${token}`;

//         const res = await fetch(fetchUrl(), { headers, cache: "no-store" });
//         if (res.status === 401) {
//           try {
//             localStorage.removeItem("accessToken");
//           } catch { }
//           throw new Error("401: Unauthorized — please login.");
//         }
//         if (!res.ok) {
//           const txt = await res.text().catch(() => "");
//           throw new Error(`Failed to fetch: ${res.status} ${txt}`);
//         }
//         const json = (await res.json()) as EmployeeSummary[];
//         if (mounted) setData(json);
//       } catch (err: any) {
//         if (mounted) setError(err?.message || "Unknown error");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }
//     load();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   function toggle(employeeId: string) {
//     setExpanded((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));
//   }

//   // ---------------------
//   // Projects & tasks APIs (for edit modal)
//   // ---------------------
//   const loadProjects = async (accessToken?: string | null) => {
//     setProjectsLoading(true);
//     setProjectsError(null);
//     try {
//       const resolvedToken =
//         accessToken ||
//         (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

//       const url = `${BASE.replace(/\/$/, "")}/projects/AllProject`;
//       const res = await fetch(url, {
//         method: "GET",
//         headers: resolvedToken
//           ? {
//               Authorization: `Bearer ${resolvedToken}`,
//               Accept: "application/json",
//             }
//           : { Accept: "application/json" },
//         cache: "no-store",
//       });

//       if (res.status === 401) {
//         try {
//           localStorage.removeItem("accessToken");
//         } catch { }
//         setProjectOptions([]);
//         setProjectsLoading(false);
//         return;
//       }

//       if (!res.ok) {
//         const txt = await res.text().catch(() => "");
//         console.error("projects fetch failed", res.status, txt);
//         throw new Error(`Failed to load projects (${res.status})`);
//       }

//       const data = await res.json();
//       if (Array.isArray(data)) {
//         const list: any[] = [];
//         data.forEach((p: any) => {
//           const sc = (p?.shortCode ?? "").toString().trim();
//           const id = p?.id ?? p?.projectId ?? p?._id ?? null;
//           const name = (p?.name ?? "").toString().trim();
//           const assignedEmployees: EmployeeAvatar[] = Array.isArray(p?.assignedEmployees)
//             ? p.assignedEmployees
//             : [];
//           if (id != null && sc) {
//             list.push({
//               id,
//               shortCode: sc,
//               name,
//               assignedEmployees,
//             });
//           }
//         });
//         const seen = new Set<string>();
//         const deduped: typeof projectOptions = [];
//         list.forEach((p) => {
//           if (!seen.has(String(p.id))) {
//             seen.add(String(p.id));
//             deduped.push(p);
//           }
//         });
//         setProjectOptions(deduped);
//       } else {
//         console.warn("unexpected projects response", data);
//         setProjectOptions([]);
//       }
//     } catch (err: any) {
//       console.error("loadProjects error", err);
//       setProjectsError(String(err?.message ?? err));
//       setProjectOptions([]);
//     } finally {
//       setProjectsLoading(false);
//     }
//   };

//   const fetchProjectTasks = async (projectIdRaw: string | number, preselectTaskId?: number | null) => {
//     if (!projectIdRaw) {
//       setProjectTasks([]);
//       setSelectedTaskEmployees([]);
//       return;
//     }

//     const projectIdNum = Number(projectIdRaw);
//     if (!projectIdNum || Number.isNaN(projectIdNum)) {
//       setProjectTasks([]);
//       setSelectedTaskEmployees([]);
//       return;
//     }

//     try {
//       const resolvedToken =
//         (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
//       const url = `${BASE.replace(/\/$/, "")}/projects/${projectIdNum}/tasks`;
//       const res = await fetch(url, {
//         method: "GET",
//         headers: resolvedToken
//           ? {
//               Authorization: `Bearer ${resolvedToken}`,
//               Accept: "application/json",
//             }
//           : { Accept: "application/json" },
//         cache: "no-store",
//       });

//       if (!res.ok) {
//         const txt = await res.text().catch(() => "");
//         console.error("project tasks fetch failed", res.status, txt);
//         setProjectTasks([]);
//         setSelectedTaskEmployees([]);
//         return;
//       }

//       const data = await res.json();
//       const list: any[] = Array.isArray(data) ? data : [];
//       setProjectTasks(list);

//       if (preselectTaskId != null && list.length > 0) {
//         const task = list.find((t) => t.id === preselectTaskId);
//         setSelectedTaskEmployees(task?.assignedEmployees ?? []);
//       } else {
//         setSelectedTaskEmployees([]);
//       }
//     } catch (err) {
//       console.error("fetchProjectTasks error", err);
//       setProjectTasks([]);
//       setSelectedTaskEmployees([]);
//     }
//   };

//   // ---------------------
//   // Open view / edit / delete actions
//   // ---------------------
//   const openView = (tl: TimeLog) => {
//     setSelectedLog(tl);
//     setIsViewOpen(true);
//     setOpenMenuId(null);
//   };

//   const openLogForm = (tl?: TimeLog) => {
//     setProjectTasks([]);
//     setSelectedTaskEmployees([]);
//     setSaveError(null);

//     if (!tl) {
//       setEditingId(null);
//       setForm({
//         projectId: "",
//         taskId: "",
//         employeeId: "",
//         startDate: "",
//         startTime: "",
//         endDate: "",
//         endTime: "",
//         memo: "",
//       });
//     } else {
//       setEditingId(tl.id);
//       setForm({
//         projectId:
//           tl.projectId !== undefined && tl.projectId !== null ? String(tl.projectId) : "",
//         taskId: tl.taskId !== undefined && tl.taskId !== null ? String(tl.taskId) : "",
//         employeeId: tl.employeeId ?? (tl.employees && tl.employees[0]?.employeeId) ?? "",
//         startDate: tl.startDate ?? "",
//         startTime: tl.startTime ? tl.startTime.slice(0, 5) : "",
//         endDate: tl.endDate ?? "",
//         endTime: tl.endTime ? tl.endTime.slice(0, 5) : "",
//         memo: tl.memo ?? "",
//       });

//       if (tl.projectId) {
//         fetchProjectTasks(tl.projectId, tl.taskId ?? null);
//       }
//     }

//     // ensure projects are loaded for select lists
//     loadProjects();
//     setShowLogModal(true);
//     setOpenMenuId(null);
//   };

//   const saveEntry = async () => {
//     setSaving(true);
//     setSaveError(null);
//     try {
//       if (
//         !form.projectId ||
//         !form.taskId ||
//         !form.employeeId ||
//         !form.startDate ||
//         !form.startTime ||
//         !form.endDate ||
//         !form.endTime ||
//         !form.memo
//       ) {
//         setSaveError("Please fill all required fields.");
//         setSaving(false);
//         return;
//       }

//       const payload: any = {
//         projectId: Number(form.projectId),
//         taskId: Number(form.taskId),
//         employeeId: form.employeeId,
//         startDate: form.startDate,
//         startTime: form.startTime,
//         endDate: form.endDate,
//         endTime: form.endTime,
//         memo: form.memo,
//         durationHours: computeDurationHours(
//           form.startDate,
//           form.startTime,
//           form.endDate,
//           form.endTime
//         ),
//       };

//       const resolvedToken =
//         typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

//       const url = editingId
//         ? `${BASE.replace(/\/$/, "")}/timesheets/${editingId}`
//         : `${BASE.replace(/\/$/, "")}/timesheets`;
//       const method = editingId ? "PUT" : "POST";

//       const res = await fetch(url, {
//         method,
//         headers: {
//           ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
//           "Content-Type": "application/json",
//           Accept: "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         const text = await res.text().catch(() => "");
//         console.error("save entry failed", res.status, text);
//         throw new Error("Failed to save entry");
//       }

//       // close and refresh summary
//       setShowLogModal(false);
//       setEditingId(null);
//       setForm({
//         projectId: "",
//         taskId: "",
//         employeeId: "",
//         startDate: "",
//         startTime: "",
//         endDate: "",
//         endTime: "",
//         memo: "",
//       });

//       // reload summaries
//       try {
//         const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//         const headers: Record<string, string> = { "Content-Type": "application/json" };
//         if (token) headers.Authorization = `Bearer ${token}`;
//         const res2 = await fetch(fetchUrl(), { headers, cache: "no-store" });
//         if (res2.ok) {
//           const json = (await res2.json()) as EmployeeSummary[];
//           setData(json);
//         }
//       } catch (err) {
//         // ignore, we've already saved
//       }
//     } catch (err: any) {
//       console.error("saveEntry error", err);
//       setSaveError(err?.message || "Failed to save entry");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const openDelete = (tl: TimeLog) => {
//     setSelectedLog(tl);
//     setIsDeleteConfirmOpen(true);
//     setOpenMenuId(null);
//     setSaveError(null);
//   };

//   const deleteTimesheet = async () => {
//     if (!selectedLog) return;
//     setSaving(true);
//     setSaveError(null);
//     try {
//       const resolvedToken =
//         typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//       const res = await fetch(`${BASE.replace(/\/$/, "")}/timesheets/${selectedLog.id}`, {
//         method: "DELETE",
//         headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
//       });
//       if (!res.ok) {
//         const txt = await res.text().catch(() => "");
//         console.error("deleteTimesheet failed", res.status, txt);
//         throw new Error("Failed to delete timesheet");
//       }
//       setIsDeleteConfirmOpen(false);
//       setSelectedLog(null);

//       // refresh summary
//       try {
//         const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//         const headers: Record<string, string> = { "Content-Type": "application/json" };
//         if (token) headers.Authorization = `Bearer ${token}`;
//         const res2 = await fetch(fetchUrl(), { headers, cache: "no-store" });
//         if (res2.ok) {
//           const json = (await res2.json()) as EmployeeSummary[];
//           setData(json);
//         }
//       } catch (err) {
//         // ignore
//       }
//     } catch (err: any) {
//       console.error("deleteTimesheet error", err);
//       setSaveError(err?.message || "Failed to delete timesheet");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // small helper for project employee map used in edit modal
//   const projectEmployeeMap = React.useMemo(() => {
//     const map = new Map<string, EmployeeAvatar[]>();
//     projectOptions.forEach((p) => {
//       if (p.id != null && p.assignedEmployees?.length) {
//         map.set(String(p.id), p.assignedEmployees);
//       }
//     });
//     return map;
//   }, [projectOptions]);

//   // employee list derived from summary for selects if needed
//   const employeeOptions = React.useMemo(() => {
//     const s = new Set<string>();
//     (data ?? []).forEach((emp) => {
//       emp.timeLogs.forEach((t) => {
//         if (t.employeeId) s.add(t.employeeId);
//         if (t.employees && t.employees.length > 0) {
//           t.employees.forEach((e) => e?.employeeId && s.add(e.employeeId));
//         }
//       });
//     });
//     return ["--", ...Array.from(s)];
//   }, [data]);

//   // computed hours in modal
//   const modalTotalHours = computeDurationHours(
//     form.startDate,
//     form.startTime,
//     form.endDate,
//     form.endTime
//   );

//   // ---------------------
//   // Render
//   // ---------------------
//   if (loading)
//     return <div className="py-6 px-4 text-gray-600">Loading summary…</div>;
//   if (error)
//     return (
//       <div className="py-6 px-4 text-red-600">Error loading summaries: {error}</div>
//     );
//   if (!data || data.length === 0)
//     return <div className="py-6 px-4 text-gray-600">No summary found.</div>;

//   return (
//     <div className="space-y-3 px-4 pb-8">
//       {data.map((emp) => {
//         const isOpen = !!expanded[emp.employeeId];
//         const avatarUrl = emp.timeLogs?.[0]?.employees?.[0]?.profileUrl;
//         return (
//           <div
//             key={emp.employeeId}
//             className="border rounded-lg bg-white shadow-sm overflow-hidden"
//           >
//             {/* Header row */}
//             <div className="flex items-center gap-4 px-4 py-3">
//               <div className="flex items-center gap-3 flex-1">
//                 <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border">
//                   {avatarUrl ? (
//                     // eslint-disable-next-line @next/next/no-img-element
//                     <img
//                       src={avatarUrl}
//                       alt={emp.employeeName}
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <span className="text-sm font-medium text-gray-700">
//                       {emp.employeeName
//                         ? emp.employeeName
//                             .split(" ")
//                             .map((s) => s[0])
//                             .join("")
//                             .toUpperCase()
//                         : "?"}
//                     </span>
//                   )}
//                 </div>

//                 <div className="min-w-0">
//                   <div className="font-medium text-sm text-gray-800 truncate">
//                     {emp.employeeName}
//                   </div>
//                   <div className="text-xs text-gray-500">
//                     {emp.designation ?? "—"}
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-6">
//                 <div className="text-right mr-2">
//                   <div className="text-xs text-gray-500">Total</div>
//                   <div className="font-medium text-sm">
//                     {formatHours(emp.totalHours)}
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => toggle(emp.employeeId)}
//                   aria-expanded={isOpen}
//                   className="w-9 h-9 flex items-center justify-center rounded border hover:bg-gray-50"
//                 >
//                   {!isOpen ? (
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-5 w-5 text-blue-600"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                       strokeWidth={2}
//                       aria-hidden
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
//                     </svg>
//                   ) : (
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-5 w-5 text-gray-600"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                       stroke="currentColor"
//                       strokeWidth={2}
//                       aria-hidden
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Expanded detail */}
//             {isOpen && (
//               <div className="border-t bg-gray-50 px-4 py-4">
//                 <div className="overflow-auto">
//                   <table className="w-full min-w-[720px] table-fixed text-sm">
//                     <thead>
//                       <tr className="text-left text-xs text-gray-600">
//                         <th className="w-1/3 py-2 px-3">Task</th>
//                         <th className="w-1/3 py-2 px-3">Time</th>
//                         <th className="w-1/6 py-2 px-3 text-center">Total Hours</th>
//                         <th className="w-1/6 py-2 px-3 text-center">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {emp.timeLogs && emp.timeLogs.length > 0 ? (
//                         emp.timeLogs.map((tl) => (
//                           <tr key={tl.id} className="border-t bg-white last:border-b">
//                             <td className="py-3 px-3 align-top">
//                               <div className="font-medium">{tl.taskName ?? "Task Name"}</div>
//                               <div className="text-xs text-gray-500">{tl.projectName ?? ""}</div>
//                             </td>
//                             <td className="py-3 px-3 align-top">
//                               <div className="text-xs text-gray-600">
//                                 {formatDateTime(tl.startDate, tl.startTime)}
//                               </div>
//                               <div className="text-xs text-gray-500">
//                                 {formatDateTime(tl.endDate, tl.endTime)}
//                               </div>
//                             </td>
//                             <td className="py-3 px-3 align-top text-center">
//                               <div className="font-medium">{formatHours(tl.durationHours)}</div>
//                             </td>
//                             <td className="py-3 px-3 align-top text-center relative">
//                               <div className="inline-flex items-center gap-2 justify-center">
//                                 <button
//                                   title="View"
//                                   className="p-1 rounded hover:bg-gray-100"
//                                   onClick={() => openView(tl)}
//                                 >
//                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
//                                     <path d="M10 3C6 3 2.7 5.1 1 8c1.7 2.9 5 5 9 5s7.3-2.1 9-5c-1.7-2.9-5-5-9-5zM10 12a4 4 0 110-8 4 4 0 010 8z" />
//                                     <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
//                                   </svg>
//                                 </button>

//                                 <button
//                                   title="Edit"
//                                   className="p-1 rounded hover:bg-gray-100"
//                                   onClick={() => openLogForm(tl)}
//                                 >
//                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
//                                     <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.465.263l-4 1a1 1 0 01-1.212-1.212l1-4a1 1 0 01.263-.465l9.9-9.9a2 2 0 012.828 0z" />
//                                   </svg>
//                                 </button>

//                                 <button
//                                   title="Delete"
//                                   className="p-1 rounded hover:bg-gray-100"
//                                   onClick={() => openDelete(tl)}
//                                 >
//                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
//                                     <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 000 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
//                                   </svg>
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan={4} className="py-4 px-3 text-gray-500">
//                             No time logs available.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </div>
//         );
//       })}

//       {/* View Modal */}
//       {isViewOpen && selectedLog && (
//         <div className="fixed inset-0 z-[10030] flex items-start justify-center pt-8 px-6">
//           <div className="absolute inset-0 bg-black/40" onClick={() => setIsViewOpen(false)} />
//           <div className="relative bg-white w-full max-w-6xl rounded-xl shadow-xl overflow-hidden">
//             <div className="flex items-center justify-between px-6 py-4 border-b">
//               <h3 className="text-xl font-semibold">Timesheet</h3>
//               <button
//                 className="p-2 rounded hover:bg-gray-100"
//                 onClick={() => setIsViewOpen(false)}
//                 aria-label="Close"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="p-6">
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="lg:col-span-2 relative bg-white rounded-xl border p-6">
//                   <div className="absolute top-4 right-4 text-gray-500">⋮</div>

//                   <h4 className="text-lg font-medium mb-4">TimeLog Details</h4>

//                   <div className="grid grid-cols-3 gap-y-4 gap-x-6 items-center text-sm">
//                     <div className="text-gray-500">Start Time</div>
//                     <div className="col-span-2">
//                       {formatDateTime(selectedLog.startDate, selectedLog.startTime)}
//                     </div>

//                     <div className="text-gray-500">End Time</div>
//                     <div className="col-span-2">
//                       {formatDateTime(selectedLog.endDate, selectedLog.endTime)}
//                     </div>

//                     <div className="text-gray-500">Total Hours</div>
//                     <div className="col-span-2">
//                       {typeof selectedLog.durationHours === "number"
//                         ? `${selectedLog.durationHours}h`
//                         : "-"}
//                     </div>

//                     <div className="text-gray-500">Memo</div>
//                     <div className="col-span-2">{selectedLog.memo ?? "-"}</div>

//                     <div className="text-gray-500">Project</div>
//                     <div className="col-span-2">
//                       {selectedLog.projectName ?? selectedLog.projectShortCode ?? selectedLog.projectId ?? "-"}
//                     </div>

//                     <div className="text-gray-500">Task</div>
//                     <div className="col-span-2">{selectedLog.taskName ?? `Task ${selectedLog.taskId ?? "-"}`}</div>

//                     <div className="text-gray-500">Employee</div>
//                     <div className="col-span-2 flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
//                         {selectedLog.employees && selectedLog.employees[0]?.profileUrl ? (
//                           // eslint-disable-next-line @next/next/no-img-element
//                           <img src={selectedLog.employees[0].profileUrl!} alt={selectedLog.employees[0].name ?? ""} className="w-full h-full object-cover" />
//                         ) : (
//                           <div className="w-6 h-6 rounded-full bg-gray-200" />
//                         )}
//                       </div>
//                       <div>
//                         <div className="font-medium text-sm">
//                           {selectedLog.employees && selectedLog.employees[0]?.name
//                             ? selectedLog.employees[0].name
//                             : selectedLog.employeeId}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           {selectedLog.employees && selectedLog.employees[0]?.designation ? selectedLog.employees[0].designation : ""}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-white rounded-xl border p-5">
//                   <h5 className="font-medium mb-3">History</h5>

//                   <div className="space-y-4 text-sm text-gray-700">
//                     <div className="flex justify-between">
//                       <div className="text-gray-500">Start Time</div>
//                       <div>{formatDateTime(selectedLog.startDate, selectedLog.startTime)}</div>
//                     </div>

//                     <div className="flex justify-between">
//                       <div className="text-gray-500">Task</div>
//                       <div>{selectedLog.taskName ?? `Task ${selectedLog.taskId ?? "-"}`}</div>
//                     </div>

//                     <div className="flex justify-between">
//                       <div className="text-gray-500">End Time</div>
//                       <div>{formatDateTime(selectedLog.endDate, selectedLog.endTime)}</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center justify-center gap-6 mt-8 pb-6">
//                 <button onClick={() => setIsViewOpen(false)} className="px-6 py-2 rounded-md border text-blue-600">Close</button>
//                 <button onClick={() => { if (selectedLog) openLogForm(selectedLog); setIsViewOpen(false); }} className="px-6 py-2 rounded-md bg-blue-600 text-white">Edit</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Log Time (Edit/Create) Modal */}
//       {showLogModal && (
//         <div className="fixed inset-0 z-[10020] flex items-start justify-center pt-12 px-4">
//           <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogModal(false)} />
//           <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden">
//             <div className="flex items-center justify-between px-6 py-4 border-b">
//               <h3 className="text-lg font-semibold">{editingId ? "Edit TimeLog" : "Log Time"}</h3>
//               <button className="p-2 rounded hover:bg-gray-100" onClick={() => setShowLogModal(false)} aria-label="Close">✕</button>
//             </div>

//             <div className="p-6">
//               <div className="bg-white rounded-md border p-6">
//                 <h4 className="text-md font-medium mb-4">TimeLog Details</h4>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-sm text-gray-700 mb-2">Project *</label>
//                     <select
//                       value={form.projectId || ""}
//                       onChange={(e) => {
//                         const value = e.target.value;
//                         setForm((s) => ({ ...s, projectId: value, taskId: "", employeeId: "" }));
//                         if (value) {
//                           fetchProjectTasks(value);
//                         } else {
//                           setProjectTasks([]);
//                           setSelectedTaskEmployees([]);
//                         }
//                       }}
//                       className="w-full border rounded px-3 py-2 text-sm"
//                     >
//                       <option value="">--</option>
//                       {projectsLoading && <option value="">Loading...</option>}
//                       {projectsError && <option value="">Error loading projects</option>}
//                       {projectOptions.map((p) => (
//                         <option key={`${p.id}-${p.shortCode}`} value={String(p.id)}>
//                           {p.id != null ? `#${p.id} - ${p.name || p.shortCode}` : p.name || p.shortCode}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm text-gray-700 mb-2">Task *</label>
//                     <select
//                       value={form.taskId || "--"}
//                       onChange={(e) => {
//                         const val = e.target.value;
//                         if (val === "--") {
//                           setForm((s) => ({ ...s, taskId: "", employeeId: "" }));
//                           setSelectedTaskEmployees([]);
//                           return;
//                         }
//                         const idNum = Number(val);
//                         const task = projectTasks.find((t) => t.id === idNum);
//                         setForm((s) => ({ ...s, taskId: val, employeeId: "" }));
//                         setSelectedTaskEmployees(task?.assignedEmployees ?? []);
//                       }}
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       disabled={!!form.projectId && projectTasks.length === 0}
//                     >
//                       {form.projectId ? (
//                         projectTasks.length === 0 ? (
//                           <option value="--">No tasks</option>
//                         ) : (
//                           <>
//                             <option value="--">--</option>
//                             {projectTasks.map((t) => (
//                               <option key={t.id} value={String(t.id)}>
//                                 {t.title ? `${t.id} - ${t.title}` : `Task ${t.id}`}
//                               </option>
//                             ))}
//                           </>
//                         )
//                       ) : (
//                         <option value="--">--</option>
//                       )}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm text-gray-700 mb-2">Employee *</label>
//                     <select
//                       value={form.employeeId || "--"}
//                       onChange={(e) => setForm((s) => ({ ...s, employeeId: e.target.value === "--" ? "" : e.target.value }))}
//                       className="w-full border rounded px-3 py-2 text-sm"
//                       disabled={!!form.projectId && projectTasks.length === 0}
//                     >
//                       {(() => {
//                         const projectEmployees = form.projectId ? projectEmployeeMap.get(form.projectId) ?? [] : [];

//                         if (form.projectId && projectTasks.length === 0) {
//                           return <option value="--">No employees</option>;
//                         }

//                         if (selectedTaskEmployees.length > 0) {
//                           return (
//                             <>
//                               <option value="--">--</option>
//                               {selectedTaskEmployees.map((e) => (
//                                 <option key={e.employeeId} value={e.employeeId}>
//                                   {e.name ? `${e.name} (${e.employeeId})` : e.employeeId}
//                                 </option>
//                               ))}
//                             </>
//                           );
//                         }

//                         if (form.projectId && projectEmployees.length > 0) {
//                           return (
//                             <>
//                               <option value="--">--</option>
//                               {projectEmployees.map((e) => (
//                                 <option key={e.employeeId} value={e.employeeId}>
//                                   {e.name ? `${e.name} (${e.employeeId})` : e.employeeId}
//                                 </option>
//                               ))}
//                             </>
//                           );
//                         }

//                         return employeeOptions.map((e) => (
//                           <option key={e} value={e}>
//                             {e === "--" ? "--" : e}
//                           </option>
//                         ));
//                       })()}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
//                   <div>
//                     <label className="block text-sm text-gray-700 mb-2">Start Date *</label>
//                     <input type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
//                   </div>

//                   <div>
//                     <label className="block text-sm text-gray-700 mb-2">Start Time *</label>
//                     <input type="time" value={form.startTime} onChange={(e) => setForm((s) => ({ ...s, startTime: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
//                   </div>

//                   <div>
//                     <label className="block text-sm text-gray-700 mb-2">End Date *</label>
//                     <input type="date" value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
//                   </div>

//                   <div>
//                     <label className="block text-sm text-gray-700 mb-2">End Time *</label>
//                     <input type="time" value={form.endTime} onChange={(e) => setForm((s) => ({ ...s, endTime: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
//                   </div>
//                 </div>

//                 <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
//                   <div>
//                     <label className="block text-sm text-gray-700 mb-2">Memo *</label>
//                     <input type="text" value={form.memo} onChange={(e) => setForm((s) => ({ ...s, memo: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" placeholder="Memo" />
//                   </div>

//                   <div className="text-right">
//                     <div className="text-sm text-gray-500">Total Hours</div>
//                     <div className="text-2xl font-semibold text-blue-600">{modalTotalHours}h</div>
//                   </div>
//                 </div>

//                 {saveError && <div className="mt-4 text-sm text-red-600">{saveError}</div>}
//               </div>

//               <div className="flex items-center justify-center gap-6 mt-8 pb-6">
//                 <button onClick={() => setShowLogModal(false)} className="px-6 py-2 rounded-md border text-blue-600" disabled={saving}>Cancel</button>

//                 <button onClick={saveEntry} className="px-6 py-2 rounded-md bg-blue-600 text-white shadow" disabled={saving}>
//                   {saving ? "Saving..." : editingId ? "Update" : "Save"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete confirm modal */}
//       {isDeleteConfirmOpen && selectedLog && (
//         <div className="fixed inset-0 z-[10040] flex items-start justify-center pt-12 px-4">
//           <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteConfirmOpen(false)} />
//           <div className="relative bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
//             <div className="p-6">
//               <h3 className="text-lg font-semibold mb-4">Delete TimeLog</h3>
//               <p className="text-sm text-gray-700">
//                 Are you sure you want to delete timesheet <strong>#{String(selectedLog.id)}</strong>? This action cannot be undone.
//               </p>

//               {saveError && <div className="mt-4 text-sm text-red-600">{saveError}</div>}

//               <div className="flex items-center justify-end gap-4 mt-6">
//                 <button className="px-4 py-2 rounded border" onClick={() => setIsDeleteConfirmOpen(false)} disabled={saving}>Cancel</button>
//                 <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={deleteTimesheet} disabled={saving}>
//                   {saving ? "Deleting..." : "Delete"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// components/TimesheetSummaryList.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type EmployeeAvatar = {
  employeeId: string;
  name?: string | null;
  profileUrl?: string | null;
  designation?: string | null;
  department?: string | null;
};

type TimeLog = {
  id: number;
  projectId?: number;
  projectShortCode?: string;
  projectName?: string;
  taskId?: number;
  taskName?: string;
  employeeId?: string;
  employees?: EmployeeAvatar[];
  startDate?: string; // "YYYY-MM-DD"
  startTime?: string; // "HH:MM:SS" or "HH:MM"
  endDate?: string;
  endTime?: string;
  memo?: string | null;
  durationHours?: number;
  createdAt?: string;
};

type EmployeeSummary = {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  designation?: string;
  totalMinutes?: number;
  totalHours?: number;
  timeLogs: TimeLog[];
};

const BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MAIN) ||
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GATEWAY) ||
  "http://localhost:3000";

const fetchUrl = () => `${BASE.replace(/\/$/, "")}/timesheets/summary`;

function formatHours(hours?: number) {
  if (hours == null || isNaN(Number(hours))) return "0h";
  const n = Number(hours);
  if (n === 0) return "0h";
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}h`;
}

function formatDateTime(dateStr?: string, timeStr?: string) {
  if (!dateStr) return "-";
  const dt = timeStr ? `${dateStr}T${timeStr}` : dateStr;
  const d = new Date(dt);
  if (isNaN(d.getTime())) {
    return `${dateStr}${timeStr ? " " + timeStr : ""}`;
  }
  return d.toLocaleString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeDurationHours(
  sDate?: string,
  sTime?: string,
  eDate?: string,
  eTime?: string
) {
  if (!sDate || !eDate) return 0;
  try {
    const sParts = sDate.split("-").map(Number);
    const eParts = eDate.split("-").map(Number);
    let sH = 0,
      sM = 0,
      eH = 0,
      eM = 0;
    if (sTime) {
      const st = sTime.split(":").map((v) => Number(v));
      sH = st[0] ?? 0;
      sM = st[1] ?? 0;
    }
    if (eTime) {
      const et = eTime.split(":").map((v) => Number(v));
      eH = et[0] ?? 0;
      eM = et[1] ?? 0;
    }
    const start = new Date(sParts[0], sParts[1] - 1, sParts[2], sH, sM);
    const end = new Date(eParts[0], eParts[1] - 1, eParts[2], eH, eM);
    const diffMs = end.getTime() - start.getTime();
    if (isNaN(diffMs) || diffMs <= 0) return 0;
    return Math.round(diffMs / (1000 * 60 * 60));
  } catch {
    return 0;
  }
}

export default function TimesheetSummaryList() {
  const [data, setData] = useState<EmployeeSummary[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // --- Action states (View/Edit/Delete) ---
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null);

  const [showLogModal, setShowLogModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

const getLogById = (id: number) => {
  return data?.flatMap((e) => e.timeLogs).find((l) => l.id === id) || null;
};


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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Projects + tasks for edit modal
  const [projectOptions, setProjectOptions] = useState<
    { id: number | string | null; shortCode: string; name?: string; assignedEmployees?: EmployeeAvatar[] }[]
  >([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [projectTasks, setProjectTasks] = useState<
    { id: number; title?: string; projectId?: number; assignedEmployees?: EmployeeAvatar[] }[]
  >([]);
  const [selectedTaskEmployees, setSelectedTaskEmployees] = useState<EmployeeAvatar[]>([]);

  // --- Load summary ---
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(fetchUrl(), { headers, cache: "no-store" });
        if (res.status === 401) {
          try {
            localStorage.removeItem("accessToken");
          } catch { }
          throw new Error("401: Unauthorized — please login.");
        }
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to fetch: ${res.status} ${txt}`);
        }
        const json = (await res.json()) as EmployeeSummary[];
        if (mounted) setData(json);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function toggle(employeeId: string) {
    setExpanded((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));
  }

  // ---------------------
  // Projects & tasks APIs (for edit modal)
  // ---------------------
  const loadProjects = async (accessToken?: string | null) => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const resolvedToken =
        accessToken ||
        (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

      const url = `${BASE.replace(/\/$/, "")}/projects/AllProject`;
      const res = await fetch(url, {
        method: "GET",
        headers: resolvedToken
          ? {
              Authorization: `Bearer ${resolvedToken}`,
              Accept: "application/json",
            }
          : { Accept: "application/json" },
        cache: "no-store",
      });

      if (res.status === 401) {
        try {
          localStorage.removeItem("accessToken");
        } catch { }
        setProjectOptions([]);
        setProjectsLoading(false);
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("projects fetch failed", res.status, txt);
        throw new Error(`Failed to load projects (${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        const list: any[] = [];
        data.forEach((p: any) => {
          const sc = (p?.shortCode ?? "").toString().trim();
          const id = p?.id ?? p?.projectId ?? p?._id ?? null;
          const name = (p?.name ?? "").toString().trim();
          const assignedEmployees: EmployeeAvatar[] = Array.isArray(p?.assignedEmployees)
            ? p.assignedEmployees
            : [];
          if (id != null && sc) {
            list.push({
              id,
              shortCode: sc,
              name,
              assignedEmployees,
            });
          }
        });
        const seen = new Set<string>();
        const deduped: typeof projectOptions = [];
        list.forEach((p) => {
          if (!seen.has(String(p.id))) {
            seen.add(String(p.id));
            deduped.push(p);
          }
        });
        setProjectOptions(deduped);
      } else {
        console.warn("unexpected projects response", data);
        setProjectOptions([]);
      }
    } catch (err: any) {
      console.error("loadProjects error", err);
      setProjectsError(String(err?.message ?? err));
      setProjectOptions([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchProjectTasks = async (projectIdRaw: string | number, preselectTaskId?: number | null) => {
    if (!projectIdRaw) {
      setProjectTasks([]);
      setSelectedTaskEmployees([]);
      return;
    }

    const projectIdNum = Number(projectIdRaw);
    if (!projectIdNum || Number.isNaN(projectIdNum)) {
      setProjectTasks([]);
      setSelectedTaskEmployees([]);
      return;
    }

    try {
      const resolvedToken =
        (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
      const url = `${BASE.replace(/\/$/, "")}/projects/${projectIdNum}/tasks`;
      const res = await fetch(url, {
        method: "GET",
        headers: resolvedToken
          ? {
              Authorization: `Bearer ${resolvedToken}`,
              Accept: "application/json",
            }
          : { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("project tasks fetch failed", res.status, txt);
        setProjectTasks([]);
        setSelectedTaskEmployees([]);
        return;
      }

      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : [];
      setProjectTasks(list);

      if (preselectTaskId != null && list.length > 0) {
        const task = list.find((t) => t.id === preselectTaskId);
        setSelectedTaskEmployees(task?.assignedEmployees ?? []);
      } else {
        setSelectedTaskEmployees([]);
      }
    } catch (err) {
      console.error("fetchProjectTasks error", err);
      setProjectTasks([]);
      setSelectedTaskEmployees([]);
    }
  };

  // ---------------------
  // Open view / edit / delete actions
  // ---------------------
  const openView = (tl: TimeLog) => {
    setSelectedLog(tl);
    setIsViewOpen(true);
    setOpenMenuId(null);
  };

  const openLogForm = (tl?: TimeLog) => {
    setProjectTasks([]);
    setSelectedTaskEmployees([]);
    setSaveError(null);

    if (!tl) {
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
      setEditingId(tl.id);
      setForm({
        projectId:
          tl.projectId !== undefined && tl.projectId !== null ? String(tl.projectId) : "",
        taskId: tl.taskId !== undefined && tl.taskId !== null ? String(tl.taskId) : "",
        employeeId: tl.employeeId ?? (tl.employees && tl.employees[0]?.employeeId) ?? "",
        startDate: tl.startDate ?? "",
        startTime: tl.startTime ? tl.startTime.slice(0, 5) : "",
        endDate: tl.endDate ?? "",
        endTime: tl.endTime ? tl.endTime.slice(0, 5) : "",
        memo: tl.memo ?? "",
      });

      if (tl.projectId) {
        fetchProjectTasks(tl.projectId, tl.taskId ?? null);
      }
    }

    // ensure projects are loaded for select lists
    loadProjects();
    setShowLogModal(true);
    setOpenMenuId(null);
  };

  const saveEntry = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (
        !form.projectId ||
        !form.taskId ||
        !form.employeeId ||
        !form.startDate ||
        !form.startTime ||
        !form.endDate ||
        !form.endTime ||
        !form.memo
      ) {
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
        durationHours: computeDurationHours(
          form.startDate,
          form.startTime,
          form.endDate,
          form.endTime
        ),
      };

      const resolvedToken =
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      const url = editingId
        ? `${BASE.replace(/\/$/, "")}/timesheets/${editingId}`
        : `${BASE.replace(/\/$/, "")}/timesheets`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("save entry failed", res.status, text);
        throw new Error("Failed to save entry");
      }

      // close and refresh summary
      setShowLogModal(false);
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

      // reload summaries
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res2 = await fetch(fetchUrl(), { headers, cache: "no-store" });
        if (res2.ok) {
          const json = (await res2.json()) as EmployeeSummary[];
          setData(json);
        }
      } catch (err) {
        // ignore, we've already saved
      }
    } catch (err: any) {
      console.error("saveEntry error", err);
      setSaveError(err?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (tl: TimeLog) => {
    setSelectedLog(tl);
    setIsDeleteConfirmOpen(true);
    setOpenMenuId(null);
    setSaveError(null);
  };

  const deleteTimesheet = async () => {
    if (!selectedLog) return;
    setSaving(true);
    setSaveError(null);
    try {
      const resolvedToken =
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await fetch(`${BASE.replace(/\/$/, "")}/timesheets/${selectedLog.id}`, {
        method: "DELETE",
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("deleteTimesheet failed", res.status, txt);
        throw new Error("Failed to delete timesheet");
      }
      setIsDeleteConfirmOpen(false);
      setSelectedLog(null);

      // refresh summary
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;
        const res2 = await fetch(fetchUrl(), { headers, cache: "no-store" });
        if (res2.ok) {
          const json = (await res2.json()) as EmployeeSummary[];
          setData(json);
        }
      } catch (err) {
        // ignore
      }
    } catch (err: any) {
      console.error("deleteTimesheet error", err);
      setSaveError(err?.message || "Failed to delete timesheet");
    } finally {
      setSaving(false);
    }
  };

  // small helper for project employee map used in edit modal
  const projectEmployeeMap = React.useMemo(() => {
    const map = new Map<string, EmployeeAvatar[]>();
    projectOptions.forEach((p) => {
      if (p.id != null && p.assignedEmployees?.length) {
        map.set(String(p.id), p.assignedEmployees);
      }
    });
    return map;
  }, [projectOptions]);

  // employee list derived from summary for selects if needed
  const employeeOptions = React.useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach((emp) => {
      emp.timeLogs.forEach((t) => {
        if (t.employeeId) s.add(t.employeeId);
        if (t.employees && t.employees.length > 0) {
          t.employees.forEach((e) => e?.employeeId && s.add(e.employeeId));
        }
      });
    });
    return ["--", ...Array.from(s)];
  }, [data]);

  // computed hours in modal
  const modalTotalHours = computeDurationHours(
    form.startDate,
    form.startTime,
    form.endDate,
    form.endTime
  );

  // ---------------------
  // Menu open/close handlers and outside click / ESC handling
  // ---------------------
  // const toggleMenu = (id: number) => {
  //   setOpenMenuId((prev) => (prev === id ? null : id));
  // };




  const toggleMenu = (id: number, event?: React.MouseEvent<HTMLButtonElement>) => {
  if (openMenuId === id) {
    setOpenMenuId(null);
    setMenuPosition(null);
    return;
  }

  if (event) {
    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 180;
    const menuHeight = 120;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 6;

    // prevent right overflow
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }

    // prevent bottom overflow
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 6;
    }

    setMenuPosition({ top, left });
  }

  setOpenMenuId(id);
};

  useEffect(() => {
    if (openMenuId == null) return;

    function onMousedown(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // If clicked outside any element with data-menu-id, close menu
      if (!target.closest("[data-menu-id]")) {
        setOpenMenuId(null);
      }
    }

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", onMousedown);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("mousedown", onMousedown);
      document.removeEventListener("keydown", onKeydown);
    };
  }, [openMenuId]);

  // ---------------------
  // Render
  // ---------------------
  if (loading)
    return <div className="py-6 px-4 text-gray-600">Loading summary…</div>;
  if (error)
    return (
      <div className="py-6 px-4 text-red-600">Error loading summaries: {error}</div>
    );
  if (!data || data.length === 0)
    return <div className="py-6 px-4 text-gray-600">No summary found.</div>;

  return (
    <div className="space-y-3 px-4 pb-8">
      {data.map((emp) => {
        const isOpen = !!expanded[emp.employeeId];
        const avatarUrl = emp.timeLogs?.[0]?.employees?.[0]?.profileUrl;
        return (
          <div
            key={emp.employeeId}
            className="border rounded-lg bg-white shadow-sm overflow-hidden"
          >
            {/* Header row */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={emp.employeeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-700">
                      {emp.employeeName
                        ? emp.employeeName
                            .split(" ")
                            .map((s) => s[0])
                            .join("")
                            .toUpperCase()
                        : "?"}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="font-medium text-sm text-gray-800 truncate">
                    {emp.employeeName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {emp.designation ?? "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right mr-2">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-medium text-sm">
                    {formatHours(emp.totalHours)}
                  </div>
                </div>

                <button
                  onClick={() => toggle(emp.employeeId)}
                  aria-expanded={isOpen}
                  className="w-9 h-9 flex items-center justify-center rounded border hover:bg-gray-50"
                >
                  {!isOpen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div className="border-t bg-gray-50 px-4 py-4">
                <div className="overflow-auto">
                  <table className="w-full min-w-[720px] table-fixed text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-600">
                        <th className="w-1/3 py-2 px-3">Task</th>
                        <th className="w-1/3 py-2 px-3">Time</th>
                        <th className="w-1/6 py-2 px-3 text-center">Total Hours</th>
                        <th className="w-1/6 py-2 px-3 text-center">Actions </th>
                      </tr>
                    </thead>
                    <tbody>
                      {emp.timeLogs && emp.timeLogs.length > 0 ? (
                        emp.timeLogs.map((tl) => (
                          <tr key={tl.id} className="border-t bg-white last:border-b">
                            <td className="py-3 px-3 align-top">
                              <div className="font-medium">{tl.taskName ?? "Task Name"}</div>
                              <div className="text-xs text-gray-500">{tl.projectName ?? ""}</div>
                            </td>
                            <td className="py-3 px-3 align-top">
                              <div className="text-xs text-gray-600">
                                {formatDateTime(tl.startDate, tl.startTime)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDateTime(tl.endDate, tl.endTime)}
                              </div>
                            </td>
                            <td className="py-3 px-3 align-top text-center">
                              <div className="font-medium">{formatHours(tl.durationHours)}</div>
                            </td>
                            <td className="py-3 px-3 align-top text-center relative">
                              {/* NEW: three-dot menu */}
                              <div className="inline-flex items-center gap-2 justify-center relative" data-menu-wrapper>
                                <button
                                  title="Actions"
                                  // onClick={() => toggleMenu(tl.id)}
                                  onClick={(e) => toggleMenu(tl.id, e)}
                                  className="p-1 rounded hover:bg-gray-100"
                                  aria-haspopup="true"
                                  aria-expanded={openMenuId === tl.id}
                                >
                                  {/* three vertical dots */}
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 6a2 2 0 100-4 2 2 0 000 4zM10 12a2 2 0 100-4 2 2 0 000 4zM10 18a2 2 0 100-4 2 2 0 000 4z" />
                                  </svg>
                                </button>

                                {/* {openMenuId === tl.id && (
                                  <div
                                    data-menu-id
                                    className="absolute right-0 top-full mt-2 w-44 bg-white rounded-md shadow-lg border z-50"
                                  >
                                    <div className="py-1">
                                      <button
                                        onClick={() => { openView(tl); setOpenMenuId(null); }}
                                        className="w-full text-left px-4 py-2 flex items-center gap-3 text-sm hover:bg-gray-50"
                                      > */}
                                        {/* eye icon */}
                                        {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 3C6 3 2.7 5.1 1 8c1.7 2.9 5 5 9 5s7.3-2.1 9-5c-1.7-2.9-5-5-9-5zM10 12a4 4 0 110-8 4 4 0 010 8z" />
                                          <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
                                        </svg>
                                        <span className="text-gray-800">View</span>
                                      </button> */}

                                      {/* <button
                                        onClick={() => { openLogForm(tl); setOpenMenuId(null); }}
                                        className="w-full text-left px-4 py-2 flex items-center gap-3 text-sm hover:bg-gray-50"
                                      > */}
                                        {/* pencil icon */}
                                        {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.465.263l-4 1a1 1 0 01-1.212-1.212l1-4a1 1 0 01.263-.465l9.9-9.9a2 2 0 012.828 0z" />
                                        </svg>
                                        <span className="text-gray-800">Edit</span>
                                      </button> */}

                                      {/* <button
                                        onClick={() => { openDelete(tl); setOpenMenuId(null); }}
                                        className="w-full text-left px-4 py-2 flex items-center gap-3 text-sm hover:bg-gray-50"
                                      > */}
                                        {/* trash - red */}
                                        {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 000 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-red-600">Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                )} */}















{openMenuId !== null && menuPosition &&
  createPortal(
    <div
      className="fixed z-[99999]"
      style={{ top: menuPosition.top, left: menuPosition.left }}
      onMouseDown={(e) => e.stopPropagation()} // prevent outside close
    >
      <div className="w-44 bg-white rounded-md shadow-xl border overflow-hidden">
        <button
          onClick={() => {
            const log = getLogById(openMenuId);
            if (log) openView(log);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
        >
          View
        </button>

        <button
          onClick={() => {
            const log = getLogById(openMenuId);
            if (log) openLogForm(log);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
        >
          Edit
        </button>

        <button
          onClick={() => {
            const log = getLogById(openMenuId);
            if (log) openDelete(log);
            setOpenMenuId(null);
            setMenuPosition(null);
          }}
          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
        >
          Delete
        </button>
      </div>
    </div>,
    document.body
  )}





                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 px-3 text-gray-500">
                            No time logs available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* View Modal */}
      {isViewOpen && selectedLog && (
        // <div className="fixed inset-0 z-[10020] flex items-start justify-center pt-8 px-6">
                // <div className="fixed inset-0 z-[10020] flex items-start justify-center pt-8 px-4">
<div className="fixed inset-0 z-[10020] flex justify-end">


          <div className="absolute inset-0 bg-black/40" onClick={() => setIsViewOpen(false)} />
          {/* <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden"> */}
<div className="relative bg-white w-[83%] h-full shadow-xl overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">Timesheet</h3>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setIsViewOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative bg-white rounded-xl border p-6">
                  <div className="absolute top-4 right-4 text-gray-500">⋮</div>

                  <h4 className="text-lg font-medium mb-4">TimeLog Details</h4>

                  <div className="grid grid-cols-3 gap-y-4 gap-x-6 items-center text-sm">
                    <div className="text-gray-500">Start Time</div>
                    <div className="col-span-2">
                      {formatDateTime(selectedLog.startDate, selectedLog.startTime)}
                    </div>

                    <div className="text-gray-500">End Time</div>
                    <div className="col-span-2">
                      {formatDateTime(selectedLog.endDate, selectedLog.endTime)}
                    </div>

                    <div className="text-gray-500">Total Hours</div>
                    <div className="col-span-2">
                      {typeof selectedLog.durationHours === "number"
                        ? `${selectedLog.durationHours}h`
                        : "-"}
                    </div>

                    <div className="text-gray-500">Memo</div>
                    <div className="col-span-2">{selectedLog.memo ?? "-"}</div>

                    <div className="text-gray-500">Project</div>
                    <div className="col-span-2">
                      {selectedLog.projectName ?? selectedLog.projectShortCode ?? selectedLog.projectId ?? "-"}
                    </div>

                    <div className="text-gray-500">Task</div>
                    <div className="col-span-2">{selectedLog.taskName ?? `Task ${selectedLog.taskId ?? "-"}`}</div>

                    <div className="text-gray-500">Employee</div>
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {selectedLog.employees && selectedLog.employees[0]?.profileUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedLog.employees[0].profileUrl!} alt={selectedLog.employees[0].name ?? ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {selectedLog.employees && selectedLog.employees[0]?.name
                            ? selectedLog.employees[0].name
                            : selectedLog.employeeId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedLog.employees && selectedLog.employees[0]?.designation ? selectedLog.employees[0].designation : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-5">
                  <h5 className="font-medium mb-3">History</h5>

                  <div className="space-y-4 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <div className="text-gray-500">Start Time</div>
                      <div>{formatDateTime(selectedLog.startDate, selectedLog.startTime)}</div>
                    </div>

                    <div className="flex justify-between">
                      <div className="text-gray-500">Task</div>
                      <div>{selectedLog.taskName ?? `Task ${selectedLog.taskId ?? "-"}`}</div>
                    </div>

                    <div className="flex justify-between">
                      <div className="text-gray-500">End Time</div>
                      <div>{formatDateTime(selectedLog.endDate, selectedLog.endTime)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 pb-6">
                <button onClick={() => setIsViewOpen(false)} className="px-6 py-2 rounded-md border text-blue-600">Close</button>
                <button onClick={() => { if (selectedLog) openLogForm(selectedLog); setIsViewOpen(false); }} className="px-6 py-2 rounded-md bg-blue-600 text-white">Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Time (Edit/Create) Modal */}
      {showLogModal && (
        // <div className="fixed inset-0 z-[10020] flex items-start justify-center pt-12 px-4">
<div className="fixed inset-0 z-[10020] flex justify-end">

          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogModal(false)} />
          {/* <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden"> */}
          <div className="relative bg-white w-[83%] h-full shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">{editingId ? "Edit TimeLog" : "Log Time"}</h3>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => setShowLogModal(false)} aria-label="Close">✕</button>
            </div>

            <div className="p-6">
              <div className="bg-white rounded-md border p-6">
                <h4 className="text-md font-medium mb-4">TimeLog Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Project *</label>
                    <select
                      value={form.projectId || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((s) => ({ ...s, projectId: value, taskId: "", employeeId: "" }));
                        if (value) {
                          fetchProjectTasks(value);
                        } else {
                          setProjectTasks([]);
                          setSelectedTaskEmployees([]);
                        }
                      }}
                      className="w-full border rounded px-3 py-2 text-sm"
                    >
                      <option value="">--</option>
                      {projectsLoading && <option value="">Loading...</option>}
                      {projectsError && <option value="">Error loading projects</option>}
                      {projectOptions.map((p) => (
                        <option key={`${p.id}-${p.shortCode}`} value={String(p.id)}>
                          {p.id != null ? `#${p.id} - ${p.name || p.shortCode}` : p.name || p.shortCode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Task *</label>
                    <select
                      value={form.taskId || "--"}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "--") {
                          setForm((s) => ({ ...s, taskId: "", employeeId: "" }));
                          setSelectedTaskEmployees([]);
                          return;
                        }
                        const idNum = Number(val);
                        const task = projectTasks.find((t) => t.id === idNum);
                        setForm((s) => ({ ...s, taskId: val, employeeId: "" }));
                        setSelectedTaskEmployees(task?.assignedEmployees ?? []);
                      }}
                      className="w-full border rounded px-3 py-2 text-sm"
                      disabled={!!form.projectId && projectTasks.length === 0}
                    >
                      {form.projectId ? (
                        projectTasks.length === 0 ? (
                          <option value="--">No tasks</option>
                        ) : (
                          <>
                            <option value="--">--</option>
                            {projectTasks.map((t) => (
                              <option key={t.id} value={String(t.id)}>
                                {t.title ? `${t.id} - ${t.title}` : `Task ${t.id}`}
                              </option>
                            ))}
                          </>
                        )
                      ) : (
                        <option value="--">--</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Employee *</label>
                    <select
                      value={form.employeeId || "--"}
                      onChange={(e) => setForm((s) => ({ ...s, employeeId: e.target.value === "--" ? "" : e.target.value }))}
                      className="w-full border rounded px-3 py-2 text-sm"
                      disabled={!!form.projectId && projectTasks.length === 0}
                    >
                      {(() => {
                        const projectEmployees = form.projectId ? projectEmployeeMap.get(form.projectId) ?? [] : [];

                        if (form.projectId && projectTasks.length === 0) {
                          return <option value="--">No employees</option>;
                        }

                        if (selectedTaskEmployees.length > 0) {
                          return (
                            <>
                              <option value="--">--</option>
                              {selectedTaskEmployees.map((e) => (
                                <option key={e.employeeId} value={e.employeeId}>
                                  {e.name ? `${e.name} (${e.employeeId})` : e.employeeId}
                                </option>
                              ))}
                            </>
                          );
                        }

                        if (form.projectId && projectEmployees.length > 0) {
                          return (
                            <>
                              <option value="--">--</option>
                              {projectEmployees.map((e) => (
                                <option key={e.employeeId} value={e.employeeId}>
                                  {e.name ? `${e.name} (${e.employeeId})` : e.employeeId}
                                </option>
                              ))}
                            </>
                          );
                        }

                        return employeeOptions.map((e) => (
                          <option key={e} value={e}>
                            {e === "--" ? "--" : e}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Start Date *</label>
                    <input type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Start Time *</label>
                    <input type="time" value={form.startTime} onChange={(e) => setForm((s) => ({ ...s, startTime: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">End Date *</label>
                    <input type="date" value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">End Time *</label>
                    <input type="time" value={form.endTime} onChange={(e) => setForm((s) => ({ ...s, endTime: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Memo *</label>
                    <input type="text" value={form.memo} onChange={(e) => setForm((s) => ({ ...s, memo: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm" placeholder="Memo" />
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Hours</div>
                    <div className="text-2xl font-semibold text-blue-600">{modalTotalHours}h</div>
                  </div>
                </div>

                {saveError && <div className="mt-4 text-sm text-red-600">{saveError}</div>}
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 pb-6">
                <button onClick={() => setShowLogModal(false)} className="px-6 py-2 rounded-md border text-blue-600" disabled={saving}>Cancel</button>

                <button onClick={saveEntry} className="px-6 py-2 rounded-md bg-blue-600 text-white shadow" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {isDeleteConfirmOpen && selectedLog && (
        <div className="fixed inset-0 z-[10040] flex items-start justify-center pt-12 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDeleteConfirmOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Delete TimeLog</h3>
              <p className="text-sm text-gray-700">
                Are you sure you want to delete timesheet <strong>#{String(selectedLog.id)}</strong>? This action cannot be undone.
              </p>

              {saveError && <div className="mt-4 text-sm text-red-600">{saveError}</div>}

              <div className="flex items-center justify-end gap-4 mt-6">
                <button className="px-4 py-2 rounded border" onClick={() => setIsDeleteConfirmOpen(false)} disabled={saving}>Cancel</button>
                <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={deleteTimesheet} disabled={saving}>
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





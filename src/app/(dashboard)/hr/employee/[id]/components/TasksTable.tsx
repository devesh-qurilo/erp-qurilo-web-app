

// components/TasksTable.tsx
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { UserIcon } from "@heroicons/react/24/outline";
import { deleteAPI, postAPI, putAPI } from "@/app/api/apiHelper";
// import { getStorage } from "../../../../../lib/storage/storege";
import EmployeeCreateTaskModal from "./EmployeeCreateTaskModal";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


import TaskViewModal, { TaskForView } from "@/app/(dashboard)/work/project/components/TaskViewModal"; // adjust path if needed
import { format } from "date-fns";

type Employee = {
    employeeId: string;
    name: string;
    profileUrl?: string | null;
};

type Label = { id: number; name: string; colorCode?: string };
type Milestone = { id: number; title: string };

type Task = {
    id: number;
    title: string;
    projectId: number;
    projectShortCode?: string | null;
    projectName?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
    noDueDate?: boolean;
    taskStage?: { id?: number; name?: string } | null;
    taskStageId?: number;
    assignedEmployeeIds?: string[];
    assignedEmployees?: Employee[] | null;
    description?: string | null;
    labels?: Label[];
    milestone?: Milestone | null;
    milestoneId?: number | null;
    priority?: string | null;
    isPrivate?: boolean;
    timeEstimateMinutes?: number | null;
    isDependent?: boolean;
    dependentTaskId?: number | null;
    attachments?: any[];
    pinned?: boolean | null;
    hoursLoggedMinutes?: number | null;
    employeeId?: string;
};



type StatusItem = {
    id: number;
    name: string;
    position?: number;
    labelColor?: string | null;
    projectId?: number | null;
    createdBy?: string;
};

const MAIN = process.env.NEXT_PUBLIC_MAIN;

export default function TasksTable({ employeeId, }: { employeeId: string }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projectId, setProjectId] = useState('')

    // status list loaded from server
    const [statuses, setStatuses] = useState<StatusItem[]>([]);

    // modals / form state (kept as-is)
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);

    // NEW: view modal state (minimal addition)
    const [showView, setShowView] = useState(false);
    const [viewTask, setViewTask] = useState<TaskForView | null>(null);

    // separate menus for action and status (to avoid conflicts)
    const [actionOpenFor, setActionOpenFor] = useState<number | null>(null);
    const [statusOpenFor, setStatusOpenFor] = useState<number | null>(null);


    const [projectEmployees, setProjectEmployees] = useState<Employee[]>([]);
const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

    // form helpers
    const emptyForm = {
        title: "",
        category: "",
        startDate: "",
        dueDate: "",
        noDueDate: false,
        taskStageId: "",
        assignedEmployeeIds: [] as string[],
        description: "",
        labelIds: [] as string[],
        milestoneId: "",
        priority: "LOW",
        isPrivate: false,
        timeEstimateMinutes: "",
        isDependent: false,
        projectId: projectId,
        taskFile: null as File | null,
    };
    const [form, setForm] = useState(emptyForm);

    const base = (path: string) => (MAIN ? `${MAIN}${path}` : path);

    // fetch statuses from /status
    const fetchStatuses = async () => {
        try {
            const url = `${MAIN}/status`;
            const token = localStorage.getItem("accessToken");
            const res = await axios.get(url, {
                headers: { Authorization: token ? `Bearer ${token}` : "" },
            });
            if (Array.isArray(res.data)) setStatuses(res.data);
            else setStatuses([]);
        } catch (err) {
            console.warn("Failed to fetch statuses:", err);
            setStatuses([]);
        }
    };

    // fetch tasks
    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("accessToken");
            // const url = `${MAIN}/projects/${projectId}/tasks`;
            const url = `${MAIN}/api/projects/tasks/employee/${employeeId}`
            const res = await axios.get(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });
            setTasks(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || "Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };



const fetchProjectEmployees = async (pid: number) => {
    try {
        const token = localStorage.getItem("accessToken");

        const res = await axios.get(`${MAIN}/api/projects/${pid}`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
        });

        const list =
            res.data?.assignedEmployees ||
            res.data?.employees ||
            res.data?.data?.assignedEmployees ||
            [];

        setProjectEmployees(list);
    } catch (err) {
        console.warn("Failed to load project employees");
        setProjectEmployees([]);
    }
};



    useEffect(() => {
        fetchStatuses();
        fetchTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const updateForm = (patch: Partial<typeof emptyForm>) => setForm((s) => ({ ...s, ...patch }));

    // create
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("category", form.category || "");
            fd.append("startDate", form.startDate || "");
            fd.append("dueDate", form.dueDate || "");
            fd.append("noDueDate", String(form.noDueDate));
            fd.append("taskStageId", form.taskStageId || "");
            fd.append("assignedEmployeeIds", JSON.stringify(form.assignedEmployeeIds));
            fd.append("description", form.description || "");
            fd.append("labelIds", JSON.stringify(form.labelIds));
            fd.append("milestoneId", form.milestoneId || "");
            fd.append("priority", form.priority || "");
            fd.append("isPrivate", String(form.isPrivate));
            fd.append("timeEstimateMinutes", String(form.timeEstimateMinutes || ""));
            fd.append("isDependent", String(form.isDependent));
            fd.append("projectId", String(projectId));
            if (form.taskFile) fd.append("taskFile", form.taskFile);

            await postAPI(base("/api/projects/tasks"), fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setShowCreate(false);
            setForm(emptyForm);
            await fetchTasks();
        } catch (err: any) {
            alert("Create task failed: " + (err?.response?.data?.message || err?.message || "unknown"));
        }
    };

    // edit
    const openEdit = (t: Task) => {
        setEditTask(t);

    fetchProjectEmployees(t.projectId); // load employees of that project

        setForm({
            title: t.title || "",
            category: (t as any).categoryId?.id ? String((t as any).categoryId.id) : "",
            startDate: t.startDate ? t.startDate : "",
            dueDate: t.dueDate ? t.dueDate : "",
            noDueDate: !!t.noDueDate,
            taskStageId: t.taskStageId ? String(t.taskStageId) : "",
            assignedEmployeeIds: t.assignedEmployeeIds || [],
            description: t.description || "",
            labelIds: (t.labels || []).map((l) => String(l.id)),
            milestoneId: t.milestoneId ? String(t.milestoneId) : "",
            priority: t.priority || "LOW",
            isPrivate: !!t.isPrivate,
            timeEstimateMinutes: t.timeEstimateMinutes ? String(t.timeEstimateMinutes) : "",
            isDependent: !!t.isDependent,
            projectId: t.projectId,
            taskFile: null,
        });
        setShowEdit(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTask) return;
        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("category", form.category || "");
            fd.append("noDueDate", String(form.noDueDate));
            fd.append("description", form.description || "");
            fd.append("labelIds", JSON.stringify(form.labelIds));
            fd.append("priority", form.priority || "");
            fd.append("isPrivate", String(form.isPrivate));
            fd.append("timeEstimateMinutes", String(form.timeEstimateMinutes || ""));
            fd.append("isDependent", String(form.isDependent));
            // fd.append("projectId", String(projectId));
            fd.append("projectId", String(form.projectId));
            fd.append("assignedEmployeeIds", JSON.stringify(form.assignedEmployeeIds));
            if (form.taskFile) fd.append("taskFile", form.taskFile);

            await putAPI(base(`/api/projects/tasks/${editTask.id}`), fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setShowEdit(false);
            setEditTask(null);
            setForm(emptyForm);
            await fetchTasks();
        } catch (err: any) {
            alert("Update task failed: " + (err?.response?.data?.message || err?.message || "unknown"));
        }
    };

    // delete
    const handleDelete = async (taskId: number) => {
        if (!confirm("Are you sure to delete this task?")) return;
        try {
            await deleteAPI(base(`/api/projects/${editTask?.projectId}/tasks/${taskId}`));
            setActionOpenFor(null);
            await fetchTasks();
        } catch (err: any) {
            alert("Delete failed: " + (err?.response?.data?.message || err?.message || "unknown"));
        }
    };

    // helper: get status item by name (case-insensitive)
    const findStatusByName = (name: string) => {
        if (!statuses || !statuses.length) return undefined;
        return statuses.find((s) => String(s.name).toLowerCase().includes(String(name).toLowerCase()));
    };

    // map status name or id -> color class or inline color
    const statusColorClass = (s?: StatusItem | string | null) => {
        const name = typeof s === "string" ? s : s?.name ?? "";
        switch (name.toLowerCase()) {
            case "complete":
            case "completed":
            case "complete":
            case "complete":
                return "bg-green-600";
            case "to-do":
            case "to do":
            case "todo":
                return "bg-yellow-500";
            case "doing":
                return "bg-blue-600";
            case "incomplete":
                return "bg-red-600";
            case "waiting":
            case "waiting for approval":
                return "bg-gray-600";
            default:
                return "bg-gray-400";
        }
    };

    // Update status (optimistic + backend) using the URL you specified:
    // PUT {{base_url}}/api/projects/tasks/{{taskId}}/status?statusId={{stageId}}
    const changeStatus = async (task: Task, statusItem: StatusItem) => {
        // optimistic update locally
        setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, taskStage: { id: statusItem.id, name: statusItem.name }, taskStageId: statusItem.id } : t))
        );

        const token = localStorage.getItem("accessToken");
        try {
            // Use the exact endpoint you provided:
            const url = `${MAIN}/api/projects/tasks/${task.id}/status?statusId=${statusItem.id}`;

            await axios.patch(
                url,
                {}, // no body needed per your pattern (statusId is query param)
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: token ? `Bearer ${token}` : "",
                    },
                }
            );

            // close the menu
            setStatusOpenFor(null);
        } catch (err: any) {
            console.error("Failed to update status:", err);
            alert("Failed to update status on server. Refreshing tasks.");
            // revert by reloading tasks (safe fallback)
            await fetchTasks();
            setStatusOpenFor(null);
        }
    };

    // NEW: open View modal (minimal, only sets viewTask + showView)
    const openView = (t: Task) => {
        // Cast Task -> TaskForView (fields align sufficiently)
        setViewTask(t as unknown as TaskForView);
        setShowView(true);
    };

    // helpers
    const minsToHuman = (mins?: number | null) => {
        if (!mins && mins !== 0) return "--";
        const h = Math.floor((mins || 0) / 60);
        const m = (mins || 0) % 60;
        if (h && m) return `${h}h ${m}m`;
        if (h) return `${h}h`;
        return `${m}m`;
    };

    // helper to get display status (prefer server taskStage, else find by id)
    const getDisplayStatus = (t: Task) => {
        if (t.taskStage && t.taskStage.name) return t.taskStage;
        if (t.taskStageId) {
            const s = statuses.find((st) => st.id === t.taskStageId);
            if (s) return s;
        }
        const guessed = findStatusByName(String(t.taskStage?.name || ""));
        return guessed ?? { id: t.taskStageId ?? 0, name: t.taskStage?.name ?? "Doing" };
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* <h2 className="text-xl font-semibold mb-4">Tasks</h2> */}


            {loading ? (
  <Skeleton width={120} height={25} className="mb-4" />
) : (
  <h2 className="text-xl font-semibold mb-4">Tasks</h2>
)}

            {/* header */}


{/* 
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setForm({ ...emptyForm, projectId });
                            setShowCreate(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700"
                    >
                        + Add Task
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        placeholder="Search"
                        onChange={(e) => {
                            const q = e.target.value.toLowerCase();
                            if (!q) fetchTasks();
                            else setTasks((prev) => prev.filter((t) => (t.title || "").toLowerCase().includes(q) || (t.projectName || "").toLowerCase().includes(q)));
                        }}
                        className="border px-3 py-2 rounded-md text-sm"
                    />
                </div>
            </div> */}



<div className="flex items-center justify-between mb-4">
  {loading ? (
    <>
      <Skeleton width={120} height={40} />
      <Skeleton width={200} height={40} />
    </>
  ) : (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setForm({ ...emptyForm, projectId });
            setShowCreate(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700"
        >
          + Add Task
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search"
          onChange={(e) => {
            const q = e.target.value.toLowerCase();
            if (!q) fetchTasks();
            else
              setTasks((prev) =>
                prev.filter(
                  (t) =>
                    (t.title || "").toLowerCase().includes(q) ||
                    (t.projectName || "").toLowerCase().includes(q)
                )
              );
          }}
          className="border px-3 py-2 rounded-md text-sm"
        />
      </div>
    </>
  )}
</div>



            {/* table */}
            {/* {loading ? (
                <div className="py-6 text-center text-gray-500">Loading tasks...</div>
            ) : error ? ( */}



{loading ? (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="bg-blue-50">
          {Array.from({ length: 11 }).map((_, i) => (
            <th key={i} className="px-4 py-3">
              <Skeleton width={80} />
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: 6 }).map((_, i) => (
          <tr key={i} className="border-b">
            <td className="px-4 py-4"><Skeleton width={60} /></td>

            <td className="px-4 py-4">
              <Skeleton width={120} />
              <Skeleton width={80} />
            </td>

            <td className="px-4 py-4"><Skeleton width={80} /></td>
            <td className="px-4 py-4"><Skeleton width={90} /></td>
            <td className="px-4 py-4"><Skeleton width={90} /></td>
            <td className="px-4 py-4"><Skeleton width={70} /></td>
            <td className="px-4 py-4"><Skeleton width={70} /></td>
            <td className="px-4 py-4"><Skeleton width={80} /></td>

            {/* avatars */}
            <td className="px-4 py-4">
              <div className="flex gap-2">
                <Skeleton circle width={24} height={24} />
                <Skeleton circle width={24} height={24} />
              </div>
            </td>

            {/* status */}
            <td className="px-4 py-4">
              <Skeleton width={80} height={25} />
            </td>

            {/* action */}
            <td className="px-4 py-4">
              <Skeleton width={30} height={30} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : error ? (


                <div className="py-6 text-center text-red-500">{error}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm ">
                        <thead>
                            <tr className="bg-blue-50 text-left text-gray-600">
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3">Task</th>
                                <th className="px-4 py-3">Completed On</th>
                                <th className="px-4 py-3">Start Date</th>
                                <th className="px-4 py-3">Due Date</th>
                                <th className="px-4 py-3">Hours Logged</th>
                                <th className="px-4 py-3">Estimated Time</th>
                                <th className="px-4 py-3">Milestones</th>
                                <th className="px-4 py-3">Assigned to</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {tasks.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-6 text-center text-gray-500">
                                        No tasks found
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((t) => {
                                    const isOverdue = t.dueDate && !t.noDueDate && new Date(t.dueDate) < new Date();
                                    const displayStatus = getDisplayStatus(t);
                                    const statusName = displayStatus?.name ?? "Doing";
                                    return (
                                        <tr key={t.id} className="border-b last:border-b-0 bg-white hover:bg-gray-50">
                                            <td className="px-4 py-4 align-top">RTA-{String(t.id).padStart(2, "0")}</td>

                                            <td className="px-4 py-4 align-top">
                                                <div className="font-medium">{t.title}</div>
                                                <div className="text-xs text-gray-500 mt-1">{t.projectName ?? `Project ${t.projectId}`}</div>
                                            </td>

                                            <td className="px-4 py-4 align-top">--</td>

                                            <td className="px-4 py-4 align-top">{t.startDate ?
                                                // new Date(t.startDate).toLocaleDateString()
                                                format(new Date(t.startDate), "dd-MM-yyyy")
                                                : "--"}</td>

                                            <td className={`px-4 py-4 align-top ${isOverdue ? "text-red-600" : ""}`}>
                                                {t.noDueDate ? "--" : t.dueDate ?
                                                    // new Date(t.dueDate).toLocaleDateString()
                                                    format(new Date(t.dueDate), "dd-MM-yyyy")
                                                    : "--"}
                                            </td>

                                            <td className="px-4 py-4 align-top">{minsToHuman(t.hoursLoggedMinutes ?? null)}</td>

                                            <td className="px-4 py-4 align-top">{minsToHuman(t.timeEstimateMinutes ?? null)}</td>

                                            <td className="px-4 py-4 align-top">{t.milestone?.title ?? "--"}</td>

                                            <td className="px-4 py-4 align-top">
                                                <div className="flex -space-x-2">
                                                    {(t.assignedEmployees || []).slice(0, 3).map((e) => (
                                                        <div key={e.employeeId} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100">
                                                            {e.profileUrl ? <img src={e.profileUrl} alt={e.name} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full text-gray-400 p-1" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 align-top relative">
                                                {/* Status pill with dropdown icon */}
                                                <div className="relative inline-block">
                                                    <button
                                                        onClick={(ev) => {
                                                            ev.stopPropagation();
                                                            setActionOpenFor(null);
                                                            setStatusOpenFor((cur) => (cur === t.id ? null : t.id));
                                                        }}
                                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs bg-white hover:bg-gray-50"
                                                        title="Change status"
                                                    >
                                                        {/* Dot: use labelColor if available */}
                                                        {displayStatus && displayStatus.labelColor ? (
                                                            <span
                                                                style={{
                                                                    width: 8,
                                                                    height: 8,
                                                                    borderRadius: 9999,
                                                                    display: "inline-block",
                                                                    background: `#${String(displayStatus.labelColor).replace(/[^0-9a-fA-F]/g, "").slice(0, 6)}`,
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className={`w-2 h-2 rounded-full ${statusColorClass(displayStatus?.name ?? "Doing")}`} />
                                                        )}
                                                        <span>{String(statusName)}</span>
                                                        <span className="text-xs">▾</span>
                                                    </button>

                                                    {statusOpenFor === t.id && (
                                                        <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 z-30 w-44 bg-white border rounded-md shadow-lg text-sm">
                                                            {statuses.length > 0 ? (
                                                                statuses.map((st) => (
                                                                    <button
                                                                        key={st.id}
                                                                        onClick={() => changeStatus(t, st)}
                                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 ${st.id === displayStatus?.id ? "font-medium" : ""}`}
                                                                    >
                                                                        {st.labelColor ? (
                                                                            <span style={{ width: 8, height: 8, borderRadius: 9999, background: `#${String(st.labelColor).replace(/[^0-9a-fA-F]/g, "").slice(0, 6)}` }} />
                                                                        ) : (
                                                                            <span className={`w-2 h-2 rounded-full ${statusColorClass(st.name)}`} />
                                                                        )}
                                                                        <span>{st.name}</span>
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                ["To Do", "Doing", "Completed", "Incomplete", "Waiting for Approval"].map((opt) => (
                                                                    <button
                                                                        key={opt}
                                                                        onClick={() => {
                                                                            const fake: StatusItem = { id: 0, name: opt };
                                                                            changeStatus(t, fake);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                                                    >
                                                                        <span className={`w-2 h-2 rounded-full ${statusColorClass(opt)}`} /> <span>{opt}</span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 align-top relative">
                                                <button
                                                    onClick={(ev) => {
                                                        ev.stopPropagation();
                                                        setStatusOpenFor(null);
                                                        setActionOpenFor((cur) => (cur === t.id ? null : t.id));
                                                    }}
                                                    className="p-1 rounded hover:bg-gray-100"
                                                    aria-haspopup="true"
                                                    aria-expanded={actionOpenFor === t.id}
                                                    title="More"
                                                >
                                                    ⋮
                                                </button>

                                                {/* ACTION menu - anchored to row */}
                                                {actionOpenFor === t.id && (
                                                    <div onClick={(e) => e.stopPropagation()} className="absolute right-2 top-10 z-20 w-48 bg-white border rounded-md shadow-md">
                                                        <button
                                                            onClick={() => {
                                                                // OPEN external TaskViewModal
                                                                openView(t);
                                                                setActionOpenFor(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                                        >
                                                            View
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                openEdit(t);
                                                                setActionOpenFor(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setActionOpenFor(null);
                                                                handleDelete(t.id);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {/* footer (pagination-ish display) */}
                    <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600 rounded-b-md mt-4">
                        {/* <div>Result per page - {tasks.length ? tasks.length : 0}</div>
                        <div>Page 1 of 1</div> */}
                    </div>



                </div>
            )}



            {/* Edit modal (unchanged) */}
            {showEdit && editTask && (
                // <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
                <div className="fixed inset-0 z-[20000] flex justify-end">
                    <form onSubmit={handleEdit}
                    //  className="bg-white w-full max-w-3xl rounded-lg p-6 shadow-lg overflow-auto max-h-[90vh]"
                      className="relative bg-white w-[83%] h-full shadow-2xl overflow-y-auto"

                     >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Edit Task</h3>
                            <button type="button" onClick={() => { setShowEdit(false); setEditTask(null); }} className="text-gray-500">Close</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex flex-col">
                                <span className="text-xs text-gray-600">Title</span>
                                <input required value={form.title} onChange={(e) => updateForm({ title: e.target.value })} className="border px-3 py-2 rounded" />
                            </label>

                            <label className="flex flex-col">
                                <span className="text-xs text-gray-600">Category (id)</span>
                                <input value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="border px-3 py-2 rounded" />
                            </label>

                            <label className="flex flex-col md:col-span-2">
                                <span className="text-xs text-gray-600">Description</span>
                                <textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} className="border px-3 py-2 rounded" />
                            </label>

                            {/* <label className="flex flex-col">
                                <span className="text-xs text-gray-600">Assigned Employee IDs (comma separated)</span>
                                <input value={form.assignedEmployeeIds.join(",")} onChange={(e) => updateForm({ assignedEmployeeIds: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} className="border px-3 py-2 rounded" />
                            </label> */}


<div className="relative md:col-span-2">
    <span className="text-xs text-gray-600">Assign Employees</span>

    <button
        type="button"
        onClick={() => setEmployeeDropdownOpen(v => !v)}
        className="mt-1 w-full border px-3 py-2 rounded text-left flex justify-between items-center"
    >
        <span>
            {form.assignedEmployeeIds.length === 0
                ? "Select employees"
                : `${form.assignedEmployeeIds.length} selected`}
        </span>
        <span>▾</span>
    </button>

    {employeeDropdownOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">

            {projectEmployees.map(emp => {

                const checked = form.assignedEmployeeIds.includes(emp.employeeId);

                return (
                    <label
                        key={emp.employeeId}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {

                                updateForm({
                                    assignedEmployeeIds: checked
                                        ? form.assignedEmployeeIds.filter(id => id !== emp.employeeId)
                                        : [...form.assignedEmployeeIds, emp.employeeId]
                                });

                            }}
                        />

                        <span>{emp.name}</span>
                    </label>
                );
            })}

        </div>
    )}
</div>



                            <label className="flex flex-col">
                                <span className="text-xs text-gray-600">Label IDs (comma separated)</span>
                                <input value={form.labelIds.join(",")} onChange={(e) => updateForm({ labelIds: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} className="border px-3 py-2 rounded" />
                            </label>

                            <label className="flex flex-col">
                                <span className="text-xs text-gray-600">Priority</span>
                                <select value={form.priority} onChange={(e) => updateForm({ priority: e.target.value })} className="border px-3 py-2 rounded">
                                    <option value="LOW">LOW</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="URGENT">URGENT</option>
                                </select>
                            </label>

                            <label className="flex flex-col">
                                <span className="text-xs text-gray-600">Time Estimate (minutes)</span>
                                <input type="number" value={form.timeEstimateMinutes} onChange={(e) => updateForm({ timeEstimateMinutes: e.target.value })} className="border px-3 py-2 rounded" />
                            </label>

                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.isPrivate} onChange={(e) => updateForm({ isPrivate: e.target.checked })} />
                                <span className="text-sm text-gray-600">Private</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={form.isDependent} onChange={(e) => updateForm({ isDependent: e.target.checked })} />
                                <span className="text-sm text-gray-600">Is Dependent</span>
                            </label>

                            <label className="flex flex-col md:col-span-2">
                                <span className="text-xs text-gray-600">Attach file (optional)</span>
                                <input type="file" onChange={(e) => updateForm({ taskFile: e.target.files?.[0] || null })} />
                            </label>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-3">
                            <button type="button" onClick={() => { setShowEdit(false); setEditTask(null); }} className="px-4 py-2 rounded border">Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Update</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Task view modal (external component) */}
            <TaskViewModal
                open={showView}
                task={viewTask}
                onClose={() => {
                    setShowView(false);
                    setViewTask(null);
                }}
            />

            <EmployeeCreateTaskModal
                open={showCreate}
                projectId={employeeId}
                // employeeId={employeeId}
                onClose={() => setShowCreate(false)}
                onCreated={fetchTasks}
            />



        </div>
    );
}




"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    projectId?: string; // ⚠️ actually employeeId
}

export default function EmployeeCreateTaskModal({
    open,
    onClose,
    onCreated,
    projectId, // employeeId
}: Props) {
    const MAIN = process.env.NEXT_PUBLIC_MAIN;
    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;

    /* ================= FORM STATES ================= */
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [noDueDate, setNoDueDate] = useState(false);
    const [taskStageId, setTaskStageId] = useState("");
    const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [labelId, setLabelId] = useState("");
    const [milestoneId, setMilestoneId] = useState("");
    const [priority, setPriority] = useState("LOW");
    const [isPrivate, setIsPrivate] = useState(false);
    const [timeEstimate, setTimeEstimate] = useState(false);
    const [timeEstimateMinutes, setTimeEstimateMinutes] = useState("");
    const [isDependent, setIsDependent] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [employeeProjects, setEmployeeProjects] = useState<any[]>([]);

    /* ================= UI STATES ================= */
    const [assignOpen, setAssignOpen] = useState(false);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [categoryLoading, setCategoryLoading] = useState(false);

    const [showLabelModal, setShowLabelModal] = useState(false);
    const [labelName, setLabelName] = useState("");
    const [labelColor, setLabelColor] = useState("");
    const [labelDesc, setLabelDesc] = useState("");
    const [labelProjectId, setLabelProjectId] = useState("");
    const [labelLoading, setLabelLoading] = useState(false);

    /* ================= API DATA ================= */
    const [categories, setCategories] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [labels, setLabels] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    /* ================= FETCH BASE DATA ================= */
    useEffect(() => {
        // if (!open || !MAIN || !token) return;
        if (!selectedProjectId || !MAIN || !token) {
            setEmployees([]);
            return;
        }

        fetch(`${MAIN}/task/task-categories`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) =>
                setCategories(Array.isArray(j) ? j : j?.data || [])
            );

        fetch(`${MAIN}/status`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) => setStages(Array.isArray(j) ? j : j?.data || []));

        //     fetch(`${MAIN}/employee/all`, {
        //         headers: { Authorization: `Bearer ${token}` },
        //     })
        //         .then((r) => r.json())
        //         .then((j) => setEmployees(Array.isArray(j) ? j : j?.data || []));
        // }, [open, MAIN, token]);



        fetch(`${MAIN}/api/projects/${selectedProjectId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                const list =
                    data?.assignedEmployees ||
                    data?.employees ||
                    data?.data?.assignedEmployees ||
                    [];

                setEmployees(list);
            })
            .catch(() => setEmployees([]));
    }, [selectedProjectId, MAIN, token]);



    /* ================= EMPLOYEE PROJECTS ================= */
    useEffect(() => {
        // if (!open || !MAIN || !token || !projectId) return;
        console.log("Fetching projects for employeeId:", projectId);
        fetch(`${MAIN}/api/projects/employee/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((json) => {
                const list = Array.isArray(json)
                    ? json
                    : Array.isArray(json?.data)
                        ? json.data
                        : [];

                setEmployeeProjects(
                    list.map((p: any) => ({
                        id: p.id || p.projectId,
                        name: p.name || p.projectName,
                    }))
                );
            })
            .catch(() => setEmployeeProjects([]));
    }, [open, projectId, MAIN, token]);

    /* ================= ALL PROJECTS (LABEL MODAL) ================= */
    useEffect(() => {
        if (!open || !MAIN || !token) return;

        fetch(`${MAIN}/projects`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) => setProjects(Array.isArray(j) ? j : j?.data || []))
            .catch(() => setProjects([]));
    }, [open, MAIN, token]);

    /* ================= PROJECT → MILESTONES + LABELS ================= */
    useEffect(() => {
        if (!labelProjectId || !MAIN || !token) return;

        fetch(`${MAIN}/api/projects/${labelProjectId}/milestones`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) =>
                setMilestones(Array.isArray(j) ? j : j?.data || [])
            );

        fetch(`${MAIN}/projects/${labelProjectId}/labels`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((j) => setLabels(Array.isArray(j) ? j : j?.data || []))
            .catch(() => setLabels([]));
    }, [labelProjectId, MAIN, token]);

    /* ================= SUBMIT ================= */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            const fd = new FormData();
            fd.append("title", title);
            fd.append("category", category);
            fd.append("projectId", selectedProjectId);
            fd.append("startDate", startDate);
            if (!noDueDate) fd.append("dueDate", dueDate);
            fd.append("taskStageId", taskStageId);
            fd.append("description", description);
            fd.append("priority", priority);
            fd.append("isPrivate", String(isPrivate));
            fd.append("timeEstimate", String(timeEstimate));
            fd.append("timeEstimateMinutes", timeEstimateMinutes);
            fd.append("isDependent", String(isDependent));
            fd.append("milestoneId", milestoneId);

            assignedEmployeeIds.forEach((id) =>
                fd.append("assignedEmployeeIds", id)
            );
            if (labelId) fd.append("labelIds", labelId);
            if (file) fd.append("taskFile", file);

            const res = await fetch(`${MAIN}/api/projects/tasks`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            if (!res.ok) throw new Error("Failed");

            onCreated();
            onClose();
        } catch {
            alert("Failed to create task");
        } finally {
            setLoading(false);
        }
    };

useEffect(() => {
  if (open) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return () => {
    document.body.style.overflow = "auto";
  };
}, [open]);



  if (!open) return null;

return createPortal(
//   <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
<div className="fixed inset-0 z-[9999] flex justify-end bg-black/40">
            {/* MAIN FORM */}
            <form
                onSubmit={handleSubmit}
                // className="bg-white w-full max-w-4xl rounded-lg p-6 shadow-lg overflow-auto max-h-[90vh]"
                className="bg-white w-[83%] h-full p-6 shadow-xl overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Add Task</h3>
                    <button type="button" onClick={onClose} className="text-gray-500">✕</button>
                </div>

                {/* TASK INFO */}
                <div className="border rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-3">Task Information</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-600">Title *</label>
                            <input className="border px-3 py-2 rounded w-full" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        </div>

                        {/* CATEGORY + ADD */}
                        <div>
                            <label className="text-xs text-gray-600">Task Category *</label>
                            <div className="flex gap-2">
                                <select className="border px-3 py-2 rounded w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="">--</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setShowCategoryModal(true)} className="px-4 py-2 rounded border bg-gray-100 text-sm">Add</button>
                            </div>
                        </div>



                        {/* PROJECT (NEW FIELD) */}
                        {/* <div>
  <label className="text-xs text-gray-600">Project *</label>
  <select
    className="border px-3 py-2 rounded w-full"
    value={selectedProjectId}
    onChange={(e) => {
      setSelectedProjectId(e.target.value);
      setLabelProjectId(e.target.value); // labels + milestones sync
    }}
    required
  >
    <option value="">-- Select Project --</option>

    {employeeProjects.map((p) => (
      <option key={p.id} value={p.id}>
        {p.name}
      </option>
    ))}






  </select>
</div>
 */}


                        {/* PROJECT */}
                        <div>
                            <label className="text-xs text-gray-600">Project *</label>

                            <select
                                className="border px-3 py-2 rounded w-full"
                                value={selectedProjectId}
                                onChange={(e) => {
                                    const pid = e.target.value;
                                    setSelectedProjectId(pid);
                                    setLabelProjectId(pid); // 🔥 milestone + label sync
                                    // reset assigned employees when project changes
                                    setAssignedEmployeeIds([]);
                                }}
                                required
                            >
                                <option value="">-- Select Project --</option>

                                {employeeProjects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>




                        <div>
                            <label className="text-xs text-gray-600">Start Date *</label>
                            <input type="date" className="border px-3 py-2 rounded w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600">Due Date *</label>
                            <input type="date" disabled={noDueDate} className="border px-3 py-2 rounded w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>

                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={noDueDate} onChange={(e) => setNoDueDate(e.target.checked)} />
                            <span className="text-sm">Without Due Date</span>
                        </label>

                        <div>
                            <label className="text-xs text-gray-600">Status *</label>
                            <select className="border px-3 py-2 rounded w-full" value={taskStageId} onChange={(e) => setTaskStageId(e.target.value)}>
                                <option value="">--</option>
                                {stages.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* ASSIGNED TO */}
                        <div className="relative">
                            <label className="text-xs text-gray-600">Assigned To *</label>
                            {/* <button type="button" onClick={() => setAssignOpen((v) => !v)} */}

                            {/* <button
type="button"
disabled={!selectedProjectId}
onClick={() => setAssignOpen((v) => !v)}

                             className="flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm">
                                <span>{assignedEmployeeIds.length === 0 ? "Select employees" : 
                                `${assignedEmployeeIds.length} selected`}</span>
                                <span>▾</span>
                            </button> */}



                            <button
                                type="button"
                                disabled={!selectedProjectId}
                                onClick={() => setAssignOpen((v) => !v)}
                                className="flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm"
                            >
                                <span>
                                    {!selectedProjectId
                                        ? "Select project first"
                                        : assignedEmployeeIds.length === 0
                                            ? "Select employees"
                                            : `${assignedEmployeeIds.length} selected`}
                                </span>

                                <span>▾</span>
                            </button>


                            {assignOpen && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md max-h-56 overflow-auto">
                                    {employees.map((emp) => {
                                        const checked = assignedEmployeeIds.includes(emp.employeeId);
                                        return (
                                            <div key={emp.employeeId} onClick={() => setAssignedEmployeeIds((prev) => checked ? prev.filter((id) => id !== emp.employeeId) : [...prev, emp.employeeId])} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                                <input type="checkbox" readOnly checked={checked} />
                                                <span>{emp.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs text-gray-600">Description</label>
                            <textarea className="border px-3 py-2 rounded w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* OTHER DETAILS */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Other Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* LABEL */}
                        {/* <div>
              <label className="text-xs text-gray-600">Label</label>
              <select className="border px-3 py-2 rounded w-full" value={labelId} onChange={(e) => setLabelId(e.target.value)}>
                <option value="">-- Select Label --</option>
                {labels.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div> */}



                        {/* LABEL */}
                        <div>
                            <label className="text-xs text-gray-600">Label</label>

                            <div className="flex gap-2">
                                <select
                                    value={labelId}
                                    onChange={(e) => setLabelId(e.target.value)}
                                    className="border px-3 py-2 rounded w-full"
                                >
                                    <option value="">--</option>
                                    {Array.isArray(labels) &&
                                        labels.map((l) => (
                                            <option key={l.id} value={l.id}>
                                                {l.name}
                                            </option>
                                        ))}

                                </select>

                                <button
                                    type="button"
                                    onClick={() => setShowLabelModal(true)}
                                    className="px-4 py-2 rounded border bg-gray-100 text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </div>





                        <div>
                            <label className="text-xs text-gray-600">Milestone *</label>
                            <select className="border px-3 py-2 rounded w-full" value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
                                <option value="">--</option>
                                {milestones.map((m) => (
                                    <option key={m.id} value={m.id}>{m.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-600">Priority</label>
                            <select className="border px-3 py-2 rounded w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>

                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                            <span className="text-sm">Make Private</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={timeEstimate} onChange={(e) => setTimeEstimate(e.target.checked)} />
                            <span className="text-sm">Time Estimate</span>
                        </label>

                        {timeEstimate && (
                            <input className="border px-3 py-2 rounded" placeholder="Minutes" value={timeEstimateMinutes} onChange={(e) => setTimeEstimateMinutes(e.target.value)} />
                        )}

                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={isDependent} onChange={(e) => setIsDependent(e.target.checked)} />
                            <span className="text-sm">Task is dependent</span>
                        </label>
                    </div>

                    <div className="mt-3">
                        <label className="text-xs text-gray-600">Add File</label>
                        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white">{loading ? "Saving..." : "Save"}</button>
                </div>
            </form>

            {/* ADD CATEGORY MODAL */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="font-semibold">Task Category</h3>
                            <button onClick={() => setShowCategoryModal(false)}>✕</button>
                        </div>

                        <div className="p-6">
                            <table className="w-full border rounded">
                                <thead className="bg-blue-100 text-sm">
                                    <tr>
                                        <th className="p-2 text-left">#</th>
                                        <th className="p-2 text-left">Category Name</th>
                                        <th className="p-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((c, i) => (
                                        <tr key={c.id} className="border-t">
                                            <td className="p-2">{i + 1}</td>
                                            <td className="p-2">{c.name}</td>
                                            <td className="p-2 text-center">
                                                <button onClick={async () => {
                                                    await fetch(`${MAIN}/task/task-categories/${c.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                                                    const res = await fetch(`${MAIN}/task/task-categories`, { headers: { Authorization: `Bearer ${token}` } });
                                                    setCategories(await res.json());
                                                }} className="text-red-600">🗑</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-6">
                                <label className="text-sm">Category Name *</label>
                                <input className="border px-3 py-2 rounded w-full mt-1" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                            </div>
                        </div>


                        <div className="flex justify-end gap-3 px-6 py-4 border-t">
                            <button onClick={() => setShowCategoryModal(false)} className="px-4 py-2 rounded border">Cancel</button>
                            <button disabled={categoryLoading} onClick={async () => {
                                // if (!newCategoryName) return;
                                setCategoryLoading(true);
                                await fetch(`${MAIN}/task/task-categories`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: newCategoryName }) });
                                const res = await fetch(`${MAIN}/task/task-categories`, { headers: { Authorization: `Bearer ${token}` } });
                                setCategories(await res.json());
                                setNewCategoryName("");
                                setShowCategoryModal(false);
                                setCategoryLoading(false);
                            }} className="px-6 py-2 rounded bg-blue-600 text-white">{loading ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}





            {/* ADD TASK LABEL MODAL */}
            {showLabelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="font-semibold">Task Labels</h3>
                            <button onClick={() => setShowLabelModal(false)}>✕</button>
                        </div>

                        {/* List */}
                        <div className="p-6">
                            <table className="w-full border rounded">
                                <thead className="bg-blue-100 text-sm">
                                    <tr>
                                        <th className="p-2 text-left">#</th>
                                        <th className="p-2 text-left">Label Name</th>
                                        <th className="p-2 text-left">Description</th>
                                        <th className="p-2 text-left">Project</th>
                                        <th className="p-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {labels.map((l, i) => (
                                        <tr key={l.id} className="border-t">
                                            <td className="p-2">{i + 1}</td>
                                            <td className="p-2 flex items-center gap-2">
                                                <span
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: l.colorCode }}
                                                />
                                                {l.name}
                                            </td>
                                            <td className="p-2">{l.description}</td>
                                            <td className="p-2">{l.projectName || "-"}</td>
                                            <td className="p-2 text-center">
                                                <button
                                                    className="text-red-600"
                                                    onClick={async () => {
                                                        await fetch(`${MAIN}/api/labels/${l.id}`, {
                                                            method: "DELETE",
                                                            headers: { Authorization: `Bearer ${token}` },
                                                        });

                                                        // const res = await fetch(
                                                        //     `${MAIN}/projects/${projectId}/labels`,
                                                        //     { headers: { Authorization: `Bearer ${token}` } }
                                                        // );
                                                        // setLabels(await res.json());


                                                        if (!labelProjectId) return;

                                                        const res = await fetch(
                                                            `${MAIN}/projects/${labelProjectId}/labels`,
                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                        );

                                                        const json = await res.json();

                                                        if (Array.isArray(json)) {
                                                            setLabels(json);
                                                        } else if (Array.isArray(json.labels)) {
                                                            setLabels(json.labels);
                                                        } else if (Array.isArray(json.data)) {
                                                            setLabels(json.data);
                                                        } else {
                                                            setLabels([]); // fallback
                                                        }




                                                    }}
                                                >
                                                    🗑
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* FORM */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div>
                                    <label className="text-sm">Label Name *</label>
                                    <input
                                        value={labelName}
                                        onChange={(e) => setLabelName(e.target.value)}
                                        className="border px-3 py-2 rounded w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm">Color Code *</label>
                                    <input
                                        value={labelColor}
                                        onChange={(e) => setLabelColor(e.target.value)}
                                        placeholder="#22c55e"
                                        className="border px-3 py-2 rounded w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm">Project</label>
                                    {/* <select
                                        value={labelProjectId}
                                        onChange={(e) => setLabelProjectId(e.target.value)}
                                        className="border px-3 py-2 rounded w-full"
                                    >
                                        <option value="">--</option>
                                        <option value={projectId}>{projectId}</option>
                                    </select> */}



                                    <select
                                        value={labelProjectId}
                                        onChange={(e) => setLabelProjectId(e.target.value)}
                                        className="border px-3 py-2 rounded w-full"
                                    >
                                        <option value="">-- Select Project --</option>

                                        {employeeProjects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>


                                </div>

                                <div className="md:col-span-3">
                                    <label className="text-sm">Description</label>
                                    <textarea
                                        value={labelDesc}
                                        onChange={(e) => setLabelDesc(e.target.value)}
                                        className="border px-3 py-2 rounded w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t">
                            <button
                                onClick={() => setShowLabelModal(false)}
                                className="px-4 py-2 rounded border"
                            >
                                Cancel
                            </button>

                            <button
                                disabled={labelLoading}
                                onClick={async () => {
                                    if (!labelName || !labelColor) return;

                                    setLabelLoading(true);

                                    // await fetch(`${MAIN}/api/labels`, {
                                    //     method: "POST",
                                    //     headers: {
                                    //         Authorization: `Bearer ${token}`,
                                    //         "Content-Type": "application/json",
                                    //     },
                                    //     body: JSON.stringify({
                                    //         name: labelName,
                                    //         colorCode: labelColor,
                                    //         description: labelDesc,
                                    //         // projectId,
                                    //         projectId: labelProjectId,

                                    //     }),
                                    // });


                                    await fetch(`${MAIN}/api/labels`, {
                                        method: "POST",
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            name: labelName,
                                            colorCode: labelColor,
                                            description: labelDesc,
                                            projectId: labelProjectId,
                                        }),
                                    });




                                    const res = await fetch(
                                        `${MAIN}/projects/${projectId}/labels`,
                                        { headers: { Authorization: `Bearer ${token}` } }
                                    );

                                    //  setLabels(await res.json());
                                    const json = await res.json();

                                    if (Array.isArray(json)) {
                                        setLabels(json);
                                    } else if (Array.isArray(json.labels)) {
                                        setLabels(json.labels);
                                    } else if (Array.isArray(json.data)) {
                                        setLabels(json.data);
                                    } else {
                                        setLabels([]); // fallback
                                    }

                                    setLabelName("");
                                    setLabelColor("");
                                    setLabelDesc("");
                                    setShowLabelModal(false);
                                    setLabelLoading(false);
                                }}
                                className="px-6 py-2 rounded bg-blue-600 text-white"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

          </div>,
    document.body
);
}

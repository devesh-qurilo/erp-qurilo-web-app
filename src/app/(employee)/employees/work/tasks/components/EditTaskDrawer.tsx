"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

const MAIN = process.env.NEXT_PUBLIC_MAIN;

export default function EditTaskDrawer({
    open,
    onOpenChange,
    taskId,
    onUpdated
}) {
    // --------------- FORM STATES ---------------
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [projectId, setProjectId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [taskStageId, setTaskStageId] = useState("");
    const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [labelIds, setLabelIds] = useState<string[]>([]);
    const [priority, setPriority] = useState("");
    const [isPrivate, setIsPrivate] = useState(false);
    const [timeEstimate, setTimeEstimate] = useState(false);
    const [timeEstimateMinutes, setTimeEstimateMinutes] = useState("");
    const [isDependent, setIsDependent] = useState(false);
    const [milestoneId, setMilestoneId] = useState("");

    const [loading, setLoading] = useState(false);

    // -------- API Collections --------
    const [categories, setCategories] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [labels, setLabels] = useState<any[]>([]);

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;

    // ---------- FETCH TASK DETAILS FOR EDIT ----------
    useEffect(() => {
        if (open && taskId) fetchTask();
    }, [open, taskId]);

    async function fetchTask() {
        setLoading(true);
        try {
            const res = await fetch(`${MAIN}/projects/tasks/${taskId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const t = await res.json();

            // Pre-fill states
            setTitle(t.title || "");
            setCategory(String(t.categoryId?.id ?? ""));
            setProjectId(String(t.projectId ?? ""));
            setStartDate(t.startDate ?? "");
            setDueDate(t.dueDate ?? "");
            setTaskStageId(String(t.taskStageId ?? ""));
            setDescription(t.description ?? "");
            setPriority(t.priority ?? "");
            setIsPrivate(t.isPrivate ?? false);
            setTimeEstimate(t.timeEstimate ?? false);
            setTimeEstimateMinutes(String(t.timeEstimateMinutes ?? ""));
            setIsDependent(t.isDependent ?? false);
            setMilestoneId(String(t.milestoneId ?? ""));
            setAssignedEmployeeIds(t.assignedEmployeeIds ?? []);
            setLabelIds((t.labels ?? []).map((l) => String(l.id)));

            // Load dependent APIS
            fetchMilestones(String(t.projectId));
            fetchLabels(String(t.projectId));
        } finally {
            setLoading(false);
        }
    }

    // ---------- FETCH ALL STATIC DATA ----------
    useEffect(() => {
        if (open) {
            fetchCategories();
            fetchProjects();
            fetchStages();
            fetchEmployees();
        }
    }, [open]);

    const fetchCategories = async () => {
        const res = await fetch(`${MAIN}/task/task-categories`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(await res.json());
    };

    const fetchProjects = async () => {
        const res = await fetch(`${MAIN}/api/projects`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(await res.json());
    };

    const fetchStages = async () => {
        const res = await fetch(`${MAIN}/status`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        setStages(await res.json());
    };

    const fetchEmployees = async () => {
        const res = await fetch(`${MAIN}/employee/all`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        setEmployees(await res.json());
    };

    const fetchMilestones = async (pid: string) => {
        if (!pid) return;
        const res = await fetch(`${MAIN}/api/projects/${pid}/milestones`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        setMilestones(await res.json());
    };

    const fetchLabels = async (pid: string) => {
        if (!pid) return;
        const res = await fetch(`${MAIN}/projects/${pid}/labels`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });
        setLabels(await res.json());
    };

    // ----------- MULTI-SELECT HANDLER -----------
    const toggle = (arr: string[], v: string) =>
        arr.includes(v)
            ? arr.filter((x) => x !== v)
            : [...arr, v];

    // ----------- UPDATE API (PUT) -----------
    const handleUpdate = async () => {
        setLoading(true);
        try {
            const fd = new FormData();

            fd.append("title", title);
            fd.append("category", category);
            fd.append("projectId", projectId);
            fd.append("startDate", startDate);
            fd.append("dueDate", dueDate);
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

            labelIds.forEach((id) => fd.append("labelIds", id));

            const res = await fetch(`${MAIN}/api/projects/tasks/${taskId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            if (!res.ok) throw new Error("Update failed");

            onUpdated();
            onOpenChange(false);
        } catch (e) {
            alert("Failed to update task");
        } finally {
            setLoading(false);
        }
    };

    // --------------- UI DRAWER ---------------
    return (
        <div
            className={`fixed inset-0 z-[999] bg-black/30 transition-opacity duration-300
                ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
        >
            <div
                className={`
                    fixed right-0 top-0 h-full w-[83vw] max-w-[83vw] bg-white 
                    shadow-xl border-l overflow-y-auto
                    transform transition-transform duration-300
                    ${open ? "translate-x-0" : "translate-x-full"}
                `}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
                    <h2 className="text-xl font-semibold">Edit Task</h2>

                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 rounded hover:bg-gray-100"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                        </div>
                    ) : (
                        <>
                            {/* ------------ Title ------------ */}
                            <div>
                                <Label>Title *</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* ------------ Category ------------ */}
                            <div>
                                <Label>Category *</Label>
                                <Select
                                    value={category}
                                    onValueChange={setCategory}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ------------ Project ------------ */}
                            <div>
                                <Label>Project *</Label>
                                <Select
                                    value={projectId}
                                    onValueChange={(v) => {
                                        setProjectId(v);
                                        fetchMilestones(v);
                                        fetchLabels(v);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.shortCode} - {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ------------ Milestone ------------ */}
                            <div>
                                <Label>Milestone *</Label>
                                <Select
                                    value={milestoneId}
                                    onValueChange={setMilestoneId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select milestone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {milestones.map((m) => (
                                            <SelectItem key={m.id} value={String(m.id)}>
                                                {m.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ------------ Stage ------------ */}
                            <div>
                                <Label>Task Stage *</Label>
                                <Select
                                    value={taskStageId}
                                    onValueChange={setTaskStageId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select stage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stages.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ------------ Assign Employees ------------ */}
                            <div>
                                <Label>Assign To</Label>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    {employees.map((emp) => (
                                        <label
                                            key={emp.employeeId}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                checked={assignedEmployeeIds.includes(
                                                    emp.employeeId
                                                )}
                                                onCheckedChange={() =>
                                                    setAssignedEmployeeIds(
                                                        toggle(
                                                            assignedEmployeeIds,
                                                            emp.employeeId
                                                        )
                                                    )
                                                }
                                            />
                                            {emp.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* ------------ Labels ------------ */}
                            <div>
                                <Label>Labels</Label>
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    {labels.map((l) => (
                                        <label
                                            key={l.id}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                checked={labelIds.includes(String(l.id))}
                                                onCheckedChange={() =>
                                                    setLabelIds(
                                                        toggle(labelIds, String(l.id))
                                                    )
                                                }
                                            />
                                            {l.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* ------------ Dates ------------ */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Date *</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label>Due Date *</Label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* ------------ Description ------------ */}
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* ------------ Priority ------------ */}
                            <div>
                                <Label>Priority *</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ------------ Toggles ------------ */}
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={isPrivate}
                                        onCheckedChange={(v) => setIsPrivate(Boolean(v))}
                                    />
                                    Private Task
                                </label>

                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={isDependent}
                                        onCheckedChange={(v) =>
                                            setIsDependent(Boolean(v))
                                        }
                                    />
                                    Dependent Task
                                </label>

                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={timeEstimate}
                                        onCheckedChange={(v) =>
                                            setTimeEstimate(Boolean(v))
                                        }
                                    />
                                    Time Estimate
                                </label>

                                {timeEstimate && (
                                    <Input
                                        placeholder="Minutes"
                                        value={timeEstimateMinutes}
                                        onChange={(e) =>
                                            setTimeEstimateMinutes(e.target.value)
                                        }
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 p-6 border-t bg-white">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="px-5 py-2 rounded-md border"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-md"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Update Task"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

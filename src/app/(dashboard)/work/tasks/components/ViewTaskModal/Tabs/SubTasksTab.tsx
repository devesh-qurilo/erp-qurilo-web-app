"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    createTaskSubtask,
    deleteTaskSubtask,
    fetchTaskSubtasks,
    getStoredAccessToken,
    toggleTaskSubtask,
    updateTaskSubtask,
    type TaskSubtaskRecord,
} from "../../../api";

interface SubTasksTabProps {
    taskId: number;
}

export default function SubTasksTab({ taskId }: SubTasksTabProps) {
    const [subtasks, setSubtasks] = useState<TaskSubtaskRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [editId, setEditId] = useState<number | null>(null);

    const fetchSubtasks = useCallback(async () => {
        const token = getStoredAccessToken();
        if (!token) {
            setSubtasks([]);
            setError("Not authenticated");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSubtasks(await fetchTaskSubtasks(token, taskId));
        } catch (err) {
            console.error("Subtask fetch error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch subtasks");
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        void fetchSubtasks();
    }, [fetchSubtasks]);

    /* --------------------------------------------
     * CREATE SUBTASK
     * -------------------------------------------- */
    async function handleCreate() {
        if (!title.trim()) return alert("Title is required");

        const token = getStoredAccessToken();
        if (!token) {
            setError("Not authenticated");
            return;
        }

        try {
            setError(null);
            await createTaskSubtask(token, taskId, { title, description });
            setTitle("");
            setDescription("");
            await fetchSubtasks();
        } catch (err) {
            console.error("Create error:", err);
            setError(err instanceof Error ? err.message : "Failed to add subtask");
        }
    }

    /* --------------------------------------------
     * UPDATE SUBTASK
     * -------------------------------------------- */
    async function handleUpdate(subtaskId: number) {
        const token = getStoredAccessToken();
        if (!token) {
            setError("Not authenticated");
            return;
        }

        try {
            setError(null);
            await updateTaskSubtask(token, taskId, subtaskId, { title, description });
            setEditId(null);
            setTitle("");
            setDescription("");
            await fetchSubtasks();
        } catch (err) {
            console.error("Update error:", err);
            setError(err instanceof Error ? err.message : "Failed to update subtask");
        }
    }

    /* --------------------------------------------
     * DELETE SUBTASK
     * -------------------------------------------- */
    async function handleDelete(subtaskId: number) {
        if (!confirm("Delete this subtask?")) return;

        const token = getStoredAccessToken();
        if (!token) {
            setError("Not authenticated");
            return;
        }

        try {
            setError(null);
            await deleteTaskSubtask(token, taskId, subtaskId);
            setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
        } catch (err) {
            console.error("Delete error:", err);
            setError(err instanceof Error ? err.message : "Failed to delete subtask");
        }
    }

    async function handleToggle(subtaskId: number) {
        const token = getStoredAccessToken();
        if (!token) {
            setError("Not authenticated");
            return;
        }

        try {
            setError(null);
            const updated = await toggleTaskSubtask(token, taskId, subtaskId);
            setSubtasks((prev) => prev.map((item) => (item.id === subtaskId ? updated : item)));
        } catch (err) {
            console.error("Toggle error:", err);
            setError(err instanceof Error ? err.message : "Failed to update subtask");
        }
    }

    return (
        <div className="space-y-6">

            {/* ------------ ADD or EDIT SUBTASK FORM ------------ */}
            <Card className="p-4 rounded-xl border-slate-200">
                <h3 className="font-semibold text-sm mb-3">
                    {editId ? "Edit Sub Task" : "Add Sub Task"}
                </h3>

                <div className="space-y-3">
                    <Input
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <Textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    {editId ? (
                        <div className="flex gap-2">
                            <Button
                                className="bg-indigo-500 text-white"
                                onClick={() => handleUpdate(editId)}
                            >
                                Update
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditId(null);
                                    setTitle("");
                                    setDescription("");
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className="bg-indigo-500 text-white"
                            onClick={handleCreate}
                        >
                            Add Sub Task
                        </Button>
                    )}
                </div>
            </Card>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            {/* ------------ SUBTASKS LIST ------------ */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-slate-400" size={26} />
                </div>
            ) : subtasks.length === 0 ? (
                <p className="text-slate-500 text-sm">No sub tasks found.</p>
            ) : (
                <div className="space-y-3">
                    {subtasks.map((sub) => (
                        <Card
                            key={sub.id}
                            className="p-4 rounded-xl border-slate-200 flex justify-between items-start"
                        >
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    checked={Boolean(sub.isDone)}
                                    onCheckedChange={() => {
                                        void handleToggle(sub.id);
                                    }}
                                />

                                <div>
                                <p className="font-medium text-slate-700">
                                    {sub.title}
                                </p>
                                <p className="text-slate-500 text-sm">
                                    {sub.description || "No description"}
                                </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setEditId(sub.id);
                                        setTitle(sub.title);
                                        setDescription(sub.description);
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-full"
                                >
                                    <Pencil size={18} className="text-slate-600" />
                                </button>

                                <button
                                    onClick={() => handleDelete(sub.id)}
                                    className="p-2 hover:bg-red-50 rounded-full"
                                >
                                    <Trash2 size={18} className="text-red-500" />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, Pencil } from "lucide-react";

const MAIN_API = process.env.NEXT_PUBLIC_MAIN;

export default function SubTasksTab({ taskId }) {
    const [subtasks, setSubtasks] = useState([]);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const [editId, setEditId] = useState(null); // subtask being edited

    useEffect(() => {
        fetchSubtasks();
    }, [taskId]);

    /* --------------------------------------------
     * GET ALL SUBTASKS
     * -------------------------------------------- */
    async function fetchSubtasks() {
        try {
            setLoading(true);
            const token = localStorage.getItem("accessToken");

            const res = await fetch(`${MAIN_API}/tasks/${taskId}/subtasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            setSubtasks(data || []);
        } catch (err) {
            console.error("Subtask fetch error:", err);
        } finally {
            setLoading(false);
        }
    }

    /* --------------------------------------------
     * CREATE SUBTASK
     * -------------------------------------------- */
    async function handleCreate() {
        if (!title.trim()) return alert("Title is required");

        try {
            const token = localStorage.getItem("accessToken");

            const res = await fetch(`${MAIN_API}/tasks/${taskId}/subtasks`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title, description }),
            });

            if (!res.ok) throw new Error("Failed to add subtask");

            setTitle("");
            setDescription("");
            fetchSubtasks();
        } catch (err) {
            console.error("Create error:", err);
        }
    }

    /* --------------------------------------------
     * UPDATE SUBTASK
     * -------------------------------------------- */
    async function handleUpdate(subtaskId) {
        try {
            const token = localStorage.getItem("accessToken");

            const res = await fetch(
                `${MAIN_API}/tasks/${taskId}/subtasks/${subtaskId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ title, description }),
                }
            );

            if (!res.ok) throw new Error("Update failed");

            setEditId(null);
            setTitle("");
            setDescription("");
            fetchSubtasks();
        } catch (err) {
            console.error("Update error:", err);
        }
    }

    /* --------------------------------------------
     * DELETE SUBTASK
     * -------------------------------------------- */
    async function handleDelete(subtaskId) {
        if (!confirm("Delete this subtask?")) return;

        try {
            const token = localStorage.getItem("accessToken");

            await fetch(`${MAIN_API}/tasks/${taskId}/subtasks/${subtaskId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
        } catch (err) {
            console.error("Delete error:", err);
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
                            <div>
                                <p className="font-medium text-slate-700">
                                    {sub.title}
                                </p>
                                <p className="text-slate-500 text-sm">
                                    {sub.description}
                                </p>
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

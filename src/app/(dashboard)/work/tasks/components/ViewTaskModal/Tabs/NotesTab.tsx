"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";

const MAIN_API = process.env.NEXT_PUBLIC_MAIN;

export default function NotesTab({ taskId }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    useEffect(() => {
        fetchNotes();
    }, [taskId]);

    /* ------------------------------
     * GET Notes for task
     * ------------------------------ */
    async function fetchNotes() {
        try {
            setLoading(true);
            const token = localStorage.getItem("accessToken");

            const res = await fetch(`${MAIN_API}/tasks/${taskId}/notes`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            setNotes(data || []);
        } catch (err) {
            console.error("Notes fetch error:", err);
        } finally {
            setLoading(false);
        }
    }

    /* ------------------------------
     * CREATE Note
     * ------------------------------ */
    async function handleCreate() {
        if (!title.trim() || !content.trim()) {
            return alert("Title and content are required");
        }

        try {
            const token = localStorage.getItem("accessToken");

            const res = await fetch(`${MAIN_API}/tasks/${taskId}/notes`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    content,
                    isPublic,
                }),
            });

            if (!res.ok) throw new Error("Failed to create note");

            const newNote = await res.json();

            setNotes((prev) => [newNote, ...prev]);
            setTitle("");
            setContent("");
        } catch (err) {
            console.error("Create note error:", err);
        }
    }

    /* ------------------------------
     * DELETE Note
     * ------------------------------ */
    async function handleDelete(noteId) {
        if (!confirm("Delete this note?")) return;

        try {
            const token = localStorage.getItem("accessToken");

            await fetch(`${MAIN_API}/notes/task/${noteId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            setNotes((prev) => prev.filter((n) => n.id !== noteId));
        } catch (err) {
            console.error("Delete error:", err);
        }
    }

    return (
        <div className="space-y-6">

            {/* --- CREATE NOTE FORM --- */}
            <Card className="p-4 rounded-xl border-slate-200">
                <h3 className="font-semibold text-sm mb-3">Add Note</h3>

                <div className="space-y-3">
                    <Input
                        placeholder="Note Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <Textarea
                        placeholder="Write your note here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                        />
                        <span className="text-sm text-slate-600">
                            Public Note
                        </span>
                    </div>

                    <Button
                        className="bg-indigo-500 text-white"
                        onClick={handleCreate}
                    >
                        Add Note
                    </Button>
                </div>
            </Card>

            {/* --- NOTES LIST --- */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-slate-400" size={26} />
                </div>
            ) : notes.length === 0 ? (
                <p className="text-slate-500 text-sm">No notes found.</p>
            ) : (
                <div className="space-y-4">
                    {notes.map((note) => (
                        <Card
                            key={note.id}
                            className="p-4 rounded-xl border-slate-200"
                        >
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-medium text-slate-800">
                                        {note.title}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {note.isPublic ? "Public" : "Private"}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleDelete(note.id)}
                                    className="p-2 hover:bg-red-50 rounded-full"
                                >
                                    <Trash2 size={18} className="text-red-600" />
                                </button>
                            </div>

                            <p className="mt-3 text-sm text-slate-700">
                                {note.content}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                                Created by {note.ownerEmployeeId}
                            </p>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

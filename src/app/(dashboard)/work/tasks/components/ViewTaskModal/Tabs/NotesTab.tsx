"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import {
    createTaskNote,
    deleteTaskNote,
    fetchTaskNotes,
    getStoredAccessToken,
    type TaskNoteRecord,
} from "../../../api";

interface NotesTabProps {
    taskId: number;
}

export default function NotesTab({ taskId }: NotesTabProps) {
    const [notes, setNotes] = useState<TaskNoteRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    const fetchNotes = useCallback(async () => {
        const token = getStoredAccessToken();
        if (!token) {
            setNotes([]);
            setError("Not authenticated");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setNotes(await fetchTaskNotes(token, taskId));
        } catch (err) {
            console.error("Notes fetch error:", err);
            setError(err instanceof Error ? err.message : "Failed to load notes");
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        void fetchNotes();
    }, [fetchNotes]);

    /* ------------------------------
     * CREATE Note
     * ------------------------------ */
    async function handleCreate() {
        if (!title.trim() || !content.trim()) {
            return alert("Title and content are required");
        }

        const token = getStoredAccessToken();
        if (!token) {
            setError("Not authenticated");
            return;
        }

        try {
            setError(null);
            const newNote = await createTaskNote(token, taskId, {
                title,
                content,
                isPublic,
            });
            setNotes((prev) => [newNote, ...prev]);
            setTitle("");
            setContent("");
        } catch (err) {
            console.error("Create note error:", err);
            setError(err instanceof Error ? err.message : "Failed to create note");
        }
    }

    /* ------------------------------
     * DELETE Note
     * ------------------------------ */
    async function handleDelete(noteId: number) {
        if (!confirm("Delete this note?")) return;

        const token = getStoredAccessToken();
        if (!token) {
            setError("Not authenticated");
            return;
        }

        try {
            setError(null);
            await deleteTaskNote(token, noteId);
            setNotes((prev) => prev.filter((n) => n.id !== noteId));
        } catch (err) {
            console.error("Delete error:", err);
            setError(err instanceof Error ? err.message : "Failed to delete note");
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

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

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
                                        {note.title || "Untitled note"}
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
                                {note.content || "No note content"}
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

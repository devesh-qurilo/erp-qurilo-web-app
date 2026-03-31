"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MAIN_API = process.env.NEXT_PUBLIC_MAIN;

export default function FilesTab({ taskId }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, [taskId]);

    /* --------------------------------------------
     * GET all files
     * -------------------------------------------- */
    async function fetchFiles() {
        try {
            setLoading(true);
            const token = localStorage.getItem("accessToken");

            const res = await fetch(`${MAIN_API}/files/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            setFiles(data || []);
        } catch (err) {
            console.error("Error fetching files:", err);
        } finally {
            setLoading(false);
        }
    }

    /* --------------------------------------------
     * Upload file
     * -------------------------------------------- */
    async function handleUploadFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const fd = new FormData();
        fd.append("file", file);

        try {
            setUploading(true);
            const token = localStorage.getItem("accessToken");

            const res = await fetch(`${MAIN_API}/files/tasks/${taskId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            if (!res.ok) throw new Error("Upload failed");

            fetchFiles(); // refresh list
        } catch (err) {
            console.error("File upload error:", err);
        } finally {
            setUploading(false);
        }
    }

    /* --------------------------------------------
     * Delete file
     * -------------------------------------------- */
    async function handleDelete(fileId) {
        if (!confirm("Delete this file?")) return;

        try {
            const token = localStorage.getItem("accessToken");

            await fetch(`${MAIN_API}/files/${fileId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            setFiles((prev) => prev.filter((f) => f.id !== fileId));
        } catch (err) {
            console.error("Delete error:", err);
        }
    }

    return (
        <div className="space-y-6">

            {/* Upload Button */}
            <label className="flex items-center gap-2 text-indigo-600 cursor-pointer">
                <Upload size={18} />
                <span className="text-sm">Upload File</span>
                <input
                    type="file"
                    className="hidden"
                    onChange={handleUploadFile}
                />
            </label>

            {uploading && (
                <p className="text-xs text-slate-500">Uploading...</p>
            )}

            {/* Files List */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
            ) : files.length === 0 ? (
                <p className="text-slate-500 text-sm">No files uploaded.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {files.map((file) => (
                        <Card
                            key={file.id}
                            className="p-4 flex items-center justify-between border border-slate-200 rounded-xl"
                        >
                            {/* Left: file info */}
                            <div>
                                <p className="font-medium text-slate-700 text-sm">
                                    {file.filename}
                                </p>
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 text-xs underline"
                                >
                                    View / Download
                                </a>
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={() => handleDelete(file.id)}
                                className="p-2 rounded-full hover:bg-red-50"
                            >
                                <Trash2 size={16} className="text-red-500" />
                            </button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

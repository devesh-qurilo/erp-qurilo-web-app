"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
    deleteProjectFile,
    fetchTaskFiles,
    getStoredAccessToken,
    uploadTaskFile,
    type TaskFileRecord,
} from "../../../api";

interface FilesTabProps {
    taskId: number;
}

export default function FilesTab({ taskId }: FilesTabProps) {
    const [files, setFiles] = useState<TaskFileRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        const token = getStoredAccessToken();
        if (!token) {
            setFiles([]);
            setError("Not authenticated");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setFiles(await fetchTaskFiles(token, taskId));
        } catch (err) {
            console.error("Error fetching files:", err);
            setError(err instanceof Error ? err.message : "Failed to load files");
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        void fetchFiles();
    }, [fetchFiles]);

    /* --------------------------------------------
     * Upload file
     * -------------------------------------------- */
    async function handleUploadFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const token = getStoredAccessToken();
        if (!token) {
            setError("Not authenticated");
            return;
        }


        try {
            setUploading(true);
            setError(null);
            await uploadTaskFile(token, taskId, file);
            await fetchFiles();
        } catch (err) {
            console.error("File upload error:", err);
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    }

    /* --------------------------------------------
     * Delete file
     * -------------------------------------------- */
    async function handleDelete(fileId) {
        if (!confirm("Delete this file?")) return;

        const token = getStoredAccessToken();
        if (!token) {
            setError("Not authenticated");
            return;
        }

        try {
            setError(null);
            await deleteProjectFile(token, fileId);
            setFiles((prev) => prev.filter((f) => f.id !== fileId));
        } catch (err) {
            console.error("Delete error:", err);
            setError(err instanceof Error ? err.message : "Delete failed");
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

            {error ? (
                <p className="text-xs text-red-500">{error}</p>
            ) : null}

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
                                    {file.filename ?? "Untitled file"}
                                </p>
                                <a
                                    href={file.url ?? "#"}
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

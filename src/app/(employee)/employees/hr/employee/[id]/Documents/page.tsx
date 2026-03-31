

"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";

export type ProjectFile = {
    id: number | string;
    filename?: string | null;
    url?: string | null;
    mimeType?: string | null;
    size?: number | null;
    uploadedBy?: string | null;
    createdAt?: string | null;
};

const BASE_URL =
    process.env.NEXT_PUBLIC_MAIN ;

export default function ProjectDocuments({
    employeeId,
    authToken,
}: {
    employeeId: number | string;
    authToken?: string;
}) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState<number | string | null>(null);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    /* =========================
        FETCH PROJECT FILES
    ========================= */
    useEffect(() => {
        // if (!employeeId) return;

        let mounted = true;
        setLoading(true);
        setError(null);

        fetch(`${BASE_URL}/employee/${employeeId}/documents`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (!mounted) return;

                const mapped: ProjectFile[] = (Array.isArray(data) ? data : []).map(
                    (f: any) => ({
                        id: f.id,
                        filename: f.filename,
                        url: f.url,
                        mimeType: f.mimeType,
                        size: f.size,
                        uploadedBy: f.uploadedBy,
                        createdAt: f.createdAt,
                    })
                );

                setFiles(mapped);
            })
            .catch(() => setError("Failed to load files"))
            .finally(() => mounted && setLoading(false));

        return () => {
            mounted = false;
        };
    }, [employeeId, authToken]);

    /* =========================
        UPLOAD FILE
    ========================= */
    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const localId = `local-${Date.now()}`;
        const previewUrl = file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null;

        // optimistic preview
        setFiles((prev) => [
            {
                id: localId,
                filename: file.name,
                url: previewUrl,
                mimeType: file.type,
            },
            ...prev,
        ]);

        setUploading((p) => ({ ...p, [localId]: true }));
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(
                `${BASE_URL}/employee/${employeeId}/documents`,
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();

            // 🔥 EXACT RESPONSE MAPPING
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === localId
                        ? {
                            id: data.id,
                            filename: data.filename,
                            url: data.url,
                            mimeType: data.mimeType,
                            size: data.size,
                            uploadedBy: data.uploadedBy,
                            createdAt: data.createdAt,
                        }
                        : f
                )
            );
        } catch (err) {
            setFiles((prev) => prev.filter((f) => f.id !== localId));
            setError("Upload failed");
        } finally {
            setUploading((p) => {
                const c = { ...p };
                delete c[localId];
                return c;
            });
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    /* =========================
        DELETE FILE
    ========================= */
    const handleDelete = async (id: number | string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));

        try {
            await fetch(`${BASE_URL}/employee/${employeeId}/documents/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
        } catch {
            setError("Delete failed");
        }
    };

    const openFile = (
        url?: string,
        download?: boolean,
        name?: string
    ) => {
        if (!url) return;
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        if (download) a.download = name || "file";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    /* =========================
        UI
    ========================= */
    return (
        <div className="bg-white rounded-lg border p-5">
            <h3 className="text-lg font-semibold mb-4">Upload file</h3>

            {/* Upload Box */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg h-28 flex items-center justify-center cursor-pointer text-gray-500"
            >
                <div className="text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        fill="#bdbdbd"
                        viewBox="0 0 24 24"
                        className="mx-auto mb-2"
                    >
                        <path d="M12 16a1 1 0 0 1-1-1v-4.586l-1.293 1.293a1 1 0 1 1-1.414-1.414l3-3a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1-1.414 1.414L13 10.414V15a1 1 0 0 1-1 1Zm7-1a5 5 0 0 0-4.546-4.978A7 7 0 0 0 5.062 9.2 5 5 0 0 0 6 19h13a4 4 0 0 0 0-8Z" />
                    </svg>
                    <div className="text-sm font-medium">Choose a file</div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {loading && (
                <p className="text-sm mt-3 text-gray-500">Loading…</p>
            )}
            {error && (
                <p className="text-sm mt-3 text-red-500">{error}</p>
            )}

            {/* Files Grid */}
            <div className="mt-6 grid grid-cols-6 gap-4">
                {files.map((f) => (
                    <div key={String(f.id)}>
                        <div className="relative">
                            <div className="h-20 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                                {f.url && f.mimeType?.startsWith("image/") ? (
                                    <Image
                                        src={f.url}
                                        alt={f.filename || "file"}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-xs text-gray-400">File</span>
                                )}
                            </div>

                            <button
                                onClick={() =>
                                    setMenuOpen(menuOpen === f.id ? null : f.id)
                                }
                                className="absolute top-1 right-1 p-1 rounded hover:bg-white"
                            >
                                <MoreHorizontal size={16} />
                            </button>

                            {menuOpen === f.id && (
                                <div className="absolute right-0 mt-7 w-36 bg-white border rounded shadow z-20">
                                    <button
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                        onClick={() =>
                                            openFile(f.url, true, f.filename || undefined)
                                        }
                                    >
                                        Download
                                    </button>
                                    <button
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                        onClick={() => openFile(f.url)}
                                    >
                                        View
                                    </button>
                                    <button
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                                        onClick={() => handleDelete(f.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-2 text-sm">
                            <div className="font-medium truncate">
                                {f.filename || "Untitled"}
                                {uploading[String(f.id)] && (
                                    <span className="text-xs text-gray-400">
                                        {" "}
                                        · uploading…
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

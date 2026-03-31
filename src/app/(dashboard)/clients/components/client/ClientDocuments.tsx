"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";

export type DocumentItem = {
  id: string | number;
  name?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  createdAt?: string | null;
  size?: number | null;
  uploadedBy?: string | null;
};

const BASE_URL =  `${process.env.NEXT_PUBLIC_MAIN}`;

export default function ClientDocuments({
  clientId,
  documents,
  onUpload,
  onDelete,
  onAction,
  authToken,           // pass token if needed
  extraHeaders,
  includeCredentials = false,
  fileFieldName = "file",
  onUnauthorized,
}: {
  clientId: string | number;
  documents?: DocumentItem[] | null;
  onUpload?: (file: File) => void;
  onDelete?: (id: string | number) => void;
  onAction?: (doc: DocumentItem, action: "download" | "rename" | "more" | "view") => void;
  authToken?: string | null;
  extraHeaders?: Record<string, string> | null;
  includeCredentials?: boolean;
  fileFieldName?: string;
  onUnauthorized?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localFiles, setLocalFiles] = useState<DocumentItem[]>(documents || []);
  const [menuOpenFor, setMenuOpenFor] = useState<string | number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingIds, setUploadingIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documents !== undefined && documents !== null) setLocalFiles(documents);
  }, [documents]);

  const buildFetchOptions = (opts: { method?: string; headers?: HeadersInit; body?: BodyInit | null }) => {
    const h: Record<string, string> = {
      Accept: "application/json",
      ...(extraHeaders || {}),
      ...(opts.headers || {}),
    };
    if (authToken) h["Authorization"] = `Bearer ${authToken}`;
    const base: RequestInit = {
      method: opts.method ?? "GET",
      headers: h,
      body: opts.body ?? undefined,
      credentials: includeCredentials ? "include" : "same-origin",
    };
    return base;
  };

  useEffect(() => {
    if (documents !== undefined && documents !== null) return;
    if (!clientId) return;

    let mounted = true;
    async function fetchDocs() {
      setLoading(true);
      setError(null);
      try {
        //console.log("devesh", clientId.id)
        const client = clientId.id;
        const res = await fetch(`${BASE_URL}/clients/${client}/documents`, buildFetchOptions({ method: "GET" }));

        if (res.status === 401) {
          setError("Unauthorized: provide a valid token or enable credentials.");
          if (onUnauthorized) onUnauthorized();
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to fetch documents: ${res.status} ${txt}`);
        }
        const data = await res.json();
        const mapped: DocumentItem[] = (Array.isArray(data) ? data : []).map((d: any) => ({
          id: d.id,
          name: d.filename ?? d.name ?? null,
          fileUrl: d.url ?? d.fileUrl ?? null,
          mimeType: d.mimeType ?? d.type ?? null,
          createdAt: d.uploadedAt ?? d.createdAt ?? null,
          size: d.size ?? null,
          uploadedBy: d.uploadedBy ?? null,
        }));
        if (mounted) setLocalFiles(mapped);
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err?.message ?? "Unable to load documents");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDocs();
    return () => {
      mounted = false;
    };
  }, [clientId, documents, authToken, includeCredentials, JSON.stringify(extraHeaders)]);

  const handleChooseFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (onUpload) onUpload(f);

    const previewUrl = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
    const localId = `local-${Date.now()}`;
    const previewItem: DocumentItem = { id: localId, name: f.name, fileUrl: previewUrl ?? null, mimeType: f.type, createdAt: new Date().toISOString() };
    setLocalFiles((s) => [previewItem, ...s]);

    try {
      setUploadingIds((s) => ({ ...s, [localId]: true }));
      const form = new FormData();
      form.append(fileFieldName, f);
      const client = clientId.id;
      const res = await fetch(`${BASE_URL}/clients/${client}/documents`, buildFetchOptions({ method: "POST", body: form }));

      if (res.status === 401) {
        setLocalFiles((s) => s.filter((x) => x.id !== localId));
        setError("Unauthorized (401). Provide valid auth.");
        if (onUnauthorized) onUnauthorized();
        return;
      }
      if (!res.ok) {
        setLocalFiles((s) => s.filter((x) => x.id !== localId));
        const txt = await res.text();
        throw new Error(`Upload failed: ${res.status} ${txt}`);
      }

      const data = await res.json();
      const uploaded: DocumentItem = {
        id: data.id,
        name: data.filename ?? f.name,
        fileUrl: data.url ?? data.fileUrl ?? previewUrl ?? null,
        mimeType: data.mimeType ?? f.type,
        createdAt: data.uploadedAt ?? new Date().toISOString(),
        size: data.size ?? null,
        uploadedBy: data.uploadedBy ?? null,
      };

      setLocalFiles((s) => [uploaded, ...s.filter((x) => x.id !== localId)]);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.message ?? "Upload failed");
    } finally {
      setUploadingIds((s) => {
        const copy = { ...s };
        delete copy[localId];
        return copy;
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const humanName = (n?: string | null) => (n ? n : "Untitled");

  const handleDelete = async (id: string | number) => {
    setLocalFiles((s) => s.filter((x) => x.id !== id));
    if (onDelete) onDelete(id);

    try {
      const client = clientId.id;
      const res = await fetch(`${BASE_URL}/clients/${client}/documents/${id}`, buildFetchOptions({ method: "DELETE" }));
      if (res.status === 401) {
        setError("Unauthorized (401). Provide valid auth.");
        if (onUnauthorized) onUnauthorized();
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete failed: ${res.status} ${txt}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to delete document");
    }
  };

  const handleView = (doc: DocumentItem) => {
    if (onAction) onAction(doc, "view");
    if (doc.fileUrl) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.target = "_blank";
      // don't set download attribute for view
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border p-5">
        <h3 className="text-lg font-semibold mb-4">Upload file</h3>

       <div 
  onClick={handleChooseFile} 
  role="button" 
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
      <path d="M12 16a1 1 0 0 1-1-1v-4.586l-1.293 1.293a1 1 0 1 1-1.414-1.414l3-3a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1-1.414 1.414L13 10.414V15a1 1 0 0 1-1 1Zm7-1a5 5 0 0 0-4.546-4.978A7 7 0 0 0 5.062 9.2 5 5 0 0 0 6 19h13a4 4 0 0 0 0-8Z"/>
    </svg>

    <div className="text-sm font-medium">Choose a file</div>
  </div>

  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
</div>


        {loading && <div className="mt-3 text-sm text-gray-500">Loading documents…</div>}
        {error && <div className="mt-3 text-sm text-red-600">Error: {error}</div>}

        <div className="mt-6 space-y-4">
          {localFiles.length === 0 ? <div className="text-sm text-gray-500">No documents uploaded yet.</div> : (
            <div className="grid grid-cols-6 gap-4">
              {localFiles.map((doc) => (
                <div key={String(doc.id)} className="col-span-1">
                  <div className="relative">
                    <div className="bg-gray-50 w-full h-20 rounded overflow-hidden flex items-center justify-center border">
                      {doc.fileUrl ? doc.mimeType?.startsWith?.("image/") ? (
                        <Image src={doc.fileUrl!} alt={doc.name ?? "document"} fill sizes="160px" style={{ objectFit: "cover" }} unoptimized />
                      ) : <div className="text-gray-400 text-xs">File</div> : <div className="text-gray-400 text-xs">No Preview</div>}
                    </div>

                    <div className="absolute top-1 right-1">
                      <button onClick={() => setMenuOpenFor(menuOpenFor === doc.id ? null : doc.id)} className="p-1 rounded hover:bg-white/60" aria-label="Open actions">
                        <MoreHorizontal size={16} />
                      </button>

                      {menuOpenFor === doc.id && (
                        <div className="absolute right-0 mt-8 w-36 bg-white border rounded shadow-lg z-30">
                          <button
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              setMenuOpenFor(null);
                              if (onAction) onAction(doc, "download");
                              if (doc.fileUrl) {
                                const a = document.createElement("a");
                                a.href = doc.fileUrl;
                                a.download = doc.name ?? "file";
                                a.target = "_blank";
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                              }
                            }}
                          >
                            Download
                          </button>

                          <button
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              setMenuOpenFor(null);
                              handleView(doc);
                            }}
                          >
                            View
                          </button>

                          <button
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-red-600"
                            onClick={() => {
                              setMenuOpenFor(null);
                              handleDelete(doc.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    <div className="text-sm font-medium flex items-center gap-2">{humanName(doc.name)}{uploadingIds[String(doc.id)] && <span className="text-xs text-gray-400"> · uploading…</span>}</div>
                    <div className="text-xs text-gray-400">{doc.createdAt ?
                    //  new Date(doc.createdAt).toLocaleDateString() : ""
                    format(new Date(doc.createdAt), "dd-MM-yyyy") : ""
                     }</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

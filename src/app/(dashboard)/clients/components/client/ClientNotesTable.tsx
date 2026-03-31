"use client";

import React, { useEffect, useRef, useState } from "react";
import { MoreVertical, Globe, Lock, Eye, Edit, Trash2, Plus, X } from "lucide-react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


export type NoteItem = {
  id: number;
  clientId?: number;
  title: string;
  content?: string | null;
  type: string; // PUBLIC / PRIVATE
  createdBy?: string | null;
  createdAt?: string | null;
};

// primary fallback base (kept for backward compatibility)
const FALLBACK_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;
// POST should use Gateway (if provided)
const POST_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;
// DELETE should use main (if provided)
const DELETE_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;

// helper: try convert various clientId shapes -> numeric
function resolveClientIdToNumber(clientId: any): number | null {
  if (typeof clientId === "number") return clientId;

  const raw = String(clientId ?? "").trim();

  // If it's already numeric string → use it
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);

  // Extract digits from string like "CLI010"
  const digits = raw.replace(/\D+/g, "");
  if (digits.length > 0) return parseInt(digits, 10);

  return null;
}

export default function ClientNotesTable({
  clientId,
  authToken,
  extraHeaders,
  includeCredentials = false,
  onView,
  onEdit,
  onDelete,
}: {
  clientId: any;
  authToken?: string | null;
  extraHeaders?: Record<string, string> | null;
  includeCredentials?: boolean;
  onView?: (note: NoteItem) => void;
  onEdit?: (note: NoteItem) => void;
  onDelete?: (note: NoteItem) => void;
}) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);

  // Add modal state & form
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const [formType, setFormType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [saving, setSaving] = useState(false);

  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewNote, setViewNote] = useState<NoteItem | null>(null);


  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);


  const handleMenuOpen = (
    e: React.MouseEvent,
    noteId: number
  ) => {
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    setMenuOpenFor(noteId);
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.right - 180,
    });
  };


  useEffect(() => {
    if (menuOpenFor === null) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpenFor(null);
        setMenuPosition(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpenFor(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpenFor]);





  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNoteId, setEditNoteId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetail, setEditDetail] = useState("");
  const [editType, setEditType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [updating, setUpdating] = useState(false);

  const buildFetchOptions = (opts: { method?: string; headers?: HeadersInit; body?: BodyInit | null }) => {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(extraHeaders || {}),
      ...(opts.headers || {}),
    };

    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    return {
      method: opts.method ?? "GET",
      headers,
      body: opts.body ?? undefined,
      credentials: includeCredentials ? "include" : "same-origin",
    } as RequestInit;
  };

  // Load notes
  useEffect(() => {
    let mounted = true;

    async function loadNotes() {
      setLoading(true);
      setError(null);

      const numericId = resolveClientIdToNumber(clientId);
      if (numericId === null) {
        setLoading(false);
        setError(`Invalid clientId: "${String(clientId)}". Cannot convert to numeric ID.`);
        return;
      }

      try {
        const res = await fetch(`${FALLBACK_BASE}/clients/${numericId}/notes`, buildFetchOptions({ method: "GET" }));

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to load notes: ${res.status} ${txt}`);
        }

        const data = await res.json();

        const mapped: NoteItem[] = Array.isArray(data)
          ? data.map((n: any) => ({
            id: n.id,
            clientId: n.clientId,
            title: n.title ?? "Untitled",
            content: n.detail ?? null,
            type: n.type ?? "PRIVATE",
            createdBy: n.createdBy,
            createdAt: n.createdAt,
          }))
          : [];

        if (mounted) setNotes(mapped);
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err?.message ?? "Unable to load notes");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadNotes();
    return () => {
      mounted = false;
    };
  }, [clientId]);

  // Delete note (uses DELETE_BASE)
  const handleDelete = async (note: NoteItem) => {
    // optimistic UI remove
    setNotes((prev) => prev.filter((x) => x.id !== note.id));
    if (onDelete) onDelete(note);

    const numericId = resolveClientIdToNumber(clientId);
    if (numericId === null) {
      setError("Invalid clientId while deleting note.");
      return;
    }

    try {
      // DELETE endpoint per your spec: {{main}}/clients/{{clientId}}/notes/{{notesId}}
      const res = await fetch(`${DELETE_BASE}/clients/${numericId}/notes/${note.id}`, buildFetchOptions({ method: "DELETE" }));

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete failed: ${res.status} ${txt}`);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete note");
      // optional: refetch or revert UI — keeping simple as requested
    }
  };

  // Add note helpers (POST uses POST_BASE)
  const openAddModal = () => {
    setFormTitle("");
    setFormDetail("");
    setFormType("PUBLIC");
    setShowAddModal(true);
    onEdit?.({ id: 0, title: "", type: "PRIVATE", content: "" } as NoteItem);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSaving(false);
  };

  const handleSaveNote = async () => {
    if (!formTitle.trim()) {
      setError("Please enter a note title.");
      return;
    }
    setError(null);
    setSaving(true);

    const numericId = resolveClientIdToNumber(clientId);
    if (numericId === null) {
      setError("Invalid clientId while saving note.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        title: formTitle,
        detail: formDetail,
        type: formType,
      };

      // POST per your spec: {{Gateway}}/clients/{{clientId}}/notes
      const res = await fetch(`${POST_BASE}/clients/${numericId}/notes`, buildFetchOptions({ method: "POST", body: JSON.stringify(payload) }));

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to save note: ${res.status} ${txt}`);
      }

      const saved = await res.json();

      const newNote: NoteItem = {
        id: saved?.id ?? Date.now(),
        clientId: saved?.clientId ?? numericId,
        title: saved?.title ?? payload.title,
        content: saved?.detail ?? payload.detail,
        type: saved?.type ?? payload.type,
        createdBy: saved?.createdBy ?? undefined,
        createdAt: saved?.createdAt ?? new Date().toISOString(),
      };

      setNotes((prev) => [newNote, ...prev]);
      closeAddModal();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to save note");
      setSaving(false);
    }
  };

  // View modal helpers
  const openViewModal = (note: NoteItem) => {
    setViewNote(note);
    setShowViewModal(true);
    onView?.(note);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewNote(null);
  };

  // Edit modal helpers
  const openEditModal = (note: NoteItem) => {
    setEditNoteId(note.id);
    setEditTitle(note.title ?? "");
    setEditDetail(note.content ?? "");
    setEditType(note.type === "PUBLIC" ? "PUBLIC" : "PRIVATE");
    setShowEditModal(true);
    onEdit?.(note);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setUpdating(false);
    setEditNoteId(null);
  };

  const handleUpdateNote = async () => {
    if (!editTitle.trim()) {
      setError("Please enter a note title.");
      return;
    }
    setError(null);
    setUpdating(true);

    const numericId = resolveClientIdToNumber(clientId);
    if (numericId === null || editNoteId === null) {
      setError("Invalid clientId or note id while updating.");
      setUpdating(false);
      return;
    }

    try {
      const payload = {
        title: editTitle,
        detail: editDetail,
        type: editType,
      };

      // << CHANGED >> use PUT because backend expects PUT for update
      const res = await fetch(`${POST_BASE}/clients/${numericId}/notes/${editNoteId}`, buildFetchOptions({ method: "PUT", body: JSON.stringify(payload) }));

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to update note: ${res.status} ${txt}`);
      }

      const updated = await res.json();

      const updatedNote: NoteItem = {
        id: updated?.id ?? editNoteId,
        clientId: updated?.clientId ?? numericId,
        title: updated?.title ?? payload.title,
        content: updated?.detail ?? payload.detail,
        type: updated?.type ?? payload.type,
        createdBy: updated?.createdBy ?? undefined,
        createdAt: updated?.createdAt ?? undefined,
      };

      setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      closeEditModal();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to update note");
      setUpdating(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded shadow-sm border">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b">
          {/* <h3 className="text-lg font-semibold">Notes</h3> */}

          {/* <button
            type="button"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded"
            onClick={openAddModal}
          >
            <Plus size={16} /> Add Note
          </button> */}


{loading ? (
  <Skeleton width={120} height={35} />
) : (
  <button
    type="button"
    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded"
    onClick={openAddModal}
  >
    <Plus size={16} /> Add Note
  </button>
)}



        </div>

        <div className="p-4">
          {/* {loading && <div className="text-sm text-gray-600">Loading notes…</div>} */}

{loading && (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      
      {/* Header Skeleton */}
      <thead>
        <tr className="bg-blue-50">
          <th className="px-4 py-3 w-1/2">
            <Skeleton width={120} />
          </th>
          <th className="px-4 py-3 w-1/4">
            <Skeleton width={100} />
          </th>
          <th className="px-4 py-3 w-1/6 text-right">
            <Skeleton width={60} />
          </th>
        </tr>
      </thead>

      {/* Rows Skeleton */}
      <tbody>
        {[...Array(5)].map((_, i) => (
          <tr key={i} className="border-t">
            
            {/* Title */}
            <td className="px-4 py-4">
              <Skeleton width="80%" />
            </td>

            {/* Type */}
            <td className="px-4 py-4 flex items-center gap-2">
              <Skeleton circle width={14} height={14} />
              <Skeleton width={60} />
            </td>

            {/* Action */}
            <td className="px-4 py-4 text-right">
              <Skeleton circle width={28} height={28} />
            </td>

          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}



          {error && <div className="text-sm text-red-600 mb-2">Error: {error}</div>}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-left rounded-t-md">
                  <th className="px-4 py-3 w-1/2 rounded-tl-md">Note Title</th>
                  <th className="px-4 py-3 w-1/4">Note Type</th>
                  <th className="px-4 py-3 w-1/6 text-right rounded-tr-md">Action</th>
                </tr>
              </thead>

              <tbody>
                {/* {notes.length === 0 && !loading ? ( */}
  {loading ? null : notes.length === 0 ? (


                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No notes found.</td>
                  </tr>
                ) : (
                  notes.map((note) => (
                    <tr key={note.id} className="border-t">
                      <td className="px-4 py-4">{note.title}</td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          {note.type === "PUBLIC" ? (
                            <>
                              <Globe size={14} /> <span className="text-xs">Public</span>
                            </>
                          ) : (
                            <>
                              <Lock size={14} /> <span className="text-xs">Private</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right relative">



                        <button
                          onClick={(e) => handleMenuOpen(e, note.id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >

                          <MoreVertical size={18} />
                        </button>



                        {menuOpenFor !== null && menuPosition && (
                          <div
                            ref={menuRef}
                            style={{
                              position: "fixed",
                              top: menuPosition.top,
                              left: menuPosition.left,
                              zIndex: 9999,
                              minWidth: 180,
                            }}
                            className="bg-white border rounded shadow-lg"
                          >
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                              onClick={() => {
                                const note = notes.find(n => n.id === menuOpenFor);
                                if (!note) return;
                                setMenuOpenFor(null);
                                setMenuPosition(null);
                                openViewModal(note);
                              }}
                            >
                              <Eye size={14} /> View
                            </button>

                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                              onClick={() => {
                                const note = notes.find(n => n.id === menuOpenFor);
                                if (!note) return;
                                setMenuOpenFor(null);
                                setMenuPosition(null);
                                openEditModal(note);
                              }}
                            >
                              <Edit size={14} /> Edit
                            </button>

                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                              onClick={() => {
                                const note = notes.find(n => n.id === menuOpenFor);
                                if (!note) return;
                                setMenuOpenFor(null);
                                setMenuPosition(null);
                                handleDelete(note);
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}


                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddModal && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center pt-12">
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => !saving && closeAddModal()} />
          {/* <div className="relative z-10 w-[900px] max-w-[95%] bg-white rounded-lg shadow-xl border"> */}
          <div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-lg font-medium">Add Project Note</h4>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => !saving && closeAddModal()}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-lg border p-6">
                <h5 className="text-sm font-medium mb-4">Client Note Details</h5>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-xs text-gray-600 mb-2">Note Title <span className="text-red-500">*</span></label>
                    <input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="--"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-6 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <input id="note-public" type="radio" name="noteType" checked={formType === "PUBLIC"} onChange={() => setFormType("PUBLIC")} />
                      <label htmlFor="note-public" className="text-sm text-gray-700">Public</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="note-private" type="radio" name="noteType" checked={formType === "PRIVATE"} onChange={() => setFormType("PRIVATE")} />
                      <label htmlFor="note-private" className="text-sm text-gray-700">Private</label>
                    </div>
                  </div>

                  <div className="col-span-12">
                    <label className="block text-xs text-gray-600 mb-2">Note Detail</label>
                    <textarea
                      value={formDetail}
                      onChange={(e) => setFormDetail(e.target.value)}
                      className="w-full border rounded px-3 py-3 text-sm min-h-[120px]"
                      placeholder="--"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-6 border-t">
              <button
                className="px-6 py-2 text-sm border rounded hover:bg-gray-50"
                onClick={() => !saving && closeAddModal()}
              >
                Cancel
              </button>

              <button
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleSaveNote}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Note Modal */}
      {showViewModal && viewNote && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center pt-12">
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => closeViewModal()} />
         <div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
          {/* <div className="relative z-10 w-[900px] max-w-[95%] bg-white rounded-lg shadow-xl border"> */}
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-lg font-medium">{viewNote.title ?? "My Note"}</h4>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => closeViewModal()}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-lg border p-6">
                <h5 className="text-sm font-medium mb-4">Project Note Details</h5>

                <div className="grid grid-cols-12 gap-6 text-sm text-gray-700">
                  <div className="col-span-12 md:col-span-4">
                    <div className="text-xs text-gray-500">Note Title</div>
                    <div className="mt-2">{viewNote.title ?? "---"}</div>
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <div className="text-xs text-gray-500">Note Type</div>
                    <div className="mt-2">{viewNote.type === "PUBLIC" ? "Public" : "Private"}</div>
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <div className="text-xs text-gray-500">Note Detail</div>
                    <div className="mt-2 whitespace-pre-wrap">{viewNote.content ?? "---"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-6 border-t">
              <button
                className="px-6 py-2 text-sm border rounded hover:bg-gray-50"
                onClick={() => closeViewModal()}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {showEditModal && editNoteId !== null && (
        // <div className="fixed inset-0 z-50 flex items-start justify-center pt-12">
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => !updating && closeEditModal()} />
          {/* <div className="relative z-10 w-[900px] max-w-[95%] bg-white rounded-lg shadow-xl border"> */}
          <div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="text-lg font-medium">Update Project Note</h4>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => !updating && closeEditModal()}>
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-lg border p-6">
                <h5 className="text-sm font-medium mb-4">Project Note Details</h5>

                <div className="grid grid-row-12 gap-4">
                  <div className="col-span-12 md:row-span-6">
                    <label className="block text-xs text-gray-600 mb-2">Note Title <span className="text-red-500">*</span></label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                      placeholder="--"
                    />
                  </div>

                  <div className="col-span-12 md:col-span-6 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <input id="edit-note-public" type="radio" name="editNoteType" checked={editType === "PUBLIC"} onChange={() => setEditType("PUBLIC")} />
                      <label htmlFor="edit-note-public" className="text-sm text-gray-700">Public</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input id="edit-note-private" type="radio" name="editNoteType" checked={editType === "PRIVATE"} onChange={() => setEditType("PRIVATE")} />
                      <label htmlFor="edit-note-private" className="text-sm text-gray-700">Private</label>
                    </div>
                  </div>

                  <div className="col-span-12">
                    <label className="block text-xs text-gray-600 mb-2">Note Detail</label>
                    <textarea
                      value={editDetail}
                      onChange={(e) => setEditDetail(e.target.value)}
                      className="w-full border rounded px-3 py-3 text-sm min-h-[120px]"
                      placeholder="--"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 p-6 border-t">
              <button
                className="px-6 py-2 text-sm border rounded hover:bg-gray-50"
                onClick={() => !updating && closeEditModal()}
              >
                Cancel
              </button>

              <button
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleUpdateNote}
                disabled={updating}
              >
                {updating ? "Updating…" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




"use client";

import React, { useEffect, useState } from "react";
import {
  MoreVertical,
  Globe,
  Lock,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
} from "lucide-react";

/* ================= TYPES ================= */
export type ProjectNoteItem = {
  id: number;
  title: string;
  content?: string | null;
  isPublic: boolean;
  createdBy?: string | null;
  createdAt?: string | null;
};

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

/* ================= COMPONENT ================= */
export default function ProjectNotesTable({
  projectId,
  authToken,
}: {
  projectId: number;
  authToken?: string;
}) {
  const [notes, setNotes] = useState<ProjectNoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);

  /* ===== ADD ===== */
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPublic, setFormPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ===== VIEW ===== */
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewNote, setViewNote] = useState<ProjectNoteItem | null>(null);

  /* ===== EDIT ===== */
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPublic, setEditPublic] = useState(true);
  const [updating, setUpdating] = useState(false);

  const authHeader = {
    Authorization: `Bearer ${authToken || localStorage.getItem("accessToken") || ""
      }`,
  };

  /* ================= LOAD NOTES ================= */
  useEffect(() => {
    if (!projectId) return;

    const loadNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BASE_URL}/projects/${projectId}/notes`,
          { headers: authHeader }
        );
        if (!res.ok) throw new Error("Failed to load notes");

        const data = await res.json();
        setNotes(
          Array.isArray(data)
            ? data.map((n: any) => ({
              id: n.id,
              title: n.title ?? "Untitled",
              content: n.content ?? "---",
              isPublic: !!n.isPublic,
              createdBy: n.createdBy,
              createdAt: n.createdAt,
            }))
            : []
        );
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [projectId]);

  /* ================= ADD ================= */
  const saveNote = async () => {
    if (!formTitle.trim()) {
      setError("Note title is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `${BASE_URL}/projects/${projectId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            isPublic: formPublic,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to save note");
      const saved = await res.json();

      setNotes((prev) => [
        {
          id: saved.id,
          title: saved.title,
          content: saved.content ?? "---",
          isPublic: saved.isPublic,
          createdBy: saved.createdBy,
          createdAt: saved.createdAt,
        },
        ...prev,
      ]);

      setShowAddModal(false);
      setFormTitle("");
      setFormContent("");
      setFormPublic(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ================= UPDATE (NEW API) ================= */
  const updateNote = async () => {
    if (!editId) return;

    setUpdating(true);
    try {
      const res = await fetch(
        `${BASE_URL}/notes/project/${editId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({
            title: editTitle,
            content: editContent,
            isPublic: editPublic,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update note");
      const updated = await res.json();

      setNotes((p) =>
        p.map((n) =>
          n.id === editId
            ? {
              ...n,
              title: updated.title,
              content: updated.content,
              isPublic: updated.isPublic,
            }
            : n
        )
      );

      setShowEditModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  /* ================= DELETE ================= */
  const deleteNote = async (note: ProjectNoteItem) => {
    setNotes((p) => p.filter((n) => n.id !== note.id));
    try {
      await fetch(
        `${BASE_URL}/projects/${projectId}/notes/${note.id}`,
        { method: "DELETE", headers: authHeader }
      );
    } catch {
      setError("Delete failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="bg-white rounded border">
      <div className="p-4 flex justify-end border-b">

      </div>

      <div className="p-4">
        {loading && <p>Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}

        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-blue-50">
              <th className="px-4 py-3 text-left">Note Title</th>
              <th className="px-4 py-3">Note Type</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id} className="border-t">
                <td className="px-4 py-3">{note.title}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    {note.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                    {note.isPublic ? "Public" : "Private"}
                  </div>
                </td>
                <td className="px-4 py-3 text-center relative">
                  <button
                    className="w-full px-3 py-2 flex gap-2 "
                    onClick={() => {
                      setViewNote(note);
                      setShowViewModal(true);
                      setMenuOpenFor(null);
                    }}
                  >
                    <Eye size={14} />
                  </button>

                  {menuOpenFor === note.id && (
                    <div className="absolute right-0 mt-2 bg-white border rounded shadow w-40 z-20">

                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= VIEW MODAL ================= */}
      {showViewModal && viewNote && (
        <ModalWrapper onClose={() => setShowViewModal(false)}>
          <ModalHeader
            title={viewNote.title}
            onClose={() => setShowViewModal(false)}
          />
          <div className="p-6">
            <div className="border rounded-lg p-6 space-y-4">
              <h4 className="font-medium text-gray-700">
                Project Note Details
              </h4>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-gray-500">Note Title</div>
                <div className="col-span-2">{viewNote.title}</div>

                <div className="text-gray-500">Note Type</div>
                <div className="col-span-2">
                  {viewNote.isPublic ? "Public" : "Private"}
                </div>

                <div className="text-gray-500">Note Detail</div>
                <div className="col-span-2 whitespace-pre-wrap">
                  {viewNote.content || "---"}
                </div>
              </div>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* ================= ADD MODAL ================= */}


      {/* ================= EDIT MODAL ================= */}

    </div>
  );
}

/* ================= REUSABLE UI ================= */

function ModalWrapper({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center pt-12">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[900px] max-w-[95%] rounded border shadow">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: any) {
  return (
    <div className="p-4 border-b flex justify-between">
      <h4 className="font-medium">{title}</h4>
      <button onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
}

function ModalBody({ children }: any) {
  return <div className="p-6 space-y-4">{children}</div>;
}

function ModalFooter({ onCancel, onSave, loading, saveText }: any) {
  return (
    <div className="p-4 border-t flex justify-center gap-4">
      <button className="border px-6 py-2 rounded" onClick={onCancel}>
        Cancel
      </button>
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded"
        disabled={loading}
        onClick={onSave}
      >
        {loading ? "Saving…" : saveText}
      </button>
    </div>
  );
}

function Input({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <input
        className="w-full border px-3 py-2 rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Textarea({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label}</label>
      <textarea
        className="w-full border px-3 py-2 rounded min-h-[120px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RadioPublicPrivate({ value, onChange }: any) {
  return (
    <div className="flex gap-6">
      <label className="flex gap-2 items-center">
        <input type="radio" checked={value} onChange={() => onChange(true)} />
        Public
      </label>
      <label className="flex gap-2 items-center">
        <input type="radio" checked={!value} onChange={() => onChange(false)} />
        Private
      </label>
    </div>
  );
}

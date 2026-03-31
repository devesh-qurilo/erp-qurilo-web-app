
"use client";

import { useEffect, useState } from "react";

type NoteItem = {
  id?: number;
  noteTitle: string;
  noteType: "PUBLIC" | "PRIVATE" | string;
  noteDetails?: string;
};

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

export default function NoteActionModal({
  dealId,
  note,
  mode,
  onClose,
  onUpdated,
}: {
  dealId: string;
  note: NoteItem;
  mode: "view" | "edit";
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState(note);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // slide animation trigger
  useEffect(() => {
    setTimeout(() => setIsOpen(true), 10);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  const handleSave = async () => {
    if (!form.noteTitle.trim()) {
      alert("Note title required");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(
        `${BASE_URL}/deals/${dealId}/notes/${form.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            noteTitle: form.noteTitle,
            noteType: form.noteType,
            noteDetails: form.noteDetails || "",
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update note");

      await onUpdated();
      handleClose();
    } catch (err: any) {
      alert(err.message || "Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`relative h-full bg-white shadow-2xl border-l overflow-y-auto transition-transform duration-300 ease-in-out`}
        style={{
          width: "83%",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="p-10">

          {/* Header */}
          <div className="flex justify-between items-center pb-6 mb-8 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h3 className="text-xl font-semibold text-gray-900">
              {mode === "view" ? "View Note" : "Edit Note"}
            </h3>

            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            >
              ✕
            </button>
          </div>



          {mode === "view" ? (
            <div className="space-y-8 text-sm">
              <div>
                <div className="text-gray-500 mb-2">Title</div>
                <div className="text-gray-900 font-medium text-lg">
                  {note.noteTitle}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2">Type</div>
                <div className="text-gray-900">
                  {note.noteType}
                </div>
              </div>

              <div>
                <div className="text-gray-500 mb-2">Details</div>
                <div className="text-gray-900 whitespace-pre-line">
                  {note.noteDetails || "---"}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                <div>
                  <label className="text-sm text-gray-600">
                    Title *
                  </label>
                  <input
                    value={form.noteTitle}
                    onChange={(e) =>
                      setForm({ ...form, noteTitle: e.target.value })
                    }
                    className="mt-3 w-full border rounded-md px-4 py-3"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Type
                  </label>
                  <select
                    value={form.noteType}
                    onChange={(e) =>
                      setForm({ ...form, noteType: e.target.value })
                    }
                    className="mt-3 w-full border rounded-md px-4 py-3"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600">
                    Details
                  </label>
                  <textarea
                    value={form.noteDetails}
                    onChange={(e) =>
                      setForm({ ...form, noteDetails: e.target.value })
                    }
                    className="mt-3 w-full border rounded-md px-4 py-3 min-h-[220px]"
                  />
                </div>
              </div>

              <div className="mt-12 flex gap-6">
                <button
                  onClick={handleClose}
                  className="px-8 py-3 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-md"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

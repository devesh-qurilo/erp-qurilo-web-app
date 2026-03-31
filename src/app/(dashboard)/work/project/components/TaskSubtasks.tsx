"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Trash2, Pencil } from "lucide-react";

const MAIN_API = process.env.NEXT_PUBLIC_MAIN;

export default function TaskSubtasks({ taskId }: { taskId: number }) {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    if (taskId) fetchSubtasks();
  }, [taskId]);

  async function fetchSubtasks() {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${MAIN_API}/tasks/${taskId}/subtasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setSubtasks(data || []);
    } catch (err) {
      console.error("Subtask fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!title.trim()) return alert("Title required");

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

      if (!res.ok) throw new Error("Create failed");

      setTitle("");
      setDescription("");

      fetchSubtasks();
    } catch (err) {
      console.error(err);
    }
  }

//   async function handleUpdate(id: number) {
//     try {
//       const token = localStorage.getItem("accessToken");

//       const res = await fetch(
//         `${MAIN_API}/tasks/${taskId}/subtasks/${id}`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ title, description }),
//         }
//       );

//       if (!res.ok) throw new Error("Update failed");

//       setEditId(null);
//       setTitle("");
//       setDescription("");

//       fetchSubtasks();
//     } catch (err) {
//       console.error(err);
//     }
//   }



async function handleUpdate(id: number) {
  if (!title.trim()) return alert("Title required");

  try {
    const token = localStorage.getItem("accessToken");

    const res = await fetch(
      `${MAIN_API}/tasks/${taskId}/subtasks/${id}`,
      {
        method: "PUT", // 🔴 change PATCH → PUT
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description || "",
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Update error:", err);
      alert("Update failed");
      return;
    }

    const updated = await res.json();

    // update UI immediately
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? updated : s))
    );

    setEditId(null);
    setTitle("");
    setDescription("");

  } catch (err) {
    console.error("Update failed:", err);
  }
}


  async function handleDelete(id: number) {
    if (!confirm("Delete this subtask?")) return;

    try {
      const token = localStorage.getItem("accessToken");

      await fetch(`${MAIN_API}/tasks/${taskId}/subtasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubtasks((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">

      {/* Add/Edit form */}

      <div className="border rounded-lg p-3">

        <input
          placeholder="Subtask title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm mb-2"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm mb-2"
        />

        {editId ? (
          <div className="flex gap-2">
            <button
            //   onClick={() => handleUpdate(editId)}
            onClick={() => editId && handleUpdate(editId)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Update
            </button>

            <button
            //   onClick={() => {
            //     setEditId(null);
            //     setTitle("");
            //     setDescription("");
            //   }}


onClick={() => {
  setEditId(sub.id);
  setTitle(sub.title || "");
  setDescription(sub.description || "");
}}


              className="px-3 py-1 border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Add Subtask
          </button>
        )}
      </div>

      {/* Subtask list */}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin" />
        </div>
      ) : subtasks.length === 0 ? (
        <div className="text-sm text-gray-500">No subtasks</div>
      ) : (
        <div className="space-y-2">

          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className="flex justify-between items-start border rounded p-3"
            >
              <div>
                <div className="font-medium text-sm">{sub.title}</div>
                <div className="text-xs text-gray-500">
                  {sub.description}
                </div>
              </div>

              <div className="flex gap-2">

                <button
                  onClick={() => {
                    setEditId(sub.id);
                    setTitle(sub.title);
                    setDescription(sub.description);
                  }}
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => handleDelete(sub.id)}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
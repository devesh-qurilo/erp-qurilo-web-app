// "use client";

// import React, { useEffect, useState } from "react";
// import { Loader2, Trash2, Pencil } from "lucide-react";

// const MAIN_API = process.env.NEXT_PUBLIC_MAIN;

// export default function TaskSubtasks({ taskId }: { taskId: number }) {
//   const [subtasks, setSubtasks] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");

//   const [editId, setEditId] = useState<number | null>(null);

//   useEffect(() => {
//     if (taskId) fetchSubtasks();
//   }, [taskId]);

//   async function fetchSubtasks() {
//     try {
//       setLoading(true);

//       const token = localStorage.getItem("accessToken");

//       const res = await fetch(`${MAIN_API}/tasks/${taskId}/subtasks`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await res.json();
//       setSubtasks(data || []);
//     } catch (err) {
//       console.error("Subtask fetch error:", err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleCreate() {
//     if (!title.trim()) return alert("Title required");

//     try {
//       const token = localStorage.getItem("accessToken");

//       const res = await fetch(`${MAIN_API}/tasks/${taskId}/subtasks`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           title: title.trim(),
//           description,
//         }),
//       });

//       if (!res.ok) throw new Error("Create failed");

//       setTitle("");
//       setDescription("");

//       fetchSubtasks();
//     } catch (err) {
//       console.error(err);
//     }
//   }

//   async function handleUpdate(id: number) {
//     if (!title.trim()) return alert("Title required");

//     try {
//       const token = localStorage.getItem("accessToken");

//       const res = await fetch(
//         `${MAIN_API}/tasks/${taskId}/subtasks/${id}`,
//         {
//           method: "PUT",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             title: title.trim(),
//             description: description || "",
//           }),
//         }
//       );

//       if (!res.ok) throw new Error("Update failed");

//       const updated = await res.json();

//       setSubtasks((prev) =>
//         prev.map((s) => (s.id === id ? updated : s))
//       );

//       setEditId(null);
//       setTitle("");
//       setDescription("");

//     } catch (err) {
//       console.error("Update failed:", err);
//     }
//   }

//   async function handleDelete(id: number) {
//     if (!confirm("Delete this subtask?")) return;

//     try {
//       const token = localStorage.getItem("accessToken");

//       await fetch(`${MAIN_API}/tasks/${taskId}/subtasks/${id}`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setSubtasks((prev) => prev.filter((s) => s.id !== id));
//     } catch (err) {
//       console.error(err);
//     }
//   }

//   return (
//     <div className="space-y-4">

//       {/* Create / Edit Form */}

//       <div className="border rounded-lg p-3">

//         <input
//           placeholder="Subtask title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           className="w-full border rounded px-3 py-2 text-sm mb-2"
//         />

//         <textarea
//           placeholder="Description"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           className="w-full border rounded px-3 py-2 text-sm mb-2"
//         />

//         {editId ? (
//           <div className="flex gap-2">
//             <button
//               onClick={() => handleUpdate(editId)}
//               className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
//             >
//               Update
//             </button>

//             <button
//               onClick={() => {
//                 setEditId(null);
//                 setTitle("");
//                 setDescription("");
//               }}
//               className="px-3 py-1 border rounded text-sm"
//             >
//               Cancel
//             </button>
//           </div>
//         ) : (
//           <button
//             onClick={handleCreate}
//             className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
//           >
//             Add Subtask
//           </button>
//         )}
//       </div>

//       {/* Subtask List */}

//       {loading ? (
//         <div className="flex justify-center py-6">
//           <Loader2 className="animate-spin" />
//         </div>
//       ) : subtasks.length === 0 ? (
//         <div className="text-sm text-gray-500">No subtasks</div>
//       ) : (
//         <div className="space-y-2">

//           {subtasks.map((sub) => (
//             <div
//               key={sub.id}
//               className="flex justify-between items-start border rounded p-3"
//             >
//               <div>
//                 <div className="font-medium text-sm">{sub.title}</div>
//                 <div className="text-xs text-gray-500">
//                   {sub.description}
//                 </div>
//               </div>

//               <div className="flex gap-2">

//                 <button
//                   onClick={() => {
//                     setEditId(sub.id);
//                     setTitle(sub.title || "");
//                     setDescription(sub.description || "");
//                   }}
//                 >
//                   <Pencil size={16} />
//                 </button>

//                 <button
//                   onClick={() => handleDelete(sub.id)}
//                   className="text-red-500"
//                 >
//                   <Trash2 size={16} />
//                 </button>

//               </div>
//             </div>
//           ))}

//         </div>
//       )}
//     </div>
//   );
// }





"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Eye } from "lucide-react";

const MAIN_API = process.env.NEXT_PUBLIC_MAIN;

export default function TaskSubtasks({ taskId }: { taskId: number }) {
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [viewSubtask, setViewSubtask] = useState<any | null>(null);

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
        body: JSON.stringify({
          title: title.trim(),
          description,
        }),
      });

      if (!res.ok) throw new Error("Create failed");

      setTitle("");
      setDescription("");

      fetchSubtasks();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">

      {/* Create Form */}

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

        <button
          onClick={handleCreate}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          Add Subtask
        </button>
      </div>

      {/* Subtask List */}

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

                {sub.description && (
                  <div className="text-xs text-gray-500">
                    {sub.description}
                  </div>
                )}
              </div>

              {/* View Button */}

              <button
                onClick={() => setViewSubtask(sub)}
                className="text-gray-600 hover:text-gray-800"
              >
                <Eye size={18} />
              </button>
            </div>
          ))}

        </div>
      )}

      {/* View Modal */}

      {viewSubtask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">

          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">

            <h3 className="text-lg font-semibold mb-4">
              Subtask Details
            </h3>

            <div className="space-y-3 text-sm">

              <div>
                <div className="text-gray-500">Title</div>
                <div className="font-medium">{viewSubtask.title}</div>
              </div>

              <div>
                <div className="text-gray-500">Description</div>
                <div className="font-medium">
                  {viewSubtask.description || "--"}
                </div>
              </div>

            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewSubtask(null)}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
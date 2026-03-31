
"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Eye } from "lucide-react";

const MAIN_API = process.env.NEXT_PUBLIC_MAIN;

export default function SubTasksTab({ taskId }) {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [viewSubtask, setViewSubtask] = useState(null);

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  /* --------------------------------------------
   * GET ALL SUBTASKS
   * -------------------------------------------- */
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

  /* --------------------------------------------
   * CREATE SUBTASK
   * -------------------------------------------- */
  async function handleCreate() {
    if (!title.trim()) return alert("Title is required");

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

      if (!res.ok) throw new Error("Failed to add subtask");

      setTitle("");
      setDescription("");

      fetchSubtasks();
    } catch (err) {
      console.error("Create error:", err);
    }
  }

  return (
    <div className="space-y-6">

      {/* ------------ ADD SUBTASK FORM ------------ */}
      <Card className="p-4 rounded-xl border-slate-200">
        <h3 className="font-semibold text-sm mb-3">
          Add Sub Task
        </h3>

        <div className="space-y-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button
            className="bg-indigo-500 text-white"
            onClick={handleCreate}
          >
            Add Sub Task
          </Button>
        </div>
      </Card>

      {/* ------------ SUBTASKS LIST ------------ */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-slate-400" size={26} />
        </div>
      ) : subtasks.length === 0 ? (
        <p className="text-slate-500 text-sm">No sub tasks found.</p>
      ) : (
        <div className="space-y-3">

          {subtasks.map((sub) => (
            <Card
              key={sub.id}
              className="p-4 rounded-xl border-slate-200 flex justify-between items-start"
            >
              <div>
                <p className="font-medium text-slate-700">
                  {sub.title}
                </p>

                <p className="text-slate-500 text-sm">
                  {sub.description}
                </p>
              </div>

              {/* View Button */}
              <button
                onClick={() => setViewSubtask(sub)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <Eye size={16} className="text-gray-600" />
              </button>

            </Card>
          ))}

        </div>
      )}

      {/* ------------ VIEW SUBTASK MODAL ------------ */}
      {viewSubtask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <Card className="w-[420px] p-6 rounded-xl">

            <h3 className="text-lg font-semibold mb-4">
              Sub Task Details
            </h3>

            <div className="space-y-3 text-sm">

              <div>
                <p className="text-slate-500">Title</p>
                <p className="font-medium">{viewSubtask.title}</p>
              </div>

              <div>
                <p className="text-slate-500">Description</p>
                <p className="font-medium">
                  {viewSubtask.description || "--"}
                </p>
              </div>

            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setViewSubtask(null)}
              >
                Close
              </Button>
            </div>

          </Card>

        </div>
      )}

    </div>
  );
}
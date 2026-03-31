"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Settings,
  Trash2,
  X,
  Upload,
  MessageCircle,
} from "lucide-react";
import DiscussionDetailPage from "./DiscussionDetailPage";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

/* ================= TYPES ================= */
type DiscussionCategory = {
  id: number;
  categoryName: string;
  colorCode: string;
};

type DiscussionRoom = {
  id: number;
  title: string;
  messageCount: number | null;
  createdAt: string;
  updatedAt: string;
  category: DiscussionCategory;
  createdByUser?: {
    name: string;
    profileUrl?: string;
  };
  lastMessage?: {
    messageType: "TEXT" | "FILE";
    content?: string;
    fileUrl?: string;
    createdAt?: string;
  } | null;
};

export default function DiscussionSection({
  projectId,
}: {
  projectId: number;
}) {
  /* ================= STATE ================= */
  const [categories, setCategories] = useState<DiscussionCategory[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [openRoomId, setOpenRoomId] = useState<number | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    categoryName: "",
    colorCode: "",
  });

  const [discussionForm, setDiscussionForm] = useState({
    categoryId: "",
    title: "",
    initialMessage: "",
    file: null as File | null,
  });

  /* ================= HELPERS ================= */
  const formatRepliedAt = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("en-GB");
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `replied at ${date} | ${time}`;
  };

  /* ================= LOAD CATEGORIES ================= */
  const loadCategories = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/projects/discussion-categories`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  };

  /* ================= LOAD DISCUSSIONS ================= */
  const loadDiscussions = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${BASE_URL}/api/projects/${projectId}/discussion-rooms`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      const data = await res.json();
      setDiscussions(Array.isArray(data) ? data : []);
    } catch {
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadDiscussions();
  }, []);

  /* ================= CREATE / DELETE ================= */
  const createCategory = async () => {
    if (!categoryForm.categoryName || !categoryForm.colorCode) return;

    const res = await fetch(
      `${BASE_URL}/api/projects/discussion-categories`,
      {
        method: "POST",
        // headers: {
        //   Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        //   "Content-Type": "application/json",
        // },


        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },

        body: JSON.stringify(categoryForm),
      }
    );

    const data = await res.json();
    setCategories((p) => [...p, data]);
    setCategoryForm({ categoryName: "", colorCode: "" });
    setShowCategoryModal(false);
  };

  const deleteCategory = async (categoryId: number) => {
    await fetch(
      `${BASE_URL}/api/projects/discussion-categories/${categoryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
    loadCategories();
  };

  const createDiscussion = async () => {
    if (
      !discussionForm.categoryId ||
      !discussionForm.title ||
      !discussionForm.initialMessage
    )
      return;

    const fd = new FormData();
    fd.append("title", discussionForm.title);
    fd.append("categoryId", discussionForm.categoryId);
    fd.append("initialMessage", discussionForm.initialMessage);
    if (discussionForm.file) fd.append("initialFile", discussionForm.file);

    await fetch(
      `${BASE_URL}/api/projects/${projectId}/discussion-rooms`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: fd,
      }
    );

    setDiscussionForm({
      categoryId: "",
      title: "",
      initialMessage: "",
      file: null,
    });

    setShowDiscussionModal(false);
    loadDiscussions();
  };

  const deleteDiscussion = async (roomId: number) => {
    await fetch(
      `${BASE_URL}/api/projects/${projectId}/discussion-rooms/${roomId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
    loadDiscussions();
  };

  return (
    <div>
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Discussion</h3>

        {/* <div className="flex gap-2">
          <button
            onClick={() => setShowDiscussionModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
          >
            <Plus size={16} />
            New Discussion
          </button>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 border border-blue-500 text-blue-600 px-3 py-1.5 rounded text-sm"
          >
            <Settings size={16} />
            Discussion Category
          </button>
        </div> */}



<div className="flex gap-2">
  {loading ? (
    <>
      <Skeleton width={150} height={30} />
      <Skeleton width={180} height={30} />
    </>
  ) : (
    <>
      <button
        onClick={() => setShowDiscussionModal(true)}
        className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm"
      >
        <Plus size={16} />
        New Discussion
      </button>

      <button
        onClick={() => setShowCategoryModal(true)}
        className="flex items-center gap-2 border border-blue-500 text-blue-600 px-3 py-1.5 rounded text-sm"
      >
        <Settings size={16} />
        Discussion Category
      </button>
    </>
  )}
</div>




      </div>

      {/* ================= DISCUSSION LIST ================= */}
      {/* {discussions.map((d) => { */}


{loading ? (
  Array.from({ length: 5 }).map((_, i) => (
    <div
      key={i}
      className="border rounded-md p-4 mb-3 flex justify-between items-center"
    >
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <Skeleton circle width={40} height={40} />

        <div className="space-y-2">
          <Skeleton width={200} height={14} />
          <Skeleton width={150} height={10} />
          <Skeleton width={250} height={12} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Skeleton width={40} height={12} />
        <Skeleton width={80} height={12} />
        <Skeleton width={20} height={20} />
      </div>
    </div>
  ))
) : discussions.length === 0 ? (
  <div className="border rounded-md p-4 text-gray-400 text-center">
    Team discussion will appear here
  </div>
) : (
  discussions.map((d) => {

        const repliedAt =
          d.lastMessage?.createdAt || d.updatedAt || d.createdAt;

        return (
          <div
            key={d.id}
            onClick={() => setOpenRoomId(d.id)}
            className="border rounded-md p-4 mb-3 flex justify-between items-center cursor-pointer"
          >
            <div className="flex gap-3 items-start">
              <img
                src={d.createdByUser?.profileUrl || "/avatar.png"}
                className="h-10 w-10 rounded-full"
              />

              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-gray-400">
                  {formatRepliedAt(repliedAt)}
                </p>

                {/* {d.lastMessage?.messageType === "FILE" && (
                  <img
                    src={d.lastMessage.fileUrl}
                    className="h-16 mt-2 rounded"
                  />
                )} */}



{loading ? (
  <Skeleton width={100} height={60} />
) : (
  d.lastMessage?.messageType === "FILE" && (
    <img
      src={d.lastMessage.fileUrl}
      className="h-16 mt-2 rounded"
    />
  )
)}



                {d.lastMessage?.messageType === "TEXT" && (
                  <p className="text-sm text-gray-500">
                    {d.lastMessage.content}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MessageCircle size={14} />
                {d.messageCount ?? 0}
              </span>

              <span className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: d.category.colorCode }}
                />
                {d.category.categoryName}
              </span>

              <Trash2
                size={16}
                className="text-red-500 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDiscussion(d.id);
                }}
              />
            </div>
          </div>
        );
      }))}


    



      {/* {discussions.length === 0 && (
        <div className="border rounded-md p-4 text-gray-400 text-center">
          Team discussion will appear here
        </div>
      )} */}

      {/* ================= NEW DISCUSSION MODAL ================= */}
      {showDiscussionModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[700px] p-6">
            <div className="flex justify-between mb-4">
              <h4 className="font-medium text-lg">New Discussion</h4>
              <X
                className="cursor-pointer"
                onClick={() => setShowDiscussionModal(false)}
              />
            </div>

            <select
              value={discussionForm.categoryId}
              onChange={(e) =>
                setDiscussionForm({
                  ...discussionForm,
                  categoryId: e.target.value,
                })
              }
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName}
                </option>
              ))}
            </select>

            <input
              placeholder="Title"
              value={discussionForm.title}
              onChange={(e) =>
                setDiscussionForm({
                  ...discussionForm,
                  title: e.target.value,
                })
              }
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
            />

            <textarea
              placeholder="Reply"
              value={discussionForm.initialMessage}
              onChange={(e) =>
                setDiscussionForm({
                  ...discussionForm,
                  initialMessage: e.target.value,
                })
              }
              className="border rounded px-3 py-2 w-full mb-4 text-sm min-h-[100px]"
            />

            <label className="border border-dashed rounded flex flex-col items-center justify-center py-6 cursor-pointer text-gray-400 mb-4">
              <Upload />
              <span className="text-sm mt-2">Choose a file</span>
              <input
                type="file"
                hidden
                onChange={(e) =>
                  setDiscussionForm({
                    ...discussionForm,
                    file: e.target.files?.[0] || null,
                  })
                }
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDiscussionModal(false)}
                className="border px-6 py-2 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createDiscussion}
                className="bg-blue-600 text-white px-6 py-2 rounded text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CATEGORY MODAL ================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] p-5">
            <div className="flex justify-between mb-4">
              <h4 className="font-medium">Discussion Category</h4>
              <X
                className="cursor-pointer"
                onClick={() => setShowCategoryModal(false)}
              />
            </div>

            {categories.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center border-b py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: c.colorCode }}
                  />
                  {c.categoryName}
                </div>
                <Trash2
                  size={14}
                  className="text-red-500 cursor-pointer"
                  onClick={() => deleteCategory(c.id)}
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                placeholder="Category Name"
                value={categoryForm.categoryName}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    categoryName: e.target.value,
                  })
                }
                className="border rounded px-3 py-2 text-sm"
              />
              <input
                placeholder="#3498db"
                value={categoryForm.colorCode}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    colorCode: e.target.value,
                  })
                }
                className="border rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="border px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createCategory}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DISCUSSION DETAIL FULL SCREEN ================= */}
      {openRoomId && (
        <DiscussionDetailPage
          projectId={projectId}
          roomId={openRoomId}
          onClose={() => setOpenRoomId(null)}
        />
      )}
    </div>
  );
}

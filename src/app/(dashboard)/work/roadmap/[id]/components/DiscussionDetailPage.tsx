


"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  MoreVertical,
  Upload,
  FileText,
  Edit2,
  CheckCircle,
  Trash2,
  Eye,
  Download,
} from "lucide-react";

/* =================== WEBSOCKET IMPORTS (ADDED) =================== */
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
/* ================================================================= */

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

/* ================= TYPES ================= */
type MessageItem = {
  id: number;
  content?: string;
  messageType: "TEXT" | "FILE";
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  createdAt: string;
  sender?: {
    employeeId?: string;
    name: string;
    profileUrl?: string;
  };
  isBestReply?: boolean;
};

type DiscussionDetail = {
  id: number;
  title: string;
  createdAt: string;
  category: {
    categoryName: string;
    colorCode: string;
  };
};

export default function DiscussionDetailPage({
  projectId,
  roomId,
  onClose,
}: {
  projectId: number;
  roomId: number;
  onClose?: () => void;
}) {
  /* ================= STATE ================= */
  const [detail, setDetail] = useState<DiscussionDetail | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [reply, setReply] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [editMessage, setEditMessage] = useState<MessageItem | null>(null);
  const [editContent, setEditContent] = useState("");

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openFileMenuId, setOpenFileMenuId] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* =================== WEBSOCKET REF (ADDED) =================== */
  const stompClientRef = useRef<Client | null>(null);
  /* ============================================================= */

  const currentEmployeeId =
    typeof window !== "undefined"
      ? localStorage.getItem("employeeId")
      : null;

  /* ================= HELPERS ================= */
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-GB")} | ${d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const isImage = (mime?: string | null) => mime?.startsWith("image/");

  const downloadFile = (url?: string | null, name?: string | null) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /* ================= LOADERS ================= */
  const loadDiscussionDetail = async () => {
    const res = await fetch(
      `${BASE_URL}/api/projects/${projectId}/discussion-rooms/${roomId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
    setDetail(await res.json());
  };

  const loadMessages = async () => {
    const res = await fetch(
      `${BASE_URL}/api/projects/discussion-rooms/${roomId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    const data: MessageItem[] = await res.json();

    data.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );

    setMessages(data);
  };

  /* =================== INITIAL LOAD =================== */
  useEffect(() => {
    loadDiscussionDetail();
    loadMessages();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =================== WEBSOCKET CONNECTION (ADDED) =================== */
  useEffect(() => {
    const socket = new SockJS(`${BASE_URL}/ws-discussion`);

//console.log("dc",socket)

    const client = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      onConnect: () => {
        client.subscribe(
          `/topic/discussion-rooms/${roomId}`,
          (message) => {
            const payload: MessageItem = JSON.parse(message.body);

            setMessages((prev) => {
              const exists = prev.some((m) => m.id === payload.id);
              if (exists) return prev;
              return [...prev, payload];
            });
          }
        );
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [roomId]);
  /* =================================================================== */



/* ================= SEND REPLY ================= */
  const sendReply = async () => {
    if (!reply && !file) return;

    const fd = new FormData();
    if (reply) fd.append("content", reply);
    if (file) fd.append("file", file);
    fd.append("parentMessageId", "");

    await fetch(
      `${BASE_URL}/api/projects/discussion-rooms/${roomId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: fd,
      }
    );

    setReply("");
    setFile(null);
    loadMessages();
  };






  /* ================= UPDATE MESSAGE ================= */
  const updateMessage = async () => {
    if (!editMessage) return;

    await fetch(
      `${BASE_URL}/api/projects/discussion-rooms/${roomId}/messages/${editMessage.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "text/plain",
        },
        body: editContent,
      }
    );

    setEditMessage(null);
    setEditContent("");
  };

  /* ================= DELETE ================= */
  const deleteMessage = async (id: number) => {
    setOpenMenuId(null);
    await fetch(
      `${BASE_URL}/api/projects/discussion-rooms/${roomId}/messages/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
  };

  /* ================= BEST / UNBEST ================= */
  const toggleBestReply = async (message: MessageItem) => {
    setOpenMenuId(null);

    const alreadyBest = messages.find(
      (m) => m.isBestReply && m.id !== message.id
    );

    if (!message.isBestReply && alreadyBest) {
      alert("Please unmark the current Best Reply first.");
      return;
    }

    const endpoint = message.isBestReply
      ? "unmark-best-reply"
      : "mark-best-reply";

    await fetch(
      `${BASE_URL}/api/projects/discussion-rooms/${roomId}/messages/${message.id}/${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );
  };

  if (!detail) return null;

  /* ================= UI (UNCHANGED BELOW) ================= */

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 border-b">
        <h3 className="text-lg font-medium">Discussion</h3>
        <X className="cursor-pointer" onClick={onClose} />
      </div>

      {/* TITLE */}
      <div className="px-6 py-4 border-b">
        <h2 className="font-medium text-lg">{detail.title}</h2>
        <p className="text-sm text-gray-400">
          Requested On {formatTime(detail.createdAt)}
        </p>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((m, index) => {
          const isInitialMessage = index === 0;
          const isOwnMessage =
            m.sender?.employeeId === currentEmployeeId;

          return (
            <div key={m.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <img
                    src={m.sender?.profileUrl || "/avatar.png"}
                    className="h-9 w-9 rounded-full"
                  />

                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.sender?.name}</p>
                      {m.isBestReply && (
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                          Best Reply
                        </span>
                      )}
                    </div>

                    {m.messageType === "TEXT" && (
                      <p className="text-sm text-gray-600 mt-1">
                        {m.content}
                      </p>
                    )}

                    {m.messageType === "FILE" && m.fileUrl && (
                      <div className="relative mt-2 border rounded p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isImage(m.mimeType) ? (
                            <img
                              src={m.fileUrl}
                              className="h-16 w-16 rounded object-cover"
                            />
                          ) : (
                            <FileText size={32} />
                          )}
                          <span className="text-sm">{m.fileName}</span>
                        </div>

                        <MoreVertical
                          size={16}
                          className="cursor-pointer"
                          onClick={() =>
                            setOpenFileMenuId(
                              openFileMenuId === m.id ? null : m.id
                            )
                          }
                        />

                        {openFileMenuId === m.id && (
                          <div className="absolute right-2 top-10 bg-white border rounded shadow w-40 z-50">
                            <button
                              onClick={() => {
                                window.open(m.fileUrl!, "_blank");
                                setOpenFileMenuId(null);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
                            >
                              <Eye size={14} />
                              View
                            </button>

                            <button
                              onClick={() => {
                                downloadFile(m.fileUrl, m.fileName);
                                setOpenFileMenuId(null);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
                            >
                              <Download size={14} />
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* MESSAGE ACTIONS (EDIT / BEST / DELETE) */}
                <div className="relative flex items-center gap-3 text-xs text-gray-400">
                  {formatTime(m.createdAt)}

                  {isInitialMessage && isOwnMessage && (
                    <button
                      onClick={() => {
                        setEditMessage(m);
                        setEditContent(m.content || "");
                      }}
                      className="flex items-center gap-1 border px-3 py-1 rounded"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                  )}

                  {!isInitialMessage && (
                    <>
                      <MoreVertical
                        size={16}
                        className="cursor-pointer"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === m.id ? null : m.id
                          )
                        }
                      />

                      {openMenuId === m.id && (
                        <div className="absolute right-0 top-6 bg-white border rounded shadow w-56 z-50">
                          {isOwnMessage && (
                            <button
                              onClick={() => {
                                setEditMessage(m);
                                setEditContent(m.content || "");
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                          )}

                          <button
                            onClick={() => toggleBestReply(m)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 w-full"
                          >
                            <CheckCircle size={14} />
                            {m.isBestReply
                              ? "Unmark Best Reply"
                              : "Mark as Best Reply"}
                          </button>

                          <button
                            onClick={() => deleteMessage(m.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* REPLY BOX */}
      <div className="border-t px-6 py-4">

                  <h1>Reply *</h1>

        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="border rounded px-3 py-2 w-full mb-3 min-h-[80px]"
        />

 <h1>Add File *</h1>
        <label className="border border-dashed rounded flex flex-col items-center py-6 cursor-pointer text-gray-400 mb-4">
          <Upload />
          <span className="text-sm mt-2">
            {file ? file.name : "Choose a file"}
          </span>
          <input
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <div className="flex justify-end">
          <button
            onClick={sendReply}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Reply
          </button>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editMessage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[500px] rounded p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Update Reply</h3>
              <X
                className="cursor-pointer"
                onClick={() => setEditMessage(null)}
              />
            </div>

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="border rounded w-full p-3 min-h-[100px]"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditMessage(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={updateMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
















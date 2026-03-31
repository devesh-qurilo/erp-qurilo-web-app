// components/ChatWindow.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import ChatInput from "./ChatInput";


import SockJS from "sockjs-client";
import { Client, Frame, IMessage } from "@stomp/stompjs";

interface Message {
  id: number;
  chatRoomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: "TEXT" | "FILE";
  fileAttachment: { fileName: string; fileUrl: string } | null;
  status: string;
  createdAt: string;
  deletedForCurrentUser: boolean;
  senderDetails?: {
    employeeId: string;
    name?: string | null;
    profileUrl?: string | null;
    designation?: string | null;
    department?: string | null;
  } | null;
  receiverDetails?: {
    employeeId: string;
    name?: string | null;
    profileUrl?: string | null;
    designation?: string | null;
    department?: string | null;
  } | null;
}

interface ChatWindowProps {
  chatRoomId: string;
  employeeid: string;
  receiverId: string;
}

// === Update this constant if the base URL changes ===
const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

const fetcher = async (url: string) => {
  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const res = await fetch(url, {
      headers,
      // credentials: "include", // ✅ REQUIRED
      // cache: "no-store",
    });
    if (!res.ok) {
      const contentType = res.headers.get("content-type") || "";
      const errBody = contentType.includes("application/json")
        ? await res.json().catch(() => ({}))
        : await res.text().catch(() => "");
      const message =
        (errBody &&
          typeof errBody === "object" &&
          (errBody.error || errBody.message)) ||
        errBody ||
        `Failed to fetch (${res.status})`;
      throw new Error(message);
    }
    return res.json();
  } catch (err) {
    // normalize error
    if (err instanceof Error) throw err;
    throw new Error(String(err));
  }
};

export default function ChatWindow({
  chatRoomId,
  employeeid,
  receiverId,
}: ChatWindowProps) {
  const [currentUserId, setCurrentUserId] = useState(employeeid || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // message action menu state (which message id has menu open)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!employeeid && typeof window !== "undefined") {
      const fromLS = localStorage.getItem("employeeId");
      if (fromLS) setCurrentUserId(fromLS);
    } else if (employeeid) {
      setCurrentUserId(employeeid);
    }
  }, [employeeid]);

  const historyUrl = receiverId
    ? `${process.env.NEXT_PUBLIC_MAIN}/api/chat/history/${encodeURIComponent(
      receiverId
    )}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<Message[]>(
    historyUrl,
    fetcher,
    { revalidateOnFocus: true }
  );

  const messages = data || [];

  // receiver details: prefer explicit receiver info from messages, fallback to first message sender
  const receiverDetails =
    messages.length > 0
      ? messages.find((m) => m.receiverDetails?.employeeId === receiverId)
        ?.receiverDetails ||
      messages[0]?.senderDetails ||
      null
      : null;

  // Auto-scroll on new messages (including when STOMP pushes new items)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Optimistic update when new message sent
  const handleMessageSent = (newMessage: Message) => {
    mutate((prev) => (prev ? [...prev, newMessage] : [newMessage]), false);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // -------------------------
  // STOMP over SockJS section (kept if you are using it)
  // -------------------------
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !receiverId) return;

    const wsUrl = `${BASE_URL.replace(/\/$/, "")}/ws-chat`;
    const token = localStorage.getItem("accessToken") || "";

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : "",
        roomId: chatRoomId,
        receiverId: receiverId,
      },
      onConnect: (frame: Frame) => {
        try {
          client.subscribe(`/topic/chat.${chatRoomId}`, (msg: IMessage) => {
            try {
              const body = msg.body;
              if (!body) return;
              const payload = JSON.parse(body);
              if (payload && payload.type === "message" && payload.data) {
                const incoming: Message = payload.data;
                mutate((prev) => {
                  const already =
                    prev && prev.some((m) => m.id === incoming.id);
                  return already
                    ? prev
                    : prev
                      ? [...prev, incoming]
                      : [incoming];
                }, false);
              } else if (payload && payload.id) {
                const incoming: Message = payload;
                mutate(
                  (prev) =>
                    prev && prev.some((m) => m.id === incoming.id)
                      ? prev
                      : prev
                        ? [...prev, incoming]
                        : [incoming],
                  false
                );
              }
            } catch (e) {
              console.error("Error parsing topic message", e);
            }
          });
        } catch (e) { }

        try {
          client.subscribe(`/user/queue/messages`, (msg: IMessage) => {
            try {
              const payload = JSON.parse(msg.body);
              if (!payload) return;
              if (payload.type === "message" && payload.data) {
                const incoming: Message = payload.data;
                mutate((prev) => {
                  const already =
                    prev && prev.some((m) => m.id === incoming.id);
                  return already
                    ? prev
                    : prev
                      ? [...prev, incoming]
                      : [incoming];
                }, false);
              } else if (payload.id) {
                const incoming: Message = payload;
                mutate(
                  (prev) =>
                    prev && prev.some((m) => m.id === incoming.id)
                      ? prev
                      : prev
                        ? [...prev, incoming]
                        : [incoming],
                  false
                );
              }
            } catch (e) {
              console.error("Error parsing user queue message", e);
            }
          });
        } catch (e) { }

        try {
          client.subscribe(
            `/topic/chat.${chatRoomId}.deleted`,
            (msg: IMessage) => {
              try {
                const payload = JSON.parse(msg.body);
                const messageId = payload?.messageId ?? payload?.id;
                if (messageId != null) {
                  mutate(
                    (prev) =>
                      prev
                        ? prev.map((m) =>
                          m.id === messageId
                            ? { ...m, deletedForCurrentUser: true }
                            : m
                        )
                        : prev,
                    false
                  );
                }
              } catch (e) {
                console.error("Error parsing deleted event", e);
              }
            }
          );
        } catch (e) { }
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      try {
        if (stompClientRef.current) {
          stompClientRef.current.deactivate();
          stompClientRef.current = null;
        }
      } catch (e) { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverId, chatRoomId, mutate]);

  // Delete flow: mark deletedForCurrentUser true on success
  const deleteMessage = async (messageId: number) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    setDeleting(true);

    // optimistic update: mark deletedForCurrentUser for this user
    mutate(
      (prev) =>
        prev
          ? prev.map((m) =>
            m.id === messageId ? { ...m, deletedForCurrentUser: true } : m
          )
          : prev,
      false
    );

    try {
      const url = `${BASE_URL}/api/chat/message/${encodeURIComponent(
        String(messageId)
      )}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        // revert optimistic update on failure by revalidating
        await mutate();
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to delete message (${res.status})`);
      }

      // revalidate to get canonical state from server
      await mutate();
    } catch (err) {
      console.error("Delete message error:", err);
      // revalidate to get latest server state (revert optimistic)
      await mutate();
    } finally {
      setDeleting(false);
      setOpenMenuId(null);
      setConfirmDeleteId(null);
    }
  };

  // Click handler for message bubble -> toggles action menu
  const handleBubbleClick = (messageId: number) => {
    // toggle open/close
    setOpenMenuId((prev) => (prev === messageId ? null : messageId));
    // reset any pending confirm
    setConfirmDeleteId(null);
  };

  // Render file attachment UI (image thumbnail or file card)
  const Attachment = ({
    attachment,
    isMine,
  }: {
    attachment: { fileName: string; fileUrl: string } | null;
    isMine: boolean;
  }) => {
    if (!attachment) return null;
    const image = isImageFilename(attachment.fileName);

    if (image) {
      return (
        <a
          href={attachment.fileUrl}
          download={attachment.fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-30  mt-2 rounded-md overflow-hidden border border-border"
        >
          {/* next/image requires width/height; using fixed height and letting width auto via css */}
          <div className="relative w-full h-48">
            <Image
              src={attachment.fileUrl}
              alt={attachment.fileName}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>
        </a>
      );
    }

    // non-image file card
    return (
      <div
        className={`mt-2 flex items-center gap-3 p-3 rounded-md border ${isMine ? "bg-primary/5 border-primary/40" : "bg-white border-border"
          }`}
      >
        <div className="flex-none w-10 h-10 rounded-md flex items-center justify-center bg-muted">
          {/* simple paperclip/file icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 014.95 4.95L9.9 17.36a1.5 1.5 0 01-2.12-2.12l8.49-8.49"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <a
            href={attachment.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-medium"
          >
            {attachment.fileName}
          </a>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            Click to download / open
          </p>
        </div>
      </div>
    );
  };

  const isImageFilename = (filename?: string | null) => {
    if (!filename) return false;
    return /\.(png|jpe?g|gif|webp|svg|bmp|tiff)$/i.test(filename);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-white">
      {/* Header: rounded card-like, avatar as rounded square, name + two small lines */}
      {receiverDetails && (
        <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-border">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
            <Image
              src={
                receiverDetails?.profileUrl ??
                "/placeholder.svg?height=64&width=64&query=User%20avatar"
              }
              alt={receiverDetails?.name ?? "User"}
              width={56}
              height={56}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {receiverDetails?.name ?? "Unknown"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {receiverDetails?.designation || "No designation"}
            </p>
            <p className="text-sm text-muted-foreground">
              {receiverDetails?.department || "No department"}
            </p>
          </div>
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[rgba(250,250,250,0.8)]">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;

          if (msg.deletedForCurrentUser) {
            // Deleted placeholder
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isMine ? "justify-end" : "justify-start"
                  }`}
              >
                {!isMine && (
                  <Image
                    src={
                      msg.senderDetails?.profileUrl ??
                      "/placeholder.svg?height=32&width=32&query=User%20avatar"
                    }
                    alt={msg.senderDetails?.name ?? "Unknown"}
                    width={32}
                    height={32}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                <div className="px-3 py-2 rounded-xl max-w-xs bg-muted italic text-muted-foreground">
                  This message was deleted
                </div>
              </div>
            );
          }

          const bubbleClasses = isMine
            ? "bg-primary text-primary-foreground"
            : "bg-white border border-border text-foreground";

          return (
            <div
              key={msg.id}
              className={`relative flex items-start gap-3 ${isMine ? "justify-end" : "justify-start"
                }`}
            >
              {!isMine && (
                <Image
                  src={
                    msg.senderDetails?.profileUrl ??
                    "/placeholder.svg?height=32&width=32&query=User%20avatar"
                  }
                  alt={msg.senderDetails?.name ?? "Unknown"}
                  width={32}
                  height={32}
                  className="rounded-full"
                  unoptimized
                />
              )}

              <div
                className={`px-4 py-3 rounded-2xl max-w-[75%] break-words ${bubbleClasses}`}
                onClick={() => handleBubbleClick(msg.id)}
              >
                {/* Message text */}
                {msg.content && (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Attachment preview */}
                {msg.fileAttachment && (
                  <Attachment attachment={msg.fileAttachment} isMine={isMine} />
                )}

                <div
                  className={`text-[11px] mt-1 ${isMine
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                    }`}
                >
                  <span>{formatTime(msg.createdAt)}</span>
                </div>
              </div>

              {/* Action menu */}
              {openMenuId === msg.id && (
                <div className="absolute top-0 transform -translate-y-full right-0 z-20">
                  <div className="bg-white border border-border rounded-md shadow-sm py-2 w-36">
                    {/* Confirm step */}
                    {confirmDeleteId === msg.id ? (
                      <div className="px-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          Are you sure?
                        </p>
                        <div className="flex gap-2">
                          <button
                            className="flex-1 px-2 py-1 rounded-md border text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                              setOpenMenuId(null);
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="flex-1 px-2 py-1 rounded-md bg-destructive text-white text-sm disabled:opacity-60"
                            disabled={deleting}
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteMessage(msg.id);
                            }}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-2">
                        {/* Delete option available to both sender and receiver */}
                        <button
                          className="w-full text-left px-2 py-2 text-sm hover:bg-muted rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(msg.id);
                          }}
                        >
                          Delete
                        </button>
                        {/* Future actions can be added here (Reply, Forward, etc.) */}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input (kept identical in behavior) */}
      <ChatInput
        chatRoomId={chatRoomId}
        senderId={currentUserId}
        receiverId={receiverId}
        onMessageSent={handleMessageSent}
      />
    </div>
  );
}

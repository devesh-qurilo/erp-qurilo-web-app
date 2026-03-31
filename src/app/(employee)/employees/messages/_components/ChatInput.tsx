
"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export default function ChatInput({
  chatRoomId,
  senderId,
  receiverId,
  onMessageSent,
}: {
  chatRoomId: string
  senderId: string
  receiverId: string
  onMessageSent?: (message: any) => void
}) {
  const [message, setMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // BASE_URL for file uploads (from your message)
  const BASE_URL =  `${process.env.NEXT_PUBLIC_MAIN}`

  // Helper: detect images
  const isImageFilename = (name?: string | null) => {
    if (!name) return false
    return /\.(png|jpe?g|gif|webp|svg|bmp|tiff)$/i.test(name)
  }

  // When file selected, store and create preview if image
  useEffect(() => {
    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      return
    }

    // create preview for images
    if (isImageFilename(file.name)) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      // non-image -> no preview image, but we can show filename
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const clearFile = () => {
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl)
      } catch {}
      setPreviewUrl(null)
    }
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message && !file) return

    try {
      setLoading(true)

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

      // Build multipart/form-data so backend gets fileAttachment inside the message
      const form = new FormData()
      form.append("chatRoomId", chatRoomId)
      form.append("senderId", senderId)
      form.append("receiverId", receiverId)

      // content: send empty string if none (server often treats missing vs empty differently)
      if (message && message.trim().length > 0) {
        form.append("content", message.trim())
      } else {
        // you can choose to omit this if your server expects null — keeping empty string is safe in many setups
        form.append("content", "")
      }

      // messageType: IMAGE for images, FILE for other files, TEXT if no file
      const messageType = file ? (isImageFilename(file.name) ? "IMAGE" : "FILE") : "TEXT"
      form.append("messageType", messageType)

      // optional status field (your previous code used 'SENT')
      form.append("status", "SENT")

      // Append file if present. Field name is "file" — change if your backend expects a different name.
      if (file) {
        form.append("file", file, file.name)
      }

      const res = await fetch(`${BASE_URL}/api/chat/send`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form, // browser will set correct multipart boundary
      })

      // parse response robustly
      const rawText = await res.text()
      let data: any
      try {
        data = rawText ? JSON.parse(rawText) : null
      } catch {
        data = rawText
      }

      if (!res.ok) {
        console.error("Send message error details:", data)
        const messageFromServer =
          typeof data === "object" && data !== null ? data.error || data.message : String(data || "")
        throw new Error(messageFromServer || `Failed to send (${res.status})`)
      }

      // success: notify parent (ChatWindow) so it will mutate/sync
      onMessageSent?.(data)

      // reset UI (keep everything else same)
      setMessage("")
      clearFile()
    } catch (err) {
      console.error("Send message failed:", err)
      // you can add UI toast here if desired
    } finally {
      setLoading(false)
    }
  }

  // Enter to send (Shift+Enter for newline) — optional behavior for text input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if ((message && message.trim()) || file) {
        // trigger form submit
        const form = (e.target as HTMLElement).closest("form")
        if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }))
      }
    }
  }

  return (
    <form
      onSubmit={handleSendMessage}
      className="flex flex-col gap-3 px-6 py-4 border-t border-gray-200 bg-white"
    >
      {/* Preview: WhatsApp-like */}
      {file && (
        <div className="flex items-start gap-3">
          {isImageFilename(file.name) && previewUrl ? (
            <div className="relative w-30 h-20 rounded-md overflow-hidden border">
              {/* use next/image with object URL (unoptimized) */}
              <Image src={previewUrl} alt={file.name} fill style={{ objectFit: "cover" }} unoptimized />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-md border w-full">
              <div className="flex-none w-10 h-10 rounded-md flex items-center justify-center bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 014.95 4.95L9.9 17.36a1.5 1.5 0 01-2.12-2.12l8.49-8.49" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
              <button type="button" className="text-sm text-destructive px-2" onClick={clearFile}>Remove</button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Upload file button */}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="chat-file-input"
            accept="image/*,application/pdf,application/msword,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.zip,.txt"
          />
          <label
            htmlFor="chat-file-input"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 border border-primary text-primary hover:bg-primary/5 cursor-pointer select-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.172 6.172a4 4 0 105.656 5.656L21 13.828a6 6 0 10-8.485-8.486L9.172 8.686" />
            </svg>
            <span className="text-sm">Upload File</span>
          </label>
          {/* show selected file name (small) */}
          {file ? <span className="text-xs text-gray-500 truncate max-w-[120px]">{file.name}</span> : null}
        </div>

        {/* Message input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your message here"
          className="flex-1 rounded-md border border-gray-200 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={loading}
          className="ml-auto inline-flex items-center justify-center px-5 py-2 rounded-md bg-primary text-white text-sm disabled:opacity-60 hover:brightness-95"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  )
}



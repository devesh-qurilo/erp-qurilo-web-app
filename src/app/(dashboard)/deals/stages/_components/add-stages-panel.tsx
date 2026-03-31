
"use client"

import React, { useState } from "react"

export default function AddStagePanel({
  onCreated,
  getToken,
}: {
  onCreated?: () => Promise<void> | void
  getToken: () => string | null
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setError(null)
    const token = getToken()
    if (!token) {
      setError("No access token found. Please log in.")
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch("/api/deals/stages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || "Failed to create stage")
      }
      setName("")
      setOpen(false)
      await onCreated?.()
    } catch (err: any) {
      setError(err?.message ?? "Failed to create stage")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      {/* Toggle button when modal closed */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-blue-600 px-2 py-2 text-white hover:opacity-95"
        >
          + Add Stage
        </button>
      ) : null}

      {/* Fullscreen slide-over modal */}
      {open && (
        <div
          aria-modal="true"
          role="dialog"
          className="fixed inset-0 z-50 flex items-start justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!submitting) {
                setOpen(false)
                setError(null)
                setName("")
              }
            }}
          />

          {/* Panel */}
          <div className="relative mt-8 w-[820px] max-w-[95%] rounded-lg bg-white shadow-xl ring-1 ring-black/5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-800">Add New Deal Stage</h3>
              <button
                aria-label="Close"
                onClick={() => {
                  if (!submitting) {
                    setOpen(false)
                    setError(null)
                    setName("")
                  }
                }}
                className="text-slate-400 hover:text-slate-600 rounded-md p-1"
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>×</span>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="rounded-md border border-gray-200 p-4 bg-gray-50">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Deal Stage <span className="text-destructive">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="--"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Error */}
              {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

              {/* Footer buttons (centered) */}
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (submitting) return
                    setOpen(false)
                    setName("")
                    setError(null)
                  }}
                  className="rounded-md border border-blue-500 px-6 py-2 text-blue-600 hover:bg-blue-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!name || submitting}
                  className="rounded-md bg-blue-600 px-6 py-2 text-white disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

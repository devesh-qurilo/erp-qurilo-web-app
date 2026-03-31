"use client"

import type React from "react"

import { useState } from "react"
import type { Stage } from "@/types/stages"

export default function AddDealPanel({
  stages,
  onCreated,
  getToken,
}: {
  stages: Stage[]
  onCreated?: () => Promise<void> | void
  getToken: () => string | null
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [value, setValue] = useState<number | "">("")
  const [stageName, setStageName] = useState(stages[0]?.name ?? "")
  const [category, setCategory] = useState("")
  const [pipeline, setPipeline] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const token = getToken()
    if (!token) {
      setError("No access token found. Please log in.")
      return
    }
    try {
      setSubmitting(true)
      // NOTE: Assuming /api/deals/create for creating deals.
      const res = await fetch("/api/deals/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          value: typeof value === "number" ? value : Number(value),
          dealStage: stageName,
          dealCategory: category || undefined,
          pipeline: pipeline || undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to create deal")
      // reset
      setTitle("")
      setValue("")
      setStageName(stages[0]?.name ?? "")
      setCategory("")
      setPipeline("")
      setOpen(false)
      await onCreated?.()
    } catch (err: any) {
      setError(err?.message ?? "Failed to create deal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-blue-500 px-3 py-3 text-primary-foreground hover:opacity-90"
        >
         
          {"Add Deal"}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-2 border border-border rounded-md p-2 bg-background"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-[160px] rounded-md border border-border bg-background px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Value"
            type="number"
            min={0}
            className="w-[120px] rounded-md border border-border bg-background px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <select
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-ring"
            required
          >
            {stages.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            className="w-[160px] rounded-md border border-border bg-background px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={pipeline}
            onChange={(e) => setPipeline(e.target.value)}
            placeholder="Pipeline (optional)"
            className="w-[160px] rounded-md border border-border bg-background px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!title || value === "" || submitting}
            className="rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setError(null)
            }}
            className="rounded-md border border-border px-3 py-2 text-foreground"
          >
            {"Cancel"}
          </button>
          {error && <span className="text-sm text-destructive ml-2">{error}</span>}
        </form>
      )}
    </div>
  )
}

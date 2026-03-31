"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"

interface DealTagsProps {
  dealId: string
}

export default function DealTags({ dealId }: DealTagsProps) {
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newTag, setNewTag] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [deletingTag, setDeletingTag] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  const isLoggedIn = !!token

  // -----------------------------------------------------------------
  const fetchTags = useCallback(async () => {
    if (!dealId) {
      setError("Deal ID not found")
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/deals/get/${dealId}/tags`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!res.ok) throw new Error(`Failed to fetch tags: ${res.statusText}`)
      const data = await res.json()
      if (!Array.isArray(data.data)) throw new Error("Invalid data format")
      setTags(data.data)
      setError(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to load tags")
    } finally {
      setLoading(false)
    }
  }, [dealId, token])

  // -----------------------------------------------------------------
  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  // -----------------------------------------------------------------
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const res = await fetch(`/api/deals/get/${dealId}/tags`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagName: newTag.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to add tag")
      }
      const { data } = await res.json()
      setTags(data)
      setNewTag("")
    } catch (err: any) {
      setAddError(err.message || "Could not add tag")
    } finally {
      setAdding(false)
    }
  }

  // -----------------------------------------------------------------
  const handleDeleteTag = async (tag: string) => {
    if (!tag) return
    setDeletingTag(tag)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/deals/get/${dealId}/tags`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagName: tag }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete tag")
      }
      const { data } = await res.json()
      setTags(data)
    } catch (err: any) {
      setDeleteError(err.message || "Could not delete tag")
    } finally {
      setDeletingTag(null)
    }
  }

  // -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Tags</h3>
        <p className="text-sm text-gray-500">Loading tags...</p>
      </div>
    )
  }

  if (error || (!tags.length && !isLoggedIn)) return null

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Tags</h3>

      {/* Tag list */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
          >
            <span>{tag}</span>
            {isLoggedIn && (
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => handleDeleteTag(tag)}
                disabled={deletingTag === tag}
                className="rounded-md px-1.5 py-0.5 bg-blue-200 text-blue-900 hover:bg-blue-300 disabled:opacity-50"
                title="Remove tag"
              >
                {deletingTag === tag ? "…" : "×"}
              </button>
            )}
          </span>
        ))}
        {!tags.length && <span className="text-gray-400 italic">No tags yet</span>}
      </div>

      {/* Add-tag form */}
      {isLoggedIn && (
        <form onSubmit={handleAddTag} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="New tag…"
              className="flex-1 border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={adding}
            />
            <button
              type="submit"
              disabled={adding || !newTag.trim()}
              className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
          {addError && <p className="text-sm text-red-500">{addError}</p>}
          {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
        </form>
      )}
    </div>
  )
}

"use client"

import type React from "react"
import useSWR from "swr"
import { useMemo, useState } from "react"

// Types
interface Comment {
  id: number
  employeeId: string
  commentText: string
  createdAt: string
}

interface DealCommentsProps {
  dealId: string
}

// Helpers
const fetcher = async ([url, token]: [string, string | null]) => {
  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Failed to fetch: ${res.statusText}`)
  }
  return res.json()
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateString
  }
}

export default function DealComments({ dealId }: DealCommentsProps) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null
  const isLoggedIn = !!token

  // SWR data fetch
  const swrKey = useMemo(
    () => (dealId ? ([`/api/deals/get/${dealId}/comments`, token] as [string, string | null]) : null),
    [dealId, token],
  )
  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
  })

  const comments: Comment[] = Array.isArray(data?.data) ? data.data : []

  // Local state for actions
  const [newComment, setNewComment] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    const text = newComment.trim()
    if (!text) return
    setAdding(true)
    setAddError(null)

    // Optimistic update
    const optimistic = [
      ...comments,
      {
        id: -Date.now(),
        employeeId: "You",
        commentText: text,
        createdAt: new Date().toISOString(),
      } as Comment,
    ]

    try {
      await mutate(
        async () => {
          const res = await fetch(`/api/deals/get/${dealId}/comments`, {
            method: "POST",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ commentText: text }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || "Failed to add comment")
          }
          return res.json()
        },
        { optimisticData: { data: optimistic }, rollbackOnError: true, revalidate: true },
      )
      setNewComment("")
    } catch (err: any) {
      setAddError(err.message || "Could not add comment")
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!confirm("Delete this comment?")) return
    setDeletingId(commentId)
    setDeleteError(null)

    const remaining = comments.filter((c) => c.id !== commentId)

    try {
      await mutate(
        async () => {
          const res = await fetch(`/api/deals/get/${dealId}/comments`, {
            method: "DELETE",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ commentId }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || "Failed to delete comment")
          }
          return res.json()
        },
        { optimisticData: { data: remaining }, rollbackOnError: true, revalidate: true },
      )
    } catch (err: any) {
      setDeleteError(err.message || "Could not delete comment")
    } finally {
      setDeletingId(null)
    }
  }

  // UI
  if (isLoading) {
    return (
      <section aria-busy="true" className="rounded-2xl border bg-card text-card-foreground p-6">
        <h3 className="text-base font-semibold mb-4 text-pretty">Comments</h3>
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border bg-card text-card-foreground p-6">
        <h3 className="text-base font-semibold mb-4 text-pretty">Comments</h3>
        <p role="alert" className="text-sm text-destructive">
          {(error as Error).message || "Failed to load comments"}
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border bg-card text-card-foreground p-6">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-pretty">
          Comments {comments.length > 0 ? `(${comments.length})` : ""}
        </h3>
      </header>

      <div className="space-y-3 mb-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="relative rounded-lg border bg-background p-4 transition-shadow hover:shadow-sm"
              aria-label="Comment"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-sm font-medium text-primary">{comment.employeeId}</span>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={comment.createdAt}
                  aria-label={`Posted on ${formatDate(comment.createdAt)}`}
                  title={formatDate(comment.createdAt)}
                >
                  {formatDate(comment.createdAt)}
                </time>
              </div>
              <p className="text-sm text-foreground">{comment.commentText}</p>

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deletingId === comment.id}
                  aria-label="Delete comment"
                  className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md border bg-background px-2 py-1 text-xs text-destructive hover:bg-accent hover:text-destructive-foreground disabled:opacity-60"
                >
                  {deletingId === comment.id ? "Deleting…" : "Delete"}
                </button>
              )}
            </article>
          ))
        ) : (
          <div className="text-sm text-muted-foreground italic">No comments yet</div>
        )}
      </div>

      {isLoggedIn ? (
        <form onSubmit={handleAddComment} className="flex flex-col gap-2" aria-label="Add comment">
          <label htmlFor="new-comment" className="sr-only">
            New comment
          </label>
          <textarea
            id="new-comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            disabled={adding}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {addError ? (
                <span role="alert" className="text-destructive">
                  {addError}
                </span>
              ) : null}
              {deleteError ? (
                <span role="alert" className="text-destructive ml-2">
                  {deleteError}
                </span>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={adding || !newComment.trim()}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {adding ? "Adding…" : "Add Comment"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to add or delete comments.</p>
      )}
    </section>
  )
}

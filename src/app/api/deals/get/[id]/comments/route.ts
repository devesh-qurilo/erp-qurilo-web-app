// app/api/deals/get/[id]/comments/route.ts
import { type NextRequest, NextResponse } from "next/server"

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`

// GET: Fetch all comments for a deal
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]

    const res = await fetch(`${BASE_URL}/deals/${dealId}/comments`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Failed to fetch comments: ${res.statusText}`)
    }

    const externalData = await res.json()
    const transformed = { data: Array.isArray(externalData) ? externalData : [] }
    return NextResponse.json(transformed)
  } catch (error: any) {
    console.error("[GET /comments] error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// POST: Add a new comment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]
    const body = await request.json()

    if (!body.commentText || typeof body.commentText !== "string") {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 })
    }

    const res = await fetch(`${BASE_URL}/deals/${dealId}/comments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ commentText: body.commentText }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Failed to add comment: ${res.statusText}`)
    }

    const externalData = await res.json()
    const transformed = { data: Array.isArray(externalData) ? externalData : [] }
    return NextResponse.json(transformed)
  } catch (error: any) {
    console.error("[POST /comments] error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// DELETE: Remove a comment
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params
    const authHeader = request.headers.get("Authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]
    const body = await request.json()

    if (!body.commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 })
    }

    const res = await fetch(`${BASE_URL}/deals/${dealId}/comments/${body.commentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Failed to delete comment: ${res.statusText}`)
    }

    const externalData = await res.json()
    const transformed = { data: Array.isArray(externalData) ? externalData : [] }
    return NextResponse.json(transformed)
  } catch (error: any) {
    console.error("[DELETE /comments] error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
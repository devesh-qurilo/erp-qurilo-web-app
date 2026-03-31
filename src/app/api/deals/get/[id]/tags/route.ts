import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BASE_URL = "https://6jnqmj85-8080.inc1.devtunnels.ms"

async function refetchTags(dealId: string, accessToken: string) {
  const refetch = await fetch(`${BASE_URL}/deals/${dealId}/tags`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  const refetchText = await refetch.text()
  try {
    const parsed = JSON.parse(refetchText)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    throw new Error("Failed to parse tags from refetch response")
  }
}

/* -------------------------------------------------
GET – fetch existing tags (unchanged)
------------------------------------------------- */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const accessToken = authHeader.split(" ")[1]

    const res = await fetch(`${BASE_URL}/deals/${dealId}/tags`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Failed to fetch tags: ${res.statusText}`)
    }

    const externalData = await res.json()
    const transformed = { data: Array.isArray(externalData) ? externalData : [] }
    return NextResponse.json(transformed)
  } catch (error: any) {
    console.error("[GET /tags] error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/* -------------------------------------------------
POST – add a tag (unchanged from your snippet)
------------------------------------------------- */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params

    // ---- 1. Auth ----
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const accessToken = authHeader.split(" ")[1]

    // ---- 2. Parse body ----
    const body = await request.json()
    if (!body || typeof body.tagName !== "string" || !body.tagName.trim()) {
      return NextResponse.json({ error: "Invalid payload – send { tagName: string }" }, { status: 400 })
    }
    const tagName = body.tagName.trim()

    // ---- 3. Forward POST to external API ----
    const res = await fetch(`${BASE_URL}/deals/${dealId}/tags`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ tagName }),
    })

    // ---- 4. Safely handle response ----
    const raw = await res.text()
    let result: any = null

    // Try to parse JSON if possible
    try {
      result = JSON.parse(raw)
    } catch {
      // not JSON, likely plain "Success"
    }

    if (!res.ok) {
      const msg = (result && result.message) || raw || `Failed to add tag: ${res.statusText}`
      throw new Error(msg)
    }

    // If we got a plain "Success" response, re-fetch the updated tags
    const finalData =
      !result || typeof result === "string"
        ? await refetchTags(dealId, accessToken)
        : Array.isArray(result)
          ? result
          : []

    // ---- 5. Return consistent structure ----
    return NextResponse.json({
      data: Array.isArray(finalData) ? finalData : [],
    })
  } catch (error: any) {
    console.error("[POST /tags] error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/* -------------------------------------------------
DELETE – remove a tag by name
Body: { tagName: string }
Mirrors POST pattern, then returns updated tags
------------------------------------------------- */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: dealId } = await params

    // ---- 1. Auth ----
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const accessToken = authHeader.split(" ")[1]

    // ---- 2. Parse body ----
    const body = await request.json().catch(() => null)
    if (!body || typeof body.tagName !== "string" || !body.tagName.trim()) {
      return NextResponse.json({ error: "Invalid payload – send { tagName: string }" }, { status: 400 })
    }
    const tagName = body.tagName.trim()

    const urlPathDelete = `${BASE_URL}/deals/${dealId}/tags/${encodeURIComponent(tagName)}`
    const urlBodyDelete = `${BASE_URL}/deals/${dealId}/tags`

    // Try path-based DELETE first (no body)
    let res = await fetch(urlPathDelete, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    })

    // If server doesn't support that, try body-based DELETE as fallback
    if (!res.ok && (res.status === 405 || res.status === 404 || res.status === 415)) {
      res = await fetch(urlBodyDelete, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ tagName }),
      })
    }

    const raw = await res.text()
    let result: any = null
    try {
      result = JSON.parse(raw)
    } catch {
      // not JSON, possibly "Success"
    }

    if (!res.ok) {
      const msg = (result && result.message) || raw || `Failed to delete tag: ${res.statusText}`
      throw new Error(msg)
    }

    // Ensure consistent return by refetching if needed
    const finalData =
      !result || typeof result === "string"
        ? await refetchTags(dealId, accessToken)
        : Array.isArray(result)
          ? result
          : []

    return NextResponse.json({
      data: Array.isArray(finalData) ? finalData : [],
    })
  } catch (error: any) {
    console.error("[DELETE /tags] error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
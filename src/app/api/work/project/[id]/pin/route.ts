import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Updated: params is now Promise
) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]
    const { id } = await params // Fixed: Await params

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/projects/${id}/pin`, {
      method: "POST", // Assuming POST for toggle; change to PATCH if needed
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Optional: If the API expects a body for toggle, add e.g., body: JSON.stringify({ pinned: true })
    })

    if (!res.ok) {
      let errorData = { message: "Unknown error" }
      try {
        const contentType = res.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          errorData = await res.json()
        } else {
          // If not JSON, read as text
          errorData = { message: await res.text() || "Unknown error" }
        }
      } catch {
        errorData = { message: "Unknown error" }
      }
      return NextResponse.json({ message: "Failed to pin/unpin project", error: errorData }, { status: res.status })
    }

    // Fixed: Handle potentially empty or non-JSON success response
    let data = null
    try {
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json") && res.body) {
        data = await res.json()
      } else {
        // If empty or non-JSON, assume success without data
        data = { message: "Success" }
      }
    } catch {
      // If parsing fails, assume success
      data = { message: "Success" }
    }

    return NextResponse.json({ message: "Project pinned/unpinned successfully", data })
  } catch (error) {
    console.error("Error pinning project:", error)
    return NextResponse.json({ message: "Server Error" }, { status: 500 })
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/projects/${id}/pin`, {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      let errorData = { message: "Unknown error" }
      try {
        const contentType = res.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          errorData = await res.json()
        } else {
          errorData = { message: await res.text() || "Unknown error" }
        }
      } catch {
        errorData = { message: "Unknown error" }
      }
      return NextResponse.json({ message: "Failed to unpin project", error: errorData }, { status: res.status })
    }

    let data = null
    try {
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("application/json") && res.body) {
        data = await res.json()
      } else {
        data = { message: "Success" }
      }
    } catch {
      data = { message: "Success" }
    }

    return NextResponse.json({ message: "Project unpinned successfully", data })
  } catch (error) {
    console.error("Error unpinning project:", error)
    return NextResponse.json({ message: "Server Error" }, { status: 500 })
  }
}
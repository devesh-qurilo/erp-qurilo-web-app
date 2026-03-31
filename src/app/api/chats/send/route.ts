// src/app/api/chat/send/route.ts
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]
    const formData = await request.formData()

    // Forward the form data directly to your backend API
    const res = await fetch( `${process.env.NEXT_PUBLIC_MAIN}/api/chat/send`, {
      method: "POST",
      body: formData, // already in FormData format; let fetch set proper multipart boundary
      headers: {
        // Do NOT set Content-Type when sending FormData; browser will set with boundary
        Authorization: `Bearer ${accessToken}`,
      },
    })

    // Try to parse JSON; if it fails, fall back to text
    let data: any
    const responseText = await res.text()
    try {
      data = responseText ? JSON.parse(responseText) : null
    } catch {
      data = responseText
    }

    if (!res.ok) {
      const errorPayload = typeof data === "object" && data !== null ? data : { error: String(data || "Failed to send message") }
      return NextResponse.json(errorPayload, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error sending chat message:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

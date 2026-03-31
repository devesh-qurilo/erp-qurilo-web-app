import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    

    const upstream = `${process.env.NEXT_PUBLIC_MAIN}/employee/notifications/me`
    const res = await fetch(upstream, {
      // Ensure fresh data and avoid caching issues in Next.js
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return NextResponse.json({ error: "Upstream error", status: res.status, body: text }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data, {
      status: 200,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch notifications", message: err?.message ?? "Unknown error" },
      { status: 500 },
    )
  }
}

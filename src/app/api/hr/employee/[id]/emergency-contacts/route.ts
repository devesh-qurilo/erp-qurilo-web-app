import { type NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_MAIN;

// Proxy: GET /api/hr/employee/[id]/emergency-contacts -> external /employee/{id}/emergency-contacts
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const url = `${API_BASE}/employee/${encodeURIComponent(
      id
    )}/emergency-contacts`;

    const res = await fetch(url, {
      headers: {
        Authorization: request.headers.get("authorization") || "",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization") || undefined;
    const body = await request.text();
    const { id } = await context.params;
    const url = `${API_BASE}/${encodeURIComponent(id)}/emergency-contacts`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
        "content-type": "application/json",
      },
      body,
      cache: "no-store",
    });

    const responseBody = await upstream.text();
    const contentType =
      upstream.headers.get("content-type") || "application/json";

    return new Response(responseBody, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to create emergency contact" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}

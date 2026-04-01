import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_MAIN;

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");

    const res = await fetch(`${API_URL}/employee/all`, {
      headers: {
        Authorization: token || "",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

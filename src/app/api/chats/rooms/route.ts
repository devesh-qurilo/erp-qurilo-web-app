// app/api/chat/rooms/route.ts
import { NextResponse } from "next/server";

const BASE_URL =  `${process.env.NEXT_PUBLIC_MAIN}/api/chat/rooms`;

export async function GET(request: Request ) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]
    const res = await fetch(BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store", // ensures fresh data every time
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch chat rooms: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching chat rooms:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}

// app/api/deals/get/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/deals`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch deals: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching deals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

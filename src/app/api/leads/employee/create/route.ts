
import { NextResponse } from "next/server"


export async function POST(request: Request) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const accessToken = authHeader.split(" ")[1];
      const body = await request.json();
  
      const upstream = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/leads`, {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
  
      if (!upstream.ok) {
        const text = await upstream.text().catch(() => "");
        return NextResponse.json(
          { error: "Failed to create lead", details: text || upstream.statusText },
          { status: upstream.status },
        );
      }
  
      const data = await upstream.json();
      return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Unexpected error creating lead", details: err?.message || "Unknown error" },
        { status: 500 },
      );
    }
  }
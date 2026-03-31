import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const body = await request.json();

  //  console.log("🟡 PUT /api/deals/create/[id]", id, body);

    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/deals/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

  
    const text = await res.text();
    
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream failed: ${res.status} ${res.statusText}`, details: text },
        { status: res.status }
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error updating deal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
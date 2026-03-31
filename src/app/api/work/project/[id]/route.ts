import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];

    // const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/projects/${id}`, {
    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/projects/${id}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ message: "Failed to fetch project" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await context.params;
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const accessToken = authHeader.split(" ")[1];
   
  
      const formData = await request.formData();
  
      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/projects/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData, // do NOT set content-type manually
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        return NextResponse.json(
          { error: data || "Failed to update project" },
          { status: res.status }
        );
      }
  
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error updating project:", error);
      return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
  }
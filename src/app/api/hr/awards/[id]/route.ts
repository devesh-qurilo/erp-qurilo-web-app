import { NextRequest, NextResponse } from "next/server";

const API_URL = `${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards`;

// ✅ Update award
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // 👈 await params
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards/${id}`,
      {
        method: "PUT",
        headers: { Authorization: authHeader },
        body: formData,
      }
    );

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ Delete award
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // 👈 await params

  const authHeader = req.headers.get("authorization");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: authHeader || "" },
    }
  );

  const data = await res.json();
  return Response.json(data);
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${API_URL}/${id}`, {
      headers: { Authorization: authHeader },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

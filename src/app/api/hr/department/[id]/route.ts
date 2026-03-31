// app/api/departments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = request.headers.get("authorization"); // "Bearer <token>"

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MAIN}/admin/departments/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch department" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = request.headers.get("authorization");
    if (!token)
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );

    const body = await request.json();
    if (!body.departmentName)
      return NextResponse.json(
        { error: "departmentName is required" },
        { status: 400 }
      );

    const res = await fetch(
      `https://6jnqmj85-8080.inc1.devtunnels.ms/admin/departments/${id}`,
      {
        method: "PUT",
        headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok)
      return NextResponse.json(
        { error: "Failed to update department" },
        { status: res.status }
      );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = request.headers.get("authorization");
    if (!token)
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );

    const res = await fetch(
      `https://6jnqmj85-8080.inc1.devtunnels.ms/admin/departments/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: token },
      }
    );

    if (!res.ok)
      return NextResponse.json(
        { error: "Failed to delete department" },
        { status: res.status }
      );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

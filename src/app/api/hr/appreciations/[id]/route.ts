import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_MAIN;

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const token = request.headers.get("authorization");
    const { id } = params;

    const res = await fetch(`${API_URL}/employee/admin/appreciations/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token || "",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: any) {
  try {
    const token = request.headers.get("authorization");
    const { id } = params;

    const res = await fetch(`${API_URL}/employee/appreciations/${id}`, {
      headers: { Authorization: token || "" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    // unwrap params
    const { id } = await context.params;

    // read token
    const token = request.headers.get("authorization");

    // read formData from client
    const formData = await request.formData();

  
    // forward request to external API
    const externalResponse = await fetch(
      `${API_URL}/employee/admin/appreciations/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: token || "",
          // ❌ DO NOT SET content-type, browser will set boundary
        },
        body: formData,
      }
    );

    // Read response safely
    const text = await externalResponse.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }

    return NextResponse.json(json, {
      status: externalResponse.status,
    });
  } catch (err: any) {
    console.error("PUT ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Update Failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}/employee/me`;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const response = await fetch(BASE_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Failed to fetch profile" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/company/profile-settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const formData = await request.formData();

    const employee = formData.get("employee");
    const file = formData.get("file");

    if (!employee) {
      return NextResponse.json({ error: "Missing employee data" }, { status: 400 });
    }

    const backendForm = new FormData();
    backendForm.append("employee", employee);
    if (file && file instanceof File) {
      backendForm.append("file", file);
    }

    const response = await fetch(BASE_URL, {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: backendForm,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Update failed" }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("PUT /api/company/profile-settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

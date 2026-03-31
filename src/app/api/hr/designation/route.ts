// src/app/api/hr/designation/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = `${process.env.NEXT_PUBLIC_MAIN}/admin/designations`;

// ✅ GET handler (already working)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization"); // "Bearer <token>"

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch designations from external API");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch designations" },
      { status: 500 }
    );
  }
}

// ✅ POST handler (newly added)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization"); // "Bearer <token>"

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token missing" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to create designation in external API");
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create designation" },
      { status: 500 }
    );
  }
}

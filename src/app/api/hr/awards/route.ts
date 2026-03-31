import { type NextRequest, NextResponse } from "next/server";

const API_URL = `${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards`;

// Helper to normalize Authorization header
function formatAuthHeader(token: string | null) {
  if (!token) return "";
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the incoming request
    const token = request.headers.get("authorization");

    // Fetch data from the external API
    const res = await fetch(API_URL, {
      headers: {
        Authorization: token || "",
      },
      cache: "no-store", // Disable caching for fresh data
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch awards" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching awards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Parse form data from client request
    const formData = await req.formData();

    // Forward request to backend
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          // ❌ don't set Content-Type here, fetch will set it correctly for FormData
        },
        body: formData,
      }
    );

    // ✅ Handle backend response
    let data: any = null;
    const text = await res.text();
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

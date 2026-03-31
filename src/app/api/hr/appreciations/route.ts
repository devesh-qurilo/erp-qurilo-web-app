import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_MAIN;

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
    const res = await fetch(`${API_URL}/employee/appreciations`, {
      headers: {
        Authorization: token || "",
      },
      cache: "no-store", // Disable caching for fresh data
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch appreciations" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching appreciations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse FormData
    const formData = await req.formData();
    const awardId = formData.get("awardId");
    const givenToEmployeeId = formData.get("givenToEmployeeId");
    const date = formData.get("date");
    const summary = formData.get("summary");
    const photoFile = formData.get("photoFile");

    // Validate fields
    if (!awardId || !givenToEmployeeId || !date || !summary || !photoFile) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Extract token from headers
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Forward FormData to external API
    const externalResponse = await fetch(`${API_URL}/employee/appreciations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`, // keep token
      },
      body: formData, // DO NOT set Content-Type manually
    });

    const text = await externalResponse.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text || "No response from external API" };
    }

    return NextResponse.json(data, { status: externalResponse.status });
  } catch (error: any) {
    console.error("Error in /api/hr/appreciations POST:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";

const API_URL = `${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards/active`;

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

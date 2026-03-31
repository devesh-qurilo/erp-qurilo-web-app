import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_MAIN;

export async function GET(req: NextRequest) {
  try {
    // take accessToken from browser's localStorage equivalent (client must send it in headers)
    const accessToken = req.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const res = await fetch(`${API_URL}/employee/attendance/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();

    // ✅ Ensure response is always an array
    const attendanceArray = Array.isArray(data) ? data : [data];

    return NextResponse.json(attendanceArray, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching attendance:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    );
  }
}

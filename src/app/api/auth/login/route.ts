import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { employeeId, password } = await request.json();

    // Validate request body
    if (!employeeId || !password) {
      return NextResponse.json(
        { error: "Employee ID and password are required" },
        { status: 400 }
      );
    }

    // Make request to external API
    const response = await fetch(
       `${process.env.NEXT_PUBLIC_MAIN}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // 👈 added
        },
        body: JSON.stringify({ employeeId, password }),
      }
    );

    // Debug logs
  //  console.log("Response Status:", response.status);
//console.log("Response Headers:", response.headers.get("content-type"));

    const rawBody = await response.text();
 //   console.log("Raw Body:", rawBody);

    let data: any = {};
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      try {
        data = JSON.parse(rawBody);
      } catch (err) {
        console.error("JSON parse failed:", err);
        return NextResponse.json(
          { error: "Invalid JSON returned from auth server", raw: rawBody },
          { status: 502 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Auth server did not return JSON", raw: rawBody },
        { status: response.status }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Login failed", raw: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in login API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/invoices`, {
      // Corrected endpoint
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        return NextResponse.json(
          { error: `Failed to fetch invoices: ${res.statusText}`, details: errorData },
          { status: res.status }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch invoices: ${res.statusText}` },
        { status: res.status }
      );
    }

    const invoices = await res.json();
    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



 
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const body = await request.json();

    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/invoices`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const contentType = res.headers.get("content-type");
      const errorResponse = {
        error: `Failed to create invoice: ${res.statusText}`,
        status: res.status,
        details: contentType?.includes("application/json") ? await res.json() : undefined,
      };
      return NextResponse.json(errorResponse, { status: res.status });
    }

    const newInvoice = await res.json();
    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
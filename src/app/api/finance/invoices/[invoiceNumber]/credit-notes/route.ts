import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/invoices/${invoiceNumber}/credit-notes`, {
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
          { error: `Failed to fetch credit notes: ${res.statusText}`, details: errorData },
          { status: res.status }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch credit notes: ${res.statusText}` },
        { status: res.status }
      );
    }

    const creditNotes = await res.json();
    return NextResponse.json(creditNotes);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
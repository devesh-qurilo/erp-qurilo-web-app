// api/finance/invoices/[invoiceNumber]/payments/route.ts 
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ invoiceNumber: string }> }) {
  try {
    const { invoiceNumber } = await context.params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/payments/invoice/${invoiceNumber}`, {
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
          { error: `Failed to fetch payments: ${res.statusText}`, details: errorData },
          { status: res.status }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch payments: ${res.statusText}` },
        { status: res.status }
      );
    }

    const payments = await res.json();
    return NextResponse.json(payments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("API Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
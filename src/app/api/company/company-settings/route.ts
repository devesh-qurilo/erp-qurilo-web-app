import { NextRequest, NextResponse } from "next/server";

const API_URL = `${process.env.NEXT_PUBLIC_MAIN}/employee/company`;

export async function POST(req: NextRequest) {
  try {
    // Extract token
    const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse incoming form data
    const formData = await req.formData();
    const companyName = formData.get("companyName");
    const email = formData.get("email");
    const contactNo = formData.get("contactNo");
    const website = formData.get("website");
    const address = formData.get("address");
    const logoFile = formData.get("logoFile") as File | null;

    // Validate required fields
    if (!companyName || !email || !contactNo || !website || !address || !logoFile) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Create new formData to send to backend API
    const backendFormData = new FormData();
    backendFormData.append("companyName", companyName.toString());
    backendFormData.append("email", email.toString());
    backendFormData.append("contactNo", contactNo.toString());
    backendFormData.append("website", website.toString());
    backendFormData.append("address", address.toString());
    backendFormData.append("logoFile", logoFile);

    // Send request to backend
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: backendFormData,
    });

    const data = await response.json();

    // Forward backend response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try {
      const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!accessToken) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
  
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error("Error fetching company data:", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  }
  
  export async function PUT(req: NextRequest) {
    try {
      const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!accessToken) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
  
      const formData = await req.formData();
      const { companyName, email, contactNo, website, address } = Object.fromEntries(formData);
      const logoFile = formData.get("logoFile") as File | null;
  
      if (!companyName || !email || !contactNo || !website || !address) {
        return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
      }
  
      const backendFormData = new FormData();
      backendFormData.append("companyName", companyName.toString());
      backendFormData.append("email", email.toString());
      backendFormData.append("contactNo", contactNo.toString());
      backendFormData.append("website", website.toString());
      backendFormData.append("address", address.toString());
      if (logoFile) backendFormData.append("logoFile", logoFile);
  
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: backendFormData,
      });
  
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (error) {
      console.error("Company PUT error:", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  }
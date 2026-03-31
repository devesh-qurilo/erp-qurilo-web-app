import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = authHeader.split(" ")[1]
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const progress = searchParams.get("progress") || ""
    const duration = searchParams.get("duration") || ""

    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/projects/AllProject`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      return NextResponse.json({ message: "Failed to fetch projects" }, { status: 500 })
    }

    let data = await res.json()

    if (Array.isArray(data)) {
      data = data.filter((project: any) => {
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase()
          const matchesSearch =
            project.name?.toLowerCase().includes(searchLower) || project.shortCode?.toLowerCase().includes(searchLower)
          if (!matchesSearch) return false
        }

        // Status filter
        if (status && project.status !== status) {
          return false
        }

        // Progress filter
        if (progress) {
          const [min, max] = progress.split("-").map(Number)
          const projectProgress = project.progress || 0
          if (projectProgress < min || projectProgress > max) {
            return false
          }
        }

        // Duration filter
        if (duration) {
          const startDate = new Date(project.startDate)
          const deadline = new Date(project.deadline)
          const durationDays = Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

          if (duration === "90+") {
            if (durationDays < 90) return false
          } else {
            const [min, max] = duration.split("-").map(Number)
            if (durationDays < min || durationDays > max) {
              return false
            }
          }
        }

        return true
      })
    }

    const totalItems = data.length
    const totalPages = Math.ceil(totalItems / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = data.slice(startIndex, endIndex)

    return NextResponse.json({
      projects: paginatedData,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ message: "Server Error" }, { status: 500 })
  }
}


export async function POST(request: Request) {
    try {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const accessToken = authHeader.split(" ")[1];
      const formData = await request.formData();
  
      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
   
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        return NextResponse.json({ error: data || "Failed to create project" }, { status: res.status });
      }
  
      return NextResponse.json(data);
  
    } catch (error) {
      console.error("Error creating project:", error);
      return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }
  }

  export async function PUT(request: Request) {
    try {
      const authHeader = request.headers.get("Authorization")
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
  
      const accessToken = authHeader.split(" ")[1]
      const { searchParams } = new URL(request.url)
      const projectId = searchParams.get("id")
  
      if (!projectId) {
        return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
      }
  
      const contentType = request.headers.get("content-type")
      let body
  
      if (contentType?.includes("application/json")) {
        body = await request.json()
      } else {
        body = await request.formData()
      }
  
      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(contentType?.includes("application/json") && { "Content-Type": "application/json" }),
        },
        body: contentType?.includes("application/json") ? JSON.stringify(body) : body,
      })
  
      const data = await res.json()
  
      if (!res.ok) {
        return NextResponse.json({ error: data || "Failed to update project" }, { status: res.status })
      }
  
      return NextResponse.json(data)
    } catch (error) {
      console.error("Error updating project:", error)
      return NextResponse.json({ message: "Server Error" }, { status: 500 })
    }
  }
  
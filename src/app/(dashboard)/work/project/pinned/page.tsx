"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, Search, MoreVertical, Eye, Edit2, Pin, Archive, Trash2 } from "lucide-react"
import { format } from "date-fns"

interface Project {
  id: number
  shortCode: string
  name: string
  startDate: string
  deadline: string
  client?: {
    name: string
    profilePictureUrl?: string
  }
  currency: string
  budget: number
  progress?: number
  status?: "active" | "completed" | "on-hold" | "planning"
  duration?: number
  assignedEmployees?: {
    employeeId: string
    name: string
    profileUrl?: string
    designation?: string
  }[]
  isPinned?: boolean
  isArchived?: boolean
}

export default function PinnedProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [progressFilter, setProgressFilter] = useState<string>("all")
  const [durationFilter, setDurationFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const getProjects = useCallback(
    async (accessToken: string) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          search: searchQuery,
          status: statusFilter !== "all" ? statusFilter : "",
          progress: progressFilter !== "all" ? progressFilter : "",
          duration: durationFilter !== "all" ? durationFilter : "",
          pinned: "true",
        })

        const res = await fetch(`/api/work/project?${params}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!res.ok) {
          throw new Error("Failed to load projects")
        }

        const data = await res.json()
        setProjects(data.projects || [])
        setTotalPages(data.totalPages || 1)
      } catch (err: any) {
        console.error("Error loading projects:", err)
      } finally {
        setLoading(false)
      }
    },
    [currentPage, searchQuery, statusFilter, progressFilter, durationFilter],
  )

  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken")
    setToken(savedToken)

    if (savedToken) {
      getProjects(savedToken)
    } else {
      setLoading(false)
    }
  }, [getProjects])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleProgressChange = (value: string) => {
    setProgressFilter(value)
    setCurrentPage(1)
  }

  const handleDurationChange = (value: string) => {
    setDurationFilter(value)
    setCurrentPage(1)
  }

  const handleView = (projectId: number) => {
  //  console.log("View project:", projectId)
  }

  const handleEdit = (projectId: number) => {
 //   console.log("Edit project:", projectId)
  }

  const handlePin = async (projectId: number) => {
    const projectIndex = projects.findIndex(p => p.id === projectId)
    if (projectIndex === -1) return

    // Optimistic update: Remove from list
    const optimisticProjects = projects.filter(p => p.id !== projectId)
    setProjects(optimisticProjects)

    try {
      const res = await fetch(`/api/work/project/${projectId}/pin`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token!}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        throw new Error("Failed to unpin project")
      }

      // On success, refetch to update the list
      await getProjects(token!)
     // console.log("Unpinned project:", projectId)
    } catch (err) {
      // Rollback: Restore the project
      setProjects(projects)
      console.error("Failed to unpin:", err)
    }
  }

  const handleArchive = (projectId: number) => {
  //  console.log("Archive project:", projectId)
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, isArchived: !p.isArchived } : p)))
  }

  const handleDelete = (projectId: number) => {
  //  console.log("Delete project:", projectId)
    setProjects(projects.filter((p) => p.id !== projectId))
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "on-hold":
        return "bg-yellow-100 text-yellow-800"
      case "planning":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressColor = (progress?: number) => {
    if (!progress) return "bg-gray-200"
    if (progress < 33) return "bg-red-500"
    if (progress < 66) return "bg-yellow-500"
    return "bg-green-500"
  }

  const ProjectTableRow = ({ project }: { project: Project }) => {
    const startDate = new Date(project.startDate)
    const deadline = new Date(project.deadline)
    const durationDays = Math.ceil((deadline.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    return (
      <TableRow key={project.id} className="hover:bg-gray-50">
        <TableCell>
          <Link href={`/work/project/${project.id}`} className="text-blue-600 hover:underline font-medium">
            {project.name}
          </Link>
          <p className="text-xs text-gray-500">{project.shortCode}</p>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {project.client?.profilePictureUrl && (
              <img
                src={project.client.profilePictureUrl || "/placeholder.svg"}
                alt="client"
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <span className="text-sm">{project.client?.name || "N/A"}</span>
          </div>
        </TableCell>
        <TableCell>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status || "N/A"}
          </span>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">{project.progress || 0}%</p>
          </div>
        </TableCell>
        <TableCell>
          <span className="font-medium">
            {project.currency} {project.budget.toLocaleString()}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm">{durationDays} days</span>
        </TableCell>
        <TableCell>
          <span className="text-sm">{
          // new Date(project.deadline).toLocaleDateString()
          format(new Date(project.deadline), "dd-MM-yyyy")
          }</span>
        </TableCell>
        <TableCell>
          <div className="flex -space-x-2">
            {project.assignedEmployees?.slice(0, 3).map((emp) => (
              <div
                key={emp.employeeId}
                className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white"
                title={emp.name}
              >
                {emp.name.charAt(0)}
              </div>
            ))}
            {project.assignedEmployees && project.assignedEmployees.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center border-2 border-white">
                +{project.assignedEmployees.length - 3}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleView(project.id)} className="gap-2">
                            <Eye className="h-4 w-4" />
                            <Link href={`/work/project/${project.id}`} >
                      View
                      </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="gap-2">
  <Link href={`/work/project/${project.id}/update`} className="flex items-center gap-2">
    <Edit2 className="h-4 w-4" />
    Edit
  </Link>
</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePin(project.id)} className="gap-2">
                <Pin className="h-4 w-4" />
                Unpin Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleArchive(project.id)} className="gap-2">
                <Archive className="h-4 w-4" />
                {project.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(project.id)}
                className="gap-2 text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  if (loading) return <p className="p-4">Loading Projects...</p>
  if (!token) return <p className="p-4 text-red-500">Unauthorized! Token not found.</p>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search projects by name or code..."
            value={searchQuery}
            onChange={handleSearch}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
            </SelectContent>
          </Select>

          <Select value={progressFilter} onValueChange={handleProgressChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Progress</SelectItem>
              <SelectItem value="0-33">0-33%</SelectItem>
              <SelectItem value="33-66">33-66%</SelectItem>
              <SelectItem value="66-100">66-100%</SelectItem>
            </SelectContent>
          </Select>

          <Select value={durationFilter} onValueChange={handleDurationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Duration</SelectItem>
              <SelectItem value="0-30">0-30 days</SelectItem>
              <SelectItem value="30-60">30-60 days</SelectItem>
              <SelectItem value="60-90">60-90 days</SelectItem>
              <SelectItem value="90+">90+ days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-blue-50 px-6 py-3 border-b">
          <h2 className="font-semibold text-blue-900 flex items-center gap-2">
            <Pin className="w-4 h-4" />
            Pinned Projects ({projects.length})
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length > 0 ? (
              projects.map((project) => <ProjectTableRow key={project.id} project={project} />)
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No pinned projects yet. Pin a project to see it here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {projects.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
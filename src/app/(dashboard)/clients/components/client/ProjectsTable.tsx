"use client"
import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { format } from "date-fns"


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


const placeholderImg = "/mnt/data/Screenshot 2025-11-25 124734.png"

export const ProjectsTable: React.FC<{
  projects: any[]
  loading?: boolean
  error?: string | null
  clientName?: string
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onAdd?: () => void
}> = ({ projects = [], loading, error, clientName, onView, onEdit, onDelete, onAdd }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onAdd}>+ Add Project</Button>
          </div>
          <div className="w-64">
            <input placeholder="Search" className="w-full px-3 py-2 border rounded" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-left text-xs">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">Loading projects...</td>
                </tr> */}



{loading ? (
  [...Array(6)].map((_, i) => (
    <tr key={i} className="border-t">
      <td className="px-4 py-3"><Skeleton width={60} /></td>

      <td className="px-4 py-3"><Skeleton width={120} /></td>

      <td className="px-4 py-3">
        <div className="flex -space-x-2">
          <Skeleton circle width={28} height={28} />
          <Skeleton circle width={28} height={28} />
          <Skeleton circle width={28} height={28} />
        </div>
      </td>

      <td className="px-4 py-3"><Skeleton width={90} /></td>

      <td className="px-4 py-3"><Skeleton width={90} /></td>

      <td className="px-4 py-3 flex items-center gap-2">
        <Skeleton circle width={32} height={32} />
        <Skeleton width={80} />
      </td>

      <td className="px-4 py-3">
        <Skeleton height={10} />
        <Skeleton width={40} height={15} style={{ marginTop: 6 }} />
      </td>

      <td className="px-4 py-3">
        <Skeleton width={20} height={20} />
      </td>
    </tr>
  ))





              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-red-600">{error}</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">No projects found</td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">{p.code ?? "—"}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-2 items-center">
                        {p.members && p.members.slice(0, 3).map((m: any, i: number) => (
                          <div key={m.id || i} className="w-7 h-7 rounded-full ring-2 ring-white overflow-hidden">
                            <img src={m.avatarUrl || placeholderImg} alt={m.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {p.members && p.members.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs ring-2 ring-white">+{p.members.length - 3}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.startDate
                        ? format(new Date(p.startDate), "dd-MM-yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {p.deadline
                        ? format(new Date(p.deadline), "dd-MM-yyyy")
                        : "—"}

                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img src={p.client?.avatarUrl || placeholderImg} alt={p.client?.name || clientName} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">{p.client?.name ?? clientName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3 bg-green-200 rounded" style={{ position: "relative" }}>
                          <div className="h-3 bg-green-500 rounded" style={{ width: `${p.progressPercent ?? 0}%` }} />
                        </div>
                        <div className="text-xs text-muted-foreground">{p.progressPercent ?? 0}%</div>
                      </div>
                      <div className="mt-2 text-xs">
                        <Badge variant="secondary">{p.status ?? "In Progress"}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView?.(p.id)}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(p.id)}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onDelete?.(p.id)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProjectsTable
"use client"

import type React from "react"

import { useState, useMemo } from "react"
import useSWR, { mutate } from "swr"
import { Search, Plus, Edit2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"

interface Designation {
  id: number
  designationName: string
  parentDesignationId: number | null
  parentDesignationName: string | null
  createDate: string
}

// 🔹 Fetcher for SWR
const fetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
  if (!token) throw new Error("Access token not found")

  const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/admin/designations`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  })

  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  return res.json()
}

export default function DesignationsPage() {
  const { data, error, isLoading } = useSWR<Designation[]>("/api/hr/designation", fetcher)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterParent, setFilterParent] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // 🔹 Form state
  const [designationName, setDesignationName] = useState("")
  const [parentId, setParentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // 🔹 Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editParentId, setEditParentId] = useState<number | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const filteredData = useMemo(() => {
    if (!data) return []

    return data.filter((d) => {
      const matchesSearch = d.designationName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesParent = filterParent === null || d.parentDesignationId === filterParent
      return matchesSearch && matchesParent
    })
  }, [data, searchQuery, filterParent])

  // ✅ Create new designation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) throw new Error("No access token found")

      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/admin/designations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ designationName, parentDesignationId: parentId || null }),
      })

      if (!res.ok) throw new Error("Failed to create designation")

      setDesignationName("")
      setParentId(null)
      // mutate("/api/hr/designation")
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Load designation for editing
  const loadDesignation = async (id: number) => {
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) throw new Error("No access token found")

      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/admin/designations/${id}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error("Failed to fetch designation")

      const data: Designation = await res.json()
      setEditName(data.designationName)
      setEditParentId(data.parentDesignationId)
      setEditingId(data.id)
    } catch (err: any) {
      alert(err.message)
    }
  }

  // ✅ Update designation
  const handleUpdate = async (id: number) => {
    setEditLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) throw new Error("No access token found")

      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/admin/designations/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ designationName: editName, parentDesignationId: editParentId || null }),
      })

      if (!res.ok) throw new Error("Failed to update designation")

      setEditingId(null)
      // mutate("/api/hr/designation")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  // ✅ Delete designation
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this designation?")) return

    try {
      const token = localStorage.getItem("accessToken")
      if (!token) throw new Error("No access token found")

      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/admin/designations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error("Failed to delete designation")
      // mutate("/api/hr/designation")
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive">{(error as Error).message}</div>
    )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Designations</h1>
          <p className="text-muted-foreground">Manage organizational designations and hierarchies</p>
        </div>

        {/* Add New Designation Form */}
        <Card className="mb-8 p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Add New Designation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="text"
                placeholder="Designation name"
                value={designationName}
                onChange={(e) => setDesignationName(e.target.value)}
                required
                className="bg-background border-border"
              />
              <select
                value={parentId ?? ""}
                onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
              >
                <option value="">No Parent</option>
                {data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.designationName}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={loading} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {loading ? "Adding..." : "Add Designation"}
              </Button>
            </div>
            {formError && <p className="text-destructive text-sm">{formError}</p>}
          </form>
        </Card>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search designations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="border-border">
              Filters{" "}
              {filterParent !== null && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  1
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="p-4 border border-border bg-card">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Filter by Parent Designation</label>
                  <select
                    value={filterParent ?? ""}
                    onChange={(e) => setFilterParent(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="">All Designations</option>
                    {data?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.designationName}
                      </option>
                    ))}
                  </select>
                </div>
                {filterParent !== null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterParent(null)}
                    className="w-full border-border"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredData.length} of {data?.length || 0} designations
        </div>

        {/* Designations Table */}
        {filteredData && filteredData.length > 0 ? (
          <Card className="border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Parent</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((d) => (
                    <tr key={d.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground">{d.id}</td>
                      <td className="px-6 py-4 text-sm text-foreground font-medium">
                        {editingId === d.id ? (
                          <Input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-background border-border"
                          />
                        ) : (
                          d.designationName
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {editingId === d.id ? (
                          <select
                            value={editParentId ?? ""}
                            onChange={(e) => setEditParentId(e.target.value ? Number(e.target.value) : null)}
                            className="px-2 py-1 rounded-md border border-border bg-background text-foreground text-sm"
                          >
                            <option value="">No Parent</option>
                            {data?.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.designationName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          d.parentDesignationName || "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {
                        // new Date(d.createDate).toLocaleDateString()
                        format( new Date(d.createDate),"dd-MM-yyyy")
                        }
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {editingId === d.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(d.id)}
                              disabled={editLoading}
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              {editLoading ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="border-border"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadDesignation(d.id)}
                              className="border-border"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(d.id)}
                              className="border-border text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center border border-border">
            <p className="text-muted-foreground">
              {searchQuery || filterParent !== null ? "No designations match your filters." : "No designations found."}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

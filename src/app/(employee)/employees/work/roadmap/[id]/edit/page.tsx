"use client"

import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CheckCircle2, Loader2, Trash, X } from "lucide-react"

type ProjectData = {
  projectName: string
  shortCode: string
  startDate: string
  deadline: string
  noDeadline: boolean
  projectCategory: string // will store category id (string)
  departmentId: string
  clientId: string
  assignedEmployeeIds: string
  projectSummary: string
  currency: string
  projectBudget: string
  hoursEstimate: string
  tasksNeedAdminApproval: boolean
  allowManualTimeLogs: boolean
  projectStatus?: string | null
  progressPercent?: number | null
  calculateProgressThroughTasks?: boolean | null
  addedBy?: string | null
}

const GATEWAY = `${process.env.NEXT_PUBLIC_MAIN}`

/* -------------------------
   ProjectCategoryModal (unchanged)
   ------------------------- */
type Category = { id: number; name: string }

function ProjectCategoryModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  onAdded?: (categoryId: string) => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [selectedName, setSelectedName] = useState<string>("")

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

  const fetchCategories = async () => {
    setLoadingList(true)
    setMessage(null)
    try {
      if (!token) {
        setMessage({ type: "error", text: "No token found (login required)." })
        setCategories([])
        setLoadingList(false)
        return
      }
      const res = await fetch(`${GATEWAY}/api/projects/category`, { headers: { Authorization: `Bearer ${token}` } })
      let data: any = await res.json().catch(() => null)
      if (typeof data === "string") {
        try {
          data = JSON.parse(data)
        } catch { }
      }
      if (!res.ok) {
        setMessage({ type: "error", text: `Failed to load categories (${res.status})` })
        setCategories([])
      } else {
        const list = Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), name: String(d.name) })) : []
        setCategories(list)
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: "error", text: "Error loading categories" })
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCategories()
      setSelectedName("")
      setMessage(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = async () => {
    setMessage(null)
    const name = (selectedName || "").trim()
    if (!name) {
      setMessage({ type: "error", text: "Please enter a category name." })
      return
    }
    if (!token) {
      setMessage({ type: "error", text: "No token found (login required)." })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${GATEWAY}/api/projects/category`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      })
      const text = await res.text()
      let data: any = null
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
      if (!res.ok) {
        const errMsg = typeof data === "string" ? data : data?.message ?? JSON.stringify(data)
        setMessage({ type: "error", text: `Failed to add: ${errMsg}` })
      } else {
        setMessage({ type: "success", text: "Category added." })
        await fetchCategories()
        setSelectedName("")
        try {
          const newId = typeof data === "object" && data?.id ? String(data.id) : String((categories.find((c) => c.name === name) || {}).id || "")
          if (newId) onAdded?.(newId)
        } catch { }
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: "error", text: "Error while saving category" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name?: string) => {
    if (!window.confirm(`Delete category "${name ?? id}" ?`)) return
    if (!token) {
      setMessage({ type: "error", text: "No token found (login required)." })
      return
    }
    try {
      const res = await fetch(`${GATEWAY}/api/projects/category/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "text/plain", Authorization: `Bearer ${token}` },
      })
      const text = await res.text().catch(() => "")
      if (!res.ok) {
        setMessage({ type: "error", text: `Delete failed: ${text || res.statusText}` })
      } else {
        setMessage({ type: "success", text: "Deleted successfully." })
        await fetchCategories()
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: "error", text: "Error deleting category" })
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Project Category</h3>
          <button aria-label="Close" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100" title="Close">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-md border overflow-hidden">
            <table className="min-w-full divide-y">
              <thead className="bg-blue-50">
                <tr className="text-sm text-gray-700">
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">Category Name</th>
                  <th className="px-4 py-3 text-left w-28">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loadingList ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((c, idx) => (
                    <tr key={c.id} className="text-sm text-gray-700 border-t">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="inline-flex items-center gap-2 rounded px-2 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100"
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-700">Category Name *</label>
            <Input placeholder="--" value={selectedName} onChange={(e) => setSelectedName(e.target.value)} className="w-full" />
          </div>

          {message && (
            <Alert className={`border ${message.type === "success" ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-end gap-4 pt-2 border-t mt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedName("")
                onClose()
              }}
              className="px-6 py-2 rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              Cancel
            </button>

            <button type="button" onClick={handleSave} disabled={saving} className={`px-6 py-2 rounded text-white ${saving ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------
   MultiSelectEmployeeDropdown (new)
   - lightweight, used for "Assigned to"
   - exposes selected employeeIds array and writes out hidden input value (comma-separated)
   ------------------------- */
type Employee = { employeeId: string; name: string; profilePictureUrl?: string }

function MultiSelectEmployeeDropdown({
  employees,
  selected,
  onChange,
  placeholder = "Select employees",
}: {
  employees: Employee[]
  selected: string[] // employeeId[]
  onChange: (selectedIds: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("click", onDoc)
    return () => document.removeEventListener("click", onDoc)
  }, [])

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id))
    else onChange([...selected, id])
  }

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((s) => !s)}
        className="border rounded-md px-3 py-2 min-h-[44px] flex items-center gap-2 cursor-pointer bg-white"
        role="button"
      >
        <div className="flex-1 flex items-center gap-2 flex-wrap">
          {selected.length === 0 ? (
            <div className="text-gray-400 text-sm">{placeholder}</div>
          ) : (
            selected.map((id) => {
              const emp = employees.find((e) => e.employeeId === id)
              return (
                <div key={id} className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1 text-xs">
                  {emp?.profilePictureUrl ? (
                    <img src={emp.profilePictureUrl} alt={emp?.name} className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">{(emp?.name || "U").slice(0, 1)}</div>
                  )}
                  <span className="whitespace-nowrap">{emp?.name ?? id}</span>
                </div>
              )
            })
          )}
        </div>

        <div className="text-sm text-gray-500">{open ? "▲" : "▼"}</div>
      </div>

      {open && (
        <div className="absolute z-40 mt-2 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2">
            {employees.length === 0 ? (
              <div className="text-sm text-gray-500 p-2">No employees</div>
            ) : (
              employees.map((emp) => {
                const checked = selected.includes(emp.employeeId)
                return (
                  <label key={emp.employeeId} className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={() => toggleSelect(emp.employeeId)} />
                    {emp.profilePictureUrl ? (
                      <img src={emp.profilePictureUrl} alt={emp.name} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs">{emp.name.slice(0, 1)}</div>
                    )}
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-xs text-gray-500">{emp.employeeId}</div>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------
   Main EditProjectPage
   ------------------------- */
export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [projectData, setProjectData] = useState<ProjectData | null>(null)

  // categories, departments, clients
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Array<{ id: number; departmentName: string }>>([])
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([])

  // employees for Assigned to
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])

  // controlled selects
  const [categoryId, setCategoryId] = useState<string>("none")
  const [departmentId, setDepartmentId] = useState<string>("none")
  const [clientId, setClientId] = useState<string>("none")

  // status/progress UI state
  const [projectStatus, setProjectStatus] = useState<string | "none">("none")
  const [progressPercent, setProgressPercent] = useState<number>(0)
  const [calculateThroughTasks, setCalculateThroughTasks] = useState<boolean>(false)
  const [addedBy, setAddedBy] = useState<string>("you")

  // modal
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // token helper
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

  // fetch project
  useEffect(() => {
    const fetchProject = async () => {
      setFetching(true)
      try {
        if (!token) {
          setMessage("No token found!")
          setMessageType("error")
          setFetching(false)
          return
        }
        const res = await fetch(`/api/work/project?id=${projectId}`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const errorMsg = typeof (data as any)?.error === "string" ? (data as any).error : (data as any)?.message || "Failed to fetch project"
          setMessage(errorMsg)
          setMessageType("error")
        } else {
          const project = Array.isArray(data) ? data[0] : data
          const assignedStr = Array.isArray(project.assignedEmployeeIds) ? project.assignedEmployeeIds.join(",") : project.assignedEmployeeIds ?? ""

          const pd: ProjectData = {
            projectName: project.projectName || "",
            shortCode: project.shortCode || "",
            startDate: project.startDate ? project.startDate.split("T")[0] : "",
            deadline: project.deadline ? project.deadline.split("T")[0] : "",
            noDeadline: Boolean(project.noDeadline),
            projectCategory: project.projectCategory ? String(project.projectCategory) : "",
            departmentId: project.departmentId || "",
            clientId: project.clientId || "",
            assignedEmployeeIds: assignedStr,
            projectSummary: project.projectSummary || "",
            currency: project.currency || "USD",
            projectBudget: project.projectBudget ?? "",
            hoursEstimate: project.hoursEstimate ?? "",
            tasksNeedAdminApproval: Boolean(project.tasksNeedAdminApproval),
            allowManualTimeLogs: Boolean(project.allowManualTimeLogs),
            projectStatus: project.projectStatus ?? "none",
            progressPercent: typeof project.progressPercent !== "undefined" ? Number(project.progressPercent) : 0,
            calculateProgressThroughTasks: Boolean(project.calculateProgressThroughTasks ?? false),
            addedBy: project.addedBy ?? "you",
          }

          setProjectData(pd)
          setProjectStatus((pd.projectStatus as string) ?? "none")
          setProgressPercent(Number(pd.progressPercent ?? 0))
          setCalculateThroughTasks(Boolean(pd.calculateProgressThroughTasks ?? false))
          setAddedBy(pd.addedBy ?? "you")

          // controlled selects
          setCategoryId(pd.projectCategory ?? "none")
          setDepartmentId(pd.departmentId ?? "none")
          setClientId(pd.clientId ?? "none")

          // set selected employees from assignedEmployeeIds string
          const selectedArr = (pd.assignedEmployeeIds || "").split(",").map((s) => s.trim()).filter(Boolean)
          setSelectedEmployeeIds(selectedArr)
        }
      } catch (err) {
        console.error(err)
        setMessage("Error fetching project")
        setMessageType("error")
      } finally {
        setFetching(false)
      }
    }

    fetchProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // fetch categories, departments, clients, employees
  useEffect(() => {
    if (!token) return

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${GATEWAY}/api/projects/category`, { headers: { Authorization: `Bearer ${token}` } })
        let data: any = await res.json().catch(() => null)
        if (typeof data === "string") {
          try {
            data = JSON.parse(data)
          } catch { }
        }
        const list = Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), name: String(d.name) })) : []
        setCategories(list)
      } catch (err) {
        console.error("Error loading categories", err)
      }
    }

    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${GATEWAY}/admin/departments`, { headers: { Authorization: `Bearer ${token}` } })
        let data: any = await res.json().catch(() => null)
        if (typeof data === "string") {
          try {
            data = JSON.parse(data)
          } catch { }
        }
        const list = Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), departmentName: d.departmentName })) : []
        setDepartments(list)
      } catch (err) {
        console.error("Error loading departments", err)
      }
    }

    const fetchClients = async () => {
      try {
        const res = await fetch(`${GATEWAY}/clients`, { headers: { Authorization: `Bearer ${token}` } })
        let data: any = await res.json().catch(() => null)
        if (typeof data === "string") {
          try {
            data = JSON.parse(data)
          } catch { }
        }
        const list = Array.isArray(data) ? data.map((c: any) => ({ id: Number(c.id), name: c.name || c.company?.companyName || `Client ${c.id}` })) : []
        setClients(list)
      } catch (err) {
        console.error("Error loading clients", err)
      }
    }

    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${GATEWAY}/employee/all?page=0&size=2000`, { headers: { Authorization: `Bearer ${token}` } })
        let data: any = await res.json().catch(() => null)
        // server returns object with content array
        if (typeof data === "string") {
          try {
            data = JSON.parse(data)
          } catch { }
        }
        const content = data?.content ?? data
        const list = Array.isArray(content)
          ? content.map((e: any) => ({
            employeeId: e.employeeId,
            name: e.name || e.employeeId,
            profilePictureUrl: e.profilePictureUrl || "",
          }))
          : []
        setEmployees(list)
      } catch (err) {
        console.error("Error loading employees", err)
      }
    }

    fetchCategories()
    fetchDepartments()
    fetchClients()
    fetchEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const memberOptions = projectData ? Array.from(new Set((projectData.assignedEmployeeIds || "").split(",").map((s) => s.trim()).filter(Boolean))) : []

  const getProgressColor = (p?: number | null) => {
    if (p === undefined || p === null) return "bg-gray-300"
    if (p < 33) return "bg-red-500"
    if (p < 66) return "bg-yellow-400"
    return "bg-green-500"
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setMessageType("")

    const form = e.currentTarget
    const fd = new FormData(form)

    fd.set("noDeadline", (form as any).noDeadline?.checked ? "true" : "false")
    fd.set("tasksNeedAdminApproval", (form as any).tasksNeedAdminApproval?.checked ? "true" : "false")
    fd.set("allowManualTimeLogs", (form as any).allowManualTimeLogs?.checked ? "true" : "false")

    fd.set("projectCategory", categoryId === "none" ? "" : categoryId)
    fd.set("departmentId", departmentId === "none" ? "" : departmentId)
    fd.set("clientId", clientId === "none" ? "" : clientId)

    // write assignedEmployeeIds from selectedEmployeeIds array (comma-separated)
    fd.set("assignedEmployeeIds", selectedEmployeeIds.join(","))

    if (projectStatus && projectStatus !== "none") fd.set("projectStatus", String(projectStatus))
    fd.set("progressPercent", String(Math.max(0, Math.min(100, Math.round(progressPercent || 0)))))
    fd.set("calculateProgressThroughTasks", String(Boolean(calculateThroughTasks)))
    fd.set("addedBy", String(addedBy || ""))

    if (!token) {
      setMessage("No token found!")
      setMessageType("error")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/work/project?id=${projectId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errorMsg = typeof (data as any)?.error === "string" ? (data as any).error : (data as any)?.message || JSON.stringify(data)
        setMessage(errorMsg)
        setMessageType("error")
      } else {
        setMessage("Project updated successfully!")
        setMessageType("success")
        setTimeout(() => router.push("/work/project/all"), 1200)
      }
    } catch (err) {
      console.error(err)
      setMessage("Error submitting form")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Update Project</h1>
          </div>
          <div />
        </div>

        {message && (
          <Alert className={`mb-6 ${messageType === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
            <div className="flex items-center gap-2">
              {messageType === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription className={messageType === "success" ? "text-green-800" : "text-red-800"}>{message}</AlertDescription>
            </div>
          </Alert>
        )}

        {projectData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Details */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-medium">Project Details</h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Short Code *</label>
                  <Input name="shortCode" defaultValue={projectData.shortCode} />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Project Name *</label>
                  <Input name="projectName" defaultValue={projectData.projectName} />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Start Date *</label>
                  <Input type="date" name="startDate" defaultValue={projectData.startDate} />
                </div>

                <div>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-700 mb-2">Deadline *</label>
                      <Input type="date" name="deadline" defaultValue={projectData.deadline} />
                    </div>
                    <div className="pt-6">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" name="noDeadline" defaultChecked={projectData.noDeadline} />
                        <span className="text-xs">There is no project deadline</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Project Category *</label>
                  <div className="flex gap-2">
                    <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="--" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">--</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Department *</label>
                  <Select value={departmentId} onValueChange={(v) => setDepartmentId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">--</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.departmentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Client *</label>
                  <Select value={clientId} onValueChange={(v) => setClientId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">--</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-2">Project Summary</label>
                  <Textarea name="projectSummary" rows={4} defaultValue={projectData.projectSummary} />
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Tasks needs approval by Admin</div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="tasksNeedAdminApproval" value="true" defaultChecked={projectData.tasksNeedAdminApproval === true} />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="tasksNeedAdminApproval" value="false" defaultChecked={projectData.tasksNeedAdminApproval === false} />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>

                {/* Assigned to -> REPLACED with MultiSelectEmployeeDropdown */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Assigned to *</label>

                  {/* Hidden input to submit assignedEmployeeIds (comma-separated) */}
                  <input type="hidden" name="assignedEmployeeIds" value={selectedEmployeeIds.join(",")} />

                  <MultiSelectEmployeeDropdown
                    employees={employees}
                    selected={selectedEmployeeIds}
                    onChange={(ids) => setSelectedEmployeeIds(ids)}
                    placeholder="Select employees"
                  />
                </div>
              </div>
            </div>

            {/* Status + Progress */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-medium">Project Status</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Project Status</label>
                  <Select value={projectStatus} onValueChange={(v) => setProjectStatus(v as string | "none")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">--</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="FINISHED">Finished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Project Progress Status</label>
                  <div className="space-y-3">
                    <div className="relative bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className={`${getProgressColor(progressPercent)} h-3 rounded-full`} style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-semibold text-white">
                        {Math.round(progressPercent)}%
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={100} value={progressPercent} onChange={(e) => setProgressPercent(Number(e.target.value))} className="flex-1" />
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={calculateThroughTasks} onChange={(e) => setCalculateThroughTasks(e.target.checked)} />
                        <span className="text-xs">Calculate Progress through tasks</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Details */}
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-medium">Company Details</h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Currency</label>
                    <Select value={projectData.currency ?? "USD"} onValueChange={() => { }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="USD $" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD $ (US Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR € (Euro)</SelectItem>
                        <SelectItem value="GBP">GBP £ (British Pound)</SelectItem>
                        <SelectItem value="CHF">CHF ₣ (Swiss Franc)</SelectItem>
                        <SelectItem value="SEK">SEK kr</SelectItem>
                        <SelectItem value="NOK">NOK kr</SelectItem>
                        <SelectItem value="DKK">DKK kr</SelectItem>
                        <SelectItem value="PLN">PLN zł</SelectItem>
                        <SelectItem value="CZK">CZK Kč</SelectItem>
                        <SelectItem value="HUF">HUF Ft</SelectItem>
                        <SelectItem value="RON">RON lei</SelectItem>

                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Project Budget</label>
                    <Input type="number" name="projectBudget" defaultValue={projectData.projectBudget} />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Hours Estimate (In Hours)</label>
                    <Input type="number" name="hoursEstimate" defaultValue={projectData.hoursEstimate} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" name="allowManualTimeLogs" defaultChecked={projectData.allowManualTimeLogs} />
                      <span className="text-sm text-gray-600">Allow manual time logs</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 mr-2">Added by*</label>
                    <Select value={addedBy} onValueChange={(v) => setAddedBy(v)}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="You" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="you">You</SelectItem>
                        {memberOptions.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button className="bg-blue-600 text-white" type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        )}

        {/* Category Modal */}
        <ProjectCategoryModal
          open={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onAdded={(newId) => {
            ; (async () => {
              if (!token) return
              try {
                const res = await fetch(`${GATEWAY}/api/projects/category`, { headers: { Authorization: `Bearer ${token}` } })
                let data: any = await res.json().catch(() => null)
                if (typeof data === "string") {
                  try {
                    data = JSON.parse(data)
                  } catch { }
                }
                const list = Array.isArray(data) ? data.map((d: any) => ({ id: Number(d.id), name: String(d.name) })) : []
                setCategories(list)
                if (newId) setCategoryId(newId)
              } catch (err) {
                console.error(err)
              } finally {
                setShowCategoryModal(false)
              }
            })()
          }}
        />
      </div>
    </div>
  )
}

/* Helper (same as earlier) */
function getProgressColor(p?: number | null) {
  if (p === undefined || p === null) return "bg-gray-300"
  if (p < 33) return "bg-red-500"
  if (p < 66) return "bg-yellow-400"
  return "bg-green-500"
}

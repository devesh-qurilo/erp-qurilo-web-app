"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

import { useApplyAdminLeaveMutation } from "./api"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

interface Props {
  open: boolean
  onClose: () => void
}

interface Employee {
  employeeId: string
  name: string
  email: string
  profilePictureUrl: string | null
  role: string
  active: boolean
}

type LeaveDurationType = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF" | "MULTIPLE"

const initialForm = {
  employeeIds: [] as string[],
  leaveType: "",
  durationType: "FULL_DAY" as LeaveDurationType,
  singleDate: "",
  startDate: "",
  endDate: "",
  reason: "",
  status: "PENDING",
}

export default function NewLeaveDrawer({ open, onClose }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [employeeOpen, setEmployeeOpen] = useState(false)
  const [applyError, setApplyError] = useState("")
  const applyLeave = useApplyAdminLeaveMutation({
    onSuccess: () => {
      onClose()
      setFiles([])
      setApplyError("")
      setForm(initialForm)
    },
  })

  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!open) return

    setForm(initialForm)
    setFiles([])
    setEmployeeOpen(false)
    setApplyError("")

    const fetchEmployees = async () => {
      const token = localStorage.getItem("accessToken")
      if (!token || !BASE_URL) return

      try {
        setLoadingEmployees(true)
        const res = await fetch(`${BASE_URL}/employee/all`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          throw new Error("Failed to load employees")
        }

        const data = (await res.json()) as Employee[]
        setEmployees(data.filter((employee) => employee.active))
      } catch (error) {
        setApplyError(error instanceof Error ? error.message : "Failed to load employees")
      } finally {
        setLoadingEmployees(false)
      }
    }

    void fetchEmployees()
  }, [open])

  if (!open) return null

  const handleSubmit = async () => {
    if (!form.employeeIds.length || !form.leaveType || !form.reason.trim()) {
      alert("Please fill all required fields")
      return
    }

    if (form.durationType === "MULTIPLE" && (!form.startDate || !form.endDate)) {
      alert("Please select start and end date")
      return
    }

    if (form.durationType !== "MULTIPLE" && !form.singleDate) {
      alert("Please select date")
      return
    }

    if (
      form.durationType === "MULTIPLE" &&
      form.startDate &&
      form.endDate &&
      form.startDate > form.endDate
    ) {
      alert("End date must be after start date")
      return
    }

    const leaveData: {
      employeeIds: string[]
      leaveType: string
      durationType: string
      reason: string
      status: string
      singleDate?: string
      startDate?: string
      endDate?: string
    } = {
      employeeIds: form.employeeIds,
      leaveType: form.leaveType,
      durationType: form.durationType,
      reason: form.reason.trim(),
      status: form.status,
    }

    if (form.durationType === "MULTIPLE") {
      leaveData.startDate = form.startDate
      leaveData.endDate = form.endDate
    } else {
      leaveData.singleDate = form.singleDate
    }

    try {
      setApplyError("")
      await applyLeave.mutateAsync({
        leaveData,
        files,
      })
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : "Failed to apply leave")
    }
  }

  return (
    <div className="fixed inset-0 z-[10010]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-[83vw] max-w-[82vw] overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">New Leave</h2>
          <button onClick={onClose}>
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-xl border p-6">
            <h3 className="mb-6 font-medium">Assign Leave</h3>

            {applyError ? (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {applyError}
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="relative">
                  <label className="text-sm font-medium">Choose Member *</label>

                  <div className="mt-1 flex flex-wrap gap-2">
                    {form.employeeIds.map((id) => {
                      const employee = employees.find((item) => item.employeeId === id)
                      if (!employee) return null

                      return (
                        <span
                          key={id}
                          className="flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"
                        >
                          {employee.name}
                          <button
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                employeeIds: current.employeeIds.filter((employeeId) => employeeId !== id),
                              }))
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setEmployeeOpen((value) => !value)}
                    className="mt-2 w-full rounded border bg-white px-3 py-2 text-left"
                  >
                    {loadingEmployees
                      ? "Loading employees..."
                      : form.employeeIds.length
                        ? `${form.employeeIds.length} employee selected`
                        : "Select employees"}
                  </button>

                  {employeeOpen && (
                    <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow">
                      {employees.map((employee) => {
                        const checked = form.employeeIds.includes(employee.employeeId)

                        return (
                          <label
                            key={employee.employeeId}
                            className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setForm((current) => ({
                                  ...current,
                                  employeeIds: checked
                                    ? current.employeeIds.filter((id) => id !== employee.employeeId)
                                    : [...current.employeeIds, employee.employeeId],
                                }))
                              }}
                            />

                            {employee.profilePictureUrl ? (
                              <img
                                src={employee.profilePictureUrl}
                                className="h-7 w-7 rounded-full object-cover"
                                alt={employee.name}
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs">
                                {employee.name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="flex flex-col">
                              <span className="text-sm">{employee.name}</span>
                              <span className="text-xs text-gray-500">{employee.role}</span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Leave Type *</label>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.leaveType}
                  onChange={(e) => setForm((current) => ({ ...current, leaveType: e.target.value }))}
                >
                  <option value="">--</option>
                  <option value="SICK">Sick</option>
                  <option value="CASUAL">Casual</option>
                  <option value="EARNED">Earned</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Status *</label>
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={form.status}
                  onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium">Select Duration</label>
              <div className="flex gap-6 text-sm">
                {[
                  ["FULL_DAY", "Single Day"],
                  ["MULTIPLE", "Multiple Days"],
                  ["FIRST_HALF", "First Half"],
                  ["SECOND_HALF", "Second Half"],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.durationType === value}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          durationType: value as LeaveDurationType,
                          singleDate: value === "MULTIPLE" ? "" : current.singleDate,
                          startDate: value === "MULTIPLE" ? current.startDate : "",
                          endDate: value === "MULTIPLE" ? current.endDate : "",
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {form.durationType === "MULTIPLE" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date *</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded border px-3 py-2"
                      value={form.startDate}
                      onChange={(e) => setForm((current) => ({ ...current, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date *</label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded border px-3 py-2"
                      value={form.endDate}
                      onChange={(e) => setForm((current) => ({ ...current, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium">
                    {form.durationType === "FULL_DAY" ? "Single Date *" : "Leave Date *"}
                  </label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={form.singleDate}
                    onChange={(e) => setForm((current) => ({ ...current, singleDate: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium">Reason *</label>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded border px-3 py-2"
                value={form.reason}
                onChange={(e) => setForm((current) => ({ ...current, reason: e.target.value }))}
              />
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium">Documents</label>
              <input
                type="file"
                multiple
                className="mt-2 block w-full text-sm"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={onClose} className="rounded border px-4 py-2">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={applyLeave.isPending}
                className="rounded bg-blue-600 px-5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {applyLeave.isPending ? "Saving..." : "Save Leave"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

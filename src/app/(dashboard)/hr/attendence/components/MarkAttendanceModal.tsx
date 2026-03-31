"use client"

import { type ReactNode, useEffect, useState } from "react"
import {
    useMarkAttendanceByDateMutation,
    useMarkAttendanceByMonthMutation,
    type AttendancePayload,
} from "../api"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

type MarkBy = "DATE" | "MONTH"

interface Employee {
    employeeId: string
    name: string
    profilePictureUrl: string | null
    active: boolean
}

interface FormState {
    employeeId: string
    year: number
    month: number
    clockInTime: string
    clockOutTime: string
    clockInLocation: string
    clockOutLocation: string
    clockInWorkingFrom: string
    clockOutWorkingFrom: string
    late: boolean
    halfDay: boolean
    overwrite: boolean
}

const getInitialForm = (): FormState => ({
    employeeId: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    clockInTime: "09:00",
    clockOutTime: "17:00",
    clockInLocation: "Office",
    clockOutLocation: "Office",
    clockInWorkingFrom: "Office",
    clockOutWorkingFrom: "Office",
    late: false,
    halfDay: false,
    overwrite: false,
})

export default function MarkAttendanceModal({
    open,
    onClose,
}: {
    open: boolean
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [employeeLoading, setEmployeeLoading] = useState(false)
    const [employeeError, setEmployeeError] = useState("")
    const [markBy, setMarkBy] = useState<MarkBy>("MONTH")
    const [dates, setDates] = useState<string[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [employeeOpen, setEmployeeOpen] = useState(false)
    const [form, setForm] = useState<FormState>(getInitialForm)
    const markAttendanceByDate = useMarkAttendanceByDateMutation({
        onSuccess: () => onClose(),
    })
    const markAttendanceByMonth = useMarkAttendanceByMonthMutation({
        onSuccess: () => onClose(),
    })

    useEffect(() => {
        if (!open) return

        setForm(getInitialForm())
        setMarkBy("MONTH")
        setDates([])
        setEmployeeOpen(false)
        setEmployeeError("")

        const fetchEmployees = async () => {
            const token = localStorage.getItem("accessToken")
            if (!token || !BASE_URL) {
                setEmployeeError("Missing authentication or API URL.")
                return
            }

            try {
                setEmployeeLoading(true)
                const res = await fetch(`${BASE_URL}/employee/all`, {
                    headers: { Authorization: `Bearer ${token}` },
                })

                if (!res.ok) {
                    throw new Error("Failed to load employees")
                }

                const data = (await res.json()) as Employee[]
                setEmployees(data.filter((employee) => employee.active))
            } catch (error) {
                setEmployeeError(
                    error instanceof Error ? error.message : "Failed to load employees"
                )
            } finally {
                setEmployeeLoading(false)
            }
        }

        void fetchEmployees()
    }, [open])

    if (!open) return null

    const handleSubmit = async () => {
        if (!form.employeeId) {
            alert("Please select employee")
            return
        }

        if (markBy === "DATE" && !dates.length) {
            alert("Please select date")
            return
        }

        const loggedInEmployeeId = localStorage.getItem("employeeId")

        if (!BASE_URL) {
            alert("Missing API URL")
            return
        }

        try {
            setLoading(true)

            const payloadBase: AttendancePayload = {
                clockInTime: form.clockInTime,
                clockInLocation: form.clockInLocation,
                clockInWorkingFrom: form.clockInWorkingFrom,
                clockOutTime: form.clockOutTime,
                clockOutLocation: form.clockOutLocation,
                clockOutWorkingFrom: form.clockOutWorkingFrom,
                late: form.late,
                halfDay: form.halfDay,
            }

            if (markBy === "DATE") {
                await markAttendanceByDate.mutateAsync({
                    employeeIds: [form.employeeId],
                    dates,
                    payload: payloadBase,
                    overwrite: form.overwrite,
                    markedBy: loggedInEmployeeId ?? undefined,
                })
            } else {
                await markAttendanceByMonth.mutateAsync({
                    year: form.year,
                    month: form.month,
                    employeeIds: [form.employeeId],
                    payload: payloadBase,
                    overwrite: form.overwrite,
                    markedBy: loggedInEmployeeId ?? undefined,
                })
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to mark attendance")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-lg">
                <div className="flex justify-between border-b px-6 py-4">
                    <h2 className="font-semibold">Mark Attendance</h2>
                    <button onClick={onClose}>×</button>
                </div>

                <div className="space-y-6 p-6">
                    <div className="relative">
                        <label className="text-sm font-medium">Employee *</label>

                        <button
                            onClick={() => setEmployeeOpen((value) => !value)}
                            className="mt-1 w-full rounded-lg border px-3 py-2 text-left"
                            type="button"
                        >
                            {form.employeeId
                                ? employees.find((employee) => employee.employeeId === form.employeeId)?.name
                                : employeeLoading
                                    ? "Loading employees..."
                                    : "Select employee"}
                        </button>

                        {employeeError && (
                            <p className="mt-2 text-xs text-red-600">{employeeError}</p>
                        )}

                        {employeeOpen && !employeeLoading && (
                            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow">
                                {employees.map((employee) => (
                                    <div
                                        key={employee.employeeId}
                                        onClick={() => {
                                            setForm((current) => ({
                                                ...current,
                                                employeeId: employee.employeeId,
                                            }))
                                            setEmployeeOpen(false)
                                        }}
                                        className="flex cursor-pointer gap-2 px-3 py-2 hover:bg-gray-100"
                                    >
                                        {employee.profilePictureUrl ? (
                                            <img
                                                src={employee.profilePictureUrl}
                                                className="h-6 w-6 rounded-full object-cover"
                                                alt={employee.name}
                                            />
                                        ) : (
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs">
                                                {employee.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span>{employee.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-6 text-sm">
                        <span className="font-medium">Mark Attendance by</span>
                        <label>
                            <input
                                type="radio"
                                checked={markBy === "MONTH"}
                                onChange={() => setMarkBy("MONTH")}
                            />{" "}
                            Month
                        </label>
                        <label>
                            <input
                                type="radio"
                                checked={markBy === "DATE"}
                                onChange={() => setMarkBy("DATE")}
                            />{" "}
                            Date
                        </label>
                    </div>

                    {markBy === "MONTH" && (
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Year">
                                <input
                                    type="number"
                                    value={form.year}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            year: Number(e.target.value),
                                        }))
                                    }
                                    className="rounded-xl border px-4 py-2"
                                />
                            </Field>

                            <Field label="Month">
                                <select
                                    value={form.month}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            month: Number(e.target.value),
                                        }))
                                    }
                                    className="rounded-xl border px-4 py-2"
                                >
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <option key={i} value={i + 1}>
                                            {new Date(0, i).toLocaleString("default", { month: "long" })}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    )}

                    {markBy === "DATE" && (
                        <Field label="Select Date">
                            <input
                                type="date"
                                onChange={(e) => setDates(e.target.value ? [e.target.value] : [])}
                                className="rounded-xl border px-4 py-2"
                            />
                        </Field>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Clock In">
                            <input
                                type="time"
                                value={form.clockInTime}
                                onChange={(e) =>
                                    setForm((current) => ({
                                        ...current,
                                        clockInTime: e.target.value,
                                    }))
                                }
                                className="rounded-xl border px-4 py-2"
                            />
                        </Field>

                        <Field label="Clock Out">
                            <input
                                type="time"
                                value={form.clockOutTime}
                                onChange={(e) =>
                                    setForm((current) => ({
                                        ...current,
                                        clockOutTime: e.target.value,
                                    }))
                                }
                                className="rounded-xl border px-4 py-2"
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Radio
                            label="Late"
                            value={form.late}
                            onChange={(value) =>
                                setForm((current) => ({ ...current, late: value }))
                            }
                        />
                        <Radio
                            label="Half Day"
                            value={form.halfDay}
                            onChange={(value) =>
                                setForm((current) => ({ ...current, halfDay: value }))
                            }
                        />
                    </div>

                    <label className="flex gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.overwrite}
                            onChange={(e) =>
                                setForm((current) => ({
                                    ...current,
                                    overwrite: e.target.checked,
                                }))
                            }
                        />
                        Attendance Overwrite
                    </label>
                </div>

                <div className="flex justify-end gap-4 border-t px-6 py-4">
                    <button onClick={onClose} className="rounded border px-4 py-2">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || employeeLoading || markAttendanceByDate.isPending || markAttendanceByMonth.isPending}
                        className="rounded bg-blue-600 px-6 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Update"}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Field({
    label,
    children,
}: {
    label: string
    children: ReactNode
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">{label}</label>
            {children}
        </div>
    )
}

function Radio({
    label,
    value,
    onChange,
}: {
    label: string
    value: boolean
    onChange: (value: boolean) => void
}) {
    return (
        <div className="flex gap-4 text-sm">
            <span>{label}</span>
            <label>
                <input type="radio" checked={value} onChange={() => onChange(true)} /> Yes
            </label>
            <label>
                <input type="radio" checked={!value} onChange={() => onChange(false)} /> No
            </label>
        </div>
    )
}

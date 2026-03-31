"use client"

import { useEffect, useState } from "react"
import {
    useDeleteAttendanceMutation,
    useEditAttendanceMutation,
    type AttendanceRecord,
} from "../api"

interface EditFormState {
    clockInTime: string
    clockInLocation: string
    clockInWorkingFrom: string
    clockOutTime: string
    clockOutLocation: string
    clockOutWorkingFrom: string
    late: boolean
    halfDay: boolean
}

export default function AttendanceDetailModal({
    open,
    onClose,
    data,
}: {
    open: boolean
    onClose: () => void
    data: AttendanceRecord | null
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<"view" | "edit">("view")
    const deleteAttendance = useDeleteAttendanceMutation({
        onSuccess: () => onClose(),
    })

    useEffect(() => {
        if (!open) {
            setMenuOpen(false)
            setMode("view")
        }
    }, [open, data])

    if (!open || !data) return null

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this attendance?")) return

        try {
            setLoading(true)
            await deleteAttendance.mutateAsync({
                employeeId: data.employeeId,
                date: data.date,
            })
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to delete attendance")
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (time?: string | null) =>
        time
            ? new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })
            : "--"

    const duration =
        data.clockInTime && data.clockOutTime
            ? calcDuration(data.clockInTime, data.clockOutTime)
            : "—"

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-lg">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-lg font-semibold">
                        {mode === "view" ? "Attendance Details" : "Edit Attendance"}
                    </h2>

                    <div className="relative flex items-center gap-3">
                        {mode === "view" && (
                            <>
                                <button
                                    onClick={() => setMenuOpen((value) => !value)}
                                    className="rounded px-2 text-xl hover:bg-gray-100"
                                >
                                    ⋮
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 top-10 z-10 w-32 rounded-lg border bg-white shadow-md">
                                        <button
                                            onClick={() => {
                                                setMenuOpen(false)
                                                setMode("edit")
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50"
                                        >
                                            ✏ Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={loading}
                                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <button onClick={onClose} className="text-2xl">
                            ×
                        </button>
                    </div>
                </div>

                {mode === "view" ? (
                    <div className="grid grid-cols-2 gap-6 p-6">
                        <div className="space-y-4 rounded-lg border p-4">
                            <h3 className="font-medium">
                                Date - {new Date(data.date).toLocaleDateString()} (
                                {new Date(data.date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                })}
                                )
                            </h3>

                            <Info label="Employee" value={data.employeeName} />
                            <Info label="Clock In" value={formatTime(data.clockInTime)} />

                            <div className="flex justify-center py-6">
                                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-blue-500 text-lg font-semibold">
                                    {duration}
                                </div>
                            </div>

                            <Info label="Clock Out" value={formatTime(data.clockOutTime)} />
                            <Info label="Marked By" value={data.markedByName || "--"} />
                        </div>

                        <div className="space-y-6 rounded-lg border p-4">
                            <Activity
                                title="Clock In"
                                time={formatTime(data.clockInTime)}
                                location={data.clockInLocation}
                                workingFrom={data.clockInWorkingFrom}
                                late={data.late}
                            />

                            <Activity
                                title="Clock Out"
                                time={data.clockOutTime ? formatTime(data.clockOutTime) : "Did not clock out"}
                                location={data.clockOutLocation}
                                workingFrom={data.clockOutWorkingFrom}
                            />

                            <div className="flex flex-wrap gap-2 pt-2 text-sm">
                                {data.holiday && badge("Holiday", "⭐")}
                                {data.leave && badge("Leave", "⛔")}
                                {data.late && badge("Late", "⏰")}
                                {data.halfDay && badge("Half Day", "½")}
                                {data.isPresent && badge("Present", "✔")}
                                {!data.isPresent && !data.leave && !data.holiday && badge("Absent", "—")}
                            </div>
                        </div>
                    </div>
                ) : (
                    <EditAttendanceForm
                        data={data}
                        onCancel={() => setMode("view")}
                        onSaved={() => onClose()}
                    />
                )}
            </div>
        </div>
    )
}

function EditAttendanceForm({
    data,
    onCancel,
    onSaved,
}: {
    data: AttendanceRecord
    onCancel: () => void
    onSaved: () => void
}) {
    const [saving, setSaving] = useState(false)
    const editAttendance = useEditAttendanceMutation({
        onSuccess: () => onSaved(),
    })
    const [form, setForm] = useState<EditFormState>({
        clockInTime: data.clockInTime || "",
        clockInLocation: data.clockInLocation || "",
        clockInWorkingFrom: data.clockInWorkingFrom || "",
        clockOutTime: data.clockOutTime || "",
        clockOutLocation: data.clockOutLocation || "",
        clockOutWorkingFrom: data.clockOutWorkingFrom || "",
        late: Boolean(data.late),
        halfDay: Boolean(data.halfDay),
    })

    const handleSave = async () => {
        const loggedInEmployeeId = localStorage.getItem("employeeId")

        try {
            setSaving(true)
            await editAttendance.mutateAsync({
                employeeId: data.employeeId,
                date: data.date,
                overwrite: true,
                markedBy: loggedInEmployeeId ?? undefined,
                ...form,
            })
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update attendance")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Clock In Time"
                    type="time"
                    value={form.clockInTime}
                    onChange={(value) => setForm((current) => ({ ...current, clockInTime: value }))}
                />

                <Input
                    label="Clock Out Time"
                    type="time"
                    value={form.clockOutTime}
                    onChange={(value) => setForm((current) => ({ ...current, clockOutTime: value }))}
                />

                <Input
                    label="Clock In Location"
                    value={form.clockInLocation}
                    onChange={(value) => setForm((current) => ({ ...current, clockInLocation: value }))}
                />

                <Input
                    label="Clock Out Location"
                    value={form.clockOutLocation}
                    onChange={(value) => setForm((current) => ({ ...current, clockOutLocation: value }))}
                />

                <Input
                    label="Working From (In)"
                    value={form.clockInWorkingFrom}
                    onChange={(value) =>
                        setForm((current) => ({ ...current, clockInWorkingFrom: value }))
                    }
                />

                <Input
                    label="Working From (Out)"
                    value={form.clockOutWorkingFrom}
                    onChange={(value) =>
                        setForm((current) => ({ ...current, clockOutWorkingFrom: value }))
                    }
                />
            </div>

            <div className="flex gap-6">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={form.late}
                        onChange={(e) =>
                            setForm((current) => ({ ...current, late: e.target.checked }))
                        }
                    />
                    Late
                </label>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={form.halfDay}
                        onChange={(e) =>
                            setForm((current) => ({ ...current, halfDay: e.target.checked }))
                        }
                    />
                    Half Day
                </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button onClick={onCancel} className="rounded border px-4 py-2">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || editAttendance.isPending}
                    className="rounded bg-blue-600 px-4 py-2 text-white"
                >
                    Save Changes
                </button>
            </div>
        </div>
    )
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-gray-50 p-3">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    )
}

function Activity({
    title,
    time,
    location,
    workingFrom,
    late,
}: {
    title: string
    time: string
    location?: string | null
    workingFrom?: string | null
    late?: boolean
}) {
    return (
        <div>
            <div className="font-medium">{title}</div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>⏱ {time}</span>
                {location ? <span>📍 {location}</span> : null}
                {workingFrom ? <span>({workingFrom})</span> : null}
                {late ? <span className="text-red-500">⚠ Late</span> : null}
            </div>
        </div>
    )
}

function badge(label: string, icon: string) {
    return (
        <span className="flex items-center gap-1 rounded border px-2 py-1 text-xs">
            {icon} {label}
        </span>
    )
}

function Input({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string
    value: string
    onChange: (value: string) => void
    type?: string
}) {
    return (
        <div>
            <label className="text-sm text-gray-500">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded border px-3 py-2"
            />
        </div>
    )
}

function calcDuration(start: string, end: string) {
    const startDate = new Date(`1970-01-01T${start}`)
    const endDate = new Date(`1970-01-01T${end}`)
    const diffInSeconds = Math.max(0, (endDate.getTime() - startDate.getTime()) / 1000)
    const hours = Math.floor(diffInSeconds / 3600)
    const minutes = Math.floor((diffInSeconds % 3600) / 60)
    return `${hours}h ${minutes}m`
}

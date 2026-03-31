"use client"

import { useState } from "react"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

export default function MarkAttendanceModal({
    open,
    onClose,
    // employeeId,
}: {
    open: boolean
    onClose: () => void
    // employeeId: string
}) {
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        clockInTime: "09:00:00",
        clockOutTime: "17:00:00",
        clockInLocation: "Office",
        clockOutLocation: "Office",
        clockInWorkingFrom: "Office",
        clockOutWorkingFrom: "Office",
        late: false,
        halfDay: false,
        overwrite: false,
        employeeId: ''
    })

    if (!open) return null

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("accessToken")
            if (!token) throw new Error("No token")

            const payload = {
                year: form.year,
                month: form.month,
                employeeIds: form.employeeId,
                payload: {
                    clockInTime: form.clockInTime,
                    clockInLocation: form.clockInLocation,
                    clockInWorkingFrom: form.clockInWorkingFrom,
                    clockOutTime: form.clockOutTime,
                    clockOutLocation: form.clockOutLocation,
                    clockOutWorkingFrom: form.clockOutWorkingFrom,
                    late: form.late,
                    halfDay: form.halfDay,
                },
                overwrite: form.overwrite,
                markedBy: form.employeeId, // or logged-in user id
            }

            const res = await fetch(
                `${BASE_URL}/employee/attendance/mark/month`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            )

            if (!res.ok) throw new Error("Failed to mark attendance")

            onClose()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg">

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">Mark Attendance</h2>
                    <button onClick={onClose} className="text-xl">×</button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-6">

                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-medium text-sm">Attendance Details</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Year *">
                                <input
                                    type="number"
                                    value={form.year}
                                    onChange={(e) =>
                                        setForm({ ...form, year: Number(e.target.value) })
                                    }
                                    className="input border p-2 rounded-xl"
                                />
                            </Field>

                            <Field label="Month *">
                                <select
                                    value={form.month}
                                    onChange={(e) =>
                                        setForm({ ...form, month: Number(e.target.value) })
                                    }
                                    className="input border p-2 rounded-xl"
                                >
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <option key={i} value={i + 1}>
                                            {new Date(0, i).toLocaleString("default", {
                                                month: "long",
                                            })}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Clock In *">
                                <input
                                    type="time"
                                    value={form.clockInTime}
                                    onChange={(e) =>
                                        setForm({ ...form, clockInTime: e.target.value })
                                    }
                                    className="input border p-2 rounded-xl"
                                />
                            </Field>

                            <Field label="Clock Out *">
                                <input
                                    type="time"
                                    value={form.clockOutTime}
                                    onChange={(e) =>
                                        setForm({ ...form, clockOutTime: e.target.value })
                                    }
                                    className="input border p-2 rounded-xl"
                                />
                            </Field>

                            <Field label="Location *">
                                <select
                                    value={form.clockInLocation}
                                    onChange={(e) =>
                                        setForm({ ...form, clockInLocation: e.target.value })
                                    }
                                    className="input border p-2 rounded-xl"
                                >
                                    <option>Office</option>
                                    <option>Remote</option>
                                </select>
                            </Field>

                            <Field label="Working From *">
                                <select
                                    value={form.clockInWorkingFrom}
                                    onChange={(e) =>
                                        setForm({ ...form, clockInWorkingFrom: e.target.value })
                                    }
                                    className="input border p-2 rounded-xl"
                                >
                                    <option>Office</option>
                                    <option>Home</option>
                                </select>
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Radio
                                label="Late"
                                value={form.late}
                                onChange={(v) => setForm({ ...form, late: v })}
                            />
                            <Radio
                                label="Half Day"
                                value={form.halfDay}
                                onChange={(v) => setForm({ ...form, halfDay: v })}
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.overwrite}
                                onChange={(e) =>
                                    setForm({ ...form, overwrite: e.target.checked })
                                }
                            />
                            Attendance Overwrite
                        </label>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-4 px-6 py-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded"
                    >
                        {loading ? "Updating..." : "Update"}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ---------------- HELPERS ---------------- */

const Field = ({ label, children }: any) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-600">{label}</label>
        {children}
    </div>
)

const Radio = ({ label, value, onChange }: any) => (
    <div className="flex items-center gap-4">
        <span className="text-sm">{label}</span>
        <label className="flex gap-1">
            <input
                type="radio"
                checked={value}
                onChange={() => onChange(true)}
            />
            Yes
        </label>
        <label className="flex gap-1">
            <input
                type="radio"
                checked={!value}
                onChange={() => onChange(false)}
            />
            No
        </label>
    </div>
)

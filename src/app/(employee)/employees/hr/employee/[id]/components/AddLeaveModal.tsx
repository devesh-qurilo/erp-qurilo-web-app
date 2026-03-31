"use client"

import { useState } from "react"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

export default function AddLeaveModal({
    open,
    onClose,
    employeeId,
    onSuccess,
}: {
    open: boolean
    onClose: () => void
    employeeId: string
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState<FileList | null>(null)

    const [form, setForm] = useState({
        leaveType: "SICK",
        durationType: "FULL_DAY",
        singleDate: "",
        reason: "",
    })

    if (!open) return null

    const submit = async () => {
        setLoading(true)
        const token = localStorage.getItem("accessToken")

        const leaveData = {
            employeeIds: [employeeId],
            leaveType: form.leaveType,
            durationType: form.durationType,
            singleDate: form.singleDate,
            reason: form.reason,
            status: "APPROVED",
        }

        const fd = new FormData()
        fd.append("leaveData", JSON.stringify(leaveData))
        if (files) Array.from(files).forEach(f => fd.append("documents", f))

        await fetch(`${BASE_URL}/employee/api/leaves/admin/apply`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
        })

        setLoading(false)
        onSuccess()
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white w-[420px] rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Apply Leave</h3>

                <select
                    className="border rounded px-3 py-2 w-full"
                    value={form.leaveType}
                    onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                >
                    <option>SICK</option>
                    <option>CASUAL</option>
                    <option>EARNED</option>
                </select>

                <input
                    type="date"
                    className="border rounded px-3 py-2 w-full"
                    value={form.singleDate}
                    onChange={(e) => setForm({ ...form, singleDate: e.target.value })}
                />

                <textarea
                    placeholder="Reason"
                    className="border rounded px-3 py-2 w-full"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />

                <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                />

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded">
                        Cancel
                    </button>
                    <button
                        disabled={loading}
                        onClick={submit}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        {loading ? "Saving…" : "Apply"}
                    </button>
                </div>
            </div>
        </div>
    )
}

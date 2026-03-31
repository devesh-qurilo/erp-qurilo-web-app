"use client"

import { useState } from "react"
import useSWR from "swr"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

interface Department {
    id: number
    departmentName: string
}

interface Designation {
    id: number
    designationName: string
}

export default function AddPromotionModal({
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
    const [form, setForm] = useState({
        oldDepartmentId: "",
        oldDesignationId: "",
        newDepartmentId: "",
        newDesignationId: "",
        remarks: "",
        isPromotion: true,
        sendNotification: true,
    })

    const [loading, setLoading] = useState(false)

    const { data: departments } = useSWR<Department[]>(
        `${BASE_URL}/admin/departments`,
        fetcher
    )

    const { data: designations } = useSWR<Designation[]>(
        `${BASE_URL}/admin/designations`,
        fetcher
    )

    if (!open) return null

    const handleSubmit = async () => {
        setLoading(true)
        const token = localStorage.getItem("accessToken")

        await fetch(
            `${BASE_URL}/admin/api/promotions/employee/${employeeId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    oldDepartmentId: Number(form.oldDepartmentId),
                    oldDesignationId: Number(form.oldDesignationId),
                    newDepartmentId: Number(form.newDepartmentId),
                    newDesignationId: Number(form.newDesignationId),
                    isPromotion: true,
                    sendNotification: true,
                    remarks: form.remarks,
                }),
            }
        )

        setLoading(false)
        onSuccess()
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Add Promotion</h2>

                {/* OLD DEPARTMENT */}
                <select
                    className="border rounded px-3 py-2 w-full"
                    value={form.oldDepartmentId}
                    onChange={(e) =>
                        setForm({ ...form, oldDepartmentId: e.target.value })
                    }
                >
                    <option value="">Old Department</option>
                    {departments?.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.departmentName}
                        </option>
                    ))}
                </select>

                {/* OLD DESIGNATION */}
                <select
                    className="border rounded px-3 py-2 w-full"
                    value={form.oldDesignationId}
                    onChange={(e) =>
                        setForm({ ...form, oldDesignationId: e.target.value })
                    }
                >
                    <option value="">Old Designation</option>
                    {designations?.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.designationName}
                        </option>
                    ))}
                </select>

                {/* NEW DEPARTMENT */}
                <select
                    className="border rounded px-3 py-2 w-full"
                    value={form.newDepartmentId}
                    onChange={(e) =>
                        setForm({ ...form, newDepartmentId: e.target.value })
                    }
                >
                    <option value="">New Department</option>
                    {departments?.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.departmentName}
                        </option>
                    ))}
                </select>

                {/* NEW DESIGNATION */}
                <select
                    className="border rounded px-3 py-2 w-full"
                    value={form.newDesignationId}
                    onChange={(e) =>
                        setForm({ ...form, newDesignationId: e.target.value })
                    }
                >
                    <option value="">New Designation</option>
                    {designations?.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.designationName}
                        </option>
                    ))}
                </select>

                {/* REMARKS */}
                <textarea
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Remarks"
                    value={form.remarks}
                    onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                    }
                />

                {/* ACTIONS */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={loading}
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        {loading ? "Saving..." : "Save Promotion"}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* fetcher */
async function fetcher(url: string) {
    const token = localStorage.getItem("accessToken")
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Fetch failed")
    return res.json()
}

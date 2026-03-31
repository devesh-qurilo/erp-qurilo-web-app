"use client"

import useSWR from "swr"
import { useState } from "react"
import AddLeaveModal from "./AddLeaveModal"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

interface Leave {
    id: number
    leaveType: string
    durationType: string
    startDate: string | null
    endDate: string | null
    singleDate: string | null
    reason: string
    status: string
    approvedByName: string | null
    isPaid: boolean
    createdAt: string
}

const fetcher = async (url: string) => {
    const token = localStorage.getItem("accessToken")
    if (!token) throw new Error("No token")

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch leaves")
    return res.json()
}

export default function EmployeeLeaveTable({ employeeId }: { employeeId: string }) {
    const [open, setOpen] = useState(false)

    const { data, mutate, isLoading } = useSWR<Leave[]>(
        `${BASE_URL}/employee/api/leaves/employee/${employeeId}`,
        fetcher,
        { revalidateOnFocus: false }
    )

    const deleteLeave = async (id: number) => {
        if (!confirm("Delete this leave?")) return
        const token = localStorage.getItem("accessToken")

        await fetch(`${BASE_URL}/employee/api/leaves/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        })

        mutate()
    }

    if (isLoading) return <div className="text-sm">Loading leaves…</div>

    return (
        <div className="bg-white border rounded-lg p-4 space-y-4">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h2 className="font-semibold">Leaves</h2>
                <button
                    onClick={() => setOpen(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                    + Add Leave
                </button>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Duration</th>
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Reason</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Paid</th>
                            <th className="px-3 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((l) => (
                            <tr key={l.id} className="border-t">
                                <td className="px-3 py-2">{l.leaveType}</td>
                                <td className="px-3 py-2">{l.durationType}</td>
                                <td className="px-3 py-2">
                                    {l.singleDate ||
                                        (l.startDate && `${l.startDate} → ${l.endDate}`)}
                                </td>
                                <td className="px-3 py-2">{l.reason}</td>
                                <td className="px-3 py-2">
                                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                                        {l.status}
                                    </span>
                                </td>
                                <td className="px-3 py-2">{l.isPaid ? "Yes" : "No"}</td>
                                <td className="px-3 py-2">
                                    <button
                                        onClick={() => deleteLeave(l.id)}
                                        className="text-red-600 text-xs"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {!data?.length && (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-400">
                                    No leaves found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AddLeaveModal
                open={open}
                onClose={() => setOpen(false)}
                employeeId={employeeId}
                onSuccess={mutate}
            />
        </div>
    )
}

"use client"

import useSWR from "swr"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

interface LeaveQuota {
    id: number
    leaveType: string
    totalLeaves: number
    monthlyLimit: number
    totalTaken: number
    overUtilized: number
    remainingLeaves: number
}

const fetcher = async (url: string) => {
    const token = localStorage.getItem("accessToken")
    if (!token) throw new Error("No token")

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) throw new Error("Failed to fetch leave quota")
    return res.json()
}

export default function LeaveQuotaTable({
    employeeId,
}: {
    employeeId: string
}) {
    const { data, isLoading, error } = useSWR<LeaveQuota[]>(
        `${BASE_URL}/employee/leave-quota/employee/${employeeId}`,
        fetcher,
        { revalidateOnFocus: false }
    )

    if (isLoading) {
        return <div className="text-sm text-gray-500">Loading leave quota…</div>
    }

    if (error) {
        return <div className="text-sm text-red-600">Failed to load leave quota</div>
    }

    if (!data || data.length === 0) {
        return <div className="text-sm text-gray-500">No leave quota found</div>
    }

    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            <h3 className="px-4 py-3 font-semibold text-sm border-b">
                Leaves Quota
            </h3>

            <table className="min-w-full text-sm">
                <thead className="bg-blue-50 text-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left">Leave Type</th>
                        <th className="px-4 py-2 text-center">No. of Leaves</th>
                        <th className="px-4 py-2 text-center">Monthly Limit</th>
                        <th className="px-4 py-2 text-center">Total Leaves Taken</th>
                        <th className="px-4 py-2 text-center">Over Utilized</th>
                        <th className="px-4 py-2 text-center">Remaining Leaves</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((row) => (
                        <tr key={row.id} className="border-t">
                            <td className="px-4 py-2 font-medium capitalize">
                                <span
                                    className={`inline-flex items-center gap-2`}
                                >
                                    <span
                                        className={`h-2 w-2 rounded-full ${row.leaveType === "EARNED"
                                                ? "bg-green-500"
                                                : row.leaveType === "SICK"
                                                    ? "bg-red-500"
                                                    : "bg-blue-500"
                                            }`}
                                    />
                                    {row.leaveType.toLowerCase()}
                                </span>
                            </td>

                            <td className="px-4 py-2 text-center">
                                {row.totalLeaves ?? "--"}
                            </td>

                            <td className="px-4 py-2 text-center">
                                {row.monthlyLimit ?? "--"}
                            </td>

                            <td className="px-4 py-2 text-center">
                                {row.totalTaken ?? "--"}
                            </td>

                            <td className="px-4 py-2 text-center">
                                {row.overUtilized ?? "--"}
                            </td>

                            <td className="px-4 py-2 text-center font-semibold">
                                {row.remainingLeaves ?? "--"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

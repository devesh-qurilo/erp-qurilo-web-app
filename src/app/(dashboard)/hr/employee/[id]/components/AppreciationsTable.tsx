"use client"

import useSWR from "swr"
import { format } from "date-fns";


const BASE_URL = process.env.NEXT_PUBLIC_MAIN

interface Appreciation {
    id: number
    awardTitle: string
    givenToEmployeeId: string
    givenToEmployeeName: string
    date: string
    summary: string
    photoUrl: string | null
}

const fetcher = async (url: string) => {
    const token = localStorage.getItem("accessToken")
    if (!token) throw new Error("No token")

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) throw new Error("Failed to fetch appreciations")
    return res.json()
}

export default function AppreciationsTable({
    employeeId,
}: {
    employeeId: string
}) {
    const { data, isLoading, error } = useSWR<Appreciation[]>(
        employeeId
            ? `${BASE_URL}/employee/appreciations/employee/${employeeId}`
            : null,
        fetcher,
        { revalidateOnFocus: false }
    )

    if (isLoading) {
        return <div className="text-sm text-gray-500">Loading appreciations…</div>
    }

    if (error) {
        return <div className="text-sm text-red-600">Failed to load appreciations</div>
    }

    if (!data || data.length === 0) {
        return <div className="text-sm text-gray-500">No appreciations found</div>
    }

    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            <h3 className="px-4 py-3 text-sm font-semibold border-b">
                Appreciations
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-blue-50 text-gray-600">
                        <tr>
                            <th className="px-4 py-2 text-left">Given To</th>
                            <th className="px-4 py-2 text-left">Award Name</th>
                            {/* <th className="px-4 py-2 text-left">Summary</th> */}
                            <th className="px-4 py-2 text-left">Given On</th>
                            {/* <th className="px-4 py-2 text-left">Photo</th> */}
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                {/* Given To */}
                                <td className="px-4 py-3">
                                    <div className="font-medium">
                                        {item.givenToEmployeeName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {item.givenToEmployeeId}
                                    </div>
                                </td>

                                {/* Award */}
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1">
                                        🏅 {item.awardTitle}
                                    </span>
                                </td>

                                {/* Summary */}
                                {/* <td className="px-4 py-3 text-gray-600">
                                    {item.summary || "--"}
                                </td> */}

                                {/* Date */}
                                <td className="px-4 py-3">
                                    {/* {item.date
                                        ? new Date(item.date).toLocaleDateString()
                                        : "--"} */}
  {item.date
    ? format(new Date(item.date), "dd-MM-yyyy")
    : "--"}

                                </td>

                                {/* Photo */}
                                {/* <td className="px-4 py-3">
                                    {item.photoUrl ? (
                                        <a
                                            href={item.photoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline"
                                        >
                                            View
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">--</span>
                                    )}
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

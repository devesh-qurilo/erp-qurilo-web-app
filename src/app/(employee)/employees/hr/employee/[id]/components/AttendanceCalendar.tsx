"use client"

import useSWR from "swr"
import { useState, useMemo } from "react"
import MarkAttendanceModal from "./MarkAttendanceModal"
import AttendanceDetailModal from "./AttendanceDetailModal"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

interface Attendance {
    date: string
    status: "PRESENT" | "ABSENT" | "HOLIDAY" | "LEAVE"
    late: boolean
    halfDay: boolean
}

const fetcher = async (url: string) => {
    const token = localStorage.getItem("accessToken")
    if (!token) throw new Error("No token")

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) throw new Error("Failed to fetch attendance")
    return res.json()
}

const STATUS_ICON: Record<string, JSX.Element> = {
    PRESENT: <span className="text-green-600">✔</span>,
    HOLIDAY: <span className="text-yellow-500">★</span>,
    LEAVE: <span className="text-red-500">⛔</span>,
}

export default function AttendanceCalendar({
    employeeId,
}: {
    employeeId: string
}) {
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth() + 1)
    const [year, setYear] = useState(today.getFullYear())
    const [open, setOpen] = useState(false)
    const [selectedDay, setSelectedDay] = useState<any>(null)
    const [openDetail, setOpenDetail] = useState(false)


    const { data, isLoading } = useSWR<Attendance[]>(
        `${BASE_URL}/employee/attendance/${employeeId}/all-saved`,
        fetcher,
        { revalidateOnFocus: false }
    )

    const attendanceMap = useMemo(() => {
        const map: Record<string, Attendance> = {}
        data?.forEach((a) => {
            map[a.date] = a
        })
        return map
    }, [data])

    const daysInMonth = new Date(year, month, 0).getDate()

    if (isLoading) {
        return <div className="text-sm text-gray-500">Loading attendance…</div>
    }

    return (
        <div className="bg-white border rounded-lg p-4 space-y-4">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setOpen(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                    + Mark Attendance
                </button>

                <MarkAttendanceModal
                    open={open}
                    onClose={() => setOpen(false)}
                    employeeId={employeeId}
                />

                <div className="flex items-center gap-2 text-sm">
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="border rounded px-2 py-1"
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i} value={i + 1}>
                                {new Date(0, i).toLocaleString("default", { month: "long" })}
                            </option>
                        ))}
                    </select>

                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border rounded px-2 py-1"
                    >
                        {[2024, 2025, 2026].map((y) => (
                            <option key={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* LEGEND */}
            <div className="flex gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">★ Holiday</span>
                <span className="flex items-center gap-1">✔ Present</span>
                <span className="flex items-center gap-1">⛔ Leave</span>
                <span className="flex items-center gap-1">⏰ Late</span>
                <span className="flex items-center gap-1">½ Half Day</span>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="min-w-full border text-xs">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left">Employee</th>
                            {Array.from({ length: daysInMonth }).map((_, i) => (
                                <th key={i} className="px-2 py-2 text-center">
                                    {i + 1}
                                </th>
                            ))}
                            <th className="px-3 py-2">Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <td className="px-3 py-2 font-medium">
                                {employeeId}
                            </td>

                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = String(i + 1).padStart(2, "0")
                                const dateKey = `${year}-${String(month).padStart(2, "0")}-${day}`
                                const att = attendanceMap[dateKey]

                                return (
                                    <td key={i} className="px-2 py-2 text-center">
                                        {att ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedDay(att)
                                                    setOpenDetail(true)
                                                }}
                                                className="flex flex-col items-center text-xs cursor-pointer hover:scale-110 transition"
                                            >
                                                {STATUS_ICON[att.status] || "--"}
                                                {att.late && <span>⏰</span>}
                                                {att.halfDay && <span>½</span>}
                                            </button>

                                        ) : (
                                            "--"
                                        )}
                                    </td>
                                )
                            })}

                            <td className="px-3 py-2 text-center font-semibold">
                                {
                                    Object.values(attendanceMap).filter(
                                        (a) =>
                                            a.status === "PRESENT" &&
                                            a.date.startsWith(`${year}-${String(month).padStart(2, "0")}`)
                                    ).length
                                }
                                /{daysInMonth}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <AttendanceDetailModal
                open={openDetail}
                onClose={() => setOpenDetail(false)}
                data={selectedDay}
            />

        </div>
    )
}

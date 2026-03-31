"use client"

import { type ReactNode, useMemo, useState } from "react"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

import AttendanceDetailModal from "./AttendanceDetailModal"
import MarkAttendanceModal from "./MarkAttendanceModal"
import { useAdminAttendanceQuery, type AttendanceRecord } from "../api"

type AttendanceStatus = "PRESENT" | "ABSENT" | "HOLIDAY" | "LEAVE"

const STATUS_ICON: Record<AttendanceStatus, ReactNode> = {
    PRESENT: <span className="text-green-600">✔</span>,
    HOLIDAY: <span className="text-yellow-500">★</span>,
    LEAVE: <span className="text-red-500">⛔</span>,
    ABSENT: <span className="text-gray-400">—</span>,
}

const toDateKey = (value: string | Date) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10)
}

const getDisplayStatus = (attendance: AttendanceRecord): AttendanceStatus => {
    if (attendance.holiday) return "HOLIDAY"
    if (attendance.leave) return "LEAVE"
    return attendance.status
}

export default function AttendanceCalendar() {
    const today = new Date()

    const [month, setMonth] = useState(today.getMonth() + 1)
    const [year, setYear] = useState(today.getFullYear())
    const [open, setOpen] = useState(false)
    const [selectedDay, setSelectedDay] = useState<AttendanceRecord | null>(null)
    const [openDetail, setOpenDetail] = useState(false)

    const { data = [], error, isLoading } = useAdminAttendanceQuery()

    const groupedAttendance = useMemo(() => {
        const map: Record<
            string,
            {
                employeeName: string
                profilePictureUrl?: string | null
                records: Record<string, AttendanceRecord>
            }
        > = {}

        data.forEach((attendance) => {
            if (!map[attendance.employeeId]) {
                map[attendance.employeeId] = {
                    employeeName: attendance.employeeName,
                    profilePictureUrl: attendance.profilePictureUrl ?? null,
                    records: {},
                }
            }

            map[attendance.employeeId].records[toDateKey(attendance.date)] = attendance
        })

        return map
    }, [data])

    const daysInMonth = new Date(year, month, 0).getDate()
    const employees = Object.entries(groupedAttendance)

    return (
        <div className="space-y-4 rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
                {isLoading ? (
                    <>
                        <Skeleton width={140} height={35} />
                        <div className="flex gap-2">
                            <Skeleton width={120} height={35} />
                            <Skeleton width={100} height={35} />
                        </div>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setOpen(true)}
                            className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
                        >
                            + Mark Attendance
                        </button>

                        <div className="flex items-center gap-2 text-sm">
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="rounded border px-4 py-2"
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
                                className="rounded border px-4 py-2"
                            >
                                {[2025, 2026, 2027, 2028].map((optionYear) => (
                                    <option key={optionYear} value={optionYear}>
                                        {optionYear}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </div>

            {error ? (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    Failed to load attendance. Please refresh and try again.
                </div>
            ) : isLoading ? (
                <Skeleton width={300} height={15} />
            ) : (
                <div className="flex gap-4 text-xs text-gray-600">
                    <span>★ Holiday</span>
                    <span>✔ Present</span>
                    <span>⛔ Leave</span>
                    <span>⏰ Late</span>
                    <span>½ Half Day</span>
                </div>
            )}

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
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, row) => (
                                <tr key={row} className="border-t">
                                    <td className="flex items-center gap-2 px-3 py-2">
                                        <Skeleton circle width={24} height={24} />
                                        <div>
                                            <Skeleton width={100} />
                                            <Skeleton width={60} />
                                        </div>
                                    </td>

                                    {Array.from({ length: daysInMonth }).map((_, col) => (
                                        <td key={col} className="px-2 py-2 text-center">
                                            <Skeleton width={10} height={10} />
                                        </td>
                                    ))}

                                    <td className="px-3 py-2">
                                        <Skeleton width={40} />
                                    </td>
                                </tr>
                            ))
                            : employees.map(([empId, employee]) => (
                                <tr key={empId} className="border-t">
                                    <td className="flex items-center gap-2 px-3 py-2 font-medium">
                                        {employee.profilePictureUrl ? (
                                            <img
                                                src={employee.profilePictureUrl}
                                                className="h-6 w-6 rounded-full object-cover"
                                                alt={employee.employeeName}
                                            />
                                        ) : (
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-700">
                                                {employee.employeeName.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div>
                                            <div>{employee.employeeName}</div>
                                            <div className="text-[10px] text-gray-500">{empId}</div>
                                        </div>
                                    </td>

                                    {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = String(i + 1).padStart(2, "0")
                                        const dateKey = `${year}-${String(month).padStart(2, "0")}-${day}`
                                        const attendance = employee.records[dateKey]

                                        return (
                                            <td key={i} className="px-2 py-2 text-center">
                                                {attendance ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDay(attendance)
                                                            setOpenDetail(true)
                                                        }}
                                                        className="flex flex-col items-center text-xs transition hover:scale-110"
                                                    >
                                                        {STATUS_ICON[getDisplayStatus(attendance)]}
                                                        {attendance.late && <span>⏰</span>}
                                                        {attendance.halfDay && <span>½</span>}
                                                    </button>
                                                ) : (
                                                    "--"
                                                )}
                                            </td>
                                        )
                                    })}

                                    <td className="px-3 py-2 text-center font-semibold">
                                        {
                                            Object.values(employee.records).filter((attendance) => {
                                                const attendanceDateKey = toDateKey(attendance.date)
                                                return (
                                                    attendance.isPresent &&
                                                    attendanceDateKey.startsWith(
                                                        `${year}-${String(month).padStart(2, "0")}`
                                                    )
                                                )
                                            }).length
                                        }
                                        /{daysInMonth}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {!isLoading && !error && employees.length === 0 && (
                <div className="rounded border border-dashed px-4 py-8 text-center text-sm text-gray-500">
                    No attendance records found yet.
                </div>
            )}

            <MarkAttendanceModal
                open={open}
                onClose={() => setOpen(false)}
            />

            <AttendanceDetailModal
                open={openDetail}
                onClose={() => setOpenDetail(false)}
                data={selectedDay}
            />
        </div>
    )
}

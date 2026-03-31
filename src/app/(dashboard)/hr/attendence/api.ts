"use client"

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
} from "@tanstack/react-query"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

export interface AttendanceRecord {
    attendanceId: number
    date: string
    employeeId: string
    employeeName: string
    profilePictureUrl?: string | null
    status: "PRESENT" | "ABSENT"
    late: boolean
    halfDay: boolean
    holiday: boolean
    leave: boolean
    isPresent: boolean
    clockInTime?: string | null
    clockInLocation?: string | null
    clockInWorkingFrom?: string | null
    clockOutTime?: string | null
    clockOutLocation?: string | null
    clockOutWorkingFrom?: string | null
    markedById?: string | null
    markedByName?: string | null
}

export interface AttendancePayload {
    clockInTime: string
    clockInLocation: string
    clockInWorkingFrom: string
    clockOutTime: string
    clockOutLocation: string
    clockOutWorkingFrom: string
    late: boolean
    halfDay: boolean
}

interface MarkAttendanceByDateRequest {
    employeeIds: string[]
    dates: string[]
    payload: AttendancePayload
    overwrite: boolean
    markedBy?: string
}

interface MarkAttendanceByMonthRequest {
    employeeIds: string[]
    year: number
    month: number
    payload: AttendancePayload
    overwrite: boolean
    markedBy?: string
}

export interface EditAttendanceRequest extends AttendancePayload {
    employeeId: string
    date: string
    overwrite?: boolean
    markedBy?: string
}

export interface DeleteAttendanceRequest {
    employeeId: string
    date: string
}

const attendanceQueryKey = ["attendance", "admin"] as const

const getAuthToken = () => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
        throw new Error("No token")
    }
    return token
}

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(url, init)

    if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Request failed")
    }

    return res.json() as Promise<T>
}

const sendWithoutJson = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init)

    if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Request failed")
    }
}

const fetchAttendance = async () => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    return fetchJson<AttendanceRecord[]>(`${BASE_URL}/employee/attendance/GetAllAttendance`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
        },
    })
}

const markAttendanceByDate = async (request: MarkAttendanceByDateRequest) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    return fetchJson<Record<string, Record<string, string>>>(`${BASE_URL}/employee/attendance/mark`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    })
}

const markAttendanceByMonth = async (request: MarkAttendanceByMonthRequest) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    return fetchJson<Record<string, Record<string, string>>>(`${BASE_URL}/employee/attendance/mark/month`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    })
}

const editAttendance = async ({
    employeeId,
    date,
    overwrite = true,
    markedBy,
    ...payload
}: EditAttendanceRequest) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    const params = new URLSearchParams({
        employeeId,
        date,
        overwrite: String(overwrite),
    })

    if (markedBy) {
        params.set("markedBy", markedBy)
    }

    return fetchJson<{ message: string }>(`${BASE_URL}/employee/attendance/edit?${params.toString()}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
}

const deleteAttendance = async ({ employeeId, date }: DeleteAttendanceRequest) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    const params = new URLSearchParams({ employeeId, date })

    await sendWithoutJson(`${BASE_URL}/employee/attendance/delete?${params.toString()}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${getAuthToken()}`,
        },
    })
}

export function useAdminAttendanceQuery() {
    return useQuery({
        queryKey: attendanceQueryKey,
        queryFn: fetchAttendance,
    })
}

export function useMarkAttendanceByDateMutation(
    options?: UseMutationOptions<Record<string, Record<string, string>>, Error, MarkAttendanceByDateRequest>
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: markAttendanceByDate,
        onSuccess: async (...args) => {
            await queryClient.invalidateQueries({ queryKey: attendanceQueryKey })
            await options?.onSuccess?.(...args)
        },
        ...options,
    })
}

export function useMarkAttendanceByMonthMutation(
    options?: UseMutationOptions<Record<string, Record<string, string>>, Error, MarkAttendanceByMonthRequest>
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: markAttendanceByMonth,
        onSuccess: async (...args) => {
            await queryClient.invalidateQueries({ queryKey: attendanceQueryKey })
            await options?.onSuccess?.(...args)
        },
        ...options,
    })
}

export function useEditAttendanceMutation(
    options?: UseMutationOptions<{ message: string }, Error, EditAttendanceRequest>
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: editAttendance,
        onSuccess: async (...args) => {
            await queryClient.invalidateQueries({ queryKey: attendanceQueryKey })
            await options?.onSuccess?.(...args)
        },
        ...options,
    })
}

export function useDeleteAttendanceMutation(
    options?: UseMutationOptions<void, Error, DeleteAttendanceRequest>
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteAttendance,
        onSuccess: async (...args) => {
            await queryClient.invalidateQueries({ queryKey: attendanceQueryKey })
            await options?.onSuccess?.(...args)
        },
        ...options,
    })
}

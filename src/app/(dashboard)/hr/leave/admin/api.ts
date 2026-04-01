"use client"

import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationOptions,
    type UseQueryOptions,
} from "@tanstack/react-query"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

export interface Leave {
    id: number
    employeeId: string
    employeeName: string
    leaveType: string
    durationType: string
    startDate: string | null
    endDate: string | null
    singleDate: string | null
    reason: string | null
    status: string
    rejectionReason: string | null
    approvedByName: string | null
    isPaid: boolean
    approvedAt: string | null
    rejectedAt: string | null
    documentUrls: string[]
    createdAt: string
    updatedAt: string
}

export interface LeaveQuota {
    id: number
    leaveType: string
    totalLeaves: number
    monthlyLimit: number
    totalTaken: number
    overUtilized: number
    remainingLeaves: number
}

export interface EmployeeProfile {
    employeeId: string
    name: string
    profilePictureUrl?: string | null
    designationName?: string | null
    departmentName?: string | null
    createdAt?: string
}

export interface LeaveStatusRequest {
    status: "APPROVED" | "REJECTED"
    rejectionReason?: string
}

export interface ApplyLeaveRequest {
    leaveData: {
        employeeIds: string[]
        leaveType: string
        durationType: string
        reason: string
        status: string
        singleDate?: string
        startDate?: string
        endDate?: string
    }
    files: File[]
}

const leaveKeys = {
    all: ["leave", "admin"] as const,
    list: () => [...leaveKeys.all, "list"] as const,
    detail: (id: string | number) => [...leaveKeys.all, "detail", String(id)] as const,
    quota: (employeeId: string) => [...leaveKeys.all, "quota", employeeId] as const,
    employee: (employeeId: string) => [...leaveKeys.all, "employee", employeeId] as const,
}

const getToken = () => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
        throw new Error("No access token found")
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

const sendRequest = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init)

    if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Request failed")
    }
}

const fetchLeaves = async () => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    return fetchJson<Leave[]>(`${BASE_URL}/employee/api/leaves`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
}

const fetchLeaveById = async (id: string) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    return fetchJson<Leave>(`${BASE_URL}/employee/api/leaves/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
}

const fetchQuota = async (employeeId: string) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    return fetchJson<LeaveQuota[]>(`${BASE_URL}/employee/leave-quota/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
}

const fetchEmployeeProfile = async (employeeId: string) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    return fetchJson<EmployeeProfile>(`${BASE_URL}/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    })
}

const updateLeaveStatus = async ({
    id,
    request,
}: {
    id: number
    request: LeaveStatusRequest
}) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    return fetchJson<Leave>(`${BASE_URL}/employee/api/leaves/${id}/status`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    })
}

const deleteLeave = async (id: number) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    await sendRequest(`${BASE_URL}/employee/api/leaves/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
    })
}

const applyLeave = async ({ leaveData, files }: ApplyLeaveRequest) => {
    if (!BASE_URL) {
        throw new Error("NEXT_PUBLIC_MAIN is not configured")
    }

    const formData = new FormData()
    formData.append("leaveData", JSON.stringify(leaveData))
    files.forEach((file) => formData.append("documents", file))

    return fetchJson<Leave[]>(`${BASE_URL}/employee/api/leaves/admin/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
    })
}

export function useAdminLeavesQuery() {
    return useQuery({
        queryKey: leaveKeys.list(),
        queryFn: fetchLeaves,
    })
}

export function useAdminLeaveDetailQuery(id: string, options?: Partial<UseQueryOptions<Leave, Error>>) {
    return useQuery({
        queryKey: leaveKeys.detail(id),
        queryFn: () => fetchLeaveById(id),
        enabled: Boolean(id),
        ...options,
    })
}

export function useLeaveQuotaQuery(employeeId: string, enabled = true) {
    return useQuery({
        queryKey: leaveKeys.quota(employeeId),
        queryFn: () => fetchQuota(employeeId),
        enabled: Boolean(employeeId) && enabled,
    })
}

export function useEmployeeProfileQuery(employeeId: string, enabled = true) {
    return useQuery({
        queryKey: leaveKeys.employee(employeeId),
        queryFn: () => fetchEmployeeProfile(employeeId),
        enabled: Boolean(employeeId) && enabled,
    })
}

export function useUpdateLeaveStatusMutation(
    options?: UseMutationOptions<Leave, Error, { id: number; request: LeaveStatusRequest }>
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateLeaveStatus,
        onSuccess: async (data, variables, onMutateResult, context) => {
            await queryClient.invalidateQueries({ queryKey: leaveKeys.list() })
            await queryClient.invalidateQueries({ queryKey: leaveKeys.detail(variables.id) })
            await options?.onSuccess?.(data, variables, onMutateResult, context)
        },
        ...options,
    })
}

export function useDeleteLeaveMutation(
    options?: UseMutationOptions<void, Error, number>
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteLeave,
        onSuccess: async (data, variables, onMutateResult, context) => {
            await queryClient.invalidateQueries({ queryKey: leaveKeys.list() })
            await options?.onSuccess?.(data, variables, onMutateResult, context)
        },
        ...options,
    })
}

export function useApplyAdminLeaveMutation(
    options?: UseMutationOptions<Leave[], Error, ApplyLeaveRequest>
) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: applyLeave,
        onSuccess: async (data, variables, onMutateResult, context) => {
            await queryClient.invalidateQueries({ queryKey: leaveKeys.list() })
            await options?.onSuccess?.(data, variables, onMutateResult, context)
        },
        ...options,
    })
}

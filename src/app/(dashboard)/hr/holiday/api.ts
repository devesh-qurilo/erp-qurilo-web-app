"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

export interface Holiday {
  id: number
  date: string
  day: string
  occasion: string
  isDefaultWeekly: boolean
  isActive: boolean
}

export interface HolidayRequest {
  date: string
  occasion: string
}

export interface DefaultWeeklyHolidayRequest {
  weekDays: string[]
  occasion?: string | null
  year?: number | null
  month?: number | null
}

const holidayKeys = {
  all: ["holidays"] as const,
  list: () => [...holidayKeys.all, "list"] as const,
  detail: (id: number | string) => [...holidayKeys.all, "detail", String(id)] as const,
  month: (year: number, month: number) => [...holidayKeys.all, "month", year, month] as const,
  upcoming: () => [...holidayKeys.all, "upcoming"] as const,
}

const getToken = () => {
  const token = localStorage.getItem("accessToken")
  if (!token) {
    throw new Error("No access token found")
  }
  return token
}

const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_MAIN is not configured")
  }

  const res = await fetch(url, init)

  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || "Request failed")
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

const authHeaders = (json = false): HeadersInit => ({
  Authorization: `Bearer ${getToken()}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
})

const fetchHolidays = async () =>
  fetchJson<Holiday[]>(`${BASE_URL}/employee/api/holidays`, {
    headers: authHeaders(),
    cache: "no-store",
  })

const fetchHolidayById = async (id: number) =>
  fetchJson<Holiday>(`${BASE_URL}/employee/api/holidays/${id}`, {
    headers: authHeaders(),
  })

const fetchHolidaysByMonth = async (year: number, month: number) =>
  fetchJson<Holiday[]>(`${BASE_URL}/employee/api/holidays/month?year=${year}&month=${month}`, {
    headers: authHeaders(),
  })

const fetchUpcomingHolidays = async () =>
  fetchJson<Holiday[]>(`${BASE_URL}/employee/api/holidays/upcoming`, {
    headers: authHeaders(),
  })

const createHoliday = async (payload: HolidayRequest) =>
  fetchJson<Holiday>(`${BASE_URL}/employee/api/holidays`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  })

const createBulkHolidays = async (holidays: HolidayRequest[]) =>
  fetchJson<Holiday[]>(`${BASE_URL}/employee/api/holidays/bulk`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ holidays }),
  })

const createDefaultWeeklyHolidays = async (payload: DefaultWeeklyHolidayRequest) =>
  fetchJson<Holiday[]>(`${BASE_URL}/employee/api/holidays/default-weekly`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  })

const updateHoliday = async ({ id, payload }: { id: number; payload: HolidayRequest }) =>
  fetchJson<Holiday>(`${BASE_URL}/employee/api/holidays/${id}`, {
    method: "PUT",
    headers: authHeaders(true),
    body: JSON.stringify(payload),
  })

const deleteHoliday = async (id: number) =>
  fetchJson<void>(`${BASE_URL}/employee/api/holidays/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })

const toggleHolidayStatus = async (id: number) =>
  fetchJson<void>(`${BASE_URL}/employee/api/holidays/${id}/toggle-status`, {
    method: "PATCH",
    headers: authHeaders(),
  })

export function useHolidayListQuery(options?: Partial<UseQueryOptions<Holiday[], Error>>) {
  return useQuery({
    queryKey: holidayKeys.list(),
    queryFn: fetchHolidays,
    ...options,
  })
}

export function useHolidayDetailQuery(id: number, options?: Partial<UseQueryOptions<Holiday, Error>>) {
  return useQuery({
    queryKey: holidayKeys.detail(id),
    queryFn: () => fetchHolidayById(id),
    enabled: Number.isFinite(id) && id > 0,
    ...options,
  })
}

export function useHolidayMonthQuery(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: holidayKeys.month(year, month),
    queryFn: () => fetchHolidaysByMonth(year, month),
    enabled: enabled && year > 0 && month > 0,
  })
}

export function useUpcomingHolidaysQuery(enabled = true) {
  return useQuery({
    queryKey: holidayKeys.upcoming(),
    queryFn: fetchUpcomingHolidays,
    enabled,
  })
}

export function useCreateHolidayMutation(options?: UseMutationOptions<Holiday, Error, HolidayRequest>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createHoliday,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

export function useCreateBulkHolidaysMutation(options?: UseMutationOptions<Holiday[], Error, HolidayRequest[]>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBulkHolidays,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

export function useCreateDefaultWeeklyHolidaysMutation(
  options?: UseMutationOptions<Holiday[], Error, DefaultWeeklyHolidayRequest>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDefaultWeeklyHolidays,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

export function useUpdateHolidayMutation(
  options?: UseMutationOptions<Holiday, Error, { id: number; payload: HolidayRequest }>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateHoliday,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      await queryClient.invalidateQueries({ queryKey: holidayKeys.detail(variables.id) })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

export function useDeleteHolidayMutation(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

export function useToggleHolidayStatusMutation(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleHolidayStatus,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: holidayKeys.all })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

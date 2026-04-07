"use client"

import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

export interface DealRecord {
  id: number
  title?: string
  value?: number
  dealStage?: string | null
  dealCategory?: string | null
  pipeline?: string | null
  dealAgent?: string | null
  dealWatchers?: string[]
  leadId?: number | null
  leadName?: string | null
  leadMobile?: string | null
  leadCompanyName?: string | null
  expectedCloseDate?: string | null
  createdAt?: string
  updatedAt?: string
  priority?: unknown
  dealAgentMeta?: Record<string, unknown>
  dealWatchersMeta?: Array<Record<string, unknown>>
  assignedEmployeesMeta?: Array<Record<string, unknown>>
  tags?: Array<Record<string, unknown> | string>
  comments?: Array<Record<string, unknown>>
  followups?: Array<Record<string, unknown>>
}

export interface StageRecord {
  id: number
  name: string
  color?: string | null
  position?: number | null
}

export interface EmployeeRecord {
  employeeId: string
  name: string
  designationName?: string | null
  departmentName?: string | null
  profilePictureUrl?: string | null
}

export interface LeadOption {
  id: number
  name: string
  email?: string | null
  companyName?: string | null
}

export interface DealCategoryItem {
  id: number
  categoryName?: string
  name?: string
}

export interface DealSourceItem {
  id: number
  name: string
}

export interface PriorityItem {
  id: number
  status: string
  color?: string | null
  dealId?: number | null
  isGlobal?: boolean
}

export interface DealPayload {
  title: string
  leadId?: number
  pipeline?: string
  dealStage?: string
  dealCategory?: string
  dealAgent?: string
  dealWatchers?: string[]
  value?: number
  expectedCloseDate?: string
  dealContact?: string
}

const keys = {
  all: ["deals-admin"] as const,
  deals: () => [...keys.all, "deals"] as const,
  deal: (id: string | number) => [...keys.all, "deal", String(id)] as const,
  stages: () => [...keys.all, "stages"] as const,
  employees: () => [...keys.all, "employees"] as const,
  leads: () => [...keys.all, "leads"] as const,
  categories: () => [...keys.all, "categories"] as const,
  sources: () => [...keys.all, "sources"] as const,
  priorities: () => [...keys.all, "priorities"] as const,
}

const getToken = () => {
  const token = localStorage.getItem("accessToken")
  if (!token) throw new Error("No access token found. Please log in.")
  return token
}

const authHeaders = (json = false): HeadersInit => ({
  Authorization: `Bearer ${getToken()}`,
  Accept: "application/json",
  ...(json ? { "Content-Type": "application/json" } : {}),
})

const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  if (!BASE_URL) throw new Error("NEXT_PUBLIC_MAIN is not configured")
  const res = await fetch(url, init)
  if (!res.ok) {
    let message = "Request failed"
    try {
      const json = await res.json()
      message = json?.message || json?.error || message
    } catch {
      message = (await res.text()) || message
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const fetchDeals = () => fetchJson<DealRecord[]>(`${BASE_URL}/deals`, { headers: authHeaders(), cache: "no-store" })
const fetchDeal = (id: string) => fetchJson<DealRecord>(`${BASE_URL}/deals/${id}`, { headers: authHeaders(), cache: "no-store" })
const fetchStages = () => fetchJson<StageRecord[]>(`${BASE_URL}/stages`, { headers: authHeaders(), cache: "no-store" })
const fetchEmployees = () => fetchJson<EmployeeRecord[]>(`${BASE_URL}/employee/all`, { headers: authHeaders(), cache: "no-store" })
const fetchLeads = () => fetchJson<LeadOption[]>(`${BASE_URL}/leads`, { headers: authHeaders(), cache: "no-store" })
const fetchCategories = () => fetchJson<DealCategoryItem[]>(`${BASE_URL}/deals/dealCategory`, { headers: authHeaders(), cache: "no-store" })
const fetchSources = () => fetchJson<DealSourceItem[]>(`${BASE_URL}/deals/dealCategory/LeadSource`, { headers: authHeaders(), cache: "no-store" })
const fetchPriorities = () => fetchJson<PriorityItem[]>(`${BASE_URL}/deals/admin/priorities`, { headers: authHeaders(), cache: "no-store" })

const createDeal = (payload: DealPayload) => fetchJson<DealRecord>(`${BASE_URL}/deals`, { method: "POST", headers: authHeaders(true), body: JSON.stringify(payload) })
const updateDeal = ({ id, payload }: { id: string | number; payload: DealPayload | Partial<DealPayload> }) => fetchJson<DealRecord>(`${BASE_URL}/deals/${id}`, { method: "PUT", headers: authHeaders(true), body: JSON.stringify(payload) })
const deleteDeal = (id: string | number) => fetchJson<void>(`${BASE_URL}/deals/${id}`, { method: "DELETE", headers: authHeaders() })
const updateDealStage = ({ id, stage }: { id: string | number; stage: string }) => fetchJson<DealRecord>(`${BASE_URL}/deals/${id}/stage?stage=${encodeURIComponent(stage)}`, { method: "PUT", headers: authHeaders() })
const assignDealPriority = async ({
  id,
  priorityId,
  hasExistingPriority,
}: {
  id: string | number
  priorityId: number
  hasExistingPriority?: boolean
}) => {
  if (!BASE_URL) throw new Error("NEXT_PUBLIC_MAIN is not configured")

  const request = (method: "POST" | "PUT", suffix: "/priority/assign" | "/priority") =>
    fetch(`${BASE_URL}/deals/${id}${suffix}`, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify({ priorityId }),
    })

  let response = hasExistingPriority
    ? await request("PUT", "/priority")
    : await request("POST", "/priority/assign")

  if (response.status === 404) {
    response = hasExistingPriority
      ? await request("POST", "/priority/assign")
      : await request("PUT", "/priority")
  }

  if (!response.ok) {
    let message = "Priority update failed"
    try {
      const json = await response.json()
      message = json?.message || json?.error || message
    } catch {
      message = (await response.text()) || message
    }
    throw new Error(message)
  }

  return response.json() as Promise<unknown>
}

export function useDealsQuery(options?: Partial<UseQueryOptions<DealRecord[], Error>>) {
  return useQuery({ queryKey: keys.deals(), queryFn: fetchDeals, ...options })
}

export function useDealDetailQuery(id: string, options?: Partial<UseQueryOptions<DealRecord, Error>>) {
  return useQuery({ queryKey: keys.deal(id), queryFn: () => fetchDeal(id), enabled: Boolean(id), ...options })
}

export function useStagesQuery(options?: Partial<UseQueryOptions<StageRecord[], Error>>) {
  return useQuery({ queryKey: keys.stages(), queryFn: fetchStages, ...options })
}

export function useDealEmployeesQuery(options?: Partial<UseQueryOptions<EmployeeRecord[], Error>>) {
  return useQuery({ queryKey: keys.employees(), queryFn: fetchEmployees, ...options })
}

export function useDealLeadOptionsQuery(options?: Partial<UseQueryOptions<LeadOption[], Error>>) {
  return useQuery({ queryKey: keys.leads(), queryFn: fetchLeads, ...options })
}

export function useDealCategoriesQuery(options?: Partial<UseQueryOptions<DealCategoryItem[], Error>>) {
  return useQuery({ queryKey: keys.categories(), queryFn: fetchCategories, ...options })
}

export function useDealSourcesQuery(options?: Partial<UseQueryOptions<DealSourceItem[], Error>>) {
  return useQuery({ queryKey: keys.sources(), queryFn: fetchSources, ...options })
}

export function useDealPrioritiesQuery(options?: Partial<UseQueryOptions<PriorityItem[], Error>>) {
  return useQuery({ queryKey: keys.priorities(), queryFn: fetchPriorities, ...options })
}

export function useCreateDealMutation(options?: UseMutationOptions<DealRecord, Error, DealPayload>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createDeal,
    onSuccess: async (data, vars, ctx, meta) => {
      await qc.invalidateQueries({ queryKey: keys.all })
      await options?.onSuccess?.(data, vars, ctx, meta)
    },
    ...options,
  })
}

export function useUpdateDealMutation(options?: UseMutationOptions<DealRecord, Error, { id: string | number; payload: DealPayload | Partial<DealPayload> }>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateDeal,
    onSuccess: async (data, vars, ctx, meta) => {
      await qc.invalidateQueries({ queryKey: keys.all })
      await qc.invalidateQueries({ queryKey: keys.deal(vars.id) })
      await options?.onSuccess?.(data, vars, ctx, meta)
    },
    ...options,
  })
}

export function useDeleteDealMutation(options?: UseMutationOptions<void, Error, string | number>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: async (data, vars, ctx, meta) => {
      await qc.invalidateQueries({ queryKey: keys.all })
      await options?.onSuccess?.(data, vars, ctx, meta)
    },
    ...options,
  })
}

export function useUpdateDealStageMutation(options?: UseMutationOptions<DealRecord, Error, { id: string | number; stage: string }>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateDealStage,
    onSuccess: async (data, vars, ctx, meta) => {
      await qc.invalidateQueries({ queryKey: keys.all })
      await qc.invalidateQueries({ queryKey: keys.deal(vars.id) })
      await options?.onSuccess?.(data, vars, ctx, meta)
    },
    ...options,
  })
}

export function useAssignDealPriorityMutation(
  options?: UseMutationOptions<unknown, Error, { id: string | number; priorityId: number; hasExistingPriority?: boolean }>
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: assignDealPriority,
    onSuccess: async (data, vars, ctx, meta) => {
      await qc.invalidateQueries({ queryKey: keys.all })
      await qc.invalidateQueries({ queryKey: keys.deal(vars.id) })
      await options?.onSuccess?.(data, vars, ctx, meta)
    },
    ...options,
  })
}

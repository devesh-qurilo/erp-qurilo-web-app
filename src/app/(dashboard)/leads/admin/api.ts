"use client"

import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

export interface EmployeeOption {
  employeeId: string
  name: string
  designationName?: string | null
  departmentName?: string | null
  profilePictureUrl?: string | null
}

export interface LeadRecord {
  id: number
  name: string
  email?: string
  companyName?: string
  mobileNumber?: string
  city?: string
  country?: string
  status?: string
  leadOwner?: string
  addedBy?: string
  leadOwnerMeta?: {
    employeeId?: string
    name?: string
    designation?: string | null
    department?: string | null
    profileUrl?: string | null
  }
  addedByMeta?: {
    employeeId?: string
    name?: string
    designation?: string | null
    department?: string | null
    profileUrl?: string | null
  }
  clientCategory?: string
  clientSubCategory?: string
  leadSource?: string
  autoConvertToClient?: boolean
  createDeal?: boolean
  companyAddress?: string
  companyNameAddress?: string
  officialWebsite?: string
  officePhone?: string
  postalCode?: string
  state?: string
  createdAt?: string
  updatedAt?: string
}

export interface DealRecord {
  id: number
  title?: string
  value?: number
  dealStage?: string
  dealAgent?: string
  dealWatchers?: string[]
  leadId?: number
  leadName?: string
  leadMobile?: string
  leadCompanyName?: string
  pipeline?: string
  dealCategory?: string
  expectedCloseDate?: string | null
  createdAt?: string
  updatedAt?: string
  followups?: Array<Record<string, unknown>>
  tags?: Array<Record<string, unknown> | string>
  comments?: Array<Record<string, unknown>>
  assignedEmployeesMeta?: Array<Record<string, unknown>>
  dealAgentMeta?: Record<string, unknown>
  dealWatchersMeta?: Array<Record<string, unknown>>
}

export interface DealDocumentRecord {
  id: number
  name?: string
  filename?: string
  url?: string
  uploadedAt?: string
  objectKey?: string
}

export interface DealFollowupRecord {
  id: number
  nextDate?: string
  startTime?: string
  remarks?: string
  sendReminder?: boolean
  remindBefore?: number
  remindUnit?: "DAYS" | "HOURS" | "MINUTES" | string
  status?: "PENDING" | "CANCELLED" | "COMPLETED" | string
  reminderScheduled?: boolean
}

export interface DealNoteRecord {
  id?: number
  noteTitle: string
  noteType: "PUBLIC" | "PRIVATE" | string
  noteDetails?: string
  createdAt?: string
  updatedAt?: string
}

export interface DealTagRecord {
  id?: number
  tagName?: string
}

export interface DealCommentRecord {
  id?: number
  commentText?: string
  content?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  createdByMeta?: Record<string, unknown>
}

export interface LeadPayload {
  name: string
  email?: string
  clientCategory?: string
  clientSubCategory?: string
  leadSource?: string
  addedBy?: string
  leadOwner?: string
  autoConvertToClient?: boolean
  companyName?: string
  officialWebsite?: string
  mobileNumber?: string | number
  officePhone?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  companyAddress?: string
  createDeal?: boolean
  deal?: Record<string, unknown>
}

export interface DealCategoryItem {
  id: number
  categoryName?: string
  name?: string
}

export interface ClientCategoryItem {
  id: number
  categoryName?: string
  name?: string
}

export interface ClientSubCategoryItem {
  id: number
  subCategoryName?: string
  name?: string
}

export interface LeadSourceItem {
  id: number
  name: string
}

const leadKeys = {
  all: ["lead-admin"] as const,
  list: () => [...leadKeys.all, "list"] as const,
  detail: (id: string | number) => [...leadKeys.all, "detail", String(id)] as const,
  deals: (leadId: string | number) => [...leadKeys.all, "deals", String(leadId)] as const,
  dealDocuments: (dealId: string | number) => [...leadKeys.all, "deal-documents", String(dealId)] as const,
  dealFollowups: (dealId: string | number) => [...leadKeys.all, "deal-followups", String(dealId)] as const,
  dealEmployees: (dealId: string | number) => [...leadKeys.all, "deal-employees", String(dealId)] as const,
  dealNotes: (dealId: string | number) => [...leadKeys.all, "deal-notes", String(dealId)] as const,
  dealTags: (dealId: string | number) => [...leadKeys.all, "deal-tags", String(dealId)] as const,
  dealComments: (dealId: string | number) => [...leadKeys.all, "deal-comments", String(dealId)] as const,
  employees: () => [...leadKeys.all, "employees"] as const,
  dealCategories: () => [...leadKeys.all, "deal-categories"] as const,
  clientCategories: () => [...leadKeys.all, "client-categories"] as const,
  clientSubCategories: () => [...leadKeys.all, "client-sub-categories"] as const,
  leadSources: () => [...leadKeys.all, "lead-sources"] as const,
}

const getToken = () => {
  const token = localStorage.getItem("accessToken")
  if (!token) throw new Error("No access token found. Please log in.")
  return token
}

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

const authHeaders = (json = false): HeadersInit => ({
  Authorization: `Bearer ${getToken()}`,
  Accept: "application/json",
  ...(json ? { "Content-Type": "application/json" } : {}),
})

const fetchLeads = () => fetchJson<LeadRecord[]>(`${BASE_URL}/leads`, { headers: authHeaders(), cache: "no-store" })
const fetchLead = (id: string) => fetchJson<LeadRecord>(`${BASE_URL}/leads/${id}`, { headers: authHeaders(), cache: "no-store" })
const fetchDealsByLead = (id: string) => fetchJson<DealRecord[]>(`${BASE_URL}/deals/lead/${id}`, { headers: authHeaders(), cache: "no-store" })
const fetchEmployees = () => fetchJson<EmployeeOption[]>(`${BASE_URL}/employee/all`, { headers: authHeaders(), cache: "no-store" })
const fetchDealDocuments = (dealId: string) => fetchJson<DealDocumentRecord[]>(`${BASE_URL}/deals/${dealId}/documents`, { headers: authHeaders(), cache: "no-store" })
const fetchDealFollowups = (dealId: string) => fetchJson<DealFollowupRecord[]>(`${BASE_URL}/deals/${dealId}/followups`, { headers: authHeaders(), cache: "no-store" })
const fetchDealEmployees = (dealId: string) => fetchJson<EmployeeOption[]>(`${BASE_URL}/deals/${dealId}/employees`, { headers: authHeaders(), cache: "no-store" })
const fetchDealNotes = (dealId: string) => fetchJson<DealNoteRecord[]>(`${BASE_URL}/deals/${dealId}/notes`, { headers: authHeaders(), cache: "no-store" })
const fetchDealTags = (dealId: string) => fetchJson<(DealTagRecord | string)[]>(`${BASE_URL}/deals/${dealId}/tags`, { headers: authHeaders(), cache: "no-store" })
const fetchDealComments = (dealId: string) => fetchJson<DealCommentRecord[]>(`${BASE_URL}/deals/${dealId}/comments`, { headers: authHeaders(), cache: "no-store" })
const fetchDealCategories = () => fetchJson<DealCategoryItem[]>(`${BASE_URL}/deals/dealCategory`, { headers: authHeaders(), cache: "no-store" })
const fetchClientCategories = () => fetchJson<ClientCategoryItem[]>(`${BASE_URL}/clients/category`, { headers: authHeaders(), cache: "no-store" })
const fetchClientSubCategories = () => fetchJson<ClientSubCategoryItem[]>(`${BASE_URL}/clients/category/subcategory`, { headers: authHeaders(), cache: "no-store" })
const fetchLeadSources = () => fetchJson<LeadSourceItem[]>(`${BASE_URL}/deals/dealCategory/LeadSource`, { headers: authHeaders(), cache: "no-store" })

const createLead = (payload: LeadPayload) => fetchJson<LeadRecord>(`${BASE_URL}/leads`, { method: "POST", headers: authHeaders(true), body: JSON.stringify(payload) })
const updateLead = ({ id, payload }: { id: number; payload: Partial<LeadPayload> }) => fetchJson<LeadRecord>(`${BASE_URL}/leads/${id}`, { method: "PUT", headers: authHeaders(true), body: JSON.stringify(payload) })
const deleteLead = (id: number) => fetchJson<void>(`${BASE_URL}/leads/${id}`, { method: "DELETE", headers: authHeaders() })
const convertLead = (id: number) => fetchJson<LeadRecord>(`${BASE_URL}/leads/${id}/convert`, { method: "POST", headers: authHeaders() })

export function useAdminLeadsQuery(options?: Partial<UseQueryOptions<LeadRecord[], Error>>) {
  return useQuery({ queryKey: leadKeys.list(), queryFn: fetchLeads, ...options })
}

export function useLeadDetailQuery(id: string, options?: Partial<UseQueryOptions<LeadRecord, Error>>) {
  return useQuery({ queryKey: leadKeys.detail(id), queryFn: () => fetchLead(id), enabled: Boolean(id), ...options })
}

export function useLeadDealsQuery(id: string, enabled = true) {
  return useQuery({ queryKey: leadKeys.deals(id), queryFn: () => fetchDealsByLead(id), enabled: Boolean(id) && enabled })
}

export function useDealDocumentsQuery(dealId: string, enabled = true) {
  return useQuery({ queryKey: leadKeys.dealDocuments(dealId), queryFn: () => fetchDealDocuments(dealId), enabled: Boolean(dealId) && enabled })
}

export function useDealFollowupsQuery(dealId: string, enabled = true) {
  return useQuery({ queryKey: leadKeys.dealFollowups(dealId), queryFn: () => fetchDealFollowups(dealId), enabled: Boolean(dealId) && enabled })
}

export function useDealEmployeesQuery(dealId: string, enabled = true) {
  return useQuery({ queryKey: leadKeys.dealEmployees(dealId), queryFn: () => fetchDealEmployees(dealId), enabled: Boolean(dealId) && enabled })
}

export function useDealNotesQuery(dealId: string, enabled = true) {
  return useQuery({ queryKey: leadKeys.dealNotes(dealId), queryFn: () => fetchDealNotes(dealId), enabled: Boolean(dealId) && enabled })
}

export function useDealTagsQuery(dealId: string, enabled = true) {
  return useQuery({ queryKey: leadKeys.dealTags(dealId), queryFn: () => fetchDealTags(dealId), enabled: Boolean(dealId) && enabled })
}

export function useDealCommentsQuery(dealId: string, enabled = true) {
  return useQuery({ queryKey: leadKeys.dealComments(dealId), queryFn: () => fetchDealComments(dealId), enabled: Boolean(dealId) && enabled })
}

export function useLeadEmployeesQuery(options?: Partial<UseQueryOptions<EmployeeOption[], Error>>) {
  return useQuery({ queryKey: leadKeys.employees(), queryFn: fetchEmployees, ...options })
}

export function useDealCategoriesQuery(options?: Partial<UseQueryOptions<DealCategoryItem[], Error>>) {
  return useQuery({ queryKey: leadKeys.dealCategories(), queryFn: fetchDealCategories, ...options })
}

export function useClientCategoriesQuery(options?: Partial<UseQueryOptions<ClientCategoryItem[], Error>>) {
  return useQuery({ queryKey: leadKeys.clientCategories(), queryFn: fetchClientCategories, ...options })
}

export function useClientSubCategoriesQuery(options?: Partial<UseQueryOptions<ClientSubCategoryItem[], Error>>) {
  return useQuery({ queryKey: leadKeys.clientSubCategories(), queryFn: fetchClientSubCategories, ...options })
}

export function useLeadSourcesQuery(options?: Partial<UseQueryOptions<LeadSourceItem[], Error>>) {
  return useQuery({ queryKey: leadKeys.leadSources(), queryFn: fetchLeadSources, ...options })
}

export function useCreateLeadMutation(options?: UseMutationOptions<LeadRecord, Error, LeadPayload>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createLead,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: leadKeys.all })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

export function useUpdateLeadMutation(options?: UseMutationOptions<LeadRecord, Error, { id: number; payload: Partial<LeadPayload> }>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateLead,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: leadKeys.all })
      await queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.id) })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

export function useDeleteLeadMutation(options?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLead,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: leadKeys.all })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

export function useConvertLeadMutation(options?: UseMutationOptions<LeadRecord, Error, number>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: convertLead,
    onSuccess: async (data, variables, contextValue, context) => {
      await queryClient.invalidateQueries({ queryKey: leadKeys.all })
      await queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables) })
      await options?.onSuccess?.(data, variables, contextValue, context)
    },
    ...options,
  })
}

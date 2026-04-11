"use client";

const BASE_URL = process.env.NEXT_PUBLIC_MAIN || "";

function resolveRequestUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  // These are frontend Next.js API proxy routes, not gateway routes.
  if (path.startsWith("/api/work/")) {
    return path;
  }

  return `${BASE_URL}${path}`;
}

export type ProjectListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  progress?: string;
  project?: string;
  member?: string;
  client?: string;
  pinned?: boolean;
  archived?: boolean;
};

export type ProjectListResponse<TProject = unknown> = {
  projects: TProject[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
};

async function requestJson<T>(
  path: string,
  {
    token,
    headers,
    ...init
  }: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (!(init.body instanceof FormData) && init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(resolveRequestUrl(path), {
    ...init,
    headers: requestHeaders,
    cache: init.cache ?? "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(text || `Request failed with status ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function fetchProjectsPage<TProject = Record<string, unknown>>(
  token: string,
  filters: ProjectListFilters = {},
): Promise<ProjectListResponse<TProject>> {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.progress) params.set("progress", filters.progress);
  if (filters.project) params.set("project", filters.project);
  if (filters.member) params.set("member", filters.member);
  if (filters.client) params.set("client", filters.client);
  if (filters.pinned) params.set("pinned", "true");
  if (filters.archived) params.set("archived", "true");

  return requestJson<ProjectListResponse<TProject>>(`/api/work/project?${params.toString()}`, {
    token,
  });
}

export async function fetchProjectById<TProject = Record<string, unknown>>(token: string, projectId: string | number) {
  return requestJson<TProject>(`/api/work/project/${projectId}`, { token });
}

export async function fetchProjectMetrics<TMetrics = Record<string, unknown>>(token: string, projectId: string | number) {
  return requestJson<TMetrics>(`/projects/${projectId}/metrics`, { token });
}

export async function createProjectRecord<TProject = Record<string, unknown>>(token: string, formData: FormData) {
  return requestJson<TProject>(`/api/projects`, {
    method: "POST",
    token,
    body: formData,
  });
}

export async function updateProjectRecord<TProject = Record<string, unknown>>(
  token: string,
  projectId: string | number,
  formData: FormData,
) {
  return requestJson<TProject>(`/api/projects/${projectId}`, {
    method: "PUT",
    token,
    body: formData,
  });
}

export async function deleteProjectRecord(token: string, projectId: string | number) {
  return requestJson<null>(`/api/projects/${projectId}`, {
    method: "DELETE",
    token,
  });
}

export async function updateProjectStatus(token: string, projectId: string | number, status: string) {
  return requestJson<null>(`/api/projects/${projectId}/status?status=${encodeURIComponent(status)}`, {
    method: "PUT",
    token,
  });
}

export async function updateProjectProgress(token: string, projectId: string | number, percent: number) {
  return requestJson<null>(`/api/projects/${projectId}/progress?percent=${encodeURIComponent(String(percent))}`, {
    method: "PUT",
    token,
  });
}

export async function toggleProjectPin(token: string, projectId: string | number, pinned: boolean) {
  return requestJson<null>(`/projects/${projectId}/pin`, {
    method: pinned ? "POST" : "DELETE",
    token,
  });
}

export async function toggleProjectArchive(token: string, projectId: string | number, archived: boolean) {
  return requestJson<null>(`/projects/${projectId}/archive`, {
    method: archived ? "POST" : "DELETE",
    token,
  });
}

export async function fetchProjectCategories<TCategory = Record<string, unknown>>(token: string) {
  return requestJson<TCategory[]>(`/api/projects/category`, { token });
}

export async function createProjectCategory<TCategory = Record<string, unknown>>(token: string, name: string) {
  return requestJson<TCategory>(`/api/projects/category`, {
    method: "POST",
    token,
    body: JSON.stringify({ name }),
  });
}

export async function deleteProjectCategory(token: string, categoryId: string | number) {
  return requestJson<null>(`/api/projects/category/${encodeURIComponent(String(categoryId))}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchProjectClients<TClient = Record<string, unknown>>(token: string) {
  return requestJson<TClient[]>(`/clients`, { token });
}

export async function fetchProjectDepartments<TDepartment = Record<string, unknown>>(token: string) {
  return requestJson<TDepartment[]>(`/admin/departments`, { token });
}

export async function fetchProjectEmployees<TEmployee = Record<string, unknown>>(token: string) {
  return requestJson<TEmployee[]>(`/employee/all`, { token });
}

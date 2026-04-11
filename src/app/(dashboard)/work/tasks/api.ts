"use client";

const BASE_URL = process.env.NEXT_PUBLIC_MAIN || "";
const TASK_PIN_STORAGE_KEY = "workTasksPinnedIds";

type RequestOptions = RequestInit & { token?: string | null };

export type TaskStageRecord = {
  id: number;
  name: string;
  position?: number | null;
  labelColor?: string | null;
  projectId?: number | null;
};

export type TaskCategoryRecord = {
  id: number;
  name: string;
  createdBy?: string | null;
};

export type ProjectEmployeeRecord = {
  employeeId: string;
  name: string;
  profileUrl?: string | null;
  designation?: string | null;
  department?: string | null;
};

export type ProjectRecord = {
  id: number;
  shortCode?: string | null;
  name?: string | null;
  projectName?: string | null;
  assignedEmployees?: ProjectEmployeeRecord[] | null;
};

export type ProjectMilestoneRecord = {
  id: number;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
};

export type TaskLabelRecord = {
  id: number;
  name: string;
  colorCode?: string | null;
  projectId?: number | null;
  projectName?: string | null;
  description?: string | null;
};

export type TaskFileRecord = {
  id: number;
  projectId?: number | null;
  taskId?: number | null;
  filename?: string | null;
  url?: string | null;
  mimeType?: string | null;
  size?: number | null;
  uploadedBy?: string | null;
  createdAt?: string | null;
};

export type TaskSubtaskRecord = {
  id: number;
  taskId: number;
  title: string;
  description?: string | null;
  isDone?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type TaskNoteRecord = {
  id: number;
  taskId?: number | null;
  title?: string | null;
  content?: string | null;
  isPublic?: boolean;
  ownerEmployeeId?: string | null;
  createdAt?: string | null;
};

export type TaskTimeLogRecord = {
  id: number;
  taskId?: number | null;
  employeeId?: string | null;
  employees?: ProjectEmployeeRecord[] | null;
  startDate?: string | null;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  memo?: string | null;
  durationHours?: number | null;
};

export type TaskDetailRecord = {
  id: number;
  title: string;
  categoryId?: TaskCategoryRecord | null;
  projectId?: number | null;
  projectShortCode?: string | null;
  projectName?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  noDueDate?: boolean;
  taskStage?: TaskStageRecord | null;
  taskStageId?: number | null;
  assignedEmployeeIds?: string[];
  assignedEmployees?: ProjectEmployeeRecord[] | null;
  description?: string | null;
  labels?: TaskLabelRecord[] | null;
  milestone?: ProjectMilestoneRecord | null;
  milestoneId?: number | null;
  priority?: string | null;
  isPrivate?: boolean;
  timeEstimate?: boolean;
  timeEstimateMinutes?: number | null;
  isDependent?: boolean;
  dependentTaskId?: number | null;
  attachments?: TaskFileRecord[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedOn?: string | null;
  pinned?: boolean;
  hoursLoggedMinutes?: number | null;
  hoursLogged?: number | null;
};

export type TaskMutationPayload = {
  projectId: string;
  title: string;
  category: string;
  startDate?: string;
  dueDate?: string;
  taskStageId?: string;
  assignedEmployeeIds?: string[];
  description?: string;
  labelIds?: string[];
  milestoneId?: string;
  priority?: string;
  isPrivate?: boolean;
  timeEstimate?: boolean;
  timeEstimateMinutes?: string;
  isDependent?: boolean;
  dependentTaskId?: string;
  file?: File | null;
};

async function requestJson<T>(path: string, { token, headers, ...init }: RequestOptions = {}): Promise<T> {
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (!(init.body instanceof FormData) && init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
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

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function getStoredEmployeeId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("employeeId");
}

export async function fetchAllProjectTasks<TTask = Record<string, unknown>>(token: string) {
  return requestJson<TTask[]>(`/api/projects/tasks/getAll`, { token });
}

export async function fetchMyProjectTasks<TTask = Record<string, unknown>>(
  token: string,
  employeeId?: string | null,
) {
  const path = employeeId
    ? `/api/projects/tasks/employee/${encodeURIComponent(employeeId)}`
    : `/projects/tasks/me`;

  return requestJson<TTask[]>(path, { token });
}

export async function deleteProjectTask(token: string, taskId: number) {
  return requestJson<null>(`/api/projects/tasks/${taskId}`, {
    method: "DELETE",
    token,
  });
}

export async function approveProjectTask<TTask = Record<string, unknown>>(token: string, taskId: number) {
  return requestJson<TTask>(`/api/projects/tasks/${taskId}/approve`, {
    method: "POST",
    token,
  });
}

export async function fetchTaskStages(token: string) {
  return requestJson<TaskStageRecord[]>(`/status`, { token });
}

export async function changeTaskStage<TTask = Record<string, unknown>>(
  token: string,
  taskId: number,
  stageId: number,
) {
  return requestJson<TTask>(`/api/projects/tasks/${taskId}/status?statusId=${encodeURIComponent(String(stageId))}`, {
    method: "PATCH",
    token,
  });
}

export async function createTaskStage(token: string, payload: Omit<TaskStageRecord, "id">) {
  return requestJson<TaskStageRecord>(`/status`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateTaskStageDefinition(
  token: string,
  stageId: number,
  payload: Omit<TaskStageRecord, "id">,
) {
  return requestJson<TaskStageRecord>(`/status/${stageId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteTaskStageDefinition(token: string, stageId: number) {
  return requestJson<null>(`/status/${stageId}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchTaskCategories(token: string) {
  return requestJson<TaskCategoryRecord[]>(`/task/task-categories`, { token });
}

export async function fetchProjectList(token: string) {
  return requestJson<ProjectRecord[]>(`/api/projects`, { token });
}

export async function fetchProjectDetails(token: string, projectId: number | string) {
  return requestJson<ProjectRecord>(`/api/projects/${encodeURIComponent(String(projectId))}`, { token });
}

export async function fetchProjectAssignableEmployees(token: string, projectId: number | string) {
  const project = await fetchProjectDetails(token, projectId);
  return Array.isArray(project.assignedEmployees) ? project.assignedEmployees : [];
}

export async function fetchProjectMilestones(token: string, projectId: number | string) {
  return requestJson<ProjectMilestoneRecord[]>(
    `/api/projects/${encodeURIComponent(String(projectId))}/milestones`,
    { token },
  );
}

export async function fetchProjectLabels(token: string, projectId: number | string) {
  return requestJson<TaskLabelRecord[]>(
    `/projects/${encodeURIComponent(String(projectId))}/labels`,
    { token },
  );
}

export async function createTaskLabel(
  token: string,
  payload: {
    name: string;
    colorCode?: string | null;
    projectId?: number | null;
    description?: string | null;
  },
) {
  return requestJson<TaskLabelRecord>(`/api/labels`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function fetchTaskById(token: string, taskId: number | string) {
  return requestJson<TaskDetailRecord>(`/projects/tasks/${encodeURIComponent(String(taskId))}`, { token });
}

export function buildTaskFormData(payload: TaskMutationPayload) {
  const formData = new FormData();

  formData.append("projectId", payload.projectId);
  formData.append("title", payload.title);
  formData.append("category", payload.category);

  if (payload.startDate) formData.append("startDate", payload.startDate);
  if (payload.dueDate) formData.append("dueDate", payload.dueDate);
  if (payload.taskStageId) formData.append("taskStageId", payload.taskStageId);
  if (payload.description) formData.append("description", payload.description);
  if (payload.milestoneId) formData.append("milestoneId", payload.milestoneId);
  if (payload.priority) formData.append("priority", payload.priority);

  formData.append("isPrivate", String(Boolean(payload.isPrivate)));
  formData.append("timeEstimate", String(Boolean(payload.timeEstimate)));
  formData.append("isDependent", String(Boolean(payload.isDependent)));

  if (payload.timeEstimateMinutes) {
    formData.append("timeEstimateMinutes", payload.timeEstimateMinutes);
  }

  if (payload.dependentTaskId) {
    formData.append("dependentTaskId", payload.dependentTaskId);
  }

  for (const employeeId of payload.assignedEmployeeIds ?? []) {
    formData.append("assignedEmployeeIds", employeeId);
  }

  for (const labelId of payload.labelIds ?? []) {
    formData.append("labelIds", labelId);
  }

  if (payload.file) {
    formData.append("taskFile", payload.file);
  }

  return formData;
}

export async function createProjectTask(token: string, payload: TaskMutationPayload) {
  return requestJson<TaskDetailRecord>(`/api/projects/tasks`, {
    method: "POST",
    token,
    body: buildTaskFormData(payload),
  });
}

export async function updateProjectTask(token: string, taskId: number | string, payload: TaskMutationPayload) {
  return requestJson<TaskDetailRecord>(`/api/projects/tasks/${encodeURIComponent(String(taskId))}`, {
    method: "PUT",
    token,
    body: buildTaskFormData(payload),
  });
}

export async function fetchTaskFiles(token: string, taskId: number | string) {
  return requestJson<TaskFileRecord[]>(`/files/tasks/${encodeURIComponent(String(taskId))}`, { token });
}

export async function uploadTaskFile(token: string, taskId: number | string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<TaskFileRecord>(`/files/tasks/${encodeURIComponent(String(taskId))}`, {
    method: "POST",
    token,
    body: formData,
  });
}

export async function deleteProjectFile(token: string, fileId: number | string) {
  return requestJson<null>(`/files/${encodeURIComponent(String(fileId))}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchTaskSubtasks(token: string, taskId: number | string) {
  return requestJson<TaskSubtaskRecord[]>(`/tasks/${encodeURIComponent(String(taskId))}/subtasks`, { token });
}

export async function createTaskSubtask(
  token: string,
  taskId: number | string,
  payload: { title: string; description?: string | null; isDone?: boolean | null },
) {
  return requestJson<TaskSubtaskRecord>(`/tasks/${encodeURIComponent(String(taskId))}/subtasks`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateTaskSubtask(
  token: string,
  taskId: number | string,
  subtaskId: number | string,
  payload: { title?: string; description?: string | null; isDone?: boolean | null },
) {
  return requestJson<TaskSubtaskRecord>(
    `/tasks/${encodeURIComponent(String(taskId))}/subtasks/${encodeURIComponent(String(subtaskId))}`,
    {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    },
  );
}

export async function toggleTaskSubtask(token: string, taskId: number | string, subtaskId: number | string) {
  return requestJson<TaskSubtaskRecord>(
    `/tasks/${encodeURIComponent(String(taskId))}/subtasks/${encodeURIComponent(String(subtaskId))}`,
    {
      method: "PATCH",
      token,
    },
  );
}

export async function deleteTaskSubtask(token: string, taskId: number | string, subtaskId: number | string) {
  return requestJson<null>(
    `/tasks/${encodeURIComponent(String(taskId))}/subtasks/${encodeURIComponent(String(subtaskId))}`,
    {
      method: "DELETE",
      token,
    },
  );
}

export async function fetchTaskNotes(token: string, taskId: number | string) {
  return requestJson<TaskNoteRecord[]>(`/tasks/${encodeURIComponent(String(taskId))}/notes`, { token });
}

export async function createTaskNote(
  token: string,
  taskId: number | string,
  payload: { title: string; content: string; isPublic?: boolean | null },
) {
  return requestJson<TaskNoteRecord>(`/tasks/${encodeURIComponent(String(taskId))}/notes`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteTaskNote(token: string, noteId: number | string) {
  return requestJson<null>(`/notes/task/${encodeURIComponent(String(noteId))}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchTaskTimesheet(token: string, taskId: number | string) {
  return requestJson<TaskTimeLogRecord[]>(`/timesheets/task/${encodeURIComponent(String(taskId))}`, { token });
}

export function readPinnedTaskIds(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(TASK_PIN_STORAGE_KEY);
    if (!raw) return [];
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map((id) => Number(id)).filter(Number.isFinite) : [];
  } catch {
    return [];
  }
}

export function writePinnedTaskIds(ids: number[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TASK_PIN_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

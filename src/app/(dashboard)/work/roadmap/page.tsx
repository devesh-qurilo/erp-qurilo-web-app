// app/(your-folder)/AllProjectsPage.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  Edit2,
  Pin,
  Trash2,
  Grid,
  Calendar,
  Filter,
  List,
  X,
  Archive,
} from "lucide-react";
import ProjectCalendarMonth from "./ProjectCalendarMonth";
import { format } from "date-fns";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


const MAIN = process.env.NEXT_PUBLIC_MAIN;
const projectsFromApi = `${MAIN}/api/projects`;
const STATUS_OPTIONS = [
  "IN_PROGRESS",
  "NOT_STARTED",
  "ON_HOLD",
  "CANCELLED",
  "FINISHED",
] as const;
type StatusOption = typeof STATUS_OPTIONS[number];

type Employee = {
  employeeId: string;
  name: string;
  profileUrl?: string | null;
  designation?: string;
};

interface Project {
  id: number;
  shortCode?: string;
  code?: string;
  projectCode?: string;
  name: string;
  startDate?: string;
  deadline?: string;
  noDeadline?: boolean;
  client?:
  | { name?: string; profilePictureUrl?: string | null; company?: string | null; clientId?: string }
  | null;
  currency?: string;
  budget?: number;
  progressPercent?: number | null;
  projectStatus?: StatusOption | null;
  assignedEmployees?: Employee[];
  pinned?: boolean;
  archived?: boolean;
  summary?: string;
  category?: string | number | null;
  department?: string | null;
  needsApproval?: boolean;
  calculateProgressThroughTasks?: boolean | null;
  addedBy?: string | null;
}

interface Category {
  id: string | number;
  name: string;
}

interface ClientItem {
  id: number;
  clientId: string;
  name: string;
  // other fields omitted
}

interface DepartmentItem {
  id: number;
  departmentName: string;
  parentDepartmentId?: number | null;
  parentDepartmentName?: string | null;
  createAt?: string;
}

const OVERRIDES_KEY = "projectProgressOverrides";

export default function AllProjectsPage() {
  // STATES (kept from your file)
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Filters & UI
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [progressFilter, setProgressFilter] = useState<string>("all");
  const [durationFrom, setDurationFrom] = useState<string | null>(null);
  const [durationTo, setDurationTo] = useState<string | null>(null);


  // drawer filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterMember, setFilterMember] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;

  // Add project modal & form
  const [showAddModal, setShowAddModal] = useState(false);
  const [shortCode, setShortCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [noDeadline, setNoDeadline] = useState(false);
  const [category, setCategory] = useState("none");
  const [department, setDepartment] = useState("none");
  const [client, setClientField] = useState("none");
  const [summary, setSummary] = useState("");
  const [needsApproval, setNeedsApproval] = useState(true);
  const [members, setMembers] = useState<string[] | string>("");

  // Company Details
  const [file, setFile] = useState<File | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState<string>("");
  const [hoursEstimate, setHoursEstimate] = useState<string>("");
  const [allowManualTimeLogs, setAllowManualTimeLogs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // addedBy
  const [addedBy, setAddedBy] = useState<string>("you");

  const [submitting, setSubmitting] = useState(false);

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Clients & Departments
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  // Update modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateProjectId, setUpdateProjectId] = useState<number | null>(null);

  // UI: view mode & quick filters
  type ViewMode = "grid" | "list" | "calendar";
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // LOCK BODY SCROLL WHEN DRAWER OR MODAL OPEN
  useEffect(() => {
    document.body.style.overflow = showFilters || showAddModal || showCategoryModal || showUpdateModal || calendarOpen ? "hidden" : "auto";
  }, [showFilters, showAddModal, showCategoryModal, showUpdateModal, calendarOpen]);

  // Build select options from fetched projects
  const projectOptions = Array.from(new Set(projects.map((p) => p.name))).filter(Boolean);
  const memberOptions = Array.from(
    new Set(projects.flatMap((p) => (p.assignedEmployees || []).map((e) => e.name)))
  ).filter(Boolean);

  // categoryOptions derived (id as string)
  const categoryOptions = categories.map((c) => ({ id: String(c.id), name: c.name }));

  // clientOptions from clients state
  const clientOptions = clients.map((c) => ({ id: String(c.id), name: c.name }));

  // departmentOptions from departments state
  const departmentOptions = departments.map((d) => ({ id: String(d.id), name: d.departmentName }));

  // local overrides helpers
  const readProgressOverrides = (): Record<string, number> => {
    try {
      const raw = localStorage.getItem(OVERRIDES_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, number>;
    } catch {
      return {};
    }
  };
  const writeProgressOverrides = (map: Record<string, number>) => {
    try {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map));
    } catch { }
  };
  const setProgressOverrideFor = (projectId: number, percent: number | null) => {
    const map = readProgressOverrides();
    const key = String(projectId);
    if (percent == null) delete map[key];
    else map[key] = percent;
    writeProgressOverrides(map);
  };

  // fetch projects
  const getProjects = useCallback(
    async (accessToken?: string | null) => {
      setLoading(true);
      try {
        const resolvedToken =
          accessToken ||
          (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null) ||
          token ||
          null;

        if (!resolvedToken) {
          setProjects([]);
          setTotalPages(1);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
          search: searchQuery || "",
          status: statusFilter !== "all" ? statusFilter : "",
          progress: progressFilter !== "all" ? progressFilter : "",
          project: filterProject !== "all" ? filterProject : "",
          member: filterMember !== "all" ? filterMember : "",
          client: filterClient !== "all" ? filterClient : "",
        });


        const res = await fetch(`${MAIN}/api/projects?${params.toString()}`, {
          headers: { Authorization: `Bearer ${resolvedToken}` },
          cache: "no-store",
        });

        if (res.status === 401) {
          try { localStorage.removeItem("accessToken"); } catch { }
          setToken(null);
          setProjects([]);
          setTotalPages(1);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("getProjects failed", res.status, text);
          throw new Error("Failed to load projects");
        }

        const data = await res.json();
        let fetched: Project[] = [];
        if (Array.isArray(data)) fetched = data;
        else {
          fetched = data.projects || data.items || [];
          setTotalPages(data.totalPages || Math.max(1, Math.ceil((data.total || itemsPerPage) / itemsPerPage)));
        }

        // apply local overrides
        const overrides = readProgressOverrides();
        if (Object.keys(overrides).length > 0) {
          fetched = fetched.map((p) => {
            const o = overrides[String(p.id)];
            if (o != null) return { ...p, progressPercent: o };
            return p;
          });
        }

        setProjects(fetched);
      } catch (err) {
        console.error("Error loading projects:", err);
        setProjects([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, searchQuery, statusFilter, progressFilter, filterProject, filterMember, filterClient, token]

  );

  // CATEGORY helpers: load, add, delete
  const loadCategories = useCallback(async (accessToken?: string | null) => {
    setCatLoading(true);
    try {
      const resolvedToken = accessToken || token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
      const res = await fetch(`${MAIN}/api/projects/category`, {
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn("Failed to load categories, status:", res.status);
        setCategories([]);
        setCatLoading(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === "string") {
          setCategories(data.map((n, i) => ({ id: i + 1, name: String(n) })));
        } else {
          setCategories(data.map((d: any) => ({ id: d.id ?? d.name ?? Math.random(), name: d.name ?? String(d) })));
        }
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  }, [token]);

  const openCategoryModal = async () => {
    setShowCategoryModal(true);
    await loadCategories();
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setNewCategoryName("");
  };

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return alert("Category name required");
    setCatSubmitting(true);
    const prev = categories.slice();
    const temp: Category = { id: `temp-${Date.now()}`, name };
    setCategories((c) => [...c, temp]);
    try {
      const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
      const res = await fetch(`${MAIN}/api/projects/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
        },
        body: JSON.stringify({ name }),
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Add category failed", res.status, text);
        setCategories(prev);
        alert("Failed to add category");
        return;
      }
      const created = await res.json().catch(() => null);
      if (created && (created.id || created.name)) {
        setCategories((cur) => cur.map((c) => (c.id === temp.id ? { id: created.id ?? created.name ?? Math.random(), name: created.name ?? name } : c)));
        setCategory(String(created.id ?? created.name ?? name));
      } else {
        await loadCategories();
        const found = categories.find((c) => c.name === name);
        if (found) setCategory(String(found.id));
      }
      setNewCategoryName("");
    } catch (err) {
      console.error("Add category error:", err);
      setCategories(prev);
      alert("Failed to add category");
    } finally {
      setCatSubmitting(false);
    }
  };

  const deleteCategory = async (catId: string | number) => {
    if (!confirm("Delete this category?")) return;
    const prev = categories.slice();
    setCategories((c) => c.filter((x) => x.id !== catId));
    try {
      const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
      const res = await fetch(`${MAIN}/api/projects/category/${encodeURIComponent(String(catId))}`, {
        method: "DELETE",
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error("Delete category failed:", err);
      setCategories(prev);
      alert("Failed to delete category");
    }
  };

  // CLIENTS loader
  const loadClients = useCallback(async (accessToken?: string | null) => {
    setClientLoading(true);
    try {
      const resolvedToken = accessToken || token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
      // endpoint as provided: {{main}}/clients
      const res = await fetch(`${MAIN}/clients`, {
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn("Failed to load clients, status:", res.status);
        setClients([]);
        setClientLoading(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        // expecting array of client objects
        setClients(data as ClientItem[]);
      } else if (Array.isArray(data.items)) {
        setClients(data.items as ClientItem[]);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error("Error loading clients:", err);
      setClients([]);
    } finally {
      setClientLoading(false);
    }
  }, [token]);

  // DEPARTMENTS loader
  const loadDepartments = useCallback(async (accessToken?: string | null) => {
    setDeptLoading(true);
    try {
      const resolvedToken = accessToken || token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
      // endpoint as provided: {{main}}/admin/departments
      const res = await fetch(`${MAIN}/admin/departments`, {
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn("Failed to load departments, status:", res.status);
        setDepartments([]);
        setDeptLoading(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartments(data as DepartmentItem[]);
      } else if (Array.isArray(data.items)) {
        setDepartments(data.items as DepartmentItem[]);
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error("Error loading departments:", err);
      setDepartments([]);
    } finally {
      setDeptLoading(false);
    }
  }, [token]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery((prev) => {
        if (prev !== searchInput) {
          setCurrentPage(1);
          return searchInput;
        }
        return prev;
      });
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  // initial token & load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("accessToken");
      setToken(savedToken);
      // load selects regardless of projects auth (but use token if present)
      loadCategories(savedToken || null);
      loadClients(savedToken || null);
      loadDepartments(savedToken || null);
      if (savedToken) getProjects(savedToken);
      else setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token && typeof window !== "undefined") {
      const fromStorage = localStorage.getItem("accessToken");
      if (fromStorage) {
        setToken(fromStorage);
        getProjects(fromStorage);
        // reload selects with token
        loadCategories(fromStorage);
        loadClients(fromStorage);
        loadDepartments(fromStorage);
        return;
      }
      return;
    }
    if (token) getProjects(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getProjects, token, currentPage, searchQuery, statusFilter, progressFilter, filterProject, filterMember, filterClient]);

  // UPDATES (status/progress/pin/delete/archive)
  async function patchStatus(projectId: number, newStatus: StatusOption) {
    if (!token) return alert("Not authenticated");
    const prev = projects;
    setProjects((ps) => ps.map((pr) => (pr.id === projectId ? { ...pr, projectStatus: newStatus } : pr)));
    try {
      const fd = new FormData();
      fd.append("status", newStatus);
      const res = await fetch(`${MAIN}/api/projects/${projectId}/status`, {
        method: "PUT",
        body: fd,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      // if (!res.ok) throw new Error(`Status patch failed ${res.status}`);

      let json: any = null;
      try { json = await res.json(); } catch { json = null; }

      if (json && json.id) {
        setProjects((ps) => ps.map((pr) => (pr.id === json.id ? { ...pr, ...json } : pr)));
        if (json.progressPercent != null) setProgressOverrideFor(json.id, null);
      } else {
        await getProjects(token);
      }
    } catch (err) {
      console.error("Status update failed", err);
      setProjects(prev);
      alert("Failed to update status on server");
    }
  }

  async function patchProgress(projectId: number, percent: number) {
    if (!token) return alert("Not authenticated");
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const prev = projects;
    setProjects((ps) => ps.map((pr) => (pr.id === projectId ? { ...pr, progressPercent: clamped } : pr)));
    setProgressOverrideFor(projectId, clamped);

    try {
      const fd = new FormData();
      fd.append("percent", String(clamped));
      const res = await fetch(`${MAIN}/api/projects/${projectId}/progress`, {
        method: "PUT",
        body: fd,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (res.status === 401) {
        console.error("patchProgress 401 unauthorized");
        setProjects(prev);
        setProgressOverrideFor(projectId, null);
        localStorage.removeItem("accessToken");
        setToken(null);
        alert("Session expired. Please login again.");
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("patchProgress failed:", res.status, text);
        setProjects(prev);
        setProgressOverrideFor(projectId, null);
        alert("Failed to update progress on server");
        return;
      }

      let json: any = null;
      try {
        if (res.status !== 204) json = await res.json();
        else json = null;
      } catch { json = null; }

      if (json && json.id) {
        setProjects((ps) => ps.map((pr) => (pr.id === json.id ? { ...pr, ...json } : pr)));
        if (json.progressPercent != null) setProgressOverrideFor(json.id, null);
      } else {
        await getProjects(token);
      }
    } catch (err) {
      console.error("Progress update failed:", err);
      setProjects(prev);
      setProgressOverrideFor(projectId, null);
      alert("Failed to update progress on server");
    }
  }

  const handlePin = async (projectId: number) => {
    if (!token) return alert("Not authenticated");
    const prev = projects;
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return;
    const newPinned = !projects[idx].pinned;
    setProjects((ps) => ps.map((pr) => (pr.id === projectId ? { ...pr, pinned: newPinned } : pr)));
    try {
      const res = await fetch(`${MAIN}/projects/${projectId}/pin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: newPinned }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Pin failed");
      try {
        const json = await res.json();
        if (json && json.id) setProjects((ps) => ps.map((pr) => (pr.id === json.id ? { ...pr, ...json } : pr)));
        else await getProjects(token);
      } catch {
        await getProjects(token);
      }
    } catch (err) {
      console.error(err);
      setProjects(prev);
      alert("Failed to toggle pin");
    }
  };

  const handleArchive = async (projectId: number) => {
    if (!token) return alert("Not authenticated");
    const prev = projects;
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return;
    const newArchived = !projects[idx].archived;
    setProjects((ps) => ps.map((pr) => (pr.id === projectId ? { ...pr, archived: newArchived } : pr)));
    try {
      const res = await fetch(`${MAIN}/projects/${projectId}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ archived: newArchived }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Archive toggle failed");
      try {
        const json = await res.json();
        if (json && json.id) {
          setProjects((ps) => ps.map((pr) => (pr.id === json.id ? { ...pr, ...json } : pr)));
        } else {
          await getProjects(token);
        }
      } catch {
        await getProjects(token);
      }
    } catch (err) {
      console.error("Archive toggle error:", err);
      setProjects(prev);
      alert("Failed to toggle archive state on server");
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!confirm("Delete this project?")) return;
    const prev = projects;
    setProjects((ps) => ps.filter((p) => p.id !== projectId));
    try {
      const res = await fetch(`${MAIN}/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Delete failed");
      setProgressOverrideFor(projectId, null);
    } catch (err) {
      console.error(err);
      setProjects(prev);
      alert("Failed to delete project");
    }
  };

  // ---------- Add Project form handlers ----------
  const resetAddForm = () => {
    setShortCode("");
    setProjectName("");
    setStartDate("");
    setDeadline("");
    setNoDeadline(false);
    setCategory("none");
    setDepartment("none");
    setClientField("none");
    setSummary("");
    setNeedsApproval(true);
    setMembers("");
    setFile(null);
    setCurrency("USD");
    setBudget("");
    setHoursEstimate("");
    setAllowManualTimeLogs(false);
    setAddedBy("you");
    setSubmitting(false);
  };

  const handleChooseFileClick = () => fileInputRef.current?.click();
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null);

  // createProject: FIXED to always include deadline key & proper field mappings
  const createProject = async () => {
    if (!projectName.trim()) return alert("Project Name is required");
    setSubmitting(true);

    try {
      // ensure shortCode
      let sc = shortCode.trim();
      if (!sc) {
        const slug = projectName
          .toString()
          .normalize("NFKD")
          .replace(/[\u0300-\u036F]/g, "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        sc = (slug ? slug.toUpperCase().replace(/-/g, "").slice(0, 10) : `PRJ${Date.now().toString().slice(-6)}`);
      }

      const fd = new FormData();
      fd.append("shortCode", sc);
      fd.append("name", projectName);
      // Some backends expect projectName key — add both for safety
      fd.append("projectName", projectName);

      // Dates: always include keys (backend expects deadline param present)
      fd.append("startDate", startDate || "");
      if (noDeadline) {
        fd.append("deadline", "");
      } else {
        fd.append("deadline", deadline || "");
      }
      fd.append("noDeadline", String(Boolean(noDeadline)));

      // basic fields
      fd.append("category", category === "none" ? "" : String(category));
      fd.append("department", department === "none" ? "" : String(department));
      fd.append("clientId", client === "none" ? "" : String(client));

      fd.append("summary", summary || "");
      fd.append("tasksNeedAdminApproval", String(Boolean(needsApproval)));

      const assignedArray = Array.isArray(members)
        ? members
        : String(members || "").split(",").map((s) => s.trim()).filter(Boolean);

      // backend expects a Set<String> — send JSON array under 'assignedEmployeeIds'
      fd.append("assignedEmployeeIds", JSON.stringify(assignedArray));

      if (file) fd.append("companyFile", file);

      fd.append("currency", currency || "");
      // budget may be optional — send "0" if empty to avoid parse issues
      fd.append("budget", budget !== "" ? String(budget) : "0");
      fd.append("hoursEstimate", hoursEstimate !== "" ? String(hoursEstimate) : "0");
      fd.append("allowManualTimeLogs", String(Boolean(allowManualTimeLogs)));

      fd.append("addedBy", String(addedBy || ""));

      const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

      const res = await fetch(`${MAIN}/api/projects`, {
        method: "POST",
        body: fd,
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Create project failed", res.status, text);
        let message = `Failed to create project (status ${res.status})`;
        try {
          const json = JSON.parse(text || "{}");
          if (json && json.message) message = json.message;
        } catch { }
        alert(message);
        setSubmitting(false);
        return;
      }

      try { await res.json(); } catch { }
      await getProjects(resolvedToken);
      setShowAddModal(false);
      resetAddForm();
    } catch (err) {
      console.error("Create project error", err);
      alert("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- UPDATE (Edit) modal logic ----------
  function UpdateProjectModal({
    projectId,
    onClose,
    onSaved,
  }: {
    projectId: number | null;
    onClose: () => void;
    onSaved: () => void;
  }) {
    const [loadingLocal, setLoadingLocal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [ucShortCode, setUcShortCode] = useState("");
    const [ucProjectName, setUcProjectName] = useState("");
    const [ucStartDate, setUcStartDate] = useState("");
    const [ucDeadline, setUcDeadline] = useState("");
    const [ucNoDeadline, setUcNoDeadline] = useState(false);
    const [ucCategory, setUcCategory] = useState("none");
    const [ucDepartment, setUcDepartment] = useState("none");
    const [ucClient, setUcClient] = useState("none");
    const [ucSummary, setUcSummary] = useState("");
    const [ucNeedsApproval, setUcNeedsApproval] = useState(true);
    const [ucMembers, setUcMembers] = useState<string | string[]>("");

    const [ucFile, setUcFile] = useState<File | null>(null);
    const ucFileRef = useRef<HTMLInputElement | null>(null);
    const [ucCurrency, setUcCurrency] = useState("USD");
    const [ucBudget, setUcBudget] = useState("");
    const [ucHours, setUcHours] = useState("");
    const [ucAllowManualTime, setUcAllowManualTime] = useState(false);

    const [ucProjectStatus, setUcProjectStatus] = useState<StatusOption | "none">("none");
    const [ucProgress, setUcProgress] = useState<number>(0);
    const [ucCalculateThroughTasks, setUcCalculateThroughTasks] = useState<boolean>(false);

    const [ucAddedBy, setUcAddedBy] = useState<string>("you");

    const resetLocal = () => {
      setUcShortCode("");
      setUcProjectName("");
      setUcStartDate("");
      setUcDeadline("");
      setUcNoDeadline(false);
      setUcCategory("none");
      setUcDepartment("none");
      setUcClient("none");
      setUcSummary("");
      setUcNeedsApproval(true);
      setUcMembers("");
      setUcFile(null);
      setUcCurrency("USD");
      setUcBudget("");
      setUcHours("");
      setUcAllowManualTime(false);
      setUcProjectStatus("none");
      setUcProgress(0);
      setUcCalculateThroughTasks(false);
      setUcAddedBy("you");
    };

    useEffect(() => {
      if (!projectId) return;
      let mounted = true;
      (async () => {
        setLoadingLocal(true);
        try {
          const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
          const res = await fetch(`${MAIN}/api/projects/${projectId}`, {
            headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
            cache: "no-store",
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error("Failed to fetch project", res.status, text);
            if (mounted) alert("Failed to load project details");
            return;
          }
          const data = await res.json();
          if (!mounted) return;
          setUcShortCode(data.shortCode ?? data.code ?? data.projectCode ?? "");
          setUcProjectName(data.name ?? "");
          setUcStartDate(data.startDate ? data.startDate.split("T")[0] : (data.startDate ?? ""));
          setUcDeadline(data.deadline ? (data.deadline.split("T")[0]) : (data.deadline ?? ""));
          setUcNoDeadline(Boolean(data.noDeadline));
          setUcCategory(data.category ? String(data.category) : "none");
          setUcDepartment(data.department ?? "none");
          setUcClient(data.client?.clientId ? String(data.client.clientId) : (data.client?.name ?? data.client ?? "none"));
          setUcSummary(data.summary ?? "");
          setUcNeedsApproval(Boolean(data.tasksNeedAdminApproval ?? true));
          setUcMembers(Array.isArray(data.assignedEmployees) ? data.assignedEmployees.map((e: any) => e.name).join(",") : (data.members ?? ""));
          setUcCurrency(data.currency ?? "USD");
          setUcBudget(data.budget != null ? String(data.budget) : "");
          setUcHours(data.hoursEstimate != null ? String(data.hoursEstimate) : "");
          setUcAllowManualTime(Boolean(data.allowManualTimeLogs ?? false));
          setUcProjectStatus((data.projectStatus ?? "none") as StatusOption | "none");
          setUcProgress(Number(data.progressPercent ?? 0));
          setUcCalculateThroughTasks(Boolean(data.calculateProgressThroughTasks ?? false));
          setUcAddedBy(data.addedBy ?? "you");
        } catch (err) {
          console.error("Error loading project:", err);
          if (mounted) alert("Failed to load project details");
        } finally {
          if (mounted) setLoadingLocal(false);
        }
      })();
      return () => { mounted = false; };
    }, [projectId, token]);

    const pickFile = () => ucFileRef.current?.click();
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setUcFile(e.target.files?.[0] ?? null);

    const saveUpdate = async () => {
      if (!projectId) return;
      if (!ucProjectName.trim()) return alert("Project name required");
      setSaving(true);
      try {
        const fd = new FormData();
        if (ucShortCode) fd.append("shortCode", ucShortCode);
        fd.append("name", ucProjectName);
        if (ucStartDate) fd.append("startDate", ucStartDate);
        // always append deadline key
        if (ucNoDeadline) fd.append("deadline", "");
        else fd.append("deadline", ucDeadline || "");
        fd.append("noDeadline", String(Boolean(ucNoDeadline)));
        fd.append("category", ucCategory === "none" ? "" : ucCategory);
        fd.append("department", ucDepartment === "none" ? "" : ucDepartment);
        fd.append("clientId", ucClient === "none" ? "" : ucClient);
        fd.append("summary", ucSummary || "");
        fd.append("tasksNeedAdminApproval", String(Boolean(ucNeedsApproval)));
        const assignedArray = Array.isArray(ucMembers) ? ucMembers : String(ucMembers || "").split(",").map((s) => s.trim()).filter(Boolean);
        fd.append("assignedEmployeeIds", JSON.stringify(assignedArray));

        if (ucFile) fd.append("companyFile", ucFile);
        fd.append("currency", ucCurrency || "");
        fd.append("budget", ucBudget || "0");
        fd.append("hoursEstimate", ucHours || "0");
        fd.append("allowManualTimeLogs", String(Boolean(ucAllowManualTime)));

        if (ucProjectStatus && ucProjectStatus !== "none") fd.append("projectStatus", String(ucProjectStatus));
        if (typeof ucProgress !== "undefined" && ucProgress !== null && !Number.isNaN(Number(ucProgress))) {
          fd.append("progressPercent", String(Math.max(0, Math.min(100, Math.round(ucProgress || 0)))));
        }
        fd.append("calculateProgressThroughTasks", String(Boolean(ucCalculateThroughTasks)));

        fd.append("addedBy", String(ucAddedBy || ""));

        const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

        const res = await fetch(`${MAIN}/api/projects/${projectId}`, {
          method: "PUT",
          body: fd,
          headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("Update failed", res.status, text);
          alert("Failed to update project");
          return;
        }

        let json: any = null;
        try { json = await res.json(); } catch { json = null; }

        if (json && json.id) {
          setProjects((ps) => ps.map((p) => (p.id === json.id ? { ...p, ...json } : p)));
        } else {
          await getProjects(resolvedToken);
        }

        onSaved();
        onClose();
        resetLocal();
      } catch (err) {
        console.error("Update error:", err);
        alert("Failed to update project");
      } finally {
        setSaving(false);
      }
    };

    const getProgressColor = (p?: number | null) => {
      if (p === undefined || p === null) return "bg-gray-300";
      if (p < 33) return "bg-red-500";
      if (p < 66) return "bg-yellow-400";
      return "bg-green-500";
    };

    return (
      <div className="fixed inset-0 z-[12000] flex items-start justify-center pt-12 px-4 overflow-y-auto;
">
        <div className="fixed inset-0 bg-black/40" onClick={() => { onClose(); resetLocal(); }} />
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-y-auto z-10">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Update Project</h3>
            <button onClick={() => { onClose(); resetLocal(); }} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 space-y-6">
            {loadingLocal ? (
              <p className="p-4 text-center">Loading project...</p>
            ) : (
              <>
                {/* Project Details */}
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">Project Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Short Code *</label>
                      <Input value={ucShortCode} onChange={(e) => setUcShortCode(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Project Name  *</label>
                      <Input value={ucProjectName} onChange={(e) => setUcProjectName(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Start Date *</label>
                      <Input type="date" value={ucStartDate} onChange={(e) => setUcStartDate(e.target.value)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-sm text-gray-600">Deadline *</label>
                          <Input type="date" value={ucDeadline} onChange={(e) => setUcDeadline(e.target.value)} disabled={ucNoDeadline} />
                        </div>
                        <div className="pt-6">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={ucNoDeadline} onChange={(e) => setUcNoDeadline(e.target.checked)} />
                            <span className="text-xs">There is no project deadline</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Project Category *</label>
                      <div className="flex gap-2">
                        <Select value={ucCategory} onValueChange={(v) => setUcCategory(v)}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">--</SelectItem>
                            {categoryOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={openCategoryModal}>Add</Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Department *</label>
                      <Select value={ucDepartment} onValueChange={(v) => setUcDepartment(v)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">--</SelectItem>
                          {departmentOptions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Client *</label>
                      <Select value={ucClient} onValueChange={(v) => setUcClient(v)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">--</SelectItem>
                          {clientOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">Project Summary</label>
                      <textarea rows={4} value={ucSummary} onChange={(e) => setUcSummary(e.target.value)} className="w-full p-2 border rounded" />
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Tasks needs approval by Admin</div>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2">
                          <input type="radio" name="ucApproval" checked={ucNeedsApproval === true} onChange={() => setUcNeedsApproval(true)} />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input type="radio" name="ucApproval" checked={ucNeedsApproval === false} onChange={() => setUcNeedsApproval(false)} />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Assigned to *</label>
                      <Input placeholder="Comma separated names or ids" value={Array.isArray(ucMembers) ? ucMembers.join(",") : ucMembers} onChange={(e) => setUcMembers(e.target.value)} />
                    </div>

                    {/* NEW: Project Status + Project Progress Status row (spans two columns) */}
                    <div className="col-span-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <label className="text-sm text-gray-600">Project Status</label>
                          <Select value={ucProjectStatus} onValueChange={(v) => setUcProjectStatus(v as StatusOption | "none")}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">--</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                              <SelectItem value="ON_HOLD">On Hold</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              <SelectItem value="FINISHED">Finished</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-1/2">
                          <label className="text-sm text-gray-600">Project Progress Status</label>
                          <div className="mt-2">
                            <div className="relative bg-gray-200 h-4 rounded-full overflow-hidden">
                              <div className={`h-4 rounded-full ${getProgressColor(ucProgress)}`} style={{ width: `${Math.max(0, Math.min(100, ucProgress))}%` }} />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xs font-semibold text-white drop-shadow-sm">{Math.round(ucProgress)}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <input type="range" min={0} max={100} value={ucProgress} onChange={(e) => setUcProgress(Number(e.target.value))} className="flex-1" />
                              <label className="inline-flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={ucCalculateThroughTasks} onChange={(e) => setUcCalculateThroughTasks(e.target.checked)} />
                                <span className="text-xs">Calculate Progress through tasks</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Company Details (single) */}
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">Company Details</h4>

                  <div className="mb-4">
                    <label className="text-sm text-gray-600 mb-2 block">Add File</label>
                    <div onClick={pickFile} className="border-2 border-dashed rounded-lg h-28 flex items-center justify-center cursor-pointer text-gray-500">
                      {ucFile ? <div>{ucFile.name}</div> : <div>Choose File</div>}
                      <input ref={ucFileRef} type="file" className="hidden" onChange={onFileChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Currency</label>
                      <Select value={ucCurrency} onValueChange={(v) => setUcCurrency(v)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="USD" /></SelectTrigger>
                        <SelectContent>
                          {/* <SelectItem value="USD">USD $</SelectItem>
                          <SelectItem value="USD">USD ₹</SelectItem>
                          <SelectItem value="EUR">EUR €</SelectItem> */}



                          <SelectItem value="USD">USD $ (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR € (Euro)</SelectItem>
                          <SelectItem value="GBP">GBP £ (British Pound)</SelectItem>
                          <SelectItem value="CHF">CHF ₣ (Swiss Franc)</SelectItem>
                          <SelectItem value="SEK">SEK kr</SelectItem>
                          <SelectItem value="NOK">NOK kr</SelectItem>
                          <SelectItem value="DKK">DKK kr</SelectItem>
                          <SelectItem value="PLN">PLN zł</SelectItem>
                          <SelectItem value="CZK">CZK Kč</SelectItem>
                          <SelectItem value="HUF">HUF Ft</SelectItem>
                          <SelectItem value="RON">RON lei</SelectItem>



                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Project Budget</label>
                      <Input value={ucBudget} onChange={(e) => setUcBudget(e.target.value)} />
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Hours Estimate (In Hours)</label>
                      <Input value={ucHours} onChange={(e) => setUcHours(e.target.value)} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={ucAllowManualTime} onChange={(e) => setUcAllowManualTime(e.target.checked)} />
                        <span className="text-sm text-gray-600">Allow manual time logs </span>
                      </label>
                    </div>

                    {/* NEW: Added by select (right aligned) */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 mr-2">Added by*</label>
                      <Select value={ucAddedBy} onValueChange={(v) => setUcAddedBy(v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="You" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="you">You</SelectItem>
                          {memberOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => { onClose(); resetLocal(); }}>Cancel</Button>
                  <Button className="bg-blue-600 text-white" onClick={saveUpdate} disabled={saving}>
                    {saving ? "Updating..." : "Update"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Calendar view component (kept as you had) ----------
  // ... (omitted here for brevity in this paste; use your CalendarView implementation from earlier)
  // For brevity in this reply I kept the earlier CalendarView logic — if you want, I can paste the same CalendarView back in here unchanged.
  // ---------- end CalendarView ----------

  // ---------- UI helpers ----------
  const getProgressColor = (p?: number | null) => {
    if (p === undefined || p === null) return "bg-gray-300";
    if (p < 33) return "bg-red-500";
    if (p < 66) return "bg-yellow-400";
    return "bg-green-500";
  };

  function badgeDotColor(status?: string | null) {
    switch (status) {
      case "IN_PROGRESS": return "#10B981";
      case "NOT_STARTED": return "#9CA3AF";
      case "ON_HOLD": return "#F59E0B";
      case "CANCELLED": return "#EF4444";
      case "FINISHED": return "#3B82F6";
      default: return "#9CA3AF";
    }
  }

  function statusBadgeClas(status?: string | null) {
    switch (status) {
      case "IN_PROGRESS": return "bg-green-600 text-white";
      case "NOT_STARTED": return "bg-gray-400 text-white";
      case "ON_HOLD": return "bg-yellow-500 text-white";
      case "CANCELLED": return "bg-red-600 text-white";
      case "FINISHED": return "bg-blue-600 text-white";
      default: return "bg-gray-400 text-white";
    }
  }

  const projectCodeFor = (p: Project) => p.shortCode || p.code || p.projectCode || `RTA-${String(p.id).padStart(2, "0")}`;

  const openFilters = () => setShowFilters(true);
  const closeFilters = () => setShowFilters(false);
  const applyFilters = async () => { setCurrentPage(1); await getProjects(token ?? null); setShowFilters(false); };
  const resetDrawerFilters = async () => { setFilterProject("all"); setFilterMember("all"); setFilterClient("all"); setCurrentPage(1); await getProjects(token ?? null); setShowFilters(false); };

  const setStatusAndApply = (status?: string | null) => { setStatusFilter(status ?? "all"); setCurrentPage(1); };
  const setProgressBucketAndApply = (percent: number | null) => {
    if (percent == null) setProgressFilter("all");
    else if (percent <= 33) setProgressFilter("0-33");
    else if (percent <= 66) setProgressFilter("34-66");
    else setProgressFilter("67-100");
    setCurrentPage(1);
  };



  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      /* -------- STATUS -------- */
      if (statusFilter !== "all") {
        if (!p.projectStatus) return false;
        if (p.projectStatus !== statusFilter) return false;
      }

      /* -------- PROGRESS -------- */
      if (progressFilter !== "all") {
        if (typeof p.progressPercent !== "number") return false;

        const v = p.progressPercent;
        if (progressFilter === "0-33" && !(v >= 0 && v <= 33)) return false;
        if (progressFilter === "34-66" && !(v >= 34 && v <= 66)) return false;
        if (progressFilter === "67-100" && !(v >= 67 && v <= 100)) return false;
      }

      /* -------- DURATION (CALENDAR) -------- */
      if (durationFrom || durationTo) {
        const start = p.startDate ? new Date(p.startDate) : null;
        const end = p.deadline ? new Date(p.deadline) : null;

        if (!start || !end) return false;

        if (durationFrom) {
          const from = new Date(durationFrom);
          if (start < from) return false;
        }

        if (durationTo) {
          const to = new Date(durationTo);
          if (end > to) return false;
        }
      }

      return true;
    });
  }, [
    projects,
    statusFilter,
    progressFilter,
    durationFrom,
    durationTo,
  ]);



  // if (loading) return <p className="p-8 text-center">Loading projects...</p>;

  // Row component reused (same as your file) — uses clientOptions/departments/categories data loaded above
  const ProjectRow: React.FC<{ p: Project }> = ({ p }) => {
    const start = p.startDate ?
      //  new Date(p.startDate).toLocaleDateString() 
      format(new Date(p.startDate), "dd-MM-yyyy")
      : "-";
    const dl = p.noDeadline ? "No Deadline" : p.deadline ?
      //  new Date(p.deadline).toLocaleDateString()
      format(new Date(p.deadline), "dd-MM-yyyy")
      : "-";
    const progress = Math.max(0, Math.min(100, p.progressPercent ?? 0));
    const barColor = getProgressColor(progress);

    return (
      <TableRow key={p.id} className="bg-white hover:bg-gray-50">
        <TableCell className="py-4 px-4 align-top w-28"><div className="text-sm font-medium">{projectCodeFor(p)}</div></TableCell>
        <TableCell className="py-4 px-4 align-top"><div className="font-medium">{p.name}</div></TableCell>
        <TableCell className="py-4 px-4 align-top">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {(p.assignedEmployees || []).slice(0, 3).map((emp) => (
                <div key={emp.employeeId} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100" title={emp.name}>
                  {emp.profileUrl ? <img src={emp.profileUrl} alt={emp.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-white bg-gray-400">{(emp.name || "U").charAt(0)}</div>}
                </div>
              ))}
              {(p.assignedEmployees || []).length > 3 && (<div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 text-xs text-gray-700 flex items-center justify-center">+{(p.assignedEmployees || []).length - 3}</div>)}
            </div>
          </div>
        </TableCell>
        <TableCell className="py-4 px-4 align-top text-sm">{start}</TableCell>
        <TableCell className="py-4 px-4 align-top text-sm">{dl}</TableCell>
        <TableCell className="py-4 px-4 align-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {p.client?.profilePictureUrl ? <img src={p.client.profilePictureUrl} alt={p.client?.name} className="w-full h-full object-cover" /> : <div className="text-xs text-gray-500">{(p.client?.name || "C").charAt(0)}</div>}
            </div>
            <div>
              <div className="text-sm font-medium">{p.client?.name ?? "Client"}</div>
              <div className="text-xs text-gray-400">{p.client?.company ?? ""}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-4 px-4 align-top">
          <div className="flex flex-col gap-2">
            <div className="w-44 cursor-pointer" title="Click to filter by this progress bucket" onClick={() => setProgressBucketAndApply(p.progressPercent ?? null)}>
              <div className="relative bg-gray-200 h-4 rounded-full overflow-hidden">
                <div className={`h-4 rounded-full ${barColor}`} style={{ width: `${progress}%` }} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-semibold text-white drop-shadow-sm">{progress}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${statusBadgeClas(p.projectStatus)}`} title="Click to filter by this status" onClick={() => setStatusAndApply(p.projectStatus)}>
                <span className="w-2 h-2 rounded-full" style={{ background: badgeDotColor(p.projectStatus) }} />
                <span>{p.projectStatus ?? "N/A"}</span>
              </button>

              <div className="relative">
                <DropdownMenu>
                  {/* <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-50"><span className="text-xs text-gray-500">▾</span></button>
                  </DropdownMenuTrigger> */}

                  {/* <DropdownMenuContent align="start" className="w-64 p-2">
                    <div className="text-xs text-gray-500 mb-1">Change status</div>
                    <div className="space-y-1">
                      {STATUS_OPTIONS.map((s) => (
                        <button key={s} onClick={() => patchStatus(p.id, s)} className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-50 ${s === p.projectStatus ? "font-medium" : ""}`}>{s}</button>
                      ))}
                    </div>

                    <DropdownMenuSeparator />
                    <div className="text-xs text-gray-500 mt-2 mb-1">Adjust progress</div>
                    <div>
                      <input type="range" min={0} max={100} value={p.progressPercent ?? 0}
                        onChange={(e) => { const v = Number(e.target.value); setProjects((prev) => prev.map((pr) => (pr.id === p.id ? { ...pr, progressPercent: v } : pr))); }}
                        onMouseUp={async (e) => { const v = Number((e.target as HTMLInputElement).value); await patchProgress(p.id, v); }}
                        onTouchEnd={async (e) => { const v = Number((e.target as HTMLInputElement).value); await patchProgress(p.id, v); }}
                        className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1"><span>0%</span><span>{p.progressPercent ?? 0}%</span><span>100%</span></div>
                    </div>

                    <div className="flex justify-end mt-2"><Button size="sm" variant="ghost" onClick={() => getProjects(token ?? null)}>Refresh</Button></div>
                  </DropdownMenuContent> */}
                </DropdownMenu>
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell className="py-4 px-4 align-top text-right">
          <DropdownMenu>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.location.assign(`/work/roadmap/${p.id}`)}><Eye className="h-4 w-4 mr-2" /> </Button>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => window.location.assign(`/work/roadmap/${p.id}`)}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  // ------------- Top-right action handlers -------------
  const toggleView = (mode: ViewMode) => {
    if (mode === "calendar") {
      setCalendarOpen(!calendarOpen);
      setViewMode(calendarOpen ? "grid" : "calendar");
    } else {
      setCalendarOpen(false);
      setViewMode(mode);
    }
  };

  const toggleArchivedOnly = () => {
    setShowArchivedOnly((s) => !s);
    // when viewing archived only, disable pinned-only to avoid confusion
    if (!showArchivedOnly && showPinnedOnly) setShowPinnedOnly(false);
  };

  const togglePinnedOnly = () => {
    setShowPinnedOnly((s) => !s);
    // when enabling pinned-only, disable archived-only to avoid confusion unless user wants both
    if (!showPinnedOnly && showArchivedOnly) setShowArchivedOnly(false);
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full">
        <div className="max-w-[1200px] mx-auto p-6  overflow-y-auto overflow-x-hidden">
          {/* TOP FILTER BAR */}
          <div className="bg-white rounded-lg border p-3 mb-4 flex items-center gap-4 overflow-y-auto overflow-x-hidden">
            {/* Duration Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Duration</span>

              <Input
                type="date"
                value={durationFrom ?? ""}
                onChange={(e) => {
                  setDurationFrom(e.target.value || null);
                  setCurrentPage(1);
                }}
                className="w-40"
              />

              <span className="text-gray-400 text-sm">to</span>

              <Input
                type="date"
                value={durationTo ?? ""}
                onChange={(e) => {
                  setDurationTo(e.target.value || null);
                  setCurrentPage(1);
                }}
                className="w-40"
              />
            </div>


            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Status</span>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="FINISHED">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Progress</span>
              <Select value={progressFilter} onValueChange={(v) => { setProgressFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="0-33">0 - 33%</SelectItem>
                  <SelectItem value="34-66">34 - 66%</SelectItem>
                  <SelectItem value="67-100">67 - 100%</SelectItem>
                </SelectContent>
              </Select>
            </div>


          </div>

          {/* ROW: Add Project + Search + Top-right icons */}


          {/* MAIN content area */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="bg-blue-50 px-6 py-3 border-b flex items-center justify-between">
              {/* <h2 className="font-semibold text-gray-900">Projects ({filteredProjects.length})</h2> */}

              {loading ? (
                <Skeleton width={200} height={20} />
              ) : (
                <h2 className="font-semibold text-gray-900">
                  Projects ({filteredProjects.length})
                </h2>
              )}


              <div className="text-sm text-gray-600">{showArchivedOnly ? "Viewing: Archived" : showPinnedOnly ? "Viewing: Pinned" : "All active"}</div>
            </div>

            <div className="overflow-auto p-4">
              {viewMode === "calendar" || calendarOpen ? (


                <ProjectCalendarMonth />



                // {/* </div> */}
              ) : viewMode === "list" ? (
                // Compact list
                <div>
                  {filteredProjects.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No projects found</div>
                  ) : (
                    <div className="space-y-3">
                      {filteredProjects.map((p) => (
                        <div key={p.id} className="flex items-center justify-between border rounded p-3 bg-white">
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-medium w-28">{projectCodeFor(p)}</div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.client?.name ?? "Client"}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm">{p.progressPercent ?? 0}%</div>
                            <Button variant="ghost" size="sm" onClick={() => window.location.assign(`/work/roadmap/${p.id}`)}>View</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // grid / table (default)
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="px-4 py-3">Code</TableHead>
                        <TableHead className="px-4 py-3">Project Name</TableHead>
                        <TableHead className="px-4 py-3">Members</TableHead>
                        <TableHead className="px-4 py-3">Start Date</TableHead>
                        <TableHead className="px-4 py-3">Deadline</TableHead>
                        <TableHead className="px-4 py-3">Client</TableHead>
                        <TableHead className="px-4 py-3">Status</TableHead>
                        <TableHead className="px-4 py-3 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>

                    {/* <TableBody>
                      {filteredProjects.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="py-8 text-center text-gray-500">No projects found</TableCell></TableRow>
                      ) : (
                        filteredProjects.map((p) => <ProjectRow key={p.id} p={p} />)
                      )}
                    </TableBody> */}



                    <TableBody>
                      {loading ? (
                        <>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton width={60} /></TableCell>
                              <TableCell><Skeleton width={150} /></TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Skeleton circle width={30} height={30} />
                                  <Skeleton circle width={30} height={30} />
                                </div>
                              </TableCell>
                              <TableCell><Skeleton width={100} /></TableCell>
                              <TableCell><Skeleton width={100} /></TableCell>
                              <TableCell><Skeleton width={120} /></TableCell>
                              <TableCell><Skeleton width={120} height={20} /></TableCell>
                              <TableCell><Skeleton width={40} height={30} /></TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : filteredProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                            No projects found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProjects.map((p) => <ProjectRow key={p.id} p={p} />)
                      )}
                    </TableBody>



                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* PAGINATION */}


          {loading ? (
            <div className="flex justify-between mt-4">
              <Skeleton width={150} />
              <Skeleton width={200} />
            </div>
          ) : (

            <div className="flex items-center justify-between mt-4">
              {/* <div className="text-sm text-gray-600">Result per page -{filteredProjects.length ? filteredProjects.length : 0}</div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => { setCurrentPage((c) => Math.max(1, c - 1)); }} disabled={currentPage === 1}><ChevronLeft /> Prev</Button>
                <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
                <Button variant="outline" size="sm" onClick={() => { setCurrentPage((c) => Math.min(totalPages, c + 1)); }} disabled={currentPage === totalPages}>Next <ChevronRight /></Button>
              </div> */}
            </div>
          )}


        </div>
      </main>

      {/* DRAWER OVERLAY */}
      <div aria-hidden={!showFilters} onClick={closeFilters} className={`fixed inset-0 transition-opacity duration-300 z-[9990] ${showFilters ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />

      {/* DRAWER */}
      <aside aria-hidden={!showFilters} className={`fixed right-0 top-0 h-full w-[360px] bg-white shadow-xl transform transition-transform duration-300 z-[9999] ${showFilters ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2"><Filter className="w-5 h-5" /><h3 className="font-semibold">Filters</h3></div>
          <button onClick={closeFilters} className="p-2 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-4 overflow-auto h-[calc(100%-140px)]">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Project</label>
            <Select value={filterProject} onValueChange={(v) => setFilterProject(v)}>
              <SelectTrigger className="w-full rounded border px-3 py-2"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {projectOptions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Project Members</label>
            <Select value={filterMember} onValueChange={(v) => setFilterMember(v)}>
              <SelectTrigger className="w-full rounded border px-3 py-2"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {memberOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Client</label>
            <Select value={filterClient} onValueChange={(v) => setFilterClient(v)}>
              <SelectTrigger className="w-full rounded border px-3 py-2"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {clientOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 border-t flex items-center justify-between gap-2">
          <Button variant="outline" onClick={resetDrawerFilters}>Reset</Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={closeFilters}>Close</Button>
            <Button className="bg-blue-600 text-white" onClick={applyFilters}>Apply</Button>
          </div>
        </div>
      </aside>

      {/* ADD PROJECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-12 px-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setShowAddModal(false); resetAddForm(); }} />
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-y-auto z-10">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Project</h3>
              <button onClick={() => { setShowAddModal(false); resetAddForm(); }} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Details */}
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3">Project Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Short Code *</label>
                    <Input value={shortCode} onChange={(e) => setShortCode(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Project Name *</label>
                    <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Start Date *</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-sm text-gray-600">Deadline *</label>
                        <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} disabled={noDeadline} />
                      </div>
                      <div className="pt-6">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                          <input type="checkbox" checked={noDeadline} onChange={(e) => setNoDeadline(e.target.checked)} />
                          <span className="text-xs">There is no project deadline</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Project Category *</label>
                    <div className="flex gap-2">
                      <Select value={category} onValueChange={(v) => setCategory(v)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">--</SelectItem>
                          {categoryOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={openCategoryModal}>Add</Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Department *</label>
                    <Select value={department} onValueChange={(v) => setDepartment(v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">--</SelectItem>
                        {departmentOptions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Client *</label>
                    <Select value={client} onValueChange={(v) => setClientField(v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="--" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">--</SelectItem>
                        {clientOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">Project Summary</label>
                    <textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full p-2 border rounded" />
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Tasks needs approval by Admin</div>
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2">
                        <input type="radio" name="approval" checked={needsApproval === true} onChange={() => setNeedsApproval(true)} />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input type="radio" name="approval" checked={needsApproval === false} onChange={() => setNeedsApproval(false)} />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Add Project Members *</label>
                    <Input placeholder="Comma separated names" value={Array.isArray(members) ? members.join(",") : members} onChange={(e) => setMembers(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Company Details — SINGLE (below Project Details) */}
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3">Company Details</h4>

                <div className="mb-4">
                  <label className="text-sm text-gray-600 mb-2 block">Add File</label>
                  <div onClick={handleChooseFileClick} className="border-2 border-dashed rounded-lg h-28 flex items-center justify-center cursor-pointer text-gray-500">
                    {file ? <div>{file.name}</div> : <div>Choose File</div>}
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Currency</label>
                    <Select value={currency} onValueChange={(v) => setCurrency(v)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="USD" /></SelectTrigger>
                      <SelectContent>
                        {/* <SelectItem value="USD">USD $</SelectItem>
                        <SelectItem value="USD">USD ₹</SelectItem>
                        <SelectItem value="EUR">EUR €</SelectItem> */}



                        <SelectItem value="USD">USD $ (US Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR € (Euro)</SelectItem>
                        <SelectItem value="GBP">GBP £ (British Pound)</SelectItem>
                        <SelectItem value="CHF">CHF ₣ (Swiss Franc)</SelectItem>
                        <SelectItem value="SEK">SEK kr</SelectItem>
                        <SelectItem value="NOK">NOK kr</SelectItem>
                        <SelectItem value="DKK">DKK kr</SelectItem>
                        <SelectItem value="PLN">PLN zł</SelectItem>
                        <SelectItem value="CZK">CZK Kč</SelectItem>
                        <SelectItem value="HUF">HUF Ft</SelectItem>
                        <SelectItem value="RON">RON lei</SelectItem>



                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Project Budget</label>
                    <Input value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Hours Estimate (In Hours)</label>
                    <Input value={hoursEstimate} onChange={(e) => setHoursEstimate(e.target.value)} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={allowManualTimeLogs} onChange={(e) => setAllowManualTimeLogs(e.target.checked)} />
                      <span className="text-sm text-gray-600">Allow manual time logs</span>
                    </label>
                  </div>

                  {/* NEW: Added by select */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 mr-2">Added by*</label>
                    <Select value={addedBy} onValueChange={(v) => setAddedBy(v)}>
                      <SelectTrigger className="w-44"><SelectValue placeholder="You" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="you">You</SelectItem>
                        {memberOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowAddModal(false); resetAddForm(); }}>Cancel</Button>
                <Button className="bg-blue-600 text-white" onClick={createProject} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => closeCategoryModal()} />
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl z-20 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Project Category</h3>
              <button onClick={() => closeCategoryModal()} className="p-2 rounded hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-4 space-y-4">
              {/* Categories table */}
              <div className="rounded border overflow-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-2 text-sm">#</th>
                      <th className="px-4 py-2 text-sm">Category Name</th>
                      <th className="px-4 py-2 text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catLoading ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
                    ) : categories.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No categories</td></tr>
                    ) : categories.map((c, idx) => (
                      <tr key={c.id} className="border-t">
                        <td className="px-4 py-3 text-sm">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm">{c.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <button className="p-2 rounded hover:bg-gray-100 text-red-600" onClick={() => deleteCategory(c.id)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add category */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Category Name *</label>
                <Input placeholder="Enter category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => closeCategoryModal()}>Cancel</Button>
                <Button className="bg-blue-600 text-white" onClick={addCategory} disabled={catSubmitting}>
                  {catSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}
      {showUpdateModal && updateProjectId != null && (
        <UpdateProjectModal
          projectId={updateProjectId}
          onClose={() => { setShowUpdateModal(false); setUpdateProjectId(null); }}
          onSaved={() => { getProjects(token ?? null); }}
        />
      )}
    </div>
  );

  // Helper to group projects by start date string
  function groupByStartDate(items: Project[]) {
    const map: Record<string, Project[]> = {};
    items.forEach((p) => {
      const d = p.startDate ?
        // new Date(p.startDate).toLocaleDateString()
        format(new Date(p.startDate), "dd-MM-yyyy")

        : "No start date";
      (map[d] ||= []).push(p);
    });
    return map;
  }
}

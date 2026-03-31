"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ClientHeader,
  ClientStats,
  ProfileSection,
  InvoicesTable,
} from "../components/client/index";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  MoreVertical,
  Eye,
  Edit2,
  Pin,
  Archive,
  Trash2,
  Grid,
  Search,
  X,
} from "lucide-react";
import ClientCreditNotesTable from "../components/client/ClientCreditNotesTable";
import ClientPaymentsTable from "../components/client/ClientPaymentsTable";
import ClientDocuments from "../components/client/ClientDocuments";
import ClientNotesTable from "../components/client/ClientNotesTable";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


import { format } from "date-fns";

const API_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;

// safe text parser (handles stringified JSON responses)
const safeParseText = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    try {
      const t = text.trim();
      if (
        (t.startsWith('"') && t.endsWith('"')) ||
        (t.startsWith("'") && t.endsWith("'"))
      ) {
        return JSON.parse(t.slice(1, -1));
      }
    } catch { }
    return null;
  }
};

// Normalize client object to avoid rendering raw objects as JSX children
function normalizeClient(raw: any) {
  if (!raw) return raw;
  const companyRaw = raw.company;
  let companyStr = "";
  if (!companyRaw) companyStr = "";
  else if (typeof companyRaw === "string") companyStr = companyRaw;
  else if (typeof companyRaw === "object") {
    companyStr =
      companyRaw.companyName ??
      companyRaw.name ??
      companyRaw.company ??
      JSON.stringify(companyRaw);
  } else {
    companyStr = String(companyRaw);
  }

  return {
    ...raw,
    company: companyStr,
  };
}

const STATUS_OPTIONS = [
  "IN_PROGRESS",
  "NOT_STARTED",
  "ON_HOLD",
  "CANCELLED",
  "FINISHED",
] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

type Category = { id: string | number; name: string };
type ClientItem = { id: number; clientId?: string; name?: string };
type DepartmentItem = { id: number; departmentName: string };

type EmployeeItem = {
  employeeId: string
  name: string
  profilePictureUrl?: string | null
};

export default function ClientDetailPage() {
  const { id } = useParams() as { id?: string };
  const router = useRouter();


  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);


  // members already hai
  // const [members, setMembers] = useState<string[] | string>("")


  // ---- client
  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyDetails, setcompanyDetails] = useState<ClientItem[]>([]);

  // stats
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [totalEarning, setTotalEarning] = useState<number | null>(null);
  const [unpaidInvoiceCount, setUnpaidInvoiceCount] = useState<number | null>(
    null
  );
  const [totalUnpaidAmount, setTotalUnpaidAmount] = useState<number | null>(
    null
  );

  // projects
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // invoices
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  // selects: categories, clients, departments
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);

  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientLoading, setClientLoading] = useState(false);


  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  // tabs
  const [activeTab, setActiveTab] = useState<
    "profile" | "projects" | "invoices" | "creditnotes" | "payments" | "documents" | "notes" | string
  >("profile");


  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";

  // ---------- fetch client ----------
  const fetchClient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch client (${res.status})`);
      const data = await res.json();
      setClient(normalizeClient(data));
      setcompanyDetails(data)

    } catch (err: any) {
      setError(err?.message ?? "An error occurred");
      setClient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);
  // console.log("jjjjjjj", client)
  const EMP_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;

  const loadEmployees = useCallback(async () => {
    setEmployeeLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      const res = await fetch(`${EMP_BASE}/employee/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Failed to load employees", res.status);
        setEmployees([]);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(
          data.map((e: any) => ({
            employeeId: e.employeeId,
            name: e.name,
            profilePictureUrl: e.profilePictureUrl ?? null,
          }))
        );
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Employee load error", err);
      setEmployees([]);
    } finally {
      setEmployeeLoading(false);
    }
  }, []);


  // ---------- helpers to load selects ----------
  const loadCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/projects/category`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!res.ok) {
        setCategories([]);
        setCatLoading(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === "string") {
          setCategories(data.map((n, i) => ({ id: i + 1, name: String(n) })));
        } else {
          setCategories(
            data.map((d: any) => ({
              id: d.id ?? d.name ?? Math.random(),
              name: d.name ?? String(d),
            }))
          );
        }
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("loadCategories", err);
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    setClientLoading(true);
    try {
      const res = await fetch(`${API_BASE}/clients`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!res.ok) {
        setClients([]);
        setClientLoading(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setClients(data as ClientItem[]);
      else if (Array.isArray(data.items))
        setClients(data.items as ClientItem[]);
      else setClients([]);
    } catch (err) {
      console.error("loadClients", err);
      setClients([]);
    } finally {
      setClientLoading(false);
    }
  }, []);

  const loadDepartments = useCallback(async () => {
    setDeptLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/departments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      if (!res.ok) {
        setDepartments([]);
        setDeptLoading(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setDepartments(data as DepartmentItem[]);
      else if (Array.isArray(data.items))
        setDepartments(data.items as DepartmentItem[]);
      else setDepartments([]);
    } catch (err) {
      console.error("loadDepartments", err);
      setDepartments([]);
    } finally {
      setDeptLoading(false);
    }
  }, []);

  // ---------- stats fetch ----------
  async function fetchClientStats(clientId: string) {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
    };

    try {
      const res = await fetch(
        `${API_BASE}/api/projects/client/${clientId}/stats`,
        { headers }
      );
      const text = await res.text();
      const parsed =
        safeParseText(text) ?? (res.ok ? JSON.parse(text || "{}") : null);
      const obj =
        parsed &&
          typeof parsed === "object" &&
          (parsed.projectCount !== undefined || parsed.totalEarning !== undefined)
          ? parsed
          : parsed && typeof parsed === "object" && parsed["Response Body"]
            ? safeParseText(parsed["Response Body"])
            : parsed;

      setProjectCount(Number(obj?.projectCount ?? 0));
      setTotalEarning(Number(obj?.totalEarning ?? 0));
    } catch {
      setProjectCount(0);
      setTotalEarning(0);
    }

    try {
      const res2 = await fetch(
        `${API_BASE}/api/invoices/client/${clientId}/stats/unpaid`,
        { headers }
      );
      const text2 = await res2.text();
      const parsed2 =
        safeParseText(text2) ?? (res2.ok ? JSON.parse(text2 || "{}") : null);
      const obj2 =
        parsed2 &&
          typeof parsed2 === "object" &&
          (parsed2.unpaidInvoiceCount !== undefined ||
            parsed2.totalUnpaidAmount !== undefined)
          ? parsed2
          : parsed2 && typeof parsed2 === "object" && parsed2["Response Body"]
            ? safeParseText(parsed2["Response Body"])
            : parsed2;

      setUnpaidInvoiceCount(Number(obj2?.unpaidInvoiceCount ?? 0));
      setTotalUnpaidAmount(Number(obj2?.totalUnpaidAmount ?? 0));
    } catch {
      setUnpaidInvoiceCount(0);
      setTotalUnpaidAmount(0);
    }
  }

  // ---------- projects fetch (called when Projects tab activated) ----------
  async function fetchProjectsForClient(clientId: string) {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/projects/client/${clientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      const text = await res.text();
      const parsed =
        safeParseText(text) ?? (res.ok ? JSON.parse(text || "[]") : null);

      let list: any[] = [];
      if (Array.isArray(parsed)) list = parsed;
      else if (parsed && Array.isArray(parsed.projects)) list = parsed.projects;
      else if (parsed && Array.isArray(parsed.data)) list = parsed.data;
      else if (parsed && parsed.ResponseBody) {
        const inner = safeParseText(parsed.ResponseBody);
        if (Array.isArray(inner)) list = inner;
      }

      const mapped = list.map((p: any) => ({
        id: p.id ?? p.projectId ?? p._id ?? String(Math.random()),
        shortCode:
          p.shortCode ?? p.code ?? p.projectCode ?? p.project_code ?? p.id,

        name: p.name ?? p.projectName ?? p.title ?? "Project Name",
        members:
          Array.isArray(p.assignedEmployees) && p.assignedEmployees.length
            ? p.assignedEmployees.map((m: any) => ({
              id: m.employeeId ?? m.id,
              name: m.name ?? m.fullName,
              avatarUrl: m.profileUrl ?? m.profilePictureUrl,
            }))
            : Array.isArray(p.members)
              ? p.members
              : [],
        startDate: p.startDate ?? p.start_date ?? p.start,
        deadline: p.deadline ?? p.endDate ?? p.end_date,
        client:
          p.client ??
          (p.clientId
            ? {
              clientId: p.clientId,
              name: client?.name,
              profilePictureUrl: client?.profilePictureUrl,
            }
            : undefined),
        progressPercent:
          typeof p.progressPercent === "number"
            ? p.progressPercent
            : typeof p.progress === "number"
              ? p.progress
              : p.progress ?? 0,
        projectStatus: (p.projectStatus ??
          p.status ??
          "NOT_STARTED") as StatusOption,
        pinned: Boolean(p.pinned ?? p.isPinned),
        archived: Boolean(p.archived ?? p.isArchived),
        noDeadline: Boolean(p.noDeadline ?? false),
      }));
      setProjects(mapped);
    } catch (err: any) {
      setProjectsError(err?.message ?? "Failed to fetch projects");
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }

  // ---------- invoices fetch (called when Invoices tab activated) ----------
  async function fetchInvoicesForClient(clientId: string) {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const res = await fetch(`${API_BASE}/api/invoices/client/${clientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      const text = await res.text();
      const parsed =
        safeParseText(text) ?? (res.ok ? JSON.parse(text || "[]") : null);

      let list: any[] = [];
      if (Array.isArray(parsed)) list = parsed;
      else if (parsed && Array.isArray(parsed.invoices)) list = parsed.invoices;
      else if (parsed && Array.isArray(parsed.data)) list = parsed.data;
      else if (parsed && parsed.ResponseBody) {
        const inner = safeParseText(parsed.ResponseBody);
        if (Array.isArray(inner)) list = inner;
      }
      //a============bc
      const mapped = list.map((inv: any) => ({
        id: inv.id ?? inv.invoiceId,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        currency: inv.currency,
        project: inv.project ?? {
          projectName: inv.projectName,
          projectCode: inv.projectCode,
        },
        total:
          typeof inv.total === "number" ? inv.total : Number(inv.total ?? 0),
        unpaidAmount:
          typeof inv.unpaidAmount === "number"
            ? inv.unpaidAmount
            : Number(inv.unpaidAmount ?? 0),
        status: inv.status,
        createdAt: inv.createdAt,
      }));
      setInvoices(mapped);
    } catch (err: any) {
      setInvoicesError(err?.message ?? "Failed to fetch invoices");
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }

  // ---------- Project action helpers (optimistic updates + rollback) ----------
  const getToken = () => localStorage.getItem("accessToken") || "";

  async function patchStatus(
    projectId: number | string,
    newStatus: StatusOption
  ) {
    const prev = projects.slice();
    setProjects((ps) =>
      ps.map((pr) =>
        pr.id === projectId ? { ...pr, projectStatus: newStatus } : pr
      )
    );
    try {
      const fd = new FormData();
      fd.append("status", newStatus);
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/status`, {
        method: "PUT",
        body: fd,
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Status patch failed");
      try {
        const json = await res.json();
        if (json && json.id) {
          setProjects((ps) =>
            ps.map((pr) => (pr.id === json.id ? { ...pr, ...json } : pr))
          );
        } else if (client?.clientId) {
          await fetchProjectsForClient(client.clientId);
        }
      } catch {
        if (client?.clientId) await fetchProjectsForClient(client.clientId);
      }
    } catch (err) {
      console.error("Status update failed", err);
      setProjects(prev);
      alert("Failed to update project status");
    }
  }

  async function patchProgress(projectId: number | string, percent: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const prev = projects.slice();
    setProjects((ps) =>
      ps.map((pr) =>
        pr.id === projectId ? { ...pr, progressPercent: clamped } : pr
      )
    );
    try {
      const fd = new FormData();
      fd.append("percent", String(clamped));
      const res = await fetch(
        `${API_BASE}/api/projects/${projectId}/progress`,
        {
          method: "PUT",
          body: fd,
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.status === 401) {
        setProjects(prev);
        localStorage.removeItem("accessToken");
        alert("Session expired. Please login again.");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("patchProgress failed:", res.status, text);
        setProjects(prev);
        alert("Failed to update progress on server");
        return;
      }
      try {
        if (res.status !== 204) {
          const json = await res.json();
          if (json && json.id)
            setProjects((ps) =>
              ps.map((pr) => (pr.id === json.id ? { ...pr, ...json } : pr))
            );
          else if (client?.clientId)
            await fetchProjectsForClient(client.clientId);
        }
      } catch {
        if (client?.clientId) await fetchProjectsForClient(client.clientId);
      }
    } catch (err) {
      console.error("Progress update failed:", err);
      setProjects(prev);
      alert("Failed to update progress on server");
    }
  }

  async function handlePin(projectId: number | string) {
    const prev = projects.slice();
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return;
    const newPinned = !projects[idx].pinned;
    setProjects((ps) =>
      ps.map((pr) => (pr.id === projectId ? { ...pr, pinned: newPinned } : pr))
    );
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/pin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pinned: newPinned }),
      });
      if (!res.ok) throw new Error("Pin failed");
      try {
        const json = await res.json();
        if (json && json.id)
          setProjects((ps) =>
            ps.map((pr) => (pr.id === json.id ? { ...pr, ...json } : pr))
          );
        else if (client?.clientId)
          await fetchProjectsForClient(client.clientId);
      } catch {
        if (client?.clientId) await fetchProjectsForClient(client.clientId);
      }
    } catch (err) {
      console.error("Pin toggle error", err);
      setProjects(prev);
      alert("Failed to toggle pin");
    }
  }

  async function handleArchive(projectId: number | string) {
    const prev = projects.slice();
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return;
    const newArchived = !projects[idx].archived;
    setProjects((ps) =>
      ps.map((pr) =>
        pr.id === projectId ? { ...pr, archived: newArchived } : pr
      )
    );
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/archive`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived: newArchived }),
      });
      if (!res.ok) throw new Error("Archive toggle failed");
      try {
        const json = await res.json();
        if (json && json.id)
          setProjects((ps) =>
            ps.map((pr) => (pr.id === json.id ? { ...pr, ...json } : pr))
          );
        else if (client?.clientId)
          await fetchProjectsForClient(client.clientId);
      } catch {
        if (client?.clientId) await fetchProjectsForClient(client.clientId);
      }
    } catch (err) {
      console.error("Archive toggle error", err);
      setProjects(prev);
      alert("Failed to toggle archive state on server");
    }
  }

  const handleDelete = async (projectId: number | string) => {
    if (!confirm("Delete this project?")) return;
    const prev = projects.slice();
    setProjects((ps) => ps.filter((p) => p.id !== projectId));
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      console.error(err);
      setProjects(prev);
      alert("Failed to delete project");
    }
  };

  // ---------- Add Project modal state & handlers ----------
  const [showAddModal, setShowAddModal] = useState(false)
  const [shortCode, setShortCode] = useState("")
  const [projectName, setProjectName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [deadline, setDeadline] = useState("")
  const [noDeadline, setNoDeadline] = useState(false)
  const [category, setCategory] = useState<string>("none")
  const [department, setDepartment] = useState<string>("none")
  const [clientField, setClientField] = useState<string>("none")
  const [summary, setSummary] = useState("")
  const [needsApproval, setNeedsApproval] = useState(true)
  const [members, setMembers] = useState<string | string[]>("")
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [currency, setCurrency] = useState("USD")
  const [budget, setBudget] = useState<string>("")
  const [hoursEstimate, setHoursEstimate] = useState<string>("")
  const [allowManualTimeLogs, setAllowManualTimeLogs] = useState(false)
  const [addedBy, setAddedBy] = useState<string>("you")
  const [submitting, setSubmitting] = useState(false)

  const clientId = client?.clientId
  const clientNumericId = client?.id


  const resetAddForm = () => {
    setShortCode("");
    setProjectName("");
    setStartDate("");
    setDeadline("");
    setNoDeadline(false);
    setCategory("none");
    setDepartment("none");
    setClientField(client?.clientId ? String(client.clientId) : "none");
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
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFile(e.target.files?.[0] ?? null);

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
        sc = slug
          ? slug.toUpperCase().replace(/-/g, "").slice(0, 10)
          : `PRJ${Date.now().toString().slice(-6)}`;
      }

      const fd = new FormData();
      fd.append("shortCode", sc);
      fd.append("name", projectName);
      fd.append("projectName", projectName);
      fd.append("startDate", startDate || "");
      if (noDeadline) fd.append("deadline", "");
      else fd.append("deadline", deadline || "");
      fd.append("noDeadline", String(Boolean(noDeadline)));
      // fd.append("category", category === "none" ? "" : String(category));


      fd.append(
        "projectCategory",
        category !== "none" ? String(category) : ""
      )


      fd.append("department", department === "none" ? "" : String(department));
      fd.append(
        "clientId",
        clientField === "none" ? client?.clientId ?? "" : String(clientField)
      );
      // fd.append("summary", summary || "");
      fd.append("projectSummary", summary || "")


      fd.append("tasksNeedAdminApproval", String(Boolean(needsApproval)));

      const assignedArray = Array.isArray(members)
        ? members
        : String(members || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

      fd.append("assignedEmployeeIds", JSON.stringify(assignedArray));
      if (file) fd.append("companyFile", file);
      fd.append("currency", currency || "");
      // fd.append("budget", budget !== "" ? String(budget) : "0");
      fd.append(
        "projectBudget",
        budget !== "" ? String(budget) : "0"
      )


      fd.append(
        "hoursEstimate",
        hoursEstimate !== "" ? String(hoursEstimate) : "0"
      );
      fd.append("allowManualTimeLogs", String(Boolean(allowManualTimeLogs)));
      fd.append("addedBy", String(addedBy || ""));

      const res = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${getToken()}` },
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
      try {
        await res.json();
      } catch { }
      // refresh projects list
      if (client?.clientId) await fetchProjectsForClient(client.clientId);
      setShowAddModal(false);
      resetAddForm();
    } catch (err) {
      console.error("Create project error", err);
      alert("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  // initial fetch: client, selects
  useEffect(() => {
    if (id) fetchClient();
    // load selects regardless
    loadCategories();
    loadClients();
    loadDepartments();
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (client?.clientId) fetchClientStats(client.clientId);
  }, [client]);

  // when user activates Projects tab, load projects
  // Fetch projects AS SOON as client loads (so ProfileSection gets data)
  useEffect(() => {
    if (client?.clientId) {
      fetchProjectsForClient(client.clientId)
    }
  }, [client])


  // when user activates Invoices tab, load invoices
  useEffect(() => {
    if (activeTab === "invoices" && client?.clientId) {
      fetchInvoicesForClient(client.clientId);
    }


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, client]);

  // if (loading) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <div className="text-center">
  //         <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
  //         <p className="text-muted-foreground">Loading client details...</p>
  //       </div>
  //     </div>


  //   );
  // }




  if (loading) {
    return (

      //  <main className="container mx-auto max-w-6xl px-4 py-8"></main>


      <div className="container mx-auto py-8 px-4 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton width={200} height={30} />
          <Skeleton width={100} height={35} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-white space-y-2">
              <Skeleton width={100} height={15} />
              <Skeleton width={60} height={25} />
            </div>
          ))}
        </div>

        {/* Profile Section */}
        <div className="p-6 border rounded-lg bg-white space-y-4">
          <Skeleton width={150} height={20} />

          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton width={120} height={12} />
                <Skeleton height={30} />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} width={100} height={30} />
          ))}
        </div>

        {/* Table / Content */}
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <Skeleton width={180} height={20} />

          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4">
              {[...Array(6)].map((_, j) => (
                <Skeleton key={j} height={15} />
              ))}
            </div>
          ))}


        </div>




      </div>



    );



  }


  if (error || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-6 border rounded">
          <h3 className="text-destructive text-xl mb-2">Error</h3>
          <p className="mb-4">{error || "Client not found"}</p>
          <div>
            <button
              className="px-3 py-2 border rounded"
              onClick={() => router.push("/clients")}
            >
              Back to Clients
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Project Row helper for consistent rendering (matching AllProjectsPage look/feel)
  function ProjectRow({ p }: { p: any }) {
    const progressTimeout = useRef<NodeJS.Timeout | null>(null);
    const start = p.startDate
      ?
      // new Date(p.startDate).toLocaleDateString()
      format(new Date(p.startDate), "dd-MM-yyyy")
      : "-";
    const dl = p.noDeadline
      ? "No Deadline"
      : p.deadline
        ?
        // new Date(p.deadline).toLocaleDateString()
        format(new Date(p.deadline), "dd-MM-yyyy")
        : "-";
    const progress = Math.max(0, Math.min(100, Number(p.progressPercent ?? 0)));
    const getProgressColor = (n?: number | null) => {
      if (n === undefined || n === null) return "bg-gray-300";
      if (n < 33) return "bg-red-500";
      if (n < 66) return "bg-yellow-400";
      return "bg-green-500";
    };
    const statusBadgeClas = (s?: string | null) => {
      switch (s) {
        case "IN_PROGRESS":
          return "bg-green-600 text-white";
        case "NOT_STARTED":
          return "bg-gray-400 text-white";
        case "ON_HOLD":
          return "bg-yellow-500 text-white";
        case "CANCELLED":
          return "bg-red-600 text-white";
        case "FINISHED":
          return "bg-blue-600 text-white";
        default:
          return "bg-gray-400 text-white";
      }
    };
    const badgeDotColor = (status?: string | null) => {
      switch (status) {
        case "IN_PROGRESS":
          return "#10B981";
        case "NOT_STARTED":
          return "#9CA3AF";
        case "ON_HOLD":
          return "#F59E0B";
        case "CANCELLED":
          return "#EF4444";
        case "FINISHED":
          return "#3B82F6";
        default:
          return "#9CA3AF";
      }
    };

    return (
      <TableRow key={p.id} className="bg-white hover:bg-gray-50">
        <TableCell className="py-4 px-4 align-top w-20">
          <div className="text-sm font-medium">{p.shortCode ?? p.id}</div>
        </TableCell>
        <TableCell className="py-4 px-4 align-top">
          <div className="font-medium">{p.name}</div>
        </TableCell>
        <TableCell className="py-4 px-4 align-top">
          <div className="text-sm">
            {Array.isArray(p.members) && p.members.length
              ? p.members
                .map((m: any) => m.name ?? m)
                .slice(0, 3)
                .join(", ")
              : "-"}
          </div>
        </TableCell>
        <TableCell className="py-4 px-4 align-top text-sm">{start}</TableCell>
        <TableCell className="py-4 px-4 align-top text-sm">{dl}</TableCell>
        <TableCell className="py-4 px-4 align-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {p.client?.profilePictureUrl ? (
                <img
                  src={p.client.profilePictureUrl}
                  alt={p.client?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs text-gray-500">
                  {(p.client?.name || "C").charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium">
                {p.client?.name ?? "Client"}
              </div>
              <div className="text-xs text-gray-400">
                {p.client?.company ?? ""}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell className="py-4 px-4 align-top">
          <div className="flex flex-col gap-2">
            <div
              className="w-30 cursor-pointer"
              title="Click to filter by this progress bucket"
            >
              <div className="relative bg-gray-200 h-4 rounded-full overflow-hidden">
                <div
                  className={`h-4 rounded-full ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-semibold text-white drop-shadow-sm">
                    {progress}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs ${statusBadgeClas(
                  p.projectStatus
                )}`}
                title="Status"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: badgeDotColor(p.projectStatus) }}
                />
                <span>{p.projectStatus ?? "N/A"}</span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center gap-1 px-2 py-1 border rounded text-sm bg-white hover:bg-gray-50">
                    <span className="text-xs text-gray-500">▾</span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-64 p-2">
                  <div className="text-xs text-gray-500 mb-1">
                    Change status
                  </div>
                  <div className="space-y-1">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => patchStatus(p.id, s as StatusOption)}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-50 ${s === p.projectStatus ? "font-medium" : ""
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <DropdownMenuSeparator />
                  <div className="text-xs text-gray-500 mt-2 mb-1">
                    Adjust progress
                  </div>
                  <div>
                    {/* <input
                      type="range"
                      min={0}
                      max={100}
                      value={p.progressPercent ?? 0}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setProjects((prev) =>
                          prev.map((pr) =>
                            pr.id === p.id ? { ...pr, progressPercent: v } : pr
                          )
                        );
                      }}
                      onMouseUp={async (e) => {
                        const v = Number((e.target as HTMLInputElement).value);
                        await patchProgress(p.id, v);
                      }}
                      onTouchEnd={async (e) => {
                        const v = Number((e.target as HTMLInputElement).value);
                        await patchProgress(p.id, v);
                      }}
                      className="w-full"
                    /> */}



                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={p.progressPercent ?? 0}
                      onChange={(e) => {
                        const v = Number(e.target.value);

                        // instant UI update
                        setProjects((prev) =>
                          prev.map((pr) =>
                            pr.id === p.id ? { ...pr, progressPercent: v } : pr
                          )
                        );

                        // debounce API call
                        if (progressTimeout.current) {
                          clearTimeout(progressTimeout.current);
                        }

                        // progressTimeout.current = setTimeout(() => {
                        //   patchProgress(p.id, v);
                        // }, 400);

                        progressTimeout.current = setTimeout(() => {

                          if (v === 100) {
                            patchStatus(p.id, "FINISHED");
                          } else if (v > 0 && p.projectStatus === "NOT_STARTED") {
                            patchStatus(p.id, "IN_PROGRESS");
                          }

                          patchProgress(p.id, v);

                        }, 400);


                      }}
                      className="w-full"
                    />


                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>{p.progressPercent ?? 0}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        client?.clientId &&
                        fetchProjectsForClient(client.clientId)
                      }
                    >
                      Refresh
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </TableCell>

        <TableCell className="py-4 px-4 align-top text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => router.push(`/work/project/${p.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" /> View
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push(`/work/project/${p.id}/edit`)}
              >
                <Edit2 className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handlePin(p.id)}>
                <Pin className="h-4 w-4 mr-2" /> {p.pinned ? "Unpin" : "Pin"}{" "}
                Project
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleArchive(p.id)}>
                <Archive className="h-4 w-4 mr-2" />{" "}
                {p.archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => handleDelete(p.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  }

  return (

    <main className="container mx-auto max-w-6xl px-4 py-8">

      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <ClientHeader
          clientName={client.name}
          clientId={client.clientId}
          onBack={() => router.push("/clients")}
          onOpenTab={(t) => setActiveTab(t)}
          activeTab={activeTab}
        />

        {/* Stats (only on profile tab) */}
        {activeTab === "profile" && (
          <ClientStats


            clientName={client?.companyName || client?.name}
            clientId={client?.clientId}
            clientImage={client?.profileImage || client?.image || client?.avatar}

            projectCount={projectCount}
            totalEarning={totalEarning}
            unpaidInvoiceCount={unpaidInvoiceCount}
            totalUnpaidAmount={totalUnpaidAmount}
          />
        )}


        {activeTab === "creditnotes" && (
          <ClientCreditNotesTable clientId={client.clientId} />
        )}

        {/* Main content by tab */}
        {activeTab === "profile" && <ProfileSection client={client} projects={projects} companyDetails={companyDetails} />}
        {/* <ProfileSection client={client} projects={projects} /> */}


        {activeTab === "projects" && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Projects for {client.name}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 border rounded px-2 py-1 bg-white">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search projects"
                    onChange={() => {
                      /* implement search if needed */
                    }}


                    className="border-0 bg-transparent focus-visible:ring-0"
                  />
                </div>
                <Button
                  className="bg-blue-600 text-white"
                  onClick={() => {
                    setShowAddModal(true);
                  /* preselect client */ setClientField(
                      client?.clientId ? String(client.clientId) : "none"
                    );
                  }}
                >
                  + Add Project
                </Button>
              </div>
            </div>


            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-auto p-4">
                {projectsLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading projects...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No projects found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="px-4 py-3">Code</TableHead>
                        <TableHead className="px-4 py-3">Project Name</TableHead>
                        <TableHead className="px-4 py-3">Member</TableHead>
                        <TableHead className="px-4 py-3">Start Date</TableHead>
                        <TableHead className="px-4 py-3">Deadline</TableHead>
                        <TableHead className="px-4 py-3">Client</TableHead>
                        <TableHead className="px-4 py-3">Status</TableHead>
                        <TableHead className="px-4 py-3 text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {projects.map((p) => (
                        <ProjectRow key={p.id} p={p} />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>

        )}

        {activeTab === "invoices" && (

          <InvoicesTable clientId={`${clientId}`} />
          // <InvoicesTable clientId="CLI005" />

        )}


        {/* NEW: Payments tab rendering */}
        {(activeTab === "payments" || activeTab === "Payments") && (
          <div className="mt-6">
            <ClientPaymentsTable
              projectIdk={client.clientId}
              clientId={client.clientId}
              onAdd={() => {
                /* open add payment modal if you have one */
                //console.log("Open add payment");
              }}
              onSearch={(q) => {
                //console.log("search payments:", q);
              }}
              onAction={(p) => {
                // You can open a payment details modal here if you want
                //console.log("payment row action", p);
              }}
            />
          </div>
        )}

        {activeTab === "notes" && (
          <ClientNotesTable
            clientId={clientNumericId} // string | number or object with .id
            authToken={token}
            onView={(note) => {
              // open view modal or navigate
              //console.log("view", note);
            }}
            onEdit={(note) => {
              // navigate to edit page or open form component
              // e.g. router.push(`/clients/${clientId}/notes/${note.id}/edit`);
              //console.log("edit", note);
            }}
            onDelete={(note) => {
              // optional: already optimistic remove happens inside component
              //console.log("deleted", note);
            }}
          />

        )}



        {activeTab === "documents" && (
          <ClientDocuments clientId={client} authToken={token} />

        )}


        {/* ADD PROJECT MODAL */}
        {showAddModal && (
          // <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-12 px-4 overflow-y-auto">
          <div className="fixed inset-0 z-[10000] flex justify-end">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => {
                setShowAddModal(false);
                resetAddForm();
              }}
            />
            {/* <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-y-auto z-10"> */}
            <div className="relative w-[83%] h-full bg-white shadow-2xl overflow-y-auto z-10 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Add Project </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddForm();
                  }}
                  className="p-2 rounded hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Project Details */}
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">Project Details </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">
                        Short Code *
                      </label>
                      <Input
                        value={shortCode}
                        onChange={(e) => setShortCode(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        Project Name *
                      </label>
                      <Input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">
                        Start Date *
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-sm text-gray-600">
                            Deadline *
                          </label>
                          <Input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            disabled={noDeadline}
                          />
                        </div>
                        <div className="pt-6">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={noDeadline}
                              onChange={(e) => setNoDeadline(e.target.checked)}
                            />
                            <span className="text-xs">
                              There is no project deadline
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">
                        Project Category *
                      </label>
                      <div className="flex gap-2">
                        {/* <Select
                        value={category}
                        onValueChange={(v) => setCategory(v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="--" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">--</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select> */}



                        <Select
                          modal={false}
                          value={category}
                          onValueChange={setCategory}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="--" />
                          </SelectTrigger>

                          <SelectContent className="z-[99999] pointer-events-auto">
                            <SelectItem value="none">--</SelectItem>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>



                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">
                        Department *
                      </label>
                      {/* <Select
                      value={department}
                      onValueChange={(v) => setDepartment(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="--" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">--</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.departmentName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}


                      <Select
                        modal={false}
                        value={department}
                        onValueChange={setDepartment}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="--" />
                        </SelectTrigger>

                        <SelectContent className="z-[99999] pointer-events-auto">
                          <SelectItem value="none">--</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.departmentName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>



                    </div>

                    <div>
                      <label className="text-sm text-gray-600">Client *</label>
                      {/* <Select
                      value={clientField}
                      onValueChange={(v) => setClientField(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="--" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">--</SelectItem>
                        {clients.map((c) => (
                          <SelectItem
                            key={c.id}
                            value={String(c.clientId ?? c.id)}
                          >
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}

                      <Select
                        modal={false}
                        value={clientField}
                        onValueChange={setClientField}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="--" />
                        </SelectTrigger>

                        <SelectContent className="z-[99999] pointer-events-auto">
                          <SelectItem value="none">--</SelectItem>
                          {clients.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={String(c.clientId ?? c.id)}
                            >
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>



                    </div>

                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">
                        Project Summary
                      </label>
                      <textarea
                        rows={4}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Tasks needs approval by Admin
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="approval"
                            checked={needsApproval === true}
                            onChange={() => setNeedsApproval(true)}
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="approval"
                            checked={needsApproval === false}
                            onChange={() => setNeedsApproval(false)}
                          />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">
                        Add Project Members *
                      </label>
                      <div>


                        <Select
                          modal={false}
                          value=""
                          onValueChange={(val) => {
                            setMembers((prev) => {
                              const arr = Array.isArray(prev) ? prev : [];
                              if (arr.includes(val)) return arr;
                              return [...arr, val];
                            });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                Array.isArray(members) && members.length > 0
                                  ? `${members.length} members selected`
                                  : "Select members"
                              }
                            />
                          </SelectTrigger>

                          <SelectContent className="z-[99999] pointer-events-auto max-h-72 overflow-auto">
                            {employeeLoading ? (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                Loading...
                              </div>
                            ) : employees.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No employees found
                              </div>
                            ) : (
                              employees.map((emp) => (
                                <SelectItem
                                  key={emp.employeeId}
                                  value={emp.employeeId}
                                >
                                  <div className="flex items-center gap-2">
                                    {emp.profilePictureUrl ? (
                                      <img
                                        src={emp.profilePictureUrl}
                                        className="w-6 h-6 rounded-full"
                                        alt={emp.name}
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">
                                        {emp.name.charAt(0)}
                                      </div>
                                    )}
                                    <span className="text-sm">
                                      {emp.name} ({emp.employeeId})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>

                        {/* Selected members chips */}
                        {Array.isArray(members) && members.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {members.map((id) => {
                              const emp = employees.find((e) => e.employeeId === id);
                              return (
                                <span
                                  key={id}
                                  className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                                >
                                  {emp?.name ?? id}
                                  <button
                                    className="ml-1 text-red-500"
                                    onClick={() =>
                                      setMembers((prev) =>
                                        Array.isArray(prev)
                                          ? prev.filter((x) => x !== id)
                                          : prev
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>

                {/* Company Details — SINGLE (below Project Details) */}
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3">Company Details</h4>

                  <div className="mb-4">
                    <label className="text-sm text-gray-600 mb-2 block">
                      Add File
                    </label>
                    <div
                      onClick={handleChooseFileClick}
                      className="border-2 border-dashed rounded-lg h-28 flex items-center justify-center cursor-pointer text-gray-500"
                    >
                      {file ? <div>{file.name}</div> : <div>Choose File</div>}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Currency</label>
                      {/* <Select
                      value={currency}
                      onValueChange={(v) => setCurrency(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD $</SelectItem>
                        <SelectItem value="USD">USD ₹</SelectItem>
                        <SelectItem value="EUR">EUR €</SelectItem>
                      </SelectContent>
                    </Select> */}



                      <Select
                        modal={false}
                        value={currency}
                        onValueChange={(v) => setCurrency(v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>

                        <SelectContent className="z-[99999] pointer-events-auto">
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
                      <label className="text-sm text-gray-600">
                        Project Budget
                      </label>
                      <Input
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-600">
                        Hours Estimate (In Hours)
                      </label>
                      <Input
                        value={hoursEstimate}
                        onChange={(e) => setHoursEstimate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allowManualTimeLogs}
                          onChange={(e) =>
                            setAllowManualTimeLogs(e.target.checked)
                          }
                        />
                        <span className="text-sm text-gray-600">
                          Allow manual time logs
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 mr-2">
                        Added by*
                      </label>
                      <Select
                        value={addedBy}
                        onValueChange={(v) => setAddedBy(v)}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="You" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="you">You</SelectItem>
                          {/* optionally fill with members from projects if available */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      resetAddForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 text-white"
                    onClick={createProject}
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


    </main>

  );
}


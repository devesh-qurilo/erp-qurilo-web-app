// // app/(your-route)/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { UserIcon } from "@heroicons/react/24/outline";
import TasksTable from "../components/TasksTable";
import ProjectMembersTable from "../components/ProjectMembersTable";
import TimesheetsTableNew from "../components/TimesheetsTableNew";
import MilestonesTable from "../components/MilestonesTable";
// import { getStorage } from "../../../../../lib/storage/storege"; // adjust path if needed
import axios from "axios";
import { format } from "date-fns";

interface Project {
  id: number;
  shortCode: string;
  name: string;
  startDate: string;
  deadline?: string;
  noDeadline?: boolean;
  category?: string;
  client?: {
    name: string;
    clientId?: string;
    profilePictureUrl?: string } | null;
  summary?: string;
  currency: string;
  budget: number;
  hoursEstimate?: number;
  assignedEmployees?: {
    employeeId: string;
    name: string;
    profileUrl?: string;
    designation?: string;
    department?: string;
  }[];
  progressPercent?: number | null;
  totalTimeLoggedMinutes?: number | null;
  createdBy?: string;
  createdAt?: string;
  pinned?: boolean;
  pinnedAt?: string | null;
  archived?: boolean;
  archivedAt?: string | null;
  addedBy?: string;
}

type StatusItem = {
  id: number;
  name: string;
  position?: number;
  labelColor?: string | null;
  projectId?: number | null;
  createdBy?: string;
};

type TaskItem = {
  id: number;
  taskStageId?: number | null;
  taskStage?: { id?: number; name?: string } | null;
  // other fields not needed for counting
};

const MAIN = process.env.NEXT_PUBLIC_MAIN;

/**
 * Small helper: convert hex-like labelColor from backend to usable CSS color
 * backend sometimes returns "88aaff11" — we'll take first 6 hex chars (if any)
 */
const normalizeLabelColor = (raw?: string | null) => {
  if (!raw) return null;
  const hex = String(raw).replace(/[^0-9a-fA-F]/g, "");
  if (hex.length >= 6) return `#${hex.slice(0, 6)}`;
  return null;
};

/**
 * Simple name-based fallback color map
 */
const nameColorFallback = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("complete") || n.includes("complete")) return "#10b981"; // green
  if (n.includes("to-do") || n.includes("todo") || n.includes("to do"))
    return "#f59e0b"; // yellow
  if (n.includes("doing")) return "#2563eb"; // blue
  if (n.includes("incomplete")) return "#ef4444"; // red
  if (n.includes("wait") || n.includes("waiting")) return "#9ca3af"; // gray
  return "#6b7280"; // neutral gray
};

/**
 * Create a pie slice path (SVG) from angles in degrees
 */
const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angleInDegrees: number
) => {
  const angleUSDadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleUSDadians),
    y: cy + r * Math.sin(angleUSDadians),
  };
};

const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
};

/**
 * TaskStatistics component: fetches statuses + tasks, computes counts and renders pie + legend
 */
function TaskStatistics({ projectId }: { projectId: number }) {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("accessToken") || "";

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // fetch statuses
        const statusUrl = `${MAIN}/status`;
        const [sRes, tRes] = await Promise.all([
          axios.get(statusUrl, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          }),
          axios.get(`${MAIN}/projects/${projectId}/tasks`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          }),
        ]);

        if (mounted) {
          setStatuses(Array.isArray(sRes.data) ? sRes.data : []);
          setTasks(Array.isArray(tRes.data) ? tRes.data : []);
        }
      } catch (err: any) {
        console.error(
          "Failed to load task statistics:",
          err?.response?.data ?? err?.message ?? err
        );
        if (mounted) {
          setError("Failed to load task statistics");
          setStatuses([]);
          setTasks([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      mounted = false;
    };
  }, [projectId, token]);

  // compute counts per status id (use status.id from statuses)
  const counts = useMemo(() => {
    const map = new Map<
      number | string,
      { status: StatusItem; count: number }
    >();

    // seed map with statuses (so legend includes them even if count=0)
    statuses.forEach((s) => map.set(s.id, { status: s, count: 0 }));

    // For each task, try to find matching status:
    tasks.forEach((task) => {
      // prefer explicit taskStageId
      const id = task.taskStageId ?? task.taskStage?.id ?? null;
      if (id !== null && id !== undefined) {
        const key = Array.from(map.keys()).find((k) => k === id);
        if (key !== undefined) {
          const cur = map.get(key as number)!;
          cur.count += 1;
          map.set(key as number, cur);
          return;
        }
      }
      // fallback: find by name inclusion
      const stageName = task.taskStage?.name ?? "";
      const matched = statuses.find(
        (s) =>
          stageName &&
          String(s.name).toLowerCase().includes(stageName.toLowerCase())
      );
      if (matched) {
        const cur = map.get(matched.id) ?? { status: matched, count: 0 };
        cur.count += 1;
        map.set(matched.id, cur);
        return;
      }
      // otherwise increment "unknown" bucket keyed by 'unknown'
      const unknownKey = "unknown";
      if (!map.has(unknownKey as any)) {
        map.set(unknownKey as any, {
          status: { id: 0, name: "Other", labelColor: null },
          count: 0,
        });
      }
      const cur = map.get(unknownKey as any)!;
      cur.count += 1;
      map.set(unknownKey as any, cur);
    });

    return Array.from(map.values());
  }, [statuses, tasks]);

  const total = counts.reduce((s, c) => s + c.count, 0) || 0;

  // prepare slices for pie
  let accAngle = 0;
  const slices = counts
    .filter((c) => c.count > 0)
    .map((c) => {
      const proportion = total === 0 ? 0 : c.count / total;
      const start = accAngle;
      const sweep = proportion * 360;
      accAngle += sweep;
      const color =
        normalizeLabelColor(c.status.labelColor) ||
        nameColorFallback(c.status.name);
      return {
        ...c,
        start,
        end: accAngle,
        color,
      };
    });

  return (
    <div>
      {/* {loading ? (
        <div className="py-6 text-center text-gray-500">
          Loading task statistics...
        </div>
      )  */}

      {loading ? (
        <div className="animate-pulse flex gap-6">
          <div className="w-40 h-40 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-36 bg-gray-200 rounded" />
          </div>
        </div>
      )



        : error ? (
          <div className="py-6 text-center text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <svg
                viewBox="0 0 100 100"
                width="180"
                height="180"
                className="flex-shrink-0"
              >
                {/* background circle if no data */}
                {slices.length === 0 && (
                  <circle cx="50" cy="50" r="40" fill="#e5e7eb" />
                )}
                {slices.map((s, idx) => (
                  <path
                    key={idx}
                    d={describeArc(50, 50, 40, s.start, s.end)}
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth="0.5"
                  />
                ))}
              </svg>
            </div>

            <div className="flex flex-col justify-center">
              <ul className="space-y-3 text-sm">
                {counts.map((c, idx) => {
                  const color =
                    normalizeLabelColor(c.status.labelColor) ||
                    nameColorFallback(c.status.name);
                  return (
                    <li key={idx} className="flex items-center gap-3">
                      <span
                        style={{ width: 18, height: 12, background: color }}
                        className="rounded-sm inline-block"
                      />
                      <span className="flex-1">{c.status.name}</span>
                      <span className="text-xs text-gray-500">{c.count}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 text-xs text-gray-500">
                Total tasks: {total}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default function ProjectDetailsPage() {
  const params = useParams() as any;
  const { id } = params || {};

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "invoices"
    | "payments"
    | "files"
    | "notes"
    | "activity"
    | "discussion"
  >("overview");

  // New: metrics state fetched from /projects/{projectId}/metrics
  // const [metrics, setMetrics] = useState<any | null>(null);


  type ProjectMetrics = {
    totalTimeLoggedMinutes?: number;
    currency?: string;
    earning?: number | string;
    expenses?: number;
    profit?: number;
    hoursEstimate?: number;
  };

  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);


  const [metricsLoading, setMetricsLoading] = useState(false);

  // Fetch project; fallback demo so UI always matches preview
//   const getProjectDetails = async (accessToken: string) => {
//     try {
//       const res = await fetch(`/api/work/project/${id}`, {
//         headers: accessToken
//           ? { Authorization: `Bearer ${accessToken}` }
//           : undefined,
//       });
//       if (!res.ok) throw new Error("Failed to fetch");
//       const data = await res.json();
//       setProject(Array.isArray(data) ? data[0] : data);
//     } catch (err) {
//       // fallback demo data
//       setProject({
//         id: Number(id || 1),
//         shortCode: "PRJ-001",
//         name: "Project Name",
//         category: "Website",
//         startDate: "2025-08-02",
//         deadline: "2025-09-12",
//         client: {
//           name: "John Doe",
//           profilePictureUrl: "https://i.pravatar.cc/80?img=5",
//         },
//         summary: "Short description of the project and goals.",
//         currency: "$",
//         budget: 0,
//         hoursEstimate: 40,
//         assignedEmployees: [
//           {
//             employeeId: "1",
//             name: "Aman Sharma",
//             designation: "Developer",
//             department: "Engineering",
//           },
//           {
//             employeeId: "2",
//             name: "Riya Singh",
//             designation: "Designer",
//             department: "Design",
//           },
//         ],
//         progressPercent: 76,
//         totalTimeLoggedMinutes: 300,
//         createdBy: "Admin",
//         createdAt: new Date().toISOString(),
//         pinned: false,
//         archived: false,
//       });



// const projectData = Array.isArray(data) ? data[0] : data;

// setProject({
//   ...projectData,
//   client: {
//     name: projectData.client?.name || "Unknown",
//     clientId:
//       projectData.client?.clientId ||   // ✅ correct source
//       projectData.clientId ||           // fallback
//       "",
//     profilePictureUrl: projectData.client?.profilePictureUrl,
//   },
// });


//     } finally {
//       setLoading(false);
//     }
//   };


const getProjectDetails = async (accessToken: string) => {
  try {
const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/projects/${id}`, {  
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });

    if (!res.ok) {
      console.error("API FAILED:", res.status);
      throw new Error("Failed to fetch");
    }

    const data = await res.json();

    // console.log("API DATA 👉", data);

    const projectData = Array.isArray(data) ? data[0] : data;

    setProject({
      ...projectData,
      client: {
        name: projectData.client?.name || "Unknown",
        clientId:
          projectData.client?.clientId ||
          projectData.clientId ||
          "",
        profilePictureUrl: projectData.client?.profilePictureUrl,
      },
    });

  } catch (err) {
    console.error("PROJECT FETCH ERROR:", err);
    setProject(null);
  } finally {
    setLoading(false);
  }
};




// console.log("hellooooo",project?.client);


  // Fetch metrics (new)
  const fetchMetrics = async (accessToken: string) => {
    if (!id) return;
    setMetricsLoading(true);
    try {
      const headers = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined;
      const url = `${MAIN}/projects/${id}/metrics`;
      const res = await axios.get(url, { headers });
      setMetrics(res.data ?? null);
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || "";
    getProjectDetails(token);
    fetchMetrics(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p className="p-8 text-center">Loading project...</p>;
  // if (!project)
  //   return <p className="p-8 text-center text-red-600">Project not found</p>;


if (!project) {
  return (
    <p className="p-8 text-center text-red-600">
      Project not found
    </p>
  );
}


  // derive totals: prefer metrics if available, otherwise fall back to project
  const totalMinutes =
    metrics?.totalTimeLoggedMinutes ?? project.totalTimeLoggedMinutes ?? 0;
  // const totalHours = Math.floor((totalMinutes || 0) / 60);


  const totalHours = Math.floor(totalMinutes / 60);
  const totalMinutesRemaining = totalMinutes % 60;

  const currency = metrics?.currency ?? project.currency ?? "$";
  const earnings =
    typeof metrics?.earning === "number"
      ? metrics.earning
      : typeof metrics?.earning === "string"
        ? Number(metrics.earning)
        : project.budget ?? 0;
  const expenses = typeof metrics?.expenses === "number" ? metrics.expenses : 0;
  const profit =
    typeof metrics?.profit === "number" ? metrics.profit : earnings - expenses;
  const hoursEstimate = metrics?.hoursEstimate ?? project.hoursEstimate ?? 0;

  // safe percentages for progress bars
  const hoursProgressPct =
    hoursEstimate > 0
      ? Math.min(100, Math.round((totalHours / hoursEstimate) * 100))
      : 0;
  const plannedBarWidth =
    hoursEstimate > 0
      ? Math.min(
        100,
        Math.round(
          (hoursEstimate / Math.max(hoursEstimate, totalHours || 1)) * 100
        )
      )
      : 50;
  const actualBarWidth = Math.min(
    100,
    Math.round((totalHours / Math.max(hoursEstimate, totalHours || 1)) * 100)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        {/* <div className="mb-4">
          <h1 className="text-3xl font-semibold text-gray-800">
            {project.name}
          </h1>
        </div> */}



        {loading ? (
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        ) : (
          <h1 className="text-3xl font-semibold text-gray-800">
            {project.name}
          </h1>
        )}

        {/* Tabs container */}
        <div className="bg-white rounded-t-lg shadow-sm border border-b-0">
          {/* <div className="px-4">
            <nav className="flex items-center gap-6 h-14">
              {[
                { key: "overview", label: "Overview" },

              ].map((t) => {
                const isActive = activeTab === (t.key as any);
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as any)}
                    className={`py-3 text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-600"
                      }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="relative inline-block">
                      {t.label}
                      {isActive && (
                        <span className="absolute -bottom-5 left-0 w-full h-0.5 bg-blue-400 rounded" />
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>


          </div> */}
          {/* <div className="h-1">
            <div className="border-t-2 border-blue-300" />
          </div> */}
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">



              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 w-40 bg-gray-200 rounded" />
                  <div className="h-4 w-60 bg-gray-200 rounded" />
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                </div>
              ) : (
                <>

                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-36 h-20">
                        {/* <svg viewBox="0 0 100 50" className="w-full h-full">
                      <path
                        d="M5 50 A45 45 0 0 1 95 50"
                        fill="none"
                        stroke="#e6e6e6"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <path
                        d="M5 50 A45 45 0 0 1 75 18"
                        fill="none"
                        stroke="#f5c518"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <text
                        x="50"
                        y="40"
                        fontSize="8"
                        textAnchor="middle"
                        fill="#374151"
                      >
                        {project.progressPercent}%
                      </text>
                    </svg> */}




                        <div className="w-36 h-20">
                          <svg viewBox="0 0 100 50" className="w-full h-full">
                            {/* background arc */}
                            <path
                              d="M5 50 A45 45 0 0 1 95 50"
                              fill="none"
                              stroke="#e6e6e6"
                              strokeWidth="10"
                              strokeLinecap="round"
                              pathLength="100"
                            />

                            {/* progress arc */}
                            <path
                              d="M5 50 A45 45 0 0 1 95 50"
                              fill="none"
                              stroke="#f5c518"
                              strokeWidth="10"
                              strokeLinecap="round"
                              pathLength="100"
                              strokeDasharray="100"
                              strokeDashoffset={100 - project.progressPercent}
                            />

                            <text
                              x="50"
                              y="40"
                              fontSize="8"
                              textAnchor="middle"
                              fill="#374151"
                            >
                              {project.progressPercent}%
                            </text>
                          </svg>
                        </div>



                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">
                          {
                            // new Date(project.startDate).toLocaleDateString()
                            format(new Date(project.startDate), "dd-MM-yyyy")
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium">
                          {project.noDeadline
                            ? "No Deadline"
                            : project.deadline
                              ?
                              //  new Date(project.deadline).toLocaleDateString()
                              format(new Date(project.deadline), "dd-MM-yyyy")
                              : "TBD"}
                        </p>
                      </div>
                    </div>

                    <div className="hidden lg:block max-w-xs text-gray-600">
                      {project.summary ? (
                        <p>{project.summary}</p>
                      ) : (
                        <p className="text-sm text-gray-400">
                          No summary available
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}



            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {project.client?.profilePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.client.profilePictureUrl}
                    alt="client"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
             <div>
  <p className="text-sm text-gray-500">Client</p>

  <p className="font-medium">
    {project.client?.name || "Unknown Client"}
  </p>

  <p className="text-xs text-gray-400">
    {project.client?.clientId || "No Client ID"}
  </p>
</div>
            </div>
          </div>

          {/* Middle row: Task statistics + metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-medium mb-4">Task Statistics</h3>
              <TaskStatistics projectId={project.id} />


            </div>



            {/* Single Hours Logged chart placed immediately below TaskStatistics (only once) */}
            <div className="mt-6 bg-white rounded border border-gray-200 p-4 shadow-sm">

              {metricsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-24 bg-gray-200 rounded" />
                </div>
              ) : (
                <>


                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Hours Logged</h4>
                    <div className="text-xs text-gray-500">
                      {/* {metricsLoading ? "Loading..." : `${totalHours} hrs`} */}
                      {metricsLoading
                        ? "Loading..."
                        : `${totalHours} hrs ${totalMinutesRemaining} min`}
                    </div>



                  </div>
                </>
              )}
              {/* Chart area: bar columns and horizontal progress line (visual match to your screenshot) */}
              <div className="h-40">
                <div className="flex items-end gap-8 h-full">
                  {/* Planned column */}
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-500 mb-2">Planned</div>
                    <div className="h-28 flex items-end justify-center">
                      <div
                        className="w-24 rounded-t-md"
                        style={{
                          height: `${Math.max(30, plannedBarWidth)}%`,
                          background: "#16a34a",
                        }}
                      >
                        <div className="text-xs text-white text-center py-1">
                          {hoursEstimate} hrs
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actual column */}
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-500 mb-2">Actual</div>
                    <div className="h-28 flex items-end justify-center">
                      <div
                        className="w-24 rounded-t-md"
                        style={{
                          height: `${Math.max(30, actualBarWidth)}%`,
                          background: "#ef4444",
                        }}
                      >
                        <div className="text-xs text-white text-center py-1">
                          {totalHours} hrs
                          {/* {hoursEstimate}h {totalMinutesRemaining}m */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* horizontal progress line */}
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-2 rounded"
                      style={{
                        width: `${hoursProgressPct}%`,
                        background:
                          hoursProgressPct > 100 ? "#ef4444" : "#16a34a",
                      }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex justify-between">
                    <span>{hoursProgressPct}% of estimate</span>
                    {/* <span>
                      {currency}
                      {(earnings ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span> */}
                  </div>
                </div>
              </div>
            </div>
            {/* end Hours Logged chart */}


          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
              <div className="mb-4">
                <h4 className="text-lg font-medium">Assigned Employees</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.assignedEmployees &&
                  project.assignedEmployees.length ? (
                  project.assignedEmployees.map((emp) => (
                    <div
                      key={emp.employeeId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {emp.profileUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={emp.profileUrl}
                            alt={emp.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{emp.name}</p>
                        <p className="text-xs text-gray-500">
                          {emp.designation ? emp.designation + ", " : ""}
                          {emp.department}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">
                    No employees assigned
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-lg font-medium mb-2">Project Summary</h4>
              <div className="text-xs text-gray-500 space-y-2">
                <div>Created by: {project.addedBy}</div>
                <div>
                  Created on:{" "}
                  {
                    // new Date(project.createdAt || "").toLocaleDateString()
                    format(new Date(project.createdAt || ""), "dd-MM-yyyy")
                  }
                </div>
                {project.pinned && (
                  <div>
                    Pinned on:{" "}
                    {
                      // new Date(project.pinnedAt || "").toLocaleDateString()
                      format(new Date(project.pinnedAt || ""), "dd-MM-yyyy")
                    }
                  </div>
                )}
                {project.archived && (
                  <div>
                    Archived on:{" "}
                    {
                      // new Date(project.archivedAt || "").toLocaleDateString()
                      format(new Date(project.archivedAt || ""), "dd-MM-yyyy")
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Keep the tasks table below as before */}
        {project && (
          <div className="mt-6">
            <TasksTable projectId={project.id} />
          </div>
        )}

        {/* other components shown for reference */}
        <div className="mt-6 grid grid-cols-1 lg:grid-rows-2 gap-2">
          <ProjectMembersTable projectId={project.id} />
          {/* <TimesheetsTableNew gatewayPath="https://erp.skavosystem.com/timesheets" /> */}
          <MilestonesTable projectId={project.id} />
        </div>
      </div>
    </div>
  );
}


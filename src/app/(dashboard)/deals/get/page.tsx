"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import AddFollowupModal from "../_components/AddFollowupModal";
import {
  useDealPrioritiesQuery,
  useDealsQuery,
  useUpdateDealStageMutation,
  type PriorityItem,
} from "../api";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid,
  TableIcon,
  MoreVertical,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import ImportButton from "@/components/ImportButton";
import ExportButton from "@/components/ExportButton";

const DEFAULT_STAGES = ["generated", "qualified", "proposal", "WIN", "LOST"];

type Followup = {
  id: number;
  nextDate?: string;
  startTime?: string;
  remarks?: string;
  sendReminder?: boolean;
  reminderSent?: boolean;
  createdAt?: string;
};

type PriorityObject = {
  id: number;
  status: string;
  color?: string;
  dealId?: number | null;
  isGlobal?: boolean;
};

type Deal = {
  id: number | string;
  title?: string;
  value?: number;
  dealStage?: string;
  dealCategory?: string;
  pipeline?: string;
  dealAgent?: string;
  dealAgentMeta?: {
    employeeId?: string;
    name?: string;
    designation?: string | null;
    department?: string | null;
    profileUrl?: string | null;
  };
  createdAt?: string;
  leadId?: number;
  leadName?: string;
  leadMobile?: string;
  leadEmail?: string;
  expectedCloseDate?: string;
  followups?: Followup[];
  tags?: string[];
  dealWatchers?: string[]; // array of employee ids
  dealWatchersMeta?: {
    employeeId?: string;
    name?: string;
    profileUrl?: string | null;
  }[];
  assignedEmployeesMeta?: {
    employeeId?: string;
    name?: string;
    profileUrl?: string | null;
  }[];
  priority?: string | number | PriorityObject | null;
};

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

// Use uploaded images as fallback avatars (local paths provided earlier)
const sampleDesktopImage = "/mnt/data/Screenshot 2025-11-21 122016.png";
const sampleMobileImage = "/mnt/data/Screenshot 2025-11-21 122307.png";

// export const FiltersDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
// export const FiltersDrawer = ({
//   open,
//   onClose,
//   stages,
// }: {
//   open: boolean;
//   onClose: () => void;
//   stages: string[];
// }) => {
export const FiltersDrawer = ({
  open,
  onClose,
  stages,
  deals,
  priorities,

  dateFilterOn,
  setDateFilterOn,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  dealStageFilter,
  setDealStageFilter,
  minValue,
  setMinValue,
  maxValue,
  setMaxValue,
  agentFilter,
  setAgentFilter,
  watcherFilter,
  setWatcherFilter,
  leadFilter,
  setLeadFilter,
  tagFilter,
  setTagFilter,
  priorityFilter,
  setPriorityFilter,
}: {
  open: boolean;
  onClose: () => void;
  stages: string[];
  deals: Deal[];
  priorities: PriorityItem[];

  dateFilterOn: "created" | "close";
  setDateFilterOn: any;
  dateFrom: Date | undefined;
  setDateFrom: any;
  dateTo: Date | undefined;
  setDateTo: any;
  dealStageFilter: string;
  setDealStageFilter: any;
  minValue: string;
  setMinValue: any;
  maxValue: string;
  setMaxValue: any;
  agentFilter: string;
  setAgentFilter: any;
  watcherFilter: string;
  setWatcherFilter: any;
  leadFilter: string;
  setLeadFilter: any;
  tagFilter: string;
  setTagFilter: any;
  priorityFilter: string;
  setPriorityFilter: any;
}) => {
  // const [dateFilterOn, setDateFilterOn] = useState<"created" | "close">("created");
  // const [dateFrom, setDateFrom] = useState<Date | undefined>();
  // const [dateTo, setDateTo] = useState<Date | undefined>();
  // const [dealStageFilter, setDealStageFilter] = useState("all");
  // const [minValue, setMinValue] = useState("");
  // const [maxValue, setMaxValue] = useState("");
  // const [agentFilter, setAgentFilter] = useState("all");
  // const [watcherFilter, setWatcherFilter] = useState("all");
  // const [leadFilter, setLeadFilter] = useState("all");
  // const [tagFilter, setTagFilter] = useState("all");
  // const [priorityFilter, setPriorityFilter] = useState("all");

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      {/* <div
      className="fixed inset-0 bg-black/30"
      onClick={() => setOpenFilters(false)}
    /> */}

      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* drawer */}
      <div className="relative ml-auto h-full w-[340px] bg-white shadow-xl p-6 overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-2 font-medium text-lg">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </div>
          {/* <button
          onClick={() => setOpenFilters(false)}
          className="text-gray-500 text-lg"
        >
          ×
        </button> */}
          <button onClick={onClose} className="text-gray-500 text-lg">
            ×
          </button>
        </div>

        {/* Date Filter On */}
        <div className="mb-6">
          <div className="text-sm mb-2">Date Filter On</div>
          <Select
            value={dateFilterOn}
            onValueChange={(v) => setDateFilterOn(v as any)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="close">Expected Close</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Deal Stage */}
        <div className="mb-6">
          <div className="text-sm mb-2">Deal Stage</div>
          <Select value={dealStageFilter} onValueChange={setDealStageFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {/* {stages.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))} */}

              {/* 
{stages?.length ? (
  stages.map((stage) => (
    <SelectItem key={stage} value={stage}>
      {stage}
    </SelectItem>
  ))
) : (
  <SelectItem value="Qualified">Qualified</SelectItem>
)} */}

              {stages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deals Value */}
        <div className="mb-6">
          <div className="text-sm mb-2">Deals Value</div>
          <div className="flex items-center gap-2">
            <Input
              className="bg-white"
              placeholder="Min"
              type="number"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              className="bg-white"
              placeholder="Max"
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
            />
          </div>
        </div>

        {/* Agent */}
        <div className="mb-6">
          <div className="text-sm mb-2">Agent</div>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[
                ...new Set(
                  (deals as Deal[])
                    .map((d) => d.dealAgentMeta?.name)
                    .filter(Boolean),
                ),
              ].map((name) => (
                <SelectItem key={name} value={name!}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deal Watcher */}
        <div className="mb-6">
          <div className="text-sm mb-2">Deal Watcher</div>
          <Select value={watcherFilter} onValueChange={setWatcherFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[
                ...new Map(
                  (deals as Deal[])
                    .flatMap((d) => d.dealWatchersMeta || [])
                    .map((w) => [w.employeeId, w]),
                ).values(),
              ].map((w) => (
                <SelectItem key={w.employeeId} value={w.employeeId!}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lead */}
        <div className="mb-6">
          <div className="text-sm mb-2">Lead</div>
          <Select value={leadFilter} onValueChange={setLeadFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[
                ...new Map(
                  (deals as Deal[])
                    .filter((d) => d.leadId)
                    .map((d) => [d.leadId, d]),
                ).values(),
              ].map((d) => (
                <SelectItem key={d.leadId} value={String(d.leadId)}>
                  {d.leadName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <div className="text-sm mb-2">Tags</div>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[...new Set((deals as Deal[]).flatMap((d) => d.tags || []))].map(
                (tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="mb-8">
          <div className="text-sm mb-2">Priority Status</div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {/* {priorities.map((p) => (
              <SelectItem
                key={p.id}
                value={String(p.status).toLowerCase()}
              >
                {p.status}
              </SelectItem>
            ))} */}

              {[
                ...new Map(
                  priorities.map((p) => [String(p.status).toLowerCase(), p]),
                ).values(),
              ].map((p) => (
                <SelectItem
                  key={p.status}
                  value={String(p.status).toLowerCase()}
                >
                  {p.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear */}
        <div className="flex justify-end">
          <Button
            className="px-6"
            variant="outline"
            onClick={() => {
              setDateFilterOn("created");
              setDealStageFilter("all");
              setMinValue("");
              setMaxValue("");
              setAgentFilter("all");
              setWatcherFilter("all");
              setLeadFilter("all");
              setTagFilter("all");
              setPriorityFilter("all");
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function DealsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  // UI-only state for the top nav (keeps functionality same; not used to filter results unless you wire it)
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>(""); // placeholder string for "Start Date to End Date"

  // 🔥 NEW: duration (date range)
  // const [dateFrom, setDateFrom] = useState<Date | undefined>();
  // const [dateTo, setDateTo] = useState<Date | undefined>();

  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [openFilters, setOpenFilters] = useState(false);

  // filter form state
  const [dateFilterOn, setDateFilterOn] = useState<"created" | "close">(
    "created",
  );
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [watcherFilter, setWatcherFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [openFollowup, setOpenFollowup] = useState(false);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  // UI state for deal stage filter (not currently wired to API calls, but can be used to filter displayed results on client side)
  const [dealStageFilter, setDealStageFilter] = useState("all");

  useEffect(() => {
    const t =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    setToken(t);
  }, []);

  const {
    data: deals = [],
    error: dealsError,
    isLoading: dealsLoading,
    refetch: refetchDeals,
  } = useDealsQuery({ enabled: Boolean(token) });

  const { data: priorities = [], error: prioritiesError } =
    useDealPrioritiesQuery({ enabled: Boolean(token) });
  const updateDealStageMutation = useUpdateDealStageMutation();
  const mutateDeals = async () => {
    await refetchDeals();
  };

  const priorityByStatus = useMemo(() => {
    const m = new Map<string, PriorityItem>();
    for (const p of priorities || []) {
      if (p.status) m.set(String(p.status).toLowerCase(), p);
    }
    return m;
  }, [priorities]);

  const priorityById = useMemo(() => {
    const m = new Map<number, PriorityItem>();
    for (const p of priorities || []) {
      m.set(p.id, p);
    }
    return m;
  }, [priorities]);

  // const stages = useMemo(() => {
  //   const s = new Set<string>();
  //   for (const d of deals as Deal[]) {
  //     if (d.dealStage) s.add(d.dealStage);
  //   }
  //   return Array.from(s.values()).sort();
  // }, [deals]);

  const stages = useMemo(() => {
    const apiStages = new Set<string>();

    for (const d of deals as Deal[]) {
      if (d.dealStage) apiStages.add(d.dealStage);
    }

    // 🔥 merge default + api
    return Array.from(new Set([...DEFAULT_STAGES, ...Array.from(apiStages)]));
  }, [deals]);

  // derive pipeline values for the top nav dropdown (UI only)
  const pipelines = useMemo(() => {
    const s = new Set<string>();
    for (const d of deals as Deal[]) {
      if (d.pipeline) s.add(d.pipeline);
    }
    return Array.from(s.values()).sort();
  }, [deals]);

  const getNextFollowup = (followups?: Followup[]) => {
    if (!followups?.length) return null;

    return [...followups]
      .filter((f) => f?.nextDate)
      .sort(
        (a, b) =>
          new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime(),
      )[0];
  };

  const formatDealTags = (
    tags?: Array<string | { tagName?: string | null }> | null,
  ) => {
    if (!Array.isArray(tags) || tags.length === 0) return "—";
    const names = tags
      .map((tag) => (typeof tag === "string" ? tag : tag?.tagName || ""))
      .filter(Boolean);
    return names.length > 0 ? names.join(", ") : "—";
  };

  const normalizePriorityString = (p?: unknown) => {
    if (p === null || p === undefined) return "low";
    if (typeof p === "string") return p.toLowerCase();
    if (typeof p === "number") {
      const byId = priorityById.get(p);
      if (byId?.status) return String(byId.status).toLowerCase();
      return "low";
    }
    try {
      const o = p as PriorityObject;
      if (o && o.status) return String(o.status).toLowerCase();
      return String(p).toLowerCase();
    } catch {
      return "low";
    }
  };

  const filteredDeals = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (deals as Deal[]).filter((d) => {
      const matchesStage =
        dealStageFilter === "all" ||
        String(d.dealStage || "").toLowerCase() ===
          dealStageFilter.toLowerCase();

      /* ---------------- SEARCH ---------------- */
      const hay = [
        d.title,
        d.dealAgentMeta?.name,
        d.dealAgent,
        d.dealCategory,
        d.pipeline,
        String(d.id),
        d.leadName,
        d.leadEmail,
        d.leadMobile,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = q.length === 0 || hay.includes(q);

      /* ---------------- PIPELINE FILTER ---------------- */
      const matchesPipeline =
        pipelineFilter === "all" ||
        String(d.pipeline || "").toLowerCase() === pipelineFilter.toLowerCase();

      /* ---------------- DATE FILTER ---------------- */
      let dateToCheck: Date | null = null;

      if (dateFilterOn === "created" && d.createdAt) {
        dateToCheck = new Date(d.createdAt);
      }

      if (dateFilterOn === "close" && d.expectedCloseDate) {
        dateToCheck = new Date(d.expectedCloseDate);
      }

      const matchesDate =
        (!dateFrom || (dateToCheck && dateToCheck >= dateFrom)) &&
        (!dateTo || (dateToCheck && dateToCheck <= dateTo));

      /* ---------------- VALUE FILTER ---------------- */
      const dealValue = Number(d.value || 0);
      if (minValue && dealValue < Number(minValue)) return false;
      if (maxValue && dealValue > Number(maxValue)) return false;

      /* ---------------- AGENT FILTER ---------------- */
      if (agentFilter !== "all" && d.dealAgentMeta?.name !== agentFilter) {
        return false;
      }

      /* ---------------- PRIORITY FILTER ---------------- */
      if (priorityFilter !== "all") {
        const dealPriority = normalizePriorityString(d.priority);
        if (dealPriority !== priorityFilter.toLowerCase()) return false;
      }

      /* ---------------- WATCHER FILTER ---------------- */
      if (watcherFilter !== "all") {
        const watcherIds = d.dealWatchersMeta?.map((w) => w.employeeId) || [];
        if (!watcherIds.includes(watcherFilter)) return false;
      }

      /* ---------------- LEAD FILTER ---------------- */
      if (leadFilter !== "all" && String(d.leadId) !== leadFilter) {
        return false;
      }

      /* ---------------- TAG FILTER ---------------- */
      if (tagFilter !== "all" && !(d.tags || []).includes(tagFilter)) {
        return false;
      }

      return matchesStage && matchesQuery && matchesDate && matchesPipeline;
    });
  }, [
    deals,
    query,
    // stageFilter,
    dealStageFilter,
    pipelineFilter, // 👈 add this

    dateFrom,
    dateTo,
    dateFilterOn,
    minValue,
    maxValue,
    agentFilter,
    watcherFilter,
    leadFilter,
    tagFilter,
    priorityFilter,
  ]);

  console.log("filter", filteredDeals);

  // if (dealsLoading) {
  //   return (
  //     <div className="flex min-h-[60vh] items-center justify-center text-lg font-semibold">
  //       Loading deals...
  //     </div>
  //   );
  // }

  if (dealsLoading) {
    return (
      <main className="container mx-auto max-w-6xl px-4 py-8">
        {/* Top bar skeleton */}
        <div className="mb-4 flex justify-between items-center">
          <Skeleton width={200} height={30} />
          <Skeleton width={120} height={30} />
        </div>

        {/* Buttons */}
        <div className="mb-6 flex gap-4">
          <Skeleton width={120} height={35} />
          <Skeleton width={120} height={35} />
          <Skeleton width={120} height={35} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "Deal",
                  "Lead",
                  "Contact",
                  "Value",
                  "Close",
                  "Followup",
                  "Agent",
                  "Watcher",
                  "Stage",
                  "Priority",
                  "Tags",
                  "Action",
                ].map((h, i) => (
                  <TableHead key={i}>
                    <Skeleton width={80} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {[...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton circle width={40} height={40} />
                      <Skeleton width={120} />
                    </div>
                  </TableCell>

                  <TableCell>
                    <Skeleton width={100} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={120} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={90} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={100} />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton circle width={30} height={30} />
                      <Skeleton width={80} />
                    </div>
                  </TableCell>

                  <TableCell>
                    <Skeleton width={100} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={90} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={90} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={80} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width={30} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    );
  }

  if (dealsError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lg font-semibold text-destructive">
        {(dealsError as Error).message ||
          "Failed to load deals. Please try again later."}
      </div>
    );
  }

  const getPriorityColor = (p?: unknown) => {
    if (
      p &&
      typeof p === "object" &&
      "color" in (p as any) &&
      (p as any).color
    ) {
      return (p as any).color as string;
    }
    if (typeof p === "number") {
      const item = priorityById.get(p);
      if (item?.color) return item.color;
    }
    const s = normalizePriorityString(p);
    const item = priorityByStatus.get(s);
    if (item?.color) return item.color;
    switch (s) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  const handlePriorityAssign = async (
    dealId: number | string,
    priorityId: number,
  ) => {
    if (!token) return;

    try {
      const currentDeal = (deals as Deal[]).find(
        (d) => String(d.id) === String(dealId),
      );
      const hasExistingPriority =
        currentDeal?.priority !== null &&
        typeof currentDeal?.priority !== "undefined";

      let res = await fetch(
        `${BASE_URL}/deals/${dealId}${hasExistingPriority ? "/priority" : "/priority/assign"}`,
        {
          method: hasExistingPriority ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ priorityId }),
        },
      );

      if (!res.ok && hasExistingPriority && res.status === 404) {
        res = await fetch(`${BASE_URL}/deals/${dealId}/priority/assign`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ priorityId }),
        });
      }

      if (!res.ok) {
        const txt = await res.text();
        console.error("Priority API error:", res.status, txt);
        await mutateDeals();
        return;
      }

      await mutateDeals();
    } catch (err) {
      console.error("Priority update error:", err);
      await mutateDeals();
    }
  };

  const handleStageChange = async (
    dealId: number | string,
    newStage: string,
  ) => {
    if (!token) return;
    try {
      await updateDealStageMutation.mutateAsync({
        id: dealId,
        stage: newStage,
      });
      await mutateDeals();
    } catch (err) {
      console.error("Error updating stage:", err);
    }
  };

  // DELETE deal
  const handleDeleteDeal = async (dealId: number | string) => {
    try {
      console.log("delete devesh", dealId);
      const res = await fetch(`${BASE_URL}/deals/${dealId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Failed to delete deal:", res.status, txt);
        alert("Failed to delete deal. Please try again.");
        return;
      }

      // Refresh list
      await mutateDeals();
    } catch (err) {
      console.error("Error deleting deal:", err);
      alert("Something went wrong while deleting the deal.");
    }
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="p-0 ">
        {/* Top mini nav (matches provided image) */}
        <div className="mb-4 rounded-md border bg-white py-2 px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="text-xs text-muted-foreground">Duration</div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[260px] justify-start text-sm"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Start Date to End Date
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[320px] p-4" align="start">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Select Duration</div>

                  {/* START DATE */}
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Start Date
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          {dateFrom
                            ? format(dateFrom, "dd-MM-yyyy")
                            : "dd-mm-yyyy"}
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={(date) => {
                            setDateFrom(date);
                            // auto-fix: end date chhoti ho to clear
                            if (dateTo && date && dateTo < date) {
                              setDateTo(undefined);
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* END DATE */}
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      End Date
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                          disabled={!dateFrom}
                        >
                          {dateTo ? format(dateTo, "dd-MM-yyyy") : "dd-mm-yyyy"}
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          fromDate={dateFrom}
                          onSelect={(date) => setDateTo(date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* RESET */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateFrom(undefined);
                        setDateTo(undefined);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="text-xs text-muted-foreground">Pipeline </div>
            <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
              <SelectTrigger className="w-36 text-sm py-1">
                <SelectValue placeholder="All pipelines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {pipelines.length ? (
                  pipelines.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Partnerships">Partnerships</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* <Button variant="ghost" size="sm" className="px-2"> */}

            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => setOpenFilters(true)}
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-sm">Filters </span>
              </div>
            </Button>
          </div>
        </div>

        {/* Header row: Add Deal left, search + view toggles right (matches image layout) */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/deals/create">+ Add Deal</Link>
            </Button>

            <ImportButton
              api="/deals/import/csv"
              label="Import Deals"
              onSuccess={() => mutateDeals()}
            />

            <ExportButton
              api="/deals"
              label="Export Deals"
              fileName="deals.csv"
            />
          </div>

          <div className="flex w-full items-center gap-3 md:max-w-2xl md:justify-end">
            {/* smaller search on right similar to image */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search deals"
                  aria-label="Search deals"
                  className="pr-10"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* view toggles */}
              <Tabs className="w-auto" defaultValue="table">
                <TabsList>
                  <TabsTrigger value="table" asChild>
                    <Link
                      href="/deals/get"
                      className="flex items-center gap-2 px-2"
                    >
                      <TableIcon className="h-4 w-4" />
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger value="kanban" asChild>
                    <Link
                      href="/deals/stages"
                      className="flex items-center gap-2 px-2"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* main table */}
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Deal Name</TableHead>
                <TableHead>Lead Name</TableHead>
                <TableHead>Contact Details</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>Next Follow Up</TableHead>
                <TableHead>Deal Agent</TableHead>
                <TableHead>Deal Watcher</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Priority Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredDeals.map((deal: Deal) => {
                // const nextFollowUp = getNextFollowupDate(deal.followups);

                const nextFollowup = getNextFollowup(deal.followups);
                // const nextFollowUpDisplay = nextFollowUp
                //   ? new Date(nextFollowUp).toLocaleDateString()
                //   : "—";

                // const watchersNames =
                //   deal.dealWatchersMeta && deal.dealWatchersMeta.length > 0
                //     ? deal.dealWatchersMeta
                //         .map((w) => w.name)
                //         .filter(Boolean)
                //         .join(", ")
                //     : (deal.dealWatchers || []).join(", ") || "—";

                const watchersNames = (() => {
                  const names =
                    deal.dealWatchersMeta && deal.dealWatchersMeta.length > 0
                      ? deal.dealWatchersMeta.map((w) => w.name)
                      : deal.dealWatchers || [];

                  const uniqueNames = [...names.filter(Boolean)];

                  if (uniqueNames.length === 0) return "—";

                  if (uniqueNames.length === 1) return uniqueNames[0];

                  return `${uniqueNames[0]} +${uniqueNames.length - 1}`;
                })();

                let prioritySelectValue: string;
                if (
                  deal.priority === null ||
                  typeof deal.priority === "undefined"
                ) {
                  const fallback =
                    priorities?.find(
                      (p) => String(p.status).toLowerCase() === "low",
                    ) || priorities?.[0];
                  prioritySelectValue = fallback ? String(fallback.id) : "Low";
                } else if (
                  typeof deal.priority === "object" &&
                  "id" in (deal.priority as any)
                ) {
                  prioritySelectValue = String(
                    (deal.priority as PriorityObject).id,
                  );
                } else if (typeof deal.priority === "number") {
                  prioritySelectValue = String(deal.priority);
                } else {
                  const found = priorityByStatus.get(
                    String(deal.priority).toLowerCase(),
                  );
                  prioritySelectValue = found
                    ? String(found.id)
                    : String(deal.priority);
                }

                const selectedPriority = priorities.find(
                  (p) => String(p.id) === prioritySelectValue,
                );

                const priorityColor = getPriorityColor(deal.priority);

                return (
                  <TableRow key={String(deal.id)} className="align-top">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                          <img
                            src={
                              (deal.dealAgentMeta?.profileUrl as string) ||
                              sampleDesktopImage
                            }
                            alt={
                              deal.dealAgentMeta?.name ||
                              deal.dealAgent ||
                              "agent"
                            }
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/deals/get/${deal.id}`}
                            className="line-clamp-1 font-medium hover:underline"
                          >
                            {deal.title || "—"}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            ID: {deal.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{deal?.lead?.name || "—"}</TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      <div>{deal?.lead?.email || "—"}</div>
                      <div>{deal?.lead?.mobileNumber || "—"}</div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {typeof deal.value === "number"
                        ? `$${deal.value.toLocaleString()}`
                        : "—"}
                    </TableCell>

                    <TableCell>
                      {deal.expectedCloseDate
                        ? format(new Date(deal.expectedCloseDate), "dd-MM-yyyy")
                        : "—"}
                    </TableCell>

                    <TableCell>
                      {nextFollowup ? (
                        <button
                          onClick={() => {
                            setActiveFollowup(nextFollowup);
                            setActiveDeal(deal);
                            setOpenFollowupView(true);
                          }}
                          className=" text-sm hover:text-blue-800"
                        >
                          {format(
                            new Date(nextFollowup.nextDate!),
                            "dd-MM-yyyy",
                          )}
                        </button>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                          <img
                            src={
                              (deal.dealAgentMeta?.profileUrl as string) ||
                              sampleMobileImage
                            }
                            alt={
                              deal.dealAgentMeta?.name ||
                              deal.dealAgent ||
                              "agent"
                            }
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm">
                            {deal.dealAgentMeta?.name || deal.dealAgent || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Team Lead
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">{watchersNames}</TableCell>

                    {/* Stage select - now persists via PUT */}
                    <TableCell>
                      <Select
                        value={deal.dealStage || "Qualified"}
                        onValueChange={(val) => {
                          handleStageChange(deal.id, val);
                        }}
                      >
                        <SelectTrigger className="w-36" aria-label="Deal stage">
                          <SelectValue
                            placeholder={deal.dealStage || "Stage"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Priority select - now uses POST /priority/assign with body { priorityId } */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: priorityColor }}
                        />
                        <div className="flex-1">
                          <Select
                            value={prioritySelectValue}
                            onValueChange={(val) => {
                              const asNum = Number(val);
                              const toSend = !Number.isNaN(asNum)
                                ? asNum
                                : (() => {
                                    const resolved = priorityByStatus.get(
                                      String(val).toLowerCase(),
                                    );
                                    return resolved ? resolved.id : null;
                                  })();
                              if (toSend !== null)
                                handlePriorityAssign(deal.id, toSend);
                            }}
                          >
                            <SelectTrigger
                              className="w-32 text-sm py-1"
                              aria-label="Priority status"
                            >
                              {selectedPriority ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-block w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: selectedPriority.color,
                                    }}
                                  />
                                  <span className="text-sm">
                                    {selectedPriority.status}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Priority
                                </span>
                              )}
                            </SelectTrigger>

                            <SelectContent>
                              {(priorities && priorities.length > 0
                                ? priorities
                                : [
                                    { id: 3, status: "Low", color: "#10b981" },
                                    {
                                      id: 4,
                                      status: "Medium",
                                      color: "#f59e0b",
                                    },
                                    { id: 1, status: "High", color: "#ef4444" },
                                  ]
                              ).map((p: PriorityItem) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="inline-block w-2 h-2 rounded-full"
                                      style={{ backgroundColor: p.color }}
                                    />
                                    <span>{p.status}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatDealTags(
                        deal.tags as Array<
                          string | { tagName?: string | null }
                        > | null,
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          {deal?.dealStage.trim().toLowerCase() === "win" ? (
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/deals/get/${deal.id}`}>View</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/deals/create/${deal.id}`}>
                                  Edit
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteDeal(deal.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          ) : (
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/deals/get/${deal.id}`}>View</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/deals/create/${deal.id}`}>
                                  Edit
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setActiveDeal(deal);
                                  setOpenFollowup(true);
                                }}
                              >
                                Add Follow Up
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteDeal(deal.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          )}
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredDeals.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No deals found. Adjust your filters or search terms.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {openFilters && (
        <FiltersDrawer
          open={openFilters}
          onClose={() => setOpenFilters(false)}
          stages={stages}
          deals={deals}
          priorities={priorities}
          dateFilterOn={dateFilterOn}
          setDateFilterOn={setDateFilterOn}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          dealStageFilter={dealStageFilter}
          setDealStageFilter={setDealStageFilter}
          minValue={minValue}
          setMinValue={setMinValue}
          maxValue={maxValue}
          setMaxValue={setMaxValue}
          agentFilter={agentFilter}
          setAgentFilter={setAgentFilter}
          watcherFilter={watcherFilter}
          setWatcherFilter={setWatcherFilter}
          leadFilter={leadFilter}
          setLeadFilter={setLeadFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
        />
      )}

      <AddFollowupModal
        open={openFollowup}
        deal={activeDeal}
        onClose={() => {
          setOpenFollowup(false);
          setActiveDeal(null);
        }}
        onSaved={() => mutateDeals()}
      />
    </main>
  );
}

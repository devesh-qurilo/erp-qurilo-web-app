"use client";

import { useState, useRef, useEffect } from "react";
import type { Stage } from "@/types/stages";
import type { Deal } from "@/types/deals";
import { Calendar, Phone, MoreHorizontal, Trash2, Check, X } from "lucide-react";


import { ExternalLink } from "lucide-react";
import DealDetailPage from "../../get/[id]/page";


type Filters = {
  pipeline?: string;
  category?: string;
};

// ---- API ----
const API_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;
const PRIORITIES_ADMIN_ENDPOINT = `${API_BASE}/deals/admin/priorities`;
const PRIORITY_ASSIGN = (dealId: string | number) =>
  `${API_BASE}/deals/${dealId}/priority/assign`;
const PRIORITY_UPDATE = (dealId: string | number) =>
  `${API_BASE}/deals/${dealId}/priority`;
const DEALS_BULK = (dealId: string | number) =>
  `${API_BASE}/deals/${dealId}/bulk`;
const EMPLOYEES_ALL = `${API_BASE}/employee/all`;
const STAGE_DELETE = (stageId: string | number) =>
  `${API_BASE}/stages/${stageId}`;
// ---------------


const DEAL_STAGE_UPDATE = (dealId: string | number) =>
  `${API_BASE}/deals/${dealId}/stage`;



export default function KanbanBoard({
  stages,
  deals,
  search,
  filters,
}: {
  stages: Stage[];
  deals: Deal[];
  search: string;
  filters: Filters;
}) {
  const normalizedSearch = search.trim().toLowerCase();

  // local copy of stages so we can remove a stage after delete without changing parent props
  const [stagesState, setStagesState] = useState<Stage[]>(stages);
  useEffect(() => {
    setStagesState(stages);
  }, [stages]);


  const [dealsState, setDealsState] = useState<Deal[]>(deals);

  useEffect(() => {
    setDealsState(deals);
  }, [deals]);

  console.log("KanbanBoard render", { stages, dealsState, filters, search });

  // const filteredDeals = deals.filter((d) => {
  const filteredDeals = dealsState.filter((d) => {
    if (
      filters.pipeline &&
      d.pipeline?.trim().toLowerCase() !== filters.pipeline.trim().toLowerCase()
    )
      return false;

    if (
      filters.category &&
      d.dealCategory?.trim().toLowerCase() !==
      filters.category.trim().toLowerCase()
    )
      return false;

    if (normalizedSearch) {
      const hay =
        `${d.title} ${d.id} ${d.dealCategory ?? ""} ${d.pipeline ?? ""} ${d.dealAgentMeta?.name ?? d.dealAgent ?? ""
          }`.toLowerCase();
      if (!hay.includes(normalizedSearch)) return false;
    }

    return true;
  });



  function getDealFollowupDate(deal: Deal): Date | null {
    const parseDateSafe = (s: string) => {
      try {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
      } catch {
        return null;
      }
    };

    const followupsArray = Array.isArray((deal as any).followups)
      ? (deal as any).followups
      : [];

    // 1️⃣ latest nextDate from followups
    let latestNext: Date | null = null;

    for (const f of followupsArray) {
      const raw =
        f?.nextDate || f?.next_date || f?.next_followup_date;

      if (!raw) continue;

      const d = parseDateSafe(String(raw));
      if (!d) continue;

      if (!latestNext || d.getTime() > latestNext.getTime()) {
        latestNext = d;
      }
    }

    // 2️⃣ explicit nextFollowup field
    const explicitRaw =
      (deal as any).nextFollowupDate ||
      (deal as any).nextFollowup ||
      (deal as any).next_followup;

    const explicit = explicitRaw ? parseDateSafe(String(explicitRaw)) : null;

    return latestNext || explicit;
  }



  // Read token once (used for API calls)
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("accessToken"));
    }
  }, []);

  // Global palette fetched from API and shared to cards
  const [globalPalette, setGlobalPalette] = useState<
    Array<{ id?: number; name: string; color: string }>
  >(() => [
    // // fallback while loading (unique)
    // { id: -1, name: "Medium", color: "#FBBF24" },
    // { id: -2, name: "High", color: "#F97316" },
    // { id: -3, name: "Low", color: "#15803D" },
  ]);
  const [paletteLoading, setPaletteLoading] = useState<boolean>(true);

  // helper to dedupe palette by name case-insensitive, keep earlier items unless replaced by same-name with id/color
  const dedupePalette = (
    items: Array<{ id?: number; name: string; color: string }>,
  ) => {
    const map = new Map<string, { id?: number; name: string; color: string }>();
    for (const it of items) {
      const key = it.name.trim().toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, it);
      } else {
        const chosen =
          (!existing.id && it.id) ||
            (it.id && existing.id && it.id !== existing.id)
            ? { id: it.id ?? existing.id, name: it.name, color: it.color }
            : {
              id: existing.id ?? it.id,
              name: existing.name,
              color: existing.color ?? it.color,
            };
        map.set(key, chosen);
      }
    }
    return Array.from(map.values());
  };

  useEffect(() => {
    let mounted = true;

    // wait until token is loaded (token === null => still reading)
    if (token === null) {
      return;
    }

    const fetchPriorities = async () => {
      setPaletteLoading(true);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(PRIORITIES_ADMIN_ENDPOINT, { headers });
        if (!res.ok) {
          throw new Error(`Failed to load priorities: ${res.status}`);
        }
        const json = await res.json();
        if (!mounted) return;
        const mapped = Array.isArray(json)
          ? json.map((p: any) => ({
            id: p.id,
            name: String(p.status ?? p.status),
            color: p.color ?? "#2563EB",
          }))
          : [];
        if (mapped.length > 0) {
          setGlobalPalette((prev) => dedupePalette([...prev, ...mapped]));
        }
      } catch (err) {
        console.error("Error loading priorities:", err);
      } finally {
        if (mounted) setPaletteLoading(false);
      }
    };
    fetchPriorities();
    return () => {
      mounted = false;
    };
  }, [token]);

  /**
   * createGlobalPriority
   */
  const createGlobalPriority = async (name: string, color: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(PRIORITIES_ADMIN_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ status: name, color, isGlobal: true }),
    });
    if (!res.ok) {
      const text = await safeReadResponseText(res);
      throw new Error(
        `Failed to create global priority: ${res.status} ${text}`,
      );
    }
    const created = await res.json();
    return {
      id: created.id,
      name: created.status ?? name,
      color: created.color ?? color,
    };
  };

  const assignPriorityToDeal = async (
    dealId: string | number,
    priorityId: number,
  ) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(PRIORITY_ASSIGN(dealId), {
      method: "POST",
      headers,
      body: JSON.stringify({ priorityId }),
    });

    if (!res.ok) {
      const text = await safeReadResponseText(res);
      throw new Error(`Failed to assign priority: ${res.status} ${text}`);
    }
    const created = await res.json();
    return {
      id: created.id,
      name: created.status ?? String(created.status ?? priorityId),
      color: created.color ?? "#2563EB",
      dealId: created.dealId ?? dealId,
    };
  };

  const updatePriorityForDealFallback = async (
    dealId: string | number,
    priorityId: number,
  ) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(PRIORITY_UPDATE(dealId), {
      method: "PUT",
      headers,
      body: JSON.stringify({ priorityId }),
    });
    if (!res.ok) {
      const text = await safeReadResponseText(res);
      throw new Error(`Failed fallback PUT update: ${res.status} ${text}`);
    }
    const created = await res.json();
    return {
      id: created.id,
      name: created.status ?? String(created.status ?? priorityId),
      color: created.color ?? "#2563EB",
      dealId: created.dealId ?? dealId,
    };
  };

  async function safeReadResponseText(res: Response) {
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        return JSON.stringify(j);
      } else {
        const t = await res.text();
        return t;
      }
    } catch (e) {
      return "<could not read response body>";
    }
  }

  const addPriorityAndAssignFlow = async (
    name: string,
    color: string,
    dealId: string | number,
    existingId?: number,
  ) => {
    if (existingId) {
      try {
        const assigned = await assignPriorityToDeal(dealId, existingId);
        setGlobalPalette((prev) =>
          dedupePalette([
            ...prev,
            { id: assigned.id, name: assigned.name, color: assigned.color },
          ]),
        );
        return assigned;
      } catch (assignErr) {
        console.error(
          "Assign failed, attempting fallback. Assign error:",
          assignErr,
        );
        try {
          const fallback = await updatePriorityForDealFallback(
            dealId,
            existingId,
          );
          setGlobalPalette((prev) =>
            dedupePalette([
              ...prev,
              { id: fallback.id, name: fallback.name, color: fallback.color },
            ]),
          );
          return fallback;
        } catch (fallbackErr) {
          console.error("Fallback PUT failed:", fallbackErr);
          throw fallbackErr;
        }
      }
    }

    try {
      const createdGlobal = await createGlobalPriority(name, color);
      setGlobalPalette((prev) => dedupePalette([...prev, createdGlobal]));
      try {
        const assigned = await assignPriorityToDeal(
          dealId,
          createdGlobal.id as number,
        );
        setGlobalPalette((prev) =>
          dedupePalette([
            ...prev,
            { id: assigned.id, name: assigned.name, color: assigned.color },
          ]),
        );
        return assigned;
      } catch (assignErr) {
        console.error(
          "Assign after create failed, attempting fallback. Assign error:",
          assignErr,
        );
        try {
          const fallback = await updatePriorityForDealFallback(
            dealId,
            createdGlobal.id as number,
          );
          setGlobalPalette((prev) =>
            dedupePalette([
              ...prev,
              { id: fallback.id, name: fallback.name, color: fallback.color },
            ]),
          );
          return fallback;
        } catch (fallbackErr) {
          console.error("Fallback PUT failed after create:", fallbackErr);
          throw fallbackErr;
        }
      }
    } catch (createErr) {
      console.error("Create global priority failed:", createErr);
      throw createErr;
    }
  };






  const deleteGlobalPriority = async (priorityId: number) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${PRIORITIES_ADMIN_ENDPOINT}/${priorityId}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete priority failed ${res.status} ${txt}`);
      }

      // remove from palette instantly
      setGlobalPalette((prev) =>
        prev.filter((p) => p.id !== priorityId)
      );
    } catch (err) {
      console.error("Failed to delete priority", err);
    }
  };







  // --- Stage delete handler ---
  const [openStageMenuId, setOpenStageMenuId] = useState<
    string | number | null
  >(null);
  const deleteStage = async (stageId: string | number) => {



    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(STAGE_DELETE(stageId), {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const t = await safeReadResponseText(res);
        throw new Error(`Failed to delete stage: ${res.status} ${t}`);
      }
      setStagesState((s) =>
        s.filter((st) => String(st.id) !== String(stageId)),
      );
      setOpenStageMenuId(null);
    } catch (err) {
      console.error("Delete stage failed:", err);
      setOpenStageMenuId(null);
    }
  };



  //
  //   dealId: string | number,
  //   newStage: string
  // ) => {
  //   try {
  //     const headers: Record<string, string> = {
  //       "Content-Type": "application/json",
  //     };
  //     if (token) headers["Authorization"] = `Bearer ${token}`;

  //     const res = await fetch(
  //       (dealId), {
  //       method: "PUT",
  //       headers,
  //       body: JSON.stringify({ dealStage: newStage }),
  //     });

  //     if (!res.ok) {
  //       const t = await safeReadResponseText(res);
  //       throw new Error(`Stage update failed: ${res.status} ${t}`);
  //     }

  //     // setDealsState((prev) =>
  //     //   prev.map((d) =>
  //     //     String(d.id) === String(dealId)
  //     //       ? { ...d, dealStage: newStage }
  //     //       : d
  //     //   )
  //     // );






  // const stageDeals = filteredDeals
  //   .filter(
  //     (deal) =>
  //       deal.dealStage?.trim().toLowerCase() ===
  //       stage.name?.trim().toLowerCase()
  //   )
  //   .sort((a, b) => {
  //     const dateA = getDealFollowupDate(a);
  //     const dateB = getDealFollowupDate(b);

  //     if (!dateA && !dateB) return 0;
  //     if (!dateA) return 1;
  //     if (!dateB) return -1;

  //     return dateA.getTime() - dateB.getTime();
  //   });



  //   } catch (err) {
  //     console.error("Stage update error:", err);
  //   }
  // };

  const updateDealStage = async (
    dealId: number | string,
    newStage: string,
  ) => {
    if (!token) return;
    try {
      const url = `${process.env.NEXT_PUBLIC_MAIN}/deals/${dealId}/stage?stage=${encodeURIComponent(
        newStage,
      )}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Failed to update stage:", res.status, txt);
        return;
      }
      //await mutateDeals();
    } catch (err) {
      console.error("Error updating stage:", err);
    }
  };



  return (
    <div className="relative w-full h-full flex flex-col min-h-0">
      <div className="flex gap-6 flex-1 min-h-0 overflow-x-auto pb-4 px-1">
        {stagesState.map((stage) => {
          // const stageDeals = filteredDeals.filter(
          //   (deal) => deal.dealStage === stage.name,
          // );



          const stageDeals = filteredDeals
            // .filter((deal) => deal.dealStage === stage.name)

            .filter(
              (deal) =>
                deal.dealStage?.trim().toLowerCase() ===
                stage.name?.trim().toLowerCase()
            )

            .sort((a, b) => {
              const dateA = getDealFollowupDate(a);
              const dateB = getDealFollowupDate(b);

              // If both null
              if (!dateA && !dateB) return 0;

              // Null ko bottom me bhejna hai
              if (!dateA) return 1;
              if (!dateB) return -1;

              // Ascending order (earliest first)
              return dateA.getTime() - dateB.getTime();
            });



          return (
            <div
              key={stage.id}
              className="min-w-[340px] max-w-[380px] flex-shrink-0 flex flex-col h-full"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <h2 className="text-sm font-semibold text-foreground">
                    {stage.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {stageDeals.length}
                  </span>

                  {/* three-dot menu for stage with delete */}
                  <div className="relative">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/10"
                      onClick={() =>
                        setOpenStageMenuId((cur) =>
                          cur === stage.id ? null : stage.id,
                        )
                      }
                      aria-expanded={openStageMenuId === stage.id}
                      aria-label="Stage menu"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openStageMenuId === stage.id && (
                      <div className="absolute right-0 mt-2 w-36 bg-white border border-border shadow-lg rounded-md z-40">
                        <button
                          type="button"
                          onClick={() => deleteStage(stage.id)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600 font-medium">
                            Delete
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1 min-h-0 bg-muted/30 rounded-xl p-3 overflow-y-auto">
                {stageDeals.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <p className="text-sm text-muted-foreground">
                      No deals in this stage
                    </p>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    //                   <DealCard
                    //                     key={deal.id}
                    //                     deal={deal}
                    //                       stages={stagesState}
                    // onStageChange={updateDealStage}

                    //                     palette={globalPalette}
                    //                     paletteLoading={paletteLoading}
                    //                     addPriorityAndAssignFlow={addPriorityAndAssignFlow}
                    //                     token={token}
                    //                   />



                    <DealCard
                      key={deal.id}
                      deal={deal}
                      stages={stagesState}
                      onStageChange={updateDealStage}
                      palette={globalPalette}
                      paletteLoading={paletteLoading}
                      addPriorityAndAssignFlow={addPriorityAndAssignFlow}
                      deleteGlobalPriority={deleteGlobalPriority}
                      token={token}
                    />




                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------- helpers ------------------- */

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// function formatDateShort(d: Date) {
//   try {




//     return d.toLocaleDateString();
//   } catch {
//     return String(d);
//   }
// }


function formatDateShort(d: Date) {
  const dy = new Date(d);

  const day = String(dy.getDate()).padStart(2, "0");
  const month = String(dy.getMonth() + 1).padStart(2, "0"); // month starts from 0
  const year = dy.getFullYear();

  return `${day}-${month}-${year}`;
}


/* ------------------- DealCard ------------------- */

function DealCard({
  deal,
  stages,
  onStageChange,

  palette,
  paletteLoading,
  addPriorityAndAssignFlow,
  deleteGlobalPriority,

  token,
}: {
  deal: Deal;
  stages: Stage[];
  onStageChange: (
    dealId: string | number,
    stage: string
  ) => Promise<void>;

  palette: Array<{ id?: number; name: string; color: string }>;
  paletteLoading: boolean;
  addPriorityAndAssignFlow: (
    name: string,
    color: string,
    dealId: string | number,
    existingId?: number,
  ) => Promise<{ id?: number; name: string; color: string }>;
  deleteGlobalPriority: (priorityId: number) => Promise<void>;
  token: string | null;
}) {
  const leadName =
    (deal as any).leadName ||
    (deal as any).contactName ||
    deal.dealAgentMeta?.name ||
    deal.dealAgent ||
    "Unknown";

  const dealName = deal.title ?? "Deal";

  const initialTags: string[] = Array.isArray((deal as any).tags)
    ? (deal as any).tags
    : (deal as any).tags
      ? String((deal as any).tags)
        .split(",")
        .map((s: string) => s.trim())
      : [];

  // ---- COMMENTS ----
  const initialCommentsRaw =
    (deal as any).comments ??
    (deal as any).dealComments ??
    (deal as any).commentsMeta ??
    (deal as any).latestComments ??
    (deal as any).recentComments ??
    null;

  const parseComments = (raw: any) => {
    if (!raw) return [] as string[];
    if (Array.isArray(raw)) {
      return raw
        .map((c) => {
          if (!c) return "";
          if (typeof c === "string") return c;
          if (typeof c === "object")
            return String(c.commentText ?? c.comment ?? c.text ?? c.body ?? "");
          return String(c);
        })
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof raw === "object") {
      const single = String(
        raw.commentText ?? raw.comment ?? raw.text ?? raw.body ?? "",
      );
      return single ? [single] : [];
    }
    return [String(raw)];
  };

  const initialComments = parseComments(initialCommentsRaw);








  // ---- FOLLOWUP CREATED DATES (NEW) ----
  const initialFollowupsRaw =
    (deal as any).followups ??
    (deal as any).followUps ??
    (deal as any).followupHistory ??
    (deal as any).followupsMeta ??
    (deal as any).followupList ??
    (deal as any).followups_data ??
    (deal as any).followupsArray ??
    null;

  const parseFollowupsCreated = (raw: any) => {
    if (!raw) return [] as string[];
    if (Array.isArray(raw)) {
      return raw
        .map((f) => {
          if (!f) return "";
          const t =
            f.createdAt ??
            f.created_at ??
            f.createdDate ??
            f.createdDateTime ??
            f.created ??
            f.dateCreated ??
            f.date;
          if (t) return String(t);
          if (typeof f === "string" || typeof f === "number") return String(f);
          return "";
        })
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (typeof raw === "object") {
      const t =
        raw.createdAt ??
        raw.created_at ??
        raw.createdDate ??
        raw.created ??
        raw.dateCreated ??
        raw.date;
      if (t) return [String(t)];
      return [];
    }
    return [String(raw)];
  };

  const initialFollowups = parseFollowupsCreated(initialFollowupsRaw);

  // helper: pick most recent date from an array of date-strings
  const pickMostRecentDate = (arr: string[]) => {
    let best: Date | null = null;
    for (const s of arr) {
      const d = parseDateSafe(s);
      if (!d) continue;
      if (!best || d.getTime() > best.getTime()) best = d;
    }
    return best;
  };

  const nextFollowupRaw =
    (deal as any).nextFollowupDate ??
    (deal as any).nextFollowup ??
    (deal as any).next_followup;
  const nextFollowup = nextFollowupRaw
    ? parseDateSafe(String(nextFollowupRaw))
    : null;

  const contact =
    (deal as any).leadMobile ||
    (deal as any).contactPhone ||
    (deal as any).phone ||
    (deal as any).mobile ||
    (deal as any).contact_number ||
    "";

  const initialWatchers = Array.isArray((deal as any).watchers)
    ? (deal as any).watchers
    : Array.isArray((deal as any).dealWatchers)
      ? (deal as any).dealWatchers
      : (deal as any).dealWatchersMeta
        ? (deal as any).dealWatchersMeta
        : (deal as any).assignedEmployeesMeta
          ? (deal as any).assignedEmployeesMeta
          : (deal as any).assignedEmployees
            ? (deal as any).assignedEmployees
            : [];

  const rawPriority = (deal as any).priority;
  const parsePriorities = (raw: any) => {
    if (!raw) return [] as Array<{ name: string; color?: string }>;
    if (Array.isArray(raw)) {
      return raw.map((p: any) =>
        typeof p === "string"
          ? { name: p, color: undefined }
          : { name: p?.name ?? String(p), color: p?.color },
      );
    }
    if (typeof raw === "object") {
      return [{ name: raw.name ?? String(raw), color: raw.color }];
    }
    return [{ name: String(raw), color: undefined }];
  };

  const [priorities, setPriorities] = useState<
    Array<{ name: string; color?: string }>
  >(parsePriorities(rawPriority));

  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });

  const [openPopover, setOpenPopover] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [modalPriorityName, setModalPriorityName] = useState("");
  const [modalPriorityColor, setModalPriorityColor] = useState("#000000");
  const [saving, setSaving] = useState(false);

  // NEW: state for the Add (tags/people/comment) modal that opens when clicking the plus watcher button
  const [openAddModal, setOpenAddModal] = useState(false);
  const [addTags, setAddTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  // people stores employeeIds as strings (payload expects employeeIds)
  const [people, setPeople] = useState<string[]>([]);
  const [peopleInput, setPeopleInput] = useState("");
  const [comment, setComment] = useState("");

  // employees list (fetched from API) and map for quick lookup
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, any>>({});
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);

  // local UI state to reflect API changes on the card without changing other code
  const [localTags, setLocalTags] = useState<string[]>(initialTags);
  const [localWatchers, setLocalWatchers] = useState<any[]>(initialWatchers);

  // NEW: local comments shown on card
  const [localComments, setLocalComments] = useState<string[]>(initialComments);

  // NEW: local followup-created dates shown on card (strings)
  const [localFollowupsCreated, setLocalFollowupsCreated] =
    useState<string[]>(initialFollowups);

  // --- NEW: Sync incoming deal props into local card state so Kanban shows same people/tags/comments/followup-created as Deal -> People view
  useEffect(() => {
    setLocalTags(
      Array.isArray((deal as any).tags)
        ? (deal as any).tags
        : (deal as any).tags
          ? String((deal as any).tags)
            .split(",")
            .map((s: string) => s.trim())
          : [],
    );

    const watchersSource =
      (deal as any).assignedEmployeesMeta ??
      (deal as any).dealWatchersMeta ??
      (deal as any).dealWatchers ??
      (deal as any).assignedEmployees ??
      (deal as any).watchers ??
      [];

    setLocalWatchers(Array.isArray(watchersSource) ? watchersSource : []);

    // sync comments from incoming props (same fallbacks as above)
    const incomingComments = parseComments(
      (deal as any).comments ??
      (deal as any).dealComments ??
      (deal as any).commentsMeta ??
      (deal as any).latestComments ??
      (deal as any).recentComments ??
      null,
    );
    setLocalComments(incomingComments);

    // sync followup created dates (NEW)
    const incomingFollowups = parseFollowupsCreated(
      (deal as any).followups ??
      (deal as any).followUps ??
      (deal as any).followupHistory ??
      (deal as any).followupsMeta ??
      (deal as any).followupList ??
      null,
    );
    setLocalFollowupsCreated(incomingFollowups);
  }, [deal]);

  function parseDateSafe(s: string) {
    try {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  function pickLatestNextDate(followups: any[]) {
    let best: Date | null = null;

    for (const f of followups || []) {
      const raw = f?.nextDate || f?.next_date || f?.next_followup_date;

      if (!raw) continue;

      const d = parseDateSafe(String(raw));
      if (!d) continue;

      if (!best || d.getTime() > best.getTime()) {
        best = d;
      }
    }

    return best;
  }

  const followupsArray = Array.isArray((deal as any).followups)
    ? (deal as any).followups
    : [];

  const latestNextDateFromFollowups = pickLatestNextDate(followupsArray);

  const explicitNextFollowup =
    (deal as any).nextFollowupDate ||
      (deal as any).nextFollowup ||
      (deal as any).next_followup
      ? parseDateSafe(
        String(
          (deal as any).nextFollowupDate ||
          (deal as any).nextFollowup ||
          (deal as any).next_followup,
        ),
      )
      : null;

  const displayFollowupDate =
    latestNextDateFromFollowups || explicitNextFollowup;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!openPopover) return;
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpenPopover(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openPopover]);

  // Fetch employees once token is loaded (to populate People dropdown)
  useEffect(() => {
    let mounted = true;
    if (token === null) return;

    const fetchEmployees = async () => {
      setEmployeeLoading(true);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(EMPLOYEES_ALL, { headers });
        if (!res.ok) {
          throw new Error(`Failed to fetch employees: ${res.status}`);
        }
        const json = await res.json();
        if (!mounted) return;
        setEmployees(Array.isArray(json) ? json : []);
        const map: Record<string, any> = {};
        (Array.isArray(json) ? json : []).forEach((e: any) => {
          if (e?.employeeId) map[String(e.employeeId)] = e;
        });
        setEmployeesMap(map);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        if (mounted) setEmployeeLoading(false);
      }
    };

    fetchEmployees();
    return () => {
      mounted = false;
    };
  }, [token]);

  const applyPalettePriority = async (p: {
    id?: number;
    name: string;
    color: string;
  }) => {
    setPriorities([{ name: p.name, color: p.color }]);
    try {
      const assigned = await addPriorityAndAssignFlow(
        p.name,
        p.color,
        (deal as any).id,
        p.id,
      );



      // const applyPalettePriority = async (p: {
      //   id?: number;
      //   name: string;
      //   color: string;
      // }) => {

      //   setPriorities([{ name: p.name, color: p.color }]);

      //   try {

      //     let assigned;

      //     // if priority already exists → update
      //     if (priorities.length > 0) {
      //       assigned = await updatePriorityForDealFallback(
      //         (deal as any).id,
      //         p.id as number
      //       );
      //     } 
      //     // if no priority → assign
      //     else {
      //       assigned = await assignPriorityToDeal(
      //         (deal as any).id,
      //         p.id as number
      //       );
      //     }

      //     setPriorities([{ name: assigned.name, color: assigned.color }]);

      //   } catch (err) {
      //     console.error("Failed to persist selected priority:", err);
      //   }
      // };





      setPriorities([{ name: assigned.name, color: assigned.color }]);
    } catch (err) {
      console.error("Failed to persist selected priority:", err);
    }
  };

  const onOpenAddModal = () => {
    setModalPriorityName("");
    setModalPriorityColor("#000000");
    setOpenModal(true);
  };

  const onOpenPriorityList = () => {
    setOpenPopover(true);
  };

  const onSaveModal = async () => {
    if (!modalPriorityName.trim()) return;
    setSaving(true);
    try {
      const assigned = await addPriorityAndAssignFlow(
        modalPriorityName.trim(),
        modalPriorityColor || "#000000",
        (deal as any).id,
      );
      setPriorities([{ name: assigned.name, color: assigned.color }]);
      setOpenModal(false);
      setOpenPopover(false);
    } catch (err) {
      console.error("Could not save/assign priority", err);
    } finally {
      setSaving(false);
    }
  };




  const removePriority = async () => {
    try {
      // console.log("fgc", deal.id);

      const res = await fetch(`${API_BASE}/deals/${deal.id}/priority`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Delete failed ${res.status} ${errText}`);
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      // console.log("response", data);

      // remove priority from UI
      setPriorities([]);
      setOpenPopover(false);


    } catch (err) {
      console.error("Could not remove priority", err);
    }
  };




  const onCancelModal = () => {
    setOpenModal(false);
  };

  // --- Tag handlers for Add modal
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !addTags.includes(val)) {
        setAddTags((s) => [...s, val]);
      }
      setTagInput("");
    } else if (e.key === "Backspace" && tagInput === "") {
      setAddTags((s) => s.slice(0, -1));
    }
  };
  const removeTag = (t: string) => setAddTags((s) => s.filter((x) => x !== t));

  // --- People handlers for Add modal (autocomplete + selection)
  const handlePeopleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = peopleInput.trim();
      if (!val) return;
      const matched = employees.find(
        (emp) =>
          emp.employeeId === val ||
          emp.name?.toLowerCase() === val.toLowerCase(),
      );
      const idToAdd = matched ? String(matched.employeeId) : val;
      if (idToAdd && !people.includes(idToAdd)) {
        setPeople((s) => [...s, idToAdd]);
      }
      setPeopleInput("");
      setShowPeopleDropdown(false);
    } else if (e.key === "Backspace" && peopleInput === "") {
      setPeople((s) => s.slice(0, -1));
    } else {
      setShowPeopleDropdown(true);
    }
  };

  const removePerson = (p: string) =>
    setPeople((s) => s.filter((x) => x !== p));

  const onSelectEmployee = (emp: any) => {
    if (!emp || !emp.employeeId) return;
    const id = String(emp.employeeId);
    if (!people.includes(id)) {
      setPeople((s) => [...s, id]);
    }
    setPeopleInput("");
    setShowPeopleDropdown(false);
  };

  const filteredEmployees = employees
    .filter((emp) => {
      if (!peopleInput) return true;
      const q = peopleInput.toLowerCase();
      return (
        String(emp.employeeId || "")
          .toLowerCase()
          .includes(q) ||
        String(emp.name || "")
          .toLowerCase()
          .includes(q)
      );
    })
    .slice(0, 8);

  const onSaveAddModal = async () => {
    // Merge existing card tags + new modal tags (dedupe)
    const mergedTags = Array.from(
      new Set([
        ...localTags.map((t) => String(t).trim()).filter(Boolean),
        ...addTags.map((t) => String(t).trim()).filter(Boolean),
      ]),
    );

    // Merge existing employeeIds from localWatchers (extract employeeId/name) + people input
    const existingEmployeeIds: string[] = [];
    for (const w of localWatchers) {
      if (!w) continue;
      if (typeof w === "string") {
        existingEmployeeIds.push(w);
      } else if (w.employeeId) {
        existingEmployeeIds.push(String(w.employeeId));
      } else if (
        w.employeeId === undefined &&
        w.name &&
        typeof w.name === "string"
      ) {
        // skip
      }
    }
    const peopleTrimmed = people.map((p) => String(p).trim()).filter(Boolean);
    const mergedEmployeeIds = Array.from(
      new Set([...existingEmployeeIds, ...peopleTrimmed]),
    );

    // Build payload per your example (only include keys if non-empty)
    const payload: any = {};
    if (mergedTags.length > 0) payload.tags = mergedTags;
    if (mergedEmployeeIds.length > 0) payload.employeeIds = mergedEmployeeIds;
    if (comment && comment.trim())
      payload.comments = [{ commentText: comment.trim() }];

    if (!payload.tags && !payload.employeeIds && !payload.comments) {
      setOpenAddModal(false);
      return;
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(DEALS_BULK((deal as any).id), {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await safeReadResponseText(res);
        throw new Error(`Bulk update failed: ${res.status} ${text}`);
      }

      const json = await res.json();
      // update local UI from server response (per your example response keys)
      if (Array.isArray(json.tags)) {
        setLocalTags(json.tags);
      } else if (payload.tags) {
        setLocalTags(payload.tags);
      }

      if (
        Array.isArray(json.assignedEmployeesMeta) &&
        json.assignedEmployeesMeta.length > 0
      ) {
        setLocalWatchers(json.assignedEmployeesMeta);
      } else if (
        Array.isArray(json.dealWatchersMeta) &&
        json.dealWatchersMeta.length > 0
      ) {
        setLocalWatchers(json.dealWatchersMeta);
      } else if (payload.employeeIds && payload.employeeIds.length > 0) {
        const watchers = payload.employeeIds.map((id: string) => {
          const emp = employeesMap[id];
          return emp
            ? {
              employeeId: id,
              name: emp.name,
              profilePictureUrl: emp.profilePictureUrl,
            }
            : { employeeId: id, name: id };
        });
        setLocalWatchers(watchers);
      }

      // if server returned comments, update local comments; otherwise if we sent a comment, append it optimistically
      if (Array.isArray(json.comments) && json.comments.length > 0) {
        const parsed = parseComments(json.comments);
        setLocalComments(parsed);
      } else if (payload.comments && payload.comments.length > 0) {
        const sentText = String(payload.comments[0].commentText ?? "").trim();
        if (sentText) {
          setLocalComments((s) => [sentText, ...s].slice(0, 6));
        }
      }

      // sync followups from server if returned
      const serverFollowups =
        json.followups ??
        json.followUps ??
        json.followupHistory ??
        json.followupsMeta ??
        json.followupList ??
        null;

      if (serverFollowups) {
        const parsedF = parseFollowupsCreated(serverFollowups);
        if (Array.isArray(parsedF) && parsedF.length > 0) {
          setLocalFollowupsCreated(parsedF);
        }
      }

      setOpenAddModal(false);
    } catch (err) {
      console.error("Failed to save Add modal data:", err);
      setOpenAddModal(false);
    }
  };




  return (
    // <div className="group rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-default">


    <div
      //  className="group rounded-xl border border-gray-200 bg-white hover:shadow-xl hover:-translate-y-[2px] transition-all duration-200 cursor-default relative overflow-hidden"
      className="group rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-default relative"
      style={
        priorities.length > 0
          ? {
            borderLeft: `3px solid ${priorities[0].color}`,
            background: `linear-gradient(90deg, ${priorities[0].color}35 0%, white 40%)`,
          }
          : {}
      }
    >



      <div className="p-4 flex flex-col gap-3 relative">
        {/* <div className="absolute right-3 top-3"> */}

        <div className="absolute right-3 top-3 flex items-center gap-2">




          <button
            type="button"
            onClick={() => {
              window.location.href = `/deals/get/${deal.id}`;
            }}
            className="h-7 w-7 rounded-full bg-gray-300 border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-500 transition-all  duration-200"
            // className="opacity-1 group-hover:opacity-100 transition-all duration-200 h-7 w-7 rounded-full bg-gray-800 border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50"
            title="Open deal"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
          </button>




          <div>
            {priorities.length === 0 ? (
              <button
                type="button"
                onClick={() => setOpenPopover((s) => !s)}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium"
                aria-expanded={openPopover}
                aria-label="Toggle priority popover"
              >
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border text-sm font-medium text-blue-600 bg-white">
                  <span className="text-[14px]">＋</span>
                  <span className="text-xs">Add priority</span>
                </div>
              </button>

            ) : (
              <button
                type="button"
                // onClick={() => setOpenPopover(true)}

                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

                  setPopoverPos({
                    top: rect.bottom + 6,
                    right: window.innerWidth - rect.right,
                  });

                  setOpenPopover(true);
                }}


                className="h-6 w-6 rounded-full flex items-center justify-center"
                aria-label="Open priority list"
                title={priorities.map((p) => p.name).join(", ")}
              >
                <div
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{
                    backgroundColor:
                      priorities[0].color ?? "rgba(59,130,246,0.9)",
                  }}
                />
              </button>









            )}
          </div>

          {openPopover && (
            // <div
            //   ref={popRef}
            //   className="absolute right-0 mt-2 w-44 rounded-lg bg-white border border-border shadow-xl p-3 text-sm z-[9999]"
            //   role="dialog"
            //   aria-modal="false"
            // >




            <div
              ref={popRef}
              className="fixed w-44 rounded-lg bg-white border border-border shadow-xl p-3 text-sm z-[9999]"
              style={{
                top: popoverPos.top,
                right: popoverPos.right,
              }}
            >


              <div className="flex flex-col gap-2">
                {paletteLoading ? (
                  <div className="text-xs text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  // palette.map((pp) => (
                  //   <button
                  //     key={pp.id ?? pp.name}
                  //     type="button"
                  //     onClick={() => applyPalettePriority(pp)}
                  //     className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/20 text-left"
                  //   >
                  //     <span
                  //       className="h-3 w-3 rounded-full"
                  //       style={{ backgroundColor: pp.color }}
                  //     />
                  //     <span className="font-medium" style={{ color: pp.color }}>
                  //       {pp.name}
                  //     </span>
                  //   </button>
                  // ))



                  palette.map((pp) => {
                    const isAssigned =
                      priorities[0]?.name?.toLowerCase() === pp.name.toLowerCase();

                    return (
                      <div
                        key={pp.id ?? pp.name}
                        className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/20"
                      >
                        <button
                          type="button"
                          onClick={() => applyPalettePriority(pp)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: pp.color }}
                          />
                          <span className="font-medium" style={{ color: pp.color }}>
                            {pp.name}
                          </span>
                        </button>

                        {isAssigned ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          // <button
                          //   onClick={removePriority}
                          //   className="p-1 rounded hover:bg-red-50"
                          // >
                          //   <X className="w-4 h-4 text-red-500" />
                          // </button>



                          // <button
                          //   onClick={() => {
                          //     if (pp.id) deleteGlobalPriority(pp.id);
                          //   }}
                          //   className="p-1 rounded hover:bg-red-50"
                          // >
                          //   <X className="w-4 h-4 text-red-500" />
                          // </button>


                          !isAssigned &&
                          pp.id && (
                            <button
                              onClick={() => deleteGlobalPriority(pp.id)}
                              className="p-1 rounded hover:bg-red-50"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          )




                        )}
                      </div>
                    );
                  })



                )}
              </div>

              <div className="border-t border-border/60 my-2" />









              {/* <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenModal(true);
                    }}
                    className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-600 text-white"
                    title="Add"
                  >
                    ＋
                  </button>
                  <div className="text-sm text-muted-foreground">Add Priority</div>
                </div>
              </div> */}


              <button
                type="button"
                onClick={() => {
                  setOpenPopover(false);   // close dropdown

                  setOpenModal(true)


                }


                }
                className="flex items-center gap-2 w-full hover:bg-muted/20 rounded-md p-1"
              >
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-600 text-white">
                  ＋
                </div>

                <div className="text-sm text-muted-foreground">
                  Add Priority
                </div>
              </button>



              <br />


              {/* 
 <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={removePriority}
                    className="h-6 w-6 rounded-full flex items-center justify-center bg-red-500 text-white"
                    title="Add"
                  >
                    -
                  </button>
                  <div className="text-sm text-muted-foreground">Remove Priority</div>
                </div>
              </div> */}





              <button
                type="button"
                onClick={removePriority}
                className="flex items-center gap-2 w-full hover:bg-muted/20 rounded-md p-1"
              >
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-red-500 text-white">
                  -
                </div>

                <div className="text-sm text-muted-foreground">
                  Remove Priority
                </div>
              </button>



            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {dealName}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-muted-foreground truncate">
                {leadName}
              </div>


              <div className="mt-2 ml-16">
                <select
                  value={deal.dealStage}
                  onChange={(e) =>
                    onStageChange(deal.id as any, e.target.value)
                  }
                  className="w-full text-xs border border-border rounded-md px-2 py-1 bg-white"
                >
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.name}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* comments (small pills) */}
            {localComments && localComments.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {localComments.slice(0, 3).map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground max-w-[200px] truncate"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* NOTE: Removed the created-followup pill from here as requested.
                Only the followup date near the calendar/plus area below will be shown. */}
          </div>
        </div>

        {localTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {localTags.slice(0, 3).map((t, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            {contact ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{contact}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">—</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* IMPORTANT: show nextFollowup if present, otherwise fallback to mostRecentCreated followup date.
                If neither present, show "No follow-up" (exactly like before). */}
            {/* {displayFollowupDate ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{formatDateShort(displayFollowupDate)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>No follow-up</span>
              </div>
            )} */}
            {displayFollowupDate ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{formatDateShort(displayFollowupDate)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>No follow-up</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {localWatchers && localWatchers.length > 0 ? (
                localWatchers.slice(0, 4).map((w: any, i: number) => {
                  const img =
                    w?.profilePictureUrl ||
                    w?.profileUrl ||
                    w?.avatar ||
                    w?.avatarUrl;
                  const name =
                    w?.name || w?.displayName || w?.employeeId || String(w);
                  return img ? (
                    <img
                      key={i}
                      src={img}
                      alt={name}
                      title={name}
                      className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div
                      key={i}
                      title={name}
                      className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm"
                    >
                      {initials(name)}
                    </div>
                  );
                })
              ) : (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm">
                  {initials(leadName)}
                </div>
              )}

              {localWatchers && localWatchers.length > 4 && (
                <div className="h-7 w-7 rounded-full bg-muted/80 flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm">
                  +{localWatchers.length - 4}
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                setOpenAddModal(true);
              }}
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center bg-white text-blue-600 shadow-sm"
              title="Add watcher"
            >
              ＋
            </button>
          </div>
        </div>
      </div>

      {/* PRIORITY modal */}
      {openModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Priority modal"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onCancelModal}
          />

          <div className="relative z-10 w-[380px] bg-white rounded-lg shadow-lg border border-border p-5">
            <h3 className="text-lg font-semibold mb-4">Add</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Priority Status *
                </label>
                <input
                  type="text"
                  value={modalPriorityName}
                  onChange={(e) => setModalPriorityName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Color Code *
                </label>
                <input
                  type="text"
                  value={modalPriorityColor}
                  onChange={(e) => setModalPriorityColor(e.target.value)}
                  placeholder="eg #000000"
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onCancelModal}
                className="w-1/2 px-6 py-3 rounded-full border border-blue-600 text-blue-600 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveModal}
                className="w-1/2 px-6 py-3 rounded-full bg-blue-600 text-white text-sm font-medium"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {openAddModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Add modal"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenAddModal(false)}
          />

          <div className="relative z-20 w-[380px] bg-white rounded-lg shadow-lg border border-border p-4">
            <h3 className="text-lg font-semibold mb-3">Add</h3>

            <div className="space-y-3">
              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Tags
                </label>
                <div className="min-h-[40px] border border-border rounded-md px-2 py-2 flex items-center gap-2 flex-wrap">
                  {addTags.map((t) => (
                    <div
                      key={t}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-xs"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-[12px] leading-none px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 min-w-[80px] text-sm outline-none"
                  />
                </div>
              </div>

              {/* People with autocomplete */}
              <div className="relative">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  People
                </label>
                <div className="min-h-[40px] border border-border rounded-md px-2 py-2 flex items-center gap-2 flex-wrap">
                  {people.map((p) => {
                    const emp = employeesMap[p];
                    const display = emp ? emp.name : p;
                    return (
                      <div
                        key={p}
                        className="inline-flex items-center gap-1 bg-muted/20 text-muted-foreground rounded-full px-2 py-1 text-xs"
                      >
                        <span>{display}</span>
                        <button
                          type="button"
                          onClick={() => removePerson(p)}
                          className="text-[12px] leading-none px-1"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  <input
                    value={peopleInput}
                    onChange={(e) => {
                      setPeopleInput(e.target.value);
                      setShowPeopleDropdown(true);
                    }}
                    onKeyDown={handlePeopleKeyDown}
                    placeholder="Add people and press Enter (e.g. EMP-002)"
                    className="flex-1 min-w-[80px] text-sm outline-none"
                    onFocus={() => setShowPeopleDropdown(true)}
                  />
                </div>

                {/* dropdown */}
                {showPeopleDropdown && filteredEmployees.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-border shadow z-30 rounded-md max-h-56 overflow-auto">
                    {employeeLoading ? (
                      <div className="p-2 text-xs text-muted-foreground">
                        Loading...
                      </div>
                    ) : (
                      filteredEmployees.map((emp: any) => (
                        <button
                          key={emp.employeeId}
                          type="button"
                          onClick={() => onSelectEmployee(emp)}
                          className="w-full text-left px-3 py-2 hover:bg-muted/20 flex items-center gap-3"
                        >
                          {emp.profilePictureUrl ? (
                            <img
                              src={emp.profilePictureUrl}
                              alt={emp.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {initials(emp.name || emp.employeeId)}
                            </div>
                          )}
                          <div className="flex-1 text-sm">
                            <div className="font-medium text-foreground">
                              {emp.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {emp.employeeId}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                    {filteredEmployees.length === 0 && (
                      <div className="p-2 text-xs text-muted-foreground">
                        No employees found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full min-h-[100px] rounded-md border border-border p-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="w-1/2 px-4 py-2 rounded-md border border-blue-600 text-blue-600 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveAddModal}
                className="w-1/2 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function pickLatestNextDate(followupsArray: any) {
  throw new Error("Function not implemented.");
}

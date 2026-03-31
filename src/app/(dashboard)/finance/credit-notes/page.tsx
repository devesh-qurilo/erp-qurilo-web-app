// src/app/finance/credit-notes/page.tsx
"use client";

// import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
// import React, { useEffect, useMemo, useState, useRef } from "react";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { MoreHorizontal, Eye, Edit, Trash2, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EditCreditNoteModal, {
  CreditNoteShape,
} from "../credit-notes/components/EditCreditNoteModal";
import { format } from "date-fns";

const API_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;

type Company = {
  companyName?: string;
  companyLogoUrl?: string | null;
};

type Client = {
  clientId?: string;
  name?: string;
  email?: string;
  company?: Company | null;
  profilePictureUrl?: string | null;
};

type Project = {
  projectName?: string | null;
};

type CreditNote = {
  id: number;
  creditNoteNumber?: string;
  creditNoteDate?: string | null;
  currency?: string | null;
  adjustment?: number | null;
  adjustmentPositive?: boolean;
  amount?: number | null;
  fileUrl?: string | null;
  client?: Client | null;
  project?: Project | null;
  totalAmount?: number | null;
  invoiceNumber?: string | null;
  tax?: number | null;
  notes?: string | null;
};

export default function CreditNotesPage() {
  const router = useRouter();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [clientFilter, setClientFilter] = useState<string>("all");
  const [openMenuFor, setOpenMenuFor] = useState<number | null>(null);


const [menuPosition, setMenuPosition] = useState<{
  top: number;
  left: number;
} | null>(null);

const menuRef = useRef<HTMLDivElement | null>(null);



  // Modal state
  const [editing, setEditing] = useState<CreditNote | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // View modal state
  const [viewing, setViewing] = useState<CreditNote | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);

  // Filter drawer state kept as you had (if present)
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [projectFilter, setProjectFilter] = useState<string>("all");


  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");


  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken") || "";
        const res = await fetch(`${API_BASE}/api/credit-notes/getAll`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch credit note (${res.status})`);
        }

        const data = await res.json();
        if (!mounted) return;
        setCreditNotes(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Credit notes fetch error:", err);
        setError(err?.message || "Failed to load credit notes");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);




  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setOpenMenuFor(null);
      setMenuPosition(null);
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpenMenuFor(null);
      setMenuPosition(null);
    }
  };

  if (openMenuFor !== null) {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleEscape);
  };
}, [openMenuFor]);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const cn of creditNotes) {
      const name = cn.project?.projectName;
      if (name) {
        map.set(name, name);
      }
    }
    return [
      { value: "all", label: "All" },
      ...Array.from(map.values()).map((n) => ({ value: n, label: n })),
    ];
  }, [creditNotes]);

  // const filteredNotes = useMemo(() => {
  //   return creditNotes.filter((cn) => {
  //     if (projectFilter && projectFilter !== "all") {
  //       return cn.project?.projectName === projectFilter;
  //     }
  //     return true;
  //   });
  // }, [creditNotes, projectFilter]);


  const filteredNotes = useMemo(() => {
    return creditNotes.filter((cn) => {
      // Project filter
      if (projectFilter && projectFilter !== "all") {
        if (cn.project?.projectName !== projectFilter) return false;
      }

      // Date filter
      if (cn.creditNoteDate) {
        const noteDate = new Date(cn.creditNoteDate);

        if (startDate) {
          const start = new Date(startDate);
          if (noteDate < start) return false;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // include full end day
          if (noteDate > end) return false;
        }
      }

      return true;
    });
  }, [creditNotes, projectFilter, startDate, endDate]);




  const formatDate = (d?: string | null) => {
    if (!d) return "";
    try {
      return format(new Date(d), "dd-MM-yyyy");
      //  new Date(d).toLocaleDateString("en-GB");
    } catch {
      return d;
    }
  };

  const formatCurrency = (currency?: string | null, amount?: number | null) => {
    const code = currency ?? "USD";
    const val = Number(amount ?? 0);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    } catch {
      return `${code} ${val.toFixed(2)}`;
    }
  };

  const formatNumberTwo = (n?: number | null) => {
    const val = Number(n ?? 0);
    return val.toFixed(2);
  };

  // OPEN view modal when View clicked (changed to open a details modal UI per your request)
  const handleView = (cn: CreditNote) => {
    setViewing(cn);
    setShowViewModal(true);
    setOpenMenuFor(null);
  };

  // OPEN modal when Edit clicked
  const handleOpenEdit = (cn: CreditNote) => {
    setEditing(cn);
    setShowModal(true);
    setOpenMenuFor(null);
  };

  // Receive updated CN from modal; update local list (placeholder — keep logic unchanged)
  const handleUpdateFromModal = (updated: CreditNoteShape) => {
    setCreditNotes((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  };

  const handleDelete = (cn: CreditNote) => {
    if (!confirm(`Delete credit note ${cn.creditNoteNumber || cn.id}?`)) return;
    setCreditNotes((prev) => prev.filter((p) => p.id !== cn.id));
    alert("Deleted (placeholder)");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto relative">
        <div className="mb-6">
          {/* <h2 className="text-2xl font-semibold text-slate-900">Credit Note</h2> */}

{loading ? (
  <Skeleton width={180} height={30} />
) : (
  <h2 className="text-2xl font-semibold text-slate-900">Credit Note</h2>
)}

        </div>

        {/* Filter bar */}
        <div className="bg-white border rounded-md mb-4 p-4 flex items-center gap-4">

  {loading ? (
    <>
      <Skeleton width={120} height={20} />
      <Skeleton width={120} height={35} />
      <Skeleton width={120} height={35} />
      <Skeleton width={80} height={35} />
    </>
  ) : (
    <>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600 font-medium">Duration</div>
            {/* <div className="text-sm text-slate-500">Start Date to End Date</div> */}

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <span className="text-slate-500 text-sm">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>


          </div>





          <div>
            <Select
              onValueChange={(v) => setClientFilter(v)}
              value={clientFilter}
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="clientA">Client A</SelectItem>
                <SelectItem value="clientB">Client B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 text-sm text-slate-700 px-3 py-1 rounded hover:bg-slate-50"
              title="Filters"
            >
              <span>Filters</span>
            </button>
          </div>



</>
)}

        </div>

        {/* Main table container */}
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          {/* {loading ? (
            <div className="p-8 text-center text-slate-600">
              Loading credit notes...
            </div>
          ) : error ? ( */}



{loading ? (
  <div className="p-4 space-y-3">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3 border rounded">
        <Skeleton width={120} />
        <Skeleton width={100} />
        <Skeleton circle width={32} height={32} />
        <Skeleton width={140} />
        <Skeleton width={120} />
        <Skeleton width={40} height={30} />
      </div>
    ))}
  </div>
) : error ? (


            <div className="p-8 text-center text-red-500">Error: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-transparent">
                  <TableHead className="pl-6">Credit Note</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead>Credit Note Date</TableHead>
                  <TableHead className="pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredNotes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      No credit notes found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotes.map((cn) => (
                    <TableRow key={cn.id} className="even:bg-white/50">
                      {/* Credit Note */}
                      <TableCell className="pl-6 align-middle">
                        <div className="font-medium text-sm">
                          {cn.creditNoteNumber || `CN-${cn.id}`}
                        </div>
                      </TableCell>

                      {/* Invoice */}
                      <TableCell className="align-middle">
                        <div className="text-sm text-slate-600">
                          {cn.invoiceNumber || "INV#014"}
                        </div>
                      </TableCell>

                      {/* Client */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-3">
                          {cn.client?.profilePictureUrl ||
                            cn.client?.company?.companyLogoUrl ? (
                            <Image
                              src={
                                cn.client?.profilePictureUrl ??
                                cn.client?.company?.companyLogoUrl ??
                                ""
                              }
                              alt={cn.client?.name || "logo"}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                              {cn.client?.name
                                ? cn.client.name.charAt(0).toUpperCase()
                                : "S"}
                            </div>
                          )}

                          <div>
                            <div className="font-medium text-sm">
                              {cn.client?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {cn.project?.projectName || ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-center align-middle">
                        <div>
                          <div className="text-sm font-semibold">
                            Total :{" "}
                            <span className="font-semibold">
                              {formatCurrency(
                                cn.currency,
                                cn.totalAmount ?? cn.amount ?? 0
                              )}
                            </span>
                          </div>

                          <div className="mt-1 text-sm">
                            <span className="text-amber-600 font-medium">
                              Adjustment :{" "}
                            </span>
                            <span className="text-slate-700">
                              {formatNumberTwo(cn.adjustment)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="align-middle">
                        <div className="text-sm">
                          {formatDate(cn.creditNoteDate)}
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="pr-6 align-middle">
                        <div className="flex justify-between relative">
                          {/* <button
                            onClick={() =>
                              setOpenMenuFor(
                                openMenuFor === cn.id ? null : cn.id
                              )
                            }
                            className="p-1 rounded hover:bg-slate-100"
                            title="More"
                          >
                            <MoreHorizontal className="w-5 h-5 text-slate-600" />
                          </button> */}


<button
  onClick={(e) => {
    e.stopPropagation();

    if (openMenuFor === cn.id) {
      setOpenMenuFor(null);
      setMenuPosition(null);
      return;
    }

    const rect =
      (e.currentTarget as HTMLElement).getBoundingClientRect();

    const menuWidth = 170;
    const menuHeight = 120;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 6;

    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }

    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 6;
    }

    setOpenMenuFor(cn.id);
    setMenuPosition({ top, left });
  }}
  className="p-1 rounded hover:bg-slate-100"
  title="More"
>
  <MoreHorizontal className="w-5 h-5 text-slate-600" />
</button>



                          {/* {openMenuFor === cn.id && (
                            <div
                              className="absolute right-0 top-8 z-30 bg-white border rounded-md shadow-md w-40"
                              onMouseLeave={() => setOpenMenuFor(null)}
                            >
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                                onClick={() => {
                                  // Show the detail modal (UI like the attached image)
                                  handleView(cn);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">View</span>
                              </button>

                              <button
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                                onClick={() => {
                                  // Open the edit modal (new behavior but purely UI)
                                  handleOpenEdit(cn);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                                <span className="text-sm">Edit</span>
                              </button>

                              <button
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-red-600"
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  handleDelete(cn);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm">Delete</span>
                              </button>
                            </div>
                          )} */}




{openMenuFor === cn.id &&
  menuPosition &&
  createPortal(
    <div
      ref={menuRef}
      className="fixed w-44 bg-white border rounded-md shadow-2xl z-[99999]"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
      }}
    >
      <button
        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
        onClick={() => handleView(cn)}
      >
        <Eye className="w-4 h-4" />
        <span className="text-sm">View</span>
      </button>

      <button
        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
        onClick={() => handleOpenEdit(cn)}
      >
        <Edit className="w-4 h-4" />
        <span className="text-sm">Edit</span>
      </button>

      <button
        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-red-600"
        onClick={() => {
          setOpenMenuFor(null);
          setMenuPosition(null);
          handleDelete(cn);
        }}
      >
        <Trash2 className="w-4 h-4" />
        <span className="text-sm">Delete</span>
      </button>
    </div>,
    document.body
  )}


                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Filters Drawer (simple) */}
        {showFilters && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowFilters(false)}
            />
            <aside className="fixed right-0 top-0 h-full w-80 bg-white border-l z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium text-slate-800">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  X
                </button>
              </div>
              <div className="p-4 flex-1 overflow-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Project
                  </label>
                  <Select
                    value={projectFilter}
                    onValueChange={(v) => setProjectFilter(v)}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <button
                    // onClick={() => {
                    //   setProjectFilter("all");
                    //   setShowFilters(false);
                    // }}

                    onClick={() => {
                      setProjectFilter("all");
                      setStartDate("");
                      setEndDate("");
                      setShowFilters(false);
                    }}




                    className="px-4 py-2 border rounded text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 bg-slate-800 text-white rounded text-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Edit Credit Note Modal (separate file) */}
      <EditCreditNoteModal
        open={showModal}
        creditNote={editing ?? undefined}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onUpdate={(updated) => {
          // update local list (UI only) — keep behavior unchanged otherwise
          setCreditNotes((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
          );
        }}
      />

      {/* View Credit Note Modal (new, matches the UI in the attached image) */}
      {showViewModal && viewing && (
        <ViewCreditNoteModal
          open={showViewModal}
          creditNote={viewing}
          onClose={() => {
            setShowViewModal(false);
            setViewing(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * ViewCreditNoteModal
 * - Renders a details panel/modal matching the screenshot you provided.
 * - Does not change other behaviors of the page; it's purely a UI viewer.
 */
function ViewCreditNoteModal({
  open,
  creditNote,
  onClose,
}: {
  open: boolean;
  creditNote: CreditNote | null;
  onClose: () => void;
}) {
  if (!open || !creditNote) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
        aria-hidden
      />
      <div
        // className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4"
  className="fixed inset-0 z-50 flex justify-end"


        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          // className="bg-white w-full max-w-4xl rounded-lg shadow-lg overflow-hidden"
  className="bg-white w-[83%] h-full shadow-xl overflow-y-auto"


          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-slate-900">
              Credit Note Details hv
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Content area */}
          <div className="p-6">
            <div className="border rounded-md p-5 bg-white">
              <div className="grid grid-cols-12 gap-y-4 gap-x-6">
                {/* Labels column (left) */}
                <div className="col-span-4 text-sm text-slate-600 space-y-6">
                  <div className="py-1">Credit Note #</div>
                  <div className="py-1">Credit Note Date</div>
                  <div className="py-1">Client</div>
                  <div className="py-1">Project</div>
                  <div className="py-1">Invoice Amount</div>
                  <div className="py-1">Adjustment</div>
                  <div className="py-1">Tax</div>
                  <div className="py-1">Note</div>
                  <div className="py-1">File</div>
                </div>

                {/* Values column (right) */}
                <div className="col-span-8 text-sm text-slate-800 space-y-6">
                  <div className="py-1 font-medium">
                    {creditNote.creditNoteNumber || `CN-${creditNote.id}`}
                  </div>

                  <div className="py-1">
                    {creditNote.creditNoteDate
                      ? new Date(creditNote.creditNoteDate).toLocaleDateString(
                        "en-GB"
                      )
                      : ""}
                  </div>

                  <div className="py-1">
                    <div className="flex items-center gap-3">
                      {creditNote.client?.profilePictureUrl ||
                        creditNote.client?.company?.companyLogoUrl ? (
                        <Image
                          src={
                            creditNote.client?.profilePictureUrl ??
                            creditNote.client?.company?.companyLogoUrl ??
                            ""
                          }
                          alt={creditNote.client?.name ?? "client"}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          {creditNote.client?.name
                            ? creditNote.client.name.charAt(0).toUpperCase()
                            : "S"}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {creditNote.client?.name ?? "Unknown"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {creditNote.client?.company?.companyName ?? ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {creditNote.project?.projectName ?? ""}
                  </div>

                  <div className="py-1">
                    {formatCurrencySafe(creditNote.currency, creditNote.amount)}
                  </div>

                  <div className="py-1">
                    {formatCurrencySafe(
                      creditNote.currency,
                      creditNote.adjustment
                    )}{" "}
                    <span className="text-slate-400">
                      ({creditNote.adjustmentPositive ? "Add" : "Subtract"})
                    </span>
                  </div>

                  <div className="py-1">
                    {creditNote.tax != null
                      ? `${Number(creditNote.tax).toFixed(0)} %`
                      : ""}
                  </div>

                  <div className="py-1 text-slate-600">
                    {creditNote.notes ?? ""}
                  </div>

                  <div className="py-1">
                    {creditNote.fileUrl ? (
                      <div className="relative inline-block">
                        <div className="w-40 h-24 border rounded overflow-hidden bg-slate-50">
                          {/* Use next/image for the thumbnail if possible */}
                          <Image
                            src={creditNote.fileUrl}
                            alt="attachment"
                            width={160}
                            height={96}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        <a
                          href={creditNote.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute right-0 -top-3 bg-white border rounded-full p-1 shadow hover:bg-slate-100"
                          title="Download"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-slate-600"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 14a1 1 0 011-1h3v2H5v1h10v-1h-2v-2h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM9 3a1 1 0 00-1 1v6H6l4 4 4-4h-2V4a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </a>
                      </div>
                    ) : (
                      <div className="text-slate-400">No file attached</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer (close only) */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Helper local-only formatting used inside modal (kept here so file is standalone) */
function formatCurrencySafe(currency?: string | null, amount?: number | null) {
  const code = currency ?? "USD";
  const val = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  } catch {
    return `${code} ${val.toFixed(2)}`;
  }
}

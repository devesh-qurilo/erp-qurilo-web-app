
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";

import { MoreHorizontal, Eye, Edit, TrendingUp, Trash2, Calendar, CalendarIcon } from "lucide-react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import ImportButton from "@/components/ImportButton";
import ExportButton from "@/components/ExportButton";

interface Company {
  companyName: string;
  city?: string;
  state?: string;
}

interface Client {
  id: string;
  name: string;
  clientId: string;
  profilePictureUrl?: string | null;
  email: string;
  mobile?: string | null;
  country?: string | null;
  category?: string | null;
  subCategory?: string | null;
  company?: Company | null;
  companyLogoUrl?: string | null;
  status: "ACTIVE" | "INACTIVE" | string;
  addedBy: string;
  createdAt?: string | null;
}

const BASE = process.env.NEXT_PUBLIC_MAIN; // MUST end with /api/v1

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Header date filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Right drawer
  const [drawerOpen, setDrawerOpen] = useState(false);


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [clientNameFilter, setClientNameFilter] = useState("All");
  const [headerCategoryFilter, setHeaderCategoryFilter] = useState("All");
  const [headerSubCategoryFilter, setHeaderSubCategoryFilter] = useState("All");

  const placeholderImg = "/placeholder.png";

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!BASE) {
        throw new Error("API base not configured (NEXT_PUBLIC_MAIN).");
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Token missing — please login again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE}/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }

      const data = await response.json();
// console.log("🔥 FULL CLIENTS API RESPONSE 👉", data); // ✅ ADD HERE


      setClients(Array.isArray(data) ? data : []);
      setFilteredClients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Error fetching clients");
    } finally {
      setLoading(false);
    }
  }, []);



  // initial load
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // console.log("first",clients)

  // Listen for refresh triggers:
  useEffect(() => {
    // storage event (other tabs/windows)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "clients:refresh") {
        fetchClients();
      }
    };

    // custom event for same-tab refresh
    const onCustom = () => {
      fetchClients();
    };

    // when page becomes visible again (user returns), re-fetch
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchClients();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("clients:refresh", onCustom);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("clients:refresh", onCustom);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchClients]);

  // Filtering
  useEffect(() => {
    let result = [...clients];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.clientId || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }

    if (clientNameFilter !== "All") {
      result = result.filter((c) => c.name === clientNameFilter);
    }

    if (headerCategoryFilter !== "All") {
      result = result.filter((c) => c.category === headerCategoryFilter);
    }

    if (headerSubCategoryFilter !== "All") {
      result = result.filter((c) => c.subCategory === headerSubCategoryFilter);
    }

    if (startDate || endDate) {
      result = result.filter((c) => {
        if (!c.createdAt) return false;

        const created = new Date(c.createdAt);

        if (startDate) {
          const s = new Date(startDate);
          if (created < s) return false;
        }

        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (created > e) return false;
        }

        return true;
      });
    }






    setFilteredClients(result);
    setCurrentPage(1);
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    clientNameFilter,
    headerCategoryFilter,
    headerSubCategoryFilter,
    startDate,      // 👈 ADD THIS
    endDate,        // 👈 ADD THIS
    clients,
  ]);







  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginated = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Actions
  const handleView = (id: string) => router.push(`/clients/${id}`);
  const handleEdit = (id: string) => router.push(`/clients/${id}/edit`);
  const handleMove = (id: string) => router.push(`/deals/create`);

  const handleDelete = async (client: Client) => {
    if (!confirm(`Delete ${client.name}?`)) return;

    try {
      const response = await fetch(`${BASE}/clients/${client.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) throw new Error("Delete failed");

      // re-fetch after delete
      fetchClients();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // if (loading) {
  //   return (
  //     <div className="h-screen flex  justify-center items-center">
  //       Loading...
  //     </div>
  //   );
  // }




if (loading) {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">

      {/* Top Filters */}
      <div className="flex justify-between items-center">
        <Skeleton width={200} height={30} />
        <Skeleton width={120} height={30} />
      </div>

      {/* Search + Button */}
      <div className="flex justify-between items-center">
        <Skeleton width={140} height={35} />
        <Skeleton width={250} height={35} />
      </div>

      {/* Table Card */}
      <div className="bg-white border rounded-xl p-4 space-y-4">

        {/* Title */}
        <Skeleton width={180} height={25} />

        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} height={15} />
          ))}
        </div>

        {/* Table Rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4 items-center">
            <Skeleton height={15} />
            <div className="flex items-center gap-2">
              <Skeleton circle width={32} height={32} />
              <Skeleton width={100} height={15} />
            </div>
            <Skeleton height={15} />
            <Skeleton height={15} />
            <Skeleton width={60} height={20} />
            <Skeleton height={15} />
            <Skeleton width={30} height={20} />
          </div>
        ))}

      </div>
    </div>
  );
}



  if (error) {
    return (
      <div className="h-screen flex justify-center items-center text-red-600">
        {error}
      </div>
    );
  }

  return (





    <div className="container mx-auto py-6 px-4">
      {/* ADD CLIENT */}
      {/* TOP FILTER BAR */}
      <div className="mb-4 border-b border-gray-200">
        <div className="flex items-center justify-between py-3">

          {/* LEFT: Duration */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer 
               border border-gray-300 px-3 py-2 rounded-md hover:border-slate-400 transition 

              ">
                <span className="text-sm text-muted-foreground">Duration </span>
                <span className="text-sm text-muted-foreground 

                ">

                  {startDate && endDate
                    ? `${format(new Date(startDate), "dd-MM-yyyy")
                    } to ${format(new Date(endDate), "dd-MM-yyyy")}`
                    : <div className="font-medium">Start Date to End Date
                      <CalendarIcon className="inline-block mb-1 ml-2 h-4 w-4" />
                    </div>

                  }


                </span>

              </div>
            </PopoverTrigger>

            <PopoverContent className="w-[320px] p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Select Duration</h4>

                <div>
                  <label className="text-sm text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* RIGHT: Filters */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-slate-700
                           border border-gray-300 px-3 py-2 rounded-md hover:border-slate-400 transition 
"

          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M6 12h12M10 18h4" />
            </svg>
            Filters
          </button>

        </div>
      </div>




      {/* 
      <div className="mb-4 flex justify-end">
        <Button onClick={() => router.push("/clients/new")}>
          + Add Client
        </Button>
      </div> */}




      <div className="mb-4 flex items-center justify-between gap-4">
        {/* LEFT SIDE (optional space if needed later) */}

        {/* Add Client Button */}
        <Button onClick={() => router.push("/clients/new")}>
          + Add Client
        </Button>


         <ImportButton
      api="/clients/import/csv"
      label="Import Clients"
      onSuccess={() => fetchClients()}
    />



    <ExportButton
  api="/clients"
  label="Export Clients"
  fileName="clients.csv"
/>

        <div />





        {/* RIGHT SIDE: Search + Add Client */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm 
                   focus:outline-none focus:ring-2 focus:ring-slate-400"
            />

            {/* Search Icon */}
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>


        </div>
      </div>







      <Card>


        {drawerOpen && (
          <div className="fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setDrawerOpen(false)}
            />

            <aside className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg border-l p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button onClick={() => setDrawerOpen(false)}>✕</button>
              </div>

              <div className="space-y-4">
                {/* Client Name */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Client Name
                  </label>
                  <select
                    value={clientNameFilter}
                    onChange={(e) => setClientNameFilter(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="All">All</option>
                    {[...new Set(clients.map((c) => c.name))].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={headerCategoryFilter}
                    onChange={(e) => setHeaderCategoryFilter(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="All">All</option>
                    {[...new Set(clients.map((c) => c.category).filter(Boolean))].map(
                      (cat) => (
                        <option key={cat!} value={cat!}>{cat}</option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Sub Category
                  </label>
                  <select
                    value={headerSubCategoryFilter}
                    onChange={(e) => setHeaderSubCategoryFilter(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="All">All</option>
                    {[...new Set(clients.map((c) => c.subCategory).filter(Boolean))].map(
                      (subCat) => (
                        <option key={subCat!} value={subCat!}>{subCat}</option>
                      )
                    )}
                  </select>
                </div>

                {/* Clear */}
                <div className="pt-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setClientNameFilter("All");
                      setHeaderCategoryFilter("All");
                      setHeaderSubCategoryFilter("All");
                      setDrawerOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}




        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sub Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.clientId}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={client.profilePictureUrl || placeholderImg}
                        />
                        <AvatarFallback>
                          {client.name?.[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="font-semibold">{client.name}</div>
                        {client.company?.companyName && (
                          <div className="text-xs text-muted-foreground">
                            {client.company.companyName}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.mobile ?? "—"}</TableCell>

                  <TableCell>
                    {client.category ? <Badge>{client.category}</Badge> : "—"}
                  </TableCell>

                  <TableCell>
                    {client.subCategory ? (
                      <Badge variant="outline">{client.subCategory}</Badge>
                    ) : "—"}
                  </TableCell>

                  <TableCell>
                    {client.createdAt
                      ?
                      //  new Date(client.createdAt).toLocaleDateString()
                      format(new Date(client.createdAt), "dd-MM-yyyy")
                      : "—"}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(client.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleEdit(client.id)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleMove(client.id)}>
                          <TrendingUp className="mr-2 h-4 w-4" /> Move to Deal
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(client)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* simple pagination controls */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              Page {currentPage} of {Math.max(1, totalPages)}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                Prev
              </Button>
              <Button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

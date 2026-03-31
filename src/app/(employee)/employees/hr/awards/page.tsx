
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  Loader2,
  MoreHorizontal,
  Trophy,
  View,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
import { Skeleton } from "@/components/ui/skeleton";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";



interface AwardData {
  id: number;
  title: string;
  summary: string;
  iconUrl: string;
  iconFileId: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string;
}

export default function AwardsPage() {
  const [awards, setAwards] = useState<AwardData[]>([]);
  const [filteredAwards, setFilteredAwards] = useState<AwardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewAward, setViewAward] = useState<AwardData | null>(null);


  // filters & pagination
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // ✅ Fetch all awards
  useEffect(() => {
    async function fetchAwards() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Access token not found");

        const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch awards");

        const data = await res.json();
        setAwards(data);
        setFilteredAwards(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchAwards();
  }, []);

  // ✅ Handle Search + Filter
  useEffect(() => {
    let result = awards;

    if (filterStatus !== "all") {
      result = result.filter((a) =>
        filterStatus === "active" ? a.isActive : !a.isActive
      );
    }

    if (search.trim() !== "") {
      const term = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.summary.toLowerCase().includes(term)
      );
    }

    setFilteredAwards(result);
    setCurrentPage(1);
  }, [search, filterStatus, awards]);

  // ✅ Delete Award
  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this award?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");

      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });


      if (!res.ok) throw new Error("Failed to delete award");

      setAwards((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  // ✅ Pagination Logic
  const totalPages = Math.ceil(filteredAwards.length / pageSize);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAwards.slice(start, start + pageSize);
  }, [filteredAwards, currentPage]);

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error: {error}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="gap-8">

          <Link href="/employees/hr/appreciation">
            <Button>
              <Trophy className="h-4 w-4 mr-2" />

            </Button>
          </Link>
          <Link href="/employees/hr/awards" className="ml-2">
            <Button>
              <Award className="h-4 w-4 mr-2" />

            </Button>
          </Link>
        </div>

      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search awards..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[100px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Icon</TableHead>
                <TableHead className="text-left">Title</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No awards found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell>
                      <img
                        src={award.iconUrl || "/placeholder.svg"}
                        alt={award.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{award.title}</TableCell>
                    <TableCell className="max-w-xs line-clamp-2 text-sm text-muted-foreground">
                      {award.summary}
                    </TableCell>
                    <TableCell>
                      {award.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {
                        // new Date(award.updatedAt).toLocaleDateString()
                        format(new Date(award.updatedAt), "dd-MM-yyyy")
                      }
                    </TableCell>
                    <TableCell className="text-left">
                      <TableCell className="text-left">
                        <DropdownMenu>

                          <Button onClick={() => setViewAward(award)} variant="ghost" size="icon">
                            <Eye className="h-4 w-4 mr-2" />
                          </Button>

                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem asChild>

                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {Math.min((currentPage - 1) * pageSize + 1, filteredAwards.length)}–
            {Math.min(currentPage * pageSize, filteredAwards.length)} of{" "}
            {filteredAwards.length}
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}


      <Dialog open={!!viewAward} onOpenChange={() => setViewAward(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Award</DialogTitle>
          </DialogHeader>

          {viewAward && (
            <div className="border rounded-lg p-5 space-y-4">
              <h3 className="font-semibold text-base">Award Details</h3>

              <div className="grid grid-cols-3 gap-y-4 text-sm">
                <div className="text-muted-foreground">Award Title</div>
                <div className="col-span-2 font-medium">
                  {viewAward.title}
                </div>

                <div className="text-muted-foreground">Award Icon</div>
                <div className="col-span-2">
                  <img
                    src={viewAward.iconUrl}
                    alt={viewAward.title}
                    className="h-10 w-10"
                  />
                </div>

                <div className="text-muted-foreground">Summary</div>
                <div className="col-span-2">
                  {viewAward.summary || "--"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

        const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/api/awards`, {
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
        {/* <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" /> Awards
          </h1>
          <p className="text-muted-foreground">
            Manage all employee awards and achievements
          </p>
        </div> */}

        <Link href="/hr/awards/new">
          <Button>
            <Plus className=" h-4 w-4" />
            Add Award
          </Button>
        </Link>
        <div className="gap-8">

          <Link href="/hr/appreciation">
            <Button>
              <Trophy className="h-4 w-4 mr-2" />

            </Button>
          </Link>
          <Link href="/hr/awards" className="ml-2">
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
                      {/* {new Date(award.updatedAt).toLocaleDateString()} */}
 {award.updatedAt
    ? format(new Date(award.updatedAt), "dd-MM-yyyy")
    : "—"}

                    </TableCell>
                    <TableCell className="text-left">
                      <TableCell className="text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem asChild>
                              <Link href={`/hr/awards/${award.id}`}>
                                <div className="flex items-center gap-2">
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </div>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleDelete(award.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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
    </div>
  );
}

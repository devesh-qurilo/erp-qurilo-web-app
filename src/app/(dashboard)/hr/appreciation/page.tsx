"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { MoreVertical, Eye, Pencil, Trash, Trophy } from "lucide-react";
import { Award, Calendar, Search, User, Plus } from "lucide-react";
import Link from "next/link";

interface Appreciation {
  id: number;
  awardId: number;
  awardTitle: string;
  givenToEmployeeId: string;
  givenToEmployeeName: string;
  date: string;
  summary: string;
  photoUrl: string | null;
  photoFileId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export default function AppreciationPage() {
  const [appreciations, setAppreciations] = useState<Appreciation[]>([]);
  const [filteredAppreciations, setFilteredAppreciations] = useState<
    Appreciation[]
  >([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [awardFilter, setAwardFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // active / inactive
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppreciations() {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/appreciations`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        setAppreciations(result);
        setFilteredAppreciations(result);
        setLoading(false);
      } catch (err) {
        setError("Failed to load appreciations");
        setLoading(false);
      }
    }

    fetchAppreciations();
  }, []);

  // APPLY FILTERS
  useEffect(() => {
    let filtered = appreciations;

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((a) =>
        [a.givenToEmployeeName, a.awardTitle, a.summary]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    if (awardFilter) {
      filtered = filtered.filter((a) => a.awardId.toString() === awardFilter);
    }

    if (employeeFilter) {
      filtered = filtered.filter(
        (a) => a.givenToEmployeeId.toString() === employeeFilter
      );
    }

    if (statusFilter === "active")
      filtered = filtered.filter((a) => a.isActive);
    if (statusFilter === "inactive")
      filtered = filtered.filter((a) => !a.isActive);

    if (startDate) {
      filtered = filtered.filter(
        (a) => new Date(a.date) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter((a) => new Date(a.date) <= new Date(endDate));
    }

    setFilteredAppreciations(filtered);
  }, [
    searchTerm,
    awardFilter,
    employeeFilter,
    statusFilter,
    startDate,
    endDate,
    appreciations,
  ]);

  const handleView = (id: number) => {
    window.location.href = `/hr/appreciation/${id}`;
  };

  const handleEdit = (id: number) => {
    window.location.href = `/hr/appreciation/edit/${id}`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this appreciation?")) return;

    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/admin/appreciations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return alert("Failed to delete");
    alert("Deleted");
    setAppreciations((prev) => prev.filter((a) => a.id !== id));
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       Loading...
  //     </div>
  //   );
  // }

  if (error) {
    return <div className="text-center mt-20">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* HEADER */}
        {/* <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
         

          <Link href="/hr/appreciation/new">
            <Button >
              <Plus className="h-4 w-4" />
              Add Appreciation
            </Button>
          </Link>
         
          <div >

            <Link href="/hr/appreciation">
              <Button>
                <Trophy className="h-4 w-4 mr-2" />

              </Button>
              
            </Link>
          
            <Link href="/hr/awards " className="ml-2">
              <Button>
                <Award className="h-4 w-4 mr-2" />

              </Button>
            </Link>
          </div>

        </div> */}





<div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
  {loading ? (
    <>
      <Skeleton width={160} height={40} />
      <div className="flex gap-2">
        <Skeleton width={40} height={40} />
        <Skeleton width={40} height={40} />
      </div>
    </>
  ) : (
    <>
      <Link href="/hr/appreciation/new">
        <Button>
          <Plus className="h-4 w-4" />
          Add Appreciation
        </Button>
      </Link>

      <div>
        <Link href="/hr/appreciation">
          <Button>
            <Trophy className="h-4 w-4 mr-2" />
          </Button>
        </Link>

        <Link href="/hr/awards " className="ml-2">
          <Button>
            <Award className="h-4 w-4 mr-2" />
          </Button>
        </Link>
      </div>
    </>
  )}
</div>






        {/* SEARCH + FILTERS */}
       
<div className="flex justify-end mb-6">

 {loading ? (
    <div className="flex gap-4">
      <Skeleton width={250} height={40} />
      <Skeleton width={100} height={40} />
    </div>
  ) : (

  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">

    {/* SEARCH */}
    <div className="relative">
      <Search className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
      <Input
        className="pl-10 w-64"
        placeholder="Search by name, award, summary..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    {/* FILTER DROPDOWN */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Filters</Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-4 space-y-4"
      >
        {/* Award Filter */}
        <div>
          <label className="text-sm font-medium">Award</label>
          <select
            className="w-full mt-1 p-2 border rounded"
            value={awardFilter}
            onChange={(e) => setAwardFilter(e.target.value)}
          >
            <option value="">All Awards</option>
            {[
              ...new Map(
                appreciations.map((a) => [
                  a.awardId,
                  { id: a.awardId, title: a.awardTitle },
                ])
              ).values(),
            ].map((award) => (
              <option key={award.id} value={award.id}>
                {award.title}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Filter */}
        <div>
          <label className="text-sm font-medium">Employee</label>
          <select
            className="w-full mt-1 p-2 border rounded"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          >
            <option value="">All Employees</option>
            {[
              ...new Map(
                appreciations.map((a) => [
                  a.givenToEmployeeId,
                  {
                    id: a.givenToEmployeeId,
                    name: a.givenToEmployeeName,
                  },
                ])
              ).values(),
            ].map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.id})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full mt-1 p-2 border rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* DATE RANGE */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">From</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">To</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* CLEAR FILTERS */}
        <Button
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
          variant="destructive"
          onClick={() => {
            setAwardFilter("");
            setEmployeeFilter("");
            setStatusFilter("");
            setStartDate("");
            setEndDate("");
          }}
        >
          Clear Filters
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

        )}


</div>





        {/* TABLE */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Award</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>

            {/* <TableBody>
              {filteredAppreciations.map((a) => (






              
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={a.photoUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(a.givenToEmployeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{a.givenToEmployeeName}</div>
                        <div className="text-sm text-muted-foreground">
                          <User className="inline h-3 w-3 mr-1" />
                          {a.givenToEmployeeId}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      <Award className="h-3 w-3 mr-1" />
                      {a.awardTitle}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(a.date)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(a.id)}>
                          <Eye className="h-4 w-4 mr-2" /> View
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => handleEdit(a.id)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleDelete(a.id)}
                          className="text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody> */}



<TableBody>
  {loading ? (
    Array.from({ length: 6 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Skeleton circle width={40} height={40} />
            <div>
              <Skeleton width={120} />
              <Skeleton width={80} height={10} />
            </div>
          </div>
        </TableCell>

        <TableCell>
          <Skeleton width={100} height={25} />
        </TableCell>

        <TableCell>
          <Skeleton width={120} />
        </TableCell>

        <TableCell>
          <Skeleton width={30} height={30} />
        </TableCell>
      </TableRow>
    ))
  ) : filteredAppreciations.length === 0 ? (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-6 text-gray-500">
        No appreciations found
      </TableCell>
    </TableRow>
  ) : (
    filteredAppreciations.map((a) => (
      <TableRow key={a.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={a.photoUrl || undefined} />
              <AvatarFallback>
                {getInitials(a.givenToEmployeeName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div>{a.givenToEmployeeName}</div>
              <div className="text-sm text-muted-foreground">
                <User className="inline h-3 w-3 mr-1" />
                {a.givenToEmployeeId}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <Badge variant="secondary">
            <Award className="h-3 w-3 mr-1" />
            {a.awardTitle}
          </Badge>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(a.date)}
          </div>
        </TableCell>

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(a.id)}>
                <Eye className="h-4 w-4 mr-2" /> View
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleEdit(a.id)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleDelete(a.id)}
                className="text-red-600"
              >
                <Trash className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  )}
</TableBody>


          </Table>
        </Card>
      </div>
    </div>
  );
}

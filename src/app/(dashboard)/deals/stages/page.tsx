"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { Stage } from "@/types/stages";
import type { Deal } from "@/types/deals";
import AddStagePanel from "./_components/add-stages-panel";
import KanbanBoard from "./_components/kanban-board";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Calendar, CalendarIcon, LayoutGrid, SlidersHorizontal, TableIcon } from "lucide-react";
// import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CalendarIcon,
  LayoutGrid,
  TableIcon,
  SlidersHorizontal,
} from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
// import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { FiltersDrawer } from "../get/page";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";




// import { format } from "date-fns";

export default function StagesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [openFilters, setOpenFilters] = useState(false);


  const resolvedFilters = useMemo(
    () => ({
      pipeline: pipelineFilter === "all" ? null : pipelineFilter,
      category: categoryFilter,
    }),
    [pipelineFilter, categoryFilter],
  );



  // 🔥 PASTE HERE

  // Fetch token once on mount
  useEffect(() => {
    const t =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    setToken(t);
  }, []);

  const fetchWithAuth = async (url: string) => {
    if (!token) throw new Error("No access token found. Please log in.");
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
  };

  const {
    data: stagesData = [],
    isLoading: stagesLoading,
    error: stagesError,
    mutate: mutateStages,
  } = useSWR<Stage[]>(token ? "/api/deals/stages" : null, fetchWithAuth);

  const {
    data: dealsData = [],
    isLoading: dealsLoading,
    error: dealsError,
    mutate: mutateDeals,
  } = useSWR<Deal[]>(token ? "/api/deals/get" : null, fetchWithAuth);



  const filteredDeals = useMemo(() => {
    return dealsData.filter((deal) => {
      const matchesPipeline =
        !pipelineFilter ||
        pipelineFilter === "all" ||
        deal.pipeline === pipelineFilter;

      const matchesSearch =
        !search ||
        deal.title?.toLowerCase().includes(search.toLowerCase());

      let matchesDate = true;

      if (dateFrom || dateTo) {
        const dealDate = deal.createdAt
          ? new Date(deal.createdAt)
          : null;

        if (dealDate) {
          if (dateFrom && dealDate < dateFrom) matchesDate = false;
          if (dateTo && dealDate > dateTo) matchesDate = false;
        }
      }

      return matchesPipeline && matchesSearch && matchesDate;
    });
  }, [dealsData, pipelineFilter, search, dateFrom, dateTo]);


  // Combine loading and error states
  const loading = stagesLoading || dealsLoading;
  const error = stagesError?.message || dealsError?.message || null;

  // Compute stageDeals using memoization
  const stageDeals = useMemo(() => {
    return stagesData.map((stage) => ({
      ...stage,
      deals: dealsData.filter((deal) => deal.dealStage === stage.name),
    }));
  }, [stagesData, dealsData]);


  // ✅ ADD HERE
  const pipelines = useMemo(() => {
    const unique = new Set<string>();
    dealsData.forEach((deal) => {
      if (deal.pipeline) unique.add(deal.pipeline);
    });
    return Array.from(unique);
  }, [dealsData]);


  //  if (loading) {
  //      return (
  //       <div className="flex justify-center items-center min-h-screen text-lg font-semibold">
  //         Loading stages and deals...
  //       </div>
  //     );
  //   }





  if (loading) {
    return (
      <main className="container h-screen flex flex-col overflow-hidden p-4 space-y-4">

        {/* Top Filters */}
        <div className="flex justify-between items-center">
          <Skeleton width={250} height={30} />
          <Skeleton width={120} height={30} />
        </div>

        {/* Board */}
        <div className="flex gap-4 overflow-x-auto">

          {[...Array(4)].map((_, col) => (
            <div
              key={col}
              className="min-w-[280px] bg-white border rounded-lg p-3 space-y-3"
            >
              {/* Column Header */}
              <Skeleton width={120} height={20} />

              {/* Cards */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-3 border rounded-md space-y-2">
                  <Skeleton height={15} />
                  <Skeleton width={100} height={12} />
                  <Skeleton width={80} height={12} />
                </div>
              ))}
            </div>
          ))}

        </div>

      </main>
    );
  }



  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold text-red-600">
        {error}
      </div>
    );
  }

  return (
    <main className="container h-screen flex flex-col overflow-hidden">



      <div className="mb-4 rounded-md  bg-white py-2 px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="text-xs text-muted-foreground">Duration</div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-sm"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Start Date to End Date
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[320px] p-4 z-50" align="start">
              <div className="space-y-4">
                <div className="text-sm  font-medium">Select Duration</div>

                {/* START DATE */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Start Date</div>
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
                    <PopoverContent className="p-0 z-50" align="start">
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
                  <div className="text-xs text-muted-foreground">End Date</div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between font-normal"
                        disabled={!dateFrom}
                      >
                        {dateTo
                          ? format(dateTo, "dd-MM-yyyy")
                          : "dd-mm-yyyy"}
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
                  {/* <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Partnerships">Partnerships</SelectItem> */}

                  <SelectItem value="Default Pipeline">Default Pipeline</SelectItem>
                  <SelectItem value="Sales Pipeline">Sales Pipeline</SelectItem>
                  <SelectItem value="Enterprise Pipeline">Enterprise Pipeline</SelectItem>
                  <SelectItem value="Client Success Pipeline">Client Success Pipeline</SelectItem>
                  <SelectItem value="Finance Pipeline">Finance Pipeline</SelectItem>
                  <SelectItem value="Marketing Pipeline">Marketing Pipeline</SelectItem>


                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">

        </div>
      </div>


      {openFilters && (

        <FiltersDrawer
          open={openFilters}
          onClose={() => setOpenFilters(false)}

          stages={stagesData.map((s) => s.name)}   // ✅ correct
          deals={filteredDeals}
          priorities={[]}                          // ✅ since not fetched here

          dateFilterOn="created"
          setDateFilterOn={() => { }}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          dealStageFilter="all"
          setDealStageFilter={() => { }}
          minValue=""
          setMinValue={() => { }}
          maxValue=""
          setMaxValue={() => { }}
          agentFilter="all"
          setAgentFilter={() => { }}
          watcherFilter="all"
          setWatcherFilter={() => { }}
          leadFilter="all"
          setLeadFilter={() => { }}
          tagFilter="all"
          setTagFilter={() => { }}
          priorityFilter="all"
          setPriorityFilter={() => { }}
        />



      )}


      <div className="flex flex-col min-h-screen  overflow-x-hidden">


        {/* //   <div className="flex flex-col flex-1 overflow-hidden"> */}
        <div className="flex flex-col flex-1 p-4 w-full">
          <header className="shrink-0 mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* <h1 className="text-3xl font-bold text-foreground text-balance">Deals – Kanban </h1> */}
            <div className="flex items-center gap-2 flex-wrap">

              <AddStagePanel
                onCreated={async () => {
                  await mutateStages();
                }}
                getToken={() => token}
              />
              <Button asChild className="rounded-md bg-blue-600 px-3 py-3 text-sm text-white hover:opacity-95">
                <Link href="/deals/create">+ Add Deals</Link>
              </Button>
            </div>
            {/* View Toggle */}
            <div className="mb-4 flex justify-end">
              <Tabs className="w-auto" defaultValue="table">
                <TabsList>
                  <TabsTrigger value="table" asChild>
                    <Link href="/deals/get" className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4" />
                    </Link>
                  </TabsTrigger>

                  <TabsTrigger value="kanban" asChild>
                    <Link
                      href="/deals/stages"
                      className="flex items-center gap-2"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </header>

          <main className="flex-1 min-h-0 overflow-auto">
            <KanbanBoard
              stages={stagesData}
              deals={filteredDeals}
              search={search}
              filters={resolvedFilters}
            />
          </main>
        </div>






      </div>
    </main>
  );
}

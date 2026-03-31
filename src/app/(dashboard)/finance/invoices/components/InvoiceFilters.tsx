"use client";
import { useState } from "react";
import InvoiceFiltersDrawer from "./InvoiceFiltersDrawer";

import { Search, SlidersHorizontal } from "lucide-react";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function InvoiceFilters({ filters, setFilters, invoices }) {

    const projectList = ["All", ...new Set(invoices.map(i => i.project?.projectName).filter(Boolean))];
    const clientList = ["All", ...new Set(invoices.map(i => i.client?.name).filter(Boolean))];
    const statusList = ["All", ...new Set(invoices.map(i => i.status).filter(Boolean))];

    const [openFilters, setOpenFilters] = useState(false);


    return (
        
        <div className="border rounded-md bg-white px-2 py-2 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-1">

                {/* Date Range */}
                <div className="flex gap-1 items-center  rounded px-2 py-2 bg-white">
                    <span className="text-sm text-gray-600">Duration</span>

                    <input
                        type="date"
                        className="text-sm border rounded px-2 py-1"
                        value={filters.startDate}
                        onChange={(e) => setFilters(p => ({ ...p, startDate: e.target.value }))}
                    />

                    <span className="text-sm text-gray-400">to</span>

                    <input
                        type="date"
                        className="text-sm border rounded px-2 py-1"
                        value={filters.endDate}
                        onChange={(e) => setFilters(p => ({ ...p, endDate: e.target.value }))}
                    />
                </div>

                {/* Client */}
                 <h3>Clients</h3>
                <Select value={filters.client} onValueChange={(v) => setFilters(f => ({ ...f, client: v }))}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Client" />
                    </SelectTrigger>
                   
                    <SelectContent>
                        {clientList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>

                {/* Project */}
                {/* <h3>Projects</h3>
                <Select value={filters.project} onValueChange={(v) => setFilters(f => ({ ...f, project: v }))}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                        {projectList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select> */}

                {/* Status */}
                {/* <h3>Status</h3>
                <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select> */}

                {/* Search */}
                <div className="relative">
                    <Search className="w-3 h-4 absolute left-2 top-2 text-gray-400" />
                    <Input
                        placeholder="Search invoice / project / client"
                        className="pl-8 w-[200px]"
                        value={filters.search}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                    />
                </div>
            </div>

            {/* <Button variant="outline" className="flex items-center gap-1">
                <SlidersHorizontal className="h-4 w-4" /> Filters 
            </Button> */}



<Button
  variant="outline"
  className="flex items-center gap-1"
  onClick={() => setOpenFilters(true)}
>
  <SlidersHorizontal className="h-4 w-4" /> Filters
</Button>

<InvoiceFiltersDrawer
  open={openFilters}
  onClose={() => setOpenFilters(false)}
  filters={filters}
  setFilters={setFilters}
  invoices={invoices}
/>


        </div>
    );
}

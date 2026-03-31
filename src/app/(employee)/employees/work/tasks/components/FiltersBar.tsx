"use client";

import React from "react";
import { Calendar, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export type TaskStageName =
    | "Waiting"
    | "Doing"
    | "Completed"
    | "Approval"
    | string;

export interface DateRangeFilter {
    start?: string | null;
    end?: string | null;
}

interface FiltersBarProps {
    status: TaskStageName | "All";
    onStatusChange: (v: TaskStageName | "All") => void;

    dateRange: DateRangeFilter;
    onDateRangeChange: (v: DateRangeFilter) => void;
      onOpenFilters: () => void; // 👈 ADD THIS

}

export const FiltersBar: React.FC<FiltersBarProps> = ({
    status,
    onStatusChange,
    dateRange,
    onDateRangeChange ,
      onOpenFilters, // 👈 ADD THIS

}) => {
    return (
        <div className="flex flex-wrap items-center gap-4">

            {/* Duration Filter */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="flex h-10 items-center gap-2 rounded-xl border-slate-300 bg-white px-4 text-sm font-normal text-slate-700 shadow-sm"
                    >
                        <Calendar size={16} />
                        {dateRange.start && dateRange.end
                            ? `${dateRange.start} → ${dateRange.end}`
                            : "Duration  Start Date to End Date"}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-80 rounded-xl border bg-white p-4 shadow">
                    <h2 className="mb-3 text-sm font-medium text-slate-700">
                        Select Duration
                    </h2>

                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="text-xs text-slate-500">Start Date</label>
                            <Input
                                type="date"
                                value={dateRange.start ?? ""}
                                onChange={(e) =>
                                    onDateRangeChange({
                                        ...dateRange,
                                        start: e.target.value
                                    })
                                }
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500">End Date</label>
                            <Input
                                type="date"
                                value={dateRange.end ?? ""}
                                onChange={(e) =>
                                    onDateRangeChange({
                                        ...dateRange,
                                        end: e.target.value
                                    })
                                }
                                className="mt-1"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="rounded-lg"
                                onClick={() => onDateRangeChange({ start: null, end: null })}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select
                value={status}
                onValueChange={(v) => onStatusChange(v as TaskStageName | "All")}
            >
                <SelectTrigger className="w-40 rounded-xl border-slate-300 bg-white shadow-sm h-10">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Waiting">Waiting</SelectItem>
                    <SelectItem value="Doing">Doing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Approval">Approval</SelectItem>
                </SelectContent>
            </Select>

            {/* Filters Icon Button */}
            {/* <Button 
            
                variant="outline"
                className="ml-auto flex h-10 items-center gap-2 rounded-xl border-slate-300 bg-white px-4 shadow-sm"
            >
                <SlidersHorizontal size={16} />
                Filters 
            </Button> */}


{/* Filters Drawer Button */}
            <Button
                variant="outline"
                className="ml-auto h-10 rounded-xl"
                onClick={onOpenFilters}
            >
                <SlidersHorizontal size={16} />
                Filters
            </Button>



        </div>
    );
};

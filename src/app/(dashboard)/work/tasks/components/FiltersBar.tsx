
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

    onOpenFilters: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
    status,
    onStatusChange,
    dateRange,
    onDateRangeChange,
    onOpenFilters,
}) => {
    return (
        <div className="flex flex-wrap items-center gap-4">

            {/* Duration */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 rounded-xl">
                        <Calendar size={16} />
                        {dateRange.start && dateRange.end
                            ? `${dateRange.start} → ${dateRange.end}`
                            : "Duration"}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-80 p-4">
                    <div className="space-y-3">
                        <Input
                            type="date"
                            value={dateRange.start ?? ""}
                            onChange={(e) =>
                                onDateRangeChange({ ...dateRange, start: e.target.value })
                            }
                        />
                        <Input
                            type="date"
                            value={dateRange.end ?? ""}
                            onChange={(e) =>
                                onDateRangeChange({ ...dateRange, end: e.target.value })
                            }
                        />
                        <Button
                            variant="outline"
                            onClick={() => onDateRangeChange({ start: null, end: null })}
                        >
                            Reset
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Status */}
            <Select value={status} onValueChange={(v) => onStatusChange(v as any)}>
                <SelectTrigger className="w-40 h-10 rounded-xl">
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


import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";

type FiltersSectionProps = {
  employeeFilter: string;
  setEmployeeFilter: (value: string) => void;

  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;

  employeeOptions: string[];
  getEmployeeLabel: (id: string) => string;

  onOpenFiltersDrawer: () => void;
};

const FiltersSection: React.FC<FiltersSectionProps> = ({
  employeeFilter,
  setEmployeeFilter,

  startDate,
  endDate,
  setStartDate,
  setEndDate,

  employeeOptions,
  getEmployeeLabel,
  onOpenFiltersDrawer,
}) => {
  return (
    <div className="bg-white rounded-lg border p-3 mb-4 flex flex-wrap items-center gap-4">

      {/* Duration filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Duration</span>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-8 w-40"
            />
          </div>

          <span className="text-gray-500 text-sm">to</span>

          <div className="relative">
            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-8 w-40"
            />
          </div>
        </div>
      </div>

      {/* Employee filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Employee</span>

        <Select
          value={employeeFilter}
          onValueChange={(v) => setEmployeeFilter(v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {employeeOptions.slice(1).map((e) => (
              <SelectItem key={e} value={e}>
                {getEmployeeLabel(e)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* More filters */}
      <div className="ml-auto">
        <button
          onClick={onOpenFiltersDrawer}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <Search className="w-4 h-4" />
          Filters 
        </button>
      </div>
    </div>
  );
};

export default FiltersSection;






 


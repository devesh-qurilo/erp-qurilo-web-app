import React from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

type FiltersSectionProps = {
    employeeFilter: string;
    setEmployeeFilter: (value: string) => void;
    employeeOptions: string[];
    getEmployeeLabel: (id: string) => string;
    onOpenFiltersDrawer: () => void;
};

const FiltersSection: React.FC<FiltersSectionProps> = ({
    employeeFilter,
    setEmployeeFilter,
    employeeOptions,
    getEmployeeLabel,
    onOpenFiltersDrawer,
}) => {
    return (
        <div className="bg-white rounded-lg border p-3 mb-4 flex items-center gap-4">
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Duration</span>
                <Input placeholder="Start Date to End Date" className="w-64" />
            </div>

            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Employee</span>
                <Select
                    value={employeeFilter}
                    onValueChange={(v) => setEmployeeFilter(v)}
                >
                    <SelectTrigger className="w-40">
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

            <div className="ml-auto flex items-center gap-4">
                <button
                    onClick={onOpenFiltersDrawer}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                    <Search className="w-4 h-4" /> Filters
                </button>
            </div>
        </div>
    );
};

export default FiltersSection;


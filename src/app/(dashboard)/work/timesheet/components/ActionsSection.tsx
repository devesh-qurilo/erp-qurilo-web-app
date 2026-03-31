import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, List, Calendar, User } from "lucide-react";

export type ViewMode = "table" | "list" | "calendar" | "weekly" | "TimesheetSummary";

type ActionsSectionProps = {
    searchInput: string;
    setSearchInput: (v: string) => void;
    setSearchQuery: (v: string) => void;
    setCurrentPage: (updater: (prev: number) => number) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    showCalendarModal: boolean;
    setShowCalendarModal: (value: boolean) => void;
    openLogForm: () => void;
};

const ActionsSection: React.FC<ActionsSectionProps> = ({
    searchInput,
    setSearchInput,
    setSearchQuery,
    setCurrentPage,
    viewMode,
    setViewMode,
    showCalendarModal,
    setShowCalendarModal,
    openLogForm,
}) => {
    return (
        <div className="flex items-center justify-between mb-4">
            {/* <div>
                <Button className="bg-blue-600 text-white" onClick={openLogForm}>
                    + Log Time
                </Button>
            </div> */}


                    {viewMode === "weekly"  ?<h1 className="text-xl font-semibold">Weekly Timesheet</h1>:<div>
                <Button className="bg-blue-600 text-white" onClick={openLogForm}>
                    + Log Time
                </Button>
            </div>
}



            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border rounded px-2 py-1 bg-white">
                    <Search className="w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setSearchQuery(searchInput);
                                setCurrentPage(() => 1);
                            }
                        }}
                        className="border-0 bg-transparent focus-visible:ring-0"
                    />
                </div>

                <div className="flex items-center bg-white border rounded-lg overflow-hidden">
                    <button
                        onClick={() => {
                            const el = document.querySelector(
                                'input[placeholder="Search"]'
                            ) as HTMLInputElement | null;
                            if (el) el.focus();
                        }}
                        className="px-3 py-2 hover:bg-gray-50"
                        title="Search"
                    >
                        <Search className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => setViewMode("list")}
                        className={`px-3 py-2 hover:bg-gray-50 ${viewMode === "list" ? "bg-gray-100" : ""
                            }`}
                        title="List view"
                    >
                        <List className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => {
                            setViewMode("weekly");
                        }}
                        aria-pressed={viewMode === "weekly"}
                        title="Weekly calendar"
                        className={`relative px-3 py-2 hover:bg-gray-50 ${viewMode === "weekly" ? "bg-violet-600 text-white" : ""
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        <span
                            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold leading-none
                ${viewMode === "weekly"
                                    ? "bg-white text-violet-600"
                                    : "bg-violet-600 text-white"
                                }`}
                            aria-hidden="true"
                        >
                            7
                        </span>
                    </button>

                    <button
                        onClick={() => setShowCalendarModal(true)}
                        className={`px-3 py-2 hover:bg-gray-50 ${showCalendarModal ? "ring-2 ring-indigo-300" : ""
                            }`}
                        title="Open calendar view"
                    >
                        <Calendar className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* <button
                        onClick={() => {
                            // future: user menu
                           // console.log("User icon clicked");
                        }}
                        className="px-3 py-2 hover:bg-gray-50"
                        title="User"
                    >
                        <User className="w-4 h-4 text-gray-600" />
                    </button> */}
                    <button
                        onClick={() => setViewMode("TimesheetSummary")}
                        className={`px-3 py-2 hover:bg-gray-50 ${viewMode === "TimesheetSummary" ? "bg-violet-600 text-white" : ""
                            }`}
                        title="User"
                    >
                        <User className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionsSection;

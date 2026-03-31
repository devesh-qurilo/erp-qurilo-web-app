"use client";

import TaskStatistics from "./TaskStatistics";
import TasksTable from "../../components/TasksTable";

export default function OverviewSection({ project, metrics }: any) {
    return (
        <div className="space-y-6">

            {/* SUMMARY */}
            <div className="border rounded-xl p-6">
                <h3 className="text-lg font-medium mb-2">Project Summary</h3>
                <p className="text-sm text-gray-600">
                    {project.summary || "No summary available"}
                </p>
            </div>

            {/* STATS */}
            <div className="border rounded-xl p-6">
                <h3 className="text-lg font-medium mb-4">Task Statistics</h3>
                <TaskStatistics projectId={project.id} />
            </div>

            {/* TASK TABLE */}
            <div className="border rounded-xl p-4">
                <TasksTable projectId={project.id} />
            </div>
        </div>
    );
}

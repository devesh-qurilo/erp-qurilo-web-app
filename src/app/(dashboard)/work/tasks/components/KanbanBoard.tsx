"use client";

import React, { useMemo } from "react";
import { Task } from "../page";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
    tasks: Task[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks }) => {
    // Group tasks by stage name
    const grouped = useMemo(() => {
        const map: { [stage: string]: Task[] } = {};

        tasks.forEach((task) => {
            const stage = task.taskStage?.name || "Unassigned";
            if (!map[stage]) map[stage] = [];
            map[stage].push(task);
        });

        return map;
    }, [tasks]);

    const stagesOrdered = ["Waiting", "Doing", "Approval", "Completed"];

    return (
        <div className="flex w-full gap-4 overflow-x-auto pb-4">
            {stagesOrdered.map((stage) => (
                <KanbanColumn
                    key={stage}
                    title={stage}
                    color={tasks.find((t) => t.taskStage?.name === stage)?.taskStage?.labelColor}
                    tasks={grouped[stage] ?? []}
                />
            ))}

            {/* Render any extra dynamic columns */}
            {Object.keys(grouped)
                .filter((s) => !stagesOrdered.includes(s))
                .map((dynamicStage) => (
                    <KanbanColumn
                        key={dynamicStage}
                        title={dynamicStage}
                        color={grouped[dynamicStage][0]?.taskStage?.labelColor}
                        tasks={grouped[dynamicStage]}
                    />
                ))}
        </div>
    );
};

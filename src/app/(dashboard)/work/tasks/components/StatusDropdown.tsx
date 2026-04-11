"use client";

import React, { useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    changeTaskStage,
    fetchTaskStages,
    getStoredAccessToken,
    type TaskStageRecord,
} from "../api";

interface StatusDropdownProps {
    task: {
        id: number;
        taskStage?: {
            id?: number;
            name?: string;
            labelColor?: string | null;
        } | null;
    };
    onUpdated?: () => void;
}

export default function StatusDropdown({ task, onUpdated }: StatusDropdownProps) {
    const [stages, setStages] = useState<TaskStageRecord[]>([]);
    const [current, setCurrent] = useState(task.taskStage);
    const [loading, setLoading] = useState(false);

    // -------- Fetch all Stages --------
    const fetchStages = async () => {
        try {
            const token = getStoredAccessToken();
            if (!token) return;
            const data = await fetchTaskStages(token);
            setStages(data);
        } catch (err) {
            console.error("Stage fetch error:", err);
        }
    };

    useEffect(() => {
        fetchStages();
    }, []);

    useEffect(() => {
        setCurrent(task.taskStage);
    }, [task.taskStage]);

    // -------- Update Stage (PATCH) --------
    const updateStatus = async (stageId: string) => {
        try {
            setLoading(true);
            const token = getStoredAccessToken();
            if (!token) {
                throw new Error("Not authenticated");
            }

            await changeTaskStage(token, task.id, Number(stageId));

            const newStage = stages.find((s) => String(s.id) === stageId);
            setCurrent(newStage);
            onUpdated?.();

        } catch (err) {
            console.error("Update error:", err);
            alert("Failed to update status");
        } finally {
            setLoading(false);
        }
    };



    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex w-fit items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    disabled={loading}
                >
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: current?.labelColor }}
                    />
                    {loading ? "Updating..." : current?.name}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-40">
                {stages.map((stage) => (
                    <DropdownMenuItem
                        key={stage.id}
                        onClick={() => updateStatus(String(stage.id))}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: stage.labelColor }}
                        />
                        {stage.name}{stage.id}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

"use client";

import React, { useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function StatusDropdown({ task }) {
    const MAIN = process.env.NEXT_PUBLIC_MAIN;
    const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null

    const [stages, setStages] = useState([]);
    const [current, setCurrent] = useState(task.taskStage);
    const [loading, setLoading] = useState(false);

    // -------- Fetch all Stages --------
    const fetchStages = async () => {
        try {
            const res = await fetch(`${MAIN}/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setStages(data);
        } catch (err) {
            console.error("Stage fetch error:", err);
        }
    };

    useEffect(() => {
        fetchStages();
    }, []);

    // -------- Update Stage (PATCH) --------
    const updateStatus = async (stageId: string) => {
        try {
            setLoading(true);

            const url = `${MAIN}/api/projects/tasks/${task.id}/status?statusId=${stageId}`;


            const res = await fetch(url, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Length": "0"      // SUPER IMPORTANT
                }
            });

            if (!res.ok) {
                const msg = await res.text();
                console.error("Backend says:", msg);
                throw new Error("Failed to update stage");
            }

            const updated = await res.json();

            const newStage = stages.find((s) => String(s.id) === stageId);
            setCurrent(newStage);

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

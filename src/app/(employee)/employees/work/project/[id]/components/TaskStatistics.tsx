"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";


const MAIN = `${process.env.NEXT_PUBLIC_MAIN}`;

type StatusItem = {
    id: number;
    name: string;
    labelColor?: string | null;
};

type TaskItem = {
    id: number;
    taskStageId?: number | null;
    taskStage?: { id?: number; name?: string } | null;
};

const normalizeLabelColor = (raw?: string | null) => {
    if (!raw) return null;
    const hex = String(raw).replace(/[^0-9a-fA-F]/g, "");
    return hex.length >= 6 ? `#${hex.slice(0, 6)}` : null;
};

const nameColorFallback = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("complete")) return "#10b981";
    if (n.includes("todo")) return "#f59e0b";
    if (n.includes("doing")) return "#2563eb";
    return "#6b7280";
};

export default function TaskStatistics({
    projectId,
}: {
    projectId: number;
}) {
    const [statuses, setStatuses] = useState<StatusItem[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("accessToken") || "";

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [sRes, tRes] = await Promise.all([
                    axios.get(`${MAIN}/status`, {
                        headers: { Authorization: token ? `Bearer ${token}` : "" },
                    }),
                    axios.get(`${MAIN}/projects/${projectId}/tasks`, {
                        headers: { Authorization: token ? `Bearer ${token}` : "" },
                    }),
                ]);

                setStatuses(sRes.data || []);
                setTasks(tRes.data || []);
            } catch (err) {
                console.error("TaskStatistics error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [projectId, token]);

    const counts = useMemo(() => {
        const map = new Map<number, number>();
        statuses.forEach((s) => map.set(s.id, 0));

        tasks.forEach((t) => {
            if (t.taskStageId && map.has(t.taskStageId)) {
                map.set(t.taskStageId, (map.get(t.taskStageId) || 0) + 1);
            }
        });

        return statuses.map((s) => ({
            ...s,
            count: map.get(s.id) || 0,
        }));
    }, [statuses, tasks]);

    if (loading) return <p className="text-sm text-gray-400">Loading stats…</p>;

    return (
        <ul className="space-y-2">
            {counts.map((c) => (
                <li key={c.id} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-sm"
                            style={{
                                background:
                                    normalizeLabelColor(c.labelColor) ||
                                    nameColorFallback(c.name),
                            }}
                        />
                        {c.name}
                    </span>
                    <span className="text-gray-500">{c.count}</span>
                </li>
            ))}
        </ul>
    );
}

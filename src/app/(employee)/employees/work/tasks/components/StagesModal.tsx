"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Loader2, Plus } from "lucide-react";

interface Stage {
    id: number;
    name: string;
    position: number;
    labelColor: string | null;
}

interface StagesModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}

export const StagesModal: React.FC<StagesModalProps> = ({
    open,
    onOpenChange,
}) => {
    const API = process.env.NEXT_PUBLIC_MAIN;

    const [loading, setLoading] = useState(false);
    const [stages, setStages] = useState<Stage[]>([]);

    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [position, setPosition] = useState("");
    const [labelColor, setLabelColor] = useState("#000000");

    const resetForm = () => {
        setEditId(null);
        setName("");
        setPosition("");
        setLabelColor("#000000");
    };

    // ---------------- LOAD STAGES ----------------
    const fetchStages = async () => {
        try {
            const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null
            const res = await fetch(`${API}/status`, {
                // TODO: yaha pe agar token chahiye ho to header add karna
                headers: { Authorization: `Bearer ${token}` },
                // credentials: "include",
            });
            const data = await res.json();
            setStages(data);
        } catch (err) {
            console.error("Failed to load stages", err);
        }
    };

    useEffect(() => {
        if (open) fetchStages();
    }, [open]);

    // ---------------- SAVE (ADD / UPDATE) ----------------
    const handleSave = async () => {
        try {
            const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null
            setLoading(true);

            const body = {
                name,
                position: Number(position),
                labelColor,
            };

            const method = editId ? "PUT" : "POST";
            const url = editId
                ? `${API}/status/${editId}`
                : `${API}/status`;
          
            const res = await fetch(url, {
                method,
                // TODO: yaha pe agar token chahiye ho to header add karna
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                // credentials: "include",

                body: JSON.stringify(body),
            });

            if (!res.ok) {
                throw new Error("Failed");
            }

            resetForm();
            fetchStages();
        } catch (err) {
            alert("Operation failed");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ---------------- DELETE ----------------
    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this stage?")) return;

        try {
            setLoading(true);

            const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null

            const res = await fetch(`${API}/status/${id}`, {
                method: "DELETE",
                // TODO: yaha pe agar token chahiye ho to header add karna
                headers: { Authorization: `Bearer ${token}` },
                // credentials: "include",

            });

            if (!res.ok) throw new Error("Failed");

            fetchStages();
        } catch (err) {
            alert("Delete failed");
        } finally {
            setLoading(false);
        }
    };

    // ---------------- EDIT MODE ----------------
    const startEdit = (stage: Stage) => {
        setEditId(stage.id);
        setName(stage.name);
        setPosition(String(stage.position));
        setLabelColor(stage.labelColor || "#000000");
    };

    // ---------------- UI ----------------

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        Task Stages
                    </DialogTitle>
                </DialogHeader>

                {/* FORM */}
                <div className="space-y-4">
                    <div>
                        <Label>Name</Label>
                        <Input
                            placeholder="Stage Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Position</Label>
                        <Input
                            placeholder="Position"
                            type="number"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>Label Color</Label>
                        <Input
                            type="color"
                            className="h-10 w-20 p-1"
                            value={labelColor}
                            onChange={(e) => setLabelColor(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={loading || !name || !position}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 text-white"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editId ? (
                            "Update Stage"
                        ) : (
                            <>
                                <Plus size={16} /> Add Stage
                            </>
                        )}
                    </Button>

                    <hr className="my-3" />

                    {/* STAGES LIST */}
                    <div className="space-y-3">
                        {stages.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className="h-4 w-4 rounded-full"
                                        style={{ background: s.labelColor }}
                                    ></span>

                                    <div>
                                        <p className="font-medium">{s.name}</p>
                                        <p className="text-xs text-slate-500">
                                            Position: {s.position}
                                        </p>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => startEdit(s)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <Pencil size={18} />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

"use client";

import { X } from "lucide-react";
import { useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_MAIN!;

export default function CreateCreditNoteDrawer({
    open,
    onClose,
    invoiceNumber,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    invoiceNumber?: string;
    onCreated: () => void;
}) {
    const [form, setForm] = useState({
        creditNoteNumber: "",
        creditNoteDate: "",
        currency: "USD",
        adjustment: "",
        adjustmentPositive: false,
        tax: "",
        amount: "",
        notes: "",
    });

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async () => {
        if (!invoiceNumber) return;

        const fd = new FormData();
        fd.append(
            "creditNote",
            JSON.stringify({
                ...form,
                adjustment: Number(form.adjustment),
                tax: Number(form.tax),
                amount: Number(form.amount),
            })
        );
        if (file) fd.append("file", file);

        setLoading(true);
        try {

            console.log("SUBMIT Credit Note:", fd);
            await fetch(
                `${BASE_URL}/api/invoices/${invoiceNumber}/credit-notes`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                    body: fd,
                }
            );

            onCreated();
            onClose();
        } catch (e) {
            alert("Failed to create credit note");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[30000]">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="absolute right-0 top-0 h-full w-[83vw] bg-white shadow-xl transition-all">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">
                        Create Credit Note  — {invoiceNumber}
                    </h3>
                    <button onClick={onClose}><X /></button>
                </div>

                <div className="p-6 grid grid-cols-3 gap-4">
                    {[
                        ["Credit Note No", "creditNoteNumber"],
                        ["Date", "creditNoteDate", "date"],
                        ["Currency", "currency"],
                        ["Adjustment", "adjustment"],
                        ["Tax", "tax"],
                        ["Amount", "amount"],
                    ].map(([label, key, type]) => (
                        <div key={key}>
                            <label className="text-sm">{label}</label>
                            <input
                                type={type || "text"}
                                className="w-full border px-3 py-2 rounded"
                                value={(form as any)[key]}
                                onChange={e =>
                                    setForm(f => ({ ...f, [key]: e.target.value }))
                                }
                            />
                        </div>
                    ))}

                    <div className="col-span-3">
                        <label className="text-sm">Notes</label>
                        <textarea
                            className="w-full border rounded p-3"
                            rows={3}
                            onChange={e =>
                                setForm(f => ({ ...f, notes: e.target.value }))
                            }
                        />
                    </div>

                    <div className="col-span-3">
                        <label className="text-sm">Upload File</label>
                        <input
                            type="file"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                        />
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="border px-4 py-2 rounded">
                        Cancel
                    </button>
                    <button
                        disabled={loading}
                        onClick={handleSubmit}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}

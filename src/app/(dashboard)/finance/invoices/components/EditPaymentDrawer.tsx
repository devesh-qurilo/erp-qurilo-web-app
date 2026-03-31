"use client";

import { useState } from "react";
import { X } from "lucide-react";

const BASE_URL =
    process.env.NEXT_PUBLIC_MAIN ;

export default function EditPaymentDrawer({
    open,
    onClose,
    payment,
    onUpdated,
}: {
    open: boolean;
    onClose: () => void;
    payment: any;
    onUpdated: () => void;
}) {
    const [form, setForm] = useState({
        amount: payment?.amount ?? "",
        currency: payment?.currency ?? "USD",
        transactionId: payment?.transactionId ?? "",
        paymentGatewayId: payment?.paymentGateway?.id ?? "",
        status: payment?.status ?? "COMPLETED",
        notes: payment?.note ?? "",
    });

    if (!open || !payment) return null;

    const save = async () => {
        await fetch(`${BASE_URL}/api/payments/${payment.id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });

        onUpdated();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[30000]">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div
                className="absolute top-0 right-0 h-full bg-white shadow-2xl"
                style={{ width: "83vw" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold">Edit Payment</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                        <X />
                    </button>
                </div>

                {/* FORM */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <Input label="Amount" value={form.amount}
                        onChange={(v) => setForm({ ...form, amount: v })} />

                    <Input label="Transaction ID" value={form.transactionId}
                        onChange={(v) => setForm({ ...form, transactionId: v })} />

                    <Input label="Gateway ID" value={form.paymentGatewayId}
                        onChange={(v) => setForm({ ...form, paymentGatewayId: v })} />

                    <select
                        className="border rounded px-3 py-2"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="PENDING">PENDING</option>
                    </select>

                    <textarea
                        className="col-span-2 border rounded px-3 py-2"
                        placeholder="Notes"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />

                    <div className="col-span-2 text-right">
                        <button
                            onClick={save}
                            className="px-6 py-2 bg-blue-600 text-white rounded"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Input = ({ label, value, onChange }: any) => (
    <div>
        <label className="text-sm text-gray-500">{label}</label>
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border rounded px-3 py-2"
        />
    </div>
);

"use client";

import { X } from "lucide-react";

export default function ViewPaymentDrawer({
    open,
    onClose,
    payment,
}: {
    open: boolean;
    onClose: () => void;
    payment: any;
}) {
    if (!open || !payment) return null;

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
                    <h2 className="text-xl font-semibold">View Payment</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                        <X />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-4 text-sm">
                    <Info label="Amount" value={`${payment.currency} ${payment.amount}`} />
                    <Info label="Transaction ID" value={payment.transactionId} />
                    <Info label="Gateway" value={payment.paymentGateway?.name} />
                    <Info label="Status" value={payment.status} />
                    <Info
                        label="Payment Date"
                        value={new Date(payment.paymentDate).toLocaleDateString("en-GB")}
                    />
                    <Info label="Notes" value={payment.note ?? "--"} />
                </div>
            </div>
        </div>
    );
}

const Info = ({ label, value }: { label: string; value?: string }) => (
    <div>
        <div className="text-gray-500">{label}</div>
        <div className="font-medium">{value ?? "--"}</div>
    </div>
);

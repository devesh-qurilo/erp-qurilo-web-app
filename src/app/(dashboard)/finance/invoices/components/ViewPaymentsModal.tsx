

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    X,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
} from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ViewPaymentDrawer from "./ViewPaymentDrawer";
import EditPaymentDrawer from "./EditPaymentDrawer";

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

export default function ViewPaymentsDrawer({
    open,
    onClose,
    invoiceNumber,
}: {
    open: boolean;
    onClose: () => void;
    invoiceNumber?: string;
}) {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewPayment, setViewPayment] = useState<any>(null);
    const [editPayment, setEditPayment] = useState<any>(null);


    useEffect(() => {
        if (!open || !invoiceNumber) return;

        const fetchPayments = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${BASE_URL}/api/payments/invoice/${invoiceNumber}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        },
                    }
                );
                const data = await res.json();
                setPayments(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setPayments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [open, invoiceNumber]);



// console.log(payments)

    if (!open) return null;

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${BASE_URL}/api/payments/invoice/${invoiceNumber}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            const data = await res.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 z-[20000]">
            {/* BACKDROP */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />

            {/* DRAWER */}
            <div
                className="
          absolute top-0 right-0 h-full bg-white
          shadow-2xl transition-transform duration-300
          translate-x-0
        "
                style={{ width: "83vw" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold">
                        Payments —{invoiceNumber}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 overflow-y-auto h-[calc(100vh-64px)]">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">
                            Loading payments…
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No payments found
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            {/* TABLE HEADER */}
                            <div className="bg-[#e8f3ff] px-4 py-3 flex text-sm font-medium">
                                <div className="w-2/12">Project</div>
                                <div className="w-2/12">Client</div>
                                <div className="w-2/12">Amount</div>
                                <div className="w-2/12">Gateway</div>
                                <div className="w-2/12">Paid On</div>
                                <div className="w-1/12">Status</div>
                                <div className="w-10 text-center">Action</div>
                            </div>

                            {/* ROWS */}
                            {payments.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center px-4 py-3 border-t text-sm"
                                >
                                    <div className="w-2/12">
                                        {p.projectId ?? "--"}
                                    </div>

                                    <div className="w-2/12 flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-full overflow-hidden bg-gray-100 relative">
                                            {p.client?.profilePictureUrl ? (
                                                <Image
                                                    src={p.client.profilePictureUrl}
                                                    alt="client"
                                                    fill
                                                    sizes="28px"
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-xs">
                                                    {p.client?.name?.charAt(0) ?? "U"}
                                                </div>
                                            )}
                                        </div>
                                        <span>{p.client?.name}</span>
                                    </div>

                                    <div className="w-2/12">
                                        {p.currency} {p.amount?.toFixed(2)}
                                    </div>

                                    <div className="w-2/12">
                                        {p.paymentGateway?.name ?? "--"}
                                    </div>

                                    <div className="w-2/12">
                                        {new Date(p.paymentDate).toLocaleDateString("en-GB")}
                                    </div>

                                    <div className="w-1/12">
                                        {p.status === "COMPLETED" ? (
                                            <span className="text-green-600">● Paid</span>
                                        ) : (
                                            <span className="text-yellow-600">{p.status}</span>
                                        )}
                                    </div>

                                    {/* ACTION */}
                                    <div className="w-10 text-center">
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 rounded hover:bg-gray-100">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent
                                                align="end"
                                                sideOffset={6}
                                                className="z-[30000]"
                                            >
                                                <DropdownMenuItem onClick={() => setViewPayment(p)}>
                                                    View
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => setEditPayment(p)}>
                                                    Edit
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    className=""
                                                    onClick={() => {
                                                        if (!confirm("Delete this payment?")) return;
                                                        fetch(
                                                            `${BASE_URL}/api/payments/${p.id}`,
                                                            {
                                                                method: "DELETE",
                                                                headers: {
                                                                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                                                                },
                                                            }
                                                        ).then(() =>
                                                            setPayments((s) =>
                                                                s.filter((x) => x.id !== p.id)
                                                            )
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                    {/* <Trash2 className="mr-2 h-4 w-4" /> Delete */}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <ViewPaymentDrawer
                    open={!!viewPayment}
                    payment={viewPayment}
                    onClose={() => setViewPayment(null)}
                />

                <EditPaymentDrawer
                    open={!!editPayment}
                    payment={editPayment}
                    onClose={() => setEditPayment(null)}
                    onUpdated={fetchPayments}
                />
            </div>
        </div>
    );
}

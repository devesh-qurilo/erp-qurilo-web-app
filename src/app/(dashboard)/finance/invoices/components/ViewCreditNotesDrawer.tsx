"use client";

import { useEffect, useState } from "react";
import { X, FileText } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_MAIN!;

export default function ViewCreditNotesDrawer({
    open,
    onClose,
    invoiceNumber,
}: {
    open: boolean;
    onClose: () => void;
    invoiceNumber?: string;
}) {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !invoiceNumber) return;

        const fetchNotes = async () => {
            setLoading(true);
            const res = await fetch(
                `${BASE_URL}/api/invoices/${invoiceNumber}/credit-notes`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );
            setNotes(await res.json());
            setLoading(false);
        };

        fetchNotes();
    }, [open, invoiceNumber]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[30000]">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="absolute right-0 top-0 h-full w-[83vw] bg-white shadow-xl">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">
                        Credit Notes — {invoiceNumber}
                    </h3>
                    <button onClick={onClose}><X /></button>
                </div>

                <div className="p-6">
                    {loading ? "Loading..." : (
                        <table className="w-full border">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">CN No</th>
                                    <th className="p-2 text-left">Amount</th>
                                    <th>Date</th>
                                    <th>Notes</th>
                                    <th>File</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notes.map(n => (
                                    <tr key={n.id} className="border-t">
                                        <td className="p-2">{n.creditNoteNumber}</td>
                                        <td>{n.currency} {n.amount}</td>
                                        <td>{n.creditNoteDate}</td>
                                        <td>{n.notes}</td>
                                        <td>
                                            {n.fileUrl && (
                                                <button onClick={() => window.open(n.fileUrl)}>
                                                    <FileText size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

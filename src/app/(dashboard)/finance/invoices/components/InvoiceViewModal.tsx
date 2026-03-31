"use client";

import Modal from "./Modal";
import Card from "./Card";
import { Button } from "@/components/ui/button";
import { Upload, Edit2, CheckCircle, FileText } from "lucide-react";

export default function InvoiceViewModal({
    open,
    onClose,
    invoice,
    setModal,
    refresh
}) {
    if (!invoice) return null;

    const safeDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "--");

    const statusBadge = (s) => {
        const v = (s || "").toLowerCase();
        if (v === "paid") return <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Paid</span>;
        if (v === "unpaid") return <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Unpaid</span>;
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{s}</span>;
    };

    return (
        <Modal open={open} onClose={onClose} title={`Invoice ${invoice.invoiceNumber}`}>
            <div className="space-y-6">

                {/* CLIENT DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <h4 className="text-sm font-medium mb-3">Client Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-600">Name</div><div>{invoice.client?.name}</div>
                            <div className="text-gray-600">Email</div><div>{invoice.client?.email}</div>
                            <div className="text-gray-600">Company</div><div>{invoice.client?.company?.companyName}</div>
                            <div className="text-gray-600">Mobile</div><div>{invoice.client?.mobile}</div>
                            <div className="text-gray-600">Address</div><div>{invoice.client?.address}</div>
                            <div className="text-gray-600">Country</div><div>{invoice.client?.country}</div>
                        </div>
                    </Card>

                    {/* PROJECT DETAILS */}
                    <Card>
                        <h4 className="text-sm font-medium mb-3">Project Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-600">Project</div><div>{invoice.project?.projectName}</div>
                            <div className="text-gray-600">Code</div><div>{invoice.project?.projectCode}</div>
                            <div className="text-gray-600">Start</div><div>{safeDate(invoice.project?.startDate)}</div>
                            <div className="text-gray-600">Deadline</div><div>{safeDate(invoice.project?.deadline)}</div>
                            <div className="text-gray-600">Budget</div>
                            <div>{invoice.currency} {invoice.project?.budget?.toLocaleString()}</div>
                        </div>
                    </Card>
                </div>

                {/* INVOICE DETAILS */}
                <Card>
                    <h4 className="text-sm font-medium mb-3">Invoice Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2 text-gray-600">
                            <div>Invoice No</div>
                            <div>Invoice Date</div>
                            <div>Currency</div>
                            <div>Amount</div>
                            <div>Tax</div>
                            <div>Total</div>
                            <div>Status</div>
                        </div>

                        <div className="space-y-2 md:col-span-2 font-medium">
                            <div>{invoice.invoiceNumber}</div>
                            <div>{safeDate(invoice.invoiceDate)}</div>
                            <div>{invoice.currency}</div>
                            <div>{invoice.currency} {invoice.amount}</div>
                            <div>{invoice.tax}%</div>
                            <div>{invoice.currency} {invoice.total}</div>
                            <div>{statusBadge(invoice.status)}</div>
                        </div>
                    </div>

                    {/* FILES */}
                    <div className="mt-6">
                        <div className="text-sm font-medium mb-2">Files</div>
                        <div className="flex gap-3 flex-wrap">
                            {(invoice.fileUrls || []).length === 0 && (
                                <span className="text-gray-500 text-sm">No files uploaded</span>
                            )}

                            {(invoice.fileUrls || []).map((f, i) => (
                                <div key={i} className="border rounded p-2 w-40">
                                    <div className="truncate text-sm">{f}</div>
                                    <Button
                                        className="mt-2 w-full"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(f, "_blank")}
                                    >
                                        <FileText className="h-4 w-4 mr-2" /> Open
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    {/* <div className="mt-6 flex justify-end gap-3">

                        {invoice.status?.toLowerCase() === "unpaid" && (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => setModal(m => ({ ...m, edit: true }))}
                                >
                                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                                </Button>

                                <Button onClick={() => alert("Mark paid API pending")}>
                                    <CheckCircle className="h-4 w-4 mr-2" /> Mark As Paid
                                </Button>
                            </>
                        )}

                        <Button
                            variant="ghost"
                            onClick={() => setModal(m => ({ ...m, upload: true }))}
                        >
                            <Upload className="h-4 w-4 mr-2" /> Upload File
                        </Button>

                        <Button
                            onClick={() => setModal(m => ({ ...m, payment: true }))}
                        >
                            <FileText className="h-4 w-4 mr-2" /> View Payments
                        </Button>
                    </div> */}
                </Card>
            </div>
        </Modal>
    );
}

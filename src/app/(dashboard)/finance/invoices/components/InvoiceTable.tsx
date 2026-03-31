"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { MoreHorizontal, Eye, Edit2, Upload, Trash, CheckCircle, DollarSign, FileText, Bell, Copy } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


const BASE_URL = process.env.NEXT_PUBLIC_MAIN;

interface InvoiceTableProps {
    invoices: any[];
    loading: boolean;
    filters: any;
    setActiveInvoice: (invoice: any) => void;
    setModal: any;
    onAddPayment: (invoice: any) => void; // ✅ paste here
}


export default function InvoiceTable({
    invoices,
    loading,
    filters,
    setActiveInvoice,
    setModal,
    onAddPayment,
}: InvoiceTableProps) {

    const safeDate = (d) => {
        if (!d) return "--";
        return new Date(d).toLocaleDateString("en-GB");
    };



    const statusBadge = (s) => {
        s = s?.toLowerCase();
        if (s === "paid") return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
        if (s === "unpaid") return <Badge className="bg-red-100 text-red-700">Unpaid</Badge>;
        if (s?.includes("credit")) return <Badge className="bg-yellow-100 text-yellow-700">Credit</Badge>;
        return <Badge>{s}</Badge>;
    };

    // Filtering logic
    const filtered = invoices.filter(inv => {
        if (filters.search) {
            const s = filters.search.toLowerCase();
            const match = inv.invoiceNumber?.toLowerCase().includes(s)
                || inv.project?.projectName?.toLowerCase().includes(s)
                || inv.client?.name?.toLowerCase().includes(s);
            if (!match) return false;
        }

        if (filters.project !== "All" && inv.project?.projectName !== filters.project) return false;
        if (filters.client !== "All" && inv.client?.name !== filters.client) return false;
        if (filters.status !== "All" && inv.status !== filters.status) return false;

        if (filters.startDate && filters.endDate) {
            const d = new Date(inv.invoiceDate);
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59);
            if (d < start || d > end) return false;
        }

        return true;
    });


    const handleMarkAsPaid = async (invoice) => {
        if (!invoice?.id) return;

        const ok = confirm(`Mark invoice ${invoice.invoiceNumber} as PAID?`);
        if (!ok) return;

        try {
            const res = await fetch(
                `${BASE_URL}/api/invoices/${invoice.invoiceNumber}/mark-paid`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Failed to mark invoice as paid");
            }

            alert("Invoice marked as PAID successfully ✅");

            // 🔁 refresh invoice list
            window.location.reload();   // agar parent se aata hai
        } catch (err) {
            console.error(err);
            alert("Failed to mark invoice as paid");
        }
    };





    const handleSendPaymentReminder = async (invoice) => {
        if (!invoice?.invoiceNumber) return;

        const ok = confirm(
            `Send payment reminder for invoice ${invoice.invoiceNumber}?`
        );
        if (!ok) return;

        try {
            const res = await fetch(
                `${BASE_URL}/api/invoices/${invoice.invoiceNumber}/actions/send-reminder-email`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Failed to send reminder");
            }

            alert("Payment reminder sent successfully 📧");
        } catch (err) {
            console.error(err);
            alert("Failed to send payment reminder");
        }
    };


    const handleDeleteInvoice = async (invoice) => {


        try {
            const res = await fetch(
                `${BASE_URL}/api/invoices/${invoice.invoiceNumber}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Failed to delete invoice");
            }

            alert("Invoice deleted successfully 🗑️");

            // 🔁 Refresh list
            window.location.reload(); // or call fetchInvoices()
        } catch (err) {
            console.error("Delete invoice error:", err);
            alert("Failed to delete invoice");
        }
    };


    // if (loading) return <p className="text-center py-10">Loading…</p>;

    return (
        <div className="border rounded-lg bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>

                {/* <TableBody>
                    {filtered.length === 0 ? ( */}



<TableBody>
  {loading ? (
    Array.from({ length: 8 }).map((_, i) => (
      <TableRow key={i}>
        {/* Invoice */}
        <TableCell>
          <Skeleton width={100} />
        </TableCell>

        {/* Project */}
        <TableCell>
          <Skeleton width={120} />
        </TableCell>

        {/* Client */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton circle width={28} height={28} />
            <Skeleton width={100} />
          </div>
        </TableCell>

        {/* Total */}
        <TableCell>
          <div className="space-y-1">
            <Skeleton width={120} />
            <Skeleton width={100} />
            <Skeleton width={90} />
          </div>
        </TableCell>

        {/* Date */}
        <TableCell>
          <Skeleton width={90} />
        </TableCell>

        {/* Status */}
        <TableCell>
          <Skeleton width={70} height={25} />
        </TableCell>

        {/* Action */}
        <TableCell className="text-right">
          <Skeleton circle width={30} height={30} />
        </TableCell>
      </TableRow>
    ))
  ) : filtered.length === 0 ? (


                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                                No invoices found
                            </TableCell>
                        </TableRow>
                    ) : (
                        filtered.map(inv => (
                            <TableRow key={inv.id} className="hover:bg-gray-50">
                                <TableCell>{inv.invoiceNumber}</TableCell>
                                <TableCell>{inv.project?.projectName}</TableCell>

                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {inv.client?.company?.companyLogoUrl ? (
                                            <Image src={inv.client.company.companyLogoUrl} alt="logo" width={28} height={28} className="rounded-full" />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                {inv.client?.name?.charAt(0)}
                                            </div>
                                        )}
                                        <span>{inv.client?.name}</span>
                                    </div>
                                </TableCell>

                                {/* <TableCell>{inv.currency} {Number(inv.total).toFixed(2)}</TableCell> */}





                                <TableCell>
                                    <div className="space-y-1 text-sm">
                                        <div>
                                            <span className="text-gray-500">Total :</span>{" "}
                                            <span className="text-gray-800 font-medium">
                                                {inv.currency} {Number(inv.total || 0).toLocaleString()}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-gray-500">Paid :</span>{" "}
                                            <span className="text-green-500 sm">
                                                {inv.currency} {Number(inv.paidAmount || 0).toLocaleString()}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="text-gray-500">Unpaid :</span>{" "}
                                            <span className="text-red-600">
                                                {inv.currency} {Number(inv.unpaidAmount || 0).toLocaleString()}
                                            </span>
                                        </div>

                                        {/* ✅ Always show adjustment for Credit Notes */}
                                        {(inv.status === "CREDIT_NOTES" || inv.adjustmentAmount > 0) && (
                                            <div>
                                                <span className="text-yellow-500">Adjustment :</span>{" "}
                                                <span className="text-yellow-500">
                                                    {inv.currency} {Number(inv.adjustmentAmount || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>


                                <TableCell>{safeDate(inv.invoiceDate)}</TableCell>
                                <TableCell>{statusBadge(inv.status)}</TableCell>

                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end" className="w-52">

                                            {/* --- COMMON ALWAYS --- */}
                                            <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setModal(m => ({ ...m, view: true })); }}>
                                                <Eye className="h-4 w-4 mr-2" /> View
                                            </DropdownMenuItem>

                                            {/* ============================UNPAID INVOICE ACTIONS============================ */}
                                            {inv.status === "UNPAID" && (
                                                <>
                                                    <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setModal(m => ({ ...m, edit: true })); }}>
                                                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem onClick={() => { if (confirm("Mark invoice as paid?")) handleMarkAsPaid(inv); }}>
                                                        <CheckCircle className="h-4 w-4 mr-2" /> Mark as Paid
                                                    </DropdownMenuItem>




                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setActiveInvoice(inv);
                                                            setModal((m: any) => ({ ...m, payment: true }));
                                                        }}
                                                    >
                                                        <DollarSign className="h-4 w-4 mr-2" /> Add Payment
                                                    </DropdownMenuItem>



                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setActiveInvoice(inv);
                                                            setModal(m => ({ ...m, viewPayment: true }));
                                                        }}
                                                    >
                                                        <FileText className="h-4 w-4 mr-2" /> View Payments
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setModal(m => ({ ...m, upload: true })); }}>
                                                        <Upload className="h-4 w-4 mr-2" /> Upload File
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem onClick={() => { handleSendPaymentReminder(inv); }}>
                                                        <Bell className="h-4 w-4 mr-2" /> Send Reminder
                                                    </DropdownMenuItem>
                                                </>
                                            )}

                                            {/* ============================PAID INVOICE ACTIONS============================ */}
                                            {inv.status === "PAID" && (
                                                <>



                                                    {/* ADD RECEIPT */}
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setActiveInvoice(inv);
                                                            setModal(m => ({ ...m, receipt: true }));
                                                        }}
                                                    >
                                                        <FileText className="h-4 w-4 mr-2" /> Add Receipt
                                                    </DropdownMenuItem>

                                                    {/* VIEW RECEIPT */}
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setActiveInvoice(inv);
                                                            setModal(m => ({ ...m, viewReceipt: true }));
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" /> View Receipt
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setModal(m => ({ ...m, upload: true })); }}>
                                                        <Upload className="h-4 w-4 mr-2" /> Upload File
                                                    </DropdownMenuItem>

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setActiveInvoice(inv);
                                                            setModal(m => ({ ...m, viewPayment: true }));
                                                        }}
                                                    >
                                                        <FileText className="h-4 w-4 mr-2" /> View Payments
                                                    </DropdownMenuItem>

                                                    <>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setActiveInvoice(inv);
                                                                setModal(m => ({ ...m, createCredit: true }));
                                                            }}
                                                        >
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            Create Credit Note
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setActiveInvoice(inv);
                                                                setModal(m => ({ ...m, viewCredit: true }));
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Credit Notes
                                                        </DropdownMenuItem>
                                                    </>
                                                </>
                                            )}

                                            {/* ============================CREDIT NOTE INVOICE ACTIONS============================ */}
                                            {inv.status === "CREDIT_NOTES" && (
                                                <>
                                                    {/* <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setModal(m => ({ ...m, payment: true })); }}>
                                                        <DollarSign className="h-4 w-4 mr-2" /> Add Payment
                                                    </DropdownMenuItem> */}

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setActiveInvoice(inv);
                                                            setModal(m => ({ ...m, payment: true }));
                                                        }}
                                                    >
                                                        <DollarSign className="h-4 w-4 mr-2" /> Add Payment
                                                    </DropdownMenuItem>

                                                    {/* <DropdownMenuItem onClick={() => { setActiveInvoice(inv); setModal(m => ({ ...m, payment: true })); }}>
                                                        <FileText className="h-4 w-4 mr-2" /> View Payments
                                                    </DropdownMenuItem> */}

                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setActiveInvoice(inv);
                                                            setModal(m => ({ ...m, viewPayment: true }));
                                                        }}
                                                    >
                                                        <FileText className="h-4 w-4 mr-2" /> View Payments
                                                    </DropdownMenuItem>
                                                </>
                                            )}

                                            <DropdownMenuSeparator />

                                            {/* --- COMMON ALWAYS --- */}
                                            {/* <DropdownMenuItem
                                                onClick={() => {
                                                    // setActiveInvoice(inv);                 // original invoice
                                                    // setModal(m => ({ ...m, create: true })); // SAME create modal open



                                                    setActiveInvoice({
                                                        ...inv,
                                                        invoiceNumber: "", // important
                                                    });
                                                    setModal(m => ({ ...m, create: true }));

                                                }}
                                            >
                                                <Copy className="h-4 w-4 mr-2" /> Create Duplicate bhj
                                            </DropdownMenuItem> */}

                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteInvoice(inv)}>
                                                <Trash className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>

                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>

                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}


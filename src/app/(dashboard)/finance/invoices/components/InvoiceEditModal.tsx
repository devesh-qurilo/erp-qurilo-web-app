
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";
import Card from "./Card";


 const BASE_URL =  `${process.env.NEXT_PUBLIC_MAIN}`;

export default function InvoiceEditModal({
    open,
    onClose,
    invoice,
    invoices = [],
    refresh,
}) {
    if (!invoice) return null;

    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        invoiceNumber: "",
        invoiceDate: "",
        currency: "USD",
        projectName: "",
        projectId: "",
        clientId: "",
        amount: 0,
        tax: 0,
        discount: 0,
        amountInWords: "",
        notes: "",
    });

    /* ============================
        Prefill form on open
    ============================ */
    useEffect(() => {
        if (!invoice) return;

        setForm({
            invoiceNumber: invoice.invoiceNumber || "",
            invoiceDate: invoice.invoiceDate || "",
            currency: invoice.currency || "USD",
            projectName: invoice.project?.projectName || "",
            projectId: invoice.project?.projectId || "",
            clientId: invoice.client?.name || "",
            amount: Number(invoice.amount || 0),
            tax: Number(invoice.tax || 0),
            discount: Number(invoice.discount || 0),
            amountInWords: invoice.amountInWords || "",
            notes: invoice.notes || "",
        });
    }, [invoice]);

    /* ============================
        Project & Client Lists
    ============================ */
    const projectList = useMemo(() => {
        const set = new Set();
        invoices.forEach(inv => inv.project?.projectName && set.add(inv.project.projectName));
        return ["Select Project", ...Array.from(set)];
    }, [invoices]);

    const clientList = useMemo(() => {
        const set = new Set();
        invoices.forEach(inv => inv.client?.name && set.add(inv.client.name));
        return ["Select Client", ...Array.from(set)];
    }, [invoices]);

    const getProjectBudget = (projectName) => {
        const f = invoices.find(i => i.project?.projectName === projectName);
        return f?.project?.budget || 0;
    };

    /* ============================
        Calculations (same as create)
    ============================ */
    const subtotal = Number(form.amount || 0);

    const discountAmount =
        // form.discount > 1
        //     ? form.discount
        //     : (subtotal * Number(form.discount || 0)) / 100;

(subtotal * Number(form.discount || 0)) / 100;

    const taxAmount =
        ((subtotal - discountAmount) * Number(form.tax || 0)) / 100;

    const totalAmount = subtotal - discountAmount + taxAmount;

    /* ============================
        Update API
    ============================ */
    const updateInvoice = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                amount: Number(form.amount || 0),
                tax: Number(form.tax || 0),
                discount: Number(form.discount || 0),
            };

            const res = await fetch(`${BASE_URL}/api/invoices/${invoice.invoiceNumber}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Update failed");

            onClose();
            refresh();
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={open} title={`Edit Invoice – ${invoice.invoiceNumber}`} onClose={onClose}>
            <div className="space-y-6">

                {/* ============================
                    Invoice Details
                ============================ */}
                <Card>
                    <h4 className="text-sm font-medium mb-4">Invoice Details</h4>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                            <label className="text-sm text-gray-600 block mb-1">Invoice Number</label>
                            <input
                                readOnly
                                className="border rounded w-full h-10 px-3 bg-gray-100"
                                value={form.invoiceNumber}
                            />
                        </div>

                        <div className="col-span-4">
                            <label className="text-sm text-gray-600 block mb-1">Invoice Date *</label>
                            <input
                                type="date"
                                className="border rounded w-full h-10 px-2"
                                value={form.invoiceDate}
                                onChange={(e) =>
                                    setForm(f => ({ ...f, invoiceDate: e.target.value }))
                                }
                            />
                        </div>

                        <div className="col-span-4">
                            <label className="text-sm text-gray-600 block mb-1">Currency *</label>
                            <select
                                className="border rounded w-full h-10 px-2"
                                value={form.currency}
                                onChange={(e) =>
                                    setForm(f => ({ ...f, currency: e.target.value }))
                                }
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="AUD">AUD - Australian Dollar</option>
                                <option value="CAD">CAD - Canadian Dollar</option>
                                <option value="JPY">JPY - Japanese Yen</option>
                                <option value="CHF">CHF - Swiss Franc</option>
                                <option value="SGD">SGD - Singapore Dollar</option>
                                <option value="NZD">NZD - New Zealand Dollar</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* ============================
                    Project Details
                ============================ */}
                <Card>
                    <h4 className="text-sm font-medium mb-4">Project Details</h4>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4">
                            <label className="text-sm text-gray-600 block mb-1">Project *</label>
                            <select
                                className="border rounded w-full h-10 px-2"
                                value={form.projectName}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    const found = invoices.find(
                                        i => i.project?.projectName === name
                                    );
                                    setForm(f => ({
                                        ...f,
                                        projectName: name,
                                        projectId: found?.project?.projectId || "",
                                    }));
                                }}
                            >
                                {projectList.map(p => (
                                    <option key={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-4">
                            <label className="text-sm text-gray-600 block mb-1">Client *</label>
                            <select
                                className="border rounded w-full h-10 px-2"
                                value={form.clientId}
                                onChange={(e) =>
                                    setForm(f => ({ ...f, clientId: e.target.value }))
                                }
                            >
                                {clientList.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-4">
                            <label className="text-sm text-gray-600 block mb-1">Project Budget</label>
                            <input
                                readOnly
                                className="border rounded w-full h-10 px-3 bg-gray-100"
                                value={getProjectBudget(form.projectName).toLocaleString()}
                            />
                        </div>
                    </div>

                    {/* Amount / Tax / Total */}
                    <div className="mt-4 border rounded flex overflow-hidden">
                        <div className="flex-1 p-3">
                            <label className="text-sm text-gray-600 block mb-1">Amount</label>
                            <input
                                type="number"
                                className="border rounded h-10 w-40 px-2"
                                value={form.amount}
                                onChange={(e) =>
                                    setForm(f => ({ ...f, amount: Number(e.target.value) }))
                                }
                            />
                        </div>

                        <div className="w-56 p-3 border-l">
                            <label className="text-sm text-gray-600 block mb-1">Tax (%)</label>
                            <input
                                type="number"
                                min="0"
                                className="border rounded h-10 w-full px-2"
                                value={form.tax}
                                onChange={(e) =>
                                    setForm(f => ({ ...f, tax: Number(e.target.value) }))
                                }
                            />
                        </div>

                        <div className="w-40 bg-gray-100 p-3 flex flex-col items-center justify-center">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="font-bold text-lg">{totalAmount.toFixed(2)}</div>
                        </div>
                    </div>
                </Card>

                {/* ============================
                    Amount in Words & Notes
                ============================ */}
                <Card>
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-6">
                            <label className="text-sm text-gray-600 block mb-1">Amount in words</label>
                            <input
                                className="border rounded w-full h-10 px-3"
                                value={form.amountInWords}
                                onChange={(e) =>
                                    setForm(f => ({ ...f, amountInWords: e.target.value }))
                                }
                            />
                        </div>

                        <div className="col-span-6">
                            <label className="text-sm text-gray-600 block mb-1">Notes</label>
                            <textarea
                                className="border rounded w-full h-28 p-3"
                                value={form.notes}
                                onChange={(e) =>
                                    setForm(f => ({ ...f, notes: e.target.value }))
                                }
                            />
                        </div>
                    </div>
                </Card>

                {/* ============================
                    Actions
                ============================ */}
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={updateInvoice} disabled={saving}>
                        {saving ? "Updating..." : "Update"}
                    </Button>
                </div>

            </div>
        </Modal>
    );
}



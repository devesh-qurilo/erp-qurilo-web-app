// "use client";

// import { useState } from "react";
// import Modal from "./Modal";
// import { Button } from "@/components/ui/button";


// const BASE_URL = process.env.NEXT_PUBLIC_MAIN!;

// export default function InvoicePaymentModal({
//     open,
//     onClose,
//     invoice
// }) {
//     const [form, setForm] = useState({
//         amount: invoice?.unpaidAmount || invoice?.total || "",
//         currency: invoice?.currency || "",
//         transactionId: "",
//         notes: "",
//     });

//     const [file, setFile] = useState(null);

//     if (!invoice) return null;

//     const savePayment = async () => {
//         const fd = new FormData();
//         fd.append("payment", JSON.stringify({
//             ...form,
//             invoiceId: invoice.invoiceNumber
//         }));

//         if (file) fd.append("file", file);

//         await fetch(`${BASE_URL}/api/payments`, {
//             method: "POST",
//             headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
//             body: fd,
//         });

//         onClose();
//     };

//     return (
//         <Modal open={open} onClose={onClose} title={`Add Payment - ${invoice.invoiceNumber}`}>
//             <div className="space-y-3">

//                 <input
//                     className="border rounded w-full px-2 py-1"
//                     placeholder="Amount"
//                     value={form.amount}
//                     onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
//                 />

//                 <input
//                     className="border rounded w-full px-2 py-1"
//                     placeholder="Transaction ID"
//                     value={form.transactionId}
//                     onChange={(e) => setForm(f => ({ ...f, transactionId: e.target.value }))}
//                 />

//                 <input
//                     className="border rounded w-full px-2 py-1"
//                     placeholder="Currency"
//                     value={form.currency}
//                     onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
//                 />

//                 <textarea
//                     className="border rounded w-full px-2 py-1"
//                     placeholder="Notes"
//                     value={form.notes}
//                     onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
//                 />

//                 <input
//                     type="file"
//                     onChange={(e) => setFile(e.target.files?.[0] || null)}
//                 />

//                 <div className="flex justify-end gap-2 mt-4">
//                     <Button variant="ghost" onClick={onClose}>Cancel</Button>
//                     <Button onClick={savePayment}>Save</Button>
//                 </div>

//             </div>
//         </Modal>
//     );
// }








"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_MAIN || `${process.env.NEXT_PUBLIC_MAIN}`;

// export default function AddPaymentModal({
//     open,
//     onClose,
//     clientId,
//     onSaved,
// }: {
//     open: boolean;
//     onClose: () => void;
//     clientId?: string | number | null;
//     onSaved?: () => void;
// })



export default function InvoicePaymentModal({
    open,
    onClose,
    projectId,
    clientId,
    invoiceNumber,
    onSaved,
}: {
    open: boolean;
    onClose: () => void;
    projectId?: string | number | null;
    clientId?: string | number | null;
    invoiceNumber?: string | null;
    onSaved?: () => void;
}) {
    // const [project, setProject] = useState("pre filled");
    // const [client, setClient] = useState(clientId ? String(clientId) : "pre filled");
    // const [invoice, setInvoice] = useState("pre filled");


    const [project, setProject] = useState("");
    const [client, setClient] = useState("");
    const [invoice, setInvoice] = useState("");

    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [transactionId, setTransactionId] = useState("");
    const [paymentGateway, setPaymentGateway] = useState("Net Banking");
    const [remark, setRemark] = useState("");

    const fileRef = useRef<HTMLInputElement | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    const [gatewayModal, setGatewayModal] = useState(false);
    const [gateways, setGateways] = useState<{ id: number; name: string }[]>([]);
    const [gatewayInput, setGatewayInput] = useState("");

    // useEffect(() => {
    //     if (open) {
    //         setClient(clientId ? String(clientId) : "pre filled");
    //     }
    // }, [open, clientId]);



    useEffect(() => {
        if (open) {
            setProject(projectId ? String(projectId) : "");
            setClient(clientId ? String(clientId) : "");
            setInvoice(invoiceNumber ? String(invoiceNumber) : "");
        }
    }, [open, projectId, clientId, invoiceNumber]);



    if (!open) return null;

    // -------------------------------
    // FETCH GATEWAYS
    // -------------------------------
    const fetchGateways = async () => {
        try {
            const token = localStorage.getItem("accessToken") || "";
            const res = await fetch(`${BASE_URL}/api/payment-gateways`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setGateways(data.map((g: any) => ({ id: g.id, name: g.name })));
            }
        } catch (e) {
            //console.log("Failed fetching gateways");
        }
    };

    const saveGateway = async () => {
        if (!gatewayInput.trim()) return alert("Enter gateway name");

        try {
            const token = localStorage.getItem("accessToken") || "";
            const res = await fetch(`${BASE_URL}/api/payment-gateways`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: gatewayInput }),
            });

            const created = await res.json();
            setGateways((prev) => [...prev, created]);
            setPaymentGateway(created.name);
            setGatewayModal(false);
        } catch (err) {
            alert("Failed to save gateway");
        }
    };

    const savePayment = () => {
        //console.log("PAYMENT SAVED:", {
        // project,
        // client,
        // invoice,
        // amount,
        // currency,
        // transactionId,
        // paymentGateway,
        // remark,
        // receiptName: receiptFile?.name,
        //    });//

        onSaved?.();
        onClose();
    };

    return (
        <>
            {/* MAIN PAYMENT MODAL */}
            <div className="fixed inset-0 z-[20000] flex items-center justify-center px-4 py-6">

                {/* BACKDROP */}
                <div className="absolute inset-0 bg-black/40" onClick={onClose} />

                {/* CENTERED MODAL */}
                <div
                    className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* HEADER */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">Add Payment Details</h3>
                        <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* CONTENT */}
                    <div className="p-6 space-y-6">
                        <div className="rounded-lg border p-4">
                            <h4 className="font-medium mb-3">Payment Details</h4>

                            {/* GRID */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* <Input label="Project *" value={project} setValue={setProject} />
                                <Input label="Client *" value={client} setValue={setClient} />
                                <Input label="Invoice *" value={invoice} setValue={setInvoice} /> */}


                                <input
                                    className="w-full border rounded px-3 py-2 bg-gray-50"
                                    value={project}
                                    readOnly
                                />

                                <input
                                    className="w-full border rounded px-3 py-2 bg-gray-50"
                                    value={client}
                                    readOnly
                                />

                                <input
                                    className="w-full border rounded px-3 py-2 bg-gray-50"
                                    value={invoice}
                                    readOnly
                                />



                                <Input label="Amount *" value={amount} setValue={setAmount} />

                                {/* Currency */}
                                <div>
                                    <label className="text-sm text-gray-600">Currency *</label>
                                    <select
                                        className="w-full border rounded px-3 py-2"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    >
                                        {/* <option value="USD">USD $</option>
                                        <option value="USD">USD ₹</option>
                                        <option value="EUR">EUR €</option> */}


                                        <option value="USD">USD $ (US Dollar)</option>
                                        <option value="EUR">EUR € (Euro)</option>
                                        <option value="GBP">GBP £ (British Pound)</option>
                                        <option value="CHF">CHF ₣ (Swiss Franc)</option>
                                        <option value="SEK">SEK kr</option>
                                        <option value="NOK">NOK kr</option>
                                        <option value="DKK">DKK kr</option>
                                        <option value="PLN">PLN zł</option>
                                        <option value="CZK">CZK Kč</option>
                                        <option value="HUF">HUF Ft</option>
                                        <option value="RON">RON lei</option>


                                    </select>
                                </div>

                                <Input label="Transaction ID" value={transactionId} setValue={setTransactionId} />

                                {/* Payment Gateway */}
                                <div className="col-span-2">
                                    <label className="text-sm text-gray-600">Payment Gateway</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="w-full border rounded px-3 py-2"
                                            value={paymentGateway}
                                            onChange={(e) => setPaymentGateway(e.target.value)}
                                        >
                                            {gateways.length > 0
                                                ? gateways.map((g) => <option key={g.id}>{g.name}</option>)
                                                : ["Net Banking", "Credit Card", "PayPal"].map((g) => (
                                                    <option key={g}>{g}</option>
                                                ))}
                                        </select>

                                        <button
                                            className="px-3 py-2 bg-gray-100 rounded"
                                            onClick={() => {
                                                setGatewayModal(true);
                                                fetchGateways();
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* RECEIPT UPLOAD */}
                            <div className="mt-4">
                                <label className="text-sm text-gray-600">Receipt </label>
                                <div
                                    className="border-2 border-dashed rounded-lg h-28 flex items-center justify-center cursor-pointer text-gray-600"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    {receiptFile ? receiptFile.name : "Click or drag file"}
                                </div>
                                <input
                                    type="file"
                                    ref={fileRef}
                                    className="hidden"
                                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                                />
                            </div>

                            {/* REMARK */}
                            <div className="mt-4">
                                <label className="text-sm text-gray-600">Remark</label>
                                <textarea
                                    rows={4}
                                    className="border rounded w-full p-3"
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="flex justify-end gap-3">
                            <button className="px-4 py-2 border rounded" onClick={onClose}>Cancel</button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={savePayment}>Save</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* -------------------------
           GATEWAY MODAL
      -------------------------- */}
            {gatewayModal && (
                <div className="fixed inset-0 z-[30000] flex items-center justify-center px-4 py-6">

                    <div className="absolute inset-0 bg-black/40" onClick={() => setGatewayModal(false)} />

                    <div
                        className="relative bg-white w-full max-w-3xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Add Payment Gateway</h3>
                            <button onClick={() => setGatewayModal(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* LIST */}
                        <div className="rounded border overflow-hidden">
                            <div className="bg-blue-50 px-4 py-2 flex text-sm font-medium">
                                <div className="w-1/12">#</div>
                                <div className="w-10/12">Gateway</div>
                                <div className="w-1/12 text-center">Action</div>
                            </div>

                            <div className="px-4 py-2">
                                {gateways.length === 0 ? (
                                    <p className="text-gray-500 p-2">No gateways</p>
                                ) : (
                                    gateways.map((g, i) => (
                                        <div key={g.id} className="flex items-center py-2 border-b last:border-none">
                                            <div className="w-1/12">{i + 1}</div>
                                            <div className="w-10/12">{g.name}</div>
                                            <div className="w-1/12 text-center">
                                                <Trash2 className="text-red-600 cursor-pointer" size={16} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* INPUT */}
                        <label className="text-sm text-gray-600 block mt-4">Gateway Name *</label>
                        <input
                            value={gatewayInput}
                            onChange={(e) => setGatewayInput(e.target.value)}
                            className="border rounded w-full px-3 py-2 mt-1"
                        />

                        {/* BUTTONS */}
                        <div className="flex justify-end gap-3 mt-4">
                            <button className="px-4 py-2 border rounded" onClick={() => setGatewayModal(false)}>Cancel</button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={saveGateway}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Input Component
function Input({ label, value, setValue }) {
    return (
        <div>
            <label className="text-sm text-gray-600">{label}</label>
            <input
                className="w-full border rounded px-3 py-2"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
}

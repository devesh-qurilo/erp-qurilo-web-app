
// src/components/ClientPaymentsTable.tsx
"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { MoreHorizontal, X, Trash2 } from "lucide-react";

type PaymentClient = {
  clientId?: string;
  name?: string | null;
  companyName?: string | null;
  profilePictureUrl?: string | null;
};

type RawPaymentApi = {
  id: number;
  project?: { projectName?: string; projectCode?: string } | null;
  client?: {
    clientId?: string;
    name?: string | null;
    companyName?: string | null;
    profilePictureUrl?: string | null;
  } | null;
  currency?: string | null;
  amount?: number | null;
  paymentDate?: string | null;
  receiptFileUrl?: string | null;
  paymentGateway?: { id?: number; name?: string } | null;
  status?: string | null;
  invoice?: { invoiceNumber?: string } | null;
  orderNumber?: string | null;
};

type Payment = {
  id: number | string;
  code?: string | null;
  project?: string | null;
  invoice?: string | null;
  client?: PaymentClient | null;
  orderNumber?: string | null;
  amount?: number | null;
  currency?: string | null;
  paidOn?: string | null;
  paymentGateway?: string | null;
  status?: "Complete" | "Pending" | "Failed" | string;
  receiptFileUrl?: string | null;
};

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`

export default function PaymentsSection({
  projectId,
  onAdd,
  onSearch,
  onAction,
}: {
  projectId?: string | number | null;
  onAdd?: () => void;
  onSearch?: (q: string) => void;
  onAction?: (p: Payment) => void;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Add Payment modal state + form fields
  const [showAddModal, setShowAddModal] = useState(false);
  const [projectField, setProjectField] = useState<string>("pre filled");
  const [clientField, setClientField] = useState<string>(() =>
    projectId ? String(projectId) : "pre filled"
  );
  const [invoiceField, setInvoiceField] = useState<string>("pre filled");
  const [amountField, setAmountField] = useState<string>("");
  const [currencyField, setCurrencyField] = useState<string>("USD");
  const [transactionIdField, setTransactionIdField] = useState<string>("");
  const [paymentGatewayField, setPaymentGatewayField] = useState<string>(
    "Net Banking"
  );
  const [remarkField, setRemarkField] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Payment Gateway modal / list state (now wired to API)
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [gateways, setGateways] = useState<{ id: number; name: string }[]>([]);
  const [gatewayInput, setGatewayInput] = useState<string>("");

  // fetch payments for client (unchanged)
  useEffect(() => {
    if (!projectId && projectId !== 0) {
      setPayments([]);
      setError("No client selected.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const idStr = String(projectId);
    // const url = `${BASE_URL}/api/payments/client/${encodeURIComponent(idStr)}`;
    const url = `${BASE_URL}/api/payments/project/${projectId}`

    setLoading(true);
    setError(null);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((data: RawPaymentApi[]) => {
        if (!Array.isArray(data)) {
          setPayments([]);
          return;
        }

        const mapped: Payment[] = data.map((p) => ({
          id: p.id,
          code: p.project?.projectCode ?? undefined,
          project: p.project?.projectName ?? undefined,
          invoice: p.invoice?.invoiceNumber ?? undefined,
          client: {
            clientId: p.client?.clientId,
            name: p.client?.name ?? undefined,
            companyName: p.client?.companyName ?? undefined,
            profilePictureUrl: p.client?.profilePictureUrl ?? undefined,
          },
          orderNumber: (p as any).orderNumber ?? undefined,
          amount:
            typeof p.amount === "number"
              ? p.amount
              : p.amount
                ? Number(p.amount)
                : undefined,
          currency: p.currency ?? undefined,
          paidOn: p.paymentDate ?? undefined,
          paymentGateway: p.paymentGateway?.name ?? undefined,
          status: p.status
            ? String(p.status).toLowerCase() === "completed"
              ? "Complete"
              : p.status
            : undefined,
          receiptFileUrl: p.receiptFileUrl ?? undefined,
        }));

        setPayments(mapped);
      })
      .catch((err) => {
        if ((err as any).name === "AbortError") return;
        console.error("Error fetching payments:", err);
        setError("Failed to load payments.");
        setPayments([]);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [projectId]);

  // local search filtering (UI-level). still calls onSearch if provided
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => {
      return (
        String(p.code ?? "").toLowerCase().includes(q) ||
        String(p.project ?? "").toLowerCase().includes(q) ||
        String(p.invoice ?? "").toLowerCase().includes(q) ||
        String(p.client?.name ?? "").toLowerCase().includes(q) ||
        String(p.client?.companyName ?? "").toLowerCase().includes(q) ||
        String(p.orderNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [payments, query]);

  const formatDate = (d?: string | null) => {
    if (!d) return "--";
    try {
      const dt = new Date(d);
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yyyy = dt.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return d;
    }
  };

  const formatAmount = (v?: number | null, currency?: string | null) => {
    if (v == null) return "--";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 2,
      }).format(Number(v));
    } catch {
      return `${currency ?? "$"} ${Number(v).toFixed(2)}`;
    }
  };

  // open modal when Add clicked, but still call optional onAdd
  const handleOpenAdd = () => {
    if (onAdd) {
      try {
        onAdd();
      } catch { }
    }
    // prefill client if we have clientId
    setClientField(projectId ? String(projectId) : clientField);
    setShowAddModal(true);
  };

  const handleFileClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setReceiptFile(e.target.files?.[0] ?? null);

  // Save button: keep simple (logs & close). If you want an API POST, tell me.
  const handleSavePayment = () => {
    const payload = {
      project: projectField,
      client: clientField,
      invoice: invoiceField,
      amount: amountField,
      currency: currencyField,
      transactionId: transactionIdField,
      paymentGateway: paymentGatewayField,
      remark: remarkField,
      receiptFileName: receiptFile?.name ?? null,
    };

    setShowAddModal(false);
  };

  // ---------- Payment Gateway API integration ----------
  const fetchGateways = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/payment-gateways`, {
        headers: {
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : ""}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        console.error("Failed to fetch gateways", res.status);
        setGateways([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setGateways(data.map((g: any) => ({ id: g.id, name: g.name })));
      } else {
        setGateways([]);
      }
    } catch (err) {
      console.error("fetchGateways error", err);
      setGateways([]);
    }
  };

  // Open gateway modal: load list from server
  const handleOpenGatewayModal = () => {
    setGatewayInput("");
    setShowGatewayModal(true);
    fetchGateways();
  };

  // Save (create) gateway via POST and close modal (as requested)
  const handleSaveGateway = async () => {
    const name = gatewayInput.trim();
    if (!name) {
      alert("Enter gateway name");
      return;
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
      const res = await fetch(`${BASE_URL}/api/payment-gateways`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("POST gateway failed", res.status, txt);
        alert("Failed to create gateway");
        return;
      }
      const created = await res.json();
      // update local list (append)
      setGateways((s) => [...s, { id: created.id, name: created.name }]);
      // select created gateway in the payment form
      setPaymentGatewayField(created.name);
      // close modal (user requested modal to have Save only)
      setShowGatewayModal(false);
    } catch (err) {
      console.error("handleSaveGateway error", err);
      alert("Failed to create gateway");
    }
  };

  // Delete gateway via API then remove from list
  const handleDeleteGateway = async (id: number) => {
    if (!confirm("Delete this gateway?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
      const res = await fetch(`${BASE_URL}/api/payment-gateways/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Failed delete gateway", res.status);
        alert("Failed to delete gateway");
        return;
      }
      setGateways((s) => s.filter((g) => g.id !== id));
      // if deleted gateway was selected in form, reset selection
      if (gateways.find((g) => g.id === id && g.name === paymentGatewayField)) {
        const remaining = gateways.filter((g) => g.id !== id);
        setPaymentGatewayField(remaining[0]?.name ?? "");
      }
    } catch (err) {
      console.error("handleDeleteGateway error", err);
      alert("Failed to delete gateway");
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Payments</h3>

          <div className="flex items-center gap-3">
            <div>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Add Payment
              </button>
            </div>

            <div>
              <input
                type="search"
                placeholder="Search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (onSearch) onSearch(e.target.value);
                }}
                className="border rounded px-3 py-2 text-sm w-56"
              />
            </div>
          </div>
        </div>

        {/* loading / error */}
        {loading ? (
          <div className="py-6 text-center text-gray-600">Loading payments...</div>
        ) : error ? (
          <div className="py-6 text-center text-red-600">{error}</div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            {/* header */}
            <div className="bg-[#e8f3ff] px-4 py-3 flex text-sm text-gray-700 font-medium">
              <div className="w-1/12">Code</div>
              <div className="w-2/12">Project</div>
              <div className="w-1/12">Invoice</div>
              <div className="w-2/12">Client</div>
              <div className="w-1/12">Order#</div>
              <div className="w-1/12">Amount</div>
              <div className="w-1/12">Paid On</div>
              <div className="w-1/12">Payment Gateway</div>
              <div className="w-1/12">Status</div>
              <div className="w-10 text-center">Action</div>
            </div>

            <div className="px-4 py-4">
              {visible.length === 0 ? (
                <div className="text-sm text-gray-500">No payments to display.</div>
              ) : (
                <div className="space-y-3">
                  {visible.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center rounded-md border px-4 py-3 bg-white"
                      style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.02) inset" }}
                    >
                      <div className="w-1/12 text-sm">{p.code ?? "--"}</div>

                      <div className="w-2/12 text-sm">{p.project ?? "--"}</div>

                      <div className="w-1/12 text-sm">{p.invoice ?? "--"}</div>

                      <div className="w-2/12 flex items-center gap-3 text-sm">
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                          {p.client?.profilePictureUrl ? (
                            <Image
                              src={p.client.profilePictureUrl}
                              alt={p.client?.name ?? "client"}
                              fill
                              sizes="28px"
                              style={{ objectFit: "cover" }}
                              unoptimized
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-gray-500">
                              {p.client?.name?.charAt(0) ?? "U"}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{p.client?.name ?? "--"}</span>
                          <span className="text-xs text-gray-500">{p.client?.companyName ?? ""}</span>
                        </div>
                      </div>

                      <div className="w-1/12 text-sm">{p.orderNumber ?? "--"}</div>

                      <div className="w-1/12 text-sm">{formatAmount(p.amount, p.currency)}</div>

                      <div className="w-1/12 text-sm">{formatDate(p.paidOn)}</div>

                      <div className="w-1/12 text-sm">{p.paymentGateway ?? "--"}</div>

                      <div className="w-1/12 text-sm">
                        {p.status === "Complete" ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-600 block" />
                            <span>Complete</span>
                          </div>
                        ) : p.status === "Pending" ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-yellow-500 block" />
                            <span>Pending</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500 block" />
                            <span>{p.status ?? "--"}</span>
                          </div>
                        )}
                      </div>

                      <div className="w-10 text-center">
                        <button
                          onClick={() => (onAction ? onAction(p) : undefined)}
                          className="p-2 rounded hover:bg-gray-100 inline-flex items-center justify-center"
                          title="Actions"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Payment Modal (UI exact like screenshot) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-8 px-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-y-auto z-10">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Payment Details</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3">Payment Details</h4>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Project *</label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={projectField}
                      onChange={(e) => setProjectField(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Client *</label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={clientField}
                      onChange={(e) => setClientField(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Invoice *</label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={invoiceField}
                      onChange={(e) => setInvoiceField(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Amount *</label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={amountField}
                      onChange={(e) => setAmountField(e.target.value)}
                      placeholder="---"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Currency *</label>
                    <select
                      value={currencyField}
                      onChange={(e) => setCurrencyField(e.target.value)}
                      className="w-full border rounded px-3 py-2"
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

                  <div>
                    <label className="text-sm text-gray-600">Transaction Id</label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={transactionIdField}
                      onChange={(e) => setTransactionIdField(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm text-gray-600">Payment Gateway</label>
                    <div className="flex gap-2">
                      <select
                        value={paymentGatewayField}
                        onChange={(e) => setPaymentGatewayField(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                      >
                        {gateways.length > 0 ? (
                          gateways.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)
                        ) : (
                          <>
                            <option>Net Banking</option>
                            <option>Credit Card</option>
                            <option>PayPal</option>
                          </>
                        )}
                      </select>
                      <button
                        className="px-3 py-2 bg-gray-100 rounded"
                        type="button"
                        onClick={handleOpenGatewayModal}
                        title="Add payment gateway"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm text-gray-600 block mb-2">Receipt</label>
                  <div
                    onClick={handleFileClick}
                    className="border-2 border-dashed rounded-lg h-28 flex items-center justify-center cursor-pointer text-gray-500"
                  >
                    <div className="text-center">
                      <div className="mb-1">Choose a file</div>
                      <div className="text-xs text-gray-400">
                        {receiptFile ? receiptFile.name : "Drag & drop or click"}
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm text-gray-600 block mb-2">Remark</label>
                  <textarea
                    rows={4}
                    value={remarkField}
                    onChange={(e) => setRemarkField(e.target.value)}
                    className="w-full p-3 border rounded"
                    placeholder="Enter a summary of payment"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  className="px-4 py-2 border rounded"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={handleSavePayment}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal (uses GET/POST/DELETE) */}
      {showGatewayModal && (
        <div className="fixed inset-0 z-[11000] flex items-start justify-center pt-12 px-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setShowGatewayModal(false)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-y-auto z-20">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Payment Gateway</h3>
              <button
                onClick={() => setShowGatewayModal(false)}
                className="p-2 rounded hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Gateway list table (simple) */}
              <div className="rounded border overflow-hidden">
                <div className="bg-[#e8f3ff] px-4 py-2 flex text-sm text-gray-700 font-medium">
                  <div className="w-1/12">#</div>
                  <div className="w-11/12">Gateway</div>
                  <div className="w-12 text-center">Action</div>
                </div>

                <div className="px-4 py-2">
                  {gateways.length === 0 ? (
                    <div className="text-sm text-gray-500 p-2">No gateways</div>
                  ) : (
                    gateways.map((g, idx) => (
                      <div key={g.id} className="flex items-center py-2 border-b last:border-b-0">
                        <div className="w-1/12 text-sm">{idx + 1}</div>
                        <div className="w-11/12 text-sm">{g.name}</div>
                        <div className="w-12 text-center">
                          <button
                            onClick={() => handleDeleteGateway(g.id)}
                            className="inline-flex items-center justify-center p-1 rounded hover:bg-red-50 text-red-600"
                            title="Delete gateway"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add field: single input. (No extra 'Add' button here — Save will POST) */}
              <div>
                <label className="text-sm text-gray-600">Payment Gateway Name *</label>
                <input
                  value={gatewayInput}
                  onChange={(e) => setGatewayInput(e.target.value)}
                  placeholder="--"
                  className="w-full border rounded px-3 py-2 mt-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  className="px-4 py-2 border rounded"
                  onClick={() => setShowGatewayModal(false)}
                >
                  Cancel
                </button>

                {/* Save -> POST -> close modal and select new gateway */}
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={handleSaveGateway}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

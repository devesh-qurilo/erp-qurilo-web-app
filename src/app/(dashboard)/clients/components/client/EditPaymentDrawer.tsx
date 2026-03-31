
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_MAIN!;

export default function EditPaymentDrawer({
  open,
  payment,
  onClose,
  onUpdated,
}: {
  open: boolean;
  payment: any;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [transactionId, setTransactionId] = useState("");
  const [paymentGatewayId, setPaymentGatewayId] = useState<number | "">("");
  const [status, setStatus] = useState("COMPLETED");
  const [remark, setRemark] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // ----------------------------
  // PREFILL DATA
  // ----------------------------
  useEffect(() => {
    if (!open || !payment) return;

    setAmount(payment.amount?.toString() ?? "");
    setCurrency(payment.currency ?? "USD");
    setTransactionId(payment.transactionId ?? "");
    setPaymentGatewayId(payment.paymentGateway?.id ?? "");
    setStatus(payment.status ?? "COMPLETED");
    setRemark(payment.note ?? payment.remark ?? "");
    setReceiptFile(null);
  }, [open, payment]);

  if (!open || !payment) return null;

  // ----------------------------
  // SAVE PAYMENT
  // ----------------------------



  const savePayment = async () => {
    if (!amount || isNaN(Number(amount))) {
      alert("Enter valid amount");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("accessToken") || "";

      const payload = {
        amount: Number(amount),
        currency,
        transactionId,
        status,
        notes: remark || null,
        paymentGatewayId: paymentGatewayId || null,
      };

      const res = await fetch(`${BASE_URL}/api/payments/${payment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API ERROR:", text);
        throw new Error(text || "Failed to update payment");
      }

      onUpdated?.();
      onClose();
    } catch (err: any) {
      alert(err.message || "Update payment failed");
    } finally {
      setSaving(false);
    }
  };




  return (
    <div className="fixed inset-0 z-[30000]">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* DRAWER */}
      <div
        className="absolute top-0 right-0 h-full bg-white shadow-2xl"
        style={{ width: "83vw", minWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Edit Payment</h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 overflow-y-auto h-[calc(100vh-64px)]">
          <Input label="Amount *" value={amount} setValue={setAmount} />

          {/* Currency */}
          <div>
            <label className="text-sm text-gray-600">Currency  *</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {/* <option value="USD">USD $</option>
              <option value="INR">INR ₹</option>
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

          <Input
            label="Transaction ID"
            value={transactionId}
            setValue={setTransactionId}
          />

          {/* Payment Gateway (ID based) */}
          <div>
            <label className="text-sm text-gray-600">Payment Gateway</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={paymentGatewayId}
              onChange={(e) => setPaymentGatewayId(Number(e.target.value))}
            >
              <option value="">Select Gateway</option>
              {payment.paymentGateway && (
                <option value={payment.paymentGateway.id}>
                  {payment.paymentGateway.name}
                </option>
              )}
            </select>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm text-gray-600">Status *</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="COMPLETED">COMPLETED</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* RECEIPT */}
          <div>
            <label className="text-sm text-gray-600">Replace Receipt</label>
            <div
              className="border-2 border-dashed rounded-lg h-28 flex items-center justify-center cursor-pointer text-gray-600"
              onClick={() => fileRef.current?.click()}
            >
              {receiptFile ? receiptFile.name : "Click to upload new receipt"}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) =>
                setReceiptFile(e.target.files?.[0] ?? null)
              }
            />
          </div>

          {/* REMARK */}
          <div>
            <label className="text-sm text-gray-600">Remark</label>
            <textarea
              rows={4}
              className="border rounded w-full p-3"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              className="px-4 py-2 border rounded"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={savePayment}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------
// INPUT COMPONENT
// ----------------------------
function Input({ label, value, setValue }: any) {
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

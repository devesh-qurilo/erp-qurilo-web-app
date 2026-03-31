"use client";

import { X } from "lucide-react";

export default function PaymentViewDrawer({
  payment,
  onClose,
}: {
  payment: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[12000] flex">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="ml-auto w-[83%] h-full bg-white shadow-2xl relative z-10 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Payment Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          <div><b>Project:</b> {payment.project}</div>
          <div><b>Invoice:</b> {payment.invoice}</div>
          <div><b>Client:</b> {payment.client?.name}</div>
          <div><b>Amount:</b> {payment.amount} {payment.currency}</div>
          <div><b>Status:</b> {payment.status}</div>
          <div><b>Paid On:</b> {payment.paidOn}</div>
          <div><b>Gateway:</b> {payment.paymentGateway}</div>
          <div><b>Order #:</b> {payment.orderNumber}</div>
        </div>
      </div>
    </div>
  );
}

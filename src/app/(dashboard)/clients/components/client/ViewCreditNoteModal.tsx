"use client";

import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";


export default function ViewCreditNoteModal({
  open,
  credit,
  onClose,
}: {
  open: boolean;
  credit: any;
  onClose: () => void;
}) {
  if (!open || !credit) return null;

  return (
    // <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
<div className="fixed inset-0 z-50 flex justify-end">

      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-lg"> */}

      <div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Credit Note Details</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 text-sm">
          {/* Credit Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-gray-500">Credit Note #</div>
              <div className="font-medium">
                {credit.creditNoteNumber ?? credit.id ?? "—"}
              </div>
            </div>

            <div>
              <div className="text-gray-500">Credit Date</div>
              <div className="font-medium">


                {credit?.creditDate
                  ? format(new Date(credit.creditDate), "dd-MM-yyyy")
                  : "—"}


              </div>
            </div>

            <div>
              <div className="text-gray-500">Currency</div>
              <div className="font-medium">{credit.currency ?? "USD"}</div>
            </div>
          </div>

          {/* Client & Project */}
          <div className="grid grid-cols-2 gap-6 border-t pt-4">
            <div>
              <div className="text-gray-500">Client</div>
              <div className="font-medium">
                {credit.client?.name ?? "—"}
              </div>
              <div className="text-xs text-gray-500">
                {credit.client?.company?.companyName ?? ""}
              </div>
            </div>

            <div>
              <div className="text-gray-500">Project</div>
              <div className="font-medium">
                {credit.project?.projectName ?? "—"}
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="border rounded-lg p-4 grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500">Invoice Amount</div>
              <div className="font-semibold">
                {credit.invoiceAmount?.toFixed(2) ?? "—"}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Adjustment</div>
              <div className="font-medium">
                {credit.adjustment ?? credit.amount ?? "—"}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Tax</div>
              <div className="font-medium">
                {credit.taxPercent
                  ? `${credit.taxPercent}%`
                  : "—"}
              </div>
            </div>

            <div className="bg-gray-100 rounded flex flex-col justify-center items-center">
              <div className="text-xs text-gray-500">Final Amount</div>
              <div className="text-lg font-bold">
                {credit.finalAmount ?? credit.amount}
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <div className="text-gray-500 mb-1">Note</div>
            <div className="border rounded p-3 bg-gray-50">
              {credit.note ?? "No note"}
            </div>
          </div>

          {/* File */}
          {credit.fileUrl && (
            <div>
              <div className="text-gray-500 mb-1">Attachment</div>
              <a
                href={credit.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 border rounded text-sm"
              >
                <Download className="h-4 w-4" />
                Download File
              </a>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client"
import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type Props = {
  clientName?: string | null
  clientId?: string | number | null
   clientImage?: string | null
  projectCount?: number | null
  totalEarning?: number | null
  unpaidInvoiceCount?: number | null
  totalUnpaidAmount?: number | null
}

const placeholderImg = "/mnt/data/Screenshot 2025-11-25 124734.png"

export const ClientStats: React.FC<Props> = ({clientName, clientId,clientImage, projectCount, totalEarning, unpaidInvoiceCount, totalUnpaidAmount }) => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
    <div className="col-span-1">
      <Card>
        {/* <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={placeholderImg} alt="client" />
            <AvatarFallback>NA</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">Client</div>
            <div className="text-sm text-muted-foreground" />
          </div>
        </CardContent> */}

<CardContent className="flex items-center gap-4">
  <Avatar className="h-16 w-16">
    <AvatarImage
      src={clientImage || placeholderImg}
      alt={clientName || "client"}
    />
    <AvatarFallback>
      {clientName
        ? clientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "NA"}
    </AvatarFallback>
  </Avatar>

  <div>
    <div className="font-medium">
      {clientName || "Unknown Client"}
    </div>
    <div className="text-sm text-muted-foreground">
      {clientId ? `ID: ${clientId}` : "—"}
    </div>
  </div>
</CardContent>



      </Card>
    </div>

    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent>
          <div className="text-sm text-slate-600">Total Projects</div>
          <div className="text-2xl font-semibold text-blue-600 mt-2">{projectCount ?? "—"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="text-sm text-slate-600">Total Earnings</div>
          <div className="text-2xl font-semibold text-blue-600 mt-2">{totalEarning !== null ? totalEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="text-sm text-slate-600">Due Invoices</div>
          <div className="text-2xl font-semibold text-blue-600 mt-2">{unpaidInvoiceCount ?? "—"}</div>
          {totalUnpaidAmount !== null && (
            <div className="text-xs text-muted-foreground mt-1">{totalUnpaidAmount.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 })}</div>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
)

export default ClientStats
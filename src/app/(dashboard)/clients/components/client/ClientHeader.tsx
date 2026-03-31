"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, StickyNote } from "lucide-react"
import Link from "next/link"


type Props = {
    clientName: string
    clientId?: string
    onBack?: () => void
    onOpenTab?: (tab: string) => void
    activeTab?: string
}


export const ClientHeader: React.FC<Props> = ({ clientName, clientId, onBack, onOpenTab, activeTab = "profile" }) => {
    const tabs = [
        { key: "profile", label: "Profile" },
        { key: "projects", label: "Projects" },
        { key: "invoices", label: "Invoices" },
        { key: "creditnotes", label: "Credit Notes " },
        { key: "payments", label: "Payments" },
        { key: "documents", label: "Documents" },
        { key: "notes", label: "Notes" },
    ]


    return (
        <div className="mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold">{clientName}</h1>
                    <p className="text-sm text-muted-foreground">Client ID: {clientId}</p>
                </div>


                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="hidden sm:inline-flex items-center gap-2" onClick={onBack}>
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Clients
                    </Button>


                </div>
            </div>


            <div className="mt-6 border-b">
                <nav className="flex gap-6 text-sm text-slate-600">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => onOpenTab?.(t.key)}
                            className={`pb-3 ${activeTab === t.key ? "border-b-2 border-primary text-primary font-medium" : ""}`}>
                            {t.label}
                        </button>



                    ))}
                </nav>
            </div>
        </div>
    )
}


export default ClientHeader
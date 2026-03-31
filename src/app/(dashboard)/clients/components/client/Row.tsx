"use client"
import React from "react"


export const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
<div className="flex items-start gap-6 py-2 border-b border-transparent last:border-b-0">
<div className="w-40 text-sm text-slate-600">{label}</div>
<div className="text-sm text-slate-800">{value ?? "—"}</div>
</div>
)


export default Row
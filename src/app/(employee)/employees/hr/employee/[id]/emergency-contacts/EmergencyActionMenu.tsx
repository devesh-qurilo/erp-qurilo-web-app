"use client"

import { useState } from "react"

type Props = {
    onView: () => void
    onEdit: () => void
    onDelete: () => void
}

export default function EmergencyActionMenu({
    onView,
    onEdit,
    onDelete,
}: Props) {
    const [open, setOpen] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((p) => !p)}
                className="px-2 py-1 text-gray-600 hover:text-black"
            >
                ⋮
            </button>

            {open && (
                <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow z-10">
                    <button
                        onClick={() => {
                            onView()
                            setOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                        View
                    </button>
                    <button
                        onClick={() => {
                            onEdit()
                            setOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            onDelete()
                            setOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}

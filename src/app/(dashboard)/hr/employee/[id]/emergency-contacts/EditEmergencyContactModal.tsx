"use client"

import { useEffect, useState } from "react"

export default function EditEmergencyContactModal({
    open,
    onClose,
    contact,
    employeeId,
    onSuccess,
}: any) {
    const [form, setForm] = useState({
        name: "",
        mobile: "",
        address: "",
        relationship: "",
    })

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (contact) {
            setForm({
                name: contact.name ?? "",
                mobile: contact.mobile ?? "",
                address: contact.address ?? "",
                relationship: contact.relationship ?? "",
            })
        }
    }, [contact])

    if (!open || !form) return null

    const handleSubmit = async () => {
        setLoading(true)
        const token = localStorage.getItem("accessToken")

        await fetch(
            `/employee/${employeeId}/emergency-contacts/${contact.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            }
        )

        setLoading(false)
        onSuccess()
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Edit Emergency Contact</h2>

                {["name", "mobile", "relationship", "address"].map((field) => (
                    <input
                        key={field}
                        className="border rounded px-3 py-2 w-full"
                        placeholder={field}
                        value={form[field as keyof typeof form]}
                        onChange={(e) =>
                            setForm({ ...form, [field]: e.target.value })
                        }
                    />
                ))}

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        {loading ? "Saving..." : "Update"}
                    </button>
                </div>
            </div>
        </div>
    )
}

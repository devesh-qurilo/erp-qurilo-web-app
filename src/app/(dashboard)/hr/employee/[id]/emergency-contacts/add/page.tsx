"use client"

import { useState } from "react"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

type Props = {
  open: boolean
  onClose: () => void
  employeeId: string
  onSuccess: () => void
}

export default function AddEmergencyContactModal({
  open,
  onClose,
  employeeId,
  onSuccess,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    relationship: "",
    address: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async () => {
    if (!form.name || !form.email || !form.mobile || !form.relationship) {
      setError("All required fields must be filled")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("accessToken")
      if (!token) throw new Error("Unauthorized")

      const res = await fetch(
        `${BASE_URL}/employee/${employeeId}/emergency-contacts`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      )

      if (!res.ok) throw new Error("Failed to create contact")

      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add Emergency Contact</h2>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Name *"
            className="border rounded px-3 py-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Relationship *"
            className="border rounded px-3 py-2"
            value={form.relationship}
            onChange={(e) =>
              setForm({ ...form, relationship: e.target.value })
            }
          />
          <input
            placeholder="Email *"
            className="border rounded px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Mobile *"
            className="border rounded px-3 py-2"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
        </div>

        <textarea
          placeholder="Address"
          className="border rounded px-3 py-2 w-full min-h-[80px]"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

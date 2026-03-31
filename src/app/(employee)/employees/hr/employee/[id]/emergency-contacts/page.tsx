
"use client"

import useSWR from "swr"
import { MoreVertical } from "lucide-react"
import { useState } from "react"
import AddEmergencyContactModal from "./add/page"
import { mutate } from "swr"
import EmergencyActionMenu from "./EmergencyActionMenu"
import EditEmergencyContactModal from "./EditEmergencyContactModal"
import ViewEmergencyContactModal from "./ViewEmergencyContactModal"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

interface EmergencyContact {
  id: number
  name: string
  email: string
  mobile: string
  relationship: string
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem("accessToken")
  if (!token) throw new Error("No token")

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Failed to fetch emergency contacts")
  return res.json()
}

export default function EmergencyTab({
  employeeId,
}: {
  employeeId: string
}) {
  const [viewContact, setViewContact] = useState<EmergencyContact | null>(null)
  const [editContact, setEditContact] = useState<EmergencyContact | null>(null)


  const [openAdd, setOpenAdd] = useState(false)
  const { data, isLoading, error } = useSWR<EmergencyContact[]>(
    `${BASE_URL}/employee/${employeeId}/emergency-contacts`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const deleteContact = async (id: number) => {
    // if (!confirm("Delete this emergency contact?")) return

    const token = localStorage.getItem("accessToken")
    await fetch(`${BASE_URL}/employee/${employeeId}/emergency-contacts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })

    mutate(`${BASE_URL}/employee/${employeeId}/emergency-contacts`)
  }


  return (
    <div className="bg-white border rounded-xl p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpenAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          + Create New 
        </button>

        <AddEmergencyContactModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          employeeId={employeeId}
          onSuccess={() =>
            mutate(`${BASE_URL}/employee/${employeeId}/emergency-contacts`)
          }
        />

      </div>

      {/* TABLE */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Mobile</th>
              <th className="px-4 py-3 text-left font-medium">Relationship</th>
              <th className="px-4 py-3 text-center font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Loading emergency contacts…
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-red-500">
                  Failed to load emergency contacts
                </td>
              </tr>
            )}

            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No emergency contacts found
                </td>
              </tr>
            )}

            {data?.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.mobile}</td>
                <td className="px-4 py-3">{c.relationship}</td>
                <td className="px-4 py-3 text-center">
                  {/* <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button> */}
                  <EmergencyActionMenu
                    onView={() => setViewContact(c)}
                    onEdit={() => setEditContact(c)}
                    onDelete={() => deleteContact(c.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ViewEmergencyContactModal
        open={!!viewContact}
        contact={viewContact}
        onClose={() => setViewContact(null)}
      />

      <EditEmergencyContactModal
        open={!!editContact}
        contact={editContact}
        employeeId={employeeId}
        onClose={() => setEditContact(null)}
        onSuccess={() =>
          mutate(`${BASE_URL}/employee/${employeeId}/emergency-contacts`)
        }
      />

    </div>
  )
}

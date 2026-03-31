

"use client"

import useSWR from "swr"
import { useState } from "react"
import AddPromotionModal from "./AddPromotionModal"
import { MoreVertical } from "lucide-react"
import { format } from "date-fns"

const BASE_URL = process.env.NEXT_PUBLIC_MAIN

interface Promotion {
  id: number
  oldDepartmentName: string
  oldDesignationName: string
  newDepartmentName: string
  newDesignationName: string
  isPromotion: boolean
  remarks: string
  createdAt: string
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem("accessToken")
  if (!token) throw new Error("No token")

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Failed to fetch promotions")
  return res.json()
}

export default function PromotionsTab({ employeeId }: { employeeId: string }) {
  const [openAdd, setOpenAdd] = useState(false)

  const { data, isLoading, error, mutate } = useSWR<Promotion[]>(
    `${BASE_URL}/admin/api/promotions/employee/${employeeId}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <div className="bg-white border rounded-xl p-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between">
        <button
          onClick={() => setOpenAdd(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          + Add Promotions
        </button>
      </div>

      <AddPromotionModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        employeeId={employeeId}
        onSuccess={mutate}
      />

      {/* CONTENT */}
      {isLoading && <div className="text-sm text-gray-500">Loading promotions…</div>}
      {error && <div className="text-sm text-red-500">Failed to load promotions</div>}

      {!isLoading && data?.length === 0 && (
        <div className="text-sm text-gray-500">No promotions found</div>
      )}

      <div className="space-y-4">
        {data?.map((p, index) => (
          <div
            key={p.id}
            className="border rounded-lg p-4 flex justify-between items-start"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                  {index + 1}
                </span>
                <span>
                  {
                  // new Date(p.createdAt).toLocaleDateString()
                  format(  new Date(p.createdAt), "dd-MM-yyyy")
                  } ( Promotion From Today )
                </span>
              </div>

              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                Promotion
              </span>

              <div className="text-sm">
                <span className="text-blue-600">
                  {p.oldDesignationName}
                </span>{" "}
                →{" "}
                <span className="text-green-600">
                  {p.newDesignationName}
                </span>{" "}
                <span className="text-gray-500">(Designation)</span>
              </div>

              <div className="text-sm">
                <span className="text-blue-600">
                  {p.oldDepartmentName}
                </span>{" "}
                →{" "}
                <span className="text-green-600">
                  {p.newDepartmentName}
                </span>
              </div>

              {p.remarks && (
                <div className="text-xs text-gray-500">
                  {p.remarks}
                </div>
              )}
            </div>

            {/* <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button> */}
          </div>
        ))}
      </div>
    </div>
  )
}

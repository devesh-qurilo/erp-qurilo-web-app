// "use client"

// import Link from "next/link"
// import { useParams, usePathname } from "next/navigation"
// import useSWR from "swr"

// interface Employee {
//   employeeId: string
//   name: string
//   email: string
//   profilePictureUrl: string | null
//   role: string
//   active: boolean
//   departmentName: string | null
//   designationName: string | null
// }

// interface EmergencyContact {
//   id: number
//   name: string
//   email: string
//   mobile: string
//   relationship: string
//   address: string
//   employeeId: string
// }

// const authedFetcher = async (url: string) => {
//   const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
//   if (!token) {
//     const err = new Error("No access token found")
//     ;(err as any).status = 401
//     throw err
//   }
//   const res = await fetch(url, {
//     headers: { Authorization: `Bearer ${token}` },
//   })
//   if (!res.ok) {
//     const text = await res.text()
//     throw new Error(text || "Failed to fetch")
//   }
//   return res.json()
// }

// export default function EmployeeEmergencyContactsPage() {
//   const params = useParams<{ id: string }>()
//   const id = params?.id
//   const pathname = usePathname()

//   // fetch employee to render consistent header
//   const { data: employee, error: empError } = useSWR<Employee>(id ? `/api/hr/employee/${id}` : null, authedFetcher, {
//     revalidateOnFocus: false,
//   })

//   // fetch emergency contacts
//   const {
//     data: contacts,
//     error: contactsError,
//     isLoading,
//   } = useSWR<EmergencyContact[]>(id ? `/api/hr/employee/${id}/emergency-contacts` : null, authedFetcher, {
//     revalidateOnFocus: false,
//   })

//   const tabs = [
//     { id: "profile", label: "Profile", href: `/hr/employee/${id}` },
//     { id: "emergency", label: "Emergency Contact", href: `/hr/employee/${id}/emergency-contacts` },
//     { id: "promotions", label: "Promotions", href: `/hr/employee/${id}/promotions` },
//   ]

//   return (
//     <main className="container mx-auto p-4">
//       <div className="mb-4 flex items-center justify-between">
//         <Link href="/hr/employee" className="text-sm text-primary underline">
//           ← Back to Employees
//         </Link>
//         <Link 
//           href={`/hr/employee/${id}/emergency-contacts/add`} 
//           className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
//         >
//           Add Emergency Contact
//         </Link>
//       </div>

//       <section className="rounded-lg border border-border bg-card p-4">
//         {/* Header (uses employee when available) */}
//         <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
//           <div className="flex items-center gap-4">
//             <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-muted">
//               {employee?.profilePictureUrl ? (
//                 <img
//                   src={employee.profilePictureUrl}
//                   alt={`${employee.name} avatar`}
//                   className="h-full w-full object-cover"
//                   crossOrigin="anonymous"
//                 />
//               ) : (
//                 <img src="/placeholder.svg" alt="" className="h-full w-full object-cover" />
//               )}
//             </div>
//             <div>
//               <h1 className="text-xl font-semibold">{employee?.name ?? `Employee ${id}`}</h1>
//               <div className="text-muted-foreground">{employee?.email ?? ""}</div>
//               <div className="text-xs text-muted-foreground">{id}</div>
//             </div>
//           </div>
//           {employee && (
//             <div className="flex items-center gap-2">
//               <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
//                 {employee.role?.replace(/^ROLE_/, "")}
//               </span>
//               {employee.active ? (
//                 <span className="inline-flex items-center rounded-full bg-green-600/15 px-2 py-1 text-xs text-green-700 dark:text-green-400">
//                   Active
//                 </span>
//               ) : (
//                 <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-1 text-xs text-destructive-foreground">
//                   Inactive
//                 </span>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Tabs */}
//         <div className="mt-6 flex border-b border-border">
//           {tabs.map((tab) => {
//             const isActive = pathname === tab.href
//             return (
//               <Link
//                 key={tab.id}
//                 href={tab.href}
//                 className={`px-4 py-2 -mb-px text-sm font-medium ${
//                   isActive ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-primary"
//                 }`}
//               >
//                 {tab.label}
//               </Link>
//             )
//           })}
//         </div>

//         {/* Emergency Contacts content */}
//         <div className="mt-6">
//           {isLoading && <div>Loading emergency contacts…</div>}
//           {contactsError && (
//             <div className="text-destructive">
//               Error: {contactsError instanceof Error ? contactsError.message : "Unable to load contacts"}
//             </div>
//           )}
//           {!isLoading && !contactsError && (!contacts || contacts.length === 0) && (
//             <div className="text-muted-foreground">No emergency contacts found.</div>
//           )}
//           {contacts && contacts.length > 0 && (
//             <div className="overflow-x-auto rounded-md border border-border">
//               <table className="min-w-full bg-card text-sm">
//                 <thead className="bg-muted">
//                   <tr>
//                     <th className="py-2 px-4 text-left">Name</th>
//                     <th className="py-2 px-4 text-left">Relationship</th>
//                     <th className="py-2 px-4 text-left">Email</th>
//                     <th className="py-2 px-4 text-left">Mobile</th>
//                     <th className="py-2 px-4 text-left">Address</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {contacts.map((c) => (
//                     <tr key={c.id} className="border-t border-border">
//                       <td className="py-3 px-4">{c.name}</td>
//                       <td className="py-3 px-4">{c.relationship}</td>
//                       <td className="py-3 px-4">{c.email}</td>
//                       <td className="py-3 px-4">{c.mobile}</td>
//                       <td className="py-3 px-4">{c.address}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </section>
//     </main>
//   )
// }





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

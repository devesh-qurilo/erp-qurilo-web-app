
"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface EmployeeItem {
  employeeId: string
  name: string
  email?: string | null
  profilePictureUrl?: string | null
  designationName?: string | null
  departmentName?: string | null
}

interface ChatRoom {
  id: string
  participant1Id: string
  participant2Id: string
  participant1Details: {
    employeeId: string
    name: string
    profileUrl: string | null
    designation: string | null
    department: string | null
  }
  participant2Details: {
    employeeId: string
    name: string
    profileUrl: string | null
    designation: string | null
    department: string | null
  }
  lastMessage?: {
    content: string | null
    messageType: "TEXT" | "FILE"
    fileAttachment?: {
      fileName: string
      fileUrl: string
    } | null
    createdAt: string
  }
  unreadCount: number
}

interface CurrentUser {
  employeeId: string
}

/**
 * Props:
 * - employees?: array from parent (e.g. MessagesLayout)
 * - loading?: parent loading state (optional override)
 * - error?: parent error string (optional override)
 * - search?: string (parent search term). If provided and employees[] exists, component
 *            will show matching employees as search results.
 */
export default function ChatRoomsList({
  employees: employeesFromParent,
  loading: loadingFromParent,
  error: errorFromParent,
  search: searchFromParent,
}: {
  employees?: EmployeeItem[] // optional list coming from parent API
  loading?: boolean
  error?: string | null
  search?: string
}) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pathname = usePathname()
  const selectedIdFromPath = pathname?.split("/").pop() ?? ""

  // Prefer parent-provided loading/error when present
  const effectiveLoading = typeof loadingFromParent === "boolean" ? loadingFromParent : loading
  const effectiveError = typeof errorFromParent !== "undefined" ? errorFromParent : error
  const searchTerm = (searchFromParent ?? "").trim()

  // fetch profile + rooms only when parent didn't give an employees[] prop and we need rooms
  useEffect(() => {
    // If parent passed employees and likely controls search, we can still fetch rooms/profile
    // so chat list is available below the search results. But it's optional — if you want to skip fetch when parent provides everything, you can early-return.
    const fetchRooms = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
        const headers: HeadersInit = {}
        if (token) headers["Authorization"] = `Bearer ${token}`

        // Attempt to fetch profile and rooms; if these endpoints are proxied via /api in your Next app,
        // they should work in dev and production.
        const [profileRes, roomsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/me`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/chat/rooms`, { headers, cache: "no-store" })
        ])

        if (!profileRes.ok) {
          // don't throw — surface friendly message
          throw new Error(`Failed to fetch profile (${profileRes.status})`)
        }
        if (!roomsRes.ok) {
          throw new Error(`Failed to fetch chat rooms (${roomsRes.status})`)
        }

        const profileData = await profileRes.json()
        setCurrentUser({ employeeId: profileData.employeeId })

        const roomsData = await roomsRes.json()
        setRooms(Array.isArray(roomsData) ? roomsData : [])
      } catch (err: any) {
        setError(err?.message || "An error occurred while loading chats")
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [])

  // If parent passed employees and we have a searchTerm, compute filtered employees
  const filteredEmployees = useMemo(() => {
    if (!employeesFromParent || !searchTerm) return []
    const q = searchTerm.toLowerCase()
    return employeesFromParent.filter((emp) =>
      `${emp.name ?? ""} ${emp.email ?? ""} ${emp.employeeId ?? ""}`
        .toLowerCase()
        .includes(q)
    )
  }, [employeesFromParent, searchTerm])

  const formatRelative = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const min = Math.floor(diff / 60000)
    const hr = Math.floor(min / 60)
    const day = Math.floor(hr / 24)
    if (day >= 1) return `${day}d ago`
    if (hr >= 1) return `${hr}h ago`
    if (min >= 1) return `${min}m ago`
    return "just now"
  }

  // Render helper: user row (used for employee-search results and rooms partner)
  const UserRow = ({
    employeeId,
    name,
    profileUrl,
    smallText,
    isSelected,
  }: {
    employeeId: string
    name: string
    profileUrl?: string | null
    smallText?: string | null
    isSelected?: boolean
  }) => {
    return (
      <Link
        href={`/messages/${employeeId}`}
        key={employeeId}
        className="block"
        aria-label={`Open chat with ${name}`}
      >
        <div
          className={
            "flex items-center gap-3 p-3 rounded-2xl border " +
            (isSelected
              ? "bg-blue-100 border-blue-200 shadow-sm"
              : "bg-white border-gray-200 hover:shadow-sm")
          }
        >
          <div className="flex-none">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <Image
                src={profileUrl || "/placeholder.svg?height=48&width=48&query=User%20avatar"}
                alt={name}
                width={48}
                height={48}
                className="object-cover rounded-full"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 truncate">{name}</h3>
                {smallText ? (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 truncate">{smallText}</p>
                ) : null}
              </div>

              <div className="flex flex-col items-end ml-3">
                {/* For search results we don't show relative time */}
                <span className="text-xs text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Loading / error / no results handling
  if (effectiveLoading) return <p className="text-center text-muted-foreground">Loading chats...</p>
  if (effectiveError) return <p className="text-center text-destructive">{effectiveError}</p>
  if (!currentUser && rooms.length === 0 && !employeesFromParent) return <p className="text-center text-muted-foreground">Unable to load user profile.</p>

  return (
    <aside className="w-full max-w-[340px] p-4">
      {/* If a parent search term is present and parent provided employees => show employee search results */}
      {searchTerm && employeesFromParent ? (
        <div className="space-y-3">
          {filteredEmployees.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No employees match “{searchTerm}”.</p>
          ) : (
            filteredEmployees.map((emp) => (
              <UserRow
                key={emp.employeeId}
                employeeId={emp.employeeId}
                name={emp.name}
                profileUrl={emp.profilePictureUrl ?? undefined}
                smallText={emp.designationName ?? emp.departmentName ?? emp.email ?? ""}
                isSelected={emp.employeeId === selectedIdFromPath}
              />
            ))
          )}
        </div>
      ) : (
        // Default: render chat rooms list (original behaviour)
        <div className="space-y-3">
          {rooms.map((room) => {
            const partner =
              room.participant1Details.employeeId === currentUser?.employeeId
                ? room.participant2Details
                : room.participant1Details

            const isSelected = partner.employeeId === selectedIdFromPath

            const lastText =
              room.lastMessage?.messageType === "FILE"
                ? `📎 ${room.lastMessage.fileAttachment?.fileName ?? "Attachment"}`
                : room.lastMessage?.content ?? "No messages yet"

            return (
              <Link
                key={room.id}
                href={`/messages/${partner.employeeId}`}
                className="block"
                aria-label={`Open chat with ${partner.name}`}
              >
                <div
                  className={
                    "flex items-center gap-3 p-3 rounded-2xl border " +
                    (isSelected
                      ? "bg-blue-100 border-blue-200 shadow-sm"
                      : "bg-white border-gray-200 hover:shadow-sm")
                  }
                >
                  <div className="flex-none">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      <Image
                        src={partner.profileUrl || "/placeholder.svg?height=48&width=48&query=User%20avatar"}
                        alt={partner.name}
                        width={48}
                        height={48}
                        className="object-cover rounded-full"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800 truncate">{partner.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 truncate">{lastText}</p>
                      </div>

                      <div className="flex flex-col items-end ml-3">
                        <span className="text-xs text-gray-400">{formatRelative(room.lastMessage?.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </aside>
  )
}

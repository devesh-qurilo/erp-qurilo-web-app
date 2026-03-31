"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type NotificationType = "CHAT_MESSAGE" | "APPRECIATION" | "LEAVE_APPLICATION" | "LEAVE_QUOTA"

type Notification = {
  id: number
  senderEmployeeId: string | null
  receiverEmployeeId: string
  title: string
  message: string
  type: NotificationType
  readFlag: boolean
  createdAt: string
  readAt: string | null
}

// Fetcher now accepts headers via SWR key tuple
const fetcher = async ([url, token]: [string, string | null]) => {
  if (!token) throw new Error("Unauthorized: Missing access token")

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`Failed to load: ${res.status}`)
  }

  return res.json()
}

function typeToBadgeVariant(t: NotificationType): "secondary" | "outline" {
  switch (t) {
    case "APPRECIATION":
      return "secondary"
    case "LEAVE_APPLICATION":
    case "LEAVE_QUOTA":
      return "outline"
    case "CHAT_MESSAGE":
    default:
      return "secondary"
  }
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function NotificationsPage() {
  const [token, setToken] = useState<string | null>(null)

  // ✅ Ensure localStorage is accessed only on client
  useEffect(() => {
    const t = localStorage.getItem("accessToken")
    setToken(t)
  }, [])

  const { data, error, isLoading } = useSWR<Notification[]>(
    token ? ["/api/notifications", token] : null,
    fetcher,
    {
      refreshInterval: 60_000, // auto-refresh every minute
      revalidateOnFocus: true,
    }
  )

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-pretty text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Your latest updates and messages</p>
      </header>

      {/* Loading skeletons */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-48 rounded-md bg-muted animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
                <div className="h-4 w-2/3 rounded-md bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Unable to load notifications</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {String(error?.message ?? "An error occurred")}
          </CardContent>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No notifications </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">You’re all caught up.</CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4">
          {data.map((n) => (
            <li key={n.id}>
              <Card className={cn("transition-colors", !n.readFlag ? "border-primary/40" : "")}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{n.title}</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(n.createdAt)}
                      {n.senderEmployeeId ? ` • From ${n.senderEmployeeId}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={typeToBadgeVariant(n.type)}>{n.type}</Badge>
                    {!n.readFlag && (
                      <span
                        aria-label="Unread"
                        title="Unread"
                        className="inline-block h-2 w-2 rounded-full bg-primary"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-pretty">{n.message}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

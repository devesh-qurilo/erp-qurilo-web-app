
"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CommonNavbar } from "@/components/Navbar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  const audioRef = useRef<HTMLAudioElement | null>(null)
  

  // 🔓 Unlock audio on first click anywhere in dashboard
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            audioRef.current?.pause()
            audioRef.current.currentTime = 0
          })
          .catch(() => {})
      }

      document.removeEventListener("click", unlockAudio)
    }

    document.addEventListener("click", unlockAudio)

    return () => {
      document.removeEventListener("click", unlockAudio)
    }
  }, [])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">

        <AppSidebar />

        <SidebarInset>

          <CommonNavbar />

          <main className="flex-1 p-6 pt-20">
            {children}
          </main>

        </SidebarInset>

        {/* 🔊 Hidden global audio element */}
        <audio
          ref={audioRef}
          src="/sounds/notificationSound.wav"
          preload="auto"
        />

      </div>
    </SidebarProvider>
  )
}
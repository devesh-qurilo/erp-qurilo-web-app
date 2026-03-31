


"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import useSWR from "swr"

import EmployeeHeader from "./components/EmployeeHeader"
import EmployeeStats from "./components/EmployeeStats"
import ProfileInfoCard from "./components/ProfileInfoCard"
import AboutCard from "./components/AboutCard"
import EmployeeTabs from "./components/EmployeeTabs"

import WorkTab from "./work/page"
import DocumentsTab from "./Documents/page"
import EmergencyTab from "./emergency-contacts/page"
import PromotionsTab from "./promotions/page"
import AppreciationsTable from "./components/AppreciationsTable"
import AttendanceCalendar from "./components/AttendanceCalendar"
import LeaveQuotaTable from "./components/LeaveQuotaTable"
import EmployeeLeaveTable from "./components/EmployeeLeaveTable"
import EmployeeWorkTab from "./work/page"

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";



const BASE_URL = process.env.NEXT_PUBLIC_MAIN

type TabKey = "profile" | "work" | "documents" | "emergency" | "promotions"

const fetcher = async (url: string) => {
  const token = localStorage.getItem("accessToken")
  if (!token) throw new Error("No token")

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Failed to fetch employee")
  return res.json()
}

export default function EmployeeViewPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<TabKey>("profile")

  const { data: employee, isLoading, error } = useSWR(
    id ? `${BASE_URL}/employee/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  //("gggggggggg", employee)

  // if (isLoading) return <div className="p-6">Loading employee…</div>
  if (error) return <div className="p-6 text-red-600">Failed to load employee</div>
  // if (!employee) return <div className="p-6">Employee not found</div>

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* 🔹 PAGE TITLE */}
      {/* <h1 className="text-2xl font-semibold">{employee.name}</h1> */}


      {isLoading ? (
  <Skeleton width={200} height={30} />
) : (
  <h1 className="text-2xl font-semibold">{employee.name}</h1>
)}

      {/* 🔹 TABS (ALWAYS FIXED) */}
      <EmployeeTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* ================= PROFILE TAB ================= */}
      {activeTab === "profile" && (
        <>
          {/* 🔹 HEADER + STATS */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 border ">
              <EmployeeHeader employee={employee} />
            </div>
            <div className="lg:col-span-3">
              <EmployeeStats employeeId={employee} />
            </div>
          </div> */}


<div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
  {isLoading ? (
    <>
      {/* Header */}
      <div className="lg:col-span-2 border p-4 space-y-3">
        <Skeleton circle width={60} height={60} />
        <Skeleton width={150} />
        <Skeleton width={100} />
      </div>

      {/* Stats */}
      <div className="lg:col-span-3 space-y-3">
        <Skeleton height={80} />
      </div>
    </>
  ) : (
    <>
      <div className="lg:col-span-2 border">
        <EmployeeHeader employee={employee} />
      </div>
      <div className="lg:col-span-3">
        <EmployeeStats employeeId={employee} />
      </div>
    </>
  )}
</div>



          {/* 🔹 PROFILE MAIN CONTENT */}
        
          {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ProfileInfoCard employee={employee} />
            </div>

            <div className="space-y-4">
              <AboutCard about={employee.about} />
              <AppreciationsTable employeeId={employee.employeeId} />
            </div>
          </div> */}



<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  {isLoading ? (
    <>
      {/* LEFT */}
      <div className="lg:col-span-2 space-y-3">
        <Skeleton height={150} />
      </div>

      {/* RIGHT */}
      <div className="space-y-4">
        <Skeleton height={80} />
        <Skeleton height={120} />
      </div>
    </>
  ) : (
    <>
      <div className="lg:col-span-2">
        <ProfileInfoCard employee={employee} />
      </div>

      <div className="space-y-4">
        <AboutCard about={employee.about} />
        <AppreciationsTable employeeId={employee.employeeId} />
      </div>
    </>
  )}
</div>


          {/* 🔹 ATTENDANCE (NEXT STEP) */}

          {/* <AttendanceCalendar employeeId={employee.employeeId} />
          <LeaveQuotaTable employeeId={employee.employeeId} />
          <EmployeeLeaveTable employeeId={employee.employeeId} /> */}


{isLoading ? (
  <div className="space-y-4">
    <Skeleton height={200} />
    <Skeleton height={120} />
    <Skeleton height={150} />
  </div>
) : (
  <>
    <AttendanceCalendar employeeId={employee.employeeId} />
    <LeaveQuotaTable employeeId={employee.employeeId} />
    <EmployeeLeaveTable employeeId={employee.employeeId} />
  </>
)}



          {/* 🔹 LEAVES QUOTA */}
          {/* <LeaveQuota employeeId={employee.employeeId} /> */}

          {/* 🔹 LEAVES LIST */}
          {/* <LeaveList employeeId={employee.employeeId} /> */}
        </>
      )}

      {/* ================= OTHER TABS ================= */}
      {/* {activeTab === "work" && <EmployeeWorkTab employeeId={employee.employeeId} />}
      {activeTab === "documents" && <DocumentsTab employeeId={employee.employeeId} />}
      {activeTab === "emergency" && <EmergencyTab employeeId={employee.employeeId} />}
      {activeTab === "promotions" && <PromotionsTab employeeId={employee.employeeId} />} */}



{activeTab === "work" &&
  (isLoading ? <Skeleton height={200} /> : <EmployeeWorkTab employeeId={employee.employeeId} />)}

{activeTab === "documents" &&
  (isLoading ? <Skeleton height={200} /> : <DocumentsTab employeeId={employee.employeeId} />)}

{activeTab === "emergency" &&
  (isLoading ? <Skeleton height={200} /> : <EmergencyTab employeeId={employee.employeeId} />)}

{activeTab === "promotions" &&
  (isLoading ? <Skeleton height={200} /> : <PromotionsTab employeeId={employee.employeeId} />)}


    </div>
  )
}
